/**
 * DOCX Report Generator
 * Fills the development report template and generates downloadable DOCX file
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';

interface ReportData {
    childName: string;
    birthDate: string;
    teacherName: string;
    schoolStartDate: string;
    reportDate: string;
    alanBecerileri: string;
    sosyalDuygusal: string;
    kavramsal: string;
    okuryazarlik: string;
    degerler: string;
    egilimler: string;
    genelDegerlendirme: string;
}

/**
 * Generate DOCX file from template and data
 */
export async function generateReportDocx(reportData: ReportData, childName: string): Promise<void> {
    try {
        // Fetch template file
        const templatePath = '/Gelişim Raporu Şablonu.docx';
        const response = await fetch(templatePath);

        if (!response.ok) {
            throw new Error('Template file not found. Please ensure "Gelişim Raporu Şablonu.docx" is in the public folder.');
        }

        const templateBuffer = await response.arrayBuffer();

        // Load template
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Render document with data
        doc.render(reportData);

        // Generate output
        const output = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        // Download file
        const fileName = `${childName.replace(/\s+/g, '_')}_Gelisim_Raporu_${new Date().toISOString().split('T')[0]}.docx`;
        saveAs(output, fileName);

    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw new Error('Rapor oluşturulurken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
}
