import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/supabaseConfig.js";

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const configuredUrl = SUPABASE_URL && !SUPABASE_URL.startsWith("REMPLACE_PAR")
  ? SUPABASE_URL
  : envUrl;

const configuredAnonKey = SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.startsWith("REMPLACE_PAR")
  ? SUPABASE_ANON_KEY
  : envAnonKey;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(configuredUrl, configuredAnonKey)
  : null;
