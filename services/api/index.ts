/**
 * API Modülleri - Ana Export Dosyası
 * Tüm API fonksiyonları buradan export edilir
 */

// Ortak utilities
export * from './common';

// Sınıf işlemleri
export * from './classes';
export type { ClassItem } from './classes';

// Çocuk işlemleri
export * from './children';

// Gözlem işlemleri
export * from './observations';

// AI Değerlendirme işlemleri
export * from './assessments';

// Medya işlemleri
export * from './media';

// Chat/Asistan işlemleri
export * from './chat';
export type { ChatThread, ChatMessage } from './chat';

// Hedef (Goals) işlemleri
export * from './goals';

// Yoklama (Attendance) işlemleri
export * from './attendance';

// Demo Data Seeder
export * from './seed';
export type { SeedOptions } from './seed';

// Hesap İşlemleri
export * from './account';


