
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQPageProps {
    onBack: () => void;
}

interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

const FAQPage: React.FC<FAQPageProps> = ({ onBack }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const categories = [
        { id: 'all', label: 'Tümü' },
        { id: 'general', label: 'Genel' },
        { id: 'features', label: 'Özellikler' },
        { id: 'ai', label: 'Yapay Zeka' },
        { id: 'security', label: 'Güvenlik' },
        { id: 'pricing', label: 'Fiyatlandırma' }
    ];

    const faqs: FAQItem[] = [
        // Genel
        {
            category: 'general',
            question: 'Lukid AI nedir?',
            answer: 'Lukid AI, okul öncesi öğretmenleri için geliştirilmiş yapay zeka destekli bir çocuk gelişim takip platformudur. Gözlem notları almanızı, gelişim raporları oluşturmanızı ve sınıf yönetiminizi kolaylaştırır.'
        },
        {
            category: 'general',
            question: 'Lukid AI\'ı kimler kullanabilir?',
            answer: 'Okul öncesi öğretmenleri, anaokulu yöneticileri, kreş çalışanları ve çocuk gelişimi uzmanları Lukid AI\'ı kullanabilir. Platform özellikle 0-6 yaş grubu çocuklarla çalışan eğitimciler için tasarlanmıştır.'
        },
        {
            category: 'general',
            question: 'Mobil cihazlarda kullanabilir miyim?',
            answer: 'Evet! Lukid AI hem web tarayıcısından hem de iOS ve Android cihazlardan erişilebilir. Sınıf içinde tablet veya telefonunuzla kolayca gözlem kaydedebilirsiniz.'
        },
        {
            category: 'general',
            question: 'Türkçe dışında dil desteği var mı?',
            answer: 'Evet, Lukid AI Türkçe ve İngilizce dillerini destekler. Ayarlar menüsünden dil tercihlerinizi değiştirebilirsiniz.'
        },

        // Özellikler
        {
            category: 'features',
            question: 'Sesli gözlem kaydı yapabilir miyim?',
            answer: 'Evet! Sınıf içinde yazı yazmaya vakit bulamadığınızda sesli gözlem kaydı yapabilirsiniz. Sesiniz otomatik olarak metne dönüştürülür ve yapay zeka tarafından analiz edilir.'
        },
        {
            category: 'features',
            question: 'PDF raporlar nasıl çalışır?',
            answer: 'Her çocuk için "Rapor Oluştur" butonuna tıklayarak o çocuğun tüm gözlemlerini, gelişim alanlarına göre analizlerini ve ilerleme grafiklerini içeren profesyonel bir PDF raporu anında oluşturabilirsiniz.'
        },
        {
            category: 'features',
            question: 'Kaç sınıf ve çocuk ekleyebilirim?',
            answer: 'Herhangi bir sınır yoktur. İstediğiniz kadar sınıf oluşturabilir ve sınırsız sayıda çocuk profili ekleyebilirsiniz.'
        },
        {
            category: 'features',
            question: 'Fotoğraf ve video yükleyebilir miyim?',
            answer: 'Evet! Medya Galerisi özelliği ile çocukların etkinlik fotoğraflarını ve videolarını yükleyebilirsiniz. Her medya dosyasına gözlem notu da ekleyebilirsiniz.'
        },
        {
            category: 'features',
            question: 'Yoklama takibi nasıl yapılır?',
            answer: 'Her gün için yoklama alabilir, devam eden veya gelmeyen çocukları işaretleyebilir, devamsızlık nedenlerini kaydedebilirsiniz. Ay sonunda otomatik devamsızlık raporu oluşturulur.'
        },

        // Yapay Zeka
        {
            category: 'ai',
            question: 'Yapay zeka analizi nasıl çalışır?',
            answer: 'Gözlem notlarınız, Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı\'na göre eğitilmiş yapay zeka tarafından analiz edilir. Her gözlem, 7 temel beceri alanına (Sosyal-Duygusal, Dil, Bilişsel, Motor, Öz Bakım, Matematik, Fen-Doğa) göre otomatik olarak etiketlenir.'
        },
        {
            category: 'ai',
            question: 'AI Asistan ne işe yarar?',
            answer: 'Pedagojik AI Asistan ile sohbet edebilir, etkinlik önerileri alabilir, pedagojik sorularınıza anında cevap bulabilirsiniz. Asistan, Maarif Modeli\'ne göre eğitilmiştir ve okul öncesi eğitim hakkında uzman bilgisi sunar.'
        },
        {
            category: 'ai',
            question: 'Yapay zeka önerilerine güvenebilir miyim?',
            answer: 'Yapay zeka önerileri, pedagojik ilkelere ve MEB müfredatına dayalı olarak üretilir. Ancak, bu öneriler öğretmenin profesyonel değerlendirmesinin yerini almaz; size yardımcı bir araç olarak tasarlanmıştır.'
        },

        // Güvenlik
        {
            category: 'security',
            question: 'Verilerim güvende mi?',
            answer: 'Evet! Tüm verileriniz 256-bit SSL şifreleme ile korunur ve Avrupa Birliği sınırları içindeki sunucularda (AWS) saklanır. KVKK ve GDPR düzenlemelerine tam uyum sağlıyoruz.'
        },
        {
            category: 'security',
            question: 'Çocuklara ait veriler kimlerle paylaşılır?',
            answer: 'Çocuk verileri yalnızca hesap sahibi (öğretmen) tarafından görüntülenebilir. Hiçbir koşulda üçüncü taraflarla paylaşılmaz veya reklam amaçlı kullanılmaz.'
        },
        {
            category: 'security',
            question: 'Verilerimi silebilir miyim?',
            answer: 'Evet, istediğiniz zaman Ayarlar menüsünden hesabınızı ve tüm verilerinizi kalıcı olarak silebilirsiniz. Silme işlemi geri alınamaz.'
        },
        {
            category: 'security',
            question: 'Yapay zeka, verilerimi eğitim için kullanıyor mu?',
            answer: 'Hayır! Çocuklara ait gözlem verileri, yapay zeka modellerini eğitmek için asla kullanılmaz. Verileriniz yalnızca size hizmet sunmak için işlenir.'
        },

        // Fiyatlandırma
        {
            category: 'pricing',
            question: 'Lukid AI gerçekten ücretsiz mi?',
            answer: 'Evet! Lukid AI tüm özellikleriyle tamamen ücretsizdir. Gizli ücret yoktur, kredi kartı bilgisi istenmez.'
        },
        {
            category: 'pricing',
            question: 'İleride ücretli olacak mı?',
            answer: 'Temel özellikler her zaman ücretsiz kalacak. İleride eklenen premium özellikler için ücret talep edilebilir, ancak mevcut özellikleri kullanmaya devam edebilirsiniz.'
        },
        {
            category: 'pricing',
            question: 'Okul olarak toplu lisans alabilir miyiz?',
            answer: 'Kurumsal kullanım için özel çözümler sunabiliriz. Detaylı bilgi için info@lukidai.com adresinden bizimle iletişime geçin.'
        }
    ];

    const filteredFaqs = activeCategory === 'all'
        ? faqs
        : faqs.filter(faq => faq.category === activeCategory);

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
                            Yardım Merkezi
                        </span>
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4">
                            Sıkça Sorulan Sorular
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Lukid AI hakkında merak ettiğiniz her şeyin cevabını burada bulabilirsiniz.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Category Filter */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex flex-wrap justify-center gap-2">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category.id
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* FAQ List */}
            <div className="max-w-3xl mx-auto px-4 pb-20">
                <div className="space-y-3">
                    {filteredFaqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                                <svg
                                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-orange-50 border-t border-orange-100 py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-3">Sorunuz mu var?</h2>
                    <p className="text-gray-600 mb-6">Aradığınız cevabı bulamadıysanız, bize ulaşın.</p>
                    <a
                        href="mailto:info@lukidai.com"
                        className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Bize Yazın
                    </a>
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

export default FAQPage;
