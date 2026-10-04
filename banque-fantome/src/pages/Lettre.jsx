import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Le lien « Se désinscrire » en bas de chaque lettre : /lettre?desinscription=<jeton>.
// Pas besoin de compte : le jeton, propre à chaque abonné, suffit.
export default function Lettre() {
  const [params] = useSearchParams()
  const jeton = params.get('desinscription')
  const [etat, setEtat] = useState(jeton ? 'enCours' : 'sansJeton') // enCours | fait | inconnu | erreur | sansJeton

  useEffect(() => {
    if (!jeton) return
    if (!/^[0-9a-f-]{36}$/i.test(jeton)) { setEtat('inconnu'); return }
    supabase.rpc('lettre_desinscrire', { p_jeton: jeton })
      .then(({ data, error }) => setEtat(error ? 'erreur' : data ? 'fait' : 'inconnu'))
  }, [jeton])

  const TEXTES = {
    enCours:   ['Un instant', 'Désinscription en cours…'],
    fait:      ['Désinscription enregistrée', 'Vous ne recevrez plus la lettre de la Banque Fantôme. Le site, lui, reste ouvert.'],
    inconnu:   ['Lien inconnu', "Ce lien de désinscription ne correspond à aucun abonné. Il a peut-être été copié en partie."],
    erreur:    ['Erreur', "La désinscription n'a pas pu être enregistrée. Réessayez dans un moment, ou répondez simplement à la lettre."],
    sansJeton: ['La lettre de la banque', "Chaque semaine, les nouvelles de la Banque Fantôme en résumé. On s'y inscrit depuis son compte."],
  }
  const [titre, texte] = TEXTES[etat]

  return (
    <div className="acces-refuse">
      <div>
        <div className="titre">{titre}</div>
        <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>{texte}</p>
        <Link to="/" className="btn btn-noir">Visiter la banque →</Link>
      </div>
    </div>
  )
}
