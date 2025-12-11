import React, { useEffect, useMemo, useState } from 'react';
import { getObservationsForChild, deleteObservation, getMediaForChild, getSignedUrlForMedia } from '../services/api';
import type { Observation, Assessment, DevelopmentDomain, Media } from '../types';
import { DEVELOPMENT_DOMAINS, t } from '../constants.clean';

type ObsItem = Observation & { assessments: Assessment | null };

interface Props {
  childId: string;
  navigate: (page: string, params?: any) => void;
}

const RiskPill: React.FC<{ risk?: string | null }> = ({ risk }) => {
  const map: Record<string, { label: string; cls: string }> = {
    low: { label: 'Düşük', cls: 'bg-green-100 text-green-700' },
    medium: { label: 'Orta', cls: 'bg-amber-100 text-amber-800' },
    high: { label: 'Yüksek', cls: 'bg-red-100 text-red-700' },
  };
  const item = risk ? map[String(risk)] : undefined;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${item ? item.cls : 'bg-gray-100 text-gray-700'}`}>
      {item ? item.label : 'â€”'}
    </span>
  );
};

const DomainPill: React.FC<{ name: string }> = ({ name }) => (
  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
    {DEVELOPMENT_DOMAINS[name as DevelopmentDomain] || name}
  </span>
);

const ChildObservationsScreen: React.FC<Props> = ({ childId, navigate }) => {
  const [items, setItems] = useState<ObsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<DevelopmentDomain>>(new Set());
  const [riskInfo, setRiskInfo] = useState<Assessment | null>(null);
  const [riskNote, setRiskNote] = useState<string>('');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [observations, media] = await Promise.all([
          getObservationsForChild(childId),
          getMediaForChild(childId)
        ]);
        setItems(observations as any as ObsItem[]);
        setMediaList(media);

        // Get signed URLs for all media
        const urls: Record<string, string> = {};
        for (const m of media) {
          try {
            const url = await getSignedUrlForMedia(m.storage_path);
            urls[m.id] = url;
          } catch (e) {
            console.error('Media URL alınamadı:', m.id, e);
          }
        }
        setMediaUrls(urls);
      } catch (e: any) {
        setError(e?.message || 'Hata');
      } finally {
        setLoading(false);
      }
    })();
  }, [childId]);

  const domainKeys = useMemo(() => Object.keys(DEVELOPMENT_DOMAINS) as DevelopmentDomain[], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    const hasFilter = selected.size > 0;
    return items.filter((it) => {
      const note = (it.note || '').toLocaleLowerCase('tr-TR');
      const textOk = !q || note.includes(q);
      const doms = ((it as any).domains || []) as DevelopmentDomain[];
      const domOk = !hasFilter || doms.some((d) => selected.has(d));
      return textOk && domOk;
    });
  }, [items, search, selected]);

  // Group by domain for rendering sections
  const grouped = useMemo(() => {
    const map: Record<DevelopmentDomain, ObsItem[]> = {
      cognitive: [], language: [], social_emotional: [], fine_motor: [], gross_motor: [], self_care: []
    };
    for (const it of filtered) {
      const doms = ((it as any).domains || []) as DevelopmentDomain[];
      for (const d of doms) {
        if (map[d]) map[d].push(it);
      }
    }
    return map;
  }, [filtered]);

  const toggleDomain = (d: DevelopmentDomain) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const clearFilters = () => { setSearch(''); setSelected(new Set()); };

  const handleDelete = async (observationId: string) => {
    if (!confirm('Bu gözlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      await deleteObservation(observationId);
      // Listeyi güncelle
      setItems(prev => prev.filter(it => it.id !== observationId));
      alert('✅ Gözlem başarıyla silindi');
    } catch (e: any) {
      alert('❌ Gözlem silinirken hata oluştu: ' + (e?.message || 'Bilinmeyen hata'));
    }
  };

  // Yalnızca not metnine göre risk (alan puanları dikkate alınmaz)
  function computeRiskFromNote(noteText: string): 'low' | 'medium' | 'high' {
    const text = (noteText || '').toLocaleLowerCase('tr-TR');
    const severe = ['kavga', 'vur', 'ısır', 'fırlat', 'kendine zarar', 'şiddet', 'yaral'];
    const warn = ['zorlan', 'yardım', 'hatırlatma', 'sınırlı', 'kaçın', 'tereddüt', 'uyarı', 'destek', 'zorluk', 'müdahale', 'huzursuz', 'odaklanamad', 'dikkati dağıld', 'kurala uymadı'];
    const has = (list: string[]) => list.some(w => text.includes(w));
    const warnCount = warn.filter(w => text.includes(w)).length;
    if (has(severe)) return 'high';
    if (warnCount >= 3) return 'medium';
    return 'low';
  }
  // Risk explanation builder (ASCII to avoid encoding issues)
  const buildRiskExplanation = (a: Assessment | null, noteText: string): { header: string; reasons: string[] } => {
    if (!a) return { header: '', reasons: [] };
    try {
      const text = (noteText || '').toLocaleLowerCase('tr-TR');
      const reasons: string[] = [];
      const positive = ['basar', 'heves', 'bagimsiz', 'dogru', 'katilim', 'katildi', 'surdur', 'ilerle', 'artti', 'uzun sure', 'dengede', 'yerine yerlestirdi', 'sakin', 'tamamladi'];
      const severe = ['kavga', 'vur', 'isir', 'firlat', 'kendine zarar', 'siddet', 'yaral'];
      const warn = ['zorlan', 'yardim', 'hatirlatma', 'sinirli', 'kacin', 'tereddut', 'uyari', 'destek', 'zorluk', 'mudahale', 'huzursuz', 'odaklanamadi', 'dikkati dagildi', 'kurala uymadi'];

      const found = (list: string[]) => list.filter(w => text.includes(w));
      const severeFound = found(severe);
      const warnFound = found(warn);
      const positiveFound = found(positive);


      const riskLabel = (function () { const c = computeRiskFromNote(noteText); return c === 'high' ? 'yüksek' : c === 'medium' ? 'orta' : 'düşük'; })();

      if (severeFound.length > 0) reasons.push(`Notta şu ciddi ifadeler bulundu: ${severeFound.join(", ")}`);
      if (warnFound.length > 0) reasons.push(`Notta şu uyarı işaretleri görüldü: ${warnFound.join(", ")}`);
      if (positiveFound.length > 0) reasons.push(`Olumlu ifadeler ağırlıkta: ${positiveFound.join(", ")}`);


      if (reasons.length === 0) {
        if (a.risk === 'low') reasons.push('Olumlu göstergeler ve dengeli alan puanları.');
        if (a.risk === 'medium') reasons.push('Bazı uyarı işaretleri ve/veya orta düzey alan puanları.');
        if (a.risk === 'high') reasons.push('Ciddi davranış göstergeleri ve/veya düşük alan puanları.');
      }

      return { header: `Bu nedenle ${riskLabel} risk verilmiştir.`, reasons };
    } catch { return { header: '', reasons: [] }; }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => navigate('child-detail', { id: childId })}>Geri</button>
        <h1 className="text-xl font-bold">Kaydedilen Gözlemler</h1>
        <button className="px-3 py-2 bg-primary text-white rounded" onClick={() => navigate('add-observation', { childId })}>{t('addObservation')}</button>
      </div>

      {loading && <p>{t('loading')}</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && items.length === 0 && <p className="text-gray-500">Gözlem bulunamadı.</p>}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left filter panel */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-2">Filtreler</h2>
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Ara</label>
              <input
                className="w-full border rounded px-2 py-1.5"
                placeholder="notlarda ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <div className="block text-sm text-gray-700 mb-1">Gelisim Alanlari</div>
              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {domainKeys.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selected.has(d)} onChange={() => toggleDomain(d)} />
                    <span>{DEVELOPMENT_DOMAINS[d]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1.5 bg-gray-200 rounded" onClick={clearFilters}>Temizle</button>
            </div>
          </div>
        </aside>

        {/* Right results grouped by domain */}
        <section className="md:col-span-8 lg:col-span-9">
          {search || selected.size > 0 ? (
            <p className="text-sm text-gray-500 mb-2">{filtered.length} sonuc</p>
          ) : null}
          {domainKeys.map((d) => {
            // If domain filter active and this domain not selected, skip section
            if (selected.size > 0 && !selected.has(d)) return null;
            const list = grouped[d] || [];
            if (list.length === 0) return null;
            return (
              <div key={d} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">{DEVELOPMENT_DOMAINS[d]}</h3>
                  <span className="text-xs text-gray-500">({list.length})</span>
                </div>
                <div className="space-y-3">
                  {list.map((it) => (
                    <div key={`${d}-${it.id}`} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-gray-500 flex items-center gap-2 flex-wrap">
                          {new Date((it as any).created_at).toLocaleString('tr-TR')}
                          {(it as any).domains && (it as any).domains.length > 0 && (
                            <span className="flex items-center gap-1">
                              {((it as any).domains as string[]).map((dn, idx) => (
                                <DomainPill key={idx} name={dn} />
                              ))}
                            </span>
                          )}
                        </div>

                      </div>
                      <p className="mt-2 text-gray-800 whitespace-pre-wrap">{it.note}</p>

                      {/* Fotoğraflar */}
                      {it.media_ids && it.media_ids.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {it.media_ids.map((mediaId) => {
                            const url = mediaUrls[mediaId];
                            const media = mediaList.find(m => m.id === mediaId);
                            if (!url) return null;
                            return (
                              <div key={mediaId} className="relative group">
                                <img
                                  src={url}
                                  alt={media?.name || 'Gözlem fotoğrafı'}
                                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 group-hover:border-indigo-400 transition-all cursor-pointer shadow-sm"
                                  onClick={() => window.open(url, '_blank')}
                                />
                                {media?.name && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg truncate">
                                    {media.name}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
                          onClick={() => navigate('edit-observation', { observation: it, childId })}
                        >
                          ✏️ {t('edit')}
                        </button>
                        <button
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded transition-colors"
                          onClick={() => handleDelete(it.id)}
                        >
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {/* If no domain produced output, show empty state */}
          {domainKeys.every((d) => (selected.size > 0 && !selected.has(d)) || (grouped[d] || []).length === 0) && (
            <p className="text-gray-500">Sonuç bulunamadı.</p>
          )}
        </section>
      </div>
    </div>
  );
};




export default ChildObservationsScreen;
