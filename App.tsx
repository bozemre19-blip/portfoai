
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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
import { syncOfflineData } from './services/api';
import { startAutoSync, stopAutoSync } from './services/syncService';
import { t } from './constants.clean';
import { Analytics } from "@vercel/analytics/react";
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
  const [view, setView] = useState<{ page: string; params?: any }>({ page: 'dashboard', params: {} });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    if (!h.startsWith('#/')) return { page: 'dashboard', params: {} };
    const [path, query] = h.substring(2).split('?');
    const params: any = {};
    if (query) {
      const sp = new URLSearchParams(query);
      sp.forEach((v, k) => (params[k] = v));
    }
    return { page: path || 'dashboard', params };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Kullanıcı giriş yaptıysa Sentry'e bildir
      // if (session?.user) {
      //   setSentryUser(session.user.id, session.user.email);
      // }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Auth state değiştiğinde Sentry'i güncelle
      // if (session?.user) {
      //   setSentryUser(session.user.id, session.user.email);
      // } else {
      //   clearSentryUser();
      // }
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
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null }}>
      <div className="min-h-screen bg-gray-100">
        {!session ? (
          <Auth />
        ) : (
          <Layout navigate={navigate}>

            {renderContent()}
          </Layout>
        )}
      </div>
      <Analytics />
    </AuthContext.Provider>
  );
};

export default App;






