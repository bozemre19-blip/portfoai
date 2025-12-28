/**
 * Development Report Generation Service (Edge Function Client)
 * Calls secure server-side Edge Function for AI generation
 */

import { supabase } from '../supabase';

interface ReportContent {
    alanBecerileri: string;
    sosyalDuygusal: string;
    kavramsal: string;
    okuryazarlik: string;
    degerler: string;
    egilimler: string;
    genelDegerlendirme: string;
}

interface ReportData extends ReportContent {
    childName: string;
    birthDate: string;
    teacherName: string;
    schoolStartDate: string;
    reportDate: string;
}

/**
 * Generate complete development report data using Edge Function
 */
export async function generateDevelopmentReportData(childId: string): Promise<ReportData> {
    try {
        // Call Edge Function for secure server-side generation
        const { data, error } = await (supabase as any).functions.invoke('generate_report', {
            body: { childId }
        });

        if (error) {
            console.error('Edge Function error:', error);
            throw new Error('Rapor oluşturulurken bir hata oluştu: ' + error.message);
        }

        if (!data || !data.success) {
            throw new Error(data?.error || 'Rapor içeriği oluşturulamadı');
        }

        return data.data as ReportData;
    } catch (error) {
        console.error('Report generation error:', error);
        throw error;
    }
}
