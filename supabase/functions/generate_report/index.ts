// Supabase Edge Function: Generate Development Report
// Handles AI-powered report content generation securely on server-side

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
    childId: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get environment variables
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('API_KEY') || '';

        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured in Edge Function secrets');
        }

        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Parse request
        const { childId }: ReportRequest = await req.json();

        if (!childId) {
            throw new Error('childId is required');
        }

        // Collect child data
        const { data: child, error: childError } = await supabase
            .from('children')
            .select('*')
            .eq('id', childId)
            .single();

        if (childError) throw childError;

        // Get teacher info
        const { data: teacher, error: teacherError } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', child.user_id)
            .single();

        if (teacherError) throw teacherError;

        // Get observations
        const { data: observations, error: obsError } = await supabase
            .from('observations')
            .select('note, domains, created_at, context')
            .eq('child_id', childId)
            .order('created_at', { ascending: false });

        if (obsError) throw obsError;

        // Get goals
        const { data: goals, error: goalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('child_id', childId);

        if (goalsError) throw goalsError;

        // Calculate age
        const calculateAge = (birthDate: string): number => {
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        };

        // Build AI prompt
        const prompt = `
Sen bir okul öncesi eğitim uzmanısın. Aşağıdaki çocuğa ait gözlem ve değerlendirmeleri analiz ederek gelişim raporunu doldur.

ÇOCUK BİLGİLERİ:
İsim: ${child.first_name} ${child.last_name}
Doğum Tarihi: ${child.dob}
Yaş: ${calculateAge(child.dob)} yaş
Sınıf: ${child.classroom || 'Belirtilmemiş'}

GÖZLEMLER (${observations?.length || 0} adet):
${(observations || []).slice(0, 50).map((o: any, i: number) =>
            `${i + 1}. ${o.note} ${o.context ? '(Bağlam: ' + o.context + ')' : ''} (Alan: ${o.domains?.join(', ') || 'Belirtilmemiş'})`
        ).join('\n')}

HEDEFLER:
${(goals || []).length > 0 ? goals.map((g: any) => `- ${g.description}`).join('\n') : 'Henüz hedef belirlenmemiş'}

DOLDURULMASI GEREKEN ALANLAR:
1. Alan Becerileri (Fiziksel gelişim, motor beceriler, sanat, müzik, oyun becerileri)
2. Sosyal-Duygusal Öğrenme Becerileri (Duygularını tanıma ve ifade etme, empati, arkadaşlık ilişkileri, grup çalışması)
3. Kavramsal Beceriler (Matematik kavramları, fen ve doğa, problem çözme, mantıksal düşünme)
4. Okuryazarlık Becerileri (Dil gelişimi, kelime hazinesi, dinleme becerileri, okuma-yazma hazırlığı)
5. Değerler (Saygı, sorumluluk, dürüstlük, paylaşma, yardımseverlik)
6. Eğilimler (Merak, yaratıcılık, sebat, bağımsızlık, öz güven)
7. Genel Değerlendirme ve Öneriler (Çocuğun genel gelişimi, güçlü yönleri, gelişim alanları, aileye öneriler)

ÖNEMLİ TALİMATLAR:
- Her alan için gözlemlere dayalı SOMUT ÖRNEKLER ver
- Gelişim sürecini kronolojik olarak açıkla
- Güçlü yönleri vurgula ve övgüyle bahset
- Geliştirilmesi gereken alanları yapıcı bir dille belirt
- Profesyonel, olumlu ve teşvik edici bir dil kullan
- Her alan için 4-6 cümle yaz (çok kısa olmasın)
- Ailelerin anlayabileceği sade bir Türkçe kullan
- Teknik terimlerden kaçın, günlük dil kullan

JSON formatında döndür (sadece JSON, başka açıklama ekleme):
{
  "alanBecerileri": "...",
  "sosyalDuygusal": "...",
  "kavramsal": "...",
  "okuryazarlik": "...",
  "degerler": "...",
  "egilimler": "...",
  "genelDegerlendirme": "..."
}
`;

        // Call Gemini API with multiple version/model combinations (matching ai_evaluate)
        const attempts: Array<{ version: string; model: string }> = [
            { version: 'v1beta', model: 'gemini-1.5-flash-002' },
            { version: 'v1', model: 'gemini-1.5-flash-002' },
            { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
            { version: 'v1', model: 'gemini-1.5-flash' },
        ];

        let aiContent = null;
        let lastError = null;

        for (const { version, model } of attempts) {
            try {
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                        },
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!text) {
                    throw new Error('Empty response from Gemini');
                }

                // Extract JSON from response
                let jsonText = text.trim();
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                }

                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('Failed to parse AI response');
                }

                aiContent = JSON.parse(jsonMatch[0]);
                break; // Success, exit loop
            } catch (error) {
                lastError = error;
                console.error(`Failed with ${version}/${model}:`, error);
                continue; // Try next combination
            }
        }

        if (!aiContent) {
            throw new Error(`All Gemini models failed. Last error: ${lastError}`);
        }

        // Format date helper
        const formatDate = (dateStr: string): string => {
            const date = new Date(dateStr);
            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        };

        // Prepare final report data
        const reportData = {
            childName: `${child.first_name} ${child.last_name}`,
            birthDate: formatDate(child.dob),
            teacherName: `${teacher.first_name} ${teacher.last_name}`,
            schoolStartDate: child.created_at ? formatDate(child.created_at) : '',
            reportDate: formatDate(new Date().toISOString()),
            ...aiContent,
        };

        return new Response(JSON.stringify({ success: true, data: reportData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error generating report:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
