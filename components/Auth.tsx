import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { t } from '../constants.clean';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // Extra fields for teacher profile during sign up
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    let authError = null;

    if (isSignUp) {
      // Require teacher name/surname/school on sign up
      if (!firstName.trim() || !lastName.trim() || !schoolName.trim()) {
        setError(t('missingTeacherFields'));
        setLoading(false);
        return;
      }
      // Handle Sign Up with metadata
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            school_name: schoolName.trim(),
          },
        },
      });
      authError = error;
      if (!error) {
        setMessage(t('signUpSuccess'));
      }
    } else {
      // Handle Sign In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authError = error;
      // On success, onAuthStateChange in App.tsx will handle the rest.
    }
    
    if (authError) {
      if (authError.message.toLowerCase().includes('invalid api key')) {
        setError(t('apiKeyError'));
      } else {
        setError(authError.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Sol Taraf - Bilgilendirme & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12 relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
            <div className="relative">
              <img
                src="/portfoai-logo.svg"
                alt="PortfoAI"
                className="h-36 drop-shadow-[0_0_40px_rgba(96,165,250,0.5)]"
                draggable={false}
              />
            </div>
          </div>
          
          <p className="text-2xl text-white/95 mb-10 leading-relaxed max-w-md font-light">
            Yapay zeka destekli gözlem, analiz ve portfolyo yönetimi ile çocukların gelişimini profesyonelce takip edin.
          </p>

          <div className="space-y-5 max-w-md">
            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-400/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400/30 transition-all">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">Akıllı Gözlem Analizi</h3>
                <p className="text-white/85 text-base">Yapay zeka ile otomatik değerlendirme ve öneriler</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-400/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400/30 transition-all">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">Dijital Portfolyo</h3>
                <p className="text-white/85 text-base">Çocukların ürünlerini ve gelişimini dijital ortamda saklayın</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-400/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400/30 transition-all">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-lg">Her Yerden Erişim</h3>
                <p className="text-white/85 text-base">Telefon, tablet veya bilgisayardan kolayca ulaşın</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Taraf - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo - Mobile */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-block relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-200/40 to-blue-200/40 rounded-full blur-2xl"></div>
              <img
                src="/portfoai-logo.svg"
                alt="PortfoAI"
                className="h-20 mx-auto relative drop-shadow-xl"
                draggable={false}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500"></div>
            
            <div className="mb-10">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {isSignUp ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
              </h2>
              <p className="text-gray-600 text-lg">
                {isSignUp ? 'Yeni bir hesap oluşturun ve başlayın' : 'Hesabınıza giriş yapın'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <label htmlFor="teacher-first-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-indigo-600">👤</span> Adınız
                      </label>
                      <input
                        id="teacher-first-name"
                        name="teacher-first-name"
                        type="text"
                        autoComplete="given-name"
                        required={isSignUp}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                        placeholder="Adınız"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="relative group">
                      <label htmlFor="teacher-last-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-indigo-600">👤</span> Soyadınız
                      </label>
                      <input
                        id="teacher-last-name"
                        name="teacher-last-name"
                        type="text"
                        autoComplete="family-name"
                        required={isSignUp}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                        placeholder="Soyadınız"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <label htmlFor="school-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-indigo-600">🏫</span> Okul Adı
                    </label>
                    <input
                      id="school-name"
                      name="school-name"
                      type="text"
                      autoComplete="organization"
                      required={isSignUp}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                      placeholder="Okul adı"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="relative group">
                <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-indigo-600">📧</span> E-posta Adresi
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative group">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-indigo-600">🔒</span> Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {message && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 text-emerald-700 rounded-xl text-sm font-semibold flex items-center gap-3 animate-bounce-once shadow-lg">
                  <span className="text-2xl">✓</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-3 animate-shake shadow-lg">
                  <span className="text-2xl">✕</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2 text-lg">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
                      <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setError(''); }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-base transition-all hover:underline decoration-2 underline-offset-4"
              >
                {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>

            {/* Security badges */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-500 text-base">🔒</span>
                  <span className="font-medium">SSL Şifreli</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500 text-base">🛡️</span>
                  <span className="font-medium">Güvenli</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-500 text-base">⚡</span>
                  <span className="font-medium">Hızlı</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 PortfoAI - Tüm hakları saklıdır</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
