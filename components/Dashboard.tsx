import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { t, getDateLocale, getDomains } from '../constants.clean';
import { PlusIcon, UserGroupIcon } from './Icons';
import { supabase } from '../services/supabase';
import { getChildren } from '../services/api';

// Hook to read theme from localStorage
const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => {
    const handleStorage = () => setTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('storage', handleStorage);
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { window.removeEventListener('storage', handleStorage); observer.disconnect(); };
  }, []);
  return theme;
};

interface DashboardProps {
  navigate: (page: string, params?: any) => void;
}

type RecentItem = {
  id: string;
  child_id: string;
  note: string;
  domains: string[];
  created_at: string;
  assessment_risk?: string | null;
};

const DOMAIN_TR: Record<string, string> = getDomains();

const Dashboard: React.FC<DashboardProps> = ({ navigate }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const [children, setChildren] = useState<any[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [obs7d, setObs7d] = useState<number>(0);
  const [media7d, setMedia7d] = useState<number>(0);
  const [activityDays, setActivityDays] = useState<{ label: string; obs: number; media: number }[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const displayName = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    const name = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim();
    return name || (user?.email?.split('@')[0] || '');
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        const list = await getChildren(user.id);
        setChildren(list);

        // recent observations + risk
        const { data: obsData } = await supabase
          .from('observations')
          .select('id, child_id, note, domains, created_at, assessments(risk)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        const rec = (obsData || []).map((row: any) => ({
          id: row.id,
          child_id: row.child_id,
          note: row.note,
          domains: row.domains || [],
          created_at: row.created_at,
          assessment_risk: Array.isArray(row.assessments) && row.assessments.length > 0 ? row.assessments[0]?.risk : null,
        }));
        setRecent(rec);

        // counts last 7 days
        const since = new Date(); since.setDate(since.getDate() - 7);
        const sinceIso = since.toISOString();
        const obsCount = await supabase
          .from('observations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sinceIso);
        setObs7d(obsCount.count || 0);
        const mediaCount = await supabase
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sinceIso);
        setMedia7d(mediaCount.count || 0);

        // activity lists for last 7 days (client-side group)
        const { data: obsList } = await supabase
          .from('observations')
          .select('id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sinceIso);
        const { data: mediaList } = await supabase
          .from('media')
          .select('id, created_at')
          .eq('user_id', user.id)
          .gte('created_at', sinceIso);
        const days: { label: string; obs: number; media: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const label = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(d);
          const o = (obsList || []).filter((x: any) => (x.created_at || '').slice(0, 10) === key).length;
          const m = (mediaList || []).filter((x: any) => (x.created_at || '').slice(0, 10) === key).length;
          days.push({ label, obs: o, media: m });
        }
        setActivityDays(days);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // pinned children (localStorage)
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`pinned:${user.id}`);
      setPinnedIds(raw ? JSON.parse(raw) : []);
    } catch { setPinnedIds([]); }
  }, [user]);

  const teacherSchool = user?.user_metadata?.school_name ? ` · ${user.user_metadata.school_name}` : '';

  return (
    <div>
      <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-stone-700'}`}>{t('welcome')}, {displayName}{teacherSchool}</h1>
      <div className="mt-2 w-28 h-1 rounded-full bg-gradient-to-r from-stone-300 via-amber-200 to-stone-300"></div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-stone-900'}`}>{t('quickAccess')}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            onClick={() => navigate('children', { screen: 'add-child' })}
            className="flex items-center justify-center p-6 rounded-lg shadow-md bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all transform active:scale-95"
          >
            <PlusIcon className="w-8 h-8 text-orange-100" />
            <span className="ml-4 text-xl font-semibold text-orange-50">{t('addChild')}</span>
          </button>
          <button
            onClick={() => navigate('children')}
            className="flex items-center justify-center p-6 rounded-lg shadow-md bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white transition-all transform active:scale-95"
          >
            <UserGroupIcon className="w-8 h-8 text-indigo-100" />
            <span className="ml-4 text-xl font-semibold text-indigo-50">{t('childList')}</span>
          </button>
        </div>
      </div>

      {/* Activity (7 days) */}
      <div className="mt-6 bg-white rounded-lg shadow p-4 card-colorful card-colorful-blue">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">📊 {t('activity7days')}</h2>
        </div>
        <div className="grid grid-cols-7 gap-2 items-end h-28">
          {activityDays.map((d, i) => {
            const max = Math.max(1, ...activityDays.map(x => x.obs + x.media));
            const total = d.obs + d.media;
            const h = Math.round((total / max) * 88) + 8; // min 8px
            const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#14b8a6'];
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="w-6 rounded-t transition-all hover:scale-110" style={{ height: `${h}px`, backgroundColor: colors[i % colors.length] }} title={`${d.label}: ${d.obs} gözlem, ${d.media} ürün`} />
                <div className="mt-1 text-xs text-gray-500 font-medium">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pinned children */}
      {pinnedIds.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">📌 {t('pinnedChildren')}</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {children.filter((c) => pinnedIds.includes(c.id)).slice(0, 8).map((c, idx) => {
              const initials = `${(c.first_name || '')[0] || ''}${(c.last_name || '')[0] || ''}`.toUpperCase();
              const cardColors = ['card-colorful-purple', 'card-colorful-blue', 'card-colorful-green', 'card-colorful-pink', 'card-colorful-orange'];
              const avatarColors = ['bg-purple-200 text-purple-700', 'bg-blue-200 text-blue-700', 'bg-green-200 text-green-700', 'bg-pink-200 text-pink-700', 'bg-orange-200 text-orange-700'];
              return (
                <div key={c.id} className={`bg-white rounded-lg shadow p-4 flex items-center gap-3 card-colorful ${cardColors[idx % cardColors.length]}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarColors[idx % avatarColors.length]}`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-gray-500 truncate">{c.classroom || ''}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button className="text-primary text-sm hover:underline font-medium" onClick={() => navigate('child-detail', { id: c.id })}>{t('profile')}</button>
                    <button className="text-secondary text-sm hover:underline font-medium" onClick={() => navigate('add-observation', { childId: c.id })}>{t('observations')}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent observations */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">🔍 {t('recentObservations')}</h2>
        <div className="mt-4 bg-white rounded-lg shadow-md p-6 card-colorful card-colorful-purple">
          {loading ? (
            <p className="text-gray-500">{t('loading')}</p>
          ) : recent.length === 0 ? (
            <p className="text-gray-500">{t('noRecentObservations')}</p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r, idx) => {
                const cardColors = ['border-l-purple-500', 'border-l-blue-500', 'border-l-green-500', 'border-l-pink-500', 'border-l-orange-500'];
                return (
                  <li key={r.id} className={`border-l-4 ${cardColors[idx % cardColors.length]} border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="font-medium">
                        {new Date(r.created_at).toLocaleString(getDateLocale())} - <span className="text-gray-900">{children.find(c => c.id === r.child_id)?.first_name} {children.find(c => c.id === r.child_id)?.last_name}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-gray-800 line-clamp-3 whitespace-pre-wrap">{r.note}</div>
                    {r.domains && r.domains.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.domains.map((d, i) => (
                          <span key={i} className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 font-medium">{DOMAIN_TR[d] || d}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <button className="px-3 py-1 bg-primary text-white rounded-md hover:bg-opacity-90 text-sm font-medium" onClick={() => navigate('child-detail', { id: r.child_id })}>{t('viewChild')} →</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
