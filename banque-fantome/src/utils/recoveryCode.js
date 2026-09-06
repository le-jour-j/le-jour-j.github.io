// Code de récupération affiché une seule fois à la création du compte
// (et régénéré après chaque utilisation) — seul moyen de reset un mot de
// passe oublié, puisque les comptes utilisent des faux emails.

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I ambigus

export function generateRecoveryCode() {
  let out = ''
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) out += '-'
    out += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return out
}

export async function hashRecoveryCode(code) {
  const data = new TextEncoder().encode(code.trim().toUpperCase())
  const buf  = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
