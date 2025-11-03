
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
    { name: t('dashboard'), icon: HomeIcon, page: 'dashboard' },
    { name: t('children'), icon: UsersIcon, page: 'children' },
    { name: 'Sınıflar', icon: UsersIcon, page: 'classes' },
    { name: 'Asistana bağlan', icon: ChatIcon, page: 'teacher-chat' },
    { name: t('settings'), icon: CogIcon, page: 'settings' },
  ];

  const colors = useMemo(() => {
    const dark = theme === 'dark';
    const kids = theme === 'kids';
    return {
      sidebarBg: dark ? 'bg-gray-800' : kids ? 'bg-white/90 border-r border-yellow-100' : 'bg-white border-r border-gray-200',
      headerBorder: dark ? 'border-gray-700' : kids ? 'border-yellow-200' : 'border-gray-200',
      headerTitle: dark ? 'text-white' : 'text-gray-900',
      headerSub: dark ? 'text-gray-400' : 'text-gray-500',
      navItem: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : kids ? 'text-gray-700 hover:bg-yellow-50 hover:text-violet-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      signOut: dark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : kids ? 'text-gray-700 hover:bg-yellow-50 hover:text-violet-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      footerBorder: dark ? 'border-gray-700' : kids ? 'border-yellow-200' : 'border-gray-200',
      appBg: dark ? 'bg-gray-900' : kids ? 'bg-transparent' : 'bg-gray-100',
    };
  }, [theme]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b ${colors.headerBorder}`}>
        <div className="flex justify-center">
          <img
            src="/portfoai-logo.svg"
            alt="PortfoAI"
            className="h-10 md:h-12 mx-auto select-none"
            draggable={false}
          />
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('getting-started'); setSidebarOpen(false); }}
          className={`flex items-center px-4 py-2 rounded-md ${colors.navItem}`}
        >
          <DocumentTextIcon className="w-6 h-6 mr-3" />
          {t('gettingStarted') || 'Başlarken'}
        </a>
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(item.page);
              setSidebarOpen(false);
            }}
            className={`flex items-center px-4 py-2 rounded-md ${colors.navItem}`}
          >
            <item.icon className="w-6 h-6 mr-3" />
            {item.name}
          </a>
        ))}
      </nav>
      <div className={`p-4 border-t ${colors.footerBorder}`}>
        <div className="mb-3">
          <div className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tema</div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded text-sm ${theme === 'light' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setTheme('light')}
            >{"A\u00E7\u0131k"}</button>
            <button
              className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setTheme('dark')}
            >Koyu</button>
            <button
              className={`px-3 py-1 rounded text-sm ${theme === 'kids' ? 'bg-violet-600 text-white' : 'bg-yellow-200 text-violet-700'}`}
              onClick={() => setTheme('kids')}
            >Renkli</button>
          </div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className={`w-full text-left flex items-center px-4 py-2 rounded-md ${colors.signOut}`}
        >
          {t('signOut')}
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
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;




