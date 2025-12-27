
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from './services/supabase';
import type { Session, User } from '@supabase/supabase-js';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import GettingStarted from './components/GettingStarted';
import ChildrenScreen from './components/ChildrenScreen';
import ClassesScreen from './components/ClassesScreen';
import ClassDetailScreen from './components/ClassDetailScreen';
import ChildDetailScreen from './components/ChildDetailScreen';
import ObservationScreen from './components/ObservationScreen2';
import SettingsScreen from './components/SettingsScreen';
import MediaScreen from './components/MediaScreen';
import ChildObservationsScreen from './components/ChildObservationsScreen';
import TeacherChat from './components/TeacherChat';
import AttendanceScreen from './components/AttendanceScreen';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import PrivacyPage from './components/PrivacyPage';
import FeaturesPage from './components/FeaturesPage';
import PricingPage from './components/PricingPage';
import FAQPage from './components/FAQPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import { syncOfflineData } from './services/api';
import { startAutoSync, stopAutoSync } from './services/syncService';
import { t } from './constants.clean';
// import { Analytics } from "@vercel/analytics/react";
// Sentry geçici olarak devre dışı (beyaz ekran sorunu için)
// import { initSentry, setSentryUser, clearSentryUser } from './sentry.config';

// Sentry'i uygulama başlangıcında başlat
// initSentry();

type AuthContextType = {
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null });

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<{ page: string; params?: any }>({ page: '', params: {} });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [emailConfirmed, setEmailConfirmed] = useState(false); // Email doğrulama başarılı mı
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false); // Şifre sıfırlama modu

  // --- Lightweight hash router
  const makeHash = (page: string, params: any = {}) => {
    const allowed: any = {};
    if (params?.id) allowed.id = params.id;
    if (params?.childId) allowed.childId = params.childId;
    if (params?.screen) allowed.screen = params.screen;
    if (params?.classroom !== undefined) allowed.classroom = params.classroom;
    if (params?.forChatChildId) allowed.forChatChildId = params.forChatChildId;
    const qs = new URLSearchParams(allowed).toString();
    return `#/${page}${qs ? `?${qs}` : ''}`;
  };

  const parseHash = (): { page: string; params: any } => {
    const h = window.location.hash || '';
    if (!h.startsWith('#/')) return { page: '', params: {} }; // Default to Landing Logic
    const [path, query] = h.substring(2).split('?');
    const params: any = {};
    if (query) {
      const sp = new URLSearchParams(query);
      sp.forEach((v, k) => (params[k] = v));
    }
    return { page: path || '', params };
  };

  useEffect(() => {
    // URL'de şifre sıfırlama token'ı var mı kontrol et (Supabase recovery redirect)
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('type=password_recovery')) {
      console.log('Password recovery detected in URL');
      setIsPasswordRecovery(true);
      // URL'i temizle ama token'ları koru (Supabase session için gerekli)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Kullanıcı giriş yaptıysa Sentry'e bildir
      // if (session?.user) {
      //   setSentryUser(session.user.id, session.user.email);
      // }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Şifre sıfırlama event'i - PASSWORD_RECOVERY
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        // Şifre sıfırlama sayfasına yönlendir
        window.history.replaceState(null, '', window.location.pathname + '#/reset-password');
        setView({ page: 'reset-password', params: {} });
        return;
      }

      // Email doğrulama başarılı olduğunda
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup') ||
        event === 'USER_UPDATED' ||
        window.location.hash.includes('type=email_confirm')) {
        // URL'den token parametrelerini temizle
        if (window.location.hash.includes('access_token') || window.location.hash.includes('type=')) {
          setEmailConfirmed(true);
          window.history.replaceState(null, '', window.location.pathname + '#/login');
        }
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleHash = () => {
      const parsed = parseHash();
      setView(parsed);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('hashchange', handleHash);

    // initialize from URL hash on first load
    handleHash();

    // Otomatik senkronizasyonu başlat
    startAutoSync();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hashchange', handleHash);
      // Otomatik senkronizasyonu durdur
      stopAutoSync();
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      console.log(t('syncAttempt'));
      syncOfflineData();
    }
  }, [isOnline]);

  useEffect(() => {
    if (!navigator.onLine) {
      // Small delay to ensure UI is ready
      setTimeout(() => alert(t('noInternetConnection')), 500);
    }
  }, []);

  const navigate = useCallback((page: string, params: any = {}) => {
    try {
      if (params && params.observation) {
        sessionStorage.setItem('edit-observation', JSON.stringify(params.observation));
      }
    } catch { }
    const hash = makeHash(page, params);
    if (window.location.hash !== hash) {
      window.location.hash = hash; // creates browser history entry
    }
    setView({ page, params });
  }, []);

  const renderContent = () => {
    switch (view.page) {
      case 'dashboard':
        return <Dashboard navigate={navigate} />;
      case 'getting-started':
        return <GettingStarted navigate={navigate} />;
      case 'children':
        return <ChildrenScreen navigate={navigate} />;
      case 'classes':
        return <ClassesScreen navigate={navigate} />;
      case 'class-detail':
        return <ClassDetailScreen classroom={view.params.classroom} navigate={navigate} />;
      case 'child-detail':
        return <ChildDetailScreen childId={view.params.id} navigate={navigate} />;
      case 'add-observation':
        return <ObservationScreen childId={view.params.childId} navigate={navigate} />;
      case 'edit-observation': {
        let obs = view.params?.observation as any;
        if (!obs) {
          try {
            const s = sessionStorage.getItem('edit-observation');
            if (s) obs = JSON.parse(s);
          } catch { }
        }
        const cid = view.params?.childId ?? obs?.child_id;
        if (!cid) {
          return <Dashboard navigate={navigate} />;
        }
        return <ObservationScreen childId={cid} navigate={navigate} observationToEdit={obs} />;
      }
      case 'media':
        return <MediaScreen childId={view.params.childId} navigate={navigate} />;
      case 'child-observations':
        return <ChildObservationsScreen childId={view.params.childId} navigate={navigate} />;
      case 'teacher-chat':
        return <TeacherChat navigate={navigate} childId={view.params.forChatChildId} classroom={view.params.classroom} />;
      case 'attendance':
        return <AttendanceScreen navigate={navigate} />;
      case 'settings':
        return <SettingsScreen />;
      default:
        // Varsayılan olarak Dashboard'a git (giriş yapmışsa)
        return <Dashboard navigate={navigate} />;
    }
  };

  // 1. Durum: Kullanıcı giriş yapmış
  if (session) {
    return (
      <AuthContext.Provider value={{ session, user: session?.user ?? null }}>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
          <Layout navigate={navigate} currentPage={view.page || 'dashboard'}>
            {renderContent()}
          </Layout>
        </div>
        {/* <Analytics /> */}
      </AuthContext.Provider>
    );
  }

  // 2. Durum: Kullanıcı giriş yapmış ve 'login' sayfasında
  if (view.page === 'login') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Auth
          initialMode={view.params?.mode === 'signup' ? 'signup' : 'login'}
          emailConfirmed={emailConfirmed}
          onEmailConfirmedDismiss={() => setEmailConfirmed(false)}
        />
      </div>
    );
  }

  // Şifre sıfırlama sayfası (email linki ile gelindi veya isPasswordRecovery true)
  if (view.page === 'reset-password' || isPasswordRecovery) {
    return (
      <ResetPasswordPage
        onSuccess={() => {
          setIsPasswordRecovery(false);
          navigate('dashboard');
        }}
        onBack={() => {
          setIsPasswordRecovery(false);
          navigate('login');
        }}
      />
    );
  }

  // 3. Durum: Kullanıcı giriş yapmamış

  if (view.page === 'about') {
    return <AboutPage onBack={() => navigate('landing')} />;
  }

  if (view.page === 'contact') {
    return <ContactPage onBack={() => navigate('landing')} />;
  }

  if (view.page === 'privacy') {
    return <PrivacyPage onBack={() => navigate('landing')} />;
  }

  if (view.page === 'features') {
    return <FeaturesPage onBack={() => navigate('landing')} onSignup={() => navigate('login', { mode: 'signup' })} />;
  }

  if (view.page === 'pricing') {
    return <PricingPage onBack={() => navigate('landing')} onSignup={() => navigate('login', { mode: 'signup' })} />;
  }

  if (view.page === 'faq') {
    return <FAQPage onBack={() => navigate('landing')} />;
  }

  // Varsayılan: Landing Page (sadece web için) veya Login (mobil için)
  // Mobil uygulamada landing page gösterme, direkt login aç
  if (Capacitor.isNativePlatform()) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Auth initialMode="login" />
      </div>
    );
  }

  return <LandingPage
    navigate={navigate}
    onLoginClick={() => navigate('login')}
    onSignupClick={() => navigate('login', { mode: 'signup' })}
  />;
};

export default App;




