import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Supabase Auth JS SDK requires a valid JWT token (starting with 'eyJ').
// If anon key is not a JWT (or placeholder), we seamlessly fall back to AptiCode DB Auth on localhost:5001.
export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY.startsWith('eyJ')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
