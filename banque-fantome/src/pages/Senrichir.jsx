import { useEffect, useMemo, useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import { Link } from 'react-router-dom'
import MurBillets from '../components/MurBillets'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'
import BoutonPlanche from '../components/BoutonPlanche'
import { supabase } from '../lib/supabase'
import { getPublicImageUrl } from '../utils/images'

import planchesScan1 from '../data/planches.json'
import planchesScan2 from '../data/planches-scan2.json'

const BASE = import.meta.env.BASE_URL
// Les planches de SCAN-BILLET-2 (772, 2026-10-13) sont trop lourdes pour ce dépôt : elles
// vivent dans le dépôt billets-banque-fantome, servi par GitHub Pages sous le même domaine.
// Numérotées à la suite de celles de SCAN-BILLET-1, valeur par valeur.
const DEPOT_SCAN2 = 'https://jeansonpechin.com/billets-banque-fantome/'
const PAR_PAQUET = 60

// « toutes » : un ordre tiré au hasard à chaque visite (Jiiji, 2026-10-13) ; par coupure, l'ordre des numéros
function melanger(liste) {
  const l = [...liste]
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]]
  }
  return l
}

const PLANCHES = [...planchesScan1, ...planchesScan2].sort((a, b) => a.valeur - b.valeur || a.numero - b.numero)
const VALEURS = [...new Set(PLANCHES.map(p => p.valeur))].sort((a, b) => a - b)
const urlPlanche = p => p.serie === 2 ? `${DEPOT_SCAN2}pdf/${p.fichier}` : `${BASE}planches/${p.fichier}`
const urlApercu = (p, f) => p.serie === 2 ? `${DEPOT_SCAN2}apercus/${f}` : `${BASE}planches/apercus/${f}`

export default function Senrichir() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [valeur, setValeur] = useState('toutes')
  const [montres, setMontres] = useState(PAR_PAQUET)
  const [notif, setNotif] = useState(null)
  const [auHasard] = useState(() => melanger(PLANCHES))

  const visibles = useMemo(() => valeur === 'toutes' ? auHasard : PLANCHES.filter(p => p.valeur === valeur), [valeur, auHasard])
  const apercus = useMemo(() => visibles.map(p => urlApercu(p, p.apercu)), [visibles])

  function choisirValeur(v) { setValeur(v); setMontres(PAR_PAQUET) }

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Planches à imprimer</span>
        </div>

        <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
          Ici, vous fabriquez votre monnaie : téléchargez une planche, imprimez-la, découpez vos billets et jouez avec, en vrai papier.
          {' '}{PLANCHES.length} planches A4, de 5 à 500 € : chacune reprend un billet dessiné en atelier, à taille réelle. Cliquez sur une planche pour la voir en grand.
        </p>
        <PlanchesBourse />

        <section style={{ marginBottom: '2rem' }}>
          <div className="section-head">
            <h2>Les planches de l'atelier</h2>
            <span className="count">Scannées, de 5 à 500 €</span>
          </div>
          <div className="filter-row" style={{ marginBottom: '1.4rem' }}>
            <button type="button" className={`chip ${valeur === 'toutes' ? 'active' : ''}`} onClick={() => choisirValeur('toutes')}>toutes · {PLANCHES.length}</button>
            {VALEURS.map(v => (
              <button key={v} type="button" className={`chip ${valeur === v ? 'active' : ''}`} onClick={() => choisirValeur(v)}>{v} €</button>
            ))}
          </div>
          <div className="planches-grid">
            {visibles.slice(0, montres).map((p, index) => (
              <article key={p.fichier} className="planche-card">
                <button type="button" className="planche-apercu" onClick={() => setLightboxIndex(index)} aria-label={`Aperçu de la planche ${p.valeur} € n° ${p.numero}`}>
                  <img src={urlApercu(p, p.vignette)} alt={`Planche de billets de ${p.valeur} €, n° ${p.numero}`} loading="lazy" />
                </button>
                <div className="planche-pied">
                  <div className="planche-titre">{p.valeur} € <small>n° {String(p.numero).padStart(2, '0')}</small></div>
                  <a className="btn btn-noir btn-xs" href={urlPlanche(p)} download>↓ PDF</a>
                </div>
              </article>
            ))}
          </div>
          {visibles.length > montres && (
            <div className="planches-plus">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setMontres(m => m + PAR_PAQUET)}>
                Voir {Math.min(PAR_PAQUET, visibles.length - montres)} planches de plus
              </button>
              <span className="caption-gris">{montres} sur {visibles.length}</span>
            </div>
          )}
        </section>

        <div className="bande-guichet">
          <p><strong>Les planches se jouent sur papier.</strong> Pour avoir de l'argent sur votre compte, dessinez un billet dans l'atelier de la bourse : encaissé, il crédite votre compte de sa valeur.</p>
          <Link to="/bourse?onglet=atelier" className="btn btn-jaune btn-sm">→ Ouvrir l'atelier</Link>
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

// Les billets dessinés dans la bourse, chacun en planche A4 à imprimer (2026-10-19, demande de
// Jiiji). La planche est fabriquée dans le navigateur au clic, depuis la trace du billet :
// rien à stocker, et un nouveau billet est imprimable dès qu'il est déposé.
const PAR_PAQUET_BOURSE = 24
function PlanchesBourse() {
  const [billets, setBillets] = useState(null)
  const [montres, setMontres] = useState(PAR_PAQUET_BOURSE)
  const [zoom, setZoom] = useState(null)
  useEffect(() => {
    let annule = false
    supabase.from('dessins').select('id, numero, code, titre, devise, coupure, auteur_pseudo, image_path, statut, created_at')
      .neq('statut', 'annule').order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => { if (!annule) setBillets(data || []) })
    return () => { annule = true }
  }, [])
  if (!billets?.length) return null
  const images = billets.map(b => getPublicImageUrl(b.image_path))
  return (
    <section style={{ marginBottom: '3rem' }}>
      <div className="section-head">
        <h2>Les billets de la bourse</h2>
        <span className="count">{billets.length} dessiné{billets.length > 1 ? 's' : ''} sur le site</span>
      </div>
      <p className="texte-aide" style={{ marginBottom: '1.2rem' }}>
        Chaque billet dessiné dans l'<Link to="/bourse?onglet=atelier" className="lien-texte">atelier</Link> devient une planche A4 :
        le billet à taille réelle, autant de fois que la feuille le permet, avec ses traits de coupe.
      </p>
      <div className="planches-grid">
        {billets.slice(0, montres).map((b, i) => (
          <article key={b.id} className="planche-card">
            <button type="button" className="planche-apercu planche-apercu-billet" onClick={() => setZoom(i)} aria-label={`Voir le billet ${b.code || b.numero} en grand`}>
              <img src={images[i]} alt={b.titre || `Billet de ${b.coupure}, par ${b.auteur_pseudo || 'un compte disparu'}`} loading="lazy" />
            </button>
            <div className="planche-pied">
              <div className="planche-titre">{b.coupure} <small>{b.titre || `par ${b.auteur_pseudo || '?'}`}</small></div>
              <BoutonPlanche dessin={b} className="btn btn-noir btn-xs" libelle="↓ PDF" />
            </div>
          </article>
        ))}
      </div>
      {billets.length > montres && (
        <div className="planches-plus">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setMontres(m => m + PAR_PAQUET_BOURSE)}>Voir plus de billets</button>
          <span className="caption-gris">{montres} sur {billets.length}</span>
        </div>
      )}
      {zoom !== null && (
        <ImageLightbox images={images} initialIndex={zoom} onClose={() => setZoom(null)}
          onPrev={() => setZoom(i => (i === 0 ? images.length - 1 : i - 1))}
          onNext={() => setZoom(i => (i === images.length - 1 ? 0 : i + 1))} />
      )}
    </section>
  )
}
