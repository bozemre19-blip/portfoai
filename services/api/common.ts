// Ortak yardımcı fonksiyonlar ve sabitler

// Data değişikliği event'i - UI'ı güncellemek için kullanılır
export const dispatchDataChangedEvent = () => window.dispatchEvent(new Event('datachanged'));

// Offline senkronizasyon için localStorage anahtarı
export const OFFLINE_OBSERVATIONS_KEY = 'offlineObservations';

