import { supabase } from '../supabase';
import type { Media, DevelopmentDomain } from '../../types';
import { dispatchDataChangedEvent } from './common';
import { v4 as uuidv4 } from 'uuid';

// Çocuğa ait tüm medyaları getir
export const getMediaForChild = async (childId: string) => {
  const { data, error } = await supabase
    .from('media')
    .select('*')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Media[];
};

// Yeni medya kaydı ekle (storage yükleme ayrı yapılmalı)
export const addMediaRecord = async (
  media: Omit<Media, 'id' | 'user_id' | 'created_at'>,
  userId: string
) => {
  const { data, error } = await supabase
    .from('media')
    .insert({ ...media, user_id: userId })
    .select();
  if (error) throw error;
  dispatchDataChangedEvent();
  return data[0] as Media;
};

// Medya sil (hem storage hem veritabanı)
export const deleteMedia = async (mediaItem: Media) => {
  // 1. Storage'dan sil
  const { error: storageError } = await supabase.storage
    .from('child-media')
    .remove([mediaItem.storage_path]);

  // Storage silme hatasını loglayalım ama devam edelim (dosya zaten silinmiş olabilir)
  if (storageError) {
    console.error(
      `Storage silme başarısız: "${mediaItem.storage_path}", veritabanı kaydı silinmeye devam ediliyor.Hata: `,
      storageError.message
    );
  }

  // 2. Veritabanından sil (kritik adım)
  const { error: dbError } = await supabase.from('media').delete().eq('id', mediaItem.id);
  if (dbError) throw dbError;

  dispatchDataChangedEvent();
};

// Private medya için signed URL al
export const getSignedUrlForMedia = async (
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('child-media')
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
};

// Medya yükleme (resim optimizasyonu ile)
export const uploadMedia = async (
  userId: string,
  childId: string,
  file: File
): Promise<string> => {
  const { processImage } = await import('../../utils/helpers');
  const processedFile = await processImage(file);

  const extFromType = processedFile.type?.split('/')[1] || '';
  const extFromName = processedFile.name.includes('.') ? processedFile.name.split('.').pop() : '';
  const ext = (extFromType || extFromName || 'jpg').toLowerCase();
  const fileName = `${userId} /${childId}/${uuidv4()}.${ext} `;

  const { data, error } = await supabase.storage.from('child-media').upload(fileName, processedFile, {
    cacheControl: '3600',
    upsert: true,
    contentType: processedFile.type || 'image/jpeg',
  });

  if (error) throw error;
  return data.path;
};

// Edge Function ile medya yükle (RLS bypass için)
export const uploadMediaViaFunction = async (
  childId: string,
  file: File,
  fields: { name: string; description?: string; domain?: DevelopmentDomain }
): Promise<{ path: string; mediaId?: string }> => {
  // Dosyayı base64'e çevir
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const payload = {
    childId,
    name: fields.name,
    description: fields.description,
    domain: fields.domain,
    fileName: file.name,
    fileType: file.type,
    data: dataUrl,
  };

  const { data, error } = await supabase.functions.invoke('media_upload', {
    body: payload,
  });

  if (error) throw new Error(error.message || 'Upload failed');
  return { path: (data as any)?.path, mediaId: (data as any)?.media?.id };
};

// Edge Function ile medya güncelle
export const updateMediaViaFunction = async (
  mediaId: string,
  childId: string,
  fields: { name?: string; description?: string; domain?: DevelopmentDomain; file?: File }
): Promise<{ path: string }> => {
  let dataUrl: string | undefined;
  let fileType: string | undefined;
  let fileName: string | undefined;

  if (fields.file) {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fields.file as File);
    });
    fileType = fields.file.type;
    fileName = fields.file.name;
  }

  const payload: any = {
    mediaId,
    childId,
    name: fields.name,
    description: fields.description,
    domain: fields.domain,
  };

  if (dataUrl) Object.assign(payload, { data: dataUrl, fileType, fileName });

  const { data, error } = await supabase.functions.invoke('media_update', { body: payload });
  if (error) throw new Error(error.message || 'Update failed');
  return { path: (data as any)?.path };
};

// Toggle media sharing with family
export const toggleMediaSharing = async (mediaId: string, shared: boolean) => {
  const { error } = await supabase
    .from('media')
    .update({ shared_with_family: shared })
    .eq('id', mediaId);
  if (error) throw error;
  dispatchDataChangedEvent();
};

// Get shared media for family users
export const getFamilySharedMedia = async () => {
  const { data, error } = await supabase.rpc('get_family_shared_media');
  if (error) throw error;
  return data as Array<{
    id: string;
    child_id: string;
    child_name: string;
    name: string;
    description: string;
    domain: string;
    storage_path: string;
    created_at: string;
  }>;
};

// === FAMILY MEDIA FUNCTIONS ===

// File size limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB (~25-40 seconds 1080p)

// Validate file size based on type
export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const maxSizeMB = isVideo ? 20 : 5;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Dosya çok büyük. Maksimum ${isVideo ? 'video' : 'fotoğraf'} boyutu: ${maxSizeMB}MB`
    };
  }

  // Validate file type
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const validVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'];
  const validTypes = [...validImageTypes, ...validVideoTypes];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Desteklenmeyen dosya formatı. JPEG, PNG, MP4, MOV, WebM kullanın.'
    };
  }

  return { valid: true };
};

// Family can add media for their linked child
export const addFamilyMedia = async (
  childId: string,
  file: File,
  fields: { name: string; description?: string }
): Promise<{ path: string; mediaId?: string }> => {
  // Validate file
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Process image if needed
  let processedFile = file;
  if (file.type.startsWith('image/')) {
    const { processImage } = await import('../../utils/helpers');
    processedFile = await processImage(file);
  }

  // Upload to storage
  const extFromType = processedFile.type?.split('/')[1] || '';
  const extFromName = processedFile.name.includes('.') ? processedFile.name.split('.').pop() : '';
  const ext = (extFromType || extFromName || 'jpg').toLowerCase();
  const fileName = `family/${user.id}/${childId}/${uuidv4()}.${ext}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from('child-media')
    .upload(fileName, processedFile, {
      cacheControl: '3600',
      upsert: true,
      contentType: processedFile.type || 'application/octet-stream',
    });

  if (storageError) throw storageError;

  // Create media record
  const { data, error } = await supabase
    .from('media')
    .insert({
      child_id: childId,
      user_id: user.id,
      type: file.type.startsWith('video/') ? 'video' : 'image',
      storage_path: storageData.path,
      name: fields.name,
      description: fields.description,
      added_by: 'family'
    })
    .select();

  if (error) throw error;
  dispatchDataChangedEvent();
  return { path: storageData.path, mediaId: data[0]?.id };
};

// Teacher can get family-added media for a child
export const getFamilyAddedMedia = async (childId: string) => {
  const { data, error } = await supabase.rpc('get_family_media', {
    p_child_id: childId
  });

  if (error) throw error;
  return data as Array<{
    id: string;
    child_id: string;
    user_id: string;
    name: string;
    description: string;
    type: string;
    storage_path: string;
    domain: string;
    created_at: string;
    added_by: string;
  }>;
};
