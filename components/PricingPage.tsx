
import React from 'react';
import { motion } from 'framer-motion';

interface PricingPageProps {
    onBack: () => void;
    onSignup?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSignup }) => {
    const freeFeatures = [
        "Sınırsız gözlem kaydı",
        "Yapay zeka analizi (Maarif Modeli)",
        "Otomatik PDF raporlar",
        "Pedagojik AI Asistan",
        "Sınıf ve çocuk yönetimi",
        "Medya galerisi",
        "Yoklama takibi",
        "Dashboard ve özet görünümü",
        "Çoklu dil desteği (TR/EN)"
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
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/20 text-white text-sm font-semibold">
                            Fiyatlandırma
                        </span>
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4">
                            Tamamen Ücretsiz
                        </h1>
                        <p className="text-green-100 text-xl max-w-2xl mx-auto">
                            Lukid AI, tüm özelliklerini ücretsiz olarak sunar. Gizli ücret yok, kredi kartı gerekmez.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Pricing Card */}
            <div className="max-w-lg mx-auto px-4 -mt-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">Ücretsiz Plan</h2>
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-5xl font-extrabold text-white">₺0</span>
                            <span className="text-orange-200 text-lg">/ay</span>
                        </div>
                        <p className="text-orange-100 mt-2">Sonsuza kadar ücretsiz</p>
                    </div>

                    {/* Features */}
                    <div className="p-8">
                        <ul className="space-y-4">
                            {freeFeatures.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={onSignup || onBack}
                            className="w-full mt-8 px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-lg font-bold shadow-md transition-all transform hover:-translate-y-0.5"
                        >
                            Ücretsiz Hesap Oluştur
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto px-4 py-20">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Sıkça Sorulan Sorular</h2>

                <div className="space-y-4">
                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-2">Neden ücretsiz?</h3>
                        <p className="text-gray-600 text-sm">
                            Lukid AI, okul öncesi eğitimi herkes için erişilebilir kılmak amacıyla geliştirildi.
                            Önceliğimiz öğretmenlere yardımcı olmak. İleride premium özellikler eklenebilir ancak
                            temel özellikler her zaman ücretsiz kalacak.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-2">Verilerim güvende mi?</h3>
                        <p className="text-gray-600 text-sm">
                            Evet! Tüm verileriniz şifreli olarak Avrupa Birliği sunucularında saklanır.
                            KVKK ve GDPR uyumlu çalışıyoruz. Verileriniz asla üçüncü taraflarla paylaşılmaz.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-2">Sınırsız kullanım gerçekten var mı?</h3>
                        <p className="text-gray-600 text-sm">
                            Evet! Sınırsız gözlem, sınırsız çocuk profili, sınırsız rapor oluşturabilirsiniz.
                            Yapay zeka analizleri için de herhangi bir günlük limit yoktur.
                        </p>
                    </div>
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

export default PricingPage;
