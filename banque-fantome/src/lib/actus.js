import { supabase } from './supabase'

// Fil d'actu — helpers (les règles d'accès font foi côté base, voir supabase_fil_actu.sql)

export const ACTUS_BUCKET = 'actus'
const BASE = import.meta.env.BASE_URL

// Une image d'actu est soit livrée avec le site (« images/actu/... »), soit envoyée
// depuis le formulaire (chemin dans le bucket « actus »).
export function urlImageActu(chemin) {
  if (!chemin) return null
  if (chemin.startsWith('images/')) return BASE + chemin
  return supabase.storage.from(ACTUS_BUCKET).getPublicUrl(chemin).data?.publicUrl || null
}

export function estImageEnvoyee(chemin) {
  return !!chemin && !chemin.startsWith('images/')
}

// « 25 avril 2026 »
export function dateActu(d) {
  if (!d) return ''
  return new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function chargerActus(limit = 50) {
  const { data, error } = await supabase.from('actus').select('*')
    .order('date_actu', { ascending: false }).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}

// Les photos du téléphone pèsent souvent 5 à 10 Mo : on les réduit avant l'envoi
// (1800 px sur le grand côté, JPEG). Si le navigateur ne sait pas lire le fichier, on l'envoie tel quel.
export async function reduireImage(file, max = 1800, qualite = 0.85) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const echelle = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    if (echelle === 1 && file.size < 1.5 * 1024 * 1024) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * echelle)
    canvas.height = Math.round(bitmap.height * echelle)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', qualite))
    return blob || file
  } catch {
    return file
  }
}

export async function envoyerImageActu(file) {
  const reduite = await reduireImage(file)
  const ext = reduite.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg').toLowerCase()
  const nom = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(ACTUS_BUCKET).upload(nom, reduite, { cacheControl: '31536000', upsert: false, contentType: reduite.type || file.type })
  if (error) throw error
  return nom
}

export async function supprimerImagesActu(chemins) {
  const envoyees = (chemins || []).filter(estImageEnvoyee)
  if (envoyees.length) await supabase.storage.from(ACTUS_BUCKET).remove(envoyees)
}
