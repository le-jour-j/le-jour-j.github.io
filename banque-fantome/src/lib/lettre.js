import { supabase } from './supabase'

// La lettre de la banque (newsletter) : les règles d'accès font foi côté base,
// voir supabase_lettre.sql. L'envoi passe par la fonction serveur « lettre ».

export const emailValide = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((e || '').trim())

// L'abonnement du compte connecté (null s'il ne s'est jamais inscrit)
export async function monAbonnement(userId) {
  const { data, error } = await supabase.from('lettre_abonnes').select('id, email, actif').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

// Inscrit ou met à jour l'abonnement du compte connecté
export async function enregistrerAbonnement(userId, email, actif = true) {
  const ligne = { email: email.trim(), actif, desinscrit_at: actif ? null : new Date().toISOString() }
  const existant = await monAbonnement(userId)
  const { error } = existant
    ? await supabase.from('lettre_abonnes').update(ligne).eq('id', existant.id)
    : await supabase.from('lettre_abonnes').insert({ ...ligne, user_id: userId, source: 'membre' })
  if (error) throw new Error(messageLettre(error))
}

export function messageLettre(error) {
  const m = error?.message || ''
  if (error?.code === '23505' || m.includes('lettre_abonnes_email_idx')) return 'Cette adresse est déjà inscrite à la lettre.'
  if (m.includes('lettre_abonnes_email_check')) return 'Adresse e-mail invalide.'
  return m || 'Erreur'
}

// Appel à la fonction serveur (réservé au banquier, sauf la désinscription)
export async function fonctionLettre(action, extra = {}) {
  const { data, error } = await supabase.functions.invoke('lettre', { body: { action, ...extra } })
  if (error) {
    let msg = error.message
    try { const body = await error.context.json(); if (body?.error) msg = body.error } catch { /* réponse sans JSON */ }
    throw new Error(msg)
  }
  return data
}
