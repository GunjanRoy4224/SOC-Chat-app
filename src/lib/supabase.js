import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bbcabxtvzoclzbfpgnlx.supabase.co';
const supabaseAnonKey = 'sb_publishable_THbthWQC3ATyTyRdV9YWSg_eP0lNeRi';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
