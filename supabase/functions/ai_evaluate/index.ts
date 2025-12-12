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
    const { observationNote, domains, language = 'tr' } = await req.json();

    if (!observationNote || !domains || !Array.isArray(domains) || domains.length === 0) {
      return new Response(JSON.stringify({ error: 'observationNote and domains are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prefer OpenAI if key is present; otherwise fall back to Gemini; otherwise fallback static
    if (OPENAI_API_KEY) {
      const assessment = await analyzeWithOpenAI(OPENAI_API_KEY, observationNote, domains, language);
      return new Response(JSON.stringify({ assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (API_KEY) {
      const assessment = await analyzeWithGemini(API_KEY, observationNote, domains, language);
      return new Response(JSON.stringify({ assessment }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // No keys: return deterministic fallback
    console.warn("No OPENAI_API_KEY or API_KEY provided. Using fallback analysis.");
    const fallbackAssessment = createFallbackAssessment(observationNote, domains, language);
    return new Response(JSON.stringify({ assessment: fallbackAssessment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    const fallbackAssessment = createFallbackAssessment("AI service failed.", ["cognitive"], 'tr');
    return new Response(JSON.stringify({ assessment: fallbackAssessment, error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Maarif Model Enhanced System Prompt (Skill & Outcome Based - 2024 Program)
const getMaarifSystemPrompt = (language: string) => {
  if (language === 'en') {
    return `
You are an educational assistant specialized in the 'Turkey Century Maarif Model Pre-School Education Program' (2024).
Your analyses should ONLY follow the new program structure (7 Core Areas). DO NOT use old program terms.

**STRICTLY PROHIBITED TERMS (NEVER use these):**
- "Cognitive Development" (USE INSTEAD: Mathematics or Science Area)
- "Motor Development" (USE INSTEAD: Movement and Health Area)
- "Self-Care" (USE INSTEAD: Movement and Health or Social Area)
- "Acquisition" and "Indicator" (USE INSTEAD: Learning Outcome)
- "Developmental Areas" (USE INSTEAD: Skill Areas)

**1. VALID SKILL AREAS (Only reference these):**
*   **Turkish Language Area:** (Listening, Speaking, Vocabulary, Early Literacy)
*   **Mathematics Area:** (Mathematical Relationships, Numbers, Operations, Geometry, Data)
*   **Science Area:** (Scientific Process, Living Things, Earth and Universe, Matter and Energy)
*   **Social Area:** (Self, Social-Emotional, Cultural Heritage, Life Knowledge)
*   **Movement and Health Area:** (Physical Activity, Healthy Living, Safety)
*   **Art Area:** (Visual Arts, Aesthetics)
*   **Music Area:** (Auditory Perception, Musical Expression)

**2. INTEGRATED SKILLS (Highlight if present):**
*   **Conceptual Skills**
*   **Social-Emotional Learning (SEL)**
*   **Values** (Justice, Friendship, Honesty, Patience, Respect, Love, Responsibility, Patriotism, Helpfulness)

**Analysis Format:**
- Interpret the child's action in the context of **"Learning Outcome"**.
- Instead of "developmental delay", use **"Process components that need support"**.
- In the summary, indicate which **Skill Area** the child has acquired or is in process of acquiring.

Respond ONLY in English and in the specified JSON format.`;
  }

  return `
Sen 'Türkiye Yüzyılı Maarif Modeli Okul Öncesi Eğitim Programı' (2024) konusunda uzmanlaşmış bir eğitim asistanısın.
Analizlerini SADECE programın yeni yapısına (7 Temel Alan) göre yapmalısın. Eski program terimlerini KULLANMA.

**KESİNLİKLE YASAKLI TERİMLER (Bunları ASLA kullanma):**
- "Bilişsel Gelişim" (YERİNE: Matematik veya Fen Alanı)
- "Motor Gelişim" (YERİNE: Hareket ve Sağlık Alanı)
- "Öz Bakım" (YERİNE: Hareket ve Sağlık veya Sosyal Alan)
- "Kazanım" ve "Gösterge" (YERİNE: Öğrenme Çıktısı)
- "Gelişim Alanları" (YERİNE: Beceri Alanları)

**1. GEÇERLİ ALAN BECERİLERİ (Sadece bunları referans al):**
*   **Türkçe Alanı:** (Dinleme, Konuşma, Sözcük Dağarcığı, Erken Okuryazarlık)
*   **Matematik Alanı:** (Matematiksel İlişkiler, Sayı, İşlem, Geometri, Veri)
*   **Fen Alanı:** (Bilimsel Süreç, Canlılar, Dünya ve Evren, Madde ve Enerji)
*   **Sosyal Alanı:** (Benlik, Sosyal Duygusal, Kültürel Miras, Hayat Bilgisi)
*   **Hareket ve Sağlık Alanı:** (Fiziksel Etkinlik, Sağlıklı Yaşam, Güvenlik)
*   **Sanat Alanı:** (Görsel Sanatlar, Estetik)
*   **Müzik Alanı:** (İşitsel Algı, Müzikal İfade)

**2. BÜTÜNLEŞİK BECERİLER (Varsa vurgula):**
*   **Kavramsal Beceriler**
*   **Sosyal-Duygusal Öğrenme (SEL)**
*   **Değerler** (Adalet, Dostluk, Dürüstlük, Sabır, Saygı, Sevgi, Sorumluluk, Vatanseverlik, Yardımseverlik)

**Analiz Formatı:**
- Çocuğun eylemini **"Öğrenme Çıktısı"** (Learning Outcome) bağlamında yorumla.
- "Gelişim geriliği" gibi ifadeler yerine **"Desteklenmesi gereken süreç bileşenleri"** de.
- Özet kısmında; çocuğun hangi **Alan Becerisini** edindiğini veya süreçte olduğunu belirt.

Yanıtı SADECE Türkçe ve belirtilen JSON formatında ver.`;
};

// Analyze with OpenAI (Chat Completions)
async function analyzeWithOpenAI(apiKey: string, observationNote: string, domains: string[], language: string) {
  const system = getMaarifSystemPrompt(language);
  const langInstruction = language === 'en'
    ? 'Return ONLY an English JSON'
    : 'Sadece Türkçe bir JSON döndür';
  const prompt = language === 'en'
    ? `Analyze the following teacher observation note from the Maarif Model (Skill and Outcome Based) perspective. Areas: ${domains.join(", ")}.\n\nObservation Note: "${observationNote}"\n\n${langInstruction}: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. If an area cannot be evaluated, skip it. Do not write any text other than JSON.`
    : `Aşağıdaki öğretmen gözlem notunu Maarif Modeli (Beceri ve Çıktı Temelli) perspektifiyle analiz et. Alanlar: ${domains.join(", ")}.\n\nGözlem Notu: "${observationNote}"\n\n${langInstruction}: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. Bir alan değerlendirilemiyorsa o alanı atla. JSON dışında hiçbir metin yazma.`;

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
async function analyzeWithGemini(apiKey: string, observationNote: string, domains: string[], language: string) {
  const system = getMaarifSystemPrompt(language);
  const langInstruction = language === 'en'
    ? 'Return ONLY an English JSON'
    : 'Sadece Türkçe bir JSON döndür';
  const prompt = language === 'en'
    ? `Analyze the teacher observation note from the Maarif Model (Skill and Outcome Based) perspective. Areas: ${domains.join(', ')}.\n\nObservation Note: "${observationNote}"\n\n${langInstruction}: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. If an area cannot be evaluated, skip it. Do not write anything other than JSON.`
    : `Öğretmen gözlem notunu Maarif Modeli (Beceri ve Çıktı Temelli) perspektifiyle analiz et. Alanlar: ${domains.join(', ')}.\n\nGözlem Notu: "${observationNote}"\n\n${langInstruction}: { summary: string, domain_scores: { [domain]: 1..5 }, risk: 'low'|'medium'|'high', suggestions: string[3] }. Bir alan değerlendirilemiyorsa o alanı atla. JSON dışında hiçbir şey yazma.`;

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
function createFallbackAssessment(note: string, domains: string[], language: string) {
  if (language === 'en') {
    return {
      summary: `This is a standard response generated when the AI service is unavailable. Observation note: "${note}"`,
      domain_scores: domains.reduce((acc, domain) => ({ ...acc, [domain]: 3 }), {}),
      risk: 'low',
      suggestions: [
        'Spend one-on-one time with the child to discover their interests.',
        'Encourage language development by asking open-ended questions.',
        'Create opportunities for positive social interactions with peers.',
      ],
    };
  }
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
