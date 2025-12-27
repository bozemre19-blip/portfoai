
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface LandingPageProps {
    onLoginClick: () => void;
    onSignupClick: () => void;
    navigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onSignupClick, navigate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = React.useState(0);

    // Using logo colors: Orange (#FF6B4A approx from context) and dark navy

    const screenshots = [
        { id: 0, title: "Genel Bakış", src: "/screenshot-dashboard.png", alt: "Öğretmen Paneli" },
        { id: 1, title: "Sınıf Listesi", src: "/screenshot-students.png", alt: "Sınıf Yönetimi" },
        { id: 2, title: "Gelişim Detayı", src: "/screenshot-profile.png", alt: "Öğrenci Profili" }
    ];

    const features = [
        {
            title: "Hızlı Gözlem Kaydı",
            description: "Sınıf içinde kaybolmadan, saniyeler içinde sesli veya yazılı gözlem notları alın.",
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" stroke="#fff" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            color: "bg-blue-500" // Keeping generic feature colors distinct but could align if needed. Let's keep distinct for clarity.
        },
        {
            title: "Yapay Zeka Analizi",
            description: "Gözlemleriniz anında analiz edilir, gelişim alanlarına göre otomatik etiketlenir.",
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" stroke="#fff" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            color: "bg-orange-500" // Highlight AI with Orange 
        },
        {
            title: "Otomatik Raporlar",
            description: "Dönem sonu karmaşasına son. Tek tıkla detaylı gelişim raporları PDF olarak hazır.",
            icon: (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" stroke="#fff" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: "bg-emerald-500"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navbar */}
            <nav className="w-full bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center">
                            <img
                                src="/lukid-logo-navbar-v3.png"
                                alt="Lukid AI Logo"
                                className="h-14 w-auto -ml-2"
                            />
                            <span className="text-2xl font-bold tracking-tight -ml-2">
                                <span className="text-slate-900">Lukid</span>
                                <span className="text-orange-500"> AI</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onLoginClick}
                                className="text-gray-600 hover:text-orange-600 font-medium text-sm transition-colors"
                            >
                                Giriş Yap
                            </button>
                            <button
                                onClick={onSignupClick}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Ücretsiz Dene
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-grow">
                <div className="relative overflow-hidden pt-16 pb-32">
                    {/* Background Blobs - Updated Colors */}
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-sm font-semibold tracking-wide">
                                🚀 Okul Öncesi Öğretmenleri için Yeni Nesil Asistan
                            </div>
                            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-8">
                                Sınıfınızı <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">Yapay Zeka</span> ile <br /> Yönetin
                            </h1>
                            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 mb-10">
                                Gözlem notları, gelişim raporları ve veli iletişimi tek bir yerde.
                                Siz çocuklara odaklanın, evrak işlerini Lukid AI halletsin.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={onSignupClick}
                                    className="px-8 py-4 bg-orange-600 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-orange-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                                >
                                    Hemen Başla
                                </button>
                                <button
                                    onClick={() => navigate('features')}
                                    className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl text-lg font-bold shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all hover:text-orange-600"
                                >
                                    Keşfet
                                </button>
                            </div>
                        </motion.div>

                        {/* Hero Image Mockup */}
                        {/* Hero Image Mockup with Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mt-16 mx-auto max-w-5xl"
                        >
                            {/* Tabs */}
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {screenshots.map((shot, index) => (
                                    <button
                                        key={shot.id}
                                        onClick={() => setActiveTab(index)}
                                        className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === index
                                            ? "bg-white text-orange-600 shadow-md ring-1 ring-orange-100 transform scale-105"
                                            : "bg-white/50 text-gray-500 hover:bg-white hover:text-gray-700"
                                            }`}
                                    >
                                        {shot.title}
                                    </button>
                                ))}
                            </div>

                            {/* Window Frame */}
                            <div className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
                                <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-gray-400 flex-grow text-center font-mono">
                                        lukidai.com/app/{screenshots[activeTab].src.split('-')[1].replace('.png', '')}
                                    </div>
                                </div>

                                <div className="w-full aspect-video bg-gray-50 flex items-center justify-center overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                                    {screenshots.map((shot, index) => (
                                        <div
                                            key={shot.id}
                                            className={`absolute inset-0 transition-opacity duration-500 transform ${activeTab === index ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-95"
                                                }`}
                                        >
                                            <img
                                                src={shot.src}
                                                alt={shot.alt}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="bg-white py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-gray-900">Neden Lukid AI?</h2>
                            <p className="mt-4 text-lg text-gray-600">Modern öğretmenlerin süper gücü.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    whileHover={{ y: -5 }}
                                    className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-orange-100 hover:shadow-lg transition-all"
                                >
                                    <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-md`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl font-bold">Lukid AI</span>
                            </div>
                            <p className="text-gray-400 max-w-sm">
                                Çocuk gelişimi ve eğitim takibinde yapay zeka devrimi.
                                Öğretmenler ve ebeveynler için tasarlandı.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Ürün</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <button onClick={() => navigate('features')} className="hover:text-white transition-colors text-left">
                                        Özellikler
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('pricing')} className="hover:text-white transition-colors text-left">
                                        Fiyatlandırma
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('faq')} className="hover:text-white transition-colors text-left">
                                        SSS
                                    </button>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Proje</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <button onClick={() => navigate('about')} className="hover:text-white transition-colors text-left">
                                        Hakkımızda
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('contact')} className="hover:text-white transition-colors text-left">
                                        İletişim
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate('privacy')} className="hover:text-white transition-colors text-left">
                                        Gizlilik Politikası
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
                        &copy; {new Date().getFullYear()} Lukid AI. Tüm hakları saklıdır.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
