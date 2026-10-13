import { useMemo, useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import { Link } from 'react-router-dom'
import { MurBillets } from '../components/GuichetEmission'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'

import planches from '../data/planches.json'
import billetsUnite from '../data/billets-unite.json'

const BASE = import.meta.env.BASE_URL
// Les billets à l'unité (SCAN-BILLET-2, 2026-10-13) sont trop lourds pour ce dépôt :
// ils vivent dans le dépôt billets-banque-fantome, servi par GitHub Pages sous le même domaine.
const DEPOT_BILLETS = 'https://jeansonpechin.com/billets-banque-fantome/'
const PAR_PAQUET = 60

const BILLETS = billetsUnite.filter(b => b.pdf_pret !== false)
const COLLECTIONS = {
  planches: {
    liste: planches, carte: 'planche-card', mot: 'planche',
    pdf: f => `${BASE}planches/${f}`, apercu: f => `${BASE}planches/apercus/${f}`,
  },
  unite: {
    liste: BILLETS, carte: 'planche-card billet-card', mot: 'billet',
    pdf: f => `${DEPOT_BILLETS}pdf/${f}`, apercu: f => `${DEPOT_BILLETS}apercus/${f}`,
  },
}

export default function Senrichir() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [collection, setCollection] = useState('planches')
  const [valeur, setValeur] = useState('toutes')
  const [montres, setMontres] = useState(PAR_PAQUET)
  const [notif, setNotif] = useState(null)

  const c = COLLECTIONS[collection]
  const valeurs = useMemo(() => [...new Set(c.liste.map(p => p.valeur))].sort((a, b) => a - b), [c])
  const visibles = useMemo(() => valeur === 'toutes' ? c.liste : c.liste.filter(p => p.valeur === valeur), [c, valeur])
  const apercus = useMemo(() => visibles.map(p => c.apercu(p.apercu)), [c, visibles])

  function choisirCollection(id) { setCollection(id); setValeur('toutes'); setMontres(PAR_PAQUET) }
  function choisirValeur(v) { setValeur(v); setMontres(PAR_PAQUET) }

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Billets à imprimer</span>
        </div>

        <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
          Ici, vous fabriquez votre monnaie : téléchargez un PDF, imprimez-le, découpez vos billets et jouez avec, en vrai papier.
          {' '}{planches.length} planches A4 de plusieurs billets, et {BILLETS.length} billets dessinés en atelier, un par page A4 à taille réelle.
          {' '}Cliquez sur un billet pour le voir en grand.
        </p>
        <section style={{ marginBottom: '2rem' }}>
          <div className="filter-row participer-onglets" role="tablist">
            <button type="button" role="tab" aria-selected={collection === 'planches'} className={`chip ${collection === 'planches' ? 'active' : ''}`} onClick={() => choisirCollection('planches')}>Planches · {planches.length}</button>
            <button type="button" role="tab" aria-selected={collection === 'unite'} className={`chip ${collection === 'unite' ? 'active' : ''}`} onClick={() => choisirCollection('unite')}>Billets à l'unité · {BILLETS.length}</button>
          </div>
          <div className="filter-row" style={{ marginBottom: '1.4rem' }}>
            <button type="button" className={`chip ${valeur === 'toutes' ? 'active' : ''}`} onClick={() => choisirValeur('toutes')}>toutes</button>
            {valeurs.map(v => (
              <button key={v} type="button" className={`chip ${valeur === v ? 'active' : ''}`} onClick={() => choisirValeur(v)}>{v} €</button>
            ))}
          </div>
          <div className="planches-grid">
            {visibles.slice(0, montres).map((p, index) => (
              <article key={p.fichier} className={c.carte}>
                <button type="button" className="planche-apercu" onClick={() => setLightboxIndex(index)} aria-label={`Aperçu du ${c.mot} ${p.valeur} € n° ${p.numero}`}>
                  <img src={c.apercu(p.vignette)} alt={`${collection === 'planches' ? 'Planche de billets' : 'Billet'} de ${p.valeur} €, n° ${p.numero}`} loading="lazy" />
                </button>
                <div className="planche-pied">
                  <div className="planche-titre">{p.valeur} € <small>n° {String(p.numero).padStart(collection === 'planches' ? 2 : 3, '0')}</small></div>
                  <a className="btn btn-noir btn-xs" href={c.pdf(p.fichier)} download>↓ PDF</a>
                </div>
              </article>
            ))}
          </div>
          {visibles.length > montres && (
            <div className="planches-plus">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setMontres(m => m + PAR_PAQUET)}>
                Voir {Math.min(PAR_PAQUET, visibles.length - montres)} de plus
              </button>
              <span className="caption-gris">{montres} sur {visibles.length}</span>
            </div>
          )}
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
