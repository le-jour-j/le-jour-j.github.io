import { useEffect, useMemo, useRef, useState } from 'react'
import { COTE_MAX, exporterToile, useBrouillon, Encart, PiedAtelier } from './commun'
import './image.css'

// L'atelier Image (2026-10-19) : on dépose une photo, ou une image faite ailleurs, on la
// retouche un peu, et c'est cette image qu'on vend. La retouche ne détruit rien : l'original
// (réduit à 3000 px de grand côté) reste en mémoire et chaque aperçu rejoue tous les réglages.
// Tout passe par les pixels (aucun ctx.filter) : le rendu est le même sur tous les navigateurs,
// Safari compris, et l'aperçu est fait par la même fonction que l'export.

const CLE_BROUILLON = 'bf-atelier-image-brouillon'
// Les formats que le stockage accepte (comme Deposer.jsx). Le HEIC d'iPhone est tenté quand
// même : si le navigateur sait le lire, l'œuvre repart en WebP ou PNG, donc acceptée.
const FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const COTE_CHARGEMENT = 3000             // px, l'original gardé en mémoire
const POIDS_LECTURE_MAX = 50 * 1024 * 1024
const POIDS_STOCKAGE_MAX = 8 * 1024 * 1024
const MSG_HEIC = 'Cette photo est au format HEIC, que ce navigateur ne sait pas lire. Sur iPhone : Réglages, Appareil photo, Formats, cochez « Le plus compatible », puis reprenez la photo.'

const REGLAGES_NEUTRES = {
  lumiere: 0, contraste: 0, saturation: 0, temperature: 0, nettete: 0, vignettage: 0, grain: 0,
  filtre: '', ombre: '#1d2b64', clair: '#f5e27a',
  cadre: '', marge: 6,
}
const GEO_NEUTRE = { rotation: 0, miroir: false, ratio: 'libre', inverse: false, x: 0, y: 0, l: 1, h: 1 }
const BROUILLON_VIDE = { reglages: REGLAGES_NEUTRES, geometrie: GEO_NEUTRE, nom: '', empreinte: '' }

const RATIOS = { libre: null, '1:1': 1, '4:5': 4 / 5, '3:2': 3 / 2, '16:9': 16 / 9 }
const FILTRES = [
  ['', 'aucun'], ['nb', 'noir et blanc'], ['sepia', 'sépia'], ['bichro', 'bichromie'],
  ['photocopie', 'photocopie'], ['aplats', 'aplats'], ['journal', 'papier journal'],
]
const DUOS = [['#1d2b64', '#f5e27a'], ['#3a0f2e', '#ff8fb1'], ['#0b3d2e', '#e8f0c8'], ['#1a1a1a', '#ff5a36']]
const CURSEURS = [
  ['lumiere', 'lumière', 'sombre', 'claire'],
  ['contraste', 'contraste', 'doux', 'dur'],
  ['saturation', 'couleurs', 'éteintes', 'vives'],
  ['temperature', 'température', 'froid', 'chaud'],
  ['nettete', 'netteté', 'flou', 'net'],
  ['vignettage', 'coins sombres', '', ''],
  ['grain', 'grain', '', ''],
]

// ── petites briques
const borne = (v, a, b) => (v < a ? a : v > b ? b : v)
function nouvelleToile(l, h, lecture = false) {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, l); cv.height = Math.max(1, h)
  if (lecture) cv.getContext('2d', { willReadFrequently: true })
  return cv
}
// Sur iPhone, la mémoire des toiles est comptée : on rend la place dès qu'une toile ne sert plus
function liberer(cv) { if (cv) { cv.width = 0; cv.height = 0 } }
function hexRgb(hex) {
  const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function lisse(a, b, x) { const t = borne((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
// Bruit fixe (même grain d'un rendu à l'autre), entre -1 et 1
function bruit(x, y) {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  n ^= n >>> 16
  return ((n & 0xffff) / 0xffff) * 2 - 1
}
const estNeutre = r => !r.filtre && ['lumiere', 'contraste', 'saturation', 'temperature', 'nettete', 'vignettage', 'grain'].every(k => !r[k])
const ratioEffectif = g => { const r = RATIOS[g.ratio]; return r ? (g.inverse ? 1 / r : r) : null }
const libelleRatio = (nom, inverse) => (inverse && nom !== 'libre' && nom !== '1:1' ? nom.split(':').reverse().join(':') : nom)

// ── géométrie : l'image « orientée » est l'original tourné puis retourné en miroir ;
// le recadrage est un rectangle en fractions (0 à 1) de cette image orientée.
function tailleOrientee(img, rotation) { return rotation % 180 ? [img.height, img.width] : [img.width, img.height] }
function rectPx(g, W, H) { return { x: g.x * W, y: g.y * H, l: Math.max(1, g.l * W), h: Math.max(1, g.h * H) } }

// Le plus grand cadre au ratio voulu, centré là où était le cadre précédent
function ajusterRatio(g, W, H) {
  const r = ratioEffectif(g)
  if (!r) return g
  let l = W, h = W / r
  if (h > H) { h = H; l = H * r }
  const c = rectPx(g, W, H)
  const x = borne(c.x + c.l / 2 - l / 2, 0, W - l), y = borne(c.y + c.h / 2 - h / 2, 0, H - h)
  return { ...g, x: x / W, y: y / H, l: l / W, h: h / H }
}

// Un coin tiré : ancre fixe (le coin opposé), le pointeur donne l'autre coin
function redimensionner(ax, ay, px, py, r, W, H, mini) {
  const sx = px >= ax ? 1 : -1, sy = py >= ay ? 1 : -1
  const maxL = sx > 0 ? W - ax : ax, maxH = sy > 0 ? H - ay : ay
  let l = Math.min(Math.abs(px - ax), maxL), h = Math.min(Math.abs(py - ay), maxH)
  if (r) {
    if (l / (h || 1e-6) > r) h = l / r; else l = h * r
    if (l > maxL) { l = maxL; h = l / r }
    if (h > maxH) { h = maxH; l = h * r }
    if (l < mini) { l = mini; h = l / r }
    if (h < mini) { h = mini; l = h * r }
  } else { l = Math.max(l, mini); h = Math.max(h, mini) }
  l = Math.min(l, W); h = Math.min(h, H)
  const x = borne(sx > 0 ? ax : ax - l, 0, W - l), y = borne(sy > 0 ? ay : ay - h, 0, H - h)
  return { x, y, l, h }
}

// Original → toile tournée, retournée et recadrée, au plus coteMax de grand côté
function rendreBase(img, g, coteMax, entier) {
  const [W, H] = tailleOrientee(img, g.rotation)
  const c = entier ? { x: 0, y: 0, l: W, h: H } : rectPx(g, W, H)
  const k = Math.min(1, coteMax / Math.max(c.l, c.h))
  const cv = nouvelleToile(Math.round(c.l * k), Math.round(c.h * k))
  const ctx = cv.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.scale(cv.width / c.l, cv.height / c.h)
  ctx.translate(-c.x, -c.y)
  ctx.translate(W / 2, H / 2)
  ctx.scale(g.miroir ? -1 : 1, 1)                 // miroir après rotation : il retourne ce qu'on voit
  ctx.rotate(g.rotation * Math.PI / 180)
  ctx.drawImage(img, -img.width / 2, -img.height / 2)
  return cv
}

// ── flou en boîte, trois passes (proche d'un flou gaussien), séparé en lignes et colonnes.
// buf : valeurs rangées par pixel (pas = nombre de valeurs par pixel) ; seuls les `canaux`
// premiers sont floutés, les autres (l'alpha) recopiés.
function passe(s, t, w, h, r, canaux, pas, horiz) {
  const n = 2 * r + 1, lignes = horiz ? h : w, long = horiz ? w : h
  const pasI = horiz ? pas : w * pas, pasL = horiz ? w * pas : pas
  for (let li = 0; li < lignes; li++) {
    const base = li * pasL
    for (let c = 0; c < canaux; c++) {
      let somme = 0
      for (let i = -r; i <= r; i++) somme += s[base + borne(i, 0, long - 1) * pasI + c]
      for (let i = 0; i < long; i++) {
        t[base + i * pasI + c] = somme / n
        somme += s[base + Math.min(long - 1, i + r + 1) * pasI + c] - s[base + Math.max(0, i - r) * pasI + c]
      }
    }
    for (let c = canaux; c < pas; c++) for (let i = 0; i < long; i++) t[base + i * pasI + c] = s[base + i * pasI + c]
  }
}
function flouter(buf, w, h, r, canaux, pas, passes = 3) {
  const tmp = new buf.constructor(buf.length)
  for (let k = 0; k < passes; k++) { passe(buf, tmp, w, h, r, canaux, pas, true); passe(tmp, buf, w, h, r, canaux, pas, false) }
}

// Le flou de la toile elle-même : ctx.filter quand le navigateur le connaît (dix fois plus
// rapide), sinon (Safari ancien) le flou en boîte ci-dessus, de même force.
let filtreCanvas = null
function sansFiltreCanvas() {
  if (filtreCanvas === null) {
    try { const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(2px)'; filtreCanvas = c.filter === 'blur(2px)' }
    catch { filtreCanvas = false }
  }
  return !filtreCanvas
}
function flouCopie(cv, d, w, h, r, passes = 3) {
  if (sansFiltreCanvas()) { const f = d.slice(); flouter(f, w, h, r, 3, 4, passes); return f }
  const t = nouvelleToile(w, h)
  const ctx = t.getContext('2d')
  ctx.filter = `blur(${Math.sqrt(passes * r * (r + 1) / 3).toFixed(2)}px)`
  ctx.drawImage(cv, 0, 0)
  const f = ctx.getImageData(0, 0, w, h).data
  liberer(t)
  return f
}

// ── les réglages, pixel par pixel. Toutes les tailles (flou, grain, trame) suivent la taille
// de la toile : l'aperçu réduit ressemble à l'export en grand.
function retoucher(cv, r) {
  const w = cv.width, h = cv.height, cote = Math.max(w, h)
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const img = ctx.getImageData(0, 0, w, h), d = img.data

  // (la toile contient encore l'image intacte : on peut la flouter directement)
  if (r.nettete < 0) {                          // flou léger : mélange avec une copie floutée
    const f = flouCopie(cv, d, w, h, Math.max(1, Math.round(cote * 0.004)))
    const a = -r.nettete / 100
    for (let i = 0; i < d.length; i += 4) { d[i] += (f[i] - d[i]) * a; d[i + 1] += (f[i + 1] - d[i + 1]) * a; d[i + 2] += (f[i + 2] - d[i + 2]) * a }
  } else if (r.nettete > 0) {                   // netteté : on creuse l'écart avec la copie floutée
    const f = flouCopie(cv, d, w, h, Math.max(1, Math.round(cote * 0.0012)), 2)
    const a = r.nettete / 100 * 1.6
    for (let i = 0; i < d.length; i += 4) { d[i] += (d[i] - f[i]) * a; d[i + 1] += (d[i + 1] - f[i + 1]) * a; d[i + 2] += (d[i + 2] - f[i + 2]) * a }
  }

  // température, lumière (courbe des tons moyens), contraste : une table par canal
  const t = r.temperature / 100
  const gamma = Math.pow(2, -r.lumiere / 100)
  const ct = r.contraste >= 0 ? 1 + r.contraste / 100 * 1.5 : 1 + r.contraste / 100 * 0.85
  const tables = [1 + t * 0.18, 1 + t * 0.03, 1 - t * 0.18].map(gain => {
    const lut = new Float32Array(256)
    for (let v = 0; v < 256; v++) {
      let x = Math.min(255, v * gain)
      x = 255 * Math.pow(x / 255, gamma)
      lut[v] = (x - 128) * ct + 128
    }
    return lut
  })
  const [t0, t1, t2] = tables
  const sat = 1 + r.saturation / 100
  const filtre = r.filtre
  const [o0, o1, o2] = hexRgb(r.ombre), [c0, c1, c2] = hexRgb(r.clair)
  const vig = r.vignettage / 100
  const grain = r.grain / 100 * 50, pasGrain = Math.max(1, Math.round(cote / 1100))
  const journal = filtre === 'journal'
  const gris = journal ? new Uint8ClampedArray(w * h) : null   // même type que l'image : le flou reste rapide

  for (let y = 0, i = 0, p = 0; y < h; y++) {
    const dy = (y + 0.5) / h * 2 - 1
    for (let x = 0; x < w; x++, i += 4, p++) {
      let R = t0[d[i]], G = t1[d[i + 1]], B = t2[d[i + 2]]
      if (sat !== 1) {
        const L = 0.299 * R + 0.587 * G + 0.114 * B
        R = L + (R - L) * sat; G = L + (G - L) * sat; B = L + (B - L) * sat
      }
      if (filtre === 'nb') { R = G = B = 0.299 * R + 0.587 * G + 0.114 * B }
      else if (filtre === 'sepia') {
        const r2 = 0.393 * R + 0.769 * G + 0.189 * B, g2 = 0.349 * R + 0.686 * G + 0.168 * B, b2 = 0.272 * R + 0.534 * G + 0.131 * B
        R = r2; G = g2; B = b2
      } else if (filtre === 'bichro') {
        const k = borne((0.299 * R + 0.587 * G + 0.114 * B) / 255, 0, 1)
        R = o0 + (c0 - o0) * k; G = o1 + (c1 - o1) * k; B = o2 + (c2 - o2) * k
      } else if (filtre === 'photocopie') {
        const k = borne(((0.299 * R + 0.587 * G + 0.114 * B) - 125) * 3.2 + 128, 0, 255) / 255
        R = 26 + 220 * k; G = 26 + 217 * k; B = 26 + 210 * k
      } else if (filtre === 'aplats') {
        R = Math.round(borne(R, 0, 255) / 85) * 85; G = Math.round(borne(G, 0, 255) / 85) * 85; B = Math.round(borne(B, 0, 255) / 85) * 85
      }
      if (vig) {
        const dx = (x + 0.5) / w * 2 - 1
        const m = 1 - vig * 0.85 * lisse(0.3, 1, Math.sqrt((dx * dx + dy * dy) / 2))
        R *= m; G *= m; B *= m
      }
      if (journal) { gris[p] = 0.299 * R + 0.587 * G + 0.114 * B; continue }
      if (grain) { const n = bruit((x / pasGrain) | 0, (y / pasGrain) | 0) * grain; R += n; G += n; B += n }
      d[i] = R; d[i + 1] = G; d[i + 2] = B
    }
  }
  if (journal) trame(d, gris, w, h, cote, grain, pasGrain)
  ctx.putImageData(img, 0, 0)
}

// Papier journal : une trame de points à 45 degrés, plus gros là où l'image est sombre
function trame(d, gris, w, h, cote, grain, pasGrain) {
  const s = Math.max(4, cote / 110), c = Math.SQRT1_2
  flouter(gris, w, h, Math.max(1, Math.round(s / 3)), 1, 1, 2)
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      const u = (x + y) * c, v = (y - x) * c
      const uc = (Math.floor(u / s) + 0.5) * s, vc = (Math.floor(v / s) + 0.5) * s
      const xc = borne(Math.round((uc - vc) * c), 0, w - 1), yc = borne(Math.round((uc + vc) * c), 0, h - 1)
      const k = Math.max(0, 1 - gris[yc * w + xc] / 255)
      const rayon = s * 0.72 * Math.sqrt(k)
      const encre = borne(rayon - Math.hypot(u - uc, v - vc) + 0.5, 0, 1)
      const n = grain ? bruit((x / pasGrain) | 0, (y / pasGrain) | 0) * grain : 0
      d[i] = 244 - 218 * encre + n; d[i + 1] = 239 - 213 * encre + n; d[i + 2] = 226 - 200 * encre + n
    }
  }
}

function encadrer(cv, r) {
  if (!r.cadre) return cv
  const m = Math.round(Math.max(cv.width, cv.height) * r.marge / 100)
  const out = nouvelleToile(cv.width + 2 * m, cv.height + 2 * m)
  const ctx = out.getContext('2d')
  ctx.fillStyle = r.cadre === 'noir' ? '#141414' : '#ffffff'
  ctx.fillRect(0, 0, out.width, out.height)
  ctx.drawImage(cv, m, m)
  liberer(cv)
  return out
}

// Le rendu complet, le même pour l'aperçu, les vignettes de filtre et l'export
function rendre(img, r, g, { coteMax, entier = false, base = null }) {
  const b = base || rendreBase(img, g, coteMax, entier)
  const cv = nouvelleToile(b.width, b.height, true)
  cv.getContext('2d').drawImage(b, 0, 0)
  if (!base) liberer(b)
  if (!estNeutre(r)) retoucher(cv, r)
  return entier ? cv : encadrer(cv, r)
}

// ── ouverture d'un fichier : orientation de l'appareil respectée, grandes photos réduites
function imageElement(fichier) {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(fichier), im = new Image()
    im.onload = () => { URL.revokeObjectURL(url); ok(im) }
    im.onerror = () => { URL.revokeObjectURL(url); ko(new Error('illisible')) }
    im.src = url
  })
}
async function ouvrirImage(fichier) {
  let src = null
  if (typeof createImageBitmap === 'function') {
    try { src = await createImageBitmap(fichier, { imageOrientation: 'from-image' }) } catch { src = null }
  }
  if (!src) src = await imageElement(fichier)         // une <img> suit aussi l'orientation de l'appareil
  const lo = src.naturalWidth || src.width, ho = src.naturalHeight || src.height
  if (!lo || !ho) throw new Error('vide')
  const k = Math.min(1, COTE_CHARGEMENT / Math.max(lo, ho))
  const toile = nouvelleToile(Math.round(lo * k), Math.round(ho * k))
  const ctx = toile.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, toile.width, toile.height)
  if (src.close) src.close()
  return { toile, largeur: lo, hauteur: ho }
}

// Repli si l'export dépasse ce que le stockage accepte (Safari écrit du PNG, parfois très lourd)
async function enJpeg(toile) {
  const k = Math.min(1, COTE_MAX / Math.max(toile.width, toile.height))
  const cv = nouvelleToile(Math.round(toile.width * k), Math.round(toile.height * k))
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height)
  ctx.drawImage(toile, 0, 0, cv.width, cv.height)
  for (const q of [0.9, 0.8, 0.7]) {
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', q))
    if (blob && blob.size <= POIDS_STOCKAGE_MAX) { const sortie = { blob, type: blob.type, largeur: cv.width, hauteur: cv.height }; liberer(cv); return sortie }
  }
  liberer(cv)
  throw new Error('L’image est trop lourde pour le stockage (plus de 8 Mo), même allégée.')
}

const coteImageExport = r => (r.cadre ? Math.floor(COTE_MAX / (1 + 2 * r.marge / 100)) : COTE_MAX)

// ── un curseur : nom, valeur (un clic dessus la remet au neutre), bornes nommées
function Curseur({ nom, valeur, min = -100, max = 100, neutre = 0, gauche, droite, suffixe = '', onChange }) {
  return (
    <div className="retouche-curseur">
      <div className="retouche-curseur-tete">
        <span>{nom}</span>
        <button type="button" className="retouche-valeur" title="remettre au neutre" disabled={valeur === neutre} onClick={() => onChange(neutre)}>
          {valeur > 0 && min < 0 ? '+' : ''}{valeur}{suffixe}
        </button>
      </div>
      <input type="range" min={min} max={max} step="1" value={valeur} aria-label={nom} onChange={e => onChange(Number(e.target.value))} />
      {(gauche || droite) && <div className="retouche-bornes" aria-hidden="true"><span>{gauche}</span><span>{droite}</span></div>}
    </div>
  )
}

// Le contrat d'atelier (commun.jsx), plus `imageInitiale` (File ou Blob, facultative) :
// une image à ouvrir d'emblée, pour un banc d'essai ou une image venue d'ailleurs.
export default function AtelierImage({ onValider, enCours = false, libelleValider = '→ Déposer dans ma collection', imageInitiale = null }) {
  const [brouillon, setBrouillon, effacerBrouillon] = useBrouillon(CLE_BROUILLON, BROUILLON_VIDE)
  const reglages = useMemo(() => ({ ...REGLAGES_NEUTRES, ...brouillon.reglages }), [brouillon.reglages])
  const geo = useMemo(() => ({ ...GEO_NEUTRE, ...brouillon.geometrie }), [brouillon.geometrie])

  const [image, setImage] = useState(null)           // { toile, nom, largeur, hauteur }
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState(null)
  const [onglet, setOnglet] = useState('cadrer')
  const [avant, setAvant] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [survol, setSurvol] = useState(false)        // un fichier glissé au-dessus
  const [vignettes, setVignettes] = useState({})
  const [tailleApercu, setTailleApercu] = useState(1000)

  const toileRef = useRef(null)
  const sceneRef = useRef(null)
  const zoneRef = useRef(null)
  const fichierRef = useRef(null)
  const photoRef = useRef(null)
  const baseRef = useRef({})                       // toiles de base gardées, par géométrie et taille
  const viderBases = () => { Object.values(baseRef.current).forEach(liberer); baseRef.current = {} }
  const prise = useRef(null)                         // le geste de recadrage en cours

  const recadrer = onglet === 'cadrer'
  const [W, H] = image ? tailleOrientee(image.toile, geo.rotation) : [1, 1]

  function setReglage(k, v) { setBrouillon(b => ({ ...b, reglages: { ...REGLAGES_NEUTRES, ...b.reglages, [k]: v } })) }
  function setGeo(f) { setBrouillon(b => { const g = { ...GEO_NEUTRE, ...b.geometrie }; return { ...b, geometrie: typeof f === 'function' ? f(g) : f } }) }

  // ── chargement
  async function charger(fichier) {
    if (!fichier) return
    setMessage(null)
    const nom = fichier.name || 'image'
    const type = fichier.type || ''
    const heic = /image\/hei[cf]/i.test(type) || /\.hei[cf]$/i.test(nom)
    if (type && !type.startsWith('image/')) { setMessage({ type: 'err', msg: 'Ce fichier n’est pas une image.' }); return }
    if (type && !FORMATS.includes(type) && !heic) { setMessage({ type: 'err', msg: 'Format non accepté : JPEG, PNG, WebP ou GIF.' }); return }
    if (fichier.size > POIDS_LECTURE_MAX) { setMessage({ type: 'err', msg: 'Cette image est trop lourde (plus de 50 Mo).' }); return }
    setChargement(true)
    try {
      const ouverte = await ouvrirImage(fichier)
      viderBases()
      setImage(ancienne => { if (ancienne) liberer(ancienne.toile); return { ...ouverte, nom } })
      // Les réglages gardés ne valent que pour la même image (nom et poids : sur iPhone,
      // toutes les photos s'appellent image.jpg)
      const empreinte = `${nom}:${fichier.size}`
      setBrouillon(b => (b.empreinte === empreinte ? b : { ...BROUILLON_VIDE, nom, empreinte }))
      if (type === 'image/gif') setMessage({ type: 'ok', msg: 'Un GIF animé devient une image fixe : seule la première image est gardée.' })
    } catch {
      setMessage({ type: 'err', msg: heic ? MSG_HEIC : 'Cette image n’a pas pu être ouverte. Essayez avec un JPEG ou un PNG.' })
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => { if (imageInitiale) charger(imageInitiale) }, [imageInitiale]) // eslint-disable-line react-hooks/exhaustive-deps

  // la toile d'origine est rendue à la fermeture de l'atelier
  const imageRef = useRef(null)
  imageRef.current = image
  useEffect(() => () => { viderBases(); if (imageRef.current) liberer(imageRef.current.toile) }, [])

  // ── taille de l'aperçu : ce que l'écran affiche vraiment, pas plus
  useEffect(() => {
    const el = sceneRef.current
    if (!el) return
    const mesurer = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const cote = Math.max(el.clientWidth, Math.min(640, window.innerHeight * 0.62)) * dpr
      setTailleApercu(borne(Math.ceil(cote / 200) * 200, 600, 1600))
    }
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(el)
    return () => ro.disconnect()
  }, [image])

  // ── l'aperçu : la même fonction que l'export, à la taille de l'écran
  const cleGeo = recadrer ? `${geo.rotation}|${geo.miroir}|entier` : `${geo.rotation}|${geo.miroir}|${geo.x}|${geo.y}|${geo.l}|${geo.h}`
  const cleReglages = JSON.stringify(avant ? { ...REGLAGES_NEUTRES, cadre: reglages.cadre, marge: reglages.marge } : reglages)
  // Si le dernier rendu a été lent (téléphone, netteté, trame), on montre d'abord un aperçu à
  // demi-taille pendant qu'on glisse, et le vrai dès qu'on s'arrête.
  const dureeRef = useRef(0)
  useEffect(() => {
    if (!image) return
    let annule = false
    const r = JSON.parse(cleReglages)
    const base = taille => {
      const cle = `${cleGeo}|${taille}`
      if (!baseRef.current[cle]) {
        for (const k of Object.keys(baseRef.current)) if (!k.startsWith(`${cleGeo}|`)) { liberer(baseRef.current[k]); delete baseRef.current[k] }
        baseRef.current[cle] = rendreBase(image.toile, geo, taille, recadrer)
      }
      return baseRef.current[cle]
    }
    const peindre = (taille, complet) => {
      if (annule || !toileRef.current) return
      const t0 = performance.now()
      const plein = base(tailleApercu)
      const m = recadrer || !r.cadre ? 0 : Math.round(Math.max(plein.width, plein.height) * r.marge / 100)
      const rendu = rendre(image.toile, r, geo, { coteMax: taille, entier: recadrer, base: base(taille) })
      const cv = toileRef.current
      // la toile visible garde toujours la taille du rendu complet : pas de saut d'affichage
      if (cv.width !== plein.width + 2 * m) cv.width = plein.width + 2 * m
      if (cv.height !== plein.height + 2 * m) cv.height = plein.height + 2 * m
      const ctx = cv.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.clearRect(0, 0, cv.width, cv.height)          // une image transparente ne s'empile pas
      ctx.drawImage(rendu, 0, 0, cv.width, cv.height)
      liberer(rendu)
      if (complet) dureeRef.current = performance.now() - t0
    }
    // pas de requestAnimationFrame : il dort dans un onglet caché
    const ids = dureeRef.current > 60
      ? [setTimeout(() => peindre(Math.round(tailleApercu / 2), false), 0), setTimeout(() => peindre(tailleApercu, true), 220)]
      : [setTimeout(() => peindre(tailleApercu, true), 16)]
    return () => { annule = true; ids.forEach(clearTimeout) }
  }, [image, cleGeo, cleReglages, recadrer, tailleApercu]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── vignettes des filtres, avec les réglages en cours (un peu après le dernier geste)
  const cleVignettes = JSON.stringify({ ...reglages, filtre: '', cadre: '' }) + (recadrer ? '' : `${geo.x}|${geo.y}|${geo.l}|${geo.h}`) + `${geo.rotation}|${geo.miroir}`
  useEffect(() => {
    if (!image || onglet !== 'filtres') return
    const t = setTimeout(() => {
      const base = rendreBase(image.toile, geo, 120, false)
      const out = {}
      for (const [f] of FILTRES) {
        const cv = rendre(image.toile, { ...reglages, filtre: f, cadre: '' }, geo, { coteMax: 120, base })
        out[f] = cv.toDataURL('image/jpeg', 0.8)
        liberer(cv)
      }
      liberer(base)
      setVignettes(out)
    }, 250)
    return () => clearTimeout(t)
  }, [image, onglet, cleVignettes, reglages.ombre, reglages.clair]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── recadrage au doigt et à la souris
  function pointOriente(e) {
    const b = zoneRef.current.getBoundingClientRect()
    return { x: borne((e.clientX - b.left) / b.width, 0, 1) * W, y: borne((e.clientY - b.top) / b.height, 0, 1) * H }
  }
  function appuiCadre(e) {
    if (e.button > 0 || !image) return
    const p = pointOriente(e)
    const c = rectPx(geo, W, H)
    const quoi = e.target.dataset?.poignee || 'nouveau'
    let ancre = null, decalage = { x: 0, y: 0 }
    if (quoi === 'nouveau') ancre = p
    else if (quoi !== 'deplacer') {
      const est = quoi.includes('e'), sud = quoi.startsWith('s')
      ancre = { x: est ? c.x : c.x + c.l, y: sud ? c.y : c.y + c.h }
      decalage = { x: (est ? c.x + c.l : c.x) - p.x, y: (sud ? c.y + c.h : c.y) - p.y }
    }
    try { zoneRef.current.setPointerCapture(e.pointerId) } catch { /* pointeur déjà parti */ }
    prise.current = { id: e.pointerId, quoi, depart: p, c, ancre, decalage, bouge: false }
    e.preventDefault()
  }
  function glisseCadre(e) {
    const g = prise.current
    if (!g || g.id !== e.pointerId) return
    const p = pointOriente(e)
    if (!g.bouge && Math.hypot(p.x - g.depart.x, p.y - g.depart.y) < Math.max(W, H) * 0.01) return
    g.bouge = true
    let n
    if (g.quoi === 'deplacer') {
      n = { ...g.c, x: borne(g.c.x + p.x - g.depart.x, 0, W - g.c.l), y: borne(g.c.y + p.y - g.depart.y, 0, H - g.c.h) }
    } else {
      const mini = Math.max(8, Math.min(W, H) * 0.04)
      n = redimensionner(g.ancre.x, g.ancre.y, p.x + g.decalage.x, p.y + g.decalage.y, ratioEffectif(geo), W, H, mini)
    }
    setGeo(o => ({ ...o, x: n.x / W, y: n.y / H, l: n.l / W, h: n.h / H }))
  }
  function lacheCadre(e) {
    const g = prise.current
    if (!g || g.id !== e.pointerId) return
    prise.current = null
  }

  function tourner(sens) {                            // +1 : un quart de tour à droite, tel qu'on le voit
    setGeo(g => {
      const rotation = (g.rotation + (g.miroir ? -sens : sens) * 90 + 360) % 360
      const n = sens > 0 ? { x: 1 - g.y - g.h, y: g.x, l: g.h, h: g.l } : { x: g.y, y: 1 - g.x - g.l, l: g.h, h: g.l }
      const inverse = g.ratio !== 'libre' && g.ratio !== '1:1' ? !g.inverse : g.inverse
      return { ...g, rotation, ...n, inverse }
    })
  }
  function miroir() { setGeo(g => ({ ...g, miroir: !g.miroir, x: 1 - g.x - g.l })) }
  function choisirRatio(nom) {
    setGeo(g => {
      const r = RATIOS[nom]
      const c = rectPx(g, W, H)
      const enLargeur = c.l >= c.h
      const inverse = r ? (enLargeur ? r < 1 : r > 1) : false
      return ajusterRatio({ ...g, ratio: nom, inverse }, W, H)
    })
  }
  function retournerRatio() { setGeo(g => ajusterRatio({ ...g, inverse: !g.inverse }, W, H)) }
  function toutLeCadre() { setGeo(g => ({ ...g, ratio: 'libre', inverse: false, x: 0, y: 0, l: 1, h: 1 })) }

  function reinitialiser() { setBrouillon(b => ({ ...b, reglages: REGLAGES_NEUTRES, geometrie: GEO_NEUTRE })) }
  function recommencer() {
    effacerBrouillon()
    viderBases()
    setImage(ancienne => { if (ancienne) liberer(ancienne.toile); return null })
    setMessage(null); setVignettes({}); setOnglet('cadrer')
  }

  // ── avant / après : tant qu'on appuie
  const voirAvant = v => e => { if (v) e.preventDefault(); setAvant(v) }

  // ── dépôt
  async function valider() {
    if (!image || !onValider) return
    setEnvoi(true); setMessage(null)
    let toile = null
    try {
      toile = rendre(image.toile, reglages, geo, { coteMax: coteImageExport(reglages) })
      let sortie = await exporterToile(toile)
      if (sortie.blob.size > POIDS_STOCKAGE_MAX) sortie = await enJpeg(toile)
      const source = {
        version: 1, type: 'image',
        reglages: { ...reglages },
        recadrage: { x: geo.x, y: geo.y, l: geo.l, h: geo.h, rotation: geo.rotation, miroir: geo.miroir, ratio: libelleRatio(geo.ratio, geo.inverse) },
        original: { nom: image.nom, largeur: image.largeur, hauteur: image.hauteur },
      }
      await onValider({ blob: sortie.blob, type: sortie.type, largeur: sortie.largeur, hauteur: sortie.hauteur, source })
      recommencer()
    } catch (err) {
      setMessage({ type: 'err', msg: err?.message || 'L’image n’a pas pu partir.' })
    } finally {
      liberer(toile)
      setEnvoi(false)
    }
  }

  // ── glisser-déposer, partout sur l'atelier
  const depot = {
    onDragOver: e => { if ([...(e.dataTransfer?.types || [])].includes('Files')) { e.preventDefault(); setSurvol(true) } },
    onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setSurvol(false) },
    onDrop: e => { e.preventDefault(); setSurvol(false); charger(e.dataTransfer?.files?.[0]) },
  }
  const choisirFichier = e => { charger(e.target.files?.[0]); e.target.value = '' }

  // dimensions de l'œuvre exportée, pour le pied
  const dimensions = (() => {
    if (!image) return null
    const c = rectPx(geo, W, H)
    const k = Math.min(1, coteImageExport(reglages) / Math.max(c.l, c.h))
    let l = Math.round(c.l * k), h = Math.round(c.h * k)
    if (reglages.cadre) { const m = Math.round(Math.max(l, h) * reglages.marge / 100); l += 2 * m; h += 2 * m }
    const kk = Math.min(1, COTE_MAX / Math.max(l, h))
    return `${Math.round(l * kk)} × ${Math.round(h * kk)} px`
  })()

  const c = rectPx(geo, W, H)
  const ratio = ratioEffectif(geo)
  const placeCadre = { left: `${c.x / W * 100}%`, top: `${c.y / H * 100}%`, width: `${c.l / W * 100}%`, height: `${c.h / H * 100}%` }

  return (
    <div className={`retouche${survol ? ' survol' : ''}`} {...depot}>
      <Encart titre="Retoucher, un geste aussi vieux que la photo">
        <p>Dès les années 1850, les studios de portrait retouchent leurs négatifs sur verre, au crayon et au pinceau : on efface une ride, on adoucit une ombre.</p>
        <p>En 1857, Oscar Rejlander assemble une trentaine de négatifs pour composer une seule image, <em>Les Deux Voies de la vie</em> : le photomontage est né avant l’ordinateur.</p>
        <p>Vers 1900, les pictorialistes (en France, Robert Demachy ou Constant Puyo) floutent, grattent et retravaillent leurs tirages pour que la photographie soit regardée comme un art.</p>
      </Encart>

      <input ref={fichierRef} type="file" accept="image/*" hidden onChange={choisirFichier} />
      <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={choisirFichier} />

      {!image && (
        <div className="retouche-depot">
          <p className="retouche-depot-titre">Votre image</p>
          <p className="texte-aide">Une photo, un scan, une image faite ailleurs. Glissez-la ici, ou :</p>
          <div className="retouche-depot-boutons">
            <button type="button" className="btn btn-jaune" disabled={chargement} onClick={() => fichierRef.current?.click()}>Choisir une image</button>
            <button type="button" className="btn btn-outline retouche-photo" disabled={chargement} onClick={() => photoRef.current?.click()}>Prendre une photo</button>
          </div>
          <p className="caption-gris">JPEG, PNG, WebP ou GIF. Les très grandes photos sont réduites à 3000 px pour rester fluides.</p>
          {chargement && <p className="caption-gris" role="status">Ouverture de l’image…</p>}
          {brouillon.nom && !chargement && (
            <p className="caption-gris retouche-rappel">Vos réglages pour « {brouillon.nom} » sont gardés, mais pas l’image elle-même (elle est trop lourde pour être gardée dans le navigateur) : rechargez-la pour reprendre où vous en étiez.</p>
          )}
        </div>
      )}

      {image && (
        <>
          <div className="retouche-entete">
            <span className="caption-gris retouche-nom" title={image.nom}>{image.nom}</span>
            <div className="retouche-entete-actions">
              <button type="button" className="btn btn-outline btn-sm" disabled={chargement} onClick={() => fichierRef.current?.click()}>Changer d’image</button>
              <button type="button" className={`btn btn-sm retouche-avant${avant ? ' btn-noir' : ' btn-outline'}`}
                onPointerDown={voirAvant(true)} onPointerUp={voirAvant(false)} onPointerLeave={voirAvant(false)} onPointerCancel={voirAvant(false)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAvant(true) } }}
                onKeyUp={() => setAvant(false)} onBlur={() => setAvant(false)} onContextMenu={e => e.preventDefault()}
                title="Maintenez appuyé pour voir l’image sans les réglages">
                {avant ? 'Avant' : 'Avant / après'}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={reinitialiser}>Réinitialiser</button>
            </div>
          </div>

          <div ref={sceneRef} className="retouche-scene">
            <div className="retouche-toile">
              <canvas ref={toileRef} role="img" aria-label={recadrer ? 'Image entière, avec le cadre de recadrage' : 'Aperçu de l’œuvre telle qu’elle sera déposée'} />
              {recadrer && (
                <div ref={zoneRef} className="retouche-zone"
                  onPointerDown={appuiCadre} onPointerMove={glisseCadre} onPointerUp={lacheCadre} onPointerCancel={lacheCadre} onLostPointerCapture={lacheCadre}>
                  <div className="retouche-voile" aria-hidden="true"><div className="retouche-ombre" style={placeCadre} /></div>
                  <div className="retouche-cadre" data-poignee="deplacer" style={placeCadre}>
                    {['nw', 'ne', 'sw', 'se'].map(p => <span key={p} className={`retouche-poignee retouche-poignee-${p}`} data-poignee={p} aria-hidden="true" />)}
                  </div>
                </div>
              )}
            </div>
            {avant && <span className="retouche-etiquette-avant" aria-hidden="true">avant</span>}
          </div>

          <div className="retouche-onglets" role="tablist" aria-label="Retouche">
            {[['cadrer', 'Cadrer'], ['lumiere', 'Lumière'], ['filtres', 'Filtres'], ['bordure', 'Bordure']].map(([id, nom]) => (
              <button key={id} type="button" role="tab" aria-selected={onglet === id} className={`retouche-onglet${onglet === id ? ' actif' : ''}`} onClick={() => setOnglet(id)}>{nom}</button>
            ))}
          </div>

          <div className="retouche-panneau" role="tabpanel">
            {onglet === 'cadrer' && (
              <>
                <div className="retouche-ligne">
                  <span className="retouche-etiquette">format</span>
                  <div className="retouche-puces" role="group" aria-label="Proportions">
                    {Object.keys(RATIOS).map(nom => (
                      <button key={nom} type="button" className={`chip${geo.ratio === nom ? ' active' : ''}`} aria-pressed={geo.ratio === nom} onClick={() => choisirRatio(nom)}>
                        {geo.ratio === nom ? libelleRatio(nom, geo.inverse) : nom}
                      </button>
                    ))}
                    <button type="button" className="chip" disabled={!ratio || ratio === 1} onClick={retournerRatio} title="passer en hauteur ou en largeur">⇄ {ratio && ratio < 1 ? 'en largeur' : 'en hauteur'}</button>
                  </div>
                </div>
                <div className="retouche-ligne">
                  <span className="retouche-etiquette">tourner</span>
                  <div className="retouche-puces">
                    <button type="button" className="chip" onClick={() => tourner(-1)} aria-label="Un quart de tour à gauche">↺ quart de tour</button>
                    <button type="button" className="chip" onClick={() => tourner(1)} aria-label="Un quart de tour à droite">↻ quart de tour</button>
                    <button type="button" className={`chip${geo.miroir ? ' active' : ''}`} aria-pressed={geo.miroir} onClick={miroir}>⇋ miroir</button>
                    <button type="button" className="chip" onClick={toutLeCadre}>image entière</button>
                  </div>
                </div>
                <p className="caption-gris retouche-aide">Glissez le cadre pour le déplacer, tirez un coin pour l’agrandir. En dehors du cadre, tracez-en un nouveau. Les autres onglets montrent l’image recadrée, telle qu’elle partira.</p>
              </>
            )}

            {onglet === 'lumiere' && (
              <div className="retouche-curseurs">
                {CURSEURS.map(([k, nom, g, d]) => (
                  <Curseur key={k} nom={nom} valeur={reglages[k]} min={['vignettage', 'grain'].includes(k) ? 0 : -100} gauche={g} droite={d} onChange={v => setReglage(k, v)} />
                ))}
              </div>
            )}

            {onglet === 'filtres' && (
              <>
                <div className="retouche-filtres" role="group" aria-label="Filtres">
                  {FILTRES.map(([f, nom]) => (
                    <button key={f || 'aucun'} type="button" className={`retouche-filtre${reglages.filtre === f ? ' actif' : ''}`} aria-pressed={reglages.filtre === f} onClick={() => setReglage('filtre', f)}>
                      <span className="retouche-filtre-image">{vignettes[f] && <img src={vignettes[f]} alt="" />}</span>
                      <span className="retouche-filtre-nom">{nom}</span>
                    </button>
                  ))}
                </div>
                {reglages.filtre === 'bichro' && (
                  <div className="retouche-ligne">
                    <span className="retouche-etiquette">deux encres</span>
                    <div className="retouche-puces">
                      <label className="retouche-encre" title="la couleur des ombres">
                        <input type="color" value={reglages.ombre} onChange={e => setReglage('ombre', e.target.value)} aria-label="Couleur des ombres" />
                        <span>ombres</span>
                      </label>
                      <label className="retouche-encre" title="la couleur des lumières">
                        <input type="color" value={reglages.clair} onChange={e => setReglage('clair', e.target.value)} aria-label="Couleur des lumières" />
                        <span>lumières</span>
                      </label>
                      <button type="button" className="chip" onClick={() => setBrouillon(b => ({ ...b, reglages: { ...REGLAGES_NEUTRES, ...b.reglages, ombre: reglages.clair, clair: reglages.ombre } }))}>⇄ inverser</button>
                      {DUOS.map(([o, cl]) => (
                        <button key={o + cl} type="button" className="retouche-duo" style={{ background: `linear-gradient(135deg, ${o} 50%, ${cl} 50%)` }}
                          aria-label={`duo ${o} et ${cl}`} title="un duo tout prêt"
                          onClick={() => setBrouillon(b => ({ ...b, reglages: { ...REGLAGES_NEUTRES, ...b.reglages, ombre: o, clair: cl } }))} />
                      ))}
                    </div>
                  </div>
                )}
                <p className="caption-gris retouche-aide">Les filtres se combinent avec les réglages de l’onglet Lumière.</p>
              </>
            )}

            {onglet === 'bordure' && (
              <>
                <div className="retouche-ligne">
                  <span className="retouche-etiquette">passe-partout</span>
                  <div className="retouche-puces" role="group" aria-label="Passe-partout">
                    {[['', 'aucun'], ['blanc', 'blanc'], ['noir', 'noir']].map(([v, nom]) => (
                      <button key={v || 'aucun'} type="button" className={`chip${reglages.cadre === v ? ' active' : ''}`} aria-pressed={reglages.cadre === v} onClick={() => setReglage('cadre', v)}>{nom}</button>
                    ))}
                  </div>
                </div>
                {reglages.cadre && (
                  <div className="retouche-curseurs">
                    <Curseur nom="largeur de la marge" valeur={reglages.marge} min={2} max={20} neutre={6} suffixe=" %" onChange={v => setReglage('marge', v)} />
                  </div>
                )}
                <p className="caption-gris retouche-aide">Une marge tout autour, comme le carton d’un encadrement.</p>
              </>
            )}
          </div>
        </>
      )}

      {message && <p className={message.type === 'err' ? 'msg-err' : 'msg-ok'} role="status">{message.msg}</p>}

      <PiedAtelier onEffacer={image || brouillon.nom ? recommencer : null} onValider={valider} enCours={enCours || envoi}
        libelleValider={libelleValider} desactive={!image || !onValider} aide={dimensions} />
    </div>
  )
}
