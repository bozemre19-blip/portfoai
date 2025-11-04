// Ortak yardımcı fonksiyonlar ve sabitler

// Data değişikliği event'i - UI'ı güncellemek için kullanılır
export const dispatchDataChangedEvent = () => window.dispatchEvent(new Event('datachanged'));

// Offline senkronizasyon için localStorage anahtarları
export const OFFLINE_OBSERVATIONS_KEY = 'offlineObservations';
export const CACHED_CHILDREN_KEY = 'cachedChildren';
export const CACHED_CLASSES_KEY = 'cachedClasses';

// Cache yardımcı fonksiyonları
export const setCache = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error('Cache yazma hatası:', e);
  }
};

export const getCache = <T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Cache çok eskiyse null döndür
    if (age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data as T;
  } catch (e) {
    console.error('Cache okuma hatası:', e);
    return null;
  }
};

export const clearCache = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Cache temizleme hatası:', e);
  }
};

