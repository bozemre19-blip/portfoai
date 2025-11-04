
import { createClient } from '@supabase/supabase-js';

// --- GEREKLİ KURULUM ---
// Öncelik: .env dosyasından oku, yoksa hardcoded değerleri kullan

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kxvimzacukdqqldfkocu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmltemFjdWtkcXFsZGZrb2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzgyNjUsImV4cCI6MjA3NzUxNDI2NX0.c6m_N2avqmV_vqaAxPhS1ftRUbJTEmBge3AxLpXRu6U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

