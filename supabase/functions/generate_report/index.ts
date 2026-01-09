// Supabase Edge Function: Generate Development Report
// Handles AI-powered report content generation securely on server-side

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

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
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Parse request
        const { childId }: ReportRequest = await req.json();
        if (!childId) throw new Error('childId is required');

        // Collect child data
        const { data: child, error: childError } = await supabase
            .from('children').select('*').eq('id', childId).single();
        if (childError) throw childError;

        // Get teacher info
        const { data: teacher, error: teacherError } = await supabase
            .from('profiles').select('first_name, last_name').eq('id', child.user_id).single();
        if (teacherError) throw teacherError;

        // Get observations
        const { data: observations, error: obsError } = await supabase
            .from('observations').select('note, domains').eq('child_id', childId)
            .order('created_at', { ascending: false });
        if (obsError) throw obsError;

        // Build AI prompt
        const observationText = (observations || []).slice(0, 5).map((o: any) => o.note).join('. ');
        const prompt = `Okul öncesi öğretmenisin. Bu gözlemlere dayanarak çocuk gelişim raporu yaz.
GÖZLEMLER: ${observationText || 'Gözlem yok'}
Her alan için 1 cümle yaz. Gözlem yoksa "Yeterli gözlem yok" yaz.
Sadece JSON döndür, başka metin yazma:
{"alanBecerileri":"...","sosyalDuygusal":"...","kavramsal":"...","okuryazarlik":"...","degerler":"...","egilimler":"...","genelDegerlendirme":"..."}`;

        // Call Gemini API - simple approach like teacher_chat
        const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        let aiContent = null;
        let lastError: unknown = null;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.5 }
                    })
                });
                if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);
                const data = await resp.json();
                const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (!text) throw new Error('empty');
                console.log('Gemini response:', text.substring(0, 300));
                // Parse JSON
                const cleaned = text.trim().replace(/^```json\n?|```$/g, '');
                const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error('No JSON found');
                aiContent = JSON.parse(jsonMatch[0]);
                break;
            } catch (e) {
                lastError = e;
                console.error(`Failed ${model}:`, e);
            }
        }

        if (!aiContent) throw lastError instanceof Error ? lastError : new Error(String(lastError));

        // Format date
        const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const reportData = {
            childName: `${child.first_name} ${child.last_name}`,
            birthDate: formatDate(child.dob),
            teacherName: `${teacher.first_name} ${teacher.last_name}`,
            schoolStartDate: child.created_at ? formatDate(child.created_at) : '',
            reportDate: formatDate(new Date().toISOString()),
            ...aiContent
        };

        return new Response(JSON.stringify({ success: true, data: reportData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
