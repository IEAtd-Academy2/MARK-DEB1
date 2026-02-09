
import { createClient } from '@supabase/supabase-js';

// دالة لجلب متغيرات البيئة تدعم Vite و Node (Vercel)
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ إعدادات Supabase مفقودة. يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات المشروع.');
}

export const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder');
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
