import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import type { DevelopmentDomain, RiskLevel } from '../types';
import { t, getDomains, getDateLocale, getLanguage } from '../constants.clean';

interface Props { classroom: string }

const DOMAINS: DevelopmentDomain[] = [
  'turkish', 'math', 'science', 'social', 'motor_health', 'art', 'music'
];

// Türkçe etiketler (UTF-8) - artık getDomains() kullanılıyor
const RISK_TR: Record<RiskLevel, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};
const RISK_EN: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};
const getRiskLabels = () => getLanguage() === 'en' ? RISK_EN : RISK_TR;

const ClassTrends: React.FC<Props> = ({ classroom }) => {
  const { user } = useAuth();
  const [weekLabels, setWeekLabels] = useState<string[]>([]);
  const [domainTrend, setDomainTrend] = useState<Record<DevelopmentDomain, number[]>>({
    turkish: [], math: [], science: [], social: [], motor_health: [], art: [], music: []
  });
  const [riskHeat, setRiskHeat] = useState<{ low: number[]; medium: number[]; high: number[] }>({ low: [], medium: [], high: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setError(null);
        const { data: kids, error: kidsErr } = await supabase
          .from('children')
          .select('id')
          .eq('user_id', user.id)
          .eq('classroom', classroom);
        if (kidsErr) throw kidsErr;
        const ids = (kids || []).map((k: any) => k.id);
        if (ids.length === 0) { setWeekLabels([]); setDomainTrend({ turkish: [], math: [], science: [], social: [], motor_health: [], art: [], music: [] }); setRiskHeat({ low: [], medium: [], high: [] }); return; }

        const since8w = new Date(); since8w.setDate(since8w.getDate() - 56);
        const { data: obs8w } = await supabase
          .from('observations')
          .select('id, created_at, domains, assessments(risk)')
          .eq('user_id', user.id)
          .in('child_id', ids as any)
          .gte('created_at', since8w.toISOString());

        const labels: string[] = [];
        const locale = getDateLocale();
        for (let i = 7; i >= 0; i--) {
          const d = new Date(); d.setDate(d.getDate() - i * 7);
          labels.push(new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(d));
        }
        const initArr = () => Array(8).fill(0) as number[];
        const domMap: Record<DevelopmentDomain, number[]> = {
          turkish: initArr(), math: initArr(), science: initArr(), social: initArr(), motor_health: initArr(), art: initArr(), music: initArr()
        };
        const heat = { low: initArr(), medium: initArr(), high: initArr() } as { low: number[]; medium: number[]; high: number[] };

        for (const row of (obs8w || []) as any[]) {
          const t = new Date(row.created_at);
          const diffDays = Math.floor((Date.now() - t.getTime()) / (1000 * 60 * 60 * 24));
          const bucket = Math.min(7, Math.max(0, Math.floor(diffDays / 7)));
          const idx = 7 - bucket;
          const doms: DevelopmentDomain[] = Array.isArray(row.domains) ? row.domains : [];
          for (const d of doms) { if (domMap[d]) domMap[d][idx]++; }
          const r = Array.isArray(row.assessments) && row.assessments[0]?.risk ? row.assessments[0].risk as RiskLevel : null;
          if (r && (heat as any)[r]) (heat as any)[r][idx]++;
        }
        setWeekLabels(labels);
        setDomainTrend(domMap);
        setRiskHeat(heat);
      } catch (e: any) {
        setError(e?.message || 'Hata');
      }
    })();
  }, [user, classroom]);

  if (!user) return null;

  return (
    <>
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">{t('developmentTrend')}</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DOMAINS.map((k) => {
            const arr = domainTrend[k] || [];
            const max = Math.max(1, ...arr);
            return (
              <div key={k} className="border rounded p-2">
                <div className="text-sm text-gray-700 mb-1">{getDomains()[k] || k}</div>
                <div className="flex items-end gap-1 h-16">
                  {arr.map((v, i) => (
                    <div key={i} style={{ height: `${Math.max(6, Math.round((v / max) * 100))}%` }} className="w-3 bg-blue-400 rounded"></div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                  {weekLabels.map((l, i) => (<span key={i}>{l}</span>))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Risk Isı Haritası (8 Hafta)</h2>
        <div className="grid grid-cols-9 gap-2 text-xs">
          <div className="text-gray-600"></div>
          {weekLabels.map((l, i) => (<div key={i} className="text-gray-500 text-center">{l}</div>))}
          {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => {
            const arr = (riskHeat as any)[r] as number[];
            const max = Math.max(1, ...arr);
            const bg = r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981';
            return (
              <React.Fragment key={r}>
                <div className="text-gray-700">{getRiskLabels()[r]}</div>
                {arr.map((v, i) => (
                  <div key={i} className="w-6 h-6 rounded-sm" style={{ opacity: Math.max(0.15, v / max), backgroundColor: bg }} title={`${getRiskLabels()[r]}: ${v}`}></div>
                ))}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ClassTrends;

