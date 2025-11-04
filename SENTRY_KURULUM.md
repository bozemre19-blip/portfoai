# 🚨 Sentry Hata Takip Sistemi - Kurulum Rehberi

## Sentry Nedir?

Sentry, uygulamanızdaki hataları otomatik olarak tespit edip size bildiren bir servistir. Kullanıcılarınız hata aldığında:
- Otomatik olarak size e-posta gönderir
- Hangi kullanıcıda olduğunu gösterir
- Hatanın nerede oluştuğunu detaylı gösterir
- Hatayı tekrar üretmek için gereken bilgileri toplar

## Ücretsiz mi?

✅ **EVET!** Sentry'nin ücretsiz planı:
- Ayda 5,000 hata
- Sınırsız kullanıcı
- 30 gün geçmiş

Küçük ve orta ölçekli projeler için fazlasıyla yeterli!

---

## Adım Adım Kurulum

### 1️⃣ Sentry Hesabı Oluşturun

1. https://sentry.io adresine gidin
2. "Start Free" butonuna tıklayın
3. GitHub/Google ile giriş yapabilirsiniz (önerilir)
4. Ücretsiz olan "Developer" planını seçin

### 2️⃣ Proje Oluşturun

1. Dashboard'da "Create Project" butonuna tıklayın
2. Platform olarak **"React"** seçin
3. Proje adı: `okul-gozlem-asistani`
4. Alert ayarları: **"Alert me on every new issue"** (önerilir)
5. "Create Project" butonuna tıklayın

### 3️⃣ DSN'i Kopyalayın

Proje oluştuktan sonra size bir **DSN** (Data Source Name) verilecek.

Örnek DSN:
```
https://abc123def456ghi789@o123456.ingest.sentry.io/987654
```

Bu DSN'i kopyalayın!

### 4️⃣ .env Dosyasına Ekleyin

Proje klasörünüzdeki `.env` dosyasını açın ve DSN'i ekleyin:

```env
# Sentry DSN (Hata takibi için)
VITE_SENTRY_DSN=https://abc123def456ghi789@o123456.ingest.sentry.io/987654
```

⚠️ **ÖNEMLİ:** Kendi DSN'inizi kullanın, örneği değil!

### 5️⃣ Uygulamayı Yeniden Başlatın

```bash
# Çalışan uygulamayı durdurun (Ctrl+C)
# Yeniden başlatın
npm run dev
```

Console'da şu mesajı görmelisiniz:
```
✅ Sentry başlatıldı: https://abc123def456...
```

### 6️⃣ Test Edin

Uygulamanızda bir hata oluşturun (örneğin olmayan bir sayfaya gidin).

Birkaç saniye sonra Sentry Dashboard'unuzda hatayı göreceksiniz!

---

## Sentry Dashboard'u Nasıl Kullanılır?

### Issues (Sorunlar) Sayfası

Burada tüm hataları görürsünüz:
- **Hata mesajı:** Ne hatası olduğu
- **Kullanıcı:** Hangi kullanıcıda olduğu
- **Browser:** Hangi tarayıcıda
- **Sayfa:** Hangi sayfada
- **Stack Trace:** Kodun hangi satırında

### Alerts (Uyarılar)

- **E-posta bildirimleri:** Yeni hata olduğunda mail gelir
- **Slack entegrasyonu:** İsterseniz Slack'e de bildirim gönderebilir
- **Threshold:** "10 kez aynı hata olursa bildir" gibi kurallar

### Replay (Tekrar Oynatma)

**ÖNEMLİ:** Bu özellik kullanıcının ekranını video gibi kaydeder.
- Varsayılan olarak **metinler maskeli** (gizlilik için)
- Hata oluştuğunda son 30 saniyeyi kaydeder
- Çok faydalı ama gizlilik politikasına uygun mu kontrol edin!

---

## Gizlilik ve Güvenlik

### Sentry Ne Toplar?

✅ Hata mesajları
✅ Stack trace (kod satırları)
✅ Kullanıcı ID'si (gizlilik için hash'lenebilir)
✅ Tarayıcı ve işletim sistemi bilgisi
✅ URL ve sayfa bilgisi

❌ Şifreler (otomatik filtrelenir)
❌ API anahtarları (filtrelenir)
❌ Kredi kartı bilgileri (filtrelenir)

### Gizlilik İçin Ayarlar

`sentry.config.ts` dosyasında:

```typescript
// Kullanıcı e-posta adresini gönderme
setSentryUser(session.user.id); // Email parametresini kaldırın

// Replay'i tamamen kapat
// new Sentry.Replay() satırını yoruma alın

// Bazı hataları filtreleme
beforeSend(event, hint) {
  // "işaretsiz" gibi kelimeleri içeren hataları gönderme
  if (event.message?.includes('işaretsiz')) {
    return null;
  }
  return event;
}
```

---

## SSS (Sık Sorulan Sorular)

### ❓ Ücretsiz limit doldu ne olacak?

Hiçbir şey! Sentry çalışmayı durdurur, uygulamanız normal çalışır.
Yeni dönemde (aylık) limit sıfırlanır.

### ❓ Production'a alırken ne yapmalıyım?

`.env.production` dosyası oluşturun:
```env
VITE_SENTRY_DSN=your_production_dsn_here
```

Production ve development için ayrı projeler oluşturabilirsiniz.

### ❓ Development ortamında Sentry'i kapatmak istemiyorum?

`.env` dosyasında DSN'i boş bırakın:
```env
VITE_SENTRY_DSN=
```

Uygulama normal çalışacak, Sentry devre dışı olacak.

### ❓ Hata gelmiyor, test nasıl yapılır?

Console'da:
```javascript
throw new Error('Test hatası');
```

Veya App.tsx içinde bir yere:
```typescript
console.error('Test:', Sentry.captureMessage('Manuel test mesajı'));
```

---

## İleri Seviye Özellikler

### Performance Monitoring

Sentry sadece hataları değil, performansı da izler:
- Sayfa yükleme süreleri
- API çağrı süreleri
- Yavaş componentler

Varsayılan olarak **aktif**. `tracesSampleRate: 0.1` ile %10 kullanıcıda izlenir.

### Custom Context

Hatalara ekstra bilgi ekleyebilirsiniz:

```typescript
import { captureError } from './sentry.config';

try {
  // Bir şeyler yap
} catch (error) {
  captureError(error as Error, {
    childId: '123',
    action: 'gözlem-ekleme',
    customData: { foo: 'bar' }
  });
}
```

### Breadcrumbs (Ekmek Kırıntıları)

Sentry otomatik olarak kullanıcının yaptığı işlemleri kaydeder:
- Hangi butonlara tıkladı
- Hangi sayfalara gitti
- Ne zaman hata oluştu

Bu sayede hatayı tekrar üretmek çok kolay!

---

## Destek

Sentry dokümantasyonu: https://docs.sentry.io/platforms/javascript/guides/react/

---

**🎉 Tebrikler! Artık uygulamanızdaki tüm hataları otomatik takip ediyorsunuz!**

