import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import CarteDessin from './CarteDessin'
import { COLONNES_DESSIN } from '../lib/dessins'

// Le coffre de la banque (2026-10-19, demande de Jiiji) : les billets encaissés, que la banque
// garde. Était un onglet de la page Bourse ; vit dans S'enrichir depuis le 2026-11-01, à côté
// des planches, là où l'on fabrique son argent. Ancre #coffre (l'ancien /bourse?onglet=coffre y mène).
export default function Coffre() {
  const { user } = useAuth()
  const [billets, setBillets] = useState(null)
  const { hash } = useLocation()

  // Arrivé par un lien vers le coffre : on y descend une fois les billets affichés
  // (la page remonte en haut à chaque navigation, et la liste arrive après ; les planches
  // au-dessus se chargent en même temps, d'où le petit délai)
  useEffect(() => {
    if (hash !== '#coffre' || billets === null) return
    const t = setTimeout(() => document.getElementById('coffre')?.scrollIntoView({ behavior: 'smooth' }), 600)
    return () => clearTimeout(t)
  }, [hash, billets])

  useEffect(() => {
    let annule = false
    supabase.from('dessins').select(COLONNES_DESSIN).eq('statut', 'encaisse').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { if (!annule) setBillets(data || []) })
    return () => { annule = true }
  }, [])

  const total = (billets || []).reduce((t, d) => t + d.coupure, 0)
  return (
    <section id="coffre" className="coffre" style={{ marginBottom: '3rem', scrollMarginTop: '6rem' }}>
      <div className="section-head">
        <h2>Le coffre de la banque</h2>
        {billets?.length > 0 && <span className="count">{billets.length} billet{billets.length > 1 ? 's' : ''} · {total.toLocaleString('fr-FR')} billets de valeur</span>}
      </div>
      {billets === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : billets.length === 0 ? (
          <div className="market-vide">
            <div className="titre">Le coffre est vide</div>
            <p style={{ margin: '0 auto' }}>Chaque billet encaissé vient s'y ranger.</p>
            <Link to="/creer?atelier=billet" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Dessiner un billet</Link>
          </div>
        ) : (
          <>
            <p className="texte-aide" style={{ marginBottom: '1.2rem' }}>
              Les billets encaissés ne circulent plus : la banque les garde, en échange de l'argent qu'elle a crédité à leurs auteurs.
            </p>
            <div className="dessins-liste">
              {billets.map(d => <CarteDessin key={d.id} dessin={d} moi={user?.id} />)}
            </div>
          </>
        )}
    </section>
  )
}
