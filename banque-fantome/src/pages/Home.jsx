import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'

export default function Home() {
  const [recent, setRecent]     = useState([])
  const [total, setTotal]       = useState(0)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase.from('objets').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(6)
      .then(({ data, count }) => { setRecent(data || []); setTotal(count || 0) })
  }, [])

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Institution artistique mobile de troc · PETR Cœur des Hauts-de-France</div>
          <h1 className="hero-title">BANQUE<br/><span>FANTÔME</span></h1>
          <p className="hero-sub">Un dessin sur un chèque vaut plus qu'une feuille blanche. Déposez un objet. Recevez un chèque. Échangez. Recommencez.</p>
          <div className="hero-actions">
            <Link to="/deposer"><button className="btn btn-jaune">→ Déposer un objet</button></Link>
            <Link to="/inventaire"><button className="btn btn-outline-blanc">Voir l'inventaire</button></Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {[
              ['Objets en circulation', total || '—'],
              ['Capital initial', '300 chèques'],
              ['Agences', '8 temporaires'],
              ['Statut', <span className="blink">● ACTIF</span>],
            ].map(([label, val]) => (
              <div className="stat-item" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stripe" />

      {/* DERNIERS OBJETS */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-head">
            <h2>Derniers dépôts</h2>
            <Link to="/inventaire" className="count">Tout voir →</Link>
          </div>
          {recent.length === 0
            ? <div className="loader">Chargement<span className="blink">_</span></div>
            : <div className="grid-3">{recent.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
          }
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section style={{ background: 'var(--noir)', padding: '4rem 0' }}>
        <div className="container">
          <h2 style={{ color: 'var(--blanc)', marginBottom: '2.5rem' }}>Comment ça <span style={{ color: 'var(--jaune)' }}>marche</span></h2>
          <div className="grid-3">
            {[
              ['01', 'Créez un compte', 'Choisissez un pseudo. Pas de mail requis. Vous devenez opérateur temporaire de la Banque.'],
              ['02', 'Déposez un objet', 'Photographiez-le. Racontez son histoire. Il entre dans le circuit.'],
              ['03', 'Échangez', 'Chaque objet peut être échangé contre un chèque dessiné ou un autre objet du stock.'],
            ].map(([n, titre, desc]) => (
              <div key={n} style={{ borderTop: '3px solid var(--jaune)', paddingTop: '1.2rem' }}>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '3.5rem', color: 'rgba(255,214,0,.25)', lineHeight: 1, marginBottom: '.5rem' }}>{n}</div>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '1.4rem', color: 'var(--blanc)', marginBottom: '.6rem', letterSpacing: '.04em' }}>{titre}</div>
                <p style={{ fontSize: '.9rem', color: '#aaa', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RÈGLEMENT */}
      <section style={{ background: 'var(--jaune)', padding: '3rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.2em', marginBottom: '.5rem' }}>RÈGLEMENT OFFICIEL</div>
            <p style={{ fontSize: '1rem', fontWeight: 500, maxWidth: 500, lineHeight: 1.7 }}>
              1 objet tunné = 1 chèque dessiné.<br />
              Tout objet du quotidien est un actif potentiel.<br />
              La Banque ne stocke pas. La Banque fait circuler.
            </p>
          </div>
          <Link to="/connexion"><button className="btn btn-noir">Ouvrir un compte →</button></Link>
        </div>
      </section>

      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
