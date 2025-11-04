/**
 * Sentry Yapılandırması
 * Hata takibi ve performans izleme için
 */

import * as Sentry from '@sentry/react';

// Sentry başlatma fonksiyonu
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Eğer DSN yoksa Sentry'i başlatma (development ortamında opsiyonel)
  if (!dsn || dsn === 'your_sentry_dsn_here') {
    console.log('ℹ️ Sentry DSN bulunamadı, hata takibi devre dışı.');
    return;
  }

  Sentry.init({
    dsn,
    
    // Ortam bilgisi (production/development)
    environment: import.meta.env.MODE || 'development',
    
    // Sentry'e gönderilecek hata oranı (1.0 = %100, 0.5 = %50)
    // Production'da bütçe kontrolü için düşük tutabilirsiniz
    sampleRate: 1.0,
    
    // Performans izleme oranı
    // 0.1 = %10 kullanıcının performans verisi gönderilir
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // React component ağacı bilgisi
    integrations: [
      // React Router entegrasyonu (eğer kullanıyorsanız)
      new Sentry.BrowserTracing({
        // Hash routing kullanıyorsanız bunu aktif edin
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          // @ts-ignore - Hash routing için geçici çözüm
          {
            useEffect: (cb: any) => {
              window.addEventListener('hashchange', cb);
              return () => window.removeEventListener('hashchange', cb);
            },
            useLocation: () => ({ pathname: window.location.hash }),
            useNavigationType: () => 'POP',
            createRoutesFromChildren: () => [],
            matchRoutes: () => null,
          }
        ),
      }),
      // Replay özelliği (kullanıcı oturumunu video gibi kaydeder)
      // ÖNEMLİ: Gizlilik hassasiyeti varsa bunu kapatın!
      new Sentry.Replay({
        maskAllText: true, // Tüm metinleri maskele (gizlilik için)
        blockAllMedia: true, // Tüm medyayı engelle (gizlilik için)
      }),
    ],
    
    // Replay kayıt oranları
    replaysSessionSampleRate: 0.1, // Normal oturumlarda %10
    replaysOnErrorSampleRate: 1.0, // Hata durumunda %100
    
    // Hata filtreleme - bu hataları göndermez
    beforeSend(event, hint) {
      // Development ortamında console'a da bas
      if (import.meta.env.DEV) {
        console.error('🚨 Sentry Event:', event, hint);
      }
      
      // Bazı hataları filtreleyebilirsiniz
      // Örnek: Network hataları
      if (event.exception) {
        const error = hint.originalException as Error;
        if (error?.message?.includes('NetworkError')) {
          return null; // Bu hatayı gönderme
        }
      }
      
      return event;
    },
    
    // Kullanıcı bilgisi ekleme (opsiyonel, gizlilik politikanıza göre)
    // beforeSend içinde de yapabilirsiniz
  });

  console.log('✅ Sentry başlatıldı:', dsn.substring(0, 20) + '...');
};

// Kullanıcı bilgisi ayarlama
export const setSentryUser = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email: email,
    username: username,
  });
};

// Kullanıcı bilgisini temizleme (logout)
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Manuel hata gönderme
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext('custom', context);
  }
  Sentry.captureException(error);
};

// Manuel mesaj gönderme
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

