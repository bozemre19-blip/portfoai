
import { createClient } from '@supabase/supabase-js';

// --- GÜVENLİ KURULUM ---
// Supabase bilgileri .env dosyasından okunur

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// .env dosyası yoksa veya eksikse hata ver
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Supabase yapılandırması eksik!\n\n' +
    'Lütfen .env dosyasını oluşturun ve şu değerleri ekleyin:\n' +
    'VITE_SUPABASE_URL=your-project-url\n' +
    'VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'Detaylar için README.md dosyasına bakın.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

