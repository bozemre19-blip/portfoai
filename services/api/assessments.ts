import { supabase } from '../supabase';
import type { Assessment, DevelopmentDomain, RiskLevel } from '../../types';
import { dispatchDataChangedEvent } from './common';
import { getLanguage } from '../../constants.clean';

// Gözlem notunu AI ile analiz et
export const getAiAnalysis = async (
  observationNote: string,
  domains: DevelopmentDomain[]
): Promise<Assessment> => {
  const language = getLanguage();
  const { data, error } = await supabase.functions.invoke('ai_evaluate', {
    body: { observationNote, domains, language },
  });
  if (error) throw error;
  return data.assessment as Assessment;
};

// AI analizini veritabanına kaydet ve gözleme bağla
export const addAssessmentForObservation = async (
  observationId: string,
  userId: string,
  analysis: {
    summary: string;
    risk: RiskLevel;
    suggestions: string[];
    domain_scores: Partial<Record<DevelopmentDomain, number>>;
  }
) => {
  const payload = {
    observation_id: observationId,
    user_id: userId,
    summary: analysis.summary,
    risk: analysis.risk,
    suggestions: analysis.suggestions,
    domain_scores: analysis.domain_scores,
  };

  // Upsert: aynı gözlem için yeniden analiz çalıştırılırsa üzerine yazar
  let { data, error } = await supabase
    .from('assessments')
    .upsert(payload, { onConflict: 'observation_id' })
    .select()
    .single();

  if (error) {
    // Fallback: unique index yoksa önce sil sonra ekle
    await supabase.from('assessments').delete().eq('observation_id', observationId);
    const insertRes = await supabase.from('assessments').insert(payload).select().single();
    if (insertRes.error) throw insertRes.error;
    data = insertRes.data as any;
  }

  dispatchDataChangedEvent();
  return data as Assessment;
};

// Kullanıcının tüm gözlemleri için AI analizini yeniden hesapla
export const recomputeAssessmentsForUser = async (
  userId: string,
  opts: { limit?: number; onProgress?: (m: string) => void } = {}
) => {
  const say = (m: string) => opts.onProgress?.(m);
  const limit = opts.limit ?? 60; // güvenlik limiti

  // Gözlemleri ve mevcut assessment'ları çek
  const { data, error } = await supabase
    .from('observations')
    .select('id, child_id, note, domains, assessments(summary)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const items = (data || []) as any[];
  let done = 0;

  for (const row of items) {
    const hasAssessment = Array.isArray(row.assessments) && row.assessments.length > 0;
    const isFallback =
      hasAssessment &&
      String(row.assessments[0]?.summary || '').startsWith('Bu, yapay zeka servisi');

    // Eğer assessment yoksa veya fallback ise yeniden analiz et
    if (!hasAssessment || isFallback) {
      try {
        say?.(`Analiz ediliyor: ${++done}/${items.length}`);
        const analysis = await getAiAnalysis(row.note, row.domains || []);
        await addAssessmentForObservation(row.id, userId, {
          summary: analysis.summary,
          risk: analysis.risk as any,
          suggestions: analysis.suggestions || [],
          domain_scores: analysis.domain_scores as any,
        });
      } catch (e) {
        console.warn('Yeniden analiz başarısız:', row.id, e);
      }
    }
  }

  say?.('Tamamlandı');
};

// Sınıf seviyesinde AI önerileri al (tüm gözlemleri toplu analiz et)
export const getClassAiSuggestions = async (
  userId: string,
  opts: {
    days?: number;
    maxObservations?: number;
    childIds?: string[];
    domains?: DevelopmentDomain[];
    risks?: RiskLevel[];
  } = {}
): Promise<{ suggestions: string[]; summary?: string }> => {
  const days = opts.days ?? 30;
  const maxObservations = opts.maxObservations ?? 40;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  // Son X gün içindeki gözlemleri assessment'larıyla birlikte çek
  let query = supabase
    .from('observations')
    .select('child_id, note, domains, created_at, assessments(risk, suggestions, domain_scores)')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(maxObservations);

  if (opts.childIds && opts.childIds.length > 0) {
    query = query.in('child_id', opts.childIds as any);
  }

  const { data, error } = await query;
  if (error) throw error;

  let observations = (data || []) as any[];

  // Filtreleme: domain ve risk
  if (opts.domains && opts.domains.length > 0) {
    const set = new Set(opts.domains);
    observations = observations.filter((row: any) =>
      Array.isArray(row?.domains) && row.domains.some((d: string) => set.has(d))
    );
  }

  if (opts.risks && opts.risks.length > 0) {
    const rset = new Set(opts.risks);
    observations = observations.filter((row: any) => {
      const a =
        Array.isArray(row?.assessments) && row.assessments.length > 0
          ? row.assessments[0]
          : undefined;
      return a?.risk ? rset.has(a.risk) : false;
    });
  }

  // İstatistik toplama
  const domainSet = new Set<DevelopmentDomain>();
  const domainCounts: Record<string, number> = {};
  let riskLow = 0,
    riskMed = 0,
    riskHigh = 0;
  const suggestionPool: string[] = [];

  for (const row of observations) {
    const doms: DevelopmentDomain[] = Array.isArray(row?.domains) ? row.domains : [];
    for (const d of doms) {
      domainSet.add(d);
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    }

    const assessment =
      Array.isArray(row?.assessments) && row.assessments.length > 0
        ? row.assessments[0]
        : undefined;
    const r = assessment?.risk as string | undefined;
    if (r === 'high') riskHigh++;
    else if (r === 'medium') riskMed++;
    else if (r === 'low') riskLow++;

    const sugArr: string[] = Array.isArray(assessment?.suggestions)
      ? assessment!.suggestions
      : [];
    for (const s of sugArr) {
      if (typeof s === 'string' && s.trim()) suggestionPool.push(s.trim());
    }
  }

  // AI için özet oluştur
  const language = getLanguage();
  const domains = Array.from(domainSet);
  const topDomainLines = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');
  const riskLine = `Low:${riskLow}, Medium:${riskMed}, High:${riskHigh}`;
  const suggestionsList = suggestionPool.map((s) => `- ${s}`).join('\n');

  const aggregateText = language === 'en' ? [
    `Class Summary (last ${days} days):`,
    `Risk Distribution: ${riskLine}`,
    `Area Distribution:\n${topDomainLines || '-'}`,
    '',
    'Individual Student Suggestions List (AI should SUMMARIZE this to class level):',
    suggestionsList || '- No data',
    '',
    'Instruction: Analyze these individual student suggestions, remove duplicates, merge themes and create a list of 6-10 actionable suggestions applicable at the class level. Write short, actionable sentences. Speak only at the class level, do not mention individuals. OUTPUT should be JSON (summary, suggestions).',
  ].join('\n') : [
    `Sınıf Özeti (son ${days} gün):`,
    `Risk Dağılımı: ${riskLine}`,
    `Alan Dağılımı:\n${topDomainLines || '-'}`,
    '',
    'Bireysel Öğrenci Önerileri Listesi (AI bunu ÖZETLEYİP sınıf düzeyine çıkarsın):',
    suggestionsList || '- Veri yok',
    '',
    'Talimat: Bu tek tek öğrenci önerilerini analiz et, tekrarları kaldır, temaları birleştir ve sınıf genelinde uygulanabilir 6–10 maddelik bir öneri listesi çıkar. Kısa, eyleme geçirilebilir cümleler yaz. Yalnızca sınıf düzeyinde konuş, bireylerden bahsetme. ÇIKTI JSON olsun (summary, suggestions).',
  ].join('\n');

  try {
    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai_evaluate', {
      body: { observationNote: aggregateText, domains, language },
    });
    if (aiError) throw aiError;

    const assessment = aiData?.assessment as Assessment | undefined;
    return {
      suggestions: Array.isArray(assessment?.suggestions) ? assessment!.suggestions : [],
      summary: assessment?.summary,
    };
  } catch (e) {
    // Fallback: assessment'lardan en çok tekrar eden önerileri al
    const set = new Set<string>();
    for (const row of observations) {
      const sug =
        Array.isArray(row?.assessments?.[0]?.suggestions)
          ? row.assessments[0].suggestions
          : [];
      for (const s of sug || []) {
        if (typeof s === 'string' && s.trim()) set.add(s.trim());
      }
      if (set.size >= 10) break;
    }
    return { suggestions: Array.from(set).slice(0, 10) };
  }
};

