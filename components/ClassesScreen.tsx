import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { getChildren, getClasses, createClass } from '../services/api';
import { t } from '../constants.clean';

interface ClassesScreenProps {
  navigate: (page: string, params?: any) => void;
}

const ClassesScreen: React.FC<ClassesScreenProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [newClass, setNewClass] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        const list = await getChildren(user.id);
        setRows(list);
        try {
          const cls = await getClasses(user.id);
          setClasses(cls);
        } catch (e: any) {
          // Table yoksa kullanıcıya bilgilendirme mesajı geçilir
          if (!String(e?.message || '').includes("'classes'")) setError(e?.message || t('errorOccurred'));
        }
      } catch (e: any) {
        setError(e?.message || t('errorOccurred'));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const groups = useMemo(() => {
    if (classes.length > 0) {
      const countMap = new Map<string, number>();
      for (const r of rows || []) {
        const key = (r.classroom || '—') as string;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
      return classes.map(c => [c.name, countMap.get(c.name) || 0] as [string, number]);
    }
    // fallback: mevcut veriden gruplama (classes tablosu yoksa)
    const map = new Map<string, number>();
    for (const r of rows || []) { const key = (r.classroom || '—') as string; map.set(key, (map.get(key) || 0) + 1); }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows, classes]);

  const onCreate = async () => {
    if (!user || !newClass.trim()) return;
    try {
      setCreating(true);
      await createClass(user.id, newClass.trim());
      setNewClass('');
      // Refresh list
      const cls = await getClasses(user.id);
      setClasses(cls);
    } catch (e: any) {
      setError(e?.message || t('classAddError'));
    } finally { setCreating(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gradient-purple">🏫 {t('classes')}</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-0 w-full sm:w-64 focus:ring-2 focus:ring-primary focus:border-transparent" placeholder={t('className')} value={newClass} onChange={(e) => setNewClass(e.target.value)} />
          <button className="px-4 py-2 rounded-lg disabled:bg-gray-400 whitespace-nowrap btn-gradient-success" onClick={onCreate} disabled={creating || !newClass.trim()}>{t('createClass')}</button>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg whitespace-nowrap transition" onClick={() => navigate('children')}>{t('allChildren')}</button>
        </div>
      </div>
      {loading && <p className="text-gray-600 font-medium">{t('loading')}</p>}
      {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
      {!loading && groups.length === 0 && <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">{t('noClassFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(([name, count], idx) => {
          const cardColors = ['card-colorful-purple', 'card-colorful-blue', 'card-colorful-green', 'card-colorful-pink', 'card-colorful-orange'];
          const iconColors = ['text-purple-600', 'text-blue-600', 'text-green-600', 'text-pink-600', 'text-orange-600'];
          return (
            <button
              key={name}
              onClick={() => navigate('class-detail', { classroom: name === '—' ? '' : name })}
              className={`bg-white rounded-lg shadow p-5 text-left hover:shadow-xl transition-all card-colorful ${cardColors[idx % cardColors.length]}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('classroom')}</div>
                <div className={`text-2xl ${iconColors[idx % iconColors.length]}`}>📚</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2 truncate" title={name}>{name}</div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-lg font-semibold text-gray-700">{count}</span>
                <span className="text-sm text-gray-500">{t('children').toLowerCase()}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ClassesScreen;


