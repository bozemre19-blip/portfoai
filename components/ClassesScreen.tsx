import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { getChildren, getClasses, createClass, deleteClass } from '../services/api';
import { t } from '../constants.clean';
import { TrashIcon } from '@heroicons/react/24/outline';

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
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const onDelete = async (className: string, childCount: number) => {
    if (!user) return;

    // Confirmation dialog
    const confirmMessage = childCount > 0
      ? t('deleteClassConfirmWithChildren').replace('{classroom}', className).replace('{childCount}', String(childCount))
      : t('deleteClassConfirm').replace('{classroom}', className);

    if (!confirm(confirmMessage)) return;

    try {
      setDeleting(className);
      await deleteClass(user.id, className);
      // Refresh lists
      const [cls, list] = await Promise.all([
        getClasses(user.id),
        getChildren(user.id)
      ]);
      setClasses(cls);
      setRows(list);
    } catch (e: any) {
      setError(e?.message || t('errorOccurred'));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gradient-purple">🏫 {t('classes')}</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-0 w-full sm:w-64 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder={t('className')} value={newClass} onChange={(e) => setNewClass(e.target.value)} />
          <button className="px-4 py-2 rounded-lg disabled:bg-gray-400 whitespace-nowrap btn-gradient-success" onClick={onCreate} disabled={creating || !newClass.trim()}>{t('createClass')}</button>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg whitespace-nowrap transition" onClick={() => navigate('children')}>{t('allChildren')}</button>
        </div>
      </div>
      {loading && <p className="text-gray-600 font-medium">{t('loading')}</p>}
      {error && <p className="text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}
      {!loading && groups.length === 0 && <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">{t('noClassFound')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(([name, count], idx) => {
          const cardColors = ['card-colorful-purple', 'card-colorful-blue', 'card-colorful-green', 'card-colorful-pink', 'card-colorful-orange'];
          const iconColors = ['text-purple-600', 'text-blue-600', 'text-green-600', 'text-pink-600', 'text-orange-600'];
          const isDeleting = deleting === name;
          return (
            <div
              key={name}
              className={`relative bg-white dark:bg-[#1a1a2e] rounded-lg shadow p-5 hover:shadow-xl transition-all card-colorful ${cardColors[idx % cardColors.length]} ${isDeleting ? 'opacity-50' : ''}`}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(name, count);
                }}
                disabled={isDeleting}
                className="absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-md transition-colors disabled:opacity-50"
                title={t('deleteClass')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>

              {/* Card content - clickable to navigate */}
              <button
                onClick={() => navigate('class-detail', { classroom: name === '—' ? '' : name })}
                className="w-full text-left"
                disabled={isDeleting}
              >
                <div className="flex items-center justify-between pr-8">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('classroom')}</div>
                  <div className={`text-2xl ${iconColors[idx % iconColors.length]}`}>📚</div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2 truncate" title={name}>{name}</div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{count}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('children').toLowerCase()}</span>
                </div>
                {isDeleting && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400">{t('classDeleting')}</div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClassesScreen;


