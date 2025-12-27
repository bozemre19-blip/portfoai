import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { t, getLanguage, setLanguage, Language } from '../constants.clean';


// Çocuk Karakterleri Bileşeni
const KidsCharacters: React.FC<{ mouseX: number; mouseY: number }> = ({ mouseX, mouseY }) => {
  const kids = [
    { x: 65, y: 25, color: '#FF6B9D', hairColor: '#8B4789', name: 'Ayşe', skin: '#FFE4C4' },
    { x: 85, y: 30, color: '#4A90E2', hairColor: '#2C3E50', name: 'Ahmet', skin: '#F5D5C3' },
    { x: 70, y: 65, color: '#50C878', hairColor: '#CD853F', name: 'Zeynep', skin: '#FFDAB9' },
    { x: 88, y: 70, color: '#FFB347', hairColor: '#8B7355', name: 'Mehmet', skin: '#F4E4D7' },
  ];

  const calculateHeadRotation = (kidX: number, kidY: number) => {
    // Convert percentage to pixels
    const kidPosX = (kidX / 100) * window.innerWidth * 0.5;
    const kidPosY = (kidY / 100) * window.innerHeight;

    // Fare ile çocuk arasındaki açıyı hesapla
    const angle = Math.atan2(mouseY - kidPosY, mouseX - kidPosX);
    const degrees = angle * (180 / Math.PI);

    // Rotasyonu yuvarla (5'erin katları) - daha smooth
    const roundedDegrees = Math.round(degrees / 5) * 5;

    // Göz hareketini sınırla ve yuvarla
    const eyeDistance = 6;
    const rawEyeX = Math.cos(angle) * eyeDistance;
    const rawEyeY = Math.sin(angle) * eyeDistance;

    // Göz pozisyonunu yuvarla (0.5'lik adımlar)
    const eyeX = Math.round(rawEyeX * 2) / 2;
    const eyeY = Math.round(rawEyeY * 2) / 2;

    return { rotation: roundedDegrees, eyeX, eyeY };
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {kids.map((kid) => {
        const { rotation, eyeX, eyeY } = calculateHeadRotation(kid.x, kid.y);

        return (
          <div
            key={kid.name}
            className="absolute"
            style={{
              left: `${kid.x}%`,
              top: `${kid.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="kid-float-wrapper"
              style={{
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <svg
                width="160"
                height="180"
                viewBox="0 0 160 180"
                className="drop-shadow-2xl filter hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              >
                <defs>
                  {/* Saç gradyanı */}
                  <linearGradient id={`hair-${kid.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={kid.hairColor} stopOpacity="1" />
                    <stop offset="100%" stopColor={kid.hairColor} stopOpacity="0.7" />
                  </linearGradient>
                  {/* Ten gradyanı */}
                  <radialGradient id={`skin-${kid.name}`}>
                    <stop offset="0%" stopColor={kid.skin} />
                    <stop offset="100%" stopColor={kid.skin} stopOpacity="0.9" />
                  </radialGradient>
                  {/* Kıyafet gradyanı */}
                  <linearGradient id={`clothes-${kid.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={kid.color} />
                    <stop offset="100%" stopColor={kid.color} stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Vücut (sabit - dönmüyor) */}
                <g>
                  {/* Gövde */}
                  <path
                    d="M 60 120 L 50 115 Q 45 110 45 125 L 45 160 Q 45 165 50 165 L 110 165 Q 115 165 115 160 L 115 125 Q 115 110 110 115 L 100 120"
                    fill={`url(#clothes-${kid.name})`}
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Sol Kol */}
                  <path
                    d="M 50 120 Q 30 125 28 145 Q 28 150 32 150 L 45 145"
                    fill={kid.skin}
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Sağ Kol */}
                  <path
                    d="M 110 120 Q 130 125 132 145 Q 132 150 128 150 L 115 145"
                    fill={kid.skin}
                    stroke="white"
                    strokeWidth="2"
                  />

                  {/* Eller */}
                  <circle cx="30" cy="150" r="8" fill={kid.skin} stroke="white" strokeWidth="2" />
                  <circle cx="130" cy="150" r="8" fill={kid.skin} stroke="white" strokeWidth="2" />
                </g>

                {/* Baş (DÖNEN KISIM - Fareyi takip ediyor!) */}
                <g transform={`rotate(${rotation * 0.08}, 80, 70)`} className="kid-head-smooth">
                  {/* Boyun */}
                  <rect x="70" y="95" width="20" height="20" rx="5" fill={kid.skin} stroke="white" strokeWidth="2" />

                  {/* Saç (arka) */}
                  <ellipse cx="80" cy="45" rx="45" ry="38" fill={`url(#hair-${kid.name})`} opacity="0.95" />
                  <path
                    d="M 40 50 Q 35 40 40 35 Q 45 30 50 35"
                    fill={`url(#hair-${kid.name})`}
                    opacity="0.9"
                  />
                  <path
                    d="M 120 50 Q 125 40 120 35 Q 115 30 110 35"
                    fill={`url(#hair-${kid.name})`}
                    opacity="0.9"
                  />

                  {/* Yüz */}
                  <ellipse cx="80" cy="70" rx="38" ry="42" fill={`url(#skin-${kid.name})`} stroke="white" strokeWidth="3" />

                  {/* Kulaklar */}
                  <ellipse cx="45" cy="70" rx="8" ry="12" fill={kid.skin} stroke="white" strokeWidth="2" />
                  <ellipse cx="115" cy="70" rx="8" ry="12" fill={kid.skin} stroke="white" strokeWidth="2" />

                  {/* Sol Göz Beyazı */}
                  <ellipse cx="65" cy="65" rx="10" ry="11" fill="white" stroke="#2C3E50" strokeWidth="2.5" className="kid-blink" />
                  {/* Sol Göz Bebeği */}
                  <circle
                    cx={65 + eyeX}
                    cy={65 + eyeY}
                    r="5"
                    fill="#2C3E50"
                    className="kid-blink"
                  />
                  {/* Sol Göz Parlama */}
                  <circle cx={67 + eyeX} cy={63 + eyeY} r="2" fill="white" opacity="0.8" className="kid-blink" />
                  {/* Sol Kirpikler */}
                  <path d="M 58 60 L 55 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" className="kid-blink" />
                  <path d="M 72 60 L 75 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" className="kid-blink" />

                  {/* Sağ Göz Beyazı */}
                  <ellipse cx="95" cy="65" rx="10" ry="11" fill="white" stroke="#2C3E50" strokeWidth="2.5" className="kid-blink" />
                  {/* Sağ Göz Bebeği */}
                  <circle
                    cx={95 + eyeX}
                    cy={65 + eyeY}
                    r="5"
                    fill="#2C3E50"
                    className="kid-blink"
                  />
                  {/* Sağ Göz Parlama */}
                  <circle cx={97 + eyeX} cy={63 + eyeY} r="2" fill="white" opacity="0.8" className="kid-blink" />
                  {/* Sağ Kirpikler */}
                  <path d="M 88 60 L 85 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" className="kid-blink" />
                  <path d="M 102 60 L 105 58" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" className="kid-blink" />

                  {/* Kaşlar */}
                  <path d="M 55 55 Q 65 52 75 55" stroke="#8B7355" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 85 55 Q 95 52 105 55" stroke="#8B7355" strokeWidth="3" fill="none" strokeLinecap="round" />

                  {/* Burun */}
                  <path d="M 80 72 L 78 80 L 82 80 Z" fill="#FFB6A3" opacity="0.6" />

                  {/* Mutlu Gülümseme */}
                  <path
                    d="M 60 85 Q 80 95 100 85"
                    stroke="#FF6B9D"
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Yanaklar (allık) */}
                  <ellipse cx="55" cy="78" rx="8" ry="6" fill="#FFB6C1" opacity="0.5" />
                  <ellipse cx="105" cy="78" rx="8" ry="6" fill="#FFB6C1" opacity="0.5" />

                  {/* Saç detayları (ön) */}
                  <path
                    d="M 50 45 Q 55 35 65 40"
                    fill={kid.hairColor}
                    opacity="0.8"
                  />
                  <path
                    d="M 110 45 Q 105 35 95 40"
                    fill={kid.hairColor}
                    opacity="0.8"
                  />
                </g>
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface AuthProps {
  initialMode?: 'login' | 'signup';
  emailConfirmed?: boolean;
  onEmailConfirmedDismiss?: () => void;
}

const Auth: React.FC<AuthProps> = ({ initialMode = 'login', emailConfirmed = false, onEmailConfirmedDismiss }) => {
  const [lang, setLang] = useState<Language>(getLanguage());
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false); // Email doğrulama gönderildi mi
  // Extra fields for teacher profile during sign up
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  // Mouse tracking for kids animation
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track mouse position with throttle
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (timeoutId) return; // Throttle: ignore if already scheduled

      timeoutId = setTimeout(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
        timeoutId = null;
      }, 50); // Update every 50ms max
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const changeLanguage = (l: Language) => {
    setLanguage(l);
    setLang(l);
  };

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
        setEmailSent(true);
        setMessage('Kayıt başarılı! Lütfen e-posta adresinize gönderilen doğrulama linkine tıklayın.');
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
      } else if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError('E-posta adresiniz henüz doğrulanmadı. Lütfen gelen kutunuzu kontrol edin.');
      } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
        setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      } else {
        setError(authError.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Language Switcher - Absolute Top Right */}


      {/* Sol Taraf - Bilgilendirme & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0c0f1d] via-[#161b33] to-[#0c0f1d] relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-slate-700/20 rounded-full blur-3xl"></div>
        </div>

        {/* Animated Kids Characters */}
        <KidsCharacters mouseX={mousePos.x} mouseY={mousePos.y} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12 relative">
            <div className="relative flex items-center gap-4">
              <img
                src="/logo.png"
                alt="Lukid AI"
                className="h-48 w-48 object-contain drop-shadow-2xl"
                draggable={false}
              />
              <div className="flex flex-col">
                <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-md">Lukid AI</h1>
                <span className="text-[#FF6B4A] font-bold tracking-widest text-sm mt-1 uppercase">SMART PORTFOLIO</span>
              </div>
            </div>
          </div>

          <p className="text-xl text-slate-300 mb-10 leading-relaxed max-w-md font-light">
            {t('landingHero')}
          </p>

          <div className="space-y-5 max-w-md">
            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-all">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-medium mb-0.5 text-white">{t('smartAnalysisTitle')}</h3>
                <p className="text-slate-400 text-sm">{t('smartAnalysisDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-all">
                <span className="text-2xl">🎨</span>
              </div>
              <div>
                <h3 className="font-medium mb-0.5 text-white">{t('digitalPortfolioTitle')}</h3>
                <p className="text-slate-400 text-sm">{t('digitalPortfolioDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group">
              <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-all">
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <h3 className="font-medium mb-0.5 text-white">{t('anyDeviceTitle')}</h3>
                <p className="text-slate-400 text-sm">{t('anyDeviceDesc')}</p>
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
            <div className="inline-flex items-center gap-3 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100/40 to-orange-100/40 rounded-full blur-2xl"></div>
              <img
                src="/logo.png"
                alt="Lukid AI"
                className="h-20 w-20 relative shadow-lg rounded-2xl"
                draggable={false}
              />
              <span className="relative text-3xl font-bold text-gray-800 tracking-tight">Lukid AI</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500"></div>

            {/* Language Switcher - Absolute Top Right INSIDE CARD */}
            <div className="absolute top-6 right-6 z-10 flex gap-2">
              <button
                onClick={() => changeLanguage('tr')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${lang === 'tr'
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
              >
                TR
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en'
                  ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
              >
                EN
              </button>
            </div>

            {/* Email Doğrulama Başarılı Banner */}
            {emailConfirmed && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-800">E-posta Doğrulandı!</p>
                    <p className="text-green-700 text-sm">Hesabınız aktif edildi. Şimdi giriş yapabilirsiniz.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onEmailConfirmedDismiss}
                    className="text-green-600 hover:text-green-800"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {emailSent ? '📧 E-posta Gönderildi!' : (isSignUp ? t('createAccountTitle') : t('welcomeTitle'))}
              </h2>
              <p className="text-gray-600 text-lg">
                {emailSent ? 'Hesabınızı aktifleştirmek için e-postanızı kontrol edin.' : (isSignUp ? t('createAccountDesc') : t('signInDesc'))}
              </p>
            </div>

            {emailSent ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-700 mb-4">
                  <strong>{email}</strong> adresine doğrulama linki gönderdik.
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  E-postanızı kontrol edin ve "E-postamı Doğrula" linkine tıklayın. Spam klasörünü de kontrol etmeyi unutmayın.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setIsSignUp(false);
                    setMessage('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ← Giriş Yap sayfasına dön
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <label htmlFor="teacher-first-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-indigo-600">👤</span> {t('yourName')}
                        </label>
                        <input
                          id="teacher-first-name"
                          name="teacher-first-name"
                          type="text"
                          autoComplete="given-name"
                          required={isSignUp}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 placeholder-gray-400 hover:border-blue-200 hover:shadow-md"
                          placeholder={t('yourName')}
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="relative group">
                        <label htmlFor="teacher-last-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <span className="text-indigo-600">👤</span> {t('yourSurname')}
                        </label>
                        <input
                          id="teacher-last-name"
                          name="teacher-last-name"
                          type="text"
                          autoComplete="family-name"
                          required={isSignUp}
                          className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-900 placeholder-gray-400 hover:border-blue-200 hover:shadow-md"
                          placeholder={t('yourSurname')}
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label htmlFor="school-name" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-indigo-600">🏫</span> {t('schoolName')}
                      </label>
                      <input
                        id="school-name"
                        name="school-name"
                        type="text"
                        autoComplete="organization"
                        required={isSignUp}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 hover:border-indigo-300 hover:shadow-md"
                        placeholder={t('schoolName')}
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="relative group">
                  <label htmlFor="email-address" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">📧</span> {t('emailLabel')}
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
                    <span className="text-blue-500">🔒</span> {t('passwordLabel')}
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
                  className="group relative w-full py-4 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center justify-center gap-2 text-lg">
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? t('createAccountTitle') : t('signInAction')}</span>
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); setError(''); }}
                className="text-indigo-600 hover:text-indigo-700 font-semibold text-base transition-all hover:underline decoration-2 underline-offset-4"
              >
                {isSignUp ? t('haveAccountBtn') : t('noAccountBtn')}
              </button>
            </div>

            {/* Security badges */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="text-green-500 text-base">🔒</span>
                  <span className="font-medium">{t('secureSSL')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500 text-base">🛡️</span>
                  <span className="font-medium">{t('secureBadge')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-500 text-base">⚡</span>
                  <span className="font-medium">{t('fastBadge')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>{t('footerRights')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
