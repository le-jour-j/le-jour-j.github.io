// Le dernier contenu connu (2026-11-18).
//
// La base gratuite répond le plus souvent en 0,2 à 0,7 s, mais elle cale par moments 2 à 6 s, même
// sans visiteur (mesuré le 18/11 : environ 6 ouvertures du site sur 10 tombaient sur un de ces
// moments). Pendant ce temps l'accueil restait vide. Les contenus publics de l'accueil (journal,
// cours, billets, objets récents, chiffres, fil, présences) s'affichent donc tout de suite avec ce
// qu'on connaît déjà, et se remplacent quand la base répond.
//
// Deux sources, la plus récente gagne :
//   - ce que ce navigateur a reçu à sa dernière visite (localStorage) ;
//   - l'instantané posé dans la page à chaque construction du site (window.__BF_DEPART__, écrit par
//     scripts/prerender.mjs), pour qui vient pour la première fois.
// Au-delà de trois jours, on n'affiche rien plutôt que du trop vieux.
//
// N'y mettre que du contenu public, le même pour tout le monde : jamais un solde, un message,
// un brouillon.

const PREFIXE = 'bf_memoire_'
const PEREMPTION_MS = 3 * 24 * 3600 * 1000
const depart = (typeof window !== 'undefined' && window.__BF_DEPART__) || null

export function relire(cle) {
  let trouve = null
  try {
    const garde = JSON.parse(localStorage.getItem(PREFIXE + cle) || 'null')
    if (garde && garde.v != null && typeof garde.t === 'number') trouve = garde
  } catch { /* stockage fermé ou abîmé : on fait sans */ }
  if (depart && depart.v && depart.v[cle] != null && (!trouve || depart.t > trouve.t)) {
    trouve = { t: depart.t, v: depart.v[cle] }
  }
  if (!trouve || Date.now() - trouve.t > PEREMPTION_MS) return null
  return trouve.v
}

export function retenir(cle, valeur) {
  if (valeur == null) return
  try {
    localStorage.setItem(PREFIXE + cle, JSON.stringify({ t: Date.now(), v: valeur }))
  } catch { /* stockage plein ou fermé : tant pis, on rechargera */ }
}
