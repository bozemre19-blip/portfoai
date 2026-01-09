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

        // Build AI prompt - Keep it SHORT for Gemini Free limits
        const observationText = (observations || []).slice(0, 5).map((o: any) => o.note).join('. ');

        const prompt = `Okul öncesi öğretmenisin. Bu gözlemlere dayanarak çocuk gelişim raporu yaz.

GÖZLEMLER: ${observationText || 'Gözlem yok'}

Her alan için 1 cümle yaz. Gözlem yoksa "Yeterli gözlem yok" yaz.

JSON döndür:
{"alanBecerileri":"...","sosyalDuygusal":"...","kavramsal":"...","okuryazarlik":"...","degerler":"...","egilimler":"...","genelDegerlendirme":"..."}`;


        // Call Gemini API with Gemini 2.5 models (matching teacher_chat)
        const models = [
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash-lite-001',
        ];

        let aiContent = null;
        let lastError = null;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8192,
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

                // Log raw response for debugging
                console.log(`Raw Gemini response (first 500 chars):`, text.substring(0, 500));

                // Extract JSON from response - try multiple strategies
                let jsonText = text.trim();

                // Remove markdown code blocks
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                }

                // Try to find JSON object
                let jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    // Maybe it's just plain JSON without any wrapper
                    try {
                        aiContent = JSON.parse(jsonText);
                        console.log('Parsed JSON directly');
                        break;
                    } catch (e) {
                        console.error('Failed to parse as direct JSON:', e);
                        throw new Error(`Failed to parse AI response. Response: ${text.substring(0, 200)}`);
                    }
                }

                aiContent = JSON.parse(jsonMatch[0]);
                break; // Success, exit loop
            } catch (error) {
                lastError = error;
                console.error(`Failed with ${model}:`, error);
                continue; // Try next model
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
