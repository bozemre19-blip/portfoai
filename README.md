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

## Çalıştırma (Yerel)
Önkoşullar: Node.js 18+

1) Bağımlılıkları kurun
- `npm install`

2) Supabase’i hazırlayın
- Supabase projesi oluşturun ve URL/Anon Key bilgilerinizi alın.
- SQL Editor’da aşağıdaki dosyaları sırayla çalıştırın:
  - `supabase/schema.sql`
  - `supabase/policies.sql`
- Storage’da iki bucket oluşturun:
  - `child-media` (private)
  - `avatars` (public)
  Alternatif olarak policies dosyasının sonundaki örnek storage policy’leri rehber olarak kullanabilirsiniz.

3) Edge Function (AI) kurulumu
- `supabase/functions/ai_evaluate` fonksiyonunu projenize ekleyip deploy edin.
- Fonksiyon ortam değişkenleri: `API_KEY` = Gemini API anahtarınız.

4) Uygulamayı başlatın
- `npm run dev`
- Tarayıcıda `http://localhost:5173` adresini açın.

Notlar
- Kendi Supabase projenizi kullanacaksanız `services/supabase.ts` dosyasındaki `supabaseUrl` ve `supabaseAnonKey` değerlerini güncelleyin.
- PDF rapor oluşturma, çocuk detay ekranından kullanılabilir.
