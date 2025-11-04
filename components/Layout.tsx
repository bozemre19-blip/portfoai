
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
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Inject minimal CSS overrides at runtime to ensure dark/kids themes are readable
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

      /* Kids theme */
      html[data-theme='kids'] body { background: linear-gradient(180deg, #fff7ed 0%, #fdf2f8 50%, #eff6ff 100%); }
      html[data-theme='kids'] .bg-white { background: #ffffffcc !important; backdrop-filter: saturate(120%) blur(2px); border: 1px solid #fde68a33; }
      html[data-theme='kids'] .text-gray-900 { color: #111827 !important; }
      html[data-theme='kids'] .shadow { box-shadow: 0 6px 20px rgba(124,58,237,0.08), 0 2px 8px rgba(56,189,248,0.08) !important; }
      html[data-theme='kids'] .chip, html[data-theme='kids'] .badge { filter: saturate(115%); }
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
    const kids = theme === 'kids';
    return {
      sidebarBg: dark ? 'bg-gray-800' : kids ? 'bg-white/90 border-r border-yellow-100' : 'bg-white/95 backdrop-blur-sm border-r border-gray-200',
      headerBorder: dark ? 'border-gray-700' : kids ? 'border-yellow-200' : 'border-gray-200',
      headerTitle: dark ? 'text-white' : 'text-gray-900',
      headerSub: dark ? 'text-gray-400' : 'text-gray-500',
      navItem: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : kids ? 'text-gray-700 hover:bg-yellow-50 hover:text-violet-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      signOut: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : kids ? 'text-gray-700 hover:bg-yellow-50 hover:text-violet-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      footerBorder: dark ? 'border-gray-700' : kids ? 'border-yellow-200' : 'border-gray-200',
      appBg: dark ? 'bg-gray-900' : kids ? 'bg-transparent' : 'bg-transparent',
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
          <div className="flex gap-2">
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('light')}
            >
              <span className="block">☀️</span>
              <span className="text-xs">Açık</span>
            </button>
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('dark')}
            >
              <span className="block">🌙</span>
              <span className="text-xs">Koyu</span>
            </button>
            <button
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${theme === 'kids' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105' : 'bg-gradient-to-r from-yellow-100 to-pink-100 text-purple-700 hover:from-yellow-200 hover:to-pink-200'}`}
              onClick={() => setTheme('kids')}
            >
              <span className="block">🌈</span>
              <span className="text-xs">Renkli</span>
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




