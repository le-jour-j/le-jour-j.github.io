import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'

const visuels = [
  '/images/visuels/visuels-001.png',
  '/images/visuels/visuels-002.png',
  '/images/visuels/visuels-003.png',
  '/images/visuels/visuels-004.png',
  '/images/visuels/visuels-005.png',
  '/images/visuels/visuels-006.png',
]

export default function Home() {
  const [recent, setRecent] = useState([])
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [openInfo, setOpenInfo] = useState(false)

  useEffect(() => {
    supabase.from('objets').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(3)
      .then(({ data, count }) => { setRecent(data || []); setTotal(count || 0) })
  }, [])

  return (
    <div>
      <section className="hero hero-light">
        <div className="container">
          <div className="hero-eyebrow">Institution de circulation, de troc et de faux argent</div>
          <h1 className="hero-title">BANQUE<br/><span>FANTÔME</span></h1>
          <p className="hero-sub">
            La Banque Fantôme propose d'ouvrir un compte, de fabriquer sa propre monnaie et d'obtenir des objets, des œuvres ou des services présents dans le market. Ici, la valeur ne préexiste pas : elle se dessine, se met en jeu et circule.
          </p>
          <div className="hero-actions">
            <Link to="/connexion"><button className="btn btn-jaune">→ Ouvrir un compte</button></Link>
            <Link to="/senrichir"><button className="btn btn-outline">Fabriquer son argent</button></Link>
            <Link to="/market"><button className="btn btn-outline">Entrer dans le market</button></Link>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {[
              ['Objets en circulation', total || '—'],
              ['Monnaie', 'billets à imprimer'],
              ['Échanges', 'objets · œuvres · services'],
              ['Statut', <span className="blink">● OUVERT</span>],
            ].map(([label, val]) => (
              <div className="stat-item" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section style={{ padding: '4rem 0 2rem' }}>
        <div className="container">
          <div className="section-head">
            <h2>Le principe</h2>
            <button className={`btn ${openInfo ? 'btn-noir' : 'btn-outline'}`} style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setOpenInfo(v => !v)}>
              {openInfo ? 'Refermer' : 'Comprendre la banque'}
            </button>
          </div>

          {openInfo && (
            <div className="info-drawer">
              <div>
                <div className="info-drawer-title">Ici, vous créez votre monnaie et vous achetez avec.</div>
                <p>
                  La Banque Fantôme fonctionne comme un jeu d'enrichissement fictif. Les joueurs fabriquent leurs propres billets, les activent comme monnaie puis les utilisent pour obtenir un objet, une œuvre ou un service déposé sur le site. La banque s'enrichit à mesure que les choses circulent, changent de main et gagnent une histoire.
                </p>
              </div>
            </div>
          )}

          <div className="grid-3" style={{ alignItems: 'start' }}>
            <div className="card">
              <h3 style={{ marginBottom: '.8rem' }}>1. Ouvrir un compte</h3>
              <p style={{ color: 'var(--gris-fonce)', lineHeight: 1.7 }}>
                Chacun peut entrer dans la banque avec un pseudo et devenir opérateur temporaire du dispositif.
              </p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '.8rem' }}>2. Fabriquer son argent</h3>
              <p style={{ color: 'var(--gris-fonce)', lineHeight: 1.7 }}>
                Des billets à imprimer et colorier servent de monnaie pour acheter dans le market.
              </p>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '.8rem' }}>3. Acheter dans le market</h3>
              <p style={{ color: 'var(--gris-fonce)', lineHeight: 1.7 }}>
                Les dépôts prennent la forme d'objets, d'œuvres ou de services. Chaque échange enrichit la banque en récits et en circulation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 3rem' }}>
        <div className="container">
          <div className="section-head">
            <h2>Visuels de la banque</h2>
            <span className="count">Couverture, documents, supports</span>
          </div>
          <div className="visual-grid">
            {visuels.map((src, index) => (
              <div key={src} className={`visual-card ${index === 0 ? 'visual-card-large' : ''}`}>
                <img src={src} alt={`Visuel Banque Fantôme ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-band">
        <div className="container">
          <div className="section-head section-head-light">
            <h2>Comment jouer</h2>
          </div>
          <div className="grid-3">
            {[
              ['01', 'Télécharger un billet', "Choisissez un modèle, imprimez-le et transformez-le en monnaie active de la Banque Fantôme."],
              ['02', 'Repérer une offre', "Parcourez le market, filtrez par catégorie et trouvez un objet, une œuvre ou un service à obtenir."],
              ['03', 'Faire circuler', "L'échange fait grossir la banque : les choses passent, se racontent et prennent une nouvelle valeur."],
            ].map(([n, titre, desc]) => (
              <div key={n} style={{ borderTop: '3px solid var(--jaune)', paddingTop: '1.2rem' }}>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '3.5rem', color: 'rgba(245,226,122,.42)', lineHeight: 1, marginBottom: '.5rem' }}>{n}</div>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '1.4rem', color: 'var(--blanc)', marginBottom: '.6rem', letterSpacing: '.04em' }}>{titre}</div>
                <p style={{ fontSize: '.9rem', color: 'rgba(255,255,255,.82)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-head">
            <h2>Entrées récentes dans le circuit</h2>
            <Link to="/market" className="count">Voir le market →</Link>
          </div>
          {recent.length === 0
            ? <div className="loader">Chargement<span className="blink">_</span></div>
            : <div className="grid-3">{recent.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
          }
        </div>
      </section>

      <section style={{ background: 'var(--jaune)', padding: '3rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.2em', marginBottom: '.5rem' }}>FAUX ARGENT</div>
            <p style={{ fontSize: '1rem', fontWeight: 500, maxWidth: 650, lineHeight: 1.7 }}>
              Imprimez les billets, fabriquez votre propre réserve, puis utilisez-la pour obtenir un élément du market. La banque s'enrichit quand les joueurs produisent leur monnaie et la remettent en circulation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/senrichir"><button className="btn btn-noir">Voir les billets</button></Link>
            <Link to="/deposer"><button className="btn btn-outline">Déposer dans le market</button></Link>
          </div>
        </div>
      </section>

      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
