import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────
// REMPLIS CES DEUX VALEURS avec ton projet Supabase
// Dashboard → Settings → API → Project URL & anon key
// ─────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TON_PROJET.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TA_CLE_ANON'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Nom du bucket de stockage images (à créer dans Supabase Storage)
export const STORAGE_BUCKET = 'objets'
