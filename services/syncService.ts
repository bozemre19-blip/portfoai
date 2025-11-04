import { supabase } from './supabase';
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  updateQueueItemRetryCount,
  isOnline,
  dispatchDataChangedEvent,
} from './api/common';
import type { OfflineQueueItem } from './api/common';

const MAX_RETRY_COUNT = 3;

/**
 * Offline queue'daki tüm işlemleri senkronize eder
 */
export const syncOfflineQueue = async (): Promise<{ success: number; failed: number }> => {
  if (!isOnline()) {
    console.log('İnternet bağlantısı yok, senkronizasyon iptal edildi');
    return { success: 0, failed: 0 };
  }

  const session = await supabase.auth.getSession();
  const userId = session?.data.session?.user.id;

  if (!userId) {
    console.error('Kullanıcı giriş yapmamış, senkronize edilemiyor.');
    return { success: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  // Queue'yu sırayla işle
  for (const item of queue) {
    try {
      await syncQueueItem(item, userId);
      removeFromOfflineQueue(item.id);
      successCount++;
    } catch (error) {
      console.error('Queue item senkronize edilemedi:', item, error);
      
      // Retry count'u artır
      updateQueueItemRetryCount(item.id);
      
      // Max retry'a ulaştıysa sil
      if (item.retryCount >= MAX_RETRY_COUNT) {
        console.warn('Max retry count aşıldı, item siliniyor:', item);
        removeFromOfflineQueue(item.id);
      }
      
      failedCount++;
    }
  }

  if (successCount > 0) {
    dispatchDataChangedEvent();
  }

  return { success: successCount, failed: failedCount };
};

/**
 * Tek bir queue item'ı senkronize eder
 */
const syncQueueItem = async (item: OfflineQueueItem, userId: string): Promise<void> => {
  const { type, action, data } = item;

  switch (type) {
    case 'observation':
      await syncObservation(action, data, userId);
      break;
    case 'attendance':
      await syncAttendance(action, data, userId);
      break;
    case 'goal':
      await syncGoal(action, data, userId);
      break;
    case 'child_update':
      await syncChildUpdate(action, data, userId);
      break;
    case 'goal_update':
      await syncGoalUpdate(action, data, userId);
      break;
    default:
      throw new Error(`Bilinmeyen queue type: ${type}`);
  }
};

// Observation senkronizasyonu
const syncObservation = async (action: string, data: any, userId: string) => {
  if (action === 'create') {
    const { id, created_at, dirty, media_files, ...obsData } = data;
    await supabase.from('observations').insert({ ...obsData, user_id: userId });
  } else if (action === 'update') {
    const { id, ...updates } = data;
    await supabase.from('observations').update(updates).eq('id', id);
  } else if (action === 'delete') {
    await supabase.from('observations').delete().eq('id', data.id);
  }
};

// Attendance senkronizasyonu
const syncAttendance = async (action: string, data: any, userId: string) => {
  if (action === 'create') {
    await supabase.from('attendance').insert({ ...data, user_id: userId });
  } else if (action === 'update') {
    const { id, ...updates } = data;
    await supabase.from('attendance').update(updates).eq('id', id);
  } else if (action === 'delete') {
    await supabase.from('attendance').delete().eq('id', data.id);
  }
};

// Goal senkronizasyonu
const syncGoal = async (action: string, data: any, userId: string) => {
  if (action === 'create') {
    await supabase.from('goals').insert({ ...data, user_id: userId });
  } else if (action === 'update') {
    const { id, ...updates } = data;
    await supabase.from('goals').update(updates).eq('id', id);
  } else if (action === 'delete') {
    await supabase.from('goals').delete().eq('id', data.id);
  }
};

// Child update senkronizasyonu
const syncChildUpdate = async (action: string, data: any, userId: string) => {
  if (action === 'update') {
    const { id, ...updates } = data;
    await supabase.from('children').update(updates).eq('id', id);
  }
};

// Goal update senkronizasyonu (progress, status vb.)
const syncGoalUpdate = async (action: string, data: any, userId: string) => {
  if (action === 'update') {
    const { id, ...updates } = data;
    await supabase.from('goals').update(updates).eq('id', id);
  }
};

/**
 * Otomatik senkronizasyon başlat
 * Online olunca otomatik senkronize eder
 */
export const startAutoSync = () => {
  // Online/offline event listener'ları
  window.addEventListener('online', handleOnline);
  
  // Sayfa yüklendiğinde online ise senkronize et
  if (isOnline()) {
    setTimeout(() => syncOfflineQueue(), 2000);
  }
};

/**
 * Otomatik senkronizasyonu durdur
 */
export const stopAutoSync = () => {
  window.removeEventListener('online', handleOnline);
};

/**
 * Online olunca çalışır
 */
const handleOnline = async () => {
  console.log('İnternet bağlantısı geri geldi, senkronizasyon başlatılıyor...');
  const result = await syncOfflineQueue();
  
  if (result.success > 0) {
    alert(`✅ ${result.success} kayıt başarıyla senkronize edildi!`);
  }
  
  if (result.failed > 0) {
    console.warn(`⚠️ ${result.failed} kayıt senkronize edilemedi`);
  }
};

/**
 * Manuel senkronizasyon butonu için
 */
export const manualSync = async (): Promise<string> => {
  if (!isOnline()) {
    return '❌ İnternet bağlantısı yok!';
  }

  const result = await syncOfflineQueue();
  
  if (result.success === 0 && result.failed === 0) {
    return '✅ Senkronize edilecek veri yok';
  }
  
  if (result.failed === 0) {
    return `✅ ${result.success} kayıt başarıyla senkronize edildi!`;
  }
  
  return `⚠️ ${result.success} kayıt senkronize edildi, ${result.failed} kayıt başarısız`;
};

