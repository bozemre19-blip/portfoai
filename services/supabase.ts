
import { createClient } from '@supabase/supabase-js';

// --- GEREKLİ KURULUM ---
// Lütfen aşağıdaki değerleri kendi Supabase projenizin bilgileriyle değiştirin.
// Bu bilgileri Supabase projenizin "Project Settings > API" bölümünde bulabilirsiniz.
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://kxvimzacukdqqldfkocu.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dmltemFjdWtkcXFsZGZrb2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzgyNjUsImV4cCI6MjA3NzUxNDI2NX0.c6m_N2avqmV_vqaAxPhS1ftRUbJTEmBge3AxLpXRu6U';

// Fix: Removed the check for a placeholder API key. The original code produced a
// TypeScript error because `supabaseAnonKey` is a constant with a real value,
// so it could never be equal to the placeholder string. Since the key is now
// correctly configured, this check is no longer necessary.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

