<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Okul Gözlem Asistanı

Erken çocukluk öğretmenlerinin 0–6 yaş çocukları için profil oluşturup gözlemler ekleyebildiği, ürün/medya yükleyebildiği ve yapay zekâ destekli öneriler alabildiği web uygulaması. Kimlik doğrulama, veri saklama ve depolama için Supabase kullanır.

## Özellikler
- Çocuk profili: ad-soyad, doğum tarihi, sınıf, veli bilgileri, sağlık, ilgi alanları, güçlü yönler, avatar fotoğrafı
- Gözlem kaydı: not, bağlam, gelişim alanları, etiketler; çevrimdışı kayıt ve senkronizasyon
- Yapay zekâ analizi: Supabase Edge Function üzerinden Gemini ile özet ve öneriler
- Ürün/Medya: Supabase Storage’a yükleme, listeleme, silme (UI kademeli ekleniyor)
- Dışa aktarma: JSON ve PDF rapor

## Kurulum ve Çalıştırma

### Önkoşullar
- Node.js 18+ 
- npm veya yarn
- Supabase hesabı (ücretsiz)
- Google Gemini API anahtarı (AI özellikler için)

### 1️⃣ Projeyi İndirin
```bash
git clone <repository-url>
cd okul-gozlem-asistani
npm install
```

### 2️⃣ Ortam Değişkenlerini Ayarlayın

**Önemli Güvenlik Notu:** Asla API anahtarlarınızı kodun içine yazmayın!

1. `.env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   # Windows PowerShell
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

2. `.env` dosyasını açın ve bilgilerinizi girin:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   GEMINI_API_KEY=your-gemini-key-here
   VITE_SENTRY_DSN=your-sentry-dsn-here  # Opsiyonel
   ```

**Nerede Bulunur?**
- **Supabase bilgileri:** [Supabase Dashboard](https://app.supabase.com) > Project Settings > API
- **Gemini API Key:** [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Sentry DSN:** [Sentry.io](https://sentry.io) > Project Settings (opsiyonel)

### 3️⃣ Supabase'i Hazırlayın

1. **Veritabanı Şemasını Oluşturun:**
   - Supabase Dashboard'da SQL Editor'ı açın
   - `supabase/schema.sql` dosyasını çalıştırın
   - `supabase/policies.sql` dosyasını çalıştırın

2. **Storage Bucket'ları Oluşturun:**
   - Storage bölümüne gidin
   - İki bucket oluşturun:
     - `avatars` → Public (çocuk profil resimleri)
     - `child-media` → Private (çocuk ürünleri)

3. **Edge Functions'ı Deploy Edin:**
   ```bash
   # Supabase CLI kurulu değilse:
   npm install -g supabase
   
   # Login
   supabase login
   
   # Functions'ları deploy edin
   supabase functions deploy ai_evaluate
   supabase functions deploy teacher_chat
   supabase functions deploy media_upload
   supabase functions deploy media_update
   
   # Environment variables ayarlayın
   supabase secrets set API_KEY=your-gemini-api-key
   ```

### 4️⃣ Uygulamayı Başlatın
```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

### 5️⃣ Production Build (Canlıya Almak İçin)
```bash
npm run build
npm run preview  # Build'i test edin
```

---

## 🔒 Güvenlik Notları

- ⚠️ `.env` dosyasını asla Git'e yüklemeyin (`.gitignore` otomatik engeller)
- ⚠️ Production'da Supabase RLS (Row Level Security) politikalarının aktif olduğundan emin olun
- ⚠️ API anahtarlarınızı düzenli olarak yenileyin
- ✅ Tüm hassas veriler Supabase'de şifrelenmiş şekilde saklanır

---

## 🐛 Sorun Giderme

### "Supabase yapılandırması eksik" hatası
➡️ `.env` dosyasını oluşturdunuz mu? Değerler doğru mu?

### Gözlemler kaydedilmiyor
➡️ Supabase RLS politikaları doğru kurulmuş mu? `policies.sql`'i kontrol edin.

### AI analizi çalışmıyor
➡️ `GEMINI_API_KEY` değerini `.env` dosyasına eklediniz mi?

### Fotoğraf yüklenmiyor
➡️ Storage bucket'ları oluşturdunuz mu? Policy'ler doğru mu?

---

## Notlar
- PDF rapor oluşturma, çocuk detay ekranından kullanılabilir.
- Demo data seeder ile hızlıca test verisi oluşturabilirsiniz (Ayarlar > Demo Verisi)
- Çevrimdışı mod: İnternet bağlantısı olmadan da gözlem kaydedebilirsiniz, otomatik senkronize olur.
