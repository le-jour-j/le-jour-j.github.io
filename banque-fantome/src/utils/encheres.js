// Hôtel des ventes — helpers côté client (les règles font foi côté base, voir supabase_hotel_des_ventes.sql)

export const DUREES = [
  { jours: 1, label: '1 jour' },
  { jours: 3, label: '3 jours' },
  { jours: 7, label: '7 jours' },
]

export const INCREMENT_MIN = 5   // surenchère minimale (banque.increment_min)
export const COMMISSION_PCT = 5  // commission de la banque (banque.commission_pct)

// Un objet est une vente aux enchères s'il a une mise de départ (les anciens dépôts n'en ont pas : troc par messages)
export function estVente(objet) {
  return objet?.mise_depart != null
}

export function estEnCours(objet) {
  return estVente(objet) && objet.statut === 'disponible' && new Date(objet.expire_at) > new Date()
}

export function enchereMinimale(objet) {
  if (!estVente(objet)) return null
  return objet.enchere_courante == null ? objet.mise_depart : objet.enchere_courante + INCREMENT_MIN
}

// « 2 j 4 h », « 3 h 12 min », « 4 min », « terminé »
export function tempsRestant(expire_at, maintenant = Date.now()) {
  if (!expire_at) return ''
  const ms = new Date(expire_at) - maintenant
  if (ms <= 0) return 'terminé'
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  const j = Math.floor(h / 24)
  if (j >= 1) return `${j} j ${h % 24} h`
  if (h >= 1) return `${h} h ${String(min % 60).padStart(2, '0')} min`
  return `${Math.max(1, min)} min`
}

export function urgent(expire_at) {
  const ms = new Date(expire_at) - Date.now()
  return ms > 0 && ms < 60 * 60 * 1000 // moins d'une heure
}

export function commission(prix) {
  return Math.floor((prix * COMMISSION_PCT) / 100)
}

// Message d'erreur Supabase/Postgres → texte lisible
export function messageErreur(e) {
  const m = e?.message || String(e || 'Erreur')
  return m.replace(/^.*?:\s*/, '') // enlève un éventuel préfixe technique
}
