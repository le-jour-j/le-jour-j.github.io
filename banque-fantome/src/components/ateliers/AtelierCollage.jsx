import { useEffect, useMemo, useRef, useState } from 'react'
import { COTE_MAX, exporterToile, useBrouillon, Encart, PiedAtelier } from './commun'
import { verifierTexte } from '../../lib/billet/motsRefuses'
import './collage.css'

// L'atelier Collage (2026-10-19) : une page sur laquelle on pose des images (fichier ou réserve
// de la banque), des mots découpés, des formes et un fond de papier. Tout est décrit en
// « unités de page » (le grand côté fait 1200) ; la même fonction dessine l'aperçu et l'œuvre
// exportée, seule l'échelle change : ce qu'on voit est ce qui part.
//
//   <AtelierCollage onValider={…} enCours={bool} libelleValider="…" reserve={[url, …]} />
//
//   • reserve (facultatif) : des images en plus de celles de la banque (les œuvres de la
//     collection), en URL, ou en objets { url, vignette?, nom? }.

const CLE_BROUILLON = 'bf-atelier-collage-brouillon'
const FORMATS = {
  carre:    { nom: 'carré',    icone: '◻', l: 1200, h: 1200 },
  portrait: { nom: 'portrait', icone: '▯', l: 900,  h: 1200 },
  paysage:  { nom: 'paysage',  icone: '▭', l: 1200, h: 900 },
}
const MIN_ELEMENTS = 2
const MAX_ELEMENTS = 80
const MAX_HISTOIRE = 100          // pas d'annulation gardés
const COTE_FICHIER = 1600         // px, le grand côté d'une image téléversée
const MIN_COTE = 14               // unités de page, le plus petit morceau
const GRAINE_FOND = 1912          // le grain du papier de fond ne change pas d'une fois à l'autre
const INITIAL = { version: 1, format: 'portrait', fond: 'creme', elements: [] }

// La réserve de la banque : des planches de billets de Jiiji, servies par le site
const BASE = import.meta.env.BASE_URL || '/banque-fantome/'
const PLANCHES = ['5euros-A4-01', '10euros-A4-05', '20euros-A4-07', '20euros-A4-25', '50euros-A4-09',
  '50euros-A4-24', '100euros-A4-11', '100euros-A4-22', '200euros-A4-05', '500euros-A4-04']
  .map(n => ({
    url: `${BASE}planches/apercus/planche-${n}.jpg`,
    vignette: `${BASE}planches/apercus/planche-${n}-vignette.jpg`,
    nom: `planche de ${n.split('euros')[0]} €`,
  }))

// Le vocabulaire des mots au hasard : la banque, l'argent, la valeur, le rêve
const MOTS = ['valeur', 'crédit', 'dette', 'rêve', 'fortune', 'monnaie', 'billet', 'épargne', 'intérêt',
  'échange', 'trésor', 'promesse', 'confiance', 'solde', 'coffre-fort', 'guichet', 'reçu', 'gage',
  'rente', 'salaire', 'pourboire', 'faillite', 'emprunt', 'caution', 'signature', 'au porteur', 'à vue',
  'sans valeur', 'valeur faciale', 'cours forcé', 'fonds perdus', 'bon pour', 'reste à payer',
  'argent de poche', 'krach', 'bulle', 'lingot', 'pièce', 'sou', 'centime', 'gratuit', 'offert',
  'enchère', 'troc', 'don', 'partage', 'richesse', 'abondance', 'manque', 'désir', 'chance', 'mirage',
  'fantôme', 'songe', 'utopie', 'avenir', 'or', 'papier', 'encre', 'compte', 'conte', 'escompte',
  'change', 'hausse', 'baisse', 'tout doit disparaître', 'payable', 'créance', 'espèces', 'liquide']

const POLICES = {
  affiche:  { nom: 'affiche',    famille: '"Bebas Neue", Impact, sans-serif', style: '', maj: true },
  titre:    { nom: 'gros titre', famille: 'Impact, "Arial Black", "DM Sans", sans-serif', style: '900' },
  journal:  { nom: 'journal',    famille: 'Georgia, "Times New Roman", serif', style: '700' },
  italique: { nom: 'italique',   famille: 'Georgia, "Times New Roman", serif', style: 'italic' },
  machine:  { nom: 'machine',    famille: '"Space Mono", "Courier New", monospace', style: '700' },
  moderne:  { nom: 'moderne',    famille: '"DM Sans", sans-serif', style: '700' },
}

// Les papiers : fonds de page, remplissage des formes, étiquettes des mots
const PAPIERS = {
  creme:     { nom: 'crème',     teinte: '#f3ead3' },
  kraft:     { nom: 'kraft',     teinte: '#c9a273' },
  journal:   { nom: 'journal',   teinte: '#ebe6d8' },
  ligne:     { nom: 'ligné',     teinte: '#fbfaf3' },
  quadrille: { nom: 'quadrillé', teinte: '#fbfaf3' },
}
const PAPIERS_MOTS = {
  journal: { nom: 'journal', teinte: '#ebe5d3' },
  blanc:   { nom: 'blanc',   teinte: '#fffdf7' },
  jaune:   { nom: 'jaune',   teinte: '#f5e27a' },
  rose:    { nom: 'rose',    teinte: '#f6c1cf' },
  bleu:    { nom: 'bleu',    teinte: '#bfe0f2' },
  kraft:   { nom: 'kraft',   teinte: '#c9a273' },
  noir:    { nom: 'noir',    teinte: '#1a1a1a' },
}
const PALETTE = ['#1a1a1a', '#fffdf7', '#e63946', '#ff8a00', '#ffd400', '#33b24a', '#00a6e0', '#2b4bd6', '#8e44ad', '#ff5fa2', '#8b5a2b', '#8a8f94']

const FORMES = [
  { id: 'rect',     icone: '■', nom: 'carré' },
  { id: 'cercle',   icone: '●', nom: 'rond' },
  { id: 'triangle', icone: '▲', nom: 'triangle' },
  { id: 'etoile',   icone: '★', nom: 'étoile' },
  { id: 'feuille',  icone: '❦', nom: 'feuille' },
  { id: 'dechire',  icone: '≋', nom: 'déchiré' },
]
const CISEAUX = [
  { id: 'rect',    icone: '▭', nom: 'droit' },
  { id: 'cercle',  icone: '◯', nom: 'rond' },
  { id: 'dechire', icone: '≈', nom: 'déchiré' },
  { id: 'dentele', icone: '⋀', nom: 'dentelé' },
  { id: 'libre',   icone: '✎', nom: 'libre' },
]

// ── petits outils
const r2 = x => Math.round(x * 100) / 100
const r4 = x => Math.round(x * 10000) / 10000
const borne = (x, a, b) => Math.min(b, Math.max(a, x))
const nouvelleGraine = () => Math.floor(Math.random() * 1e9) + 1
const nouvelId = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const auHasard = liste => liste[Math.floor(Math.random() * liste.length)]

// Un hasard qui se rejoue : le même bord déchiré à l'écran et dans l'œuvre exportée
function hasard(graine) {
  let a = (graine >>> 0) || 1
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function sombre(hex) {
  const n = parseInt(String(hex).slice(1), 16)
  if (Number.isNaN(n)) return false
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5
}

let promessePolices = null
function chargerPolices() {
  if (!promessePolices) {
    const charge = document.fonts
      ? Promise.all(['40px "Bebas Neue"', '700 40px "Space Mono"', '700 40px "DM Sans"'].map(f => document.fonts.load(f).catch(() => null)))
      : Promise.resolve()
    promessePolices = Promise.race([charge, new Promise(res => setTimeout(res, 3000))]).then(() => true)
  }
  return promessePolices
}

// ── les contours, dans le repère de l'élément (centre en 0, 0)
function bordDechire(w, h, graine) {
  const rnd = hasard(graine), amp = Math.min(w, h) * 0.045, pas = Math.max(3, Math.min(w, h) / 40), pts = []
  let d = amp / 2
  const cote = (x0, y0, x1, y1, nx, ny) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / pas))
    for (let i = 0; i < n; i++) {
      d = borne(d + (rnd() - 0.5) * amp * 0.9, 0, amp)   // marche au hasard : un bord de papier arraché
      const t = i / n
      pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d])
    }
  }
  cote(-w / 2, -h / 2, w / 2, -h / 2, 0, 1)
  cote(w / 2, -h / 2, w / 2, h / 2, -1, 0)
  cote(w / 2, h / 2, -w / 2, h / 2, 0, -1)
  cote(-w / 2, h / 2, -w / 2, -h / 2, 1, 0)
  return pts
}

function bordDentele(w, h) {
  const dent = Math.max(4, Math.min(w, h) / 28), pts = []
  const cote = (x0, y0, x1, y1, nx, ny) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / dent))
    for (let i = 0; i < n; i++) {
      const t = i / n, t2 = (i + 0.5) / n
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t])
      pts.push([x0 + (x1 - x0) * t2 + nx * dent * 0.6, y0 + (y1 - y0) * t2 + ny * dent * 0.6])
    }
  }
  cote(-w / 2, -h / 2, w / 2, -h / 2, 0, 1)
  cote(w / 2, -h / 2, w / 2, h / 2, -1, 0)
  cote(w / 2, h / 2, -w / 2, h / 2, 0, -1)
  cote(-w / 2, h / 2, -w / 2, -h / 2, 1, 0)
  return pts
}

function chemin(forme, w, h, graine, poly) {
  const p = new Path2D()
  const polygone = pts => { pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath() }
  switch (forme) {
    case 'cercle': p.ellipse(0, 0, w / 2, h / 2, 0, 0, 2 * Math.PI); break
    case 'dechire': polygone(bordDechire(w, h, graine)); break
    case 'dentele': polygone(bordDentele(w, h)); break
    case 'libre':
      if (poly?.length > 2) polygone(poly.map(([u, v]) => [(u - 0.5) * w, (v - 0.5) * h]))
      else p.rect(-w / 2, -h / 2, w, h)
      break
    case 'triangle': polygone([[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]); break
    case 'etoile': polygone(Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1
      return [Math.cos(a) * r * w / 2, Math.sin(a) * r * h / 2 + h * 0.05]
    })); break
    case 'feuille':   // une amande pointue aux deux bouts
      p.moveTo(0, -h / 2)
      p.bezierCurveTo(w * 0.66, -h * 0.22, w * 0.66, h * 0.22, 0, h / 2)
      p.bezierCurveTo(-w * 0.66, h * 0.22, -w * 0.66, -h * 0.22, 0, -h / 2)
      p.closePath()
      break
    default: p.rect(-w / 2, -h / 2, w, h)
  }
  return p
}

// Une étiquette coupée aux ciseaux, un peu de travers
function cheminMot(w, h, graine) {
  const rnd = hasard(graine), j = () => (rnd() - 0.5) * h * 0.12, p = new Path2D()
  p.moveTo(-w / 2 + j(), -h / 2 + j())
  p.lineTo(w / 2 + j(), -h / 2 + j())
  p.lineTo(w / 2 + j(), h / 2 + j())
  p.lineTo(-w / 2 + j(), h / 2 + j())
  p.closePath()
  return p
}

// ── les papiers, en unités de page
function dessinerPapier(ctx, papier, x, y, w, h, graine) {
  const rnd = hasard(graine)
  ctx.fillStyle = (PAPIERS[papier] || PAPIERS.creme).teinte
  ctx.fillRect(x, y, w, h)
  ctx.save()
  if (papier === 'creme') {
    ctx.fillStyle = 'rgba(120,90,40,.13)'
    const n = Math.min(1500, w * h / 600)
    for (let i = 0; i < n; i++) { const s = 1 + rnd() * 1.6; ctx.fillRect(x + rnd() * w, y + rnd() * h, s, s) }
  } else if (papier === 'kraft') {
    const n = Math.min(2200, w * h / 330), fonce = new Path2D(), clair = new Path2D()
    for (let i = 0; i < n; i++) {
      const px = x + rnd() * w, py = y + rnd() * h, a = (rnd() - 0.5) * 0.8, L = 4 + rnd() * 12
      const cible = i % 2 ? fonce : clair
      cible.moveTo(px, py); cible.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L)
    }
    ctx.lineWidth = 0.9
    ctx.strokeStyle = 'rgba(90,60,25,.22)'; ctx.stroke(fonce)
    ctx.strokeStyle = 'rgba(255,240,210,.22)'; ctx.stroke(clair)
  } else if (papier === 'ligne') {
    ctx.strokeStyle = '#a9c9e8'; ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let yy = y + 60; yy < y + h; yy += 34) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy) }
    ctx.stroke()
    ctx.strokeStyle = '#e39a9a'; ctx.lineWidth = 1.6
    const mx = x + Math.min(90, w * 0.12)
    ctx.beginPath(); ctx.moveTo(mx, y); ctx.lineTo(mx, y + h); ctx.stroke()
  } else if (papier === 'quadrille') {
    ctx.strokeStyle = '#bdd5ec'; ctx.lineWidth = 0.9
    ctx.beginPath()
    for (let xx = x + 11; xx < x + w; xx += 22) { ctx.moveTo(xx, y); ctx.lineTo(xx, y + h) }
    for (let yy = y + 11; yy < y + h; yy += 22) { ctx.moveTo(x, yy); ctx.lineTo(x + w, yy) }
    ctx.stroke()
  } else if (papier === 'journal') {
    // des colonnes de texte gris, vues de loin : on ne peut rien y lire
    const m = 28, gout = 18
    let haut = y + m
    if (h > 220 && w > 220) {
      ctx.fillStyle = 'rgba(30,30,30,.72)'
      ctx.fillRect(x + m, haut, (w - 2 * m) * (0.55 + rnd() * 0.3), 30)
      haut += 52
    }
    const cols = Math.max(1, Math.round((w - 2 * m) / 250)), cw = (w - 2 * m - (cols - 1) * gout) / cols
    ctx.fillStyle = 'rgba(60,60,60,.36)'
    for (let c = 0; c < cols; c++) {
      const cx = x + m + c * (cw + gout)
      for (let yy = haut; yy < y + h - m; yy += 13) {
        const r = rnd()
        if (r < 0.06) continue                                   // un saut de paragraphe
        ctx.fillRect(cx, yy, r < 0.18 ? cw * (0.3 + rnd() * 0.6) : cw, 5.5)
      }
    }
  }
  ctx.restore()
}

// ── le rendu : une seule fonction pour l'aperçu et pour l'œuvre
function dessinerElement(ctx, el, k, images) {
  const { w, h } = el
  ctx.save()
  ctx.translate(el.x, el.y)
  ctx.rotate(el.r * Math.PI / 180)
  const p = el.type === 'mot' ? cheminMot(w, h, el.graine) : chemin(el.forme, w, h, el.graine, el.poly)
  let teinte = '#ffffff'
  if (el.type === 'mot') teinte = (PAPIERS_MOTS[el.papier] || PAPIERS_MOTS.journal).teinte
  else if (el.type === 'forme') teinte = el.remplissage?.startsWith('#') ? el.remplissage : (PAPIERS[el.remplissage] || PAPIERS.creme).teinte
  if (el.ombre) {
    // le papier collé : une ombre douce, la lumière vient d'en haut à gauche.
    // L'ombre d'un canvas ne suit pas l'échelle : on la règle en pixels, d'après k.
    ctx.save()
    ctx.shadowColor = 'rgba(26,20,10,.4)'
    ctx.shadowBlur = 9 * k
    ctx.shadowOffsetX = 3 * k
    ctx.shadowOffsetY = 5 * k
    ctx.fillStyle = teinte
    ctx.fill(p)
    ctx.restore()
  }
  ctx.save()
  ctx.clip(p)
  if (el.type === 'image') {
    const ent = images.get(el.origine === 'fichier' ? el.cle : el.url)
    if (ent?.ok) {
      const iw = ent.el.naturalWidth || ent.el.width, ih = ent.el.naturalHeight || ent.el.height
      const [u0, v0, u1, v1] = el.crop
      ctx.drawImage(ent.el, u0 * iw, v0 * ih, (u1 - u0) * iw, (v1 - v0) * ih, -w / 2, -h / 2, w, h)
    } else {
      // seulement à l'écran : l'export refuse une image absente
      ctx.fillStyle = '#e4ddca'; ctx.fillRect(-w / 2, -h / 2, w, h)
      ctx.strokeStyle = 'rgba(26,26,26,.18)'; ctx.lineWidth = 3
      ctx.beginPath()
      for (let d = -w - h; d < w + h; d += 18) { ctx.moveTo(-w / 2 + d, -h / 2); ctx.lineTo(-w / 2 + d + h, h / 2) }
      ctx.stroke()
      ctx.fillStyle = '#4c463d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.font = `700 ${Math.max(10, Math.min(w, h) * 0.09)}px "DM Sans", sans-serif`
      const msg = el.origine === 'fichier' ? 'image à remettre' : ent?.erreur ? 'image introuvable' : 'chargement…'
      ctx.fillText(msg, 0, 0, w * 0.9)
    }
  } else if (el.type === 'mot') {
    const pap = PAPIERS_MOTS[el.papier] || PAPIERS_MOTS.journal, pol = POLICES[el.police] || POLICES.journal
    ctx.fillStyle = pap.teinte; ctx.fillRect(-w / 2 - h, -h / 2 - h, w + 2 * h, 3 * h)
    if (el.papier === 'journal') {
      // les jambages des lignes voisines, coupés par les ciseaux
      const rnd = hasard(el.graine + 7)
      ctx.fillStyle = 'rgba(60,60,60,.28)'
      for (let x = -w / 2; x < w / 2; x += h * (0.18 + rnd() * 0.3)) {
        if (rnd() < 0.5) ctx.fillRect(x, -h / 2 - h * 0.02, h * (0.06 + rnd() * 0.08), h * 0.09)
        if (rnd() < 0.5) ctx.fillRect(x, h / 2 - h * 0.07, h * (0.06 + rnd() * 0.08), h * 0.09)
      }
    }
    const fs = h * 0.62, pad = h * 0.28
    ctx.font = `${pol.style} ${fs}px ${pol.famille}`
    ctx.fillStyle = el.couleur || '#1a1a1a'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(pol.maj ? el.texte.toUpperCase() : el.texte, 0, h * 0.04, Math.max(1, w - 2 * pad))
  } else {
    if (el.remplissage?.startsWith('#')) { ctx.fillStyle = el.remplissage; ctx.fillRect(-w / 2, -h / 2, w, h) }
    else dessinerPapier(ctx, el.remplissage, -w / 2, -h / 2, w, h, el.graine)
  }
  ctx.restore()
  ctx.restore()
}

function dessinerFond(ctx, fond, PW, PH) {
  if (String(fond).startsWith('#')) { ctx.fillStyle = fond; ctx.fillRect(0, 0, PW, PH) }
  else dessinerPapier(ctx, fond, 0, 0, PW, PH, GRAINE_FOND)
}

// k : pixels par unité de page. cacheFond (aperçu seulement) garde le papier déjà dessiné.
function rendrePage(ctx, compo, k, images, cacheFond = null) {
  const { l: PW, h: PH } = FORMATS[compo.format]
  if (cacheFond) {
    const W = ctx.canvas.width, H = ctx.canvas.height, cle = `${compo.fond}|${compo.format}|${W}|${H}`
    if (cacheFond.current?.cle !== cle) {
      const cv = document.createElement('canvas')
      cv.width = W; cv.height = H
      const c2 = cv.getContext('2d')
      c2.scale(k, k)
      dessinerFond(c2, compo.fond, PW, PH)
      cacheFond.current = { cle, cv }
    }
    ctx.drawImage(cacheFond.current.cv, 0, 0)
  }
  ctx.save()
  ctx.scale(k, k)
  if (!cacheFond) dessinerFond(ctx, compo.fond, PW, PH)
  for (const el of compo.elements) dessinerElement(ctx, el, k, images)
  ctx.restore()
}

// ── le modèle
const ctxMesure = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
function largeurMot(texte, police, h) {
  const pol = POLICES[police] || POLICES.journal
  ctxMesure.font = `${pol.style} ${h * 0.62}px ${pol.famille}`
  return ctxMesure.measureText(pol.maj ? texte.toUpperCase() : texte).width + 2 * h * 0.28
}

const fini = x => typeof x === 'number' && Number.isFinite(x)
function elementValide(e) {
  if (!e || typeof e !== 'object' || !e.id || ![e.x, e.y, e.w, e.h, e.r].every(fini) || e.w <= 0 || e.h <= 0) return false
  if (e.type === 'image') return Array.isArray(e.crop) && e.crop.length === 4 && e.crop.every(fini) && (e.origine === 'fichier' ? !!e.cle : typeof e.url === 'string')
  if (e.type === 'mot') return typeof e.texte === 'string' && !!e.texte
  return e.type === 'forme'
}
// Un brouillon abîmé (ou d'une autre version) ne doit pas casser l'atelier
function nettoyer(c) {
  const ok = c && FORMATS[c.format] && typeof c.fond === 'string' && Array.isArray(c.elements) && c.elements.every(elementValide)
  if (ok) return c
  return {
    ...INITIAL,
    format: FORMATS[c?.format] ? c.format : INITIAL.format,
    fond: typeof c?.fond === 'string' ? c.fond : INITIAL.fond,
    elements: Array.isArray(c?.elements) ? c.elements.filter(elementValide) : [],
  }
}

function versLocal(el, [x, y]) {
  const a = -el.r * Math.PI / 180, dx = x - el.x, dy = y - el.y
  return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]
}
function versPage(el, [lx, ly]) {
  const a = el.r * Math.PI / 180
  return [el.x + lx * Math.cos(a) - ly * Math.sin(a), el.y + lx * Math.sin(a) + ly * Math.cos(a)]
}
// Tourner, c'est aussi s'arrêter net sur l'horizontale et la verticale
function aimanter(r) {
  let a = ((r % 360) + 540) % 360 - 180
  const q = Math.round(a / 90) * 90
  if (Math.abs(a - q) < 4) a = q
  return r2(a)
}

// Ce qui part dans `source` : la place de chaque chose, jamais les images téléversées
function versSource(el) {
  const { cle, ...reste } = el
  const out = { ...reste, x: r2(el.x), y: r2(el.y), w: r2(el.w), h: r2(el.h), r: r2(el.r) }
  if (el.crop) out.crop = el.crop.map(r4)
  if (el.poly) out.poly = el.poly.map(([u, v]) => [r4(u), r4(v)])
  return out
}

async function lireFichier(fichier) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(fichier.type)) throw new Error(`« ${fichier.name} » n’est pas une image JPEG, PNG, WebP ou GIF.`)
  if (fichier.size > 40e6) throw new Error(`« ${fichier.name} » est trop lourde (40 Mo au plus).`)
  const url = URL.createObjectURL(fichier)
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = () => rej(new Error(`« ${fichier.name} » ne s’ouvre pas comme une image.`))
      i.src = url
    })
    const k = Math.min(1, COTE_FICHIER / Math.max(img.naturalWidth, img.naturalHeight))
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.round(img.naturalWidth * k)); cv.height = Math.max(1, Math.round(img.naturalHeight * k))
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
    return cv
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function AtelierCollage({ onValider, enCours = false, libelleValider = '→ Déposer dans ma collection', reserve }) {
  const [brut, setBrut, effacerBrouillon] = useBrouillon(CLE_BROUILLON, INITIAL)
  const compo = useMemo(() => nettoyer(brut), [brut])
  const compoRef = useRef(compo)
  compoRef.current = compo
  const { l: PW, h: PH } = FORMATS[compo.format]

  const [selId, setSelId] = useState(null)
  const [panneau, setPanneau] = useState('images')
  const [ciseaux, setCiseaux] = useState('rect')
  const [reglageMot, setReglageMot] = useState({ police: 'affiche', papier: 'journal', couleur: '#1a1a1a' })
  const [remplissage, setRemplissage] = useState('#2b4bd6')
  const [saisie, setSaisie] = useState('')
  const [largeur, setLargeur] = useState(0)
  const [versionImages, setVersionImages] = useState(0)
  const [polices, setPolices] = useState(false)
  const [message, setMessage] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const [plein, setPlein] = useState(false)
  const [trace, setTrace] = useState(null)       // l'aperçu du coup de ciseaux en cours
  const [, setTic] = useState(0)

  const sceneRef = useRef(), zoneRef = useRef(), toileRef = useRef()
  const fichierRef = useRef(), remettreRef = useRef()
  const imagesRef = useRef(new Map())            // url ou clé → { el, ok, erreur } ; les fichiers ne vivent qu'ici
  const cacheFond = useRef(null)
  const pileRef = useRef({ avant: [], apres: [] })
  const pointeursRef = useRef(new Map())
  const gesteRef = useRef(null)

  const sel = compo.elements.find(e => e.id === selId) || null
  const etatRef = useRef({})
  etatRef.current = { sel, panneau, ciseaux }

  const collection = useMemo(() => (Array.isArray(reserve) ? reserve : [])
    .map(r => (typeof r === 'string' ? { url: r, vignette: r, nom: 'œuvre de la collection' } : r && { url: r.url, vignette: r.vignette || r.url, nom: r.nom || 'œuvre de la collection' }))
    .filter(r => r?.url), [reserve])

  // ── composition et historique
  function majCompo(f) {
    const n = f(compoRef.current)
    compoRef.current = n
    setBrut(n)
  }
  function memoriser() {
    const p = pileRef.current
    pileRef.current = { avant: [...p.avant, compoRef.current].slice(-MAX_HISTOIRE), apres: [] }
    setTic(t => t + 1)
  }
  function poser(f) { memoriser(); majCompo(f) }
  function annuler() {
    const p = pileRef.current
    if (!p.avant.length) return
    const prec = p.avant[p.avant.length - 1]
    pileRef.current = { avant: p.avant.slice(0, -1), apres: [...p.apres, compoRef.current] }
    majCompo(() => prec); setTic(t => t + 1)
  }
  function retablir() {
    const p = pileRef.current
    if (!p.apres.length) return
    const suiv = p.apres[p.apres.length - 1]
    pileRef.current = { avant: [...p.avant, compoRef.current], apres: p.apres.slice(0, -1) }
    majCompo(() => suiv); setTic(t => t + 1)
  }
  const majElement = (id, f) => c => ({ ...c, elements: c.elements.map(e => (e.id === id ? f(e) : e)) })
  function modifierSel(champs) { if (sel) poser(majElement(sel.id, e => ({ ...e, ...champs }))) }

  function avertir(msg) { setMessage({ type: 'err', msg }) }

  // ── les images
  function chargerImage(url) {
    const m = imagesRef.current
    if (m.has(url)) return m.get(url).promesse
    const img = new Image()
    img.crossOrigin = 'anonymous'   // une image de collection peut venir du stockage : le canvas doit rester lisible
    img.decoding = 'async'
    const ent = { el: img, ok: false, erreur: false }
    ent.promesse = new Promise(res => {
      img.onload = () => { ent.ok = true; setVersionImages(v => v + 1); res(ent) }
      img.onerror = () => { ent.erreur = true; setVersionImages(v => v + 1); res(ent) }
    })
    m.set(url, ent)
    img.src = url
    return ent.promesse
  }

  useEffect(() => {
    for (const e of compo.elements) if (e.type === 'image' && e.origine !== 'fichier') chargerImage(e.url)
  }, [compo.elements]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // l'aperçu, redessiné à chaque changement (une fois par image d'écran au plus)
  useEffect(() => {
    if (!largeur || !toileRef.current) return
    const id = requestAnimationFrame(() => {
      const cv = toileRef.current
      if (!cv) return
      const dpr = window.devicePixelRatio || 1
      const W = Math.max(1, Math.round(largeur * dpr)), H = Math.max(1, Math.round(W * PH / PW))
      if (cv.width !== W) cv.width = W
      if (cv.height !== H) cv.height = H
      const ctx = cv.getContext('2d')
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      rendrePage(ctx, compo, W / PW, imagesRef.current, cacheFond)
    })
    return () => cancelAnimationFrame(id)
  }, [compo, largeur, versionImages, polices, PW, PH])

  // plein écran : la page derrière ne défile plus, Échap referme
  useEffect(() => {
    if (!plein) return
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('collage-plein-ouvert')
    const echap = e => { if (e.key === 'Escape') setPlein(false) }
    window.addEventListener('keydown', echap)
    return () => {
      document.body.style.overflow = avant
      document.body.classList.remove('collage-plein-ouvert')
      window.removeEventListener('keydown', echap)
    }
  }, [plein])

  // clavier : annuler, rétablir, supprimer
  useEffect(() => {
    function clavier(e) {
      const cible = e.target
      if (cible && (/INPUT|TEXTAREA|SELECT/.test(cible.tagName) || cible.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (e.ctrlKey || e.metaKey) {
        if (k === 'z') { e.preventDefault(); e.shiftKey ? retablir() : annuler() }
        else if (k === 'y') { e.preventDefault(); retablir() }
        else if (k === 'd' && etatRef.current.sel) { e.preventDefault(); dupliquer() }
      } else if ((k === 'delete' || k === 'backspace') && etatRef.current.sel) {
        e.preventDefault(); supprimer()
      }
    }
    window.addEventListener('keydown', clavier)
    return () => window.removeEventListener('keydown', clavier)
  })

  // la découpe ne vaut que pour une image choisie
  useEffect(() => {
    if (panneau === 'decoupe' && sel?.type !== 'image') setPanneau('images')
  }, [panneau, sel?.type])

  // ── ajouter
  function placer(w, h) {
    const jx = (Math.random() - 0.5) * PW * 0.12, jy = (Math.random() - 0.5) * PH * 0.12
    return { x: r2(PW / 2 + jx), y: r2(PH / 2 + jy), w: r2(w), h: r2(h) }
  }
  function tailleDepart(iw, ih, part = 0.55) {
    const k = Math.min(part * PW / iw, part * PH / ih)
    return [iw * k, ih * k]
  }
  function place() {
    if (compoRef.current.elements.length >= MAX_ELEMENTS) { avertir(`Un collage tient ${MAX_ELEMENTS} éléments au plus.`); return false }
    return true
  }
  function ajouter(els) {
    poser(c => ({ ...c, elements: [...c.elements, ...els] }))
    setSelId(els[els.length - 1].id)
    setMessage(null)
  }

  async function ajouterReserve(item) {
    if (!place()) return
    const ent = await chargerImage(item.url)
    if (!ent.ok) { avertir('Cette image n’a pas pu se charger. Réessayez dans un instant.'); return }
    const [w, h] = tailleDepart(ent.el.naturalWidth, ent.el.naturalHeight)
    ajouter([{ id: nouvelId(), type: 'image', origine: 'reserve', url: item.url, nom: item.nom, ...placer(w, h), r: 0,
      crop: [0, 0, 1, 1], forme: 'rect', poly: null, graine: nouvelleGraine(), ombre: false }])
  }

  async function ajouterFichiers(liste) {
    const fichiers = [...(liste || [])]
    const nouveaux = []
    for (const f of fichiers) {
      if (compoRef.current.elements.length + nouveaux.length >= MAX_ELEMENTS) { avertir(`Un collage tient ${MAX_ELEMENTS} éléments au plus.`); break }
      try {
        const cv = await lireFichier(f)
        const cle = 'f' + nouvelId()
        imagesRef.current.set(cle, { el: cv, ok: true, erreur: false, promesse: Promise.resolve() })
        const [w, h] = tailleDepart(cv.width, cv.height)
        nouveaux.push({ id: nouvelId(), type: 'image', origine: 'fichier', cle, nom: f.name.slice(0, 80), ...placer(w, h), r: 0,
          crop: [0, 0, 1, 1], forme: 'rect', poly: null, graine: nouvelleGraine(), ombre: false })
      } catch (err) { avertir(err.message) }
    }
    if (nouveaux.length) { ajouter(nouveaux); setVersionImages(v => v + 1) }
  }

  // Après un rechargement : on remet le fichier, l'élément garde sa place et sa découpe
  async function remettreImage(fichier) {
    if (!fichier || sel?.origine !== 'fichier') return
    try {
      const cv = await lireFichier(fichier)
      imagesRef.current.set(sel.cle, { el: cv, ok: true, erreur: false, promesse: Promise.resolve() })
      setVersionImages(v => v + 1)
      setMessage(null)
    } catch (err) { avertir(err.message) }
  }

  function nouveauMot(texte, { police, papier, couleur }, h = 80) {
    const w = largeurMot(texte, police, h)
    return { id: nouvelId(), type: 'mot', texte, police, papier, couleur, ...placer(w, h), r: r2((Math.random() - 0.5) * 8),
      graine: nouvelleGraine(), ombre: false }
  }

  async function collerMot(e) {
    e?.preventDefault()
    const t = saisie.trim().replace(/\s+/g, ' ')
    if (!t) { avertir('Écrivez d’abord un mot.'); return }
    const refus = verifierTexte(t)
    if (refus) { avertir(refus); return }
    if (!place()) return
    await chargerPolices()
    ajouter([nouveauMot(t, reglageMot)])
    setSaisie('')
  }

  function changerTexte() {
    const t = saisie.trim().replace(/\s+/g, ' ')
    if (!t || sel?.type !== 'mot') return
    const refus = verifierTexte(t)
    if (refus) { avertir(refus); return }
    modifierSel({ texte: t, w: r2(largeurMot(t, sel.police, sel.h)) })
    setSaisie('')
  }

  async function motsAuHasard() {
    await chargerPolices()
    const pris = new Set(), nouveaux = []
    const reste = MAX_ELEMENTS - compoRef.current.elements.length
    if (reste <= 0) { avertir(`Un collage tient ${MAX_ELEMENTS} éléments au plus.`); return }
    while (nouveaux.length < Math.min(3, reste)) {
      const t = auHasard(MOTS)
      if (pris.has(t)) continue
      pris.add(t)
      const papier = auHasard(Object.keys(PAPIERS_MOTS))
      const encres = PALETTE.filter(c => sombre(c) !== sombre(PAPIERS_MOTS[papier].teinte))
      const m = nouveauMot(t, { police: auHasard(Object.keys(POLICES)), papier, couleur: Math.random() < 0.6 ? (papier === 'noir' ? '#fffdf7' : '#1a1a1a') : auHasard(encres) }, 60 + Math.random() * 40)
      m.x = r2(PW * (0.15 + Math.random() * 0.7)); m.y = r2(PH * (0.15 + Math.random() * 0.7))
      nouveaux.push(m)
    }
    ajouter(nouveaux)
  }

  function reglerMot(champs) {
    setReglageMot(r => ({ ...r, ...champs }))
    if (sel?.type !== 'mot') return
    const n = { ...champs }
    if (champs.papier && sombre(PAPIERS_MOTS[champs.papier].teinte) === sombre(sel.couleur)) {
      n.couleur = sombre(sel.couleur) ? '#fffdf7' : '#1a1a1a'   // un mot noir sur papier noir disparaît
    }
    if (champs.police) n.w = r2(largeurMot(sel.texte, champs.police, sel.h))
    modifierSel(n)
  }

  function ajouterForme(forme) {
    if (!place()) return
    const cote = Math.min(PW, PH) * 0.32
    const [w, h] = forme === 'dechire' ? [cote * 1.6, cote * 0.6] : forme === 'feuille' ? [cote * 0.6, cote] : [cote, cote]
    ajouter([{ id: nouvelId(), type: 'forme', forme, remplissage, ...placer(w, h), r: 0, graine: nouvelleGraine(), ombre: false }])
  }
  function choisirRemplissage(v) {
    setRemplissage(v)
    if (sel?.type === 'forme') modifierSel({ remplissage: v })
  }

  function changerFormat(f) {
    if (f === compo.format) return
    const { l, h } = FORMATS[f], kx = l / PW, ky = h / PH
    poser(c => ({ ...c, format: f, elements: c.elements.map(e => ({ ...e, x: r2(e.x * kx), y: r2(e.y * ky) })) }))
  }

  // ── agir sur l'élément choisi
  function supprimer() {
    const s = etatRef.current.sel
    if (!s) return
    poser(c => ({ ...c, elements: c.elements.filter(e => e.id !== s.id) }))
    setSelId(null)
  }
  function dupliquer() {
    const s = etatRef.current.sel
    if (!s || !place()) return
    const copie = { ...s, id: nouvelId(), x: r2(Math.min(PW, s.x + 24)), y: r2(Math.min(PH, s.y + 24)) }
    poser(c => ({ ...c, elements: [...c.elements, copie] }))
    setSelId(copie.id)
  }
  function ordre(devant) {
    if (!sel) return
    poser(c => {
      const autres = c.elements.filter(e => e.id !== sel.id), el = c.elements.find(e => e.id === sel.id)
      return { ...c, elements: devant ? [...autres, el] : [el, ...autres] }
    })
  }

  // ── la découpe
  function recadrer(el, a0, b0, a1, b1) {
    const [u0, v0, u1, v1] = el.crop, du = u1 - u0, dv = v1 - v0
    const [x, y] = versPage(el, [((a0 + a1) / 2 - 0.5) * el.w, ((b0 + b1) / 2 - 0.5) * el.h])
    return { ...el, x: r2(x), y: r2(y), w: r2((a1 - a0) * el.w), h: r2((b1 - b0) * el.h),
      crop: [u0 + a0 * du, v0 + b0 * dv, u0 + a1 * du, v0 + b1 * dv].map(r4) }
  }
  function appliquerDecoupe(g) {
    const el = compoRef.current.elements.find(e => e.id === g.id)
    if (!el) return
    const norm = pt => { const [lx, ly] = versLocal(el, pt); return [borne(lx / el.w + 0.5, 0, 1), borne(ly / el.h + 0.5, 0, 1)] }
    if (g.type === 'cadre') {
      const [pa, pb] = [norm(g.a), norm(g.b)]
      const [a0, a1, b0, b1] = [Math.min(pa[0], pb[0]), Math.max(pa[0], pb[0]), Math.min(pa[1], pb[1]), Math.max(pa[1], pb[1])]
      if ((a1 - a0) * el.w < MIN_COTE || (b1 - b0) * el.h < MIN_COTE) return
      poser(majElement(el.id, e => ({ ...recadrer(e, a0, b0, a1, b1), forme: g.forme, poly: null })))
    } else {
      let pts = g.points.map(norm)
      if (pts.length < 3) return
      const a0 = Math.min(...pts.map(p => p[0])), a1 = Math.max(...pts.map(p => p[0]))
      const b0 = Math.min(...pts.map(p => p[1])), b1 = Math.max(...pts.map(p => p[1]))
      if ((a1 - a0) * el.w < MIN_COTE || (b1 - b0) * el.h < MIN_COTE) return
      const pas = Math.ceil(pts.length / 240)
      pts = pts.filter((_, i) => i % pas === 0)
      const poly = pts.map(([a, b]) => [r4((a - a0) / (a1 - a0)), r4((b - b0) / (b1 - b0))])
      poser(majElement(el.id, e => ({ ...recadrer(e, a0, b0, a1, b1), forme: 'libre', poly })))
    }
    setMessage(null)
  }
  function choisirCiseaux(f) {
    setCiseaux(f)
    if (f !== 'libre' && sel?.type === 'image' && sel.forme !== f) modifierSel({ forme: f, poly: null })
  }
  function imageEntiere() {
    if (sel?.type !== 'image') return
    const [u0, v0, u1, v1] = sel.crop
    // on agrandit le cadre pour retrouver toute l'image, à la même échelle
    const kx = sel.w / (u1 - u0), ky = sel.h / (v1 - v0)
    const [x, y] = versPage(sel, [(0.5 - (u0 + u1) / 2) * kx, (0.5 - (v0 + v1) / 2) * ky])
    modifierSel({ crop: [0, 0, 1, 1], forme: 'rect', poly: null, w: r2(kx), h: r2(ky), x: r2(borne(x, 0, PW)), y: r2(borne(y, 0, PH)) })
    setCiseaux('rect')
  }

  // ── les gestes : un doigt déplace, deux doigts pincent et tournent, les poignées pour la souris
  function pointPage(e) {
    const rect = zoneRef.current.getBoundingClientRect()
    return [(e.clientX - rect.left) / rect.width * PW, (e.clientY - rect.top) / rect.height * PH]
  }
  function unitesParPixel() { return PW / (zoneRef.current?.getBoundingClientRect().width || PW) }

  function redim(d, f) {
    const fMin = MIN_COTE / Math.min(d.w, d.h), fMax = 3 * Math.max(PW, PH) / Math.max(d.w, d.h)
    const k = borne(f, fMin, fMax)
    return { ...d, w: r2(d.w * k), h: r2(d.h * k) }
  }

  function toucher(pt) {
    const marge = 6 * unitesParPixel(), dedans = el => {
      const [lx, ly] = versLocal(el, pt)
      return Math.abs(lx) <= el.w / 2 + marge && Math.abs(ly) <= el.h / 2 + marge
    }
    const s = etatRef.current.sel
    if (s && dedans(s)) return s       // l'élément choisi reste attrapable même s'il est sous un autre
    const els = compoRef.current.elements
    for (let i = els.length - 1; i >= 0; i--) if (dedans(els[i])) return els[i]
    return null
  }

  function apercuTrace(g) {
    if (g.type === 'trace') return g.points
    const el = compoRef.current.elements.find(e => e.id === g.id)
    if (!el) return null
    const [a, b] = [versLocal(el, g.a), versLocal(el, g.b)]
    return [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]], [a[0], a[1]]].map(p => versPage(el, p))
  }

  function appui(e) {
    e.preventDefault()
    const pt = pointPage(e)
    try { zoneRef.current.setPointerCapture(e.pointerId) } catch { /* pointeur déjà relâché */ }
    pointeursRef.current.set(e.pointerId, pt)
    const n = pointeursRef.current.size
    const { sel: s, panneau: pan, ciseaux: cis } = etatRef.current

    if (pan === 'decoupe' && s?.type === 'image') {
      if (n > 1) return
      const g = { type: cis === 'libre' ? 'trace' : 'cadre', forme: cis, id: s.id, points: [pt], a: pt, b: pt }
      gesteRef.current = g
      setTrace(apercuTrace(g))
      return
    }
    if (n === 2 && s) {
      const ids = [...pointeursRef.current.keys()]
      const courant = compoRef.current.elements.find(x => x.id === s.id)
      gesteRef.current = { type: 'pincer', id: s.id, ids, depart: courant, a0: pointeursRef.current.get(ids[0]), b0: pointeursRef.current.get(ids[1]),
        memorise: !!gesteRef.current?.memorise }
      return
    }
    if (n > 1) return
    const poignee = e.target.closest?.('[data-poignee]')?.dataset.poignee
    if (poignee && s) { gesteRef.current = { type: poignee, id: s.id, depart: s, p0: pt, memorise: false }; return }
    const t = toucher(pt)
    if (t) { setSelId(t.id); gesteRef.current = { type: 'deplacer', id: t.id, depart: t, p0: pt, memorise: false } }
    else { setSelId(null); gesteRef.current = null }
  }

  function glisse(e) {
    if (!pointeursRef.current.has(e.pointerId)) return
    const pt = pointPage(e)
    pointeursRef.current.set(e.pointerId, pt)
    const g = gesteRef.current
    if (!g) return
    if (g.type === 'trace') {
      const [x, y] = g.points[g.points.length - 1]
      if (Math.hypot(pt[0] - x, pt[1] - y) > 3 * unitesParPixel()) { g.points.push(pt); setTrace([...g.points]) }
      return
    }
    if (g.type === 'cadre') { g.b = pt; setTrace(apercuTrace(g)); return }
    const d = g.depart
    let n
    if (g.type === 'deplacer') {
      n = { ...d, x: r2(borne(d.x + pt[0] - g.p0[0], 0, PW)), y: r2(borne(d.y + pt[1] - g.p0[1], 0, PH)) }
    } else if (g.type === 'echelle') {
      if (d.type === 'forme') {
        // une forme s'étire librement ; une image ou un mot garde ses proportions
        const [lx, ly] = versLocal(d, pt), max = 3 * Math.max(PW, PH)
        n = { ...d, w: r2(borne(2 * Math.abs(lx), MIN_COTE, max)), h: r2(borne(2 * Math.abs(ly), MIN_COTE, max)) }
      } else {
        const r0 = Math.hypot(g.p0[0] - d.x, g.p0[1] - d.y) || 1, r1 = Math.hypot(pt[0] - d.x, pt[1] - d.y)
        n = redim(d, r1 / r0)
      }
    } else if (g.type === 'rotation') {
      const a0 = Math.atan2(g.p0[1] - d.y, g.p0[0] - d.x), a1 = Math.atan2(pt[1] - d.y, pt[0] - d.x)
      n = { ...d, r: aimanter(d.r + (a1 - a0) * 180 / Math.PI) }
    } else if (g.type === 'pincer') {
      const a = pointeursRef.current.get(g.ids[0]), b = pointeursRef.current.get(g.ids[1])
      if (!a || !b) return
      const d0 = Math.hypot(g.b0[0] - g.a0[0], g.b0[1] - g.a0[1]) || 1, d1 = Math.hypot(b[0] - a[0], b[1] - a[1])
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.atan2(g.b0[1] - g.a0[1], g.b0[0] - g.a0[0])
      const mx = (a[0] + b[0] - g.a0[0] - g.b0[0]) / 2, my = (a[1] + b[1] - g.a0[1] - g.b0[1]) / 2
      n = { ...redim(d, d1 / d0), x: r2(borne(d.x + mx, 0, PW)), y: r2(borne(d.y + my, 0, PH)), r: aimanter(d.r + ang * 180 / Math.PI) }
    }
    if (!n) return
    if (!g.memorise) { memoriser(); g.memorise = true }
    majCompo(majElement(g.id, () => n))
  }

  function lacher(e) {
    pointeursRef.current.delete(e.pointerId)
    const g = gesteRef.current
    if (!g) return
    if (g.type === 'trace' || g.type === 'cadre') {
      if (!pointeursRef.current.size) { gesteRef.current = null; setTrace(null); appliquerDecoupe(g) }
      return
    }
    if (g.type === 'pincer') {
      // un doigt se lève : l'autre continue de déplacer
      const reste = [...pointeursRef.current.values()]
      const el = compoRef.current.elements.find(x => x.id === g.id)
      gesteRef.current = reste.length === 1 && el ? { type: 'deplacer', id: g.id, depart: el, p0: reste[0], memorise: g.memorise } : null
      return
    }
    if (!pointeursRef.current.size) gesteRef.current = null
  }

  // ── déposer
  const manquantes = compo.elements.filter(e => e.type === 'image' && e.origine === 'fichier' && !imagesRef.current.get(e.cle)?.ok)

  async function valider() {
    if (!onValider) return
    const c = compoRef.current
    if (c.elements.length < MIN_ELEMENTS) { avertir('Un collage, c’est au moins deux éléments sur la page.'); return }
    if (manquantes.length) { avertir(`${manquantes.length > 1 ? `${manquantes.length} images sont` : 'Une image est'} à remettre : choisissez l’élément, puis « remettre l’image », ou supprimez-le.`); return }
    for (const e of c.elements) {
      const refus = e.type === 'mot' && verifierTexte(e.texte)
      if (refus) { avertir(refus); return }
    }
    setEnvoi(true); setMessage(null)
    try {
      await chargerPolices()
      for (const e of c.elements) {
        if (e.type !== 'image' || e.origine === 'fichier') continue
        const ent = await chargerImage(e.url)
        if (!ent.ok) throw new Error('Une image de la réserve n’a pas pu se charger. Réessayez, ou retirez-la.')
      }
      const { l, h } = FORMATS[c.format], k = COTE_MAX / Math.max(l, h)
      const cv = document.createElement('canvas')
      cv.width = Math.round(l * k); cv.height = Math.round(h * k)
      rendrePage(cv.getContext('2d'), c, k, imagesRef.current)
      const { blob, type, largeur: lg, hauteur: ht } = await exporterToile(cv)
      const source = { version: 1, format: c.format, fond: c.fond, elements: c.elements.map(versSource) }
      await onValider({ blob, type, largeur: lg, hauteur: ht, source })
      effacerBrouillon()
      compoRef.current = INITIAL
      pileRef.current = { avant: [], apres: [] }
      for (const [cle] of imagesRef.current) if (cle.startsWith('f')) imagesRef.current.delete(cle)
      setSelId(null)
    } catch (err) {
      avertir(err?.message || 'Le collage n’a pas pu partir.')
    } finally {
      setEnvoi(false)
    }
  }

  function toutEffacer() {
    poser(c => ({ ...c, elements: [] }))
    setSelId(null)
  }

  // ── l'affichage
  const pile = pileRef.current
  const enDecoupe = panneau === 'decoupe' && sel?.type === 'image'
  const cadre = sel && {
    left: `${sel.x / PW * 100}%`, top: `${sel.y / PH * 100}%`, width: `${sel.w / PW * 100}%`, height: `${sel.h / PH * 100}%`,
    transform: `translate(-50%, -50%) rotate(${sel.r}deg)`,
  }
  const selMot = sel?.type === 'mot' ? sel : null
  const selForme = sel?.type === 'forme' ? sel : null
  const motCourant = selMot || reglageMot
  const remplCourant = selForme ? selForme.remplissage : remplissage
  const nomSel = sel ? (sel.type === 'mot' ? `« ${sel.texte} »` : sel.type === 'image' ? (sel.nom || 'image') : `forme (${FORMES.find(f => f.id === sel.forme)?.nom || 'forme'})`) : ''

  const pastilles = (courant, choisir, avecPapiers) => (
    <div className="collage-pastilles">
      {PALETTE.map(c => (
        <button key={c} type="button" className={`collage-pastille${courant === c ? ' actif' : ''}`} style={{ background: c }}
          title={c} aria-label={`couleur ${c}`} aria-pressed={courant === c} onClick={() => choisir(c)} />
      ))}
      <label className={`collage-pastille collage-pipette${courant?.startsWith('#') && !PALETTE.includes(courant) ? ' actif' : ''}`} title="n’importe quelle couleur">
        <input type="color" value={courant?.startsWith('#') ? courant : '#1a1a1a'} onChange={e => choisir(e.target.value)} aria-label="couleur libre" />
      </label>
      {avecPapiers && Object.entries(PAPIERS).map(([cle, p]) => (
        <button key={cle} type="button" className={`collage-pastille collage-papier collage-papier-${cle}${courant === cle ? ' actif' : ''}`}
          title={`papier ${p.nom}`} aria-label={`papier ${p.nom}`} aria-pressed={courant === cle} onClick={() => choisir(cle)} />
      ))}
    </div>
  )

  return (
    <div className={`collage${plein ? ' plein' : ''}`}>
      <div className="collage-entete">
        <div className="collage-formats" role="group" aria-label="Format de la page">
          {Object.entries(FORMATS).map(([cle, f]) => (
            <button key={cle} type="button" className={`chip${compo.format === cle ? ' active' : ''}`} aria-pressed={compo.format === cle} onClick={() => changerFormat(cle)}>{f.nom}</button>
          ))}
        </div>
        <button type="button" className={`btn btn-sm ${plein ? 'btn-noir' : 'btn-jaune'}`} onClick={() => setPlein(v => !v)}>{plein ? '✕ Fermer' : '⤢ Plein écran'}</button>
      </div>

      {manquantes.length > 0 && (
        <p className="collage-alerte" role="status">
          {manquantes.length > 1 ? `${manquantes.length} images de vos fichiers sont à remettre` : 'Une image de vos fichiers est à remettre'} :
          un rechargement de la page les perd, leur place et leur découpe sont gardées.
        </p>
      )}

      <div ref={sceneRef} className="collage-scene" style={{ aspectRatio: `${PW} / ${PH}`, '--ratio': PW / PH }}>
        <canvas ref={toileRef} role="img" aria-label={`Collage, ${compo.elements.length} élément${compo.elements.length > 1 ? 's' : ''}`} />
        <div ref={zoneRef} className={`collage-zone${enDecoupe ? ' decoupe' : ''}`}
          onPointerDown={appui} onPointerMove={glisse} onPointerUp={lacher} onPointerCancel={lacher}>
          {!compo.elements.length && <p className="collage-vide">Page vide. Prenez une image dans la réserve, collez des mots, posez des formes.</p>}
          {sel && (
            <div className={`collage-cadre${enDecoupe ? ' decoupe' : ''}`} style={cadre}>
              {!enDecoupe && <>
                <span className="collage-poignee collage-poignee-rotation" data-poignee="rotation" title="tourner" aria-hidden="true">⟳</span>
                <span className="collage-poignee collage-poignee-echelle" data-poignee="echelle" title="agrandir ou réduire" aria-hidden="true">⤡</span>
              </>}
            </div>
          )}
          {trace && (
            <svg className="collage-trace" viewBox={`0 0 ${PW} ${PH}`} preserveAspectRatio="none" aria-hidden="true">
              <polyline points={trace.map(p => p.join(',')).join(' ')} />
            </svg>
          )}
        </div>
      </div>

      <div className="collage-barre" role="toolbar" aria-label="Agir sur le collage">
        <button type="button" className="collage-outil" title="annuler (Ctrl+Z)" disabled={!pile.avant.length} onClick={annuler}><span aria-hidden="true">↶</span>annuler</button>
        <button type="button" className="collage-outil" title="rétablir (Ctrl+Y)" disabled={!pile.apres.length} onClick={retablir}><span aria-hidden="true">↷</span>rétablir</button>
        <span className="collage-sep" aria-hidden="true" />
        {sel ? <>
          <button type="button" className="collage-outil" title="tout devant" onClick={() => ordre(true)}><span aria-hidden="true">⬆</span>devant</button>
          <button type="button" className="collage-outil" title="tout derrière" onClick={() => ordre(false)}><span aria-hidden="true">⬇</span>derrière</button>
          <button type="button" className="collage-outil" title="dupliquer (Ctrl+D)" onClick={dupliquer}><span aria-hidden="true">⧉</span>dupliquer</button>
          <button type="button" className={`collage-outil${sel.ombre ? ' actif' : ''}`} aria-pressed={!!sel.ombre} title="ombre portée : l’effet papier collé" onClick={() => modifierSel({ ombre: !sel.ombre })}><span aria-hidden="true">◩</span>ombre</button>
          {sel.type === 'image' && (
            <button type="button" className={`collage-outil${enDecoupe ? ' actif' : ''}`} aria-pressed={enDecoupe} title="découper" onClick={() => { setCiseaux(sel.forme || 'rect'); setPanneau(enDecoupe ? 'images' : 'decoupe') }}><span aria-hidden="true">✂</span>découper</button>
          )}
          {sel.origine === 'fichier' && !imagesRef.current.get(sel.cle)?.ok && (
            <button type="button" className="collage-outil collage-outil-alerte" onClick={() => remettreRef.current?.click()}><span aria-hidden="true">⟲</span>remettre l’image</button>
          )}
          <button type="button" className="collage-outil collage-outil-rouge" title="supprimer (Suppr)" onClick={supprimer}><span aria-hidden="true">🗑</span>supprimer</button>
        </> : <span className="caption-gris collage-astuce">Touchez un élément pour le choisir. Deux doigts : agrandir et tourner.</span>}
        <input ref={remettreRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { remettreImage(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {sel && <p className="caption-gris collage-choisi">Choisi : {nomSel}. Glissez pour déplacer, ⤡ pour la taille, ⟳ pour tourner.</p>}

      {!enDecoupe && (
        <div className="collage-onglets" role="tablist" aria-label="Ajouter">
          {[['images', 'Images'], ['mots', 'Mots'], ['formes', 'Formes'], ['fond', 'Fond']].map(([id, nom]) => (
            <button key={id} type="button" role="tab" aria-selected={panneau === id} className={`collage-onglet${panneau === id ? ' actif' : ''}`} onClick={() => setPanneau(id)}>{nom}</button>
          ))}
        </div>
      )}

      <div className="collage-panneau">
        {enDecoupe && <>
          <div className="collage-ligne">
            <span className="collage-etiquette">ciseaux</span>
            <div className="collage-puces" role="group" aria-label="Forme de la découpe">
              {CISEAUX.map(c => (
                <button key={c.id} type="button" className={`chip${ciseaux === c.id ? ' active' : ''}`} aria-pressed={ciseaux === c.id} onClick={() => choisirCiseaux(c.id)}>{c.icone} {c.nom}</button>
              ))}
            </div>
          </div>
          <p className="caption-gris collage-aide">
            {ciseaux === 'libre'
              ? 'Dessinez le contour sur l’image, d’un seul geste : on garde ce qui est dedans.'
              : 'Glissez sur l’image pour choisir le morceau à garder. La forme des ciseaux s’applique au bord.'}
          </p>
          <div className="collage-ligne">
            <button type="button" className="btn btn-outline btn-sm" onClick={imageEntiere}>↺ Image entière</button>
            <button type="button" className="btn btn-noir btn-sm" onClick={() => setPanneau('images')}>✓ Terminé</button>
          </div>
        </>}

        {!enDecoupe && panneau === 'images' && <>
          <div className="collage-ligne">
            <button type="button" className="btn btn-noir btn-sm" onClick={() => fichierRef.current?.click()}>＋ Depuis un fichier</button>
            <input ref={fichierRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden
              onChange={e => { ajouterFichiers(e.target.files); e.target.value = '' }} />
            <span className="caption-gris">JPEG, PNG, WebP ou GIF. Vos images restent dans cette page : un rechargement les perd, leur place est gardée.</span>
          </div>
          {collection.length > 0 && <>
            <p className="collage-etiquette">Votre collection</p>
            <div className="collage-reserve">
              {collection.map(it => (
                <button key={it.url} type="button" className="collage-vignette" title={it.nom} onClick={() => ajouterReserve(it)}>
                  <img src={it.vignette} alt={it.nom} loading="lazy" />
                </button>
              ))}
            </div>
          </>}
          <p className="collage-etiquette">La réserve de la banque</p>
          <div className="collage-reserve">
            {PLANCHES.map(it => (
              <button key={it.url} type="button" className="collage-vignette" title={it.nom} onClick={() => ajouterReserve(it)}>
                <img src={it.vignette} alt={it.nom} loading="lazy" />
              </button>
            ))}
          </div>
          <p className="caption-gris collage-aide">Des planches de billets de la Banque Fantôme : découpez dans l’argent.</p>
        </>}

        {!enDecoupe && panneau === 'mots' && <>
          <form className="collage-ligne" onSubmit={collerMot}>
            <input type="text" className="collage-saisie" value={saisie} maxLength={40} placeholder="un mot, une phrase courte"
              aria-label="Mot à coller" onChange={e => setSaisie(e.target.value)} />
            <button type="submit" className="btn btn-noir btn-sm">＋ Coller</button>
            {selMot && <button type="button" className="btn btn-outline btn-sm" disabled={!saisie.trim()} onClick={changerTexte}>Changer le mot choisi</button>}
          </form>
          <div className="collage-ligne">
            <button type="button" className="btn btn-jaune btn-sm" onClick={motsAuHasard}>🎲 Mots au hasard</button>
            <span className="caption-gris">Trois mots tirés du vocabulaire de la banque.</span>
          </div>
          {selMot && <p className="caption-gris collage-aide">Les réglages ci-dessous changent le mot choisi.</p>}
          <div className="collage-ligne">
            <span className="collage-etiquette">lettres</span>
            <div className="collage-puces" role="group" aria-label="Typographie">
              {Object.entries(POLICES).map(([cle, p]) => (
                <button key={cle} type="button" className={`chip collage-police${motCourant.police === cle ? ' active' : ''}`} aria-pressed={motCourant.police === cle}
                  style={{ fontFamily: p.famille, fontStyle: p.style === 'italic' ? 'italic' : 'normal', textTransform: p.maj ? 'uppercase' : 'none' }}
                  onClick={() => reglerMot({ police: cle })}>{p.nom}</button>
              ))}
            </div>
          </div>
          <div className="collage-ligne">
            <span className="collage-etiquette">papier</span>
            <div className="collage-pastilles" role="group" aria-label="Papier de l’étiquette">
              {Object.entries(PAPIERS_MOTS).map(([cle, p]) => (
                <button key={cle} type="button" className={`collage-pastille${motCourant.papier === cle ? ' actif' : ''}${cle === 'journal' ? ' collage-papier collage-papier-journal' : ''}`}
                  style={cle === 'journal' ? undefined : { background: p.teinte }} title={p.nom} aria-label={`papier ${p.nom}`} aria-pressed={motCourant.papier === cle}
                  onClick={() => reglerMot({ papier: cle })} />
              ))}
            </div>
          </div>
          <div className="collage-ligne">
            <span className="collage-etiquette">encre</span>
            {pastilles(motCourant.couleur, c => reglerMot({ couleur: c }), false)}
          </div>
        </>}

        {!enDecoupe && panneau === 'formes' && <>
          <div className="collage-ligne">
            <span className="collage-etiquette">poser</span>
            <div className="collage-puces" role="group" aria-label="Formes">
              {FORMES.map(f => (
                <button key={f.id} type="button" className="chip" onClick={() => ajouterForme(f.id)}>{f.icone} {f.nom}</button>
              ))}
            </div>
          </div>
          <div className="collage-ligne">
            <span className="collage-etiquette">{selForme ? 'la forme choisie' : 'couleur ou papier'}</span>
            {pastilles(remplCourant, choisirRemplissage, true)}
          </div>
          <p className="caption-gris collage-aide">Une forme s’étire librement par sa poignée ⤡.</p>
        </>}

        {!enDecoupe && panneau === 'fond' && (
          <div className="collage-ligne">
            <span className="collage-etiquette">fond</span>
            {pastilles(compo.fond, v => { if (v !== compo.fond) poser(c => ({ ...c, fond: v })) }, true)}
          </div>
        )}
      </div>

      {message && <p className={message.type === 'err' ? 'msg-err' : 'msg-ok'} role="status">{message.msg}</p>}

      <Encart titre="Le collage : des ciseaux et de la colle">
        <p>Vers 1912, Georges Braque et Pablo Picasso font entrer dans leurs tableaux de vrais morceaux du monde : papier peint imitant le bois, journal, étiquettes. On appelle ces œuvres des « papiers collés ».</p>
        <p>À Berlin, autour de 1919, Hannah Höch découpe des photographies dans les magazines et les recompose : le photomontage est une pratique phare du dadaïsme berlinois.</p>
        <p>À la fin de sa vie, Henri Matisse découpe aux ciseaux des feuilles peintes à la gouache et en compose de grandes œuvres. Ici, la banque vous prête ses planches de billets : coupez dans l’argent.</p>
      </Encart>

      {onValider && (
        <PiedAtelier onEffacer={compo.elements.length ? toutEffacer : null} onValider={valider} enCours={enCours || envoi}
          libelleValider={libelleValider} aide={`${compo.elements.length} élément${compo.elements.length > 1 ? 's' : ''}`} />
      )}
    </div>
  )
}
