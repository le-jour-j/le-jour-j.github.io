import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Journal public de la banque (journal_banque) : ce qui vient de se passer.
// Un seul chargement et un seul abonnement Realtime partagés par tous les composants
// (bandeau de la barre de navigation + section de l'accueil), au lieu d'un par composant.
// Plus de minuteur de 60 s (alerte Supabase « Disk IO Budget », 2026-10-22, appliqué le 2026-10-31) :
// rechargé au retour sur l'onglet et dès qu'un billet / une enchère / un objet bouge.
const MAX = 20 // on en charge 20 une fois, chaque composant en prend ce qu'il veut
let donnees = []
let abonnes = 0
let channel = null
let attente = null
const ecouteurs = new Set()

function charger() {
  supabase.rpc('journal_banque', { p_limit: MAX }).then(({ data }) => {
    donnees = data || []
    ecouteurs.forEach(f => f(donnees))
  })
}

// Regroupe les rafales d'événements Realtime en un seul rechargement (1,5 s)
function chargerBientot() {
  clearTimeout(attente)
  attente = setTimeout(charger, 1500)
}

function surFocus() {
  if (document.visibilityState === 'visible') charger()
}

function demarrer() {
  charger()
  document.addEventListener('visibilitychange', surFocus)
  channel = supabase.channel('journal')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'billets_emis' }, chargerBientot)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encheres' }, chargerBientot)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'objets' }, chargerBientot)
    .subscribe()
}

function arreter() {
  clearTimeout(attente)
  document.removeEventListener('visibilitychange', surFocus)
  if (channel) { supabase.removeChannel(channel); channel = null }
}

export function useJournal(limit = 20) {
  const [entrees, setEntrees] = useState(donnees)
  useEffect(() => {
    ecouteurs.add(setEntrees)
    if (abonnes++ === 0) demarrer()
    else setEntrees(donnees)
    return () => {
      ecouteurs.delete(setEntrees)
      if (--abonnes === 0) arreter()
    }
  }, [])
  return entrees.slice(0, limit)
}

export function phrase(e) {
  const qui = e.pseudo || 'quelqu’un'
  switch (e.type) {
    case 'emission': return `${qui} encaisse ${e.montant} ${e.devise || 'billets'}${e.billet_titre ? `, « ${e.billet_titre} »` : ''}`
    case 'enchere':  return `${qui} mise ${e.montant} sur « ${e.objet_titre} »`
    case 'achat':    return `${qui} achète « ${e.objet_titre} » pour ${e.montant}`
    case 'adjuge':   return `« ${e.objet_titre} » adjugé à ${qui} pour ${e.montant}`
    case 'depot':    return `${qui} met « ${e.objet_titre} » en vente à partir de ${e.montant}`
    default:         return `${qui} : ${e.type}`
  }
}

export function ilYA(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'à l’instant'
  const m = Math.floor(s / 60); if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24); if (j < 30) return `il y a ${j} j`
  return new Date(iso).toLocaleDateString('fr-FR')
}

const ICONES = { emission: '◈', enchere: '⚑', achat: '⚡', adjuge: '✓', depot: '＋' }

// Section « Journal de la banque » (accueil)
export default function Journal({ limit = 10, onOuvrirObjet }) {
  const entrees = useJournal(limit)
  if (!entrees.length) return null
  return (
    <ol className="journal">
      {entrees.map((e, i) => (
        <li key={`${e.type}-${e.quand}-${i}`} className={`journal-ligne ${e.type}`}>
          <span className="journal-icone" aria-hidden="true">{ICONES[e.type] || '·'}</span>
          <span className="journal-texte">
            {e.objet_id && onOuvrirObjet
              ? <button type="button" className="lien-texte" onClick={() => onOuvrirObjet(e.objet_id)}>{phrase(e)}</button>
              : phrase(e)}
          </span>
          <span className="journal-quand caption-gris">{ilYA(e.quand)}</span>
        </li>
      ))}
    </ol>
  )
}
