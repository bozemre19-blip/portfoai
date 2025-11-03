import type { DevelopmentDomain, ObservationContext } from './types';

// Fix: Corrected typo in constant name from DEVELOPMENT_DOMAAINS to DEVELOPMENT_DOMAINS.
export const DEVELOPMENT_DOMAINS: Record<DevelopmentDomain, string> = {
    cognitive: 'Bilişsel Gelişim',
    language: 'Dil Gelişimi',
    social_emotional: 'Sosyal-Duygusal Gelişim',
    fine_motor: 'İnce Motor Gelişimi',
    gross_motor: 'Kaba Motor Gelişimi',
    self_care: 'Öz Bakım Becerileri',
};

export const OBSERVATION_CONTEXTS: Record<ObservationContext, string> = {
    classroom: 'Sınıf İçi',
    outdoor: 'Dış Mekan',
    home: 'Ev',
    other: 'Diğer',
};

const translations: { [key: string]: string } = {
    appName: 'Okul Gözlem Asistanı',
    // New Auth Strings
    signInTitle: 'Giriş Yapın',
    signUpTitle: 'Hesap Oluşturun',
    signInDescription: 'Hesabınıza erişmek için e-posta ve parolanızı girin.',
    signUpDescription: 'Başlamak için yeni bir hesap oluşturun.',
    emailLabel: 'E-posta Adresi',
    passwordLabel: 'Parola',
    signInAction: 'Giriş Yap',
    signUpAction: 'Üye Ol',
    noAccountPrompt: 'Hesabınız yok mu?',
    haveAccountPrompt: 'Zaten hesabınız var mı?',
    switchToSignUp: 'Üye Olun',
    switchToSignIn: 'Giriş Yapın',
    signUpSuccess: 'Hesabınız oluşturuldu! Lütfen e-postanızı doğrulayın.',
    apiKeyError: 'Supabase API Anahtarı geçersiz veya eksik. Lütfen `services/supabase.ts` dosyasındaki `supabaseAnonKey` değerini kontrol edin.',
    
    // Rest of the strings
    dashboard: 'Anasayfa',
    children: 'Çocuklar',
    observations: 'Gözlemler',
    settings: 'Ayarlar',
    signOut: 'Çıkış Yap',
    welcome: 'Hoş Geldiniz',
    recentObservations: 'Son Gözlemler',
    quickAccess: 'Hızlı Erişim',
    addChild: 'Çocuk Ekle',
    addObservation: 'Gözlem Ekle',
    editObservation: 'Gözlemi Düzenle',
    childList: 'Çocuk Listesi',
    searchChild: 'Çocuk ara...',
    noChildrenFound: 'Henüz hiç çocuk eklenmemiş.',
    childProfile: 'Çocuk Profili',
    firstName: 'Adı',
    lastName: 'Soyadı',
    dob: 'Doğum Tarihi',
    age: 'Yaş',
    classroom: 'Sınıf',
    parentalConsent: 'Veli Onayı Alındı',
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    newObservationFor: 'için Yeni Gözlem',
    observationNote: 'Gözlem Notu',
    notePlaceholder: 'Çocuğun davranışları, sözleri ve etkileşimleri hakkında detaylı notlar alın...',
    developmentDomains: 'Gelişim Alanları',
    selectDomains: 'İlgili gelişim alanlarını seçin',
    context: 'Ortam',
    tags: 'Etiketler',
    tagsPlaceholder: 'virgülle ayırarak etiket ekleyin',
    addMedia: 'Fotoğraf/Video Ekle',
    submitObservation: 'Gözlemi Kaydet',
    consentYes: 'Evet',
    consentNo: 'Hayır',
    childDetail: 'Çocuk Detayları',
    profile: 'Profil',
    development: 'Gelişim',
    media: 'Medya',
    generateReport: 'Gelişim Raporu Oluştur',
    aiAnalysis: 'Yapay Zeka Analizi',
    getAnalysis: 'Analiz İste',
    summary: 'Özet',
    riskLevel: 'Risk Düzeyi',
    suggestions: 'Öğretmene Öneriler',
    domainScores: 'Alan Puanları',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    loading: 'Yükleniyor...',
    deleting: 'Siliniyor...',
    errorOccurred: 'Bir hata oluştu.',
    offlineWarning: 'Çevrimdışı moddasınız. Yaptığınız değişiklikler bağlantı kurulduğunda senkronize edilecektir.',
    syncAttempt: 'Çevrimçisiniz, veriler senkronize ediliyor...',
    syncSuccess: 'Veriler başarıyla senkronize edildi.',
    syncError: 'Senkronizasyon sırasında bir hata oluştu.',
    exportData: 'Verileri Dışa Aktar',
    exportChildData: 'Çocuğun Verilerini Dışa Aktar (JSON)',
    legal: 'Yasal Bilgiler',
    privacyPolicy: 'Gizlilik Politikası',
    termsOfService: 'Hizmet Şartları',
    // Added missing keys
    noRecentObservations: 'Son zamanlarda gözlem yapılmadı.',
    childNotFound: 'Çocuk bulunamadı.',
    pendingSync: 'Senkronizasyon bekleniyor.',
    developmentSummary: 'Gelişim Özeti',
    developmentReport: 'Gelişim Raporu',
    reportDate: 'Rapor Tarihi',
    childInfo: 'Çocuk Bilgileri',
    fullName: 'Tam Adı',
    aiSummariesAndSuggestions: 'Yapay Zeka Özetleri ve Öneriler',
    noAssessmentsForReport: 'Rapor için henüz değerlendirme yapılmamış.',
    observationDate: 'Gözlem Tarihi',
    aiSummary: 'Yapay Zeka Özeti',
    observationSavedOffline: 'Gözlem çevrimdışı olarak kaydedildi. Bağlantı kurulduğunda senkronize edilecek.',
    observationsSynced: 'gözlem başarıyla senkronize edildi.',
    exportDataDescription: 'Uygulamadaki tüm verilerinizi JSON formatında dışa aktarın.',
    exportAllData: 'Tüm Verileri Dışa Aktar',
    // New keys for Products tab
    products: 'Ürünler',
    uploadProduct: 'Ürün Yükle',
    noProductsAdded: 'Henüz hiç ürün eklenmemiş.',
    // New keys for Product Upload Modal
    productName: 'Ürün Adı',
    productDescription: 'Ürün Hakkında Not (İsteğe Bağlı)',
    productDomain: 'İlgili Gelişim Alanı',
    selectFile: 'Medya Seç',
    fileSelected: 'Dosya Seçildi:',
    noFileSelected: 'Henüz dosya seçilmedi.',
    productNamePlaceholder: 'Örn: Renkli Bloklarla Yapılan Kule',
    productDescriptionPlaceholder: 'Çocuğun ürünle nasıl etkileşimde bulunduğuna dair notlar...',
    selectDomainPrompt: 'Bir gelişim alanı seçin...',
    // Edit/Delete
    confirmDeleteTitle: 'Kaydı Sil',
    confirmDeleteMessage: 'Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    yes: 'Evet',
    no: 'Hayır',
    deleteSuccess: 'Gözlem başarıyla silindi.',
    productDeleteSuccess: 'Ürün başarıyla silindi.',
    // New comprehensive Add Child Form keys
    basicInfo: 'Temel Bilgiler',
    guardians: 'Veli Bilgileri',
    healthInfo: 'Sağlık Bilgileri',
    otherInfo: 'Diğer Bilgiler',
    addGuardian: 'Veli Ekle',
    guardianName: 'Adı Soyadı',
    guardianRelation: 'Yakınlığı',
    guardianPhone: 'Telefon Numarası',
    guardianEmail: 'E-posta Adresi',
    removeGuardian: 'Kaldır',
    allergies: 'Alerjiler (virgülle ayırın)',
    healthNotes: 'Önemli Sağlık Notları',
    interests: 'İlgi Alanları (virgülle ayırın)',
    strengths: 'Güçlü Yönler (virgülle ayırın)',
    editChild: 'Çocuk Bilgilerini Düzenle',
    updateSuccess: 'Bilgiler başarıyla güncellendi.',
    // Child Deletion
    confirmDeleteChildTitle: 'Çocuğu Sil',
    confirmDeleteChildMessage: '<strong>{childName}</strong> adlı çocuğu kalıcı olarak silmek istediğinizden emin misiniz? <br/><br/> Bu işlem, çocuğa ait <strong>tüm gözlemleri, ürünleri ve profil fotoğrafını</strong> da kalıcı olarak silecektir. Bu işlem geri alınamaz.',
    childDeleteSuccess: 'Çocuk ve ilişkili tüm veriler başarıyla silindi.',
};

// Additional translation keys for teacher sign-up fields
// (Appends safely without touching the existing object literal)
// Note: File may contain legacy encoding; these strings are UTF-8.
// They will still render fine in modern browsers.
(translations as Record<string, string>).teacherFirstName = 'Öğretmen Adı';
(translations as Record<string, string>).teacherLastName = 'Öğretmen Soyadı';
(translations as Record<string, string>).schoolName = 'Okul Adı';
(translations as Record<string, string>).missingTeacherFields = 'Lütfen ad, soyad ve okul adını girin.';

export const t = (key: string): string => translations[key] || key;

// Extra labels for teacher profile editing
(translations as Record<string,string>).saveProfile = 'Profili Kaydet';
(translations as Record<string,string>).profileUpdateSuccess = 'Profil g�ncellendi.';
(translations as Record<string,string>).profileUpdateError = 'Profil g�ncellenemedi.';

(translations as Record<string,string>).domainsRequired = 'L�tfen en az bir geli�im alan� se�in.';
(translations as Record<string,string>).productDomainRequired = 'L�tfen �r�n i�in bir geli�im alan� se�in.';
