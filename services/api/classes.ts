import { supabase } from '../supabase';
import { dispatchDataChangedEvent, setCache, getCache, CACHED_CLASSES_KEY } from './common';

// Sınıf veri tipi
export type ClassItem = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
};

// Sınıf adından slug oluşturma (lowercase, Türkçe karakterler korunur)
const makeSlug = (name: string) =>
  (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('tr-TR');

// Sınıf adını normalize etme (her kelimenin ilk harfi büyük)
const normalizeClassName = (name: string) =>
  (name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^|\s)\S/g, (s) => s.toLocaleUpperCase('tr-TR'));

// Kullanıcının tüm sınıflarını getir (cache destekli)
export const getClasses = async (userId: string): Promise<ClassItem[]> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      // Tablo yoksa daha açıklayıcı hata mesajı
      if ((error as any).message?.includes('relation') && (error as any).message?.includes('does not exist')) {
        throw new Error("'classes' tablosu bulunamadı. Lütfen Supabase'de sınıflar için tabloyu oluşturun.");
      }
      throw error;
    }
    
    // Başarılı yanıt gelirse cache'i güncelle
    const classes = (data || []) as ClassItem[];
    setCache(`${CACHED_CLASSES_KEY}:${userId}`, classes);
    return classes;
  } catch (error) {
    // Hata durumunda (offline gibi), cache'den dene
    console.log('Çevrimdışı mod - cache\'den sınıflar getiriliyor');
    const cached = getCache<ClassItem[]>(`${CACHED_CLASSES_KEY}:${userId}`);
    if (cached) {
      return cached;
    }
    // Cache de yoksa hatayı fırlat
    throw error;
  }
};

// Yeni sınıf oluştur (aynı ada sahip sınıf varsa mevcut olanı döndürür)
export const createClass = async (userId: string, name: string): Promise<ClassItem> => {
  const pretty = normalizeClassName(name);
  const slug = makeSlug(pretty);

  // Upsert ile aynı slug'a sahip kayıt varsa güncelle, yoksa ekle
  let { data, error } = await supabase
    .from('classes')
    .upsert({ user_id: userId, name: pretty, slug }, { onConflict: 'user_id,slug' })
    .select()
    .single();

  if (error) {
    // Fallback: unique index yoksa manuel kontrol
    const { data: exists } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', userId)
      .eq('slug', slug)
      .single();

    if (exists) return exists as ClassItem;

    const ins = await supabase
      .from('classes')
      .insert({ user_id: userId, name: pretty, slug })
      .select()
      .single();

    if (ins.error) throw ins.error;
    data = ins.data as any;
  }

  dispatchDataChangedEvent();
  return data as ClassItem;
};

