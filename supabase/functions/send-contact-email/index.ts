// Supabase Edge Function: send-contact-email
// Uses Resend API to send contact form submissions to info@lukidai.com

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

async function handler(req: Request) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        const { name, email, subject, message }: ContactFormData = await req.json();

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return new Response(
                JSON.stringify({ error: 'Tüm alanlar zorunludur.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Lukid AI İletişim <contact@lukidai.com>',
                to: ['info@lukidai.com'],
                subject: `[İletişim Formu] ${subject}`,
                html: `
          <h2>Yeni İletişim Formu Mesajı</h2>
          <p><strong>Gönderen:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Konu:</strong> ${subject}</p>
          <hr />
          <h3>Mesaj:</h3>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr />
          <p style="color: gray; font-size: 12px;">Bu mesaj lukidai.com iletişim formundan gönderilmiştir.</p>
        `,
                reply_to: email,
            }),
        });

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend error:', errorText);
            throw new Error(`E-posta gönderilemedi: ${resendResponse.status}`);
        }

        const result = await resendResponse.json();
        console.log('Email sent successfully:', result);

        return new Response(
            JSON.stringify({ success: true, message: 'Mesajınız başarıyla gönderildi!' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: (error as Error).message || 'Bir hata oluştu.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

serve(handler);
