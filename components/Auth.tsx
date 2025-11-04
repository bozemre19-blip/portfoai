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
          <div className="mb-12">
            <div className="inline-block bg-white/20 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/10">
              <img
                src="/portfoai-logo.svg"
                alt="PortfoAI"
                className="h-32 drop-shadow-2xl"
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
            <div className="inline-block bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 shadow-lg">
              <img
                src="/portfoai-logo.svg"
                alt="PortfoAI"
                className="h-16 mx-auto"
                draggable={false}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isSignUp ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
              </h2>
              <p className="text-gray-600">
                {isSignUp ? 'Yeni bir hesap oluşturun ve başlayın' : 'Hesabınıza giriş yapın'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="teacher-first-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Adınız
                      </label>
                      <input
                        id="teacher-first-name"
                        name="teacher-first-name"
                        type="text"
                        autoComplete="given-name"
                        required={isSignUp}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="Adınız"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="teacher-last-name" className="block text-sm font-medium text-gray-700 mb-2">
                        Soyadınız
                      </label>
                      <input
                        id="teacher-last-name"
                        name="teacher-last-name"
                        type="text"
                        autoComplete="family-name"
                        required={isSignUp}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                        placeholder="Soyadınız"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="school-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Okul Adı
                    </label>
                    <input
                      id="school-name"
                      name="school-name"
                      type="text"
                      autoComplete="organization"
                      required={isSignUp}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                      placeholder="Okul adı"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta Adresi
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {message && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
                  ✓ {message}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
                  ✕ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Yükleniyor...' : (isSignUp ? 'Hesap Oluştur' : 'Giriş Yap')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setError(''); }}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
              >
                {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
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
