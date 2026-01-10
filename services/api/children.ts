import { supabase } from '../supabase';
import type { Child } from '../../types';
import { dispatchDataChangedEvent, setCache, getCache, CACHED_CHILDREN_KEY } from './common';

// Kullanıcının tüm çocuklarını getir (cache destekli)
export const getChildren = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Başarılı yanıt gelirse cache'i güncelle
    const children = data as Child[];
    setCache(`${CACHED_CHILDREN_KEY}:${userId}`, children);
    return children;
  } catch (error) {
    // Hata durumunda (offline gibi), cache'den dene
    console.log('Çevrimdışı mod - cache\'den çocuklar getiriliyor');
    const cached = getCache<Child[]>(`${CACHED_CHILDREN_KEY}:${userId}`);
    if (cached) {
      return cached;
    }
    // Cache de yoksa boş array döndür (ilk kullanım durumu)
    console.warn('Cache bulunamadı, boş liste döndürülüyor:', error);
    return [];
  }
};

// Belirli bir sınıftaki çocukları getir (performans için sadece gerekli kolonlar)
export const getChildrenByClassroom = async (userId: string, classroom: string) => {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('id, first_name, last_name, classroom, photo_url, dob')
      .eq('user_id', userId)
      .eq('classroom', classroom)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Pick<Child, 'id' | 'first_name' | 'last_name' | 'classroom' | 'photo_url' | 'dob'>[] as Child[];
  } catch (error) {
    // Hata durumunda tüm cache'den filtrele
    console.log('Çevrimdışı mod - sınıf çocukları cache\'den getiriliyor');
    const allChildren = getCache<Child[]>(`${CACHED_CHILDREN_KEY}:${userId}`);
    if (allChildren) {
      return allChildren.filter(c => c.classroom === classroom);
    }
    // Cache de yoksa boş array döndür
    console.warn('Cache bulunamadı, boş liste döndürülüyor');
    return [];
  }
};

// Yeni çocuk ekle
export const addChild = async (child: Omit<Child, 'id' | 'user_id' | 'created_at'>, userId: string) => {
  const { data, error } = await supabase
    .from('children')
    .insert({ ...child, user_id: userId })
    .select();
  if (error) throw error;
  dispatchDataChangedEvent();
  return data[0] as Child;
};

// Çocuk bilgilerini güncelle
export const updateChild = async (childId: string, updates: Partial<Child>) => {
  const { data, error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)
    .select()
    .single();
  if (error) throw error;
  dispatchDataChangedEvent();
  return data as Child;
};

// Çocuğu ve ilişkili tüm verileri sil (gözlemler, medya, avatar, mesajlar, veli bağlantıları)
export const deleteChild = async (childId: string) => {
  // 1. İlişkili medya ve fotoğraf yollarını almadan ÖNCE al
  const { data: mediaToDelete, error: mediaError } = await supabase
    .from('media')
    .select('storage_path')
    .eq('child_id', childId);

  if (mediaError) {
    console.error('Silinecek medya alınırken hata oluştu:', mediaError);
  }

  const { data: childData, error: childError } = await supabase
    .from('children')
    .select('photo_url')
    .eq('id', childId)
    .single();

  if (childError) {
    console.error('Fotoğrafı silmek için çocuk verisi alınırken hata oluştu:', childError);
  }

  // 2. Dosyaları depolama alanından sil
  if (mediaToDelete && mediaToDelete.length > 0) {
    const paths = mediaToDelete.map(m => m.storage_path);
    const { error: storageMediaError } = await supabase.storage
      .from('child-media')
      .remove(paths);
    if (storageMediaError) {
      console.error('Medya depolama alanından silinirken hata:', storageMediaError);
    }
  }

  // Avatar fotoğrafını sil
  if (childData?.photo_url) {
    try {
      const url = new URL(childData.photo_url);
      const path = url.pathname.split('/avatars/')[1];
      if (path) {
        const { error: storageAvatarError } = await supabase.storage
          .from('avatars')
          .remove([path]);
        if (storageAvatarError) {
          console.error('Avatar depolama alanından silinirken hata:', storageAvatarError);
        }
      }
    } catch (e) {
      console.error("Depolama alanından silmek için fotoğraf URL'si ayrıştırılamadı", e);
    }
  }

  // 3. İlişkili kayıtları veritabanından sil (foreign key constraint'ler için)
  // Mesajları sil (child_id ile ilişkili)
  const { error: msgError } = await supabase.from('messages').delete().eq('child_id', childId);
  if (msgError) console.warn('Mesajlar silinirken hata:', msgError.message);

  // Aile bağlantılarını sil
  const { error: famError } = await supabase.from('family_links').delete().eq('child_id', childId);
  if (famError) console.warn('Aile bağlantıları silinirken hata:', famError.message);

  // Hedefleri sil
  const { error: goalsError } = await supabase.from('goals').delete().eq('child_id', childId);
  if (goalsError) console.warn('Hedefler silinirken hata:', goalsError.message);

  // Değerlendirmeleri sil
  const { error: assError } = await supabase.from('assessments').delete().eq('child_id', childId);
  if (assError) console.warn('Değerlendirmeler silinirken hata:', assError.message);

  // Gözlemleri sil
  const { error: obsError } = await supabase.from('observations').delete().eq('child_id', childId);
  if (obsError) console.warn('Gözlemler silinirken hata:', obsError.message);

  // Medyayı sil
  const { error: medError } = await supabase.from('media').delete().eq('child_id', childId);
  if (medError) console.warn('Medya silinirken hata:', medError.message);

  // 4. Çocuk kaydını veritabanından sil (artık foreign key sorunu olmayacak)
  const { error: deleteError } = await supabase
    .from('children')
    .delete()
    .eq('id', childId);

  if (deleteError) {
    console.error('Çocuk veritabanından silinirken hata:', deleteError);
    throw deleteError;
  }

  // 5. Arayüzü yenilemek için event tetikle
  dispatchDataChangedEvent();
};

// Sınıfı ve içindeki tüm çocukları (ve ilişkili verileri) sil
export const deleteClass = async (userId: string, classroom: string, onProgress?: (msg: string) => void) => {
  // 1. Bu sınıftaki tüm çocukları bul
  const { data: childrenInClass, error: fetchError } = await supabase
    .from('children')
    .select('id, first_name, last_name')
    .eq('user_id', userId)
    .eq('classroom', classroom);

  if (fetchError) {
    console.error('Sınıftaki çocuklar alınırken hata:', fetchError);
    throw fetchError;
  }

  const children = childrenInClass || [];
  onProgress?.(`${children.length} çocuk siliniyor...`);

  // 2. Her çocuğu tek tek sil (cascade olarak gözlem, medya, avatar silinecek)
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    onProgress?.(`Siliniyor: ${child.first_name} ${child.last_name} (${i + 1}/${children.length})`);
    try {
      await deleteChild(child.id);
    } catch (e) {
      console.error(`Çocuk silinemedi: ${child.id}`, e);
    }
  }

  // 3. classes tablosundan da sınıfı sil (varsa)
  try {
    await supabase
      .from('classes')
      .delete()
      .eq('user_id', userId)
      .eq('name', classroom);
  } catch (e) {
    console.warn('classes tablosundan sınıf silinemedi (muhtemelen yoktu):', e);
  }

  // 4. Local meta verisini temizle
  try {
    const raw = localStorage.getItem(`classMeta:${userId}`);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, any>;
      delete map[classroom];
      localStorage.setItem(`classMeta:${userId}`, JSON.stringify(map));
    }
  } catch { }

  onProgress?.('Sınıf silindi.');
  dispatchDataChangedEvent();
};
export const uploadChildPhoto = async (userId: string, childId: string, file: File): Promise<string> => {
  const { processImage } = await import('../../utils/helpers');
  const processedFile = await processImage(file);
  const { v4: uuidv4 } = await import('uuid');
  const fileName = `${userId}/${childId}/${uuidv4()}`;

  // Not: 'avatars' public bucket olmalı
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, processedFile, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

// Çocuk verilerini JSON olarak dışa aktar
export const exportChildData = async (childId: string) => {
  const { data: childData, error: childError } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();
  if (childError) throw childError;

  const { data: observations, error: obsError } = await supabase
    .from('observations')
    .select('*, assessments(*)')
    .eq('child_id', childId);
  if (obsError) throw obsError;

  const exportData = {
    child: childData,
    observations: observations,
  };

  // Güvenli dosya adı oluşturma (Türkçe karakter temizleme)
  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

  const filename = `export_${slug(childData.first_name || 'cocuk')}_${slug(
    childData.last_name || 'veri'
  )}_${new Date().toISOString().split('T')[0]}.json`;

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    // Fallback: yeni sekmede aç (bazı ortamlarda download engellenirse)
    setTimeout(() => {
      try {
        window.open(url, '_blank');
      } catch {
        /* noop */
      }
      URL.revokeObjectURL(url);
    }, 200);
  }
};

