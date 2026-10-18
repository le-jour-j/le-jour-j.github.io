import { useEffect, useReducer, useRef, useState } from 'react'
import { COUPURES, VALEURS_COUPURES, TONS, couleurTon } from '../lib/billet/coupures'
import { dessinerHabillage, dessinerTraits, chargerPolices, nouvelleGraine, numeroDepuisGraine } from '../lib/billet/habillage'
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

const r1 = x => Math.round(x * 10) / 10
const compterPoints = d => d.reduce((n, t) => n + (t.p?.length || 0), 0)

// ── effets de couleur et symétries (pupitre : effet(), symetriser())
const ARC = ['#ff2fb3', '#ff8a00', '#ffe600', '#33e07a', '#00c8ff', '#7a3cff']
const TONS_CYCLE = ['ton-vif', 'ton-voisin', 'ton-oppose', 'ton-voisin2', 'ton-fonce', 'ton-clair']

function appliquerEffet(entrees, effet) {
  if (!effet) return entrees
  const pal = effet === 'arc' ? ARC : TONS_CYCLE, out = []
  let k = Math.floor(Math.random() * pal.length)
  for (const e of entrees) {
    if (e.o === 'crayon' && e.p.length > 7) {
      for (let i = 0; i < e.p.length - 1; i += 6) out.push({ ...e, p: e.p.slice(i, i + 7), c: pal[k++ % pal.length], f: false })
    } else out.push({ ...e, c: pal[k++ % pal.length] })
  }
  return out
}

function symetriser(entrees, symetrie, coupure) {
  if (!symetrie) return entrees
  const { l, h } = COUPURES[coupure], cx = l / 2, cy = h / 2, out = [...entrees]
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

function lireBrouillon() {
  try {
    const b = JSON.parse(localStorage.getItem(CLE_BROUILLON) || 'null')
    if (b && COUPURES[b.coupure] && Array.isArray(b.dessin)) return b
  } catch { /* stockage indisponible : on part d'un billet blanc */ }
  return null
}

// Une toile à la taille affichée, en pixels réels de l'écran
function preparer(canvas, largeur, coupure) {
  const { l, h } = COUPURES[coupure], dpr = window.devicePixelRatio || 1
  const W = Math.max(1, Math.round(largeur * dpr)), H = Math.max(1, Math.round(W * h / l))
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)
  return { ctx, k: W / l, W, H }
}

export default function AtelierBillet({ onValider, enCours = false, libelleValider = '→ Émettre ce billet' }) {
  const [brouillon] = useState(lireBrouillon)
  const [coupure, setCoupure] = useState(brouillon?.coupure ?? 20)
  const [graine, setGraine] = useState(() => brouillon?.graine ?? nouvelleGraine())
  const [etat, dispatch] = useReducer(historique, null, () => ({ dessin: brouillon?.dessin ?? [], avant: [], apres: [] }))
  const [outil, setOutil] = useState('crayon')
  const [couleur, setCouleur] = useState('ton-fonce')
  const [epaisseur, setEpaisseur] = useState(0.6)
  const [opacite, setOpacite] = useState(1)
  const [rempli, setRempli] = useState(false)
  const [effet, setEffet] = useState('')
  const [symetrie, setSymetrie] = useState('')
  const [tampon, setTampon] = useState('⭐')
  const [tailleTampon, setTailleTampon] = useState(14)
  const [texte, setTexte] = useState('')
  const [corps, setCorps] = useState(9)
  const [polices, setPolices] = useState(false)
  const [largeur, setLargeur] = useState(0)
  const [message, setMessage] = useState(null)
  const [envoi, setEnvoi] = useState(false)

  const sceneRef = useRef(), fondRef = useRef(), dessinRef = useRef(), vifRef = useRef()
  const traitRef = useRef(null), gommeRef = useRef(null)
  const { dessin } = etat
  const numero = numeroDepuisGraine(graine)
  const { l, h } = COUPURES[coupure]

  // Les gestionnaires de pointeur lisent toujours les réglages du dernier rendu
  const r = useRef({})
  r.current = { coupure, dessin, outil, couleur, epaisseur, opacite, rempli, effet, symetrie, tampon, tailleTampon, texte, corps, largeur }

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

  // l'habillage, sous le dessin
  useEffect(() => {
    if (!largeur || !fondRef.current) return
    const { ctx, k } = preparer(fondRef.current, largeur, coupure)
    dessinerHabillage(ctx, { coupure, graine, numero, pxParMm: k })
  }, [coupure, graine, numero, largeur, polices])

  // le dessin posé
  useEffect(() => {
    if (!largeur || !dessinRef.current) return
    const { ctx, k } = preparer(dessinRef.current, largeur, coupure)
    dessinerTraits(ctx, dessin, { coupure, pxParMm: k })
  }, [dessin, coupure, largeur, polices])

  useEffect(() => { dessinerVif(null) }, [symetrie, outil, coupure, largeur])

  // le brouillon survit à une fermeture d'onglet
  useEffect(() => {
    try {
      if (dessin.length) localStorage.setItem(CLE_BROUILLON, JSON.stringify({ coupure, graine, dessin }))
      else localStorage.removeItem(CLE_BROUILLON)
    } catch { /* stockage plein ou bloqué : tant pis pour le brouillon */ }
  }, [dessin, coupure, graine])

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
  function dessinerVif(enCours) {
    const cv = vifRef.current, s = r.current
    if (!cv || !s.largeur) return
    const { ctx, k, W, H } = preparer(cv, s.largeur, s.coupure)
    if (s.symetrie && s.outil !== 'gomme') {
      const angles = s.symetrie === 'lr' ? [90] : s.symetrie === 'hb' ? [0] : s.symetrie === '4' ? [0, 90] : [0, 60, 120]
      ctx.save()
      ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(201,74,74,.6)'; ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of angles) {
        const a = d * Math.PI / 180, L = W + H
        ctx.moveTo(W / 2 - L * Math.cos(a), H / 2 - L * Math.sin(a))
        ctx.lineTo(W / 2 + L * Math.cos(a), H / 2 + L * Math.sin(a))
      }
      ctx.stroke(); ctx.restore()
    }
    if (!enCours) return
    const traits = enCours.o === 'spray'
      ? enCours.points.map(q => ({ o: 'crayon', p: [q], c: enCours.c, e: enCours.e, a: enCours.a }))
      : symetriser([enCours], s.symetrie, s.coupure)
    dessinerTraits(ctx, traits, { coupure: s.coupure, pxParMm: k })
  }

  function avertir(msg) { setMessage({ type: 'err', msg }) }

  // Tout ce qu'on pose passe par ici : effet de couleur, puis symétrie
  function poser(entrees) {
    const s = r.current
    const ajout = symetriser(appliquerEffet(entrees, s.effet), s.symetrie, s.coupure)
    if (compterPoints(s.dessin) + compterPoints(ajout) > MAX_POINTS) {
      avertir('Le billet est plein : 60 000 points au plus. Gommez un peu, ou émettez-le.')
      return
    }
    setMessage(null)
    dispatch({ type: 'poser', dessin: [...s.dessin, ...ajout] })
  }

  function versMm(e) {
    const rect = vifRef.current.getBoundingClientRect(), { l, h } = COUPURES[r.current.coupure]
    return { bx: (e.clientX - rect.left) / rect.width * l, by: h - (e.clientY - rect.top) / rect.height * h }
  }

  // La gomme efface le trait le plus proche (3,5 mm), et ceux qu'on survole en glissant
  function gommer(m) {
    const g = gommeRef.current
    let meilleur = -1, dist = 3.5
    g.dessin.forEach((t, i) => {
      for (const [x, y] of t.p) { const d = Math.hypot(x - m.bx, y - m.by); if (d < dist) { dist = d; meilleur = i } }
    })
    if (meilleur < 0) return
    if (!g.memorise) { dispatch({ type: 'memoriser' }); g.memorise = true }
    g.dessin.splice(meilleur, 1)
    dispatch({ type: 'remplacer', dessin: g.dessin.slice() })
  }

  function tamponner(m) {
    const s = r.current, S = s.tailleTampon
    const lignes = TAMPONS[s.tampon](), aplat = s.rempli && lignes.some(x => x.ferme)
    // rempli, la pupille de l'œil et le cœur des fleurs passent en blanc, sinon ils disparaissent dans l'aplat
    poser(lignes.map(x => ({
      o: 'crayon', p: x.pts.map(([px, py]) => [r1(m.bx + px * S / 2), r1(m.by + py * S / 2)]),
      c: x.point && aplat ? '#ffffff' : s.couleur, e: x.point ? r1(S * x.point) : s.epaisseur, a: s.opacite, f: s.rempli && !!x.ferme,
    })))
  }

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
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointeur déjà relâché */ }
    const s = r.current, m = versMm(e)
    if (s.outil === 'gomme') {
      gommeRef.current = { dessin: [...s.dessin], memorise: false }
      gommer(m)
    } else if (s.outil === 'tampon') {
      tamponner(m)
    } else if (s.outil === 'spray') {
      traitRef.current = { o: 'spray', points: [], c: s.couleur, e: r1(Math.max(0.2, s.epaisseur * 0.45)), a: s.opacite, r: Math.max(1.5, s.epaisseur * 3.5) }
      vaporiser(traitRef.current, m)
      dessinerVif(traitRef.current)
    } else if (s.outil === 'texte') {
      const t = s.texte.trim()
      if (!t) { avertir('Écrivez d’abord le texte, puis touchez le billet à l’endroit voulu.'); return }
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
    const t = traitRef.current
    if (gommeRef.current) { gommer(versMm(e)); return }
    if (!t) return
    const m = versMm(e)
    if (t.o === 'spray') vaporiser(t, m)
    else if (t.o === 'crayon') {
      const [x, y] = t.p[t.p.length - 1]
      if (Math.hypot(m.bx - x, m.by - y) > 0.35) t.p.push([r1(m.bx), r1(m.by)])
    } else t.p = [t.p[0], [r1(m.bx), r1(m.by)]]
    dessinerVif(t)
  }

  function lacher() {
    gommeRef.current = null
    const t = traitRef.current
    traitRef.current = null
    if (t) {
      if (t.o === 'spray') { if (t.points.length) poser(t.points.map(q => ({ o: 'crayon', p: [q], c: t.c, e: t.e, a: t.a }))) }
      else if (t.o === 'crayon' || t.p.length > 1) poser([t])
    }
    dessinerVif(null)
  }

  async function valider() {
    if (!onValider) return
    const d = dessin
    if (d.length < MIN_TRAITS) { avertir('Dessinez un peu plus : la banque n’émet pas de billet blanc.'); return }
    for (const t of d) {
      const refus = t.o === 'texte' && verifierTexte(t.t)
      if (refus) { avertir(refus); return }
    }
    setEnvoi(true); setMessage(null)
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

  const tonsPastilles = Object.keys(TONS).concat(['#1a1a1a', '#ffffff'])
  const couleurLibre = !tonsPastilles.includes(couleur)
  const avecTrait = !['gomme', 'texte'].includes(outil)

  return (
    <div className="atelier">
      <div className="atelier-entete">
        <div className="atelier-coupures" role="group" aria-label="Coupure">
          {VALEURS_COUPURES.map(v => (
            <button key={v} type="button" className={`chip${v === coupure ? ' active' : ''}`} onClick={() => setCoupure(v)}>{v} €</button>
          ))}
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setGraine(nouvelleGraine())}>↻ Autre habillage</button>
      </div>

      <div ref={sceneRef} className="atelier-scene" style={{ aspectRatio: `${l} / ${h}` }} data-outil={outil}>
        <canvas ref={fondRef} aria-hidden="true" />
        <canvas ref={dessinRef} aria-hidden="true" />
        <canvas ref={vifRef} className="atelier-vif" role="img" aria-label={`Billet de ${coupure} à dessiner`}
          onPointerDown={appui} onPointerMove={glisse} onPointerUp={lacher} onPointerCancel={lacher} />
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
          <div className="atelier-tons" role="group" aria-label="Couleur">
            {tonsPastilles.map(mot => (
              <button key={mot} type="button" className={`atelier-pastille${couleur === mot ? ' actif' : ''}`}
                style={{ background: couleurTon(mot, coupure) }} title={mot.startsWith('ton') ? `${mot} : suit la couleur du billet` : mot}
                aria-label={mot} onClick={() => setCouleur(mot)} />
            ))}
            <label className={`atelier-pastille atelier-pipette${couleurLibre ? ' actif' : ''}`} title="une couleur fixe">
              <input type="color" value={couleurLibre ? couleur : '#1a1a1a'} onChange={e => setCouleur(e.target.value)} aria-label="Couleur libre" />
            </label>
          </div>

          {avecTrait && (
            <label className="atelier-reglage">épaisseur
              <input type="range" min="0.1" max="6" step="0.1" value={epaisseur} onChange={e => setEpaisseur(Number(e.target.value))} />
            </label>
          )}
          <label className="atelier-reglage">opacité
            <input type="range" min="0.05" max="1" step="0.05" value={opacite} onChange={e => setOpacite(Number(e.target.value))} />
          </label>
          {['rect', 'ellipse', 'tampon'].includes(outil) && (
            <label className="atelier-reglage atelier-case">
              <input type="checkbox" checked={rempli} onChange={e => setRempli(e.target.checked)} /> rempli
            </label>
          )}
          {outil !== 'texte' && (
            <>
              <label className="atelier-reglage">effet
                <select value={effet} onChange={e => setEffet(e.target.value)}>
                  <option value="">normal</option>
                  <option value="arc">arc-en-ciel</option>
                  <option value="tons">tons du billet</option>
                </select>
              </label>
              <label className="atelier-reglage">symétrie
                <select value={symetrie} onChange={e => setSymetrie(e.target.value)}>
                  <option value="">aucune</option>
                  <option value="lr">gauche-droite</option>
                  <option value="hb">haut-bas</option>
                  <option value="4">quatre coins</option>
                  <option value="k6">kaléidoscope</option>
                </select>
              </label>
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
                <input type="text" value={texte} maxLength={80} placeholder="puis touchez le billet" onChange={e => setTexte(e.target.value)} />
              </label>
              <label className="atelier-reglage">corps
                <input type="number" min="3" max="90" value={corps} onChange={e => setCorps(e.target.value)} />
              </label>
            </>
          )}
        </div>
      )}
      {outil === 'gomme' && <p className="caption-gris atelier-aide">Touchez un trait pour l’effacer, ou glissez dessus.</p>}

      {message && <p className={message.type === 'err' ? 'msg-err' : 'msg-ok'} role="status">{message.msg}</p>}

      <div className="atelier-pied">
        <span className="caption-gris">n° BF-{coupure}-{numero} · {dessin.length} trait{dessin.length > 1 ? 's' : ''}</span>
        {onValider && (
          <button type="button" className="btn btn-jaune" disabled={enCours || envoi} onClick={valider}>
            {envoi ? 'Impression…' : libelleValider}
          </button>
        )}
      </div>
    </div>
  )
}
