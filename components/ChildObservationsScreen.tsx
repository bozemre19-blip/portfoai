import React, { useEffect, useMemo, useState } from 'react';
import { getObservationsForChild } from '../services/api';
import type { Observation, Assessment, DevelopmentDomain } from '../types';
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

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = (await getObservationsForChild(childId)) as any as ObsItem[];
        setItems(list);
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
  // Yalnızca not metnine göre risk (alan puanları dikkate alınmaz)
  function computeRiskFromNote(noteText: string): 'low' | 'medium' | 'high' {
    const text = (noteText || '').toLocaleLowerCase('tr-TR');
    const severe = ['kavga','vur','ısır','fırlat','kendine zarar','şiddet','yaral'];
    const warn   = ['zorlan','yardım','hatırlatma','sınırlı','kaçın','tereddüt','uyarı','destek','zorluk','müdahale','huzursuz','odaklanamad','dikkati dağıld','kurala uymadı'];
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
      const positive = ['basar','heves','bagimsiz','dogru','katilim','katildi','surdur','ilerle','artti','uzun sure','dengede','yerine yerlestirdi','sakin','tamamladi'];
      const severe = ['kavga','vur','isir','firlat','kendine zarar','siddet','yaral'];
      const warn   = ['zorlan','yardim','hatirlatma','sinirli','kacin','tereddut','uyari','destek','zorluk','mudahale','huzursuz','odaklanamadi','dikkati dagildi','kurala uymadi'];

      const found = (list: string[]) => list.filter(w => text.includes(w));
      const severeFound = found(severe);
      const warnFound = found(warn);
      const positiveFound = found(positive);


      const riskLabel = (function(){ const c = computeRiskFromNote(noteText); return c === 'high' ? 'yüksek' : c === 'medium' ? 'orta' : 'düşük'; })();

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
                        {it.assessments?.risk ? (
                          <button
                            type="button"
                            className="cursor-pointer"
                            title="Risk açıklaması"
                            onClick={() => setRiskInfo(it.assessments as any)}
                          >
                            <RiskPill risk={computeRiskFromNote(it.note)} />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-2 text-gray-800 whitespace-pre-wrap">{it.note}</p>
                      <div className="mt-3 flex gap-2">
                        <button className="px-3 py-1.5 bg-gray-100 rounded" onClick={() => navigate('edit-observation', { observation: it, childId })}>{t('edit')}</button>
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
      {riskInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRiskInfo(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Risk açıklaması</h3>
              <button className="px-2 py-1 text-sm bg-gray-100 rounded" onClick={() => setRiskInfo(null)}>Kapat</button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">Risk:</span>
                <RiskPill risk={computeRiskFromNote(riskNote)} />
              {(() => { const exp = buildRiskExplanation(riskInfo, riskNote); return (
                <div>
                  <div className="font-medium mb-1\">Gerekçe</div>
                  <ul className="list-disc list-inside space-y-1\">
                    {exp.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                  {exp.header && <p className="mt-1 text-gray-600\">{exp.header}</p>}
                </div>
              ); })()}
              </div>
              {riskInfo?.summary ? (
                <div>
                  <div className="font-medium mb-1">Özet</div>
                  <p className="whitespace-pre-wrap">{riskInfo.summary}</p>
                </div>
              ) : null}
              {riskInfo?.domain_scores && Object.keys(riskInfo.domain_scores).length > 0 ? (
                <div>
                  <div className="font-medium mb-1">Alan puanları</div>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(riskInfo.domain_scores).map(([k, v]) => (
                      <li key={k}>{(DEVELOPMENT_DOMAINS as any)[k] || k}: {String(v)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {Array.isArray(riskInfo?.suggestions) && riskInfo!.suggestions.length > 0 ? (
                <div>
                  <div className="font-medium mb-1">Öneriler</div>
                  <ul className="list-disc list-inside space-y-1">
                    {riskInfo!.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildObservationsScreen;




