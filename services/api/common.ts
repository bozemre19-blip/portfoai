// Ortak yardımcı fonksiyonlar ve sabitler

// Data değişikliği event'i - UI'ı güncellemek için kullanılır
export const dispatchDataChangedEvent = () => window.dispatchEvent(new Event('datachanged'));

// Offline senkronizasyon için localStorage anahtarları
export const OFFLINE_OBSERVATIONS_KEY = 'offlineObservations';
export const OFFLINE_ATTENDANCE_KEY = 'offlineAttendance';
export const OFFLINE_GOALS_KEY = 'offlineGoals';
export const OFFLINE_QUEUE_KEY = 'offlineQueue';
export const CACHED_CHILDREN_KEY = 'cachedChildren';
export const CACHED_CLASSES_KEY = 'cachedClasses';
export const CACHED_OBSERVATIONS_KEY = 'cachedObservations';
export const CACHED_ATTENDANCE_KEY = 'cachedAttendance';
export const CACHED_GOALS_KEY = 'cachedGoals';

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

// Offline queue yönetimi
export interface OfflineQueueItem {
  id: string;
  type: 'observation' | 'attendance' | 'goal' | 'child_update' | 'goal_update';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

export const addToOfflineQueue = (item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>) => {
  try {
    const queue = getOfflineQueue();
    const newItem: OfflineQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Offline queue\'ya ekleme hatası:', e);
  }
};

export const getOfflineQueue = (): OfflineQueueItem[] => {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Offline queue okuma hatası:', e);
    return [];
  }
};

export const removeFromOfflineQueue = (itemId: string) => {
  try {
    const queue = getOfflineQueue().filter(item => item.id !== itemId);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Offline queue\'dan silme hatası:', e);
  }
};

export const updateQueueItemRetryCount = (itemId: string) => {
  try {
    const queue = getOfflineQueue();
    const item = queue.find(i => i.id === itemId);
    if (item) {
      item.retryCount++;
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.error('Queue retry count güncelleme hatası:', e);
  }
};

// Network durumu kontrol
export const isOnline = () => navigator.onLine;

// Tüm offline verileri temizle
export const clearAllOfflineData = () => {
  clearCache(OFFLINE_OBSERVATIONS_KEY);
  clearCache(OFFLINE_ATTENDANCE_KEY);
  clearCache(OFFLINE_GOALS_KEY);
  clearCache(OFFLINE_QUEUE_KEY);
};

