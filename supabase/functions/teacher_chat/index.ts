// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: teacher_chat
// Requires secrets: SERVICE_ROLE_KEY, PROJECT_URL, GEMINI_API_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PROJECT_URL = Deno.env.get('PROJECT_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GEMINI_KEY') || '';

type Msg = { role: 'user'|'assistant'|'system'; content: string; at?: string };

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const auth = req.headers.get('Authorization') || '';
    const userJwt = auth.replace(/^Bearer\s+/i, '');
    const body = await req.json();
    const message = String(body?.message || '').trim();
    const mode = (body?.mode || 'general') as 'general'|'class'|'child';
    const classroom = body?.classroom ? String(body.classroom) : undefined;
    const childId = body?.childId ? String(body.childId) : undefined;
    const history: Msg[] = Array.isArray(body?.history) ? body.history.slice(-6) : [];
    if (!message) throw new Error('message is required');

    // DB client acting as the user (so RLS applies)
    const supa = createClient(PROJECT_URL, SERVICE_ROLE_KEY, { global: { headers: { Authorization: auth } } });

    // Build context from DB
    let ctxNotes: string[] = [];
    if (mode === 'child' && childId) {
      const { data } = await supa
        .from('observations')
        .select('created_at, note, domains, assessments(summary, risk)')
        .eq('child_id', childId)
        .order('created_at', { ascending: false })
        .limit(15);
      for (const row of (data || [])) {
        const date = new Date(row.created_at).toLocaleDateString('tr-TR');
        const doms = Array.isArray(row.domains) ? row.domains.join(', ') : '';
        const risk = Array.isArray(row.assessments) && row.assessments[0]?.risk ? String(row.assessments[0].risk) : '';
        const sum = Array.isArray(row.assessments) && row.assessments[0]?.summary ? String(row.assessments[0].summary) : '';
        ctxNotes.push(`- (${date}) [${doms}] Not: ${row.note}${sum ? ` | AI Özet: ${sum}` : ''}${risk ? ` | Risk: ${risk}` : ''}`);
      }
    } else if (mode === 'class' && classroom) {
      const kids = await supa.from('children').select('id').eq('classroom', classroom);
      const ids = (kids.data || []).map((k: any) => k.id);
      if (ids.length > 0) {
        const { data } = await supa
          .from('observations')
          .select('created_at, note, domains, assessments(summary, risk)')
          .in('child_id', ids as any)
          .order('created_at', { ascending: false })
          .limit(20);
        for (const row of (data || [])) {
          const date = new Date(row.created_at).toLocaleDateString('tr-TR');
          const doms = Array.isArray(row.domains) ? row.domains.join(', ') : '';
          const risk = Array.isArray(row.assessments) && row.assessments[0]?.risk ? String(row.assessments[0].risk) : '';
          const sum = Array.isArray(row.assessments) && row.assessments[0]?.summary ? String(row.assessments[0].summary) : '';
          ctxNotes.push(`- (${date}) [${doms}] Not: ${row.note}${sum ? ` | AI Özet: ${sum}` : ''}${risk ? ` | Risk: ${risk}` : ''}`);
        }
      }
    }

    // System primer ("eğitme" / kurallar)
    const system = [
      'ROL: 0-6 yaş erken çocukluk gelişimi uzmanısın; cevapları TÜRKÇE ver.',
      'HEDEF: Öğretmene sınıf içi uygulanabilir, güvenli, kısa ve somut öneriler sun.',
      'KURALLAR: Tıbbi tanı koyma; riskli etkinlik önerme. Gerekirse netleştirici 1-2 soru sor.',
      'BİÇİM: Kısa paragraf + madde işaretli öneriler. Gerekirse örnek etkinlik başlıkları.',
    ].join('\n');

    const ctxHeader = ctxNotes.length ? `BAĞLAM (${mode}):\n${ctxNotes.slice(0, 20).join('\n')}` : 'BAĞLAM: (yok)';
    const histText = history.map(h => `${h.role === 'assistant' ? 'ASİSTAN' : h.role === 'user' ? 'ÖĞRETMEN' : 'SİSTEM'}: ${h.content}`).join('\n');
    const prompt = [system, ctxHeader, histText ? `GEÇMİŞ:\n${histText}` : '', `ÖĞRETMEN: ${message}`, 'ASİSTAN:'].filter(Boolean).join('\n\n');

    const result = await callGemini(GEMINI_API_KEY, prompt);
    return json({ reply: result.text, used_model: result.model, provider_error: result.error || undefined });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 400);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function callGemini(apiKey: string, text: string): Promise<{ text: string; model: string; error?: string }> {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
  ];
  let lastErr: any;
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { temperature: 0.7 } }),
      });
      if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
      const data = await resp.json();
      const t = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!t) throw new Error('empty');
      return { text: t, model: m };
    } catch (e) { lastErr = e; }
  }
  return { text: 'Şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.', model: 'fallback', error: `Gemini error: ${String(lastErr)}` };
}

