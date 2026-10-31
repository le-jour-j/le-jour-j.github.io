import { supabase } from './supabase'

// Les agences de la banque (2026-10-13). Horaires des lieux relevés le 13/10/2026 sur leurs
// sites officiels : à revérifier s'ils changent. La présence du banquier, elle, vient de son
// agenda (table `presences`, remplie par la fonction Edge du même nom).
export const AGENCES = {
  quadrilatere: {
    nom: 'Le Quadrilatère',
    court: 'au Quadrilatère',
    statut: 'Agence actuelle',
    adresse: '22 rue Saint-Pierre, 60000 Beauvais',
    horaires: [['Lundi', 'fermé'], ['Mardi au vendredi', '12 h à 18 h'], ['Samedi et dimanche', '10 h à 18 h']],
    source: 'https://www.lequadrilatere.fr/infos-pratiques',
    note: 'Centre d\'art de Beauvais. Fermé les 1er janvier, 1er mai, 25 décembre et pendant les montages d\'exposition.',
  },
  mediatheque: {
    nom: 'Médiathèque Centre ville',
    court: 'à la médiathèque',
    statut: 'Agence à venir',
    ouverture: '2026-11-03T13:00:00+01:00', // phase 2 (2026-10-31) : devient « Agence actuelle » toute seule
    adresse: '3 cour des Lettres, 60000 Beauvais',
    horaires: [['Lundi', 'fermé'], ['Mardi', '13 h à 18 h 30'], ['Mercredi', '9 h 30 à 18 h 30'], ['Jeudi et vendredi', '13 h à 18 h 30'], ['Samedi', '9 h 30 à 18 h']],
    source: 'https://mediatheques.beauvaisis.fr/',
    note: 'Réseau des médiathèques du Beauvaisis.',
  },
}

// Phase 2 de la banque (2026-10-31) : les agences ouvrent au public le mardi 3 novembre 2026,
// jusqu'à la restitution du 18 février 2027.
export const PHASE_2 = 'La banque tient ses agences du mardi 3 novembre 2026 (12 h au Quadrilatère, 13 h à la médiathèque) jusqu\'à la restitution du 18 février 2027.'

// « Agence à venir » jusqu'à son ouverture, « Agence actuelle » ensuite
export function statut(a) {
  return a.ouverture && Date.now() < Date.parse(a.ouverture) ? a.statut : 'Agence actuelle'
}

const FUSEAU = 'Europe/Paris'

export async function chargerPresences() {
  const { data, error } = await supabase.from('presences').select('agence, debut, fin')
    .gte('fin', new Date().toISOString()).order('debut').limit(40)
  if (error) throw error
  return data || []
}

// « 9 h 30 », « 18 h »
export function heure(iso) {
  const [h, m] = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso)).split(':')
  return `${+h} h${m === '00' ? '' : ` ${m}`}`
}

// « aujourd'hui », « demain », « jeudi 15 octobre »
export function jour(iso) {
  const cle = d => new Intl.DateTimeFormat('fr-CA', { timeZone: FUSEAU }).format(d)
  const j = cle(new Date(iso))
  if (j === cle(new Date())) return 'aujourd\'hui'
  if (j === cle(new Date(Date.now() + 86400000))) return 'demain'
  return new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso))
}

// Journée entière dans l'agenda : de minuit à minuit
export function journeeEntiere(p) {
  return heure(p.debut) === '0 h' && heure(p.fin) === '0 h'
}

export function creneau(p) {
  return journeeEntiere(p) ? 'toute la journée' : `de ${heure(p.debut)} à ${heure(p.fin)}`
}
