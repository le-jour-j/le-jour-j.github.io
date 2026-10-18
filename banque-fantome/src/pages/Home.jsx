import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import FilActu from '../components/FilActu'
import Journal from '../components/Journal'
import { MurBillets } from '../components/GuichetEmission'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'
import BoutonLettre from '../components/BoutonLettre'
import PresenceBanquier from '../components/PresenceBanquier'

// Compteur animé (le chiffre "monte" jusqu'à sa valeur)
function Compteur({ valeur }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!valeur) { setN(0); return }
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduit) { setN(valeur); return }
    let raf, t0
    const duree = 900
    function tick(t) {
      if (!t0) t0 = t
      const p = Math.min(1, (t - t0) / duree)
      setN(Math.round(valeur * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [valeur])
  return <>{valeur == null ? '—' : n}</>
}

const PRINCIPE = [
  { n: '1', titre: 'Ouvrir un compte', texte: 'Chacun peut entrer dans la banque avec un pseudo et devenir opérateur temporaire du dispositif.', to: '/connexion', cta: 'Créer un compte' },
  { n: '2', titre: 'Dessiner son argent', texte: 'Dans l’atelier de la bourse, dessinez sur un billet de la banque. Encaissez-le : votre compte est crédité de sa valeur. Ou vendez-le aux enchères aux autres comptes.', to: '/bourse?onglet=atelier', cta: 'Ouvrir l’atelier' },
  { n: '3', titre: 'Dépenser', texte: 'Achetez les billets dessinés par les autres dans la bourse, ou enchérissez sur les objets que la banque met en vente au market, à retirer en main propre.', to: '/market', cta: 'Entrer dans le market' },
]

export default function Home() {
  const [recent, setRecent] = useState(null)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState(null) // stats_banque() : trésor, billets en circulation…
  const [selected, setSelected] = useState(null)
  const [openInfo, setOpenInfo] = useState(false)
  const heroRef = useRef(null)
  const [notif, setNotif] = useState(null)

  // Ouvre une fiche depuis le journal
  async function ouvrirObjet(id) {
    const { data } = await supabase.from('objets').select('*').eq('id', id).single()
    if (data) setSelected(data)
  }

  useEffect(() => {
    supabase.from('objets').select('*', { count: 'exact' }).neq('statut', 'retiré')
      .order('created_at', { ascending: false }).limit(3)
      .then(({ data, count }) => { setRecent(data || []); setTotal(count || 0) })
    supabase.rpc('stats_banque').then(({ data }) => setStats(data || null))
  }, [])

  // Le grand "BF" en fond du hero suit légèrement la souris
  function onHeroMove(e) {
    const el = heroRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - .5
    const y = (e.clientY - r.top) / r.height - .5
    el.style.setProperty('--px', `${x * -24}px`)
    el.style.setProperty('--py', `${y * -16}px`)
  }

  return (
    <div>
      <section className="hero hero-light" ref={heroRef} onMouseMove={onHeroMove}>
        <div className="container">
          <div className="hero-eyebrow">On va faire du pognon</div>
          <h1 className="hero-title">BANQUE<br className="hero-br" /> <span>FANTÔME</span></h1>
          <p className="hero-sub">
            La Banque Fantôme propose d'ouvrir un compte, de dessiner sa propre monnaie, de l'échanger dans la bourse aux billets et d'obtenir les objets que la banque met en vente au market. Ici, la valeur ne préexiste pas : elle se dessine, se met en jeu et circule.
          </p>
          <div className="hero-actions">
            <Link to="/connexion" className="btn btn-jaune">→ Ouvrir un compte</Link>
            <Link to="/bourse?onglet=atelier" className="btn btn-outline">Dessiner son argent</Link>
            <Link to="/market" className="btn btn-outline">Entrer dans le market</Link>
            <BoutonLettre />
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            <div className="stat-item">
              <div className="stat-label">Objets en circulation</div>
              <div className="stat-value"><Compteur valeur={total} /></div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Billets déposés</div>
              <div className="stat-value"><Compteur valeur={stats?.billets_emis} /></div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Montant déposé</div>
              <div className="stat-value"><Compteur valeur={stats?.montant_emis} /> €</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Trésor de la banque</div>
              <div className="stat-value"><Compteur valeur={stats?.tresor} /></div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Ventes en cours</div>
              <div className="stat-value"><Compteur valeur={stats?.ventes_en_cours} /></div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Statut</div>
              <div className="stat-value"><span className="blink">●</span> OUVERT</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <PresenceBanquier compact />
      </div>

      <section className="vivant">
        <div className="container">
          <div className="vivant-grid">
            <div>
              <div className="section-head">
                <h2>Ça vient de se passer</h2>
                <span className="count"><span className="blink">●</span> en direct</span>
              </div>
              <Journal limit={10} onOuvrirObjet={ouvrirObjet} />
            </div>
            <div>
              <div className="section-head">
                <h2>Cours des devises</h2>
                <Link to="/bourse?onglet=atelier" className="count">Dessiner →</Link>
              </div>
              <CoursDevises compact />
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 0 0' }}>
        <div className="container">
          <MurBillets limit={8} titre="Les billets du moment" sousTitre="Chaque billet est une œuvre : cliquer pour le cartel" onNotif={setNotif} />
        </div>
      </section>

      <section style={{ padding: '1rem 0 2rem' }}>
        <div className="container">
          <div className="section-head">
            <h2>Le principe</h2>
            <button type="button" className={`btn btn-sm ${openInfo ? 'btn-noir' : 'btn-outline'}`} aria-expanded={openInfo} onClick={() => setOpenInfo(v => !v)}>
              {openInfo ? '✕ Refermer' : 'Comprendre la banque'}
            </button>
          </div>

          {openInfo && (
            <div className="info-drawer">
              <div className="info-drawer-title">Ici, vous créez votre monnaie et vous achetez avec.</div>
              <p>
                La Banque Fantôme fonctionne comme un jeu d'enrichissement fictif. Les joueurs dessinent leurs propres billets sur le site : encaissés, ils deviennent de l'argent ; mis en vente, ils s'échangent dans la bourse contre l'argent des autres. Avec cet argent, on enchérit aussi sur les objets que la banque met en vente au market, et qu'on vient chercher en main propre. Sur chaque vente de la bourse, la banque prélève {stats?.commission_pct ?? 5} % : elle s'enrichit à mesure que les choses circulent, changent de main et gagnent une histoire.
              </p>
            </div>
          )}

          <div className="grid-3" style={{ alignItems: 'stretch' }}>
            {PRINCIPE.map(p => (
              <Link key={p.n} to={p.to} className="card card-link">
                <div className="card-num-big">{p.n}</div>
                <h3 style={{ marginBottom: '.8rem' }}>{p.titre}</h3>
                <p>{p.texte}</p>
                <span className="card-arrow">{p.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 3rem' }}>
        <div className="container">
          <div className="section-head">
            <h2>Le fil de la banque</h2>
            <Link to="/actu" className="count">Tout le fil →</Link>
          </div>
          <FilActu limit={3} onNotif={setNotif} />
        </div>
      </section>

      <section className="home-band">
        <div className="container">
          <div className="section-head section-head-light">
            <h2>Comment jouer</h2>
          </div>
          <div className="grid-3">
            {[
              ['01', 'Dessiner un billet', "Ouvrez l'atelier, choisissez une coupure et dessinez sur le billet. Encaissez-le pour créditer votre compte, ou gardez-le pour le vendre."],
              ['02', 'Enchérir', "Misez vos billets sur ceux des autres dans la bourse, ou sur les objets de la banque au market. Surenchéri ? Vos billets vous reviennent."],
              ['03', 'Faire circuler', "À la clôture, le plus offrant l'emporte. Un billet acheté se garde ou se revend ; un objet de la banque se retire en main propre."],
            ].map(([n, titre, desc]) => (
              <div key={n} className="etape">
                <div className="etape-num">{n}</div>
                <div className="etape-titre">{titre}</div>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div className="section-head">
            <h2>Entrées récentes dans le circuit</h2>
            <Link to="/bourse" className="count">Voir la bourse →</Link>
          </div>
          {recent === null
            ? <div className="loader">Chargement<span className="blink">_</span></div>
            : recent.length === 0
            ? <p className="texte-aide">Rien encore : <Link to="/bourse?onglet=atelier" className="lien-texte">dessinez le premier billet →</Link></p>
            : <div className="grid-3">{recent.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
          }
        </div>
      </section>

      <section className="bande-jaune">
        <div className="container">
          <div>
            <div className="eyebrow">FAUX ARGENT</div>
            <p>
              Dessinez vos billets, fabriquez votre propre réserve, puis utilisez-la pour obtenir un billet d'un autre joueur ou un objet du market. La banque s'enrichit quand les joueurs produisent leur monnaie et la remettent en circulation.
            </p>
          </div>
          <div className="bande-actions">
            <Link to="/bourse?onglet=atelier" className="btn btn-noir">Dessiner un billet</Link>
            <Link to="/bourse" className="btn btn-outline">La bourse aux billets</Link>
          </div>
        </div>
      </section>

      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
