import { useMemo, useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import { Link } from 'react-router-dom'
import { MurBillets } from '../components/GuichetEmission'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'

import planches from '../data/planches.json'

const BASE = import.meta.env.BASE_URL
const VALEURS = [...new Set(planches.map(p => p.valeur))].sort((a, b) => a - b)
const urlPlanche = f => `${BASE}planches/${f}`
const urlApercu = f => `${BASE}planches/apercus/${f}`

export default function Senrichir() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [valeur, setValeur] = useState('toutes')
  const [notif, setNotif] = useState(null)

  const visibles = useMemo(() => valeur === 'toutes' ? planches : planches.filter(p => p.valeur === valeur), [valeur])
  const apercus = useMemo(() => visibles.map(p => urlApercu(p.apercu)), [visibles])

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Planches à imprimer</span>
        </div>

        <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
          Ici, vous fabriquez votre monnaie : téléchargez une planche, imprimez-la, découpez vos billets et jouez avec, en vrai papier.
          {' '}{planches.length} planches A4, de 5 à 500 €. Cliquez sur une planche pour la voir en grand.
        </p>
        <section style={{ marginBottom: '2rem' }}>
          <div className="filter-row" style={{ marginBottom: '1.4rem' }}>
            <button type="button" className={`chip ${valeur === 'toutes' ? 'active' : ''}`} onClick={() => setValeur('toutes')}>toutes</button>
            {VALEURS.map(v => (
              <button key={v} type="button" className={`chip ${valeur === v ? 'active' : ''}`} onClick={() => setValeur(v)}>{v} €</button>
            ))}
          </div>
          <div className="planches-grid">
            {visibles.map((p, index) => (
              <article key={p.fichier} className="planche-card">
                <button type="button" className="planche-apercu" onClick={() => setLightboxIndex(index)} aria-label={`Aperçu de la planche ${p.valeur} € n° ${p.numero}`}>
                  <img src={urlApercu(p.vignette)} alt={`Planche de billets de ${p.valeur} €, n° ${p.numero}`} loading="lazy" />
                </button>
                <div className="planche-pied">
                  <div className="planche-titre">{p.valeur} € <small>n° {String(p.numero).padStart(2, '0')}</small></div>
                  <a className="btn btn-noir btn-xs" href={urlPlanche(p.fichier)} download>↓ PDF</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="bande-guichet">
          <p><strong>Vous avez dessiné un billet original ?</strong> Déposez-le au guichet : la banque le crédite sur votre compte, et c'est avec lui que vous enchérissez dans le market.</p>
          <Link to="/participer" className="btn btn-jaune btn-sm">→ Déposer un original</Link>
        </div>

        <MurBillets limit={12} onNotif={setNotif} />

        <section style={{ marginBottom: '3rem' }}>
          <div className="section-head">
            <h2>Cours des devises</h2>
            <span className="count">Les monnaies inventées par les joueurs</span>
          </div>
          <CoursDevises />
        </section>

      </div>

      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={apercus}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i === 0 ? apercus.length - 1 : i - 1))}
          onNext={() => setLightboxIndex(i => (i === apercus.length - 1 ? 0 : i + 1))}
        />
      )}
    </div>
  )
}
