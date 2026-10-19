import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { disposition, telechargerPlanche } from '../lib/billet/planche'

// « Imprimer » un billet dessiné : télécharge sa planche A4 à taille réelle (lib/billet/planche.js).
// dessin : une ligne de dessins (avec ou sans trace), ou au moins { id } (coupure facultative).
export default function BoutonPlanche({ dessin, className = 'btn btn-outline btn-sm', libelle }) {
  const [etat, setEtat] = useState(null) // null | 'cours' | 'erreur'
  if (!dessin?.id) return null
  const n = dessin.coupure ? disposition(dessin.coupure).n : null
  async function imprimer() {
    setEtat('cours')
    try { await telechargerPlanche(supabase, dessin); setEtat(null) }
    catch (e) { console.error('[planche]', e); setEtat('erreur') }
  }
  return (
    <button type="button" className={className} disabled={etat === 'cours'} onClick={imprimer}
      title={n ? `Planche A4 à imprimer : ${n} billets de ${dessin.coupure} à taille réelle` : 'Planche A4 à imprimer, billets à taille réelle'}>
      {etat === 'cours' ? 'Planche en cours…' : etat === 'erreur' ? '✗ Réessayer la planche' : libelle || (n ? `⎙ Imprimer · planche A4 de ${n}` : '⎙ Imprimer · planche A4')}
    </button>
  )
}
