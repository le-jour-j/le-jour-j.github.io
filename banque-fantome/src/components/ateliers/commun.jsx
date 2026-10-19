import { useEffect, useRef, useState } from 'react'
import './ateliers.css'

// Pièces communes aux ateliers de création (2026-10-19) : Paint, Poésie, Image, Collage.
// Chaque atelier fabrique une ŒUVRE (une image) et la rend par onValider ; la page /creer
// l'envoie au stockage et l'inscrit dans la collection. Le contrat d'un atelier :
//
//   <AtelierX onValider={async ({ blob, type, largeur, hauteur, source }) => …}
//             enCours={bool} libelleValider="→ Déposer dans ma collection" />
//
//   • blob/type : l'œuvre en image (exporterToile), largeur/hauteur en pixels ;
//   • source : de quoi la refaire (traits, texte et mise en page, réglages…), en JSON, < 1 Mo ;
//   • si onValider lève une erreur, l'atelier garde son état et le brouillon.

export const COTE_MAX = 2400 // px, le grand côté d'une œuvre exportée

// Toile → image : WebP si le navigateur sait l'écrire (Safari rend un PNG, type le dit),
// réduite pour que le grand côté ne dépasse pas COTE_MAX.
export async function exporterToile(toile, { qualite = 0.92, fond = null } = {}) {
  let cv = toile
  const k = Math.min(1, COTE_MAX / Math.max(toile.width, toile.height))
  if (k < 1 || fond) {
    cv = document.createElement('canvas')
    cv.width = Math.round(toile.width * k); cv.height = Math.round(toile.height * k)
    const ctx = cv.getContext('2d')
    if (fond) { ctx.fillStyle = fond; ctx.fillRect(0, 0, cv.width, cv.height) }
    ctx.drawImage(toile, 0, 0, cv.width, cv.height)
  }
  const blob = await new Promise(res => cv.toBlob(res, 'image/webp', qualite))
  if (!blob) throw new Error('L’œuvre n’a pas pu être mise en image.')
  return { blob, type: blob.type, largeur: cv.width, hauteur: cv.height }
}

// État gardé dans le navigateur entre deux visites (brouillon). Jamais bloquant :
// en navigation privée, ou si le stockage est plein, l'atelier marche sans.
export function useBrouillon(cle, initial) {
  const [valeur, setValeur] = useState(() => {
    try { const v = localStorage.getItem(cle); return v ? { ...initial, ...JSON.parse(v) } : initial }
    catch { return initial }
  })
  const premier = useRef(true)
  useEffect(() => {
    if (premier.current) { premier.current = false; return }
    const t = setTimeout(() => { try { localStorage.setItem(cle, JSON.stringify(valeur)) } catch { /* plein ou privé */ } }, 400)
    return () => clearTimeout(t)
  }, [cle, valeur])
  const effacer = () => { try { localStorage.removeItem(cle) } catch { /* rien */ } setValeur(initial) }
  return [valeur, setValeur, effacer]
}

// L'encart de vulgarisation : une pratique d'artiste, en deux ou trois phrases.
export function Encart({ titre, children }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <aside className={`atelier-encart ${ouvert ? 'ouvert' : ''}`}>
      <button type="button" className="atelier-encart-tete" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}>
        <span className="atelier-encart-signe" aria-hidden="true">✦</span> {titre}
        <span className="atelier-encart-fleche" aria-hidden="true">{ouvert ? '−' : '+'}</span>
      </button>
      {ouvert && <div className="atelier-encart-corps">{children}</div>}
    </aside>
  )
}

// Le pied commun : effacer (avec confirmation) et déposer.
export function PiedAtelier({ onEffacer, onValider, enCours, libelleValider = '→ Déposer dans ma collection', desactive, aide }) {
  const [confirmer, setConfirmer] = useState(false)
  return (
    <div className="atelier-pied">
      <div className="atelier-pied-gauche">
        {onEffacer && (confirmer
          ? <>
              <button type="button" className="btn btn-rouge btn-sm" onClick={() => { onEffacer(); setConfirmer(false) }}>Tout effacer</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmer(false)}>Non</button>
            </>
          : <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmer(true)}>Recommencer</button>)}
        {aide && <span className="caption-gris">{aide}</span>}
      </div>
      <button type="button" className="btn btn-jaune" disabled={enCours || desactive} onClick={onValider}>
        {enCours ? 'Dépôt en cours…' : libelleValider}
      </button>
    </div>
  )
}
