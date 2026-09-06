// Edge Function : reset du mot de passe via code de récupération.
//
// Nécessaire car changer le mot de passe d'un compte sans y être connecté
// requiert les droits admin (clé service_role), qui ne doivent jamais
// être exposés côté frontend. Cette fonction tourne côté serveur Supabase
// et a accès à SUPABASE_SERVICE_ROLE_KEY via les variables d'environnement
// fournies automatiquement par la plateforme.
//
// Déploiement : supabase functions deploy reset-password

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode() {
  let out = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) out += '-'
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

async function hashCode(code: string) {
  const data = new TextEncoder().encode(code.trim().toUpperCase())
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    const { pseudo, code, newPassword } = await req.json()

    if (!pseudo?.trim() || !code?.trim() || !newPassword || newPassword.length < 6) {
      return json({ error: 'Paramètres invalides.' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, recovery_code_hash')
      .ilike('pseudo', pseudo.trim())
      .maybeSingle()

    if (profileErr || !profile || !profile.recovery_code_hash) {
      return json({ error: 'Pseudo ou code incorrect.' }, 401)
    }

    const submittedHash = await hashCode(code)
    if (submittedHash !== profile.recovery_code_hash) {
      return json({ error: 'Pseudo ou code incorrect.' }, 401)
    }

    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword },
    )
    if (updateErr) throw updateErr

    // Le code est à usage unique : on en génère un nouveau immédiatement.
    const newCode = generateCode()
    const newHash = await hashCode(newCode)
    await supabaseAdmin.from('profiles').update({ recovery_code_hash: newHash }).eq('id', profile.id)

    return json({ ok: true, newCode })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur.' }, 500)
  }
})
