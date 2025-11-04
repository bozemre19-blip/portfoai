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

  const marqueeItems = Array.from({ length: 28 }, () => 'Gözlem · Portfolyo · Yapay Zeka');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animasyonlu gradient arka plan - Kurumsal tonlar */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900"></div>
      
      {/* Hareketli shape'ler - Daha subtle */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top moving stripe */}
      <div className="marquee marquee--top" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
        <div className="marquee-track">
          <div className="marquee-line" style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {marqueeItems.map((txt, i) => (<span key={`mt1-${i}`} className="inline-flex items-center gap-2">✨ {txt}</span>))}
          </div>
          <div className="marquee-line" aria-hidden="true" style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {marqueeItems.map((txt, i) => (<span key={`mt2-${i}`} className="inline-flex items-center gap-2">✨ {txt}</span>))}
          </div>
        </div>
      </div>
      {/* Bottom moving stripe */}
      <div className="marquee marquee--bottom" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
        <div className="marquee-track marquee-track--reverse">
          <div className="marquee-line" style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {marqueeItems.map((txt, i) => (<span key={`mb1-${i}`} className="inline-flex items-center gap-2">🎨 {txt}</span>))}
          </div>
          <div className="marquee-line" aria-hidden="true" style={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {marqueeItems.map((txt, i) => (<span key={`mb2-${i}`} className="inline-flex items-center gap-2">🎨 {txt}</span>))}
          </div>
        </div>
      </div>
      
      <div className="relative z-10 w-full flex justify-center mb-6 md:mb-8">
        <div className="relative group animate-float">
          <div className="absolute -inset-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition duration-500"></div>
          <img
            src="/portfoai-logo.svg"
            alt="PortfoAI"
            className="relative h-20 sm:h-24 md:h-28 select-none drop-shadow-2xl"
            draggable={false}
          />
        </div>
      </div>
      <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 -mt-4 md:-mt-6">
        <div className="max-w-md w-full space-y-8 p-10 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 animate-slide-up">
          <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-800">
            {isSignUp ? '🌟 ' + t('signUpTitle') : '👋 ' + t('signInTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            {isSignUp ? t('signUpDescription') : t('signInDescription')}
          </p>
          </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            {isSignUp && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label htmlFor="teacher-first-name" className="sr-only">{t('teacherFirstName')}</label>
                    <input
                      id="teacher-first-name"
                      name="teacher-first-name"
                      type="text"
                      autoComplete="given-name"
                      required={isSignUp}
                      className="appearance-none relative block w-full px-4 py-3 border-2 border-indigo-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 sm:text-sm"
                      placeholder={"👤 " + t('teacherFirstName')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-last-name" className="sr-only">{t('teacherLastName')}</label>
                    <input
                      id="teacher-last-name"
                      name="teacher-last-name"
                      type="text"
                      autoComplete="family-name"
                      required={isSignUp}
                      className="appearance-none relative block w-full px-4 py-3 border-2 border-indigo-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 sm:text-sm"
                      placeholder={"👤 " + t('teacherLastName')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="school-name" className="sr-only">{t('schoolName')}</label>
                  <input
                    id="school-name"
                    name="school-name"
                    type="text"
                    autoComplete="organization"
                    required={isSignUp}
                    className="appearance-none relative block w-full px-4 py-3 border-2 border-indigo-200 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 sm:text-sm"
                    placeholder={"🏫 " + t('schoolName')}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">{t('emailLabel')}</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-blue-200 placeholder-gray-400 text-gray-900 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 sm:text-sm"
                placeholder={"📧 " + t('emailLabel')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="-mt-px">
              <label htmlFor="password" className="sr-only">{t('passwordLabel')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className="appearance-none relative block w-full px-4 py-3 border-2 border-blue-200 placeholder-gray-400 text-gray-900 rounded-b-xl -mt-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 sm:text-sm"
                placeholder={"🔒 " + t('passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-gray-400 disabled:to-gray-400 transform transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:hover:scale-100"
            >
              <span className="flex items-center gap-2">
                {loading ? '⏳ ' + t('loading') : (isSignUp ? '🚀 ' + t('signUpAction') : '✨ ' + t('signInAction'))}
              </span>
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-2 text-center text-sm text-green-700 bg-green-100 p-4 rounded-xl border-2 border-green-300 font-medium animate-bounce-once">
            ✅ {message}
          </p>
        )}
        {error && (
          <p className="mt-2 text-center text-sm text-red-700 bg-red-100 p-4 rounded-xl border-2 border-red-300 font-medium animate-shake">
            ❌ {error}
          </p>
        )}
        <div className="text-sm text-center">
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); setMessage(''); setError(''); }} className="font-bold text-indigo-600 hover:text-indigo-700 transition-all duration-200 hover:underline">
                {isSignUp ? `${t('haveAccountPrompt')} ${t('switchToSignIn')}` : `${t('noAccountPrompt')} ${t('switchToSignUp')}`}
            </a>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;

