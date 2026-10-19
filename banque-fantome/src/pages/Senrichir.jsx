import { useEffect, useMemo, useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import { Link } from 'react-router-dom'
import MurBillets from '../components/MurBillets'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'
import BoutonPlanche from '../components/BoutonPlanche'
import { apercuPlanche } from '../lib/billet/planche'
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

  // Les billets dessinés sur le site (2026-10-19) rejoignent les planches scannées, en tête :
  // leur planche A4 est fabriquée dans le navigateur au clic, depuis la trace du billet.
  const [dessins, setDessins] = useState([])
  const [pret, setPret] = useState(false) // la grille attend les billets du site, pour n'être mélangée qu'une fois
  useEffect(() => {
    let annule = false
    supabase.from('dessins').select('id, numero, code, titre, devise, coupure, auteur_pseudo, image_path, statut, created_at')
      .neq('statut', 'annule').order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => { if (!annule) { setDessins(data || []); setPret(true) } })
    return () => { annule = true }
  }, [])

  const total = PLANCHES.length + dessins.length
  const valeurs = useMemo(() => [...new Set([...VALEURS, ...dessins.map(d => d.coupure)])].sort((a, b) => a - b), [dessins])
  // « toutes » : billets du site et planches scannées mêlés au hasard, tirés une fois par visite
  // (Jiiji, 2026-10-19 : « les nouvelles planches doivent aussi être affichées en random ») ;
  // par coupure, les billets du site d'abord, puis les planches dans l'ordre des numéros.
  const billetsDuSite = useMemo(() => dessins.map(d => ({ ...d, dessine: true })), [dessins])
  const auHasard = useMemo(() => melanger([...billetsDuSite, ...PLANCHES]), [billetsDuSite])
  const visibles = useMemo(() => valeur === 'toutes' ? auHasard : [
    ...billetsDuSite.filter(d => d.coupure === valeur),
    ...PLANCHES.filter(p => p.valeur === valeur),
  ], [valeur, auHasard, billetsDuSite])
  // Billets du site : la feuille A4 composée dans le navigateur (vignette, puis grand format à l'ouverture)
  const [feuilles, setFeuilles] = useState({}) // `${id}-${pxParMm}` -> url de l'aperçu
  const composer = (d, k) => apercuPlanche(d, k)
    .then(url => setFeuilles(f => ({ ...f, [`${d.id}-${k}`]: url })))
    .catch(e => console.error('[apercu planche]', e))
  useEffect(() => { visibles.slice(0, montres).filter(p => p.dessine).forEach(d => composer(d, 1.6)) }, [visibles, montres])
  useEffect(() => {
    const d = lightboxIndex !== null && visibles[lightboxIndex]
    if (d?.dessine) composer(d, 5)
  }, [lightboxIndex, visibles])
  const apercus = useMemo(() => visibles.map(p => p.dessine
    ? feuilles[`${p.id}-5`] || feuilles[`${p.id}-1.6`] || getPublicImageUrl(p.image_path)
    : urlApercu(p, p.apercu)), [visibles, feuilles])

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
          {' '}{total} planches A4, de 5 à 500 €, chacune à taille réelle avec ses traits de coupe : les billets dessinés
          dans l'<Link to="/creer?atelier=billet" className="lien-texte">atelier à billets</Link> et ceux de l'atelier papier, mêlés.
          Cliquez sur une planche pour voir le billet en grand.
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <div className="section-head">
            <h2>Les billets de la bourse</h2>
            <span className="count">{dessins.length > 0 ? `${dessins.length} dessiné${dessins.length > 1 ? 's' : ''} sur le site · ` : ''}{PLANCHES.length} scannés</span>
          </div>
          <div className="filter-row" style={{ marginBottom: '1.4rem' }}>
            <button type="button" className={`chip ${valeur === 'toutes' ? 'active' : ''}`} onClick={() => choisirValeur('toutes')}>toutes · {total}</button>
            {valeurs.map(v => (
              <button key={v} type="button" className={`chip ${valeur === v ? 'active' : ''}`} onClick={() => choisirValeur(v)}>{v} €</button>
            ))}
          </div>
          {!pret ? <div className="loader">Chargement<span className="blink">_</span></div> : <div className="planches-grid">
            {visibles.slice(0, montres).map((p, index) => p.dessine ? (
              <article key={p.id} className="planche-card">
                <button type="button" className={`planche-apercu ${feuilles[`${p.id}-1.6`] ? 'planche-apercu-feuille' : 'planche-apercu-billet'}`} onClick={() => setLightboxIndex(index)} aria-label={`Voir la planche du billet ${p.code || p.numero} en grand`}>
                  <img src={feuilles[`${p.id}-1.6`] || getPublicImageUrl(p.image_path)} alt={p.titre || `Billet de ${p.coupure}, par ${p.auteur_pseudo || 'un compte disparu'}`} loading="lazy" />
                </button>
                <div className="planche-pied">
                  <div className="planche-titre">{p.coupure} € <small>{p.titre || `par ${p.auteur_pseudo || '?'}`}</small></div>
                  <BoutonPlanche dessin={p} className="btn btn-noir btn-xs" libelle="↓ PDF" />
                </div>
              </article>
            ) : (
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
          </div>}
          {pret && visibles.length > montres && (
            <div className="planches-plus">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setMontres(m => m + PAR_PAQUET)}>
                Voir {Math.min(PAR_PAQUET, visibles.length - montres)} planches de plus
              </button>
              <span className="caption-gris">{montres} sur {visibles.length}</span>
            </div>
          )}
        </section>

        <div className="bande-guichet">
          <p><strong>Les planches se jouent sur papier.</strong> Pour avoir de l'argent sur votre compte, dessinez un billet dans l'<Link to="/creer?atelier=billet" className="lien-texte">atelier</Link> : encaissé, il crédite votre compte de sa valeur.</p>
          <Link to="/creer" className="btn btn-jaune btn-sm">→ Ouvrir les ateliers</Link>
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

