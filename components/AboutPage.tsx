
import React from 'react';
import { motion } from 'framer-motion';

interface AboutPageProps {
    onBack: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
    const values = [
        {
            icon: "🎯",
            title: "Odak",
            description: "Öğretmenlerin asıl işlerine - çocuklara - odaklanabilmesi için evrak yükünü minimuma indiriyoruz."
        },
        {
            icon: "🔒",
            title: "Güven",
            description: "Verileriniz en üst düzey güvenlik standartlarıyla korunur. Gizliliğiniz bizim önceliğimizdir."
        },
        {
            icon: "🚀",
            title: "Yenilik",
            description: "Yapay zeka teknolojisini eğitimin hizmetine sunarak daha iyi sonuçlar elde ediyoruz."
        },
        {
            icon: "💚",
            title: "Empati",
            description: "Her çocuğun biricik olduğuna inanıyoruz."
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

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-orange-50 via-white to-red-50 py-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold">
                            �🇷 Türkiye Yüzyılı Maarif Modeli Uyumlu
                        </span>
                        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl mb-6">
                            Öğretmenlere <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">Süper Güç</span> Veriyoruz
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Lukid AI, <strong>Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı</strong>'na uygun çalışan,
                            Türkiye'nin ilk yapay zeka destekli dijital portfolyo aracıdır.
                        </p>
                    </motion.div>
                </div>
            </div>



            {/* Story Section */}
            <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">📖</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Hikayemiz</h2>
                        </div>

                        <div className="space-y-6 text-gray-600 leading-relaxed">
                            <p>
                                <strong className="text-gray-900">2024 yılında</strong>, okul öncesi eğitimde çalışan öğretmenlerin karşılaştığı en büyük sorunu çözmek için yola çıktık:
                                <em className="text-orange-600"> Sonsuz evrak işleri ve yetersiz zaman.</em>
                            </p>

                            <p>
                                Araştırmalarımız gösterdi ki, bir okul öncesi öğretmeni günlük çalışma süresinin <strong>%40'ından fazlasını</strong> gözlem notları almak,
                                gelişim raporları hazırlamak ve veli iletişimi kurmak için harcıyor. Bu da demek oluyor ki, çocuklarla kaliteli vakit geçirmek için gereken
                                zaman ve enerji ciddi şekilde azalıyor.
                            </p>

                            <p>
                                Lukid AI olarak biz, <strong>yapay zeka teknolojisini öğretmenlerin yerine geçmek için değil, onların en güçlü yardımcısı yapmak için</strong> kullanıyoruz.
                                Geliştirdiğimiz akıllı algoritmalar, kısa sesli veya yazılı notlarınızı analiz ederek, MEB müfredatına uygun, pedagojik açıdan zengin gelişim raporlarına dönüştürür.
                            </p>

                            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                                <p className="text-orange-800 italic">
                                    "Her çocuk bir dünya, her an bir fırsat. Öğretmenlerin bu fırsatları en iyi şekilde değerlendirmesi için teknoloji bir araç olmalı, engel değil."
                                </p>
                                <p className="text-orange-600 font-medium mt-2">— Lukid AI Ekibi</p>
                            </div>
                        </div>
                    </div>

                    {/* Maarif Model Feature Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-8 text-white">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-3xl">🇹🇷</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Maarif Modeli Uyumlu Yapay Zeka</h3>
                            <p className="text-orange-100 leading-relaxed">
                                Yapay zekamız, <strong className="text-white">Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı (2024)</strong>'na
                                göre eğitilmiştir. Gözlem notlarınızı 7 temel beceri alanına göre analiz eder ve öğrenme çıktılarıyla eşleştirir.
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-8 text-white">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                                <span className="text-3xl">🤖</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Pedagojik AI Asistan</h3>
                            <p className="text-blue-100 leading-relaxed">
                                Öğretmenler, Maarif Modeli'ne göre eğitilmiş <strong className="text-white">yapay zeka asistanıyla sohbet edebilir</strong>.
                                Etkinlik önerileri, gelişim takibi ve pedagojik sorularınıza anında cevap alın.
                            </p>
                        </div>
                    </div>

                    {/* Values Section */}
                    <div className="mb-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Değerlerimiz</h2>
                            <p className="text-gray-600">Her kararımızın arkasında bu ilkeler var.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {values.map((value, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-white rounded-xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all"
                                >
                                    <div className="text-3xl mb-3">{value.icon}</div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Mission Section */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 sm:p-12 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <h2 className="text-2xl font-bold">Misyonumuz</h2>
                        </div>

                        <p className="text-gray-300 text-lg leading-relaxed mb-8">
                            Türkiye'deki tüm okul öncesi eğitimcilere yapay zeka destekli, kullanımı kolay ve güvenilir bir platform sunarak:
                        </p>

                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                                <div>
                                    <h4 className="font-semibold text-white">Zaman Kazandırmak</h4>
                                    <p className="text-gray-400">Öğretmenlerin evrak işlerine harcadığı süreyi %80 oranında azaltmak.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                                <div>
                                    <h4 className="font-semibold text-white">Veri Odaklı Gelişim</h4>
                                    <p className="text-gray-400">Her çocuğun gelişim yolculuğunu bilimsel ve objektif verilerle takip etmek.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                                <div>
                                    <h4 className="font-semibold text-white">Güçlü İletişim</h4>
                                    <p className="text-gray-400">Ebeveynler ve okul arasındaki güven bağını şeffaf, anlaşılır raporlarla güçlendirmek.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>

            {/* CTA Section */}
            <div className="bg-orange-600 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Siz de Aramıza Katılın</h2>
                    <p className="text-orange-100 text-lg mb-8">Binlerce öğretmen gibi siz de Lukid AI ile tanışın.</p>
                    <button
                        onClick={onBack}
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

export default AboutPage;
