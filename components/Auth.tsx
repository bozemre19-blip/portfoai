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
    <div className="min-h-screen auth-bg">
      <div className="w-full flex justify-center pt-10 sm:pt-12">
        <img
          src="/portfoai-logo.svg"
          alt="PortfoAI"
          className="h-20 sm:h-24 md:h-28 select-none"
          draggable={false}
        />
      </div>
      <div className="flex items-start justify-center px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg mt-4">
          <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? t('signUpTitle') : t('signInTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
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
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder={t('teacherFirstName')}
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
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                      placeholder={t('teacherLastName')}
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
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder={t('schoolName')}
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('emailLabel')}
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder={t('passwordLabel')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
            >
              {loading ? t('loading') : (isSignUp ? t('signUpAction') : t('signInAction'))}
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-2 text-center text-sm text-green-600 bg-green-100 p-3 rounded-md">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-2 text-center text-sm text-red-600 bg-red-100 p-3 rounded-md">
            {error}
          </p>
        )}
        <div className="text-sm text-center">
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); setMessage(''); setError(''); }} className="font-medium text-primary hover:text-primary/80">
                {isSignUp ? `${t('haveAccountPrompt')} ${t('switchToSignIn')}` : `${t('noAccountPrompt')} ${t('switchToSignUp')}`}
            </a>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;

