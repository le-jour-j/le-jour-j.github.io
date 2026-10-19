import { useEffect, useMemo, useRef, useState } from 'react'
import { exporterToile, useBrouillon, Encart, PiedAtelier } from './commun'
import { texteRefuse, verifierTexte } from '../../lib/billet/motsRefuses'
import './poesie.css'

// L'atelier Poésie (2026-10-19) : on écrit un poème, on le met en page, et la page devient
// une image. L'aperçu est la toile même qui sera exportée, à sa taille réelle : ce qu'on voit
// est ce qui part. La mise en page est une fonction pure (composer) suivie d'un tracé (peindre),
// ce qui permet aussi de chercher la plus grande taille qui tient dans la page.

const CLE_BROUILLON = 'bf-atelier-poesie-brouillon'

// Les pages, en pixels d'export (grand côté entre 2200 et 2400)
const FORMATS = {
  carre:   { nom: 'carte carrée', l: 2200, h: 2200 },
  a5:      { nom: 'page A5', l: 1692, h: 2400 },
  bandeau: { nom: 'bandeau', l: 2400, h: 1200 },
}

// Les familles. DM Sans et Bebas Neue sont déjà chargées par le site ; les quatre autres
// viennent de Google Fonts (licence SIL Open Font License), chargées ici une seule fois.
// echelle : corrige l'œil de chaque police pour qu'une même « taille » se lise pareil.
const POLICES = {
  serif:    { nom: 'serif classique', famille: '"EB Garamond"', secours: 'Georgia, serif', titre: 600, italique: true, echelle: 1.08 },
  machine:  { nom: 'machine à écrire', famille: '"Courier Prime"', secours: '"Courier New", monospace', titre: 700, italique: true, echelle: 0.92 },
  sans:     { nom: 'sans', famille: '"DM Sans"', secours: 'Arial, sans-serif', titre: 700, italique: true, echelle: 0.95 },
  main:     { nom: 'manuscrite', famille: '"Caveat"', secours: 'cursive', titre: 700, italique: false, echelle: 1.3 },
  affiche:  { nom: 'affiche', famille: '"Bebas Neue"', secours: 'Impact, sans-serif', titre: 400, italique: false, echelle: 1.2, titreEchelle: 2 },
  elegante: { nom: 'élégante', famille: '"Playfair Display"', secours: 'Georgia, serif', titre: 700, italique: true, echelle: 0.95 },
}
const URL_POLICES = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400'
  + '&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Caveat:wght@400;700'
  + '&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap'

const ALIGNEMENTS = [['gauche', 'à gauche'], ['centre', 'centré'], ['droite', 'à droite'], ['escalier', 'en escalier']]
const FORMES = [['', 'aucune'], ['cercle', 'cercle'], ['vague', 'vague'], ['tourne', 'vers tournés']]
const FONDS = { creme: { nom: 'papier crème', c: '#f4ecd8' }, blanc: { nom: 'blanc', c: '#ffffff' }, noir: { nom: 'noir', c: '#161616' } }
const ENCRES = [['#1c1a17', 'encre noire'], ['#4a3423', 'sépia'], ['#1d3b80', 'bleu encre'], ['#a1221c', 'rouge'], ['#a8832a', 'or'], ['#f2ead6', 'craie']]

const INITIAL = {
  titre: '', texte: '', signature: '',
  format: 'a5', police: 'serif', align: 'gauche', placement: 'milieu',
  taille: 4.2, interligne: 1.5, marge: 10,
  fond: 'creme', couleurFond: '#e9d8b4', encre: 'auto', couleurEncre: '#1c1a17',
  filet: false, lettrine: false, cadre: false, forme: '',
}

const borne = (x, min, max, defaut) => { const n = Number(x); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defaut }
const couleurValide = (c, defaut) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : defaut)

// Un brouillon ancien ou abîmé ne doit jamais casser le rendu
function normaliser(b) {
  const v = { ...INITIAL, ...b }
  return {
    titre: String(v.titre ?? ''), texte: String(v.texte ?? ''), signature: String(v.signature ?? ''),
    format: FORMATS[v.format] ? v.format : INITIAL.format,
    police: POLICES[v.police] ? v.police : INITIAL.police,
    align: ALIGNEMENTS.some(([a]) => a === v.align) ? v.align : INITIAL.align,
    placement: v.placement === 'haut' ? 'haut' : 'milieu',
    taille: borne(v.taille, 1.5, 10, INITIAL.taille),
    interligne: borne(v.interligne, 1, 2.5, INITIAL.interligne),
    marge: borne(v.marge, 3, 20, INITIAL.marge),
    fond: FONDS[v.fond] || v.fond === 'libre' ? v.fond : INITIAL.fond,
    couleurFond: couleurValide(v.couleurFond, INITIAL.couleurFond),
    encre: v.encre === 'libre' || ENCRES.some(([c]) => c === v.encre) ? v.encre : 'auto',
    couleurEncre: couleurValide(v.couleurEncre, INITIAL.couleurEncre),
    filet: !!v.filet, lettrine: !!v.lettrine, cadre: !!v.cadre,
    forme: FORMES.some(([f]) => f === v.forme) ? v.forme : '',
  }
}

// ── polices
let feuille = null
function chargerFeuille() {
  if (feuille) return feuille
  feuille = new Promise(res => {
    if (typeof document === 'undefined') { res(); return }
    let lien = document.getElementById('poesie-polices')
    if (lien && lien.sheet) { res(); return }
    if (!lien) {
      lien = document.createElement('link')
      lien.id = 'poesie-polices'; lien.rel = 'stylesheet'; lien.href = URL_POLICES
      document.head.appendChild(lien)
    }
    lien.addEventListener('load', () => res(), { once: true })
    lien.addEventListener('error', () => res(), { once: true })   // hors ligne : les polices de secours
    setTimeout(res, 6000)
  })
  return feuille
}

// Charge la police choisie pour les caractères du poème (Google découpe ses polices par
// alphabet : un « ŵ » ou un « œ » peut demander un fichier de plus). Jamais bloquant.
async function chargerPolice(id, caracteres) {
  if (typeof document === 'undefined' || !document.fonts) return
  await chargerFeuille()
  const p = POLICES[id], texte = caracteres || 'Aa'
  const formes = [`400 40px ${p.famille}`, `${p.titre} 40px ${p.famille}`]
  if (p.italique) formes.push(`italic 400 40px ${p.famille}`)
  try {
    await Promise.race([Promise.all(formes.map(f => document.fonts.load(f, texte))), new Promise(r => setTimeout(r, 6000))])
  } catch { /* la police de secours fera l'affaire */ }
}

const police = (p, { taille, poids = 400, italique = false }) => `${italique ? 'italic ' : ''}${poids} ${taille}px ${p.famille}, ${p.secours}`

// Un contexte de mesure, pour chercher la taille qui tient sans toucher à l'aperçu
let mesureur = null
const ctxMesure = () => (mesureur ||= document.createElement('canvas').getContext('2d'))

// Les lettres telles qu'on les voit : un emoji composé ou un « é » décomposé restent entiers
const segmenteur = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('fr', { granularity: 'grapheme' }) : null
const graphemes = s => (segmenteur ? Array.from(segmenteur.segment(s), x => x.segment) : Array.from(s))

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(x => x / 255)
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const couleurDuFond = v => (v.fond === 'libre' ? v.couleurFond : FONDS[v.fond].c)
function couleurDeLEncre(v) {
  if (v.encre === 'libre') return v.couleurEncre
  if (v.encre !== 'auto') return v.encre
  return luminance(couleurDuFond(v)) < 0.45 ? '#f2ead6' : '#1c1a17'
}

// Un vers trop long se coupe entre deux mots ; un mot plus long que la ligne, entre deux lettres.
// largeurLigne(k) : la place disponible pour la k-ième ligne de ce vers.
function couperVers(ctx, texte, largeurLigne) {
  const lignes = [], morceaux = texte.split(/( +)/)
  const mesure = s => ctx.measureText(s).width
  let ligne = ''
  for (let i = 0; i < morceaux.length; i += 2) {
    const mot = morceaux[i], sep = i > 0 ? morceaux[i - 1] : ''
    if (!mot) continue
    const essai = ligne ? ligne + sep + mot : mot
    if (mesure(essai) <= largeurLigne(lignes.length)) { ligne = essai; continue }
    if (ligne) { lignes.push(ligne); ligne = '' }
    if (mesure(mot) <= largeurLigne(lignes.length)) { ligne = mot; continue }
    for (const g of graphemes(mot)) {
      if (ligne && mesure(ligne + g) > largeurLigne(lignes.length)) { lignes.push(ligne); ligne = '' }
      ligne += g
    }
  }
  if (ligne) lignes.push(ligne)
  return lignes.length ? lignes : ['']
}

const largeurGlyphes = (ctx, s) => graphemes(s).reduce((n, g) => n + ctx.measureText(g).width, 0)

// Les lignes non vides, sans les lignes blanches du début et de la fin
function lignesDuPoeme(texte) {
  const lignes = texte.replace(/\r/g, '').replace(/\t/g, '    ').split('\n')
  let debut = 0, fin = lignes.length
  while (debut < fin && !lignes[debut].trim()) debut++
  while (fin > debut && !lignes[fin - 1].trim()) fin--
  return lignes.slice(debut, fin)
}

// ── la mise en page : rend la liste de ce qu'il faut tracer, et dit si ça déborde
function composer(ctx, W, H, v) {
  const P = POLICES[v.police]
  const u = Math.min(W, H) / 100
  const corps = v.taille * u * P.echelle
  const lh = corps * v.interligne
  const m = v.marge * u
  const zone = { x: m, y: m, l: W - 2 * m, h: H - 2 * m }
  const out = { W, H, u, zone, fond: couleurDuFond(v), encre: couleurDeLEncre(v), cadre: v.cadre, elements: [], deborde: false }
  if (v.forme === 'cercle') return composerCercle(ctx, v, P, out, corps, lh)

  const aGauche = v.align === 'gauche' || v.align === 'escalier'
  const alignBloc = aGauche ? 'gauche' : v.align
  const items = []   // { txt, font, taille, haut, retrait, align, type, rang }

  // le titre
  const titre = v.titre.trim().replace(/\s+/g, ' ')
  if (titre) {
    const tT = corps * (P.titreEchelle || 1.6), fT = police(P, { taille: tT, poids: P.titre })
    ctx.font = fT
    for (const txt of couperVers(ctx, titre, () => zone.l)) {
      items.push({ type: 'titre', txt, font: fT, taille: tT, haut: tT * Math.max(1.1, Math.min(v.interligne, 1.3)), retrait: 0, align: alignBloc })
    }
  }
  if (titre || v.filet) items.push({ type: 'blanc', haut: titre ? lh * (v.filet ? 1.5 : 0.9) : lh, filet: v.filet })

  // le poème, vers par vers
  const fC = police(P, { taille: corps })
  ctx.font = fC
  const pas = corps * 0.5, marche = corps * 2
  let rang = 0, numero = 0, lettrine = null, sousLettrine = 0
  for (const brut of lignesDuPoeme(v.texte)) {
    if (!brut.trim()) {
      items.push({ type: 'blanc', haut: lh })
      rang = 0
      if (lettrine) sousLettrine++
      continue
    }
    let txt = brut.trimEnd()
    const espaces = txt.length - txt.trimStart().length
    txt = txt.trimStart()
    let retrait = 0
    if (aGauche) retrait += espaces * pas          // à gauche, les espaces de début décalent le vers
    if (v.align === 'escalier') retrait += (rang % 5) * marche
    retrait = Math.min(retrait, zone.l * 0.5)

    // la lettrine : la première lettre du premier vers, haute de deux lignes
    if (v.lettrine && aGauche && numero === 0) {
      const [g0, ...reste] = graphemes(txt)
      const lettre = g0.toLocaleUpperCase('fr')
      const capCorps = ctx.measureText('H').actualBoundingBoxAscent || corps * 0.68
      ctx.font = police(P, { taille: 100, poids: P.titre })
      const a = ctx.measureText(lettre).actualBoundingBoxAscent || 70
      const tL = 100 * (lh + capCorps) / Math.max(a, 20)
      const fL = police(P, { taille: tL, poids: P.titre })
      ctx.font = fL
      lettrine = { lettre, font: fL, taille: tL, retrait, largeur: ctx.measureText(lettre).width + corps * 0.3, item: items.length }
      ctx.font = fC
      txt = reste.join('').trimStart()
    }

    const depart = sousLettrine
    const retraitDe = k => {
      let x = k === 0 ? retrait : Math.min(retrait + (aGauche ? corps * 1.5 : 0), zone.l * 0.6)
      if (lettrine && depart + k < 2) x = Math.max(x, lettrine.retrait + lettrine.largeur)
      return x
    }
    const coupe = txt ? couperVers(ctx, txt, k => zone.l - retraitDe(k)) : ['']
    coupe.forEach((t, k) => items.push({ type: 'vers', txt: t, font: fC, taille: corps, haut: lh, retrait: retraitDe(k), align: v.align, rang: numero }))
    if (lettrine) sousLettrine += coupe.length
    rang++; numero++
  }

  // la signature
  const signature = v.signature.trim().replace(/\s+/g, ' ')
  if (signature) {
    const tS = corps * 0.85, fS = police(P, { taille: tS, italique: P.italique })
    ctx.font = fS
    items.push({ type: 'blanc', haut: lh * 0.8 })
    for (const txt of couperVers(ctx, signature, () => zone.l)) {
      items.push({ type: 'signature', txt, font: fS, taille: tS, haut: tS * 1.4, retrait: 0, align: v.align === 'centre' ? 'centre' : 'droite' })
    }
  }

  // placement vertical
  const total = items.reduce((n, it) => n + it.haut, 0)
  out.deborde = total > zone.h + 0.5
  let y = v.placement === 'milieu' && !out.deborde ? zone.y + (zone.h - total) / 2 : zone.y
  const bases = []
  for (const it of items) {
    if (it.type === 'blanc') {
      if (it.filet) {
        const fw = Math.min(zone.l * 0.3, corps * 7), ep = Math.max(2, u * 0.22)
        const fx = alignBloc === 'centre' ? zone.x + (zone.l - fw) / 2 : alignBloc === 'droite' ? zone.x + zone.l - fw : zone.x
        out.elements.push({ type: 'filet', x: fx, y: y + it.haut / 2 - ep / 2, l: fw, e: ep })
      }
      bases.push(y + it.haut / 2)
      y += it.haut
      continue
    }
    const base = y + it.haut / 2 + it.taille * 0.35
    bases.push(base)
    ctx.font = it.font
    const w = v.forme === 'vague' && it.type === 'vers' ? largeurGlyphes(ctx, it.txt) : ctx.measureText(it.txt).width
    const x = it.align === 'centre' ? zone.x + (zone.l - w) / 2
      : it.align === 'droite' ? zone.x + zone.l - w
      : zone.x + it.retrait
    out.elements.push({ type: it.type, txt: it.txt, font: it.font, taille: it.taille, x, y: base, w, rang: it.rang, mode: it.type === 'vers' ? v.forme : '', lh })
    y += it.haut
  }
  if (lettrine) {
    // pied de la lettrine sur la ligne de base de la deuxième ligne
    const b1 = bases[lettrine.item]
    out.elements.push({ type: 'lettrine', txt: lettrine.lettre, font: lettrine.font, x: zone.x + lettrine.retrait, y: b1 + lh, taille: lettrine.taille })
  }
  return out
}

// Le calligramme en cercle : le poème tourne en anneaux, de l'extérieur vers le centre,
// dans le sens des aiguilles d'une montre ; le titre au milieu, la signature en bas à droite.
function composerCercle(ctx, v, P, out, corps, lh) {
  const { zone } = out
  const cx = zone.x + zone.l / 2, cy = zone.y + zone.h / 2
  const signature = v.signature.trim().replace(/\s+/g, ' ')
  // avec une signature, le cercle rétrécit d'une ligne pour qu'elle ne morde pas sur l'anneau
  const R = Math.min(zone.l, zone.h) / 2 - corps * 0.8 - (signature ? corps * 1.4 : 0)
  const titre = v.titre.trim().replace(/\s+/g, ' ')
  const Rmin = titre ? R * 0.42 : Math.max(corps, R * 0.12)

  // les vers bout à bout : « / » entre deux vers, « // » entre deux strophes
  const morceaux = []
  let blanc = false
  for (const l of lignesDuPoeme(v.texte)) {
    if (!l.trim()) { blanc = true; continue }
    if (morceaux.length) morceaux.push(blanc ? '//' : '/')
    morceaux.push(...l.trim().split(/\s+/))
    blanc = false
  }
  const fC = police(P, { taille: corps })
  ctx.font = fC
  const espace = ctx.measureText(' ').width
  let i = 0
  for (let rayon = R; rayon >= Rmin && i < morceaux.length; rayon -= lh) {
    const tour = 2 * Math.PI * rayon * 0.97
    let pos = 0
    while (i < morceaux.length) {
      const mot = morceaux[i], wm = ctx.measureText(mot).width
      if ((pos > 0 ? pos + espace : 0) + wm > tour) break
      if (pos > 0) pos += espace
      for (const g of graphemes(mot)) {
        const wg = ctx.measureText(g).width
        const a = -Math.PI / 2 + (pos + wg / 2) / rayon
        out.elements.push({ type: 'glyphe', txt: g, font: fC, x: cx + rayon * Math.cos(a), y: cy + rayon * Math.sin(a), rot: a + Math.PI / 2, w: wg })
        pos += wg
      }
      i++
    }
  }
  out.deborde = i < morceaux.length

  if (titre) {
    // le titre au centre, réduit jusqu'à tenir dans le disque libre
    const Rin = Rmin - corps * 0.4
    let tT = corps * (P.titreEchelle || 1.6), lignes = [], fT = ''
    for (let essai = 0; essai < 20; essai++) {
      fT = police(P, { taille: tT, poids: P.titre })
      ctx.font = fT
      lignes = couperVers(ctx, titre, () => Rin * 1.5)
      const larg = Math.max(...lignes.map(l => ctx.measureText(l).width))
      if (lignes.length * tT * 1.15 <= Rin * 1.4 && larg <= Rin * 1.6) break
      tT *= 0.9
    }
    const lhT = tT * 1.15, y0 = cy - (lignes.length * lhT) / 2
    lignes.forEach((l, k) => {
      const w = ctx.measureText(l).width
      out.elements.push({ type: 'titre', txt: l, font: fT, x: cx - w / 2, y: y0 + k * lhT + lhT / 2 + tT * 0.35, w })
    })
  }
  if (signature) {
    const tS = corps * 0.85, fS = police(P, { taille: tS, italique: P.italique })
    ctx.font = fS
    const w = ctx.measureText(signature).width
    out.elements.push({ type: 'signature', txt: signature, font: fS, x: Math.max(zone.x, zone.x + zone.l - w), y: zone.y + zone.h, w })
  }
  return out
}

// ── le tracé
function peindre(ctx, mp) {
  const { W, H, u, zone } = mp
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  ctx.fillStyle = mp.fond
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = mp.encre
  ctx.strokeStyle = mp.encre
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  if (mp.cadre) {
    // un double filet dans la marge, sans toucher au texte
    const ins = zone.x * 0.42, gros = Math.max(2, u * 0.35)
    ctx.lineWidth = gros
    ctx.strokeRect(ins, ins, W - 2 * ins, H - 2 * ins)
    ctx.lineWidth = Math.max(1, u * 0.12)
    const ins2 = ins + Math.min(u * 1.1, zone.x * 0.3)
    ctx.strokeRect(ins2, ins2, W - 2 * ins2, H - 2 * ins2)
  }
  for (const e of mp.elements) {
    if (e.type === 'filet') { ctx.fillRect(e.x, e.y, e.l, e.e); continue }
    ctx.font = e.font
    if (e.type === 'glyphe') {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.fillText(e.txt, -e.w / 2, 0); ctx.restore()
    } else if (e.mode === 'vague') {
      // chaque lettre suit une onde ; la phase change d'un vers à l'autre
      const A = e.taille * 0.22, L = e.taille * 9, phase = e.rang * 1.3
      let x = e.x
      for (const g of graphemes(e.txt)) {
        const wg = ctx.measureText(g).width, t = (x + wg / 2 - zone.x) / L * 2 * Math.PI + phase
        ctx.save()
        ctx.translate(x + wg / 2, e.y + A * Math.sin(t))
        ctx.rotate(Math.atan(A * 2 * Math.PI / L * Math.cos(t)))
        ctx.fillText(g, -wg / 2, 0)
        ctx.restore()
        x += wg
      }
    } else if (e.mode === 'tourne' && e.w > 0) {
      // chaque vers penche un peu, à gauche puis à droite ; l'angle reste assez petit
      // pour que les bouts d'un vers ne touchent pas les vers voisins
      const hasard = Math.abs(Math.sin((e.rang + 1) * 12.9898) * 43758.5453) % 1
      const max = Math.min(6 * Math.PI / 180, Math.asin(Math.min(1, 0.33 * e.lh / (e.w / 2 + 1))))
      const angle = (e.rang % 2 ? 1 : -1) * max * (0.55 + 0.45 * hasard)
      ctx.save()
      ctx.translate(e.x + e.w / 2, e.y - e.taille * 0.3)
      ctx.rotate(angle)
      ctx.fillText(e.txt, -e.w / 2, e.taille * 0.3)
      ctx.restore()
    } else {
      ctx.fillText(e.txt, e.x, e.y)
    }
  }
  ctx.restore()
}

// La plus grande taille (pas de 0,1) qui tient dans la page, ou null si même la plus petite déborde
function tailleQuiTient(v, W, H) {
  const ctx = ctxMesure()
  const tient = t => !composer(ctx, W, H, { ...v, taille: t }).deborde
  let bas = 1.5, haut = 10
  if (!tient(bas)) return null
  if (tient(haut)) return haut
  for (let k = 0; k < 14; k++) {
    const milieu = (bas + haut) / 2
    if (tient(milieu)) bas = milieu; else haut = milieu
  }
  return Math.floor(bas * 10) / 10
}

// Tout le texte passe par le filtre des mots refusés, vers par vers, puis d'un seul tenant
// (« banque » en fin de vers et « centrale » au début du suivant)
function chercherRefus({ titre, texte, signature }) {
  for (const morceau of [titre, signature, ...texte.split('\n')]) {
    const t = morceau.trim().replace(/\s+/g, ' ')
    if (!t || !texteRefuse(t)) continue
    if (t.length <= 60) return verifierTexte(t)
    return `« ${t.slice(0, 57)}… » refusé : la banque n'écrit rien qui renvoie à une banque centrale. Elle est le seul émetteur.`
  }
  if (texteRefuse([titre, texte, signature].join(' ').replace(/\s+/g, ' '))) {
    return 'Poème refusé : à cheval sur deux vers, il renvoie à une banque centrale. La banque fantôme est le seul émetteur.'
  }
  return null
}

function miseEnPage(v, W, H) {
  const { titre, texte, signature, ...reste } = v
  return { ...reste, famille: POLICES[v.police].famille.replace(/"/g, ''), largeur: W, hauteur: H }
}

export default function AtelierPoesie({ onValider, enCours = false, libelleValider = '→ Déposer dans ma collection' }) {
  const [brut, setBrut, effacer] = useBrouillon(CLE_BROUILLON, INITIAL)
  const v = useMemo(() => normaliser(brut), [brut])
  const maj = (champ, valeur) => setBrut(b => ({ ...b, [champ]: valeur }))
  const [polices, setPolices] = useState(0)
  const [deborde, setDeborde] = useState(false)
  const [message, setMessage] = useState(null)
  const [envoi, setEnvoi] = useState(false)
  const toileRef = useRef()
  const { l: W, h: H } = FORMATS[v.format]

  const caracteres = useMemo(() => [...new Set(v.titre + v.texte + v.signature)].join(''), [v.titre, v.texte, v.signature])
  const refus = useMemo(() => chercherRefus(v), [v.titre, v.texte, v.signature])
  const { nbVers, nbStrophes } = useMemo(() => {
    const lignes = lignesDuPoeme(v.texte)
    let vers = 0, strophes = 0, dansStrophe = false
    for (const l of lignes) {
      if (l.trim()) { vers++; if (!dansStrophe) { strophes++; dansStrophe = true } } else dansStrophe = false
    }
    return { nbVers: vers, nbStrophes: strophes }
  }, [v.texte])

  // les pastilles de police s'affichent dans leur police : la feuille se charge dès l'ouverture
  useEffect(() => { chargerFeuille().then(() => setPolices(n => n + 1)) }, [])
  useEffect(() => {
    let vivant = true
    chargerPolice(v.police, caracteres).then(() => { if (vivant) setPolices(n => n + 1) })
    return () => { vivant = false }
  }, [v.police, caracteres])

  // l'aperçu : la toile d'export elle-même, redessinée à chaque image
  useEffect(() => {
    const cv = toileRef.current
    if (!cv) return
    const id = requestAnimationFrame(() => {
      if (cv.width !== W) cv.width = W
      if (cv.height !== H) cv.height = H
      const ctx = cv.getContext('2d')
      const mp = composer(ctx, W, H, v)
      peindre(ctx, mp)
      setDeborde(mp.deborde)
    })
    return () => cancelAnimationFrame(id)
  }, [v, W, H, polices])

  function avertir(msg) { setMessage({ type: 'err', msg }) }

  function ajuster() {
    const t = tailleQuiTient(v, W, H)
    if (t === null) avertir('Même au plus petit, le poème déborde. Essayez une page A5, des marges plus étroites ou un interlignage plus serré.')
    else { setMessage(null); maj('taille', t) }
  }

  async function valider() {
    if (!onValider) return
    setMessage(null)
    if (nbVers < 2) { avertir('Écrivez au moins deux vers : la banque ne met pas en vente une page blanche.'); return }
    if (refus) { avertir(refus); return }
    setEnvoi(true)
    try {
      await chargerPolice(v.police, caracteres)
      const cv = document.createElement('canvas')
      cv.width = W; cv.height = H
      const ctx = cv.getContext('2d')
      const mp = composer(ctx, W, H, v)
      if (mp.deborde) { avertir('Le poème déborde de la page : réduisez la taille (bouton sous l’aperçu) avant de le déposer.'); return }
      peindre(ctx, mp)
      const image = await exporterToile(cv)
      const source = { version: 1, titre: v.titre, texte: v.texte, signature: v.signature, mise_en_page: miseEnPage(v, W, H) }
      await onValider({ ...image, source })
      // la mise en page et la signature restent, pour le poème suivant
      setBrut(b => ({ ...b, titre: '', texte: '' }))
      setMessage({ type: 'ok', msg: 'Poème déposé.' })
    } catch (err) {
      avertir(err?.message || 'Le poème n’a pas pu partir.')
    } finally {
      setEnvoi(false)
    }
  }

  const aGauche = v.align === 'gauche' || v.align === 'escalier'
  const cercle = v.forme === 'cercle'
  const fondLibre = v.fond === 'libre'
  const encreLibre = v.encre === 'libre'

  return (
    <div className="poesie">
      <Encart titre="La page est un espace">
        <p>En 1897, Stéphane Mallarmé publie « Un coup de dés jamais n’abolira le hasard » : les mots s’y répartissent sur la page en caractères de tailles différentes, et les blancs comptent autant que le texte.</p>
        <p>En 1918, Guillaume Apollinaire publie <em>Calligrammes</em> : dans certains poèmes, les lettres dessinent ce dont elles parlent. Dans « Il pleut », elles descendent en longues lignes obliques, comme la pluie.</p>
        <p>Dans les années 1950, la poésie concrète (Eugen Gomringer en Suisse, le groupe Noigandres au Brésil) fait de la disposition des mots le poème lui-même. Ici, la taille, l’alignement et le blanc sont vos outils.</p>
      </Encart>

      <div className="poesie-grille">
        <section className="poesie-texte" aria-label="Le poème">
          <div className="field">
            <label htmlFor="poesie-titre">Titre</label>
            <input id="poesie-titre" type="text" maxLength={120} value={v.titre} placeholder="facultatif" onChange={e => maj('titre', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="poesie-vers">Poème</label>
            <textarea id="poesie-vers" rows={10} maxLength={6000} value={v.texte} spellCheck
              placeholder={'Un vers par ligne,\nune ligne vide entre deux strophes.\n\nÀ gauche, des espaces en début de vers\n      le décalent.'}
              onChange={e => maj('texte', e.target.value)} />
            <span className="caption-gris">{nbVers} vers · {nbStrophes} strophe{nbStrophes > 1 ? 's' : ''}</span>
          </div>
          <div className="field">
            <label htmlFor="poesie-signature">Signature</label>
            <input id="poesie-signature" type="text" maxLength={80} value={v.signature} placeholder="facultative" onChange={e => maj('signature', e.target.value)} />
          </div>
          {refus && <p className="msg-err poesie-refus" role="alert">{refus}</p>}
        </section>

        <div className="poesie-apercu">
          <div className={`poesie-page${deborde ? ' deborde' : ''}`} style={{ aspectRatio: `${W} / ${H}`, maxWidth: `calc(72vh * ${(W / H).toFixed(4)})` }}>
            <canvas ref={toileRef} width={W} height={H} className="poesie-toile" role="img"
              aria-label={`Aperçu de la page : ${v.titre.trim() || 'poème sans titre'}`} />
          </div>
          {deborde && (
            <div className="poesie-alerte" role="alert">
              <span>{cercle ? 'Le poème ne tient pas dans le cercle : la fin manque.' : 'Le poème déborde de la page : la fin est coupée.'}</span>
              <button type="button" className="btn btn-noir btn-sm" onClick={ajuster}>Réduire la taille pour tout faire tenir</button>
            </div>
          )}
          <p className="caption-gris poesie-dims">{W} × {H} px · l’aperçu est l’image déposée</p>
        </div>

        <section className="poesie-reglages" aria-label="Mise en page">
          <div className="poesie-groupe">
            <span className="poesie-etiquette">page</span>
            <div className="poesie-puces" role="group" aria-label="Format de la page">
              {Object.entries(FORMATS).map(([id, f]) => (
                <button key={id} type="button" className={`chip${v.format === id ? ' active' : ''}`} aria-pressed={v.format === id} onClick={() => maj('format', id)}>{f.nom}</button>
              ))}
            </div>
          </div>

          <div className="poesie-groupe">
            <span className="poesie-etiquette">police</span>
            <div className="poesie-puces" role="group" aria-label="Police">
              {Object.entries(POLICES).map(([id, p]) => (
                <button key={id} type="button" className={`poesie-police${v.police === id ? ' actif' : ''}`} aria-pressed={v.police === id}
                  style={{ fontFamily: `${p.famille}, ${p.secours}`, fontSize: `${(1.05 * Math.max(1, p.echelle)).toFixed(2)}rem` }} onClick={() => maj('police', id)}>{p.nom}</button>
              ))}
            </div>
          </div>

          {!cercle && (
            <div className="poesie-groupe">
              <span className="poesie-etiquette">alignement</span>
              <div className="poesie-puces" role="group" aria-label="Alignement">
                {ALIGNEMENTS.map(([id, nom]) => (
                  <button key={id} type="button" className={`chip${v.align === id ? ' active' : ''}`} aria-pressed={v.align === id} onClick={() => maj('align', id)}>{nom}</button>
                ))}
              </div>
            </div>
          )}

          <div className="poesie-curseurs">
            <label className="poesie-curseur">
              <span>taille <output>{v.taille.toFixed(1)}</output></span>
              <input type="range" min="1.5" max="10" step="0.1" value={v.taille} onChange={e => maj('taille', Number(e.target.value))} />
            </label>
            <label className="poesie-curseur">
              <span>interlignage <output>{v.interligne.toFixed(2)}</output></span>
              <input type="range" min="1" max="2.5" step="0.05" value={v.interligne} onChange={e => maj('interligne', Number(e.target.value))} />
            </label>
            <label className="poesie-curseur">
              <span>marges <output>{Math.round(v.marge)} %</output></span>
              <input type="range" min="3" max="20" step="0.5" value={v.marge} onChange={e => maj('marge', Number(e.target.value))} />
            </label>
          </div>
          <div className="poesie-puces">
            <button type="button" className="btn btn-outline btn-sm" onClick={ajuster}>↕ Remplir la page</button>
            {!cercle && (
              <>
                <button type="button" className={`chip${v.placement === 'haut' ? ' active' : ''}`} aria-pressed={v.placement === 'haut'} onClick={() => maj('placement', 'haut')}>en haut</button>
                <button type="button" className={`chip${v.placement === 'milieu' ? ' active' : ''}`} aria-pressed={v.placement === 'milieu'} onClick={() => maj('placement', 'milieu')}>au milieu</button>
              </>
            )}
          </div>

          <div className="poesie-groupe">
            <span className="poesie-etiquette">fond</span>
            <div className="poesie-puces" role="group" aria-label="Fond">
              {Object.entries(FONDS).map(([id, f]) => (
                <button key={id} type="button" className={`poesie-pastille${v.fond === id ? ' actif' : ''}`} style={{ background: f.c }}
                  title={f.nom} aria-label={f.nom} aria-pressed={v.fond === id} onClick={() => maj('fond', id)} />
              ))}
              <label className={`poesie-pastille poesie-pipette${fondLibre ? ' actif' : ''}`} title="couleur libre" style={fondLibre ? { background: v.couleurFond } : undefined}>
                <input type="color" value={v.couleurFond} aria-label="Couleur de fond libre" onChange={e => setBrut(b => ({ ...b, fond: 'libre', couleurFond: e.target.value }))} />
              </label>
            </div>
          </div>

          <div className="poesie-groupe">
            <span className="poesie-etiquette">encre</span>
            <div className="poesie-puces" role="group" aria-label="Couleur du texte">
              <button type="button" className={`chip${v.encre === 'auto' ? ' active' : ''}`} aria-pressed={v.encre === 'auto'} onClick={() => maj('encre', 'auto')}>auto</button>
              {ENCRES.map(([c, nom]) => (
                <button key={c} type="button" className={`poesie-pastille${v.encre === c ? ' actif' : ''}`} style={{ background: c }}
                  title={nom} aria-label={nom} aria-pressed={v.encre === c} onClick={() => maj('encre', c)} />
              ))}
              <label className={`poesie-pastille poesie-pipette${encreLibre ? ' actif' : ''}`} title="couleur libre" style={encreLibre ? { background: v.couleurEncre } : undefined}>
                <input type="color" value={v.couleurEncre} aria-label="Couleur de texte libre" onChange={e => setBrut(b => ({ ...b, encre: 'libre', couleurEncre: e.target.value }))} />
              </label>
            </div>
          </div>

          <div className="poesie-groupe">
            <span className="poesie-etiquette">ornements</span>
            <div className="poesie-puces" role="group" aria-label="Ornements">
              {!cercle && <button type="button" className={`chip${v.filet ? ' active' : ''}`} aria-pressed={v.filet} onClick={() => maj('filet', !v.filet)}>filet</button>}
              {!cercle && <button type="button" className={`chip${v.lettrine ? ' active' : ''}`} aria-pressed={v.lettrine} onClick={() => maj('lettrine', !v.lettrine)}>lettrine</button>}
              <button type="button" className={`chip${v.cadre ? ' active' : ''}`} aria-pressed={v.cadre} onClick={() => maj('cadre', !v.cadre)}>cadre</button>
            </div>
            {v.lettrine && !aGauche && !cercle && <span className="caption-gris">La lettrine demande un alignement à gauche ou en escalier.</span>}
          </div>

          <div className="poesie-groupe">
            <span className="poesie-etiquette">calligramme</span>
            <div className="poesie-puces" role="group" aria-label="Forme du texte">
              {FORMES.map(([id, nom]) => (
                <button key={id || 'aucune'} type="button" className={`chip${v.forme === id ? ' active' : ''}`} aria-pressed={v.forme === id} onClick={() => maj('forme', id)}>{nom}</button>
              ))}
            </div>
            {cercle && <span className="caption-gris">Les vers se suivent en anneaux, de l’extérieur vers le centre, dans le sens des aiguilles d’une montre ; le titre se pose au milieu.</span>}
          </div>
        </section>
      </div>

      {message && <p className={message.type === 'err' ? 'msg-err' : 'msg-ok'} role="status">{message.msg}</p>}

      <PiedAtelier onEffacer={() => { effacer(); setMessage(null) }} onValider={valider} enCours={enCours || envoi} libelleValider={libelleValider} />
    </div>
  )
}
