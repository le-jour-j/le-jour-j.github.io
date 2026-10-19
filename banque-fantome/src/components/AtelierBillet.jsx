import { useEffect, useReducer, useRef, useState } from 'react'
import { COUPURES, VALEURS_COUPURES, TONS, couleurTon } from '../lib/billet/coupures'
import { dessinerHabillage, dessinerTraits, dessinerTraitsToile, tonRelatif, chargerPolices, nouvelleGraine, numeroDepuisGraine } from '../lib/billet/habillage'
import { verifierTexte } from '../lib/billet/motsRefuses'
import './AtelierBillet.css'

// L'atelier : le « Paint billet » du pupitre de la machine à bifton (pupitre.py, 2026-10-05),
// porté dans le site. On dessine sur un billet habillé ; l'habillage est figé, seule la
// graine change. Le dessin est une liste de traits au format --dessin de la machine
// (mm, origine en bas à gauche, y vers le haut) : un billet fait ici s'imprime là-bas.
// Tampons, aérographe, effets et symétries ne font qu'écrire des traits que la machine
// sait lire (crayon fermé et rempli, points isolés), comme dans le pupitre.

const CLE_BROUILLON = 'bf-atelier-brouillon'
const PX_PAR_MM_IMAGE = 8
const MAX_POINTS = 60000            // la limite de lire_dessin()
const MIN_TRAITS = 5

const OUTILS = [
  { id: 'crayon',  icone: '✏️', nom: 'crayon' },
  { id: 'trait',   icone: '╱',  nom: 'trait' },
  { id: 'rect',    icone: '▭',  nom: 'rectangle' },
  { id: 'ellipse', icone: '◯',  nom: 'ellipse' },
  { id: 'texte',   icone: 'T',  nom: 'texte' },
  { id: 'tampon',  icone: '🌟', nom: 'tampon' },
  { id: 'spray',   icone: '💨', nom: 'aérographe' },
  { id: 'gomme',   icone: '🧽', nom: 'gomme' },
]

// Des couleurs franches, en plus des tons qui suivent la couleur du billet (2026-10-19)
const PALETTE = ['#1a1a1a', '#ffffff', '#e63946', '#ff8a00', '#ffd400', '#33b24a', '#00a6e0', '#2b4bd6', '#8e44ad', '#ff5fa2', '#8b5a2b', '#8a8f94']
const TAILLES = [0.3, 0.8, 1.8, 4]       // épaisseurs en un geste : fin, moyen, gros, énorme (mm)
const GOMMES = [1.5, 3.5, 7]             // rayon de la gomme (mm)
const EFFETS = [['', 'normal'], ['arc', 'arc-en-ciel'], ['tons', 'tons du billet']]
const EFFETS_LIBRES = [['', 'normal'], ['arc', 'arc-en-ciel'], ['nuances', 'nuances']]
const SYMETRIES = [['', 'aucune'], ['lr', '↔ miroir'], ['hb', '↕ miroir'], ['4', 'quatre coins'], ['k6', 'kaléidoscope']]

const r1 = x => Math.round(x * 10) / 10
const compterPoints = d => d.reduce((n, t) => n + (t.p?.length || 0), 0)

// ── effets de couleur et symétries (pupitre : effet(), symetriser())
const ARC = ['#ff2fb3', '#ff8a00', '#ffe600', '#33e07a', '#00c8ff', '#7a3cff']
const TONS_CYCLE = ['ton-vif', 'ton-voisin', 'ton-oppose', 'ton-voisin2', 'ton-fonce', 'ton-clair']

// Sur toile libre, « nuances » remplace les tons du billet : le même cycle, calculé
// d'après la couleur choisie (2026-10-19)
const nuancesDe = couleur => TONS_CYCLE.map(mot => tonRelatif(mot, couleur))

function appliquerEffet(entrees, effet, couleur) {
  if (!effet) return entrees
  const pal = effet === 'arc' ? ARC : effet === 'nuances' ? nuancesDe(couleur) : TONS_CYCLE, out = []
  let k = Math.floor(Math.random() * pal.length)
  for (const e of entrees) {
    if (e.o === 'crayon' && e.p.length > 7) {
      for (let i = 0; i < e.p.length - 1; i += 6) out.push({ ...e, p: e.p.slice(i, i + 7), c: pal[k++ % pal.length], f: false })
    } else out.push({ ...e, c: pal[k++ % pal.length] })
  }
  return out
}

// Les miroirs prennent tout le billet ; le kaléidoscope tourne au milieu de la moitié droite,
// celle qui est libre : centré sur le billet, il recouvrait l'habillage (2026-10-19).
// Sur une toile libre, rien à épargner : il tourne au milieu de la toile.
function centreSymetrie(symetrie, { l, h }, libre) {
  return symetrie === 'k6' && !libre ? [l * 0.75, h / 2] : [l / 2, h / 2]
}

function symetriser(entrees, symetrie, dims, libre) {
  if (!symetrie) return entrees
  const [cx, cy] = centreSymetrie(symetrie, dims, libre), out = [...entrees]
  const map = (e, f) => ({ ...e, p: e.p.map(([x, y]) => f(x, y).map(r1)) })
  for (const e of entrees) {
    if (e.o === 'texte') continue
    if (symetrie === 'lr' || symetrie === '4') out.push(map(e, (x, y) => [2 * cx - x, y]))
    if (symetrie === 'hb' || symetrie === '4') out.push(map(e, (x, y) => [x, 2 * cy - y]))
    if (symetrie === '4') out.push(map(e, (x, y) => [2 * cx - x, 2 * cy - y]))
    if (symetrie === 'k6' && (e.o === 'crayon' || e.o === 'trait')) {
      for (let k = 1; k < 6; k++) {
        const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a)
        out.push(map(e, (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]))
      }
    }
  }
  return out
}

// Lissage léger d'un trait de crayon : la souris et le doigt tremblent un peu
function lisser(p) {
  if (p.length < 5) return p
  const out = [p[0]]
  for (let i = 1; i < p.length - 1; i++) {
    const [a, b, c] = [p[i - 1], p[i], p[i + 1]]
    out.push([r1((a[0] + 2 * b[0] + c[0]) / 4), r1((a[1] + 2 * b[1] + c[1]) / 4)])
  }
  out.push(p[p.length - 1])
  return out
}

// ── la gomme : ce que touche un disque de rayon R (mm) autour de m
function distSegment(x, y, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, n = dx * dx + dy * dy
  const t = n ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / n)) : 0
  return Math.hypot(x - ax - t * dx, y - ay - t * dy)
}
function dansPolygone(x, y, p) {
  let dedans = false
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dedans = !dedans
  }
  return dedans
}
function touche(t, m, R) {
  const p = t.p || [], marge = R + Number(t.e ?? 0.5) / 2
  if (!p.length) return false
  if (t.o === 'crayon' || t.o === 'trait') {
    if (p.length === 1) return Math.hypot(p[0][0] - m.bx, p[0][1] - m.by) < marge
    for (let i = 1; i < p.length; i++) if (distSegment(m.bx, m.by, p[i - 1], p[i]) < marge) return true
    return !!t.f && dansPolygone(m.bx, m.by, p)
  }
  if (t.o === 'rect' || t.o === 'ellipse') {
    const [[x1, y1], [x2, y2]] = [p[0], p[p.length - 1]]
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2 || 0.01, ry = Math.abs(y2 - y1) / 2 || 0.01
    if (t.o === 'rect') {
      const dx = Math.abs(m.bx - cx) - rx, dy = Math.abs(m.by - cy) - ry
      return t.f ? dx < R && dy < R : Math.max(dx, dy) < marge && Math.max(dx, dy) > -marge
    }
    const d = Math.hypot((m.bx - cx) / rx, (m.by - cy) / ry)
    return t.f ? d < 1 + R / Math.min(rx, ry) : Math.abs(d - 1) * Math.min(rx, ry) < marge
  }
  if (t.o === 'texte') {   // calé à gauche sur la ligne de base
    const corps = Number(t.s || 8) * 25.4 / 72, larg = (t.t || '').length * corps * 0.55
    return m.bx > p[0][0] - R && m.bx < p[0][0] + larg + R && m.by > p[0][1] - R && m.by < p[0][1] + corps + R
  }
  return false
}
// Un trait de crayon passé sous la gomme : on le resserre (pas de R/3), on retire les points
// couverts, et ce qui reste devient autant de morceaux.
function couper(t, m, R) {
  const dense = [t.p[0]]
  for (let i = 1; i < t.p.length; i++) {
    const [a, b] = [t.p[i - 1], t.p[i]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (R / 3))
    for (let k = 1; k <= n; k++) dense.push([r1(a[0] + (b[0] - a[0]) * k / n), r1(a[1] + (b[1] - a[1]) * k / n)])
  }
  const morceaux = []
  let cur = []
  for (const q of dense) {
    if (Math.hypot(q[0] - m.bx, q[1] - m.by) < R + Number(t.e ?? 0.5) / 2) { if (cur.length > 1) morceaux.push(cur); cur = [] }
    else cur.push(q)
  }
  if (cur.length > 1) morceaux.push(cur)
  return morceaux.map(q => ({ ...t, p: q }))
}

// ── les tampons : des formes en traits de crayon, repère -1..1, y vers le haut
const cercle = (r, n = 36, cx = 0, cy = 0) => Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(i / n * 2 * Math.PI), cy + r * Math.sin(i / n * 2 * Math.PI)])
const TAMPONS = {
  '⭐': () => [{ pts: Array.from({ length: 11 }, (_, i) => { const r = i % 2 ? 0.42 : 1, a = Math.PI / 2 + i * Math.PI / 5; return [r * Math.cos(a), r * Math.sin(a)] }), ferme: true }],
  '❤️': () => [{ pts: Array.from({ length: 49 }, (_, i) => { const t = i / 48 * 2 * Math.PI
    return [16 * Math.sin(t) ** 3 / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15] }), ferme: true }],
  '🌀': () => [{ pts: Array.from({ length: 90 }, (_, i) => { const t = i / 89 * 6 * Math.PI, r = t / (6 * Math.PI); return [r * Math.cos(t), r * Math.sin(t)] }) }],
  '☀️': () => [{ pts: cercle(0.45), ferme: true }].concat(Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6
    return { pts: [[0.6 * Math.cos(a), 0.6 * Math.sin(a)], [Math.cos(a), Math.sin(a)]] } })),
  '🌸': () => [{ pts: Array.from({ length: 101 }, (_, i) => { const t = i / 100 * 2 * Math.PI, r = 0.3 + 0.7 * Math.abs(Math.cos(2.5 * t)); return [r * Math.cos(t), r * Math.sin(t)] }), ferme: true },
    { pts: [[0, 0]], point: 0.25 }],
  '🙂': () => [{ pts: cercle(1) }, { pts: [[-0.35, 0.3]], point: 0.14 }, { pts: [[0.35, 0.3]], point: 0.14 },
    { pts: Array.from({ length: 15 }, (_, i) => { const a = (200 + i * 10) * Math.PI / 180; return [0.55 * Math.cos(a), 0.55 * Math.sin(a) - 0.05] }) }],
  '⚡': () => [{ pts: [[-0.1, 1], [-0.55, -0.05], [-0.05, -0.05], [-0.3, -1], [0.55, 0.2], [0.05, 0.2], [0.35, 1], [-0.1, 1]], ferme: true }],
  '👁': () => [{ pts: Array.from({ length: 21 }, (_, i) => { const x = -1 + i / 10; return [x, 0.5 * (1 - x * x)] })
    .concat(Array.from({ length: 21 }, (_, i) => { const x = 1 - i / 10; return [x, -0.5 * (1 - x * x)] })), ferme: true },
    { pts: [[0, 0]], point: 0.38 }],
  '✿': () => Array.from({ length: 6 }, (_, k) => ({ pts: cercle(0.38, 24, 0.55 * Math.cos(k * Math.PI / 3), 0.55 * Math.sin(k * Math.PI / 3)), ferme: true })).concat([{ pts: [[0, 0]], point: 0.3 }]),
  '♛': () => [{ pts: [[-1, -0.6], [-1, 0.5], [-0.5, 0], [0, 0.8], [0.5, 0], [1, 0.5], [1, -0.6], [-1, -0.6]], ferme: true }],
  // ajoutés le 2026-10-19
  '🌙': () => [{ pts: Array.from({ length: 31 }, (_, i) => { const a = (58.2 + i / 30 * 243.6) * Math.PI / 180; return [Math.cos(a), Math.sin(a)] })
    .concat(Array.from({ length: 21 }, (_, i) => { const a = (-88.1 - i / 20 * 183.8) * Math.PI / 180; return [0.5 + 0.85 * Math.cos(a), 0.85 * Math.sin(a)] })), ferme: true }],
  '🏠': () => [{ pts: [[-0.8, -1], [-0.8, 0.2], [0, 0.95], [0.8, 0.2], [0.8, -1], [-0.8, -1]], ferme: true },
    { pts: [[-0.22, -1], [-0.22, -0.35], [0.22, -0.35], [0.22, -1]] }, { pts: [[0.35, 0], [0.62, 0], [0.62, -0.25], [0.35, -0.25], [0.35, 0]] }],
  '🌳': () => [{ pts: [[-0.15, -1], [-0.15, -0.25], [0.15, -0.25], [0.15, -1], [-0.15, -1]], ferme: true },
    { pts: Array.from({ length: 61 }, (_, i) => { const t = i / 60 * 2 * Math.PI, r = 0.58 + 0.08 * Math.sin(7 * t); return [r * Math.cos(t), 0.32 + r * Math.sin(t)] }), ferme: true }],
  '🐟': () => [{ pts: Array.from({ length: 21 }, (_, i) => { const x = -0.75 + i * 0.07; return [x, 0.5 * Math.sqrt(Math.max(0, 1 - (x / 0.75) ** 2))] })
    .concat([[0.95, 0.45], [0.95, -0.45]])
    .concat(Array.from({ length: 21 }, (_, i) => { const x = 0.65 - i * 0.07; return [x, -0.5 * Math.sqrt(Math.max(0, 1 - (x / 0.75) ** 2))] })), ferme: true },
    { pts: [[-0.4, 0.12]], point: 0.13 }],
  '🎵': () => [{ pts: [[-0.5, -0.72]], point: 0.42 }, { pts: [[0.5, -0.52]], point: 0.42 },
    { pts: [[-0.3, -0.72], [-0.3, 0.8]] }, { pts: [[0.7, -0.52], [0.7, 1]] }, { pts: [[-0.3, 0.8], [0.7, 1]] }, { pts: [[-0.3, 0.6], [0.7, 0.8]] }],
  '◈': () => [{ pts: [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 1]] }, { pts: [[0, 0.45], [0.45, 0], [0, -0.45], [-0.45, 0], [0, 0.45]], ferme: true }],
}

// ── annuler / refaire : des photos du dessin
function historique(etat, action) {
  switch (action.type) {
    case 'poser': return { dessin: action.dessin, avant: [...etat.avant, etat.dessin].slice(-150), apres: [] }
    case 'memoriser': return { ...etat, avant: [...etat.avant, etat.dessin].slice(-150), apres: [] }
    case 'remplacer': return { ...etat, dessin: action.dessin }
    case 'annuler':
      if (!etat.avant.length) return etat
      return { dessin: etat.avant[etat.avant.length - 1], avant: etat.avant.slice(0, -1), apres: [...etat.apres, etat.dessin] }
    case 'refaire':
      if (!etat.apres.length) return etat
      return { dessin: etat.apres[etat.apres.length - 1], avant: [...etat.avant, etat.dessin], apres: etat.apres.slice(0, -1) }
    case 'vider': return { dessin: [], avant: [], apres: [] }
    default: return etat
  }
}

function lireBrouillon(support) {
  try {
    const b = JSON.parse(localStorage.getItem(support ? support.cleBrouillon : CLE_BROUILLON) || 'null')
    if (b && Array.isArray(b.dessin) && (support ? support.formats.some(f => f.id === b.format) : COUPURES[b.coupure])) return b
  } catch { /* stockage indisponible : on part d'un billet blanc */ }
  return null
}

// Les traits posés, sur le billet ou sur la toile libre
function peindre(ctx, traits, k, s) {
  if (s.libre) dessinerTraitsToile(ctx, traits, { l: s.dims.l, h: s.dims.h, pxParMm: k, fond: s.fond })
  else dessinerTraits(ctx, traits, { coupure: s.coupure, pxParMm: k })
}

// Fonds de la toile libre, et le contraste qui va avec (2026-10-19)
const FONDS_LIBRES = [['#ffffff', 'blanc'], ['#f3ead3', 'papier crème'], ['#1a1a1a', 'noir']]
const estSombre = hex => {
  const n = parseInt(String(hex).slice(1, 7), 16)
  if (Number.isNaN(n)) return false
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 < 0.45
}

// Une toile à la taille affichée, en pixels réels de l'écran
function preparer(canvas, largeur, { l, h }) {
  const dpr = window.devicePixelRatio || 1
  const W = Math.max(1, Math.round(largeur * dpr)), H = Math.max(1, Math.round(W * h / l))
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)
  return { ctx, k: W / l, W, H }
}

// Sans `support` : le billet, exactement comme avant (la bourse s'en sert, des brouillons existent).
// Avec `support` (2026-10-19) : une toile libre, sans coupure, sans habillage, sans numéro.
//   support = { formats: [{ id, nom, l, h }], cleBrouillon, fond }   (l, h en mm virtuels)
// et onValider reçoit alors { toile, format: { id, l, h }, fond, dessin, nbTraits },
// toile étant un canvas rendu à 8 px/mm, fond compris. AtelierPaint en fait une œuvre.
export default function AtelierBillet({ onValider, enCours = false, libelleValider = '→ Émettre ce billet', support = null }) {
  const libre = !!support
  const formats = support?.formats ?? []
  const [brouillon] = useState(() => lireBrouillon(support))
  const [coupure, setCoupure] = useState(brouillon?.coupure ?? 20)
  const [graine, setGraine] = useState(() => brouillon?.graine ?? nouvelleGraine())
  const [formatId, setFormatId] = useState(() => brouillon?.format ?? formats[0]?.id)
  const [fond, setFond] = useState(() => brouillon?.fond ?? support?.fond ?? '#ffffff')
  const [etat, dispatch] = useReducer(historique, null, () => ({ dessin: brouillon?.dessin ?? [], avant: [], apres: [] }))
  const [outil, setOutil] = useState('crayon')
  const [couleur, setCouleur] = useState(() => !libre ? 'ton-fonce' : estSombre(brouillon?.fond ?? support?.fond ?? '#ffffff') ? '#ffffff' : '#1a1a1a')
  const [epaisseur, setEpaisseur] = useState(0.6)
  const [opacite, setOpacite] = useState(1)
  const [rempli, setRempli] = useState(false)
  const [effet, setEffet] = useState('')
  const [symetrie, setSymetrie] = useState('')
  const [tampon, setTampon] = useState('⭐')
  const [tailleTampon, setTailleTampon] = useState(14)
  const [rayonGomme, setRayonGomme] = useState(3.5)
  const [gommeEntier, setGommeEntier] = useState(false)
  const [texte, setTexte] = useState('')
  const [corps, setCorps] = useState(9)
  const [polices, setPolices] = useState(false)
  const [largeur, setLargeur] = useState(0)
  const [message, setMessage] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [plein, setPlein] = useState(false)   // plein écran : sur téléphone, le billet est trop petit pour le doigt

  // En plein écran, la page derrière ne défile plus, et Échap referme
  useEffect(() => {
    if (!plein) return
    // atelier-plein-ouvert coupe l'animation d'entrée de la page : sa transformation retenait
    // l'atelier dans la page au lieu de le laisser couvrir l'écran
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('atelier-plein-ouvert')
    const echap = e => { if (e.key === 'Escape') setPlein(false) }
    window.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = avant
      document.body.classList.remove('atelier-plein-ouvert')
      window.removeEventListener('keydown', echap)
    }
  }, [plein])

  const sceneRef = useRef(), fondRef = useRef(), dessinRef = useRef(), vifRef = useRef()
  const traitRef = useRef(null), gommeRef = useRef(null)
  const pointeurRef = useRef(null)   // un seul doigt dessine : le deuxième (pincement, paume) est ignoré
  const { dessin } = etat
  const numero = numeroDepuisGraine(graine)
  const format = libre ? (formats.find(f => f.id === formatId) || formats[0]) : null
  const dims = libre ? { l: format.l, h: format.h } : COUPURES[coupure]
  const { l, h } = dims
  const nomSupport = libre ? 'la toile' : 'le billet'

  // Les gestionnaires de pointeur lisent toujours les réglages du dernier rendu
  const r = useRef({})
  r.current = { coupure, dims, libre, fond, dessin, outil, couleur, epaisseur, opacite, rempli, effet, symetrie, tampon, tailleTampon, texte, corps, largeur, rayonGomme, gommeEntier }

  useEffect(() => {
    let vivant = true
    chargerPolices().then(() => { if (vivant) setPolices(true) })
    return () => { vivant = false }
  }, [])

  useEffect(() => {
    const el = sceneRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setLargeur(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // l'habillage (ou le fond uni de la toile libre), sous le dessin
  useEffect(() => {
    if (!largeur || !fondRef.current) return
    const { ctx, k, W, H } = preparer(fondRef.current, largeur, { l, h })
    if (libre) { ctx.fillStyle = fond; ctx.fillRect(0, 0, W, H) }
    else dessinerHabillage(ctx, { coupure, graine, numero, pxParMm: k })
  }, [libre, fond, l, h, coupure, graine, numero, largeur, polices])

  // le dessin posé
  useEffect(() => {
    if (!largeur || !dessinRef.current) return
    const { ctx, k } = preparer(dessinRef.current, largeur, { l, h })
    peindre(ctx, dessin, k, r.current)
  }, [dessin, coupure, l, h, fond, largeur, polices])

  useEffect(() => { dessinerVif(null) }, [symetrie, outil, coupure, l, h, largeur, epaisseur, tailleTampon, tampon, rayonGomme])

  // le brouillon survit à une fermeture d'onglet
  const cleBrouillon = libre ? support.cleBrouillon : CLE_BROUILLON
  useEffect(() => {
    try {
      if (dessin.length) localStorage.setItem(cleBrouillon, JSON.stringify(libre ? { format: formatId, fond, dessin } : { coupure, graine, dessin }))
      else localStorage.removeItem(cleBrouillon)
    } catch { /* stockage plein ou bloqué : tant pis pour le brouillon */ }
  }, [dessin, coupure, graine, libre, formatId, fond, cleBrouillon])

  useEffect(() => {
    function touche(e) {
      const cible = e.target
      if (cible && (/INPUT|TEXTAREA|SELECT/.test(cible.tagName) || cible.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      if (k === 'z') { e.preventDefault(); dispatch({ type: e.shiftKey ? 'refaire' : 'annuler' }) }
      else if (k === 'y') { e.preventDefault(); dispatch({ type: 'refaire' }) }
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  // ── le calque vif : le trait en cours et les axes de symétrie
  // `curseur` (souris seulement) : l'aperçu du pinceau, de la gomme ou du tampon sous la pointe
  function dessinerVif(enCours, curseur = null) {
    const cv = vifRef.current, s = r.current
    if (!cv || !s.largeur) return
    const { ctx, k, W, H } = preparer(cv, s.largeur, s.dims)
    const hMm = s.dims.h
    if (s.symetrie && s.outil !== 'gomme') {
      const angles = s.symetrie === 'lr' ? [90] : s.symetrie === 'hb' ? [0] : s.symetrie === '4' ? [0, 90] : [0, 60, 120]
      const [cx, cy] = centreSymetrie(s.symetrie, s.dims, s.libre), X = cx * k, Y = (hMm - cy) * k
      ctx.save()
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(201,74,74,.6)'; ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of angles) {
        const a = d * Math.PI / 180, L = W + H
        ctx.moveTo(X - L * Math.cos(a), Y - L * Math.sin(a))
        ctx.lineTo(X + L * Math.cos(a), Y + L * Math.sin(a))
      }
      ctx.stroke(); ctx.restore()
    }
    if (curseur && !enCours) {
      if (s.outil === 'tampon') {
        ctx.save(); ctx.globalAlpha = 0.45
        peindre(ctx, symetriser(formeTampon(curseur, s), s.symetrie, s.dims, s.libre), k, s)
        ctx.restore()
      } else if (s.outil !== 'texte') {
        const rayon = s.outil === 'gomme' ? s.rayonGomme : s.outil === 'spray' ? Math.max(1.5, s.epaisseur * 3.5) : Math.max(s.epaisseur / 2, 0.4)
        ctx.save()
        ctx.beginPath(); ctx.arc(curseur.bx * k, (hMm - curseur.by) * k, rayon * k, 0, 2 * Math.PI)
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.stroke()
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(26,26,26,.85)'; ctx.stroke()
        ctx.restore()
      }
    }
    if (!enCours) return
    const traits = enCours.o === 'spray'
      ? enCours.points.map(q => ({ o: 'crayon', p: [q], c: enCours.c, e: enCours.e, a: enCours.a }))
      : symetriser([enCours], s.symetrie, s.dims, s.libre)
    peindre(ctx, traits, k, s)
  }

  function avertir(msg) { setMessage({ type: 'err', msg }) }

  // Tout ce qu'on pose passe par ici : effet de couleur, puis symétrie
  function poser(entrees) {
    const s = r.current
    const ajout = symetriser(appliquerEffet(entrees, s.effet, s.couleur), s.symetrie, s.dims, s.libre)
    if (compterPoints(s.dessin) + compterPoints(ajout) > MAX_POINTS) {
      avertir(s.libre ? 'La toile est pleine : 60 000 points au plus. Gommez un peu, ou déposez-la.'
        : 'Le billet est plein : 60 000 points au plus. Gommez un peu, ou déposez-le.')
      return
    }
    setMessage(null)
    dispatch({ type: 'poser', dessin: [...s.dessin, ...ajout] })
  }

  function versMm(e) {
    const rect = vifRef.current.getBoundingClientRect(), { l, h } = r.current.dims
    return { bx: (e.clientX - rect.left) / rect.width * l, by: h - (e.clientY - rect.top) / rect.height * h }
  }

  // La gomme efface ce qu'elle touche. Par morceaux (défaut, 2026-10-19) : un trait de crayon est
  // coupé sous la gomme, comme dans un vrai Paint ; les formes, tampons pleins et textes partent
  // en entier. En mode « trait entier », tout trait touché part, comme avant.
  function gommer(m) {
    const g = gommeRef.current, { rayonGomme: R, gommeEntier } = r.current
    let change = false
    const out = []
    for (const t of g.dessin) {
      if (!touche(t, m, R)) { out.push(t); continue }
      change = true
      if (!gommeEntier && t.o === 'crayon' && !t.f && t.p.length > 1) out.push(...couper(t, m, R))
    }
    if (!change) return
    if (!g.memorise) { dispatch({ type: 'memoriser' }); g.memorise = true }
    g.dessin = out
    dispatch({ type: 'remplacer', dessin: out })
  }

  function formeTampon(m, s) {
    const S = s.tailleTampon
    const lignes = TAMPONS[s.tampon](), aplat = s.rempli && lignes.some(x => x.ferme)
    // rempli, la pupille de l'œil et le cœur des fleurs passent en blanc, sinon ils disparaissent dans l'aplat
    return lignes.map(x => ({
      o: 'crayon', p: x.pts.map(([px, py]) => [r1(m.bx + px * S / 2), r1(m.by + py * S / 2)]),
      c: x.point && aplat ? '#ffffff' : s.couleur, e: x.point ? r1(S * x.point) : s.epaisseur, a: s.opacite, f: s.rempli && !!x.ferme,
    }))
  }

  function tamponner(m) { poser(formeTampon(m, r.current)) }

  function vaporiser(t, m) {
    if (t.points.length > 1500) return
    for (let i = 0; i < 7; i++) {
      const an = Math.random() * 2 * Math.PI, rr = t.r * Math.sqrt(Math.random())
      t.points.push([r1(m.bx + rr * Math.cos(an)), r1(m.by + rr * Math.sin(an))])
    }
  }

  function appui(e) {
    if (!largeur) return
    e.preventDefault()
    if (pointeurRef.current !== null && pointeurRef.current !== e.pointerId) return
    pointeurRef.current = e.pointerId
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointeur déjà relâché */ }
    const s = r.current, m = versMm(e)
    if (s.outil === 'gomme') {
      gommeRef.current = { dessin: [...s.dessin], memorise: false, dernier: m }
      gommer(m)
    } else if (s.outil === 'tampon') {
      tamponner(m)
    } else if (s.outil === 'spray') {
      traitRef.current = { o: 'spray', points: [], c: s.couleur, e: r1(Math.max(0.2, s.epaisseur * 0.45)), a: s.opacite, r: Math.max(1.5, s.epaisseur * 3.5) }
      vaporiser(traitRef.current, m)
      dessinerVif(traitRef.current)
    } else if (s.outil === 'texte') {
      const t = s.texte.trim()
      if (!t) { avertir(`Écrivez d’abord le texte, puis touchez ${s.libre ? 'la toile' : 'le billet'} à l’endroit voulu.`); return }
      const refus = verifierTexte(t)
      if (refus) { avertir(refus); return }
      poser([{ o: 'texte', p: [[r1(m.bx), r1(m.by)]], t, s: Number(s.corps) || 9, c: s.couleur, a: s.opacite, g: true }])
    } else {
      traitRef.current = { o: s.outil, p: [[r1(m.bx), r1(m.by)]], c: s.couleur, e: s.epaisseur, a: s.opacite,
        f: s.rempli && (s.outil === 'rect' || s.outil === 'ellipse') }
      dessinerVif(traitRef.current)
    }
  }

  function glisse(e) {
    const t = traitRef.current, m = versMm(e)
    if (pointeurRef.current === null) {    // rien d'appuyé : l'aperçu suit la souris
      if (e.pointerType === 'mouse') dessinerVif(null, m)
      return
    }
    if (e.pointerId !== pointeurRef.current) return
    if (gommeRef.current) {
      // un geste rapide saute plusieurs millimètres : on gomme tout le chemin, pas seulement l'arrivée
      const g = gommeRef.current, a = g.dernier || m, R = r.current.rayonGomme
      const n = Math.max(1, Math.ceil(Math.hypot(m.bx - a.bx, m.by - a.by) / (R / 2)))
      for (let i = 1; i <= n; i++) gommer({ bx: a.bx + (m.bx - a.bx) * i / n, by: a.by + (m.by - a.by) * i / n })
      g.dernier = m
      dessinerVif(null, e.pointerType === 'mouse' ? m : null)
      return
    }
    if (!t) return
    if (t.o === 'spray') vaporiser(t, m)
    else if (t.o === 'crayon') {
      const [x, y] = t.p[t.p.length - 1]
      if (Math.hypot(m.bx - x, m.by - y) > 0.35) t.p.push([r1(m.bx), r1(m.by)])
    } else {
      // Maj : trait à 45°, carré, cercle
      let [bx, by] = [m.bx, m.by]
      const [x0, y0] = t.p[0], dx = bx - x0, dy = by - y0
      if (e.shiftKey && t.o === 'trait') {
        const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI / 4, d = Math.hypot(dx, dy)
        bx = x0 + d * Math.cos(a); by = y0 + d * Math.sin(a)
      } else if (e.shiftKey) {
        const c = Math.max(Math.abs(dx), Math.abs(dy))
        bx = x0 + Math.sign(dx || 1) * c; by = y0 + Math.sign(dy || 1) * c
      }
      t.p = [t.p[0], [r1(bx), r1(by)]]
    }
    dessinerVif(t)
  }

  function lacher(e) {
    if (e && pointeurRef.current !== null && e.pointerId !== pointeurRef.current) return
    pointeurRef.current = null
    gommeRef.current = null
    const t = traitRef.current
    traitRef.current = null
    if (t) {
      if (t.o === 'spray') { if (t.points.length) poser(t.points.map(q => ({ o: 'crayon', p: [q], c: t.c, e: t.e, a: t.a }))) }
      else if (t.o === 'crayon') poser([{ ...t, p: lisser(t.p) }])
      else if (t.p.length > 1) poser([t])
    }
    dessinerVif(null)
  }

  async function valider() {
    if (!onValider) return
    const d = dessin
    if (d.length < MIN_TRAITS) {
      avertir(libre ? 'Dessinez un peu plus : cinq traits au moins avant de déposer.' : 'Dessinez un peu plus : la banque n’émet pas de billet blanc.')
      return
    }
    for (const t of d) {
      const refus = t.o === 'texte' && verifierTexte(t.t)
      if (refus) { avertir(refus); return }
    }
    setEnvoi(true); setMessage(null)
    if (libre) {
      // la toile libre : le fond uni, puis les traits, à 8 px/mm comme le billet
      try {
        await chargerPolices()
        const toile = document.createElement('canvas')
        toile.width = Math.round(l * PX_PAR_MM_IMAGE); toile.height = Math.round(h * PX_PAR_MM_IMAGE)
        const ctx = toile.getContext('2d')
        ctx.fillStyle = fond; ctx.fillRect(0, 0, toile.width, toile.height)
        dessinerTraitsToile(ctx, d, { l, h, pxParMm: PX_PAR_MM_IMAGE, fond })
        await onValider({ toile, format: { id: format.id, l, h }, fond, dessin: d, nbTraits: d.length })
        try { localStorage.removeItem(cleBrouillon) } catch { /* rien à effacer */ }
        dispatch({ type: 'vider' })
      } catch (err) {
        avertir(err?.message || 'L’œuvre n’a pas pu partir. Votre dessin est gardé.')
      } finally {
        setEnvoi(false)
      }
      return
    }
    try {
      await chargerPolices()
      const cv = document.createElement('canvas')
      cv.width = l * PX_PAR_MM_IMAGE; cv.height = h * PX_PAR_MM_IMAGE
      const ctx = cv.getContext('2d')
      dessinerHabillage(ctx, { coupure, graine, numero, pxParMm: PX_PAR_MM_IMAGE })
      dessinerTraits(ctx, d, { coupure, pxParMm: PX_PAR_MM_IMAGE })
      // Safari ne sait pas écrire de WebP : il rend un PNG, et type le dit
      const blob = await new Promise(res => cv.toBlob(res, 'image/webp', 0.9))
      if (!blob) throw new Error('Le billet n’a pas pu être mis en image.')
      const trace = { version: 1, coupure, graine, numero, dessin: d }
      await onValider({ blob, type: blob.type, coupure, graine, numero, trace, nbTraits: d.length })
      try { localStorage.removeItem(CLE_BROUILLON) } catch { /* rien à effacer */ }
      dispatch({ type: 'vider' })
      setGraine(nouvelleGraine())
    } catch (err) {
      avertir(err?.message || 'Le billet n’a pas pu partir.')
    } finally {
      setEnvoi(false)
    }
  }

  const tonsPastilles = Object.keys(TONS)
  const couleurLibre = !tonsPastilles.includes(couleur) && !PALETTE.includes(couleur)
  const avecTrait = !['gomme', 'texte'].includes(outil)
  const fondsLibres = FONDS_LIBRES.map(([c]) => c)
  const fondPerso = libre && !fondsLibres.includes(fond)

  // Un fond sombre sous un trait noir, ou l'inverse : on retourne l'encre pour qu'on la voie
  function choisirFond(c) {
    setFond(c)
    if (estSombre(c) && couleur === '#1a1a1a') setCouleur('#ffffff')
    else if (!estSombre(c) && couleur === '#ffffff') setCouleur('#1a1a1a')
  }

  return (
    <div className={`atelier${plein ? ' plein' : ''}`}>
      <div className="atelier-entete">
        {libre ? (
          <div className="atelier-coupures" role="group" aria-label="Format de la toile">
            {formats.map(f => (
              <button key={f.id} type="button" className={`chip${f.id === format.id ? ' active' : ''}`} aria-pressed={f.id === format.id}
                title={`${f.l} × ${f.h}`} onClick={() => setFormatId(f.id)}>{f.nom}</button>
            ))}
          </div>
        ) : (
          <div className="atelier-coupures" role="group" aria-label="Coupure">
            {VALEURS_COUPURES.map(v => (
              <button key={v} type="button" className={`chip${v === coupure ? ' active' : ''}`} onClick={() => setCoupure(v)}>{v} €</button>
            ))}
          </div>
        )}
        <div className="atelier-entete-actions">
          {libre ? (
            <div className="atelier-fonds" role="group" aria-label="Fond de la toile">
              <span className="atelier-etiquette">fond</span>
              {FONDS_LIBRES.map(([c, nom]) => (
                <button key={c} type="button" className={`atelier-pastille${fond === c ? ' actif' : ''}`} style={{ background: c }}
                  title={nom} aria-label={`fond ${nom}`} aria-pressed={fond === c} onClick={() => choisirFond(c)} />
              ))}
              <label className={`atelier-pastille atelier-pipette${fondPerso ? ' actif' : ''}`} title="fond de n'importe quelle couleur">
                <input type="color" value={fondPerso ? fond : '#5f8fc0'} onChange={e => choisirFond(e.target.value)} aria-label="Fond de couleur libre" />
              </label>
            </div>
          ) : (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setGraine(nouvelleGraine())}>↻ Autre habillage</button>
          )}
          <button type="button" className={`btn btn-sm ${plein ? 'btn-noir' : 'btn-jaune'}`} onClick={() => setPlein(v => !v)}>{plein ? '✕ Fermer' : '⤢ Plein écran'}</button>
        </div>
      </div>
      {plein && (!libre || l > h) && <p className="caption-gris atelier-astuce">Sur téléphone, tournez-le à l’horizontale : {libre ? 'la toile est plus grande' : 'le billet est plus grand'}.</p>}

      <div ref={sceneRef} className={`atelier-scene${libre ? ' libre' : ''}`} style={{ aspectRatio: `${l} / ${h}`, '--ratio': l / h }} data-outil={outil}>
        <canvas ref={fondRef} aria-hidden="true" />
        <canvas ref={dessinRef} aria-hidden="true" />
        <canvas ref={vifRef} className="atelier-vif" role="img" aria-label={libre ? `Toile ${format.nom} à dessiner` : `Billet de ${coupure} à dessiner`}
          onPointerDown={appui} onPointerMove={glisse} onPointerUp={lacher} onPointerCancel={lacher}
          onPointerLeave={() => { if (pointeurRef.current === null) dessinerVif(null) }} />
      </div>

      <div className="atelier-outils" role="toolbar" aria-label="Outils de dessin">
        {OUTILS.map(o => (
          <button key={o.id} type="button" className={`atelier-outil${outil === o.id ? ' actif' : ''}`} aria-pressed={outil === o.id}
            title={o.nom} onClick={() => setOutil(o.id)}>
            <span aria-hidden="true">{o.icone}</span><span className="atelier-outil-nom">{o.nom}</span>
          </button>
        ))}
        <span className="atelier-sep" />
        <button type="button" className="atelier-outil" title="annuler (Ctrl+Z)" disabled={!etat.avant.length} onClick={() => dispatch({ type: 'annuler' })}>
          <span aria-hidden="true">↶</span><span className="atelier-outil-nom">annuler</span>
        </button>
        <button type="button" className="atelier-outil" title="refaire (Ctrl+Y)" disabled={!etat.apres.length} onClick={() => dispatch({ type: 'refaire' })}>
          <span aria-hidden="true">↷</span><span className="atelier-outil-nom">refaire</span>
        </button>
        <button type="button" className="atelier-outil" title="effacer tout le dessin (annulable)" disabled={!dessin.length} onClick={() => dispatch({ type: 'poser', dessin: [] })}>
          <span aria-hidden="true">🗑</span><span className="atelier-outil-nom">tout effacer</span>
        </button>
      </div>

      {outil !== 'gomme' && (
        <div className="atelier-pinceau">
          {!libre && (
            <div className="atelier-ligne">
              <span className="atelier-etiquette">billet</span>
              <div className="atelier-tons" role="group" aria-label="Couleurs du billet">
                {tonsPastilles.map(mot => (
                  <button key={mot} type="button" className={`atelier-pastille${couleur === mot ? ' actif' : ''}`}
                    style={{ background: couleurTon(mot, coupure) }} title={`${mot} : suit la couleur du billet`}
                    aria-label={mot} onClick={() => setCouleur(mot)} />
                ))}
              </div>
            </div>
          )}
          <div className="atelier-ligne">
            <span className="atelier-etiquette">couleurs</span>
            <div className="atelier-tons" role="group" aria-label="Couleurs">
              {PALETTE.map(c => (
                <button key={c} type="button" className={`atelier-pastille${couleur === c ? ' actif' : ''}`}
                  style={{ background: c }} title={c} aria-label={c} onClick={() => setCouleur(c)} />
              ))}
              <label className={`atelier-pastille atelier-pipette${couleurLibre ? ' actif' : ''}`} title="n'importe quelle couleur">
                <input type="color" value={couleurLibre ? couleur : '#1a1a1a'} onChange={e => setCouleur(e.target.value)} aria-label="Couleur libre" />
              </label>
            </div>
          </div>

          {avecTrait && (
            <div className="atelier-ligne">
              <span className="atelier-etiquette">épaisseur</span>
              <div className="atelier-puces" role="group" aria-label="Épaisseur">
                {TAILLES.map(t => (
                  <button key={t} type="button" className={`atelier-taille${Math.abs(epaisseur - t) < 0.05 ? ' actif' : ''}`} title={`${t} mm`} aria-label={`${t} mm`} onClick={() => setEpaisseur(t)}>
                    <span style={{ width: 4 + t * 4, height: 4 + t * 4 }} />
                  </button>
                ))}
              </div>
              <input className="atelier-curseur" type="range" min="0.1" max="6" step="0.1" value={epaisseur} onChange={e => setEpaisseur(Number(e.target.value))} aria-label="épaisseur fine" />
            </div>
          )}
          <label className="atelier-reglage">opacité
            <input type="range" min="0.05" max="1" step="0.05" value={opacite} onChange={e => setOpacite(Number(e.target.value))} />
          </label>
          {['rect', 'ellipse', 'tampon'].includes(outil) && (
            <button type="button" className={`chip${rempli ? ' active' : ''}`} aria-pressed={rempli} onClick={() => setRempli(v => !v)}>{rempli ? '■ rempli' : '□ contour'}</button>
          )}
          {outil !== 'texte' && (
            <>
              <div className="atelier-ligne">
                <span className="atelier-etiquette">effet</span>
                <div className="atelier-puces" role="group" aria-label="Effet">
                  {(libre ? EFFETS_LIBRES : EFFETS).map(([v, nom]) => <button key={v} type="button" className={`chip${effet === v ? ' active' : ''}`} aria-pressed={effet === v} onClick={() => setEffet(v)}>{nom}</button>)}
                </div>
              </div>
              <div className="atelier-ligne">
                <span className="atelier-etiquette">symétrie</span>
                <div className="atelier-puces" role="group" aria-label="Symétrie">
                  {SYMETRIES.map(([v, nom]) => <button key={v} type="button" className={`chip${symetrie === v ? ' active' : ''}`} aria-pressed={symetrie === v} onClick={() => setSymetrie(v)}>{nom}</button>)}
                </div>
              </div>
            </>
          )}
          {outil === 'tampon' && (
            <>
              <div className="atelier-tampons" role="group" aria-label="Tampon">
                {Object.keys(TAMPONS).map(t => (
                  <button key={t} type="button" className={`atelier-tampon${tampon === t ? ' actif' : ''}`} onClick={() => setTampon(t)}>{t}</button>
                ))}
              </div>
              <label className="atelier-reglage">taille
                <input type="range" min="3" max="60" step="1" value={tailleTampon} onChange={e => setTailleTampon(Number(e.target.value))} />
              </label>
            </>
          )}
          {outil === 'texte' && (
            <>
              <label className="atelier-reglage atelier-texte">texte
                <input type="text" value={texte} maxLength={80} placeholder={`puis touchez ${nomSupport}`} onChange={e => setTexte(e.target.value)} />
              </label>
              <label className="atelier-reglage">corps
                <input type="number" min="3" max="90" value={corps} onChange={e => setCorps(e.target.value)} />
              </label>
            </>
          )}
        </div>
      )}
      {outil === 'gomme' && (
        <div className="atelier-pinceau">
          <div className="atelier-ligne">
            <span className="atelier-etiquette">gomme</span>
            <div className="atelier-puces" role="group" aria-label="Taille de la gomme">
              {GOMMES.map((g, i) => (
                <button key={g} type="button" className={`atelier-taille${rayonGomme === g ? ' actif' : ''}`} aria-label={['petite', 'moyenne', 'grosse'][i]} title={['petite', 'moyenne', 'grosse'][i]} onClick={() => setRayonGomme(g)}>
                  <span style={{ width: 6 + g * 3, height: 6 + g * 3 }} />
                </button>
              ))}
            </div>
          </div>
          <div className="atelier-puces" role="group" aria-label="Ce que la gomme efface">
            <button type="button" className={`chip${!gommeEntier ? ' active' : ''}`} onClick={() => setGommeEntier(false)}>par morceaux</button>
            <button type="button" className={`chip${gommeEntier ? ' active' : ''}`} onClick={() => setGommeEntier(true)}>trait entier</button>
          </div>
          <p className="caption-gris atelier-aide">Glissez sur le dessin pour l’effacer. {libre ? 'Le fond ne s’efface pas.' : 'L’habillage du billet ne s’efface pas.'}</p>
        </div>
      )}

      {message && <p className={message.type === 'err' ? 'msg-err' : 'msg-ok'} role="status">{message.msg}</p>}

      <div className="atelier-pied">
        <span className="caption-gris">{libre ? `${format.nom} · ${l} × ${h}` : `n° BF-${coupure}-${numero}`} · {dessin.length} trait{dessin.length > 1 ? 's' : ''}</span>
        {onValider && (
          <button type="button" className="btn btn-jaune" disabled={enCours || envoi} onClick={valider}>
            {envoi ? (libre ? 'Dépôt en cours…' : 'Impression…') : libelleValider}
          </button>
        )}
      </div>
    </div>
  )
}
