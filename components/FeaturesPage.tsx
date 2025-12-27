
import React from 'react';
import { motion } from 'framer-motion';

interface FeaturesPageProps {
    onBack: () => void;
    onSignup?: () => void;
}

const FeaturesPage: React.FC<FeaturesPageProps> = ({ onBack, onSignup }) => {
    const mainFeatures = [
        {
            title: "Hızlı Gözlem Kaydı",
            description: "Sınıf içinde zaman kaybetmeden, sesli veya yazılı gözlem notları alın. Notlarınız anında sisteme kaydedilir ve yapay zeka tarafından analiz edilir.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            color: "from-blue-500 to-blue-600"
        },
        {
            title: "Maarif Modeli Uyumlu AI Analizi",
            description: "Gözlemleriniz, Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı'na göre 7 temel beceri alanına otomatik olarak etiketlenir ve öğrenme çıktılarıyla eşleştirilir.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: "from-orange-500 to-red-500"
        },
        {
            title: "Otomatik PDF Raporlar",
            description: "Dönem sonu karmaşasına son! Tek tıkla her çocuk için detaylı, profesyonel gelişim raporları PDF olarak hazırlanır. Velilere kolayca paylaşın.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: "from-green-500 to-emerald-600"
        },
        {
            title: "Pedagojik AI Asistan",
            description: "Maarif Modeli'ne göre eğitilmiş yapay zeka asistanıyla sohbet edin. Etkinlik önerileri alın, pedagojik sorularınıza anında cevap bulun.",
            icon: (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            color: "from-purple-500 to-indigo-600"
        }
    ];

    const additionalFeatures = [
        {
            title: "Sınıf ve Çocuk Yönetimi",
            description: "Sınıflarınızı oluşturun, çocukları ekleyin. Her çocuk için detaylı profil oluşturun ve gelişim geçmişini takip edin.",
            icon: "👥"
        },
        {
            title: "Medya Galerisi",
            description: "Çocukların etkinlik fotoğraflarını ve videolarını yükleyin. Her medya dosyası için gözlem notu ekleyebilirsiniz.",
            icon: "📷"
        },
        {
            title: "Yoklama Takibi",
            description: "Günlük yoklama alın, devamsızlık nedenlerini kaydedin. Aylık devamsızlık raporları otomatik oluşturulur.",
            icon: "✓"
        },
        {
            title: "Gelişim Hedefleri",
            description: "Her çocuk için bireysel gelişim hedefleri belirleyin ve ilerlemeyi takip edin.",
            icon: "🎯"
        },
        {
            title: "Dashboard & Özet",
            description: "Tüm sınıflarınızı, son gözlemlerinizi ve bekleyen işlerinizi tek bir panelden görüntüleyin.",
            icon: "📊"
        },
        {
            title: "Çoklu Dil Desteği",
            description: "Türkçe ve İngilizce dil desteği ile uluslararası okullarda da kullanılabilir.",
            icon: "🌍"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Navbar */}
            <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center cursor-pointer" onClick={onBack}>
                            <img
                                src="/lukid-logo-navbar-v3.png"
                                alt="Lukid AI Logo"
                                className="h-10 w-auto -ml-2"
                            />
                            <span className="text-xl font-bold tracking-tight -ml-2">
                                <span className="text-slate-900">Lukid</span>
                                <span className="text-orange-500"> AI</span>
                            </span>
                        </div>
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors"
                        >
                            ← Ana Sayfaya Dön
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold">
                            Özellikler
                        </span>
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4">
                            Okul Öncesi Öğretmenleri İçin Tasarlandı
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Lukid AI, okul öncesi öğretmenlerinin evrak yükünü azaltmak ve çocuklarla daha fazla vakit geçirmelerini sağlamak için geliştirildi.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Main Features */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {mainFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Maarif Model Highlight */}
            <div className="bg-orange-50 border-y border-orange-100 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-block w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <span className="text-3xl">🇹🇷</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Türkiye Yüzyılı Maarif Modeli Uyumlu
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Yapay zekamız, MEB'in 2024 yılında yayınladığı <strong>Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı</strong>'na
                        göre eğitilmiştir. Gözlemleriniz; Sosyal-Duygusal, Dil, Bilişsel, Motor, Öz Bakım, Matematik ve Fen-Doğa beceri alanlarına
                        göre analiz edilir.
                    </p>
                </div>
            </div>

            {/* Additional Features */}
            <div className="max-w-6xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Daha Fazla Özellik</h2>
                    <p className="text-gray-600">Günlük işlerinizi kolaylaştıran tüm araçlar tek bir platformda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {additionalFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-200 transition-all"
                        >
                            <div className="text-2xl mb-3">{feature.icon}</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-600 to-red-600 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Hemen Denemeye Başlayın</h2>
                    <p className="text-orange-100 text-lg mb-8">Ücretsiz hesap oluşturun ve tüm özellikleri keşfedin.</p>
                    <button
                        onClick={onSignup || onBack}
                        className="px-8 py-4 bg-white text-orange-600 rounded-xl text-lg font-bold shadow-lg hover:bg-orange-50 transition-all transform hover:-translate-y-1"
                    >
                        Ücretsiz Başla →
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Lukid AI. Tüm hakları saklıdır.
                </div>
            </footer>
        </div>
    );
};

export default FeaturesPage;
