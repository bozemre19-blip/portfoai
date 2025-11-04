/**
 * API Modülleri - Uyumluluk Katmanı
 * 
 * NOT: Bu dosya artık sadece yeni modüler yapıyı re-export eder.
 * Orijinal 1185 satırlık kod services/api/ klasörü altında modüllere bölünmüştür.
 * 
 * Modül Yapısı:
 * - services/api/common.ts          → Ortak utilities
 * - services/api/classes.ts         → Sınıf işlemleri
 * - services/api/children.ts        → Çocuk işlemleri
 * - services/api/observations.ts    → Gözlem işlemleri
 * - services/api/assessments.ts     → AI değerlendirme
 * - services/api/media.ts           → Medya işlemleri
 * - services/api/chat.ts            → Öğretmen asistan
 * - services/api/seed.ts            → Demo data
 * - services/api/index.ts           → Ana export dosyası
 * 
 * Tüm mevcut import'lar çalışmaya devam edecektir.
 */

// Tüm API fonksiyonlarını yeni modüler yapıdan export et
export * from './api/index';
