// No external SDKs; use REST (OpenAI, Google Generative Language)
// Import `serve` from Deno's standard library.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Fix: Declare Deno to resolve TypeScript "Cannot find name 'Deno'" error in non-Deno environments.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// Supabase Deno environment requires specific import patterns
// Environment variables
// - OPENAI_API_KEY (optional): If present, OpenAI (ChatGPT) is used
// - API_KEY (optional): Gemini API key (fallback if OPENAI_API_KEY is not present)
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const API_KEY = Deno.env.get("API_KEY");

// Default CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function logic
async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { observationNote, domains } = await req.json();

    if (!observationNote || !domains || !Array.isArray(domains) || domains.length === 0) {
      return new Response(JSON.stringify({ error: 'observationNote and domains are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prefer OpenAI if key is present; otherwise fall back to Gemini; otherwise fallback static
    if (OPENAI_API_KEY) {
      const assessment = await analyzeWithOpenAI(OPENAI_API_KEY, observationNote, domains);
      return new Response(JSON.stringify({ assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (API_KEY) {
      const assessment = await analyzeWithGemini(API_KEY, observationNote, domains);
      return new Response(JSON.stringify({ assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // No keys: return deterministic fallback
    console.warn("No OPENAI_API_KEY or API_KEY provided. Using fallback analysis.");
    const fallbackAssessment = createFallbackAssessment(observationNote, domains);
    return new Response(JSON.stringify({ assessment: fallbackAssessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    const fallbackAssessment = createFallbackAssessment("AI service failed.", ["cognitive"]);
    return new Response(JSON.stringify({ assessment: fallbackAssessment, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Maarif Model Enhanced System Prompt (Skill & Outcome Based - 2024 Program)
const getMaarifSystemPrompt = () => `
Sen 'Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı' (2024) konusunda uzman bir asistanısın.
Analizlerini programın resmi yapısına (7 Temel Alan ve Bütünleşik Beceriler) göre yap.

**1. ALAN BECERİLERİ (Gözlem hangisine giriyor?):**
*   **Türkçe Alan Becerileri:** (Dinleme/İzleme, Konuşma, Okuma, Erken Okuryazarlık)
*   **Matematik Alan Becerileri:** (Sayma, Muhakeme, Problem Çözme, Veri ile Çalışma)
*   **Fen Alan Becerileri:** (Gözlem, Tahmin, Deney, Çıkarım)
*   **Sosyal Alan Becerileri:** (Sosyal Katılım, Zaman/Mekan Algısı, Eleştirel Düşünme)
*   **Hareket ve Sağlık Alan Becerileri:** (Fiziksel aktivite, Sağlıklı yaşam)
*   **Sanat Alan Becerileri:** (Sanatsal ifade, Estetik)
*   **Müzik Alan Becerileri:** (İşitsel algı, Müzikal ifade)

**2. BÜTÜNLEŞİK BECERİLER (Varsa hangisi destekleniyor?):**
*   **Kavramsal Beceriler:** (Düşünme, Anlama)
*   **Sosyal-Duygusal Öğrenme (SEL):** (Benlik, İlişki, Karar Verme)
*   **Değerler:** (Adalet, Saygı, Sorumluluk, Dostluk vb.)

Analiz Kuralları:
- Çocuğun davranışını yukarıdaki **Alan Becerileri** ve **Alt Beceriler** ile tanımla.
- "Gelişim" yerine "Edinim", "Süreç", "Beceri" ve "Öğrenme Çıktısı" terimlerini kullan.
- Asla "Gelişim geriliği" gibi klinik tanı koyma; "Desteklenmesi gereken süreç" de.

Yanıtı SADECE Türkçe ve belirtilen JSON formatında ver.`;

// Analyze with OpenAI (Chat Completions)
async function analyzeWithOpenAI(apiKey: string, observationNote: string, domains: string[]) {
  const system = getMaarifSystemPrompt();
  const prompt = `Aşağıdaki öğretmen gözlem notunu Maarif Modeli (Beceri ve Çıktı Temelli) perspektifiyle analiz et. Alanlar: ${domains.join(", ")}.\n\nGözlem Notu: "${observationNote}"\n\nSadece Türkçe bir JSON döndür: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. Bir alan değerlendirilemiyorsa o alanı atla. JSON dışında hiçbir metin yazma.`;
  const body = {
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ]
  } as const;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("OpenAI returned empty content");
  return JSON.parse(content);
}

// Analyze with Gemini via REST API (tries multiple model/version combos)
async function analyzeWithGemini(apiKey: string, observationNote: string, domains: string[]) {
  const system = getMaarifSystemPrompt();
  const prompt = `Öğretmen gözlem notunu Maarif Modeli (Beceri ve Çıktı Temelli) perspektifiyle analiz et. Alanlar: ${domains.join(', ')}.\n\nGözlem Notu: "${observationNote}"\n\nSadece Türkçe bir JSON döndür: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. Bir alan değerlendirilemiyorsa o alanı atla. JSON dışında hiçbir şey yazma.`;

  const body = {
    system_instruction: { role: 'system', parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generation_config: { temperature: 0.5, response_mime_type: 'application/json' },
  } as const;

  const attempts: Array<{ version: string; model: string }> = [
    { version: 'v1beta', model: 'gemini-1.5-flash-002' },
    { version: 'v1', model: 'gemini-1.5-flash-002' },
    { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
    { version: 'v1', model: 'gemini-1.5-flash' },
  ];

  let lastErr: unknown;
  for (const { version, model } of attempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Gemini error: ${resp.status} ${text}`);
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text || typeof text !== 'string') throw new Error('Gemini returned empty content');
      const cleaned = text.trim().replace(/^```json\n?|```$/g, '');
      return JSON.parse(cleaned);
    } catch (e) {
      lastErr = e;
      // try next combination
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// Fallback function for when AI service is unavailable
function createFallbackAssessment(note: string, domains: string[]) {
  return {
    summary: `Bu, yapay zeka servisi kullanılamadığında oluşturulan standart bir yanıttır. Gözlem notu: "${note}"`,
    domain_scores: domains.reduce((acc, domain) => ({ ...acc, [domain]: 3 }), {}),
    risk: 'low',
    suggestions: [
      'Çocukla bire bir zaman geçirerek ilgi alanlarını keşfedin.',
      'Açık uçlu sorular sorarak dil gelişimini teşvik edin.',
      'Akranlarıyla olumlu sosyal etkileşimler kurması için fırsatlar yaratın.',
    ],
  };
}

serve(handler);
