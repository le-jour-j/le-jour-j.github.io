import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Journal public de la banque (journal_banque) : ce qui vient de se passer.
// Rechargé toutes les 60 s, au retour sur l'onglet, et dès qu'un billet / une enchère / un objet bouge.
export function useJournal(limit = 20) {
  const [entrees, setEntrees] = useState([])
  useEffect(() => {
    let vivant = true
    const charger = () => supabase.rpc('journal_banque', { p_limit: limit }).then(({ data }) => { if (vivant) setEntrees(data || []) })
    charger()
    const t = setInterval(charger, 60000)
    const onFocus = () => document.visibilityState === 'visible' && charger()
    document.addEventListener('visibilitychange', onFocus)
    const channel = supabase.channel(`journal-${limit}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'billets_emis' }, charger)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'encheres' }, charger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objets' }, charger)
      .subscribe()
    return () => { vivant = false; clearInterval(t); document.removeEventListener('visibilitychange', onFocus); supabase.removeChannel(channel) }
  }, [limit])
  return entrees
}

export function phrase(e) {
  const qui = e.pseudo || 'quelqu’un'
  switch (e.type) {
    case 'emission': return `${qui} émet ${e.montant} ${e.devise || 'billets'}${e.billet_titre ? ` — « ${e.billet_titre} »` : ''}`
    case 'enchere':  return `${qui} mise ${e.montant} sur « ${e.objet_titre} »`
    case 'achat':    return `${qui} achète « ${e.objet_titre} » pour ${e.montant}`
    case 'adjuge':   return `« ${e.objet_titre} » adjugé à ${qui} pour ${e.montant}`
    case 'depot':    return `${qui} met « ${e.objet_titre} » en vente à partir de ${e.montant}`
    default:         return `${qui} — ${e.type}`
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
