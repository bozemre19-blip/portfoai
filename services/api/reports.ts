/**
 * Development Report Generation Service (Client-Side)
 * Handles AI-powered report generation
 */

import { supabase } from '../supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChildData {
    id: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    school_start_date?: string;
    classroom?: string;
}

interface Observation {
    note: string;
    domains: string[];
    created_at: string;
    context?: string;
}

interface Assessment {
    domain: string;
    score: number;
    notes?: string;
}

interface ReportContent {
    alanBecerileri: string;
    sosyalDuygusal: string;
    kavramsal: string;
    okuryazarlik: string;
    degerler: string;
    egilimler: string;
    genelDegerlendirme: string;
}

/**
 * Collect all relevant data for a child
 */
export async function collectChildData(childId: string) {
    // Get child info
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

    // Get observations (both teacher and family)
    const { data: observations, error: obsError } = await supabase
        .from('observations')
        .select('note, domains, created_at, context')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

    if (obsError) throw obsError;

    // Get assessments
    const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

    if (assessError) throw assessError;

    // Get goals
    const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('child_id', childId);

    if (goalsError) throw goalsError;

    return {
        child,
        teacher,
        observations: observations || [],
        assessments: assessments || [],
        goals: goals || []
    };
}

/**
 * Generate AI content for report sections using Gemini
 */
export async function generateReportContent(childData: any): Promise<ReportContent> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Sen bir okul öncesi eğitim uzmanısın. Aşağıdaki çocuğa ait gözlem ve değerlendirmeleri analiz ederek gelişim raporunu doldur.

ÇOCUK BİLGİLERİ:
İsim: ${childData.child.first_name} ${childData.child.last_name}
Doğum Tarihi: ${childData.child.birth_date}
Yaş: ${calculateAge(childData.child.birth_date)} yaş
Sınıf: ${childData.child.classroom || 'Belirtilmemiş'}

GÖZLEMLER (${childData.observations.length} adet):
${childData.observations.slice(0, 50).map((o: Observation, i: number) =>
        `${i + 1}. ${o.note} ${o.context ? '(Bağlam: ' + o.context + ')' : ''} (Alan: ${o.domains?.join(', ') || 'Belirtilmemiş'})`
    ).join('\n')}

DEĞERLENDİRMELER:
${childData.assessments.length > 0 ? childData.assessments.map((a: Assessment) =>
        `${a.domain}: ${a.score}/5 ${a.notes ? '- ' + a.notes : ''}`
    ).join('\n') : 'Henüz değerlendirme yapılmamış'}

HEDEFLER:
${childData.goals.length > 0 ? childData.goals.map((g: any) => `- ${g.description}`).join('\n') : 'Henüz hedef belirlenmemiş'}

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

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response: ' + response);
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate complete development report data
 */
export async function generateDevelopmentReportData(childId: string) {
    // Collect data
    const childData = await collectChildData(childId);

    // Generate AI content
    const aiContent = await generateReportContent(childData);

    // Prepare report data
    const reportData = {
        childName: `${childData.child.first_name} ${childData.child.last_name}`,
        birthDate: formatDate(childData.child.birth_date),
        teacherName: `${childData.teacher.first_name} ${childData.teacher.last_name}`,
        schoolStartDate: childData.child.school_start_date ? formatDate(childData.child.school_start_date) : '',
        reportDate: formatDate(new Date().toISOString()),
        ...aiContent
    };

    return reportData;
}

function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
