
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
import { syncOfflineData } from './services/api';
import { t } from './constants.clean';

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
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      console.log(t('syncAttempt'));
      syncOfflineData();
    }
  }, [isOnline]);

  const navigate = useCallback((page: string, params: any = {}) => {
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
      case 'edit-observation':
        return <ObservationScreen childId={view.params.observation.child_id} navigate={navigate} observationToEdit={view.params.observation} />;
      case 'media':
        return <MediaScreen childId={view.params.childId} navigate={navigate} />;
      case 'child-observations':
        return <ChildObservationsScreen childId={view.params.childId} navigate={navigate} />;
      case 'teacher-chat':
        return <TeacherChat navigate={navigate} childId={view.params.forChatChildId} classroom={view.params.classroom} />;
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
            {!isOnline && (
              <div className="bg-yellow-500 text-white text-center p-2">
                {t('offlineWarning')}
              </div>
            )}
            {renderContent()}
          </Layout>
        )}
      </div>
    </AuthContext.Provider>
  );
};

export default App;






