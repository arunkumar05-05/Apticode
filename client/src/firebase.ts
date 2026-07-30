import { supabase } from './supabase';

export const auth: any = supabase.auth;
export const db: any = supabase;
export default supabase;
