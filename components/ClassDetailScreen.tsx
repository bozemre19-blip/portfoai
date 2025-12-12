import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { getChildren, getChildrenByClassroom, getClassAiSuggestions, deleteClass } from '../services/api';
import ClassTrends from './ClassTrends2';
import { exportClassReportPDF } from './ClassPdfReport';
import type { Child, RiskLevel } from '../types';
import { t, getDateLocale } from '../constants.clean';

interface Props {
  classroom: string;
  navigate: (page: string, params?: any) => void;
}

const ClassDetailScreen: React.FC<Props> = ({ classroom, navigate }) => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [obs7d, setObs7d] = useState(0);
  const [media7d, setMedia7d] = useState(0);
  const [activityDays, setActivityDays] = useState<{ label: string; obs: number; media: number }[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [selRisks, setSelRisks] = useState<Set<RiskLevel>>(new Set());
  const [metaColor, setMetaColor] = useState<string>('#3b82f6');
  const [metaPinned, setMetaPinned] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState(false);
  const [renameValue, setRenameValue] = useState<string>(classroom || '');
  const [childRisks, setChildRisks] = useState<Map<string, RiskLevel | null>>(new Map());
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<string>('');

  const title = classroom || 'â€”';

  // Local meta store for class (color, pinned)
  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`classMeta:${user.id}`);
      const map = raw ? JSON.parse(raw) as Record<string, { color?: string; pinned?: boolean }> : {};
      const meta = map[classroom] || {};
      if (meta.color) setMetaColor(meta.color);
      if (typeof meta.pinned === 'boolean') setMetaPinned(meta.pinned);
    } catch { }
  }, [user, classroom]);

  const saveMeta = (name: string, data: { color?: string; pinned?: boolean }) => {
    if (!user) return;
    const raw = localStorage.getItem(`classMeta:${user.id}`);
    const map = raw ? JSON.parse(raw) as Record<string, { color?: string; pinned?: boolean }> : {};
    map[name] = { ...(map[name] || {}), ...data };
    localStorage.setItem(`classMeta:${user.id}`, JSON.stringify(map));
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        setChildrenLoading(true);
        // Fetch only this classroom's children with minimal columns
        const cls = await getChildrenByClassroom(user.id, classroom);
        setChildren(cls);
        setChildrenLoading(false);

        const ids = (cls || []).map((c) => c.id);
        const since = new Date(); since.setDate(since.getDate() - 7);
        const sinceIso = since.toISOString();

        if (ids.length > 0) {
          const [obsListRes, mediaListRes, latestObsRes] = await Promise.all([
            supabase
              .from('observations')
              .select('id, created_at, child_id, assessments(risk)')
              .eq('user_id', user.id)
              .in('child_id', ids as any)
              .gte('created_at', sinceIso),
            supabase
              .from('media')
              .select('id, created_at, child_id')
              .eq('user_id', user.id)
              .in('child_id', ids as any)
              .gte('created_at', sinceIso),
            // Her çocuk için en son risk değerini çek
            supabase
              .from('observations')
              .select('child_id, assessments(risk)')
              .eq('user_id', user.id)
              .in('child_id', ids as any)
              .order('created_at', { ascending: false })
              .limit(100)
          ]);

          // Her çocuk için en güncel risk değerini bul
          const riskMap = new Map<string, RiskLevel | null>();
          const latestObs = latestObsRes.data || [];
          for (const childId of ids) {
            const childObs = latestObs.filter((o: any) => o.child_id === childId);
            if (childObs.length > 0) {
              const assessments = childObs[0]?.assessments;
              const risk = Array.isArray(assessments) && assessments[0]?.risk;
              riskMap.set(childId, risk || null);
            } else {
              riskMap.set(childId, null);
            }
          }
          setChildRisks(riskMap);

          const obsListRaw = obsListRes.data;
          const obsList = (obsListRaw || []).filter((row: any) => {
            const r = Array.isArray(row.assessments) && row.assessments[0]?.risk;
            const riskOk = selRisks.size === 0 || (r && selRisks.has(r as RiskLevel));
            return riskOk;
          });
          setObs7d(obsList.length);

          const mediaList = mediaListRes.data || [];
          setMedia7d((mediaList as any[]).length || 0);
          const days: { label: string; obs: number; media: number }[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const label = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(d);
            const o = (obsList || []).filter((x: any) => (x.created_at || '').slice(0, 10) === key).length;
            const m = (mediaList || []).filter((x: any) => (x.created_at || '').slice(0, 10) === key).length;
            days.push({ label, obs: o, media: m });
          }
          setActivityDays(days);

          // Fire-and-forget AI suggestions; don't block UI
          getClassAiSuggestions(user.id, {
            days: 30, maxObservations: 60, childIds: ids,
            risks: Array.from(selRisks)
          }).then((res) => {
            if (res?.suggestions?.length) setAiSuggestions(res.suggestions);
            if (res?.summary) setAiSummary(res.summary);
          }).catch(() => { });
        } else {
          setObs7d(0); setMedia7d(0); setActivityDays([]); setAiSuggestions([]); setAiSummary(undefined);
        }
      } catch (e: any) {
        setError(e?.message || 'Hata');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, classroom, Array.from(selRisks).join(',')]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16'];

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return children.filter(c => {
      // Arama filtresi
      const nameMatch = `${c.first_name} ${c.last_name}`.toLocaleLowerCase('tr-TR').includes(q);

      // Risk filtresi
      if (selRisks.size === 0) {
        return nameMatch; // Risk filtresi yoksa sadece isim kontrolü
      }

      const childRisk = childRisks.get(c.id);
      const riskMatch = childRisk && selRisks.has(childRisk);

      return nameMatch && riskMatch;
    });
  }, [children, search, selRisks, childRisks]);
  const toggleRisk = (r: RiskLevel) => setSelRisks(prev => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n; });

  const handleRename = async () => {
    if (!user) return;
    const newName = renameValue.trim();
    if (!newName || newName === classroom) { setShowEdit(false); return; }
    await supabase.from('children').update({ classroom: newName }).eq('user_id', user.id).eq('classroom', classroom);
    // move meta
    saveMeta(newName, { color: metaColor, pinned: metaPinned });
    setShowEdit(false);
    // navigate to new class route
    navigate('class-detail', { classroom: newName });
  };

  const handlePinToggle = () => { setMetaPinned((v) => { const nv = !v; saveMeta(classroom, { pinned: nv }); return nv; }); };
  const handleColorPick = (c: string) => { setMetaColor(c); saveMeta(classroom, { color: c }); };

  const handleDeleteClass = async () => {
    if (!user) return;
    const childCount = children.length;
    const msg = childCount > 0
      ? t('deleteClassConfirmWithChildren').replace('{classroom}', classroom).replace('{childCount}', childCount.toString())
      : t('deleteClassConfirm').replace('{classroom}', classroom);

    if (!confirm(msg)) return;

    setDeleting(true);
    setDeleteProgress(t('classDeleting'));
    try {
      await deleteClass(user.id, classroom, (progress) => setDeleteProgress(progress));
      setShowEdit(false);
      navigate('classes');
    } catch (e: any) {
      setDeleteProgress('Hata: ' + (e?.message || 'Bilinmeyen hata'));
      setDeleting(false);
    }
  };

  // Simple class PDF (printable HTML)


  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: metaColor }} />
          <h1 className="text-2xl font-bold text-gray-900">{t('classLabel')} {title}</h1>
          {metaPinned && <span className="text-xs text-gray-500">({t('pinned')})</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setShowEdit(true)}>{t('edit')}</button>
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => exportClassReportPDF({ className: title, children, obs7d, media7d, activity: activityDays, aiSummary, aiSuggestions })}>{t('pdfDownload')}</button>
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => navigate('classes')}>{t('backToClasses')}</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('childrenList')}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{children.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('last7daysObs')}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{obs7d}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">{t('last7daysProducts')}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{media7d}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">{t('searchChild')}</label>
          <input className="w-full border rounded px-2 py-1.5" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('nameSurnamePlaceholder')} />
        </div>
      </div>

      {/* Children in class (moved above activity) */}
      <div className="mt-4">
        <h2 className="text-lg font-medium text-gray-900">{t('childrenList')}</h2>
        {childrenLoading ? (
          <p>{t('loading')}</p>
        ) : filteredChildren.length === 0 ? (
          <p className="text-gray-500">{t('noChildInClass')}</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChildren.map((c) => (
              <button key={c.id} onClick={() => navigate('child-detail', { id: c.id })} className="bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition">
                <div className="font-semibold text-gray-900 truncate">{c.first_name} {c.last_name}</div>
                <div className="text-xs text-gray-500 truncate">{c.classroom || ""}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Trend & heatmap (8 weeks) */}
      <ClassTrends classroom={classroom} />

      {/* Activity chart */}
      <div className="mt-2 bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-gray-900">{t('activity7days')}</h2>
        </div>
        {activityDays.length === 0 ? (
          <p className="text-gray-500">Veri yok.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2 items-end h-28">
            {activityDays.map((d, i) => {
              const max = Math.max(1, ...activityDays.map(x => x.obs + x.media));
              const total = d.obs + d.media;
              const h = Math.round((total / max) * 88) + 8;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-6 bg-blue-200 rounded-t" style={{ height: `${h}px` }} title={`${d.label}: ${d.obs} gozlem, ${d.media} urun`} />
                  <div className="mt-1 text-xs text-gray-500">{d.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Class AI suggestions */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">{t('aiSuggestionsForClass')}</h2>
        <div className="mt-2 bg-white rounded-lg shadow p-4">
          {aiSummary && <p className="text-gray-800 mb-2 whitespace-pre-wrap">{aiSummary}</p>}
          {aiSuggestions.length === 0 ? (
            <p className="text-gray-500">{t('noSuggestionsYet')}</p>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-gray-800">
              {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
      </div>



      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">{t('editClassTitle')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('className')}</label>
                <input className="w-full border rounded px-2 py-1.5" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">{t('color')}</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button key={c} className={`w-6 h-6 rounded-full ring-2 ${metaColor === c ? 'ring-black' : 'ring-transparent'}`} style={{ backgroundColor: c }} onClick={() => handleColorPick(c)} aria-label={c} />
                  ))}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={metaPinned} onChange={handlePinToggle} />{t('pinClass')}</label>
            </div>
            <div className="mt-5 flex justify-between">
              <button
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteClass}
                disabled={deleting}
              >
                {deleting ? t('deleting') : t('deleteClass')}
              </button>
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setShowEdit(false)} disabled={deleting}>{t('cancel')}</button>
                <button className="px-3 py-2 bg-primary text-white rounded" onClick={handleRename} disabled={deleting}>{t('save')}</button>
              </div>
            </div>
            {deleteProgress && (
              <p className="mt-3 text-sm text-gray-600">{deleteProgress}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailScreen;










