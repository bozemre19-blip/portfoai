
import React from 'react';
import { motion } from 'framer-motion';

interface PrivacyPageProps {
    onBack: () => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-4">
                            Gizlilik Politikası
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Verilerinizin güvenliği bizim için her şeyden önemli.
                        </p>
                        <p className="text-gray-500 text-sm mt-4">Son Güncelleme: 27 Aralık 2024</p>
                    </motion.div>
                </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-orange-50 border-b border-orange-100 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Kısaca Özetlemek Gerekirse</h3>
                            <ul className="text-gray-600 space-y-1 text-sm">
                                <li>✓ Verilerinizi asla satmıyor veya reklam amaçlı kullanmıyoruz</li>
                                <li>✓ Çocuk verileri tamamen sizin kontrolünüzde ve şifreli olarak saklanıyor</li>
                                <li>✓ İstediğiniz zaman verilerinizi silebilirsiniz</li>
                                <li>✓ KVKK ve GDPR uyumlu çalışıyoruz</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    {/* Section 1 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <span className="text-blue-600 font-bold">1</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">1. Giriş</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Lukid AI ("biz", "şirketimiz", "platformumuz") olarak, kullanıcılarımızın gizliliğine büyük önem veriyoruz.
                                Bu Gizlilik Politikası, web sitemizi (<strong>lukidai.com</strong>) ve mobil uygulamamızı kullanırken
                                kişisel verilerinizin nasıl toplandığını, işlendiğini, saklandığını ve korunduğunu açıklar.
                            </p>
                            <p>
                                Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız. Politikamızla ilgili sorularınız için
                                <a href="mailto:info@lukidai.com" className="text-orange-600 hover:text-orange-700 font-medium"> info@lukidai.com</a> adresinden
                                bizimle iletişime geçebilirsiniz.
                            </p>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <span className="text-green-600 font-bold">2</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">2. Toplanan Veriler</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>Hizmetlerimizi sunabilmek için aşağıdaki verileri toplarız:</p>

                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Hesap Bilgileri</h4>
                                    <p className="text-sm">Adınız, soyadınız, e-posta adresiniz ve şifreniz (hash'lenmiş olarak saklanır). Bu bilgiler hesabınızı oluşturmak ve yönetmek için gereklidir.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Çocuk ve Sınıf Verileri</h4>
                                    <p className="text-sm">Uygulamaya girdiğiniz öğrenci isimleri, sınıf bilgileri, gelişim gözlemleri, fotoğraflar ve videolar. <strong className="text-orange-600">Bu veriler yalnızca sizin erişiminize açıktır</strong> ve başka kullanıcılarla paylaşılmaz.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Kullanım Verileri</h4>
                                    <p className="text-sm">Uygulamayı nasıl kullandığınıza dair anonim istatistikler (örn. hangi özellikler en sık kullanılıyor). Bu veriler kimliğinizle ilişkilendirilmez.</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-2">Teknik Veriler</h4>
                                    <p className="text-sm">IP adresi, tarayıcı türü, cihaz bilgisi ve çerezler. Bu veriler güvenlik ve performans optimizasyonu için kullanılır.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                <span className="text-purple-600 font-bold">3</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">3. Verilerin Kullanımı</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>Topladığımız verileri şu amaçlarla kullanırız:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span><strong>Hizmet Sunumu:</strong> Hesabınızı yönetmek, gözlem kayıtlarınızı saklamak ve gelişim raporları oluşturmak.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span><strong>Yapay Zeka Analizi:</strong> Gözlem notlarınızı analiz ederek otomatik değerlendirmeler ve öneriler sunmak.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span><strong>İletişim:</strong> Önemli güncellemeler, güvenlik bildirimleri ve (izin verirseniz) yeni özellikler hakkında sizi bilgilendirmek.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-500 mt-1">✓</span>
                                    <span><strong>Geliştirme:</strong> Platformu iyileştirmek ve yeni özellikler geliştirmek için anonim kullanım verilerini analiz etmek.</span>
                                </li>
                            </ul>

                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
                                <p className="text-red-800 font-medium">Asla Yapmadıklarımız:</p>
                                <ul className="text-red-700 text-sm mt-2 space-y-1">
                                    <li>• Verilerinizi üçüncü taraflara satmayız</li>
                                    <li>• Reklam amaçlı profilleme yapmayız</li>
                                    <li>• Çocuk verilerini yapay zeka modellerini eğitmek için kullanmayız</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 4 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <span className="text-orange-600 font-bold">4</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">4. Veri Güvenliği</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>Verilerinizi korumak için endüstri standardı güvenlik önlemleri uyguluyoruz:</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">SSL/TLS Şifreleme</h4>
                                    <p className="text-sm">Tüm veri aktarımları 256-bit SSL şifreleme ile korunur.</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Güvenli Altyapı</h4>
                                    <p className="text-sm">Supabase (AWS tabanlı) güvenli veritabanı altyapısı kullanıyoruz.</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Şifre Güvenliği</h4>
                                    <p className="text-sm">Şifreler bcrypt algoritması ile hash'lenerek saklanır.</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Veri Lokasyonu</h4>
                                    <p className="text-sm">Verileriniz Avrupa Birliği sınırları içindeki sunucularda barındırılır.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <span className="text-yellow-600 font-bold">5</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">5. Çocukların Gizliliği</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Lukid AI, <strong>öğretmenler ve ebeveynler tarafından kullanılmak üzere</strong> tasarlanmıştır.
                                Platformumuza çocuklar doğrudan erişmez veya hesap oluşturmaz.
                            </p>
                            <p>
                                Uygulamaya girilen çocuk verileri (isim, gözlemler, fotoğraflar):
                            </p>
                            <ul className="space-y-2 ml-4">
                                <li>• Tamamen kullanıcının (öğretmen/ebeveyn) kontrolündedir</li>
                                <li>• Yalnızca hesap sahibi tarafından görüntülenebilir</li>
                                <li>• Kullanıcının isteği üzerine kalıcı olarak silinebilir</li>
                                <li>• Hiçbir şekilde üçüncü taraflarla paylaşılmaz</li>
                            </ul>
                            <p className="text-orange-600 font-medium">
                                Çocuk verilerinin gizliliği konusunda COPPA (ABD) ve GDPR (AB) düzenlemelerine uygun hareket ediyoruz.
                            </p>
                        </div>
                    </section>

                    {/* Section 6 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <span className="text-indigo-600 font-bold">6</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">6. Haklarınız</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-blue-500 font-bold">1</span>
                                    <div>
                                        <strong className="text-gray-900">Erişim Hakkı:</strong> Hangi verilerinizin tutulduğunu öğrenme
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-blue-500 font-bold">2</span>
                                    <div>
                                        <strong className="text-gray-900">Düzeltme Hakkı:</strong> Yanlış veya eksik verilerin düzeltilmesini isteme
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-blue-500 font-bold">3</span>
                                    <div>
                                        <strong className="text-gray-900">Silme Hakkı:</strong> Verilerinizin kalıcı olarak silinmesini isteme
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-blue-500 font-bold">4</span>
                                    <div>
                                        <strong className="text-gray-900">Taşınabilirlik Hakkı:</strong> Verilerinizi indirme ve başka bir platforma aktarma
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="text-blue-500 font-bold">5</span>
                                    <div>
                                        <strong className="text-gray-900">İtiraz Hakkı:</strong> Veri işlemeye itiraz etme
                                    </div>
                                </div>
                            </div>

                            <p className="mt-4">
                                Bu haklarınızı kullanmak için <a href="mailto:info@lukidai.com" className="text-orange-600 hover:text-orange-700 font-medium">info@lukidai.com</a> adresine
                                e-posta gönderebilir veya uygulama içi Ayarlar menüsünden talepte bulunabilirsiniz.
                            </p>
                        </div>
                    </section>

                    {/* Section 7 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                <span className="text-pink-600 font-bold">7</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">7. Çerezler</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>
                                Web sitemiz ve uygulamamız, deneyiminizi iyileştirmek için çerezler kullanır:
                            </p>
                            <ul className="space-y-2 ml-4">
                                <li><strong>Zorunlu Çerezler:</strong> Oturum yönetimi ve güvenlik için gereklidir.</li>
                                <li><strong>Analitik Çerezler:</strong> Anonim kullanım istatistikleri toplar (devre dışı bırakılabilir).</li>
                            </ul>
                            <p>
                                Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz.
                            </p>
                        </div>
                    </section>

                    {/* Section 8 */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                                <span className="text-teal-600 font-bold">8</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">8. İletişim</h2>
                        </div>
                        <div className="text-gray-600 leading-relaxed space-y-4">
                            <p>Gizlilik politikamız veya veri koruma uygulamalarımız hakkında sorularınız için:</p>

                            <div className="bg-gray-50 rounded-xl p-6">
                                <p className="font-semibold text-gray-900 mb-3">Lukid AI - Veri Koruma Ekibi</p>
                                <p>E-posta: <a href="mailto:info@lukidai.com" className="text-orange-600 hover:text-orange-700 font-medium">info@lukidai.com</a></p>
                                <p>Web: <a href="https://lukidai.com" className="text-orange-600 hover:text-orange-700 font-medium">lukidai.com</a></p>
                            </div>

                            <p className="text-sm text-gray-500">
                                Bu politikada yapılacak önemli değişiklikler, e-posta veya uygulama içi bildirim yoluyla size iletilecektir.
                            </p>
                        </div>
                    </section>

                </motion.div>
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

export default PrivacyPage;
