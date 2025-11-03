import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { getChildren, getClasses, createClass } from '../services/api';

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
        } catch (e:any) {
          // Table yoksa kullanıcıya bilgilendirme mesajı geçilir
          if (!String(e?.message||'').includes("'classes'")) setError(e?.message||'Hata');
        }
      } catch (e: any) {
        setError(e?.message || 'Hata');
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
      return classes.map(c => [c.name, countMap.get(c.name)||0] as [string, number]);
    }
    // fallback: mevcut veriden gruplama (classes tablosu yoksa)
    const map = new Map<string, number>();
    for (const r of rows || []) { const key = (r.classroom || '—') as string; map.set(key, (map.get(key)||0)+1); }
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
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
    } catch (e:any) {
      setError(e?.message||'Sınıf eklenemedi');
    } finally { setCreating(false); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sınıflar</h1>
        <div className="flex items-center gap-2">
          <input className="border rounded px-2 py-1" placeholder="Yeni sınıf adı" value={newClass} onChange={(e)=>setNewClass(e.target.value)} />
          <button className="px-3 py-2 bg-primary text-white rounded disabled:bg-gray-400" onClick={onCreate} disabled={creating || !newClass.trim()}>Sınıf Oluştur</button>
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => navigate('children')}>Tüm Çocuklar</button>
        </div>
      </div>
      {loading && <p>Yükleniyor…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && groups.length === 0 && <p className="text-gray-500">Sınıf bulunamadı. Üstten yeni sınıf oluşturabilirsiniz.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(([name, count]) => (
          <button
            key={name}
            onClick={() => navigate('class-detail', { classroom: name === '—' ? '' : name })}
            className="bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition"
          >
            <div className="text-sm text-gray-500">Sınıf</div>
            <div className="text-xl font-semibold text-gray-900 truncate" title={name}>{name}</div>
            <div className="mt-1 text-gray-700">{count} öğrenci</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClassesScreen;

