
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../App';
import { t, getDateLocale } from '../constants.clean';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon, // Was MenuIcon
  XMarkIcon  // Was XIcon
} from '@heroicons/react/24/outline';
import MobileTabBar from './MobileTabBar';

interface LayoutProps {
  children: React.ReactNode;
  navigate: (page: string, params?: any) => void;
  currentPage?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, navigate, currentPage = '' }) => {
  const { user } = useAuth();
  const sanitize = (s: string) =>
    (s || '')
      .replace(/[^A-Za-z0-9 .,'-]/g, ' ')
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  // Inject dark theme overrides for better text readability
  useEffect(() => {
    const id = 'dark-theme-overrides';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      /* Dark mode text colors */
      html[data-theme='dark'] body { 
        color: #e5e7eb; 
      }
      
      html[data-theme='dark'] .text-gray-900,
      html[data-theme='dark'] .text-gray-800,
      html[data-theme='dark'] .text-gray-700 { 
        color: #e5e7eb !important; 
      }
      
      html[data-theme='dark'] .text-gray-600 { 
        color: #9ca3af !important; 
      }
      
      html[data-theme='dark'] .text-gray-500 { 
        color: #6b7280 !important; 
      }
      
      html[data-theme='dark'] .text-gray-400 { 
        color: #4b5563 !important; 
      }
      
      /* Dark mode - Colorful card borders stay vibrant */
      html[data-theme='dark'] .card-colorful {
        background-color: #1a1a2e !important;
        border-width: 2px;
      }
      
      /* Dark mode - Gradient text remains visible */
      html[data-theme='dark'] .text-gradient-purple {
        background: linear-gradient(to right, #a78bfa, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* Dark mode - Buttons remain vibrant */
      html[data-theme='dark'] .btn-gradient-primary,
      html[data-theme='dark'] .btn-gradient-success,
      html[data-theme='dark'] .btn-gradient-info {
        filter: brightness(1.1);
      }
    `;
    document.head.appendChild(style);
  }, []);

  const navigation = [
    { name: t('dashboard'), icon: HomeIcon, page: 'dashboard', color: 'blue' },
    { name: t('children'), icon: UsersIcon, page: 'children', color: 'green' },
    { name: t('classes'), icon: BuildingLibraryIcon, page: 'classes', color: 'purple' },
    { name: t('attendance'), icon: ClipboardDocumentCheckIcon, page: 'attendance', color: 'red' },
    { name: t('aiAssistant'), icon: ChatBubbleLeftRightIcon, page: 'teacher-chat', color: 'pink' },
    { name: t('settings'), icon: Cog6ToothIcon, page: 'settings', color: 'orange' },
  ];

  const colors = useMemo(() => {
    const dark = theme === 'dark';
    return {
      sidebarBg: dark ? 'bg-[#1a1a2e] border-r border-[#2a3f5f]' : 'bg-white/95 backdrop-blur-sm border-r border-gray-200',
      headerBorder: dark ? 'border-[#2a3f5f]' : 'border-gray-200',
      headerTitle: dark ? 'text-gray-100' : 'text-gray-900',
      headerSub: dark ? 'text-gray-400' : 'text-gray-500',
      navItem: dark ? 'text-gray-300 hover:bg-[#1e2a47] hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      signOut: dark ? 'text-gray-300 hover:bg-[#1e2a47] hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      footerBorder: dark ? 'border-[#2a3f5f]' : 'border-gray-200',
      appBg: dark ? 'bg-transparent' : 'bg-transparent',
    };
  }, [theme]);

  const signOutNow = async () => {
    try { await supabase.auth.signOut(); } catch { }
    try {
      // Clear possible cached items
      sessionStorage.clear();
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('sb-') || k.includes('supabase'))) keys.push(k);
      }
      keys.forEach(k => localStorage.removeItem(k));
    } catch { }
    try { window.location.hash = ''; } catch { }
    window.location.reload();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b ${colors.headerBorder} ${theme === 'dark' ? 'bg-gradient-to-r from-[#1e2a47] via-[#1a1a2e] to-[#1e2a47]' : 'bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50'}`}>
        <div className="flex items-center justify-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <img
              src="/logo.png"
              alt="Lukid AI"
              className="relative h-14 w-14 object-contain select-none drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              draggable={false}
            />
          </div>
          <span className={`text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Lukid AI</span>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('getting-started'); setSidebarOpen(false); }}
          className={`group flex items-center px-4 py-3 rounded-xl ${theme === 'dark' ? 'text-gray-300 hover:bg-[#1e2a47]' : 'text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-100'} hover:shadow-md transition-all duration-200 relative overflow-hidden`}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
          <DocumentTextIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{t('gettingStarted') || 'Başlarken'}</span>
        </a>
        {navigation.map((item) => {
          const colorClasses = theme === 'dark'
            ? 'hover:bg-[#1e2a47]'
            : ({
              blue: 'hover:from-blue-50 hover:to-blue-100 group-hover:border-blue-500',
              green: 'hover:from-green-50 hover:to-green-100 group-hover:border-green-500',
              purple: 'hover:from-purple-50 hover:to-purple-100 group-hover:border-purple-500',
              pink: 'hover:from-pink-50 hover:to-pink-100 group-hover:border-pink-500',
              orange: 'hover:from-orange-50 hover:to-orange-100 group-hover:border-orange-500',
              red: 'hover:from-red-50 hover:to-red-100 group-hover:border-red-500',
            }[item.color] || 'hover:from-gray-50 hover:to-gray-100 group-hover:border-gray-500');

          const iconColor = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            purple: 'text-purple-600',
            pink: 'text-pink-600',
            orange: 'text-orange-600',
            red: 'text-red-600',
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
              className={`group flex items-center px-4 py-3 rounded-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} ${theme === 'dark' ? colorClasses : `hover:bg-gradient-to-r ${colorClasses}`} hover:shadow-md transition-all duration-200 relative overflow-hidden`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200 ${iconColor.replace('text-', 'bg-')}`}></div>
              <item.icon className={`w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200 ${theme !== 'dark' ? iconColor : ''}`} />
              <span className="font-medium group-hover:translate-x-1 transition-transform duration-200">{item.name}</span>
            </a>
          );
        })}
      </nav>
      <div className={`p-4 border-t ${colors.footerBorder}`}>
        <div className="mb-3">
          <div className={`text-xs mb-2 font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>🎨 {t('theme')}</div>
          <div className="flex gap-3">
            <button
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('light')}
            >
              <SunIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t('lightTheme')}</span>
            </button>
            <button
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setTheme('dark')}
            >
              <MoonIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t('darkTheme')}</span>
            </button>
          </div>
        </div>
        <button
          onClick={signOutNow}
          className="group w-full text-left flex items-center px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:shadow-md transition-all duration-200 relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-200"></div>
          <ArrowRightOnRectangleIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-200" />
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
              <XMarkIcon className="h-6 w-6 text-white" />
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
        {/* Old floating hamburger removed from here */}

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {/* Header Banner */}
          <div className={`${theme === 'dark' ? 'bg-gradient-to-r from-[#0c0f1d] via-[#161b33] to-[#0c0f1d]' : 'bg-gradient-to-r from-[#161b33] via-[#1e2a47] to-[#161b33]'} shadow-lg pt-safe transition-colors duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile Menu Button - HIDDEN because we use Bottom Tab Bar now */}
                  {/* <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 -ml-2 rounded-lg focus:outline-none transition-colors text-white/80 hover:bg-white/10"
                  >
                    <Bars3Icon className="h-7 w-7" />
                  </button> */}

                  <div className="backdrop-blur-sm rounded-xl p-3 shadow-sm hidden sm:block bg-indigo-500/20 border border-indigo-500/30">
                    <DocumentTextIcon className="w-8 h-8 text-indigo-100" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
                      <span className="hidden sm:inline">{t('earlyChildhoodSystem')}</span>
                      <span className="sm:hidden">Lukid AI</span>
                      <span className="text-xs font-normal px-2 py-1 rounded-lg bg-orange-500/30 text-orange-100">Beta</span>
                    </h1>
                    <p className="text-sm mt-1 text-slate-300">
                      {t('welcomeBack')}, <span className="font-semibold text-white">{displayName}</span> 👋
                    </p>
                  </div>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <div className="backdrop-blur-sm rounded-lg px-4 py-2 text-sm bg-white/5 text-slate-200 border border-indigo-500/20">
                    <span className="opacity-70">{t('today')}:</span> <span className="font-bold text-white">{new Date().toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-32">
            <div className="bg-white/80 dark:bg-[#1a1a2e] backdrop-blur-sm rounded-2xl shadow-2xl p-6 min-h-[calc(100vh-6rem)] transition-colors duration-300 border border-transparent dark:border-gray-800">
              {children}
            </div>
          </div>
        </main>
      </div>
      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar currentPath={currentPage} navigate={navigate} />
    </div>
  );
};

export default Layout;
