// utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

// GANTI BAGIAN INI DENGAN URL ASLI DARI PROJECT OVERVIEW
const supabaseUrl = 'https://xscymrxiyehmswbonmny.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_VeTirGS0R_2EoHUMfTVbyQ_gf27OvMT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);