/**
 * DOCX Report Generator
 * Fills the development report template and generates downloadable DOCX file
 * Supports both web (file-saver) and native mobile (Capacitor Filesystem + Share)
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Generate DOCX file from template and data
 */
export async function generateReportDocx(reportData: ReportData, childName: string): Promise<void> {
    try {
        // Fetch template file
        const templatePath = '/gelisim_raporu_sablonu.docx';
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

        // Generate output as blob
        const output: Blob = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const fileName = `${childName.replace(/\s+/g, '_')}_Gelisim_Raporu_${new Date().toISOString().split('T')[0]}.docx`;

        // Check if running on native mobile (iOS/Android)
        if (Capacitor.isNativePlatform()) {
            // Mobile: Use Capacitor Filesystem + Share
            const base64Data = await blobToBase64(output);

            // Write file to cache directory
            const writeResult = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Cache,
            });

            // Get the full file URI for sharing
            const fileUri = writeResult.uri;

            // Open share dialog
            await Share.share({
                title: 'Gelişim Raporu',
                text: `${childName} - Gelişim Raporu`,
                url: fileUri,
                dialogTitle: 'Raporu Paylaş veya Kaydet',
            });
        } else {
            // Web: Use file-saver
            saveAs(output, fileName);
        }

    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw new Error('Rapor oluşturulurken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
}
