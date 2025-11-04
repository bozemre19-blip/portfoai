
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { t } from '../constants.clean';
import { HomeIcon, UsersIcon, DocumentTextIcon, CogIcon, MenuIcon, XIcon, ChatIcon } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (page: string, params?: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, navigate }) => {
  const { user } = useAuth();
  const sanitize = (s: string) =>
    (s || '')
      .replace(/[^A-Za-z������������0-9 .,'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const displayName = sanitize(
    (user?.user_metadata && (user.user_metadata.first_name || user.user_metadata.last_name))
      ? `${user?.user_metadata?.first_name ?? ''} ${user?.user_metadata?.last_name ?? ''}`
      : (user?.email?.split('@')[0] || '')
  );
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    const savedTheme = localStorage.getItem('theme');
    // Kids teması kaldırıldı, varsa light'a çevir
    if (savedTheme === 'kids') return 'light';
    return savedTheme || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Inject minimal CSS overrides at runtime to ensure dark theme is readable
  useEffect(() => {
    const id = 'dark-theme-overrides';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      html[data-theme='dark'] body { color: #e5e7eb; }
      html[data-theme='dark'] .text-gray-900,
      html[data-theme='dark'] .text-gray-800,
      html[data-theme='dark'] .text-gray-700,
      html[data-theme='dark'] .text-gray-600,
      html[data-theme='dark'] .text-black { color: #f3f4f6 !important; }
      html[data-theme='dark'] .bg-white { color: #0f172a; }
      html[data-theme='dark'] .bg-white .text-gray-900,
      html[data-theme='dark'] .bg-white .text-gray-800,
      html[data-theme='dark'] .bg-white .text-gray-700,
      html[data-theme='dark'] .bg-white .text-gray-600,
      html[data-theme='dark'] .bg-white .text-black { color: #0f172a !important; }
    `;
    document.head.appendChild(style);
  }, []);

  const navItems = [
    { name: t('dashboard'), icon: HomeIcon, page: 'dashboard', color: 'blue', emoji: '🏠' },
    { name: t('children'), icon: UsersIcon, page: 'children', color: 'green', emoji: '👶' },
    { name: 'Sınıflar', icon: UsersIcon, page: 'classes', color: 'purple', emoji: '🏫' },
    { name: 'Asistana bağlan', icon: ChatIcon, page: 'teacher-chat', color: 'pink', emoji: '💬' },
    { name: t('settings'), icon: CogIcon, page: 'settings', color: 'orange', emoji: '⚙️' },
  ];

  const colors = useMemo(() => {
    const dark = theme === 'dark';
    return {
      sidebarBg: dark ? 'bg-gray-800' : 'bg-white/95 backdrop-blur-sm border-r border-gray-200',
      headerBorder: dark ? 'border-gray-700' : 'border-gray-200',
      headerTitle: dark ? 'text-white' : 'text-gray-900',
      headerSub: dark ? 'text-gray-400' : 'text-gray-500',
      navItem: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      signOut: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      footerBorder: dark ? 'border-gray-700' : 'border-gray-200',
      appBg: dark ? 'bg-gray-900' : 'bg-transparent',
    };
  }, [theme]);

  const signOutNow = async () => {
    try { await supabase.auth.signOut(); } catch {}
    try {
      // Clear possible cached items
      sessionStorage.clear();
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase'))) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch {}
    try { window.location.hash = ''; } catch {}
    window.location.reload();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b ${colors.headerBorder} bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50`}>
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <img
              src="/portfoai-logo.svg"
              alt="PortfoAI"
              className="relative h-10 md:h-12 mx-auto select-none group-hover:scale-105 transition-transform duration-300"
              draggable={false}
            />
          </div>
        </div>
        <p className="text-center text-xs font-semibold text-gray-600 mt-2 tracking-wide">✨ PortfoAI ✨</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('getting-started'); setSidebarOpen(false); }}
          className="group flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
          <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">📄</span>
          <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{t('gettingStarted') || 'Başlarken'}</span>
        </a>
        {navItems.map((item) => {
          const colorClasses = {
            blue: 'hover:from-blue-50 hover:to-blue-100 group-hover:border-blue-500',
            green: 'hover:from-green-50 hover:to-green-100 group-hover:border-green-500',
            purple: 'hover:from-purple-50 hover:to-purple-100 group-hover:border-purple-500',
            pink: 'hover:from-pink-50 hover:to-pink-100 group-hover:border-pink-500',
            orange: 'hover:from-orange-50 hover:to-orange-100 group-hover:border-orange-500',
          }[item.color] || 'hover:from-gray-50 hover:to-gray-100 group-hover:border-gray-500';
          
          const iconColor = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            pink: 'text-pink-600',
            orange: 'text-orange-600',
          }[item.color] || 'text-gray-600';

          return (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(item.page);
                setSidebarOpen(false);
              }}
              className={`group flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r ${colorClasses} hover:shadow-md transition-all duration-200 relative overflow-hidden`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 ${iconColor.replace('text-', 'bg-')}`}></div>
              <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">{item.emoji}</span>
              <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{item.name}</span>
            </a>
          );
        })}
      </nav>
      <div className={`p-4 border-t ${colors.footerBorder}`}>
        <div className="mb-3">
          <div className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>🎨 Tema</div>
          <div className="flex gap-3">
            <button
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('light')}
            >
              <span className="block text-xl mb-1">☀️</span>
              <span className="text-xs font-semibold">Açık</span>
            </button>
            <button
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('dark')}
            >
              <span className="block text-xl mb-1">🌙</span>
              <span className="text-xs font-semibold">Koyu</span>
            </button>
          </div>
        </div>
        <button
          onClick={signOutNow}
          className="group w-full text-left flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
          <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">🚪</span>
          <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{t('signOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen ${colors.appBg}`}>
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-40 flex md:hidden ${isSidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)}></div>
        <div className={`relative flex-1 flex flex-col max-w-xs w-full ${colors.sidebarBg}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button onClick={() => setSidebarOpen(false)} className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <XIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className={`flex flex-col h-0 flex-1 ${colors.sidebarBg}`}>
            {sidebarContent}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button onClick={() => setSidebarOpen(true)} className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 min-h-[calc(100vh-6rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;




