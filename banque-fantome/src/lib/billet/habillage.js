import { COUPURES, TONS, teinte, couleurTon, avecAlpha, rgbHls, hlsRgb, rgbHex } from './coupures'

// L'habillage du billet, porté de habiller() dans machine_a_bifton.py (mode habillé) :
// fond éclairci, cadre, guillochis à gauche, montant, émetteur, mention, numéro,
// signature, drapeau. La moitié droite reste libre pour le dessin.
// Tout se calcule en mm dans le repère de la machine (origine en bas à gauche, y vers le
// haut) : un dessin fait ici reste imprimable par la machine sans conversion.
// Rien de l'euro : ni ses mots, ni ses sigles, ni son cercle d'étoiles, ni ses ponts.

const PT = 25.4 / 72                     // un point typographique, en mm
const POLICE_CHIFFRES = '"Bebas Neue", "DM Sans", sans-serif'
const POLICE_TEXTE = '"DM Sans", sans-serif'
export const EMETTEUR = 'banque fantôme'
export const LIEU = 'agence en ligne · jeansonpechin.com'
export const MENTION = 'aucune réserve détenue · aucun cours légal · le registre fait foi'

// ── le hasard : une graine donne toujours le même billet
function hacher(s) {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

function mulberry32(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hasard(graine) {
  const r = mulberry32(hacher(String(graine)))
  return {
    random: r,
    uniform: (a, b) => a + (b - a) * r(),
    choice: liste => liste[Math.floor(r() * liste.length)],
  }
}

export function nouvelleGraine() {
  try { return crypto.getRandomValues(new Uint32Array(1))[0] }
  catch { return Math.floor(Math.random() * 4294967296) }
}

// Quatre caractères, chiffres et majuscules : le numéro de série du billet
export function numeroDepuisGraine(graine) {
  return (hacher(`numero-${graine}`) % 36 ** 4).toString(36).toUpperCase().padStart(4, '0')
}

// Les polices viennent de Google Fonts : sans elles, le canvas écrirait en police de secours
export async function chargerPolices() {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.all(['400 40px "Bebas Neue"', '400 40px "DM Sans"', '700 40px "DM Sans"'].map(f => document.fonts.load(f)))
    await document.fonts.ready
  } catch { /* la police de secours fera l'affaire */ }
}

// ── outils de tracé, dans le repère mm (le contexte est déjà retourné)
function versRepereMm(ctx, k, h) {
  ctx.scale(k, -k)
  ctx.translate(0, -h)
}

// Le texte se pose à l'endroit : on revient en pixels, y vers le bas, juste pour lui
function ecrire(ctx, k, texte, x, y, { taille, police = POLICE_TEXTE, poids = 400, couleur, alpha = 1, align = 'left', retourne = false }) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(1 / k, -1 / k)
  if (retourne) ctx.rotate(Math.PI)
  ctx.font = `${poids} ${taille * k}px ${police}`
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = couleur
  ctx.globalAlpha = alpha
  ctx.fillText(texte, 0, 0)
  ctx.restore()
}

function mesurer(ctx, k, texte, taille, police = POLICE_TEXTE, poids = 400) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.font = `${poids} ${taille * k}px ${police}`
  const w = ctx.measureText(texte).width / k
  ctx.restore()
  return w
}

function hypotrochoide(cx, cy, R, r, d, tours, pas = 48) {
  const n = Math.floor(tours * pas), pts = []
  for (let i = 0; i <= n; i++) {
    const t = i * (2 * Math.PI * tours) / n
    pts.push([cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t),
              cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)])
  }
  return pts
}

// Le « stylo » des motifs : épaisseurs en points comme reportlab, un plancher pour l'écran
function stylo(ctx, k) {
  const min = 0.6 / k
  return {
    trait(pt) { ctx.lineWidth = Math.max(pt * PT, min) },
    encre(couleur, alpha = 1) { ctx.strokeStyle = avecAlpha(couleur, alpha) },
    trace(pts) {
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.stroke()
    },
    ligne(x1, y1, x2, y2) { this.trace([[x1, y1], [x2, y2]]) },
    rect(x, y, w, hh) { ctx.strokeRect(x, y, w, hh) },
    etoile(cx, cy, r, couleur, alpha = 0.7) {
      ctx.fillStyle = avecAlpha(couleur, alpha)
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r
        const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a)
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    },
  }
}

// ── les guillochis (STYLES de la machine), dans la moitié gauche
const alphaDe = (contraste, bas, normal) => (contraste === 'bas' ? bas : normal)

const MOTIFS = {
  rosace(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const cx = l * 0.21, cy = h * 0.44, base = Math.min(l * 0.15, h * 0.26)
    s.trait(0.12)
    for (let i = 0; i <= dens; i++) {
      const R = base * rnd.uniform(0.6, 1.0), r = R * rnd.uniform(0.14, 0.34), d = r * rnd.uniform(0.5, 1.3)
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.28, 0.55))
      s.trace(hypotrochoide(cx, cy, R, r, d, rnd.choice([7, 9, 11, 13])))
    }
    s.trait(0.2)
    for (let i = 0; i < 3; i++) {
      const R = base * 0.42 * (1 - i * 0.2)
      s.encre(i % 2 ? ton : fonce, 0.6)
      s.trace(hypotrochoide(cx, cy, R, R * 0.22, R * 0.2, 11))
    }
    if (etoiles) for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6 + Math.PI / 12
      s.etoile(cx + base * Math.cos(a), cy + base * Math.sin(a), 1.1, ton)
    }
  },

  bandes(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const x0 = l * 0.07, x1 = l * 0.5, y0 = h * 0.16, y1 = h * 0.82, n = 4 + dens * 3
    s.trait(0.12)
    for (let i = 0; i < n; i++) {
      const y = y0 + (y1 - y0) * i / Math.max(1, n - 1)
      const amp = rnd.uniform(1.5, 4.5), freq = rnd.uniform(2.2, 4.2), phase = rnd.uniform(0, 6.28)
      const pts = []
      for (let j = 0; j <= 60; j++) {
        const xx = x0 + (x1 - x0) * j / 60
        pts.push([xx, y + amp * Math.sin(freq * (xx - x0) / (x1 - x0) * 2 * Math.PI + phase)])
      }
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.28, 0.55))
      s.trace(pts)
    }
    const cx = x1 - (x1 - x0) * 0.06, cy = (y0 + y1) / 2, R = Math.min(x1 - x0, y1 - y0) * 0.16
    s.trait(0.16); s.encre(fonce, 0.5)
    s.trace(hypotrochoide(cx, cy, R, R * 0.3, R * 0.22, 9))
    if (etoiles) for (let k = 0; k < 7; k++) s.etoile(x0 + (x1 - x0) * (k + 0.5) / 7, y0 - (y1 - y0) * 0.06, 0.9, ton)
  },

  cadre(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const x0 = l * 0.06, x1 = l * 0.5, y0 = h * 0.14, y1 = h * 0.84
    s.trait(0.15)
    for (let i = 0; i <= dens; i++) {
      const m = 1.2 + i * 1.6
      if (x1 - x0 - 2 * m <= 0 || y1 - y0 - 2 * m <= 0) continue
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.3, 0.6))
      s.rect(x0 + m, y0 + m, x1 - x0 - 2 * m, y1 - y0 - 2 * m)
    }
    const R = Math.min(x1 - x0, y1 - y0) * 0.09
    for (const [cx, cy] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
      s.trait(0.16); s.encre(fonce, 0.55)
      s.trace(hypotrochoide(cx, cy, R, R * 0.32, R * 0.24, rnd.choice([7, 9])))
      if (etoiles) s.etoile(cx, cy, 1.0, ton)
    }
  },

  diagonale(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const x0 = l * 0.08, y0 = h * 0.14, x1 = l * 0.48, y1 = h * 0.82, n = 2 + dens
    s.trait(0.14)
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t
      const R = Math.min(x1 - x0, y1 - y0) * rnd.uniform(0.10, 0.16), r = R * rnd.uniform(0.2, 0.4), d = r * rnd.uniform(0.5, 1.2)
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.32, 0.6))
      s.trace(hypotrochoide(cx, cy, R, r, d, rnd.choice([7, 9, 11])))
    }
    if (etoiles) for (let i = 0; i < 6; i++) {
      const t = rnd.uniform(0.05, 0.95)
      const cx = Math.min(Math.max(x0 + (x1 - x0) * t + rnd.uniform(-4, 4), x0), x1)
      const cy = Math.min(Math.max(y0 + (y1 - y0) * t + rnd.uniform(-4, 4), y0), y1)
      s.etoile(cx, cy, 0.9, ton)
    }
  },

  spirale(s, l, h, ton, fonce, dens, contraste, etoiles) {
    const cx = l * 0.24, cy = h * 0.46, rmax = Math.min(l * 0.2, h * 0.34), tmax = 2 * Math.PI * (5 + dens)
    for (const [sens, larg, coul, dec] of [[1, 0.16, ton, 0], [-1, 0.12, fonce, 0.35]]) {
      const pts = []
      for (let t = 0; t <= tmax; t += 0.15) {
        const r = rmax * t / tmax, a = sens * t + dec
        pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
      }
      s.trait(larg); s.encre(coul, alphaDe(contraste, 0.3, 0.58))
      s.trace(pts)
    }
    if (etoiles) for (let k = 0; k < 8; k++) {
      const t = (k + 0.5) / 8 * tmax, r = rmax * t / tmax
      s.etoile(cx + r * Math.cos(t), cy + r * Math.sin(t), 0.85, ton)
    }
  },

  losanges(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const cx = l * 0.22, cy = h * 0.46, base = Math.min(l * 0.16, h * 0.3), n = 4 + dens * 2
    s.trait(0.13)
    for (let i = 0; i < n; i++) {
      const rr = base * (i + 1) / n, ang = rnd.uniform(0, Math.PI / 4)
      const pts = Array.from({ length: 5 }, (_, k) => [cx + rr * Math.cos(ang + k * Math.PI / 2), cy + rr * Math.sin(ang + k * Math.PI / 2)])
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.3, 0.58))
      s.trace(pts)
    }
    s.trait(0.18); s.encre(fonce, 0.55)
    s.trace(hypotrochoide(cx, cy, base * 0.22, base * 0.07, base * 0.06, 9))
    if (etoiles) for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4
      s.etoile(cx + base * 1.05 * Math.cos(a), cy + base * 1.05 * Math.sin(a), 1.0, ton)
    }
  },

  eventail(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const ox = l * 0.06, oy = h * 0.1, n = 10 + dens * 6, rmax = Math.min(l * 0.46, h * 0.85)
    const a0 = Math.PI * 0.04, etendue = Math.PI * 0.42
    s.trait(0.12)
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / Math.max(1, n - 1)) * etendue, r = rmax * rnd.uniform(0.75, 1.0)
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.3, 0.58))
      s.ligne(ox, oy, ox + r * Math.cos(a), oy + r * Math.sin(a))
    }
    const nbArcs = 2 + Math.floor(dens / 2)
    for (let k = 0; k < nbArcs; k++) {
      const rr = rmax * (k + 1) / (nbArcs + 1)
      s.encre(fonce, 0.35)
      s.trace(Array.from({ length: 40 }, (_, i) => [ox + rr * Math.cos(a0 + (i / 39) * etendue), oy + rr * Math.sin(a0 + (i / 39) * etendue)]))
    }
    if (etoiles) for (let k = 0; k < 6; k++) {
      const a = a0 + (k + 0.5) / 6 * etendue
      s.etoile(ox + rmax * 0.9 * Math.cos(a), oy + rmax * 0.9 * Math.sin(a), 0.85, ton)
    }
  },

  constellation(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const x0 = l * 0.06, x1 = l * 0.5, y0 = h * 0.14, y1 = h * 0.84, n = 4 + dens * 2, points = []
    s.trait(0.13)
    for (let i = 0; i < n; i++) {
      const cx = rnd.uniform(x0, x1), cy = rnd.uniform(y0, y1)
      points.push([cx, cy])
      const R = Math.min(x1 - x0, y1 - y0) * rnd.uniform(0.05, 0.13)
      s.encre(rnd.random() < 0.5 ? ton : fonce, alphaDe(contraste, 0.3, 0.58))
      s.trace(hypotrochoide(cx, cy, R, R * rnd.uniform(0.2, 0.4), R * rnd.uniform(0.15, 0.3), rnd.choice([5, 7, 9])))
    }
    s.trait(0.1); s.encre(fonce, alphaDe(contraste, 0.25, 0.45))
    const ordre = [...points].sort((a, b) => a[0] - b[0])
    for (let i = 0; i < ordre.length - 1; i++) s.ligne(...ordre[i], ...ordre[i + 1])
    if (etoiles) points.slice(0, 8).forEach(([cx, cy]) => s.etoile(cx, cy, 0.8, ton))
  },

  chevrons(s, l, h, ton, fonce, dens, contraste, etoiles, rnd) {
    const x0 = l * 0.06, x1 = l * 0.5, y0 = h * 0.12, y1 = h * 0.86, n = 5 + dens * 3, pas = rnd.uniform(6, 10)
    s.trait(0.12)
    for (let i = 0; i < n; i++) {
      const y = y0 + (y1 - y0) * i / Math.max(1, n - 1), amp = rnd.uniform(2.5, 5.5), pts = []
      let monte = true
      for (let xx = x0; xx <= x1; xx += pas) { pts.push([xx, y + (monte ? amp : -amp)]); monte = !monte }
      s.encre(i % 2 ? fonce : ton, alphaDe(contraste, 0.28, 0.55))
      s.trace(pts)
    }
    if (etoiles) for (let k = 0; k < 5; k++) s.etoile(x0 + (x1 - x0) * (k + 0.5) / 5, (y0 + y1) / 2, 0.85, ton)
  },
}
export const STYLES = Object.keys(MOTIFS)

// ── les cadres (BORDURES_TOUTES, sauf « aucune »)
const BORDURES = {
  double(ctx, s, l, h, m) {
    s.trait(0.5); s.rect(m, m, l - 2 * m, h - 2 * m)
    s.trait(0.18); s.rect(m + 1.2, m + 1.2, l - 2 * m - 2.4, h - 2 * m - 2.4)
  },
  simple(ctx, s, l, h, m) { s.trait(0.45); s.rect(m, m, l - 2 * m, h - 2 * m) },
  arrondie(ctx, s, l, h, m) {
    if (!ctx.roundRect) return BORDURES.double(ctx, s, l, h, m)   // navigateurs d'avant 2023
    const r = Math.min(l, h) * 0.045
    s.trait(0.4); ctx.beginPath(); ctx.roundRect(m, m, l - 2 * m, h - 2 * m, r); ctx.stroke()
    s.trait(0.16); ctx.beginPath(); ctx.roundRect(m + 1.2, m + 1.2, l - 2 * m - 2.4, h - 2 * m - 2.4, Math.max(r - 1, 0.5)); ctx.stroke()
  },
  triple(ctx, s, l, h, m) {
    [0.5, 0.18, 0.12].forEach((ep, i) => { const d = m + i * 1.1; s.trait(ep); s.rect(d, d, l - 2 * d, h - 2 * d) })
  },
  pointillee(ctx, s, l, h, m) {
    ctx.save(); ctx.setLineDash([0.8, 0.9]); s.trait(0.4); s.rect(m, m, l - 2 * m, h - 2 * m); ctx.restore()
  },
  ondulee(ctx, s, l, h, m) {
    const amp = 0.45, onde = 3.2
    s.trait(0.25)
    for (const [[xa, ya], [xb, yb]] of [[[m, m], [l - m, m]], [[l - m, m], [l - m, h - m]], [[l - m, h - m], [m, h - m]], [[m, h - m], [m, m]]]) {
      const long = Math.hypot(xb - xa, yb - ya), ux = (xb - xa) / long, uy = (yb - ya) / long, n = Math.max(8, Math.floor(long * 4))
      s.trace(Array.from({ length: n + 1 }, (_, i) => {
        const d = long * i / n, o = amp * Math.sin(2 * Math.PI * d / onde)
        return [xa + ux * d - uy * o, ya + uy * d + ux * o]
      }))
    }
    s.trait(0.15); s.rect(m + 1.4, m + 1.4, l - 2 * m - 2.8, h - 2 * m - 2.8)
  },
}

// ── le drapeau de la banque : des bandes, une croix, un damier. Jamais de cercle d'étoiles.
function drapeau(ctx, s, motif, cols, cx, cy, w, encre) {
  const hh = w * 2 / 3, col = i => cols[i % cols.length]
  const pave = (x, y, lw, lh, i) => { ctx.fillStyle = col(i); ctx.fillRect(x, y, lw, lh) }
  ctx.save()
  ctx.translate(cx - w / 2, cy - hh / 2)
  if (motif === 'deux-bandes') { pave(0, hh / 2, w, hh / 2, 0); pave(0, 0, w, hh / 2, 1) }
  else if (motif === 'trois-bandes') for (let k = 0; k < 3; k++) pave(0, hh - (k + 1) * hh / 3, w, hh / 3, k)
  else if (motif === 'verticales') for (let k = 0; k < 3; k++) pave(k * w / 3, 0, w / 3, hh, k)
  else if (motif === 'diagonale') {
    pave(0, 0, w, hh, 1)
    ctx.fillStyle = col(0); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, hh); ctx.lineTo(w, hh); ctx.closePath(); ctx.fill()
  } else if (motif === 'damier') {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) pave(i * w / 6, j * hh / 4, w / 6 + 0.02, hh / 4 + 0.02, (i + j) % 2)
  }
  s.trait(0.2 / PT); s.encre(encre, 1); s.rect(0, 0, w, hh)
  ctx.restore()
}
const DRAPEAUX = ['deux-bandes', 'trois-bandes', 'verticales', 'diagonale', 'damier']

// Dessine le billet habillé dans ctx, en partant de l'origine courante du contexte,
// sur l × h mm à pxParMm pixels par mm. Ne touche à rien d'autre (save / restore).
export function dessinerHabillage(ctx, { coupure, graine, numero, pxParMm }) {
  const spec = COUPURES[coupure], { l, h, rgb } = spec, k = pxParMm
  const rnd = hasard(`${coupure}-${graine}`)
  const ton = teinte(rgb, 0)
  const fonce = teinte(rgb, 0.45 + rnd.uniform(-0.08, 0.08))
  const m = 2.2

  ctx.save()
  versRepereMm(ctx, k, h)
  ctx.beginPath(); ctx.rect(0, 0, l, h); ctx.clip()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const s = stylo(ctx, k)

  // fond : le ton de la coupure éclairci (--fond 0.55), et parfois un liseré de papier nu
  ctx.fillStyle = teinte(rgb, -0.55)
  ctx.fillRect(0, 0, l, h)
  if (rnd.random() < 0.4) {
    ctx.fillStyle = '#ffffff'
    const li = rnd.uniform(0.8, 1.6)
    ctx.beginPath(); ctx.rect(0, 0, l, h); ctx.rect(li, li, l - 2 * li, h - 2 * li); ctx.fill('evenodd')
  }

  // cadre
  s.encre(ton, 1)
  BORDURES[rnd.choice(Object.keys(BORDURES))](ctx, s, l, h, m)

  // guillochis : un style, parfois deux empilés, chacun son hasard
  const dens = rnd.choice([1, 2, 2, 3]), contraste = rnd.choice(['bas', 'normal'])
  const styles = [rnd.choice(STYLES)]
  if (rnd.random() < 0.35) styles.push(rnd.choice(STYLES.filter(n => n !== styles[0])))
  styles.forEach((nom, i) => MOTIFS[nom](s, l, h, ton, fonce, dens, contraste, i === 0, i === 0 ? rnd : hasard(`${coupure}-${graine}-motif-${i}`)))

  // drapeau, en haut à gauche. Le bleu et jaune de la machine seulement en damier ou en
  // diagonale : en bandes il refait l'Ukraine ou la Barbade. Sinon des nuances d'une seule
  // teinte, qu'aucun pays n'a pour drapeau. Pas de croix : elle devient vite nordique.
  // Pas de teinte presque blanche dans les bandes (2026-10-19) : foncé / clair / foncé
  // refaisait le Nigeria sur le 100, le Pérou ou l'Autriche sur le 10, la Pologne en deux bandes.
  const motifDrapeau = rnd.choice(DRAPEAUX)
  const bandes = [[fonce, teinte(rgb, -0.25), ton], [teinte(rgb, 0.25), ton, teinte(rgb, -0.3)]]
  const camaieux = [[fonce, couleurTon('ton-clair', coupure)], [couleurTon('ton-fonce', coupure), couleurTon('ton-clair', coupure), couleurTon('ton-vif', coupure)]]
  const cols = rnd.choice(['damier', 'diagonale'].includes(motifDrapeau) ? [['#0b2a7a', '#ffd400'], ...camaieux] : bandes)
  drapeau(ctx, s, motifDrapeau, cols, l * 0.12, h * 0.8, 13, fonce)

  // montant centré en haut, devise à 42 %, et son écho retourné en bas
  const texteValeur = String(coupure)
  const corps = h * 0.26
  const lv = mesurer(ctx, k, texteValeur, corps, POLICE_CHIFFRES)
  const le = mesurer(ctx, k, '€', corps * 0.42)
  const total = lv + 1.2 + le
  const x0 = (l - total) / 2 + rnd.uniform(-2, 2)
  const y0 = (h - m - 2.2) - corps * 0.72 + rnd.uniform(-1.5, 1.5)
  ecrire(ctx, k, texteValeur, x0, y0, { taille: corps, police: POLICE_CHIFFRES, couleur: fonce })
  ecrire(ctx, k, '€', x0 + lv + 1.2, y0, { taille: corps * 0.42, couleur: fonce })
  const corpsMiroir = corps * 0.6, lm = mesurer(ctx, k, texteValeur, corpsMiroir, POLICE_CHIFFRES)
  // retourné, le texte pend sous sa ligne de base : on la remonte de la hauteur des chiffres
  ecrire(ctx, k, texteValeur, l / 2 + lm / 2, m + 2.2 + corpsMiroir * 0.72, { taille: corpsMiroir, police: POLICE_CHIFFRES, couleur: fonce, alpha: 0.35, retourne: true })

  // émetteur et lieu, en haut à droite
  const xe = l - m - 2.5
  ecrire(ctx, k, EMETTEUR, xe, h - m - 5.2, { taille: 9 * PT, poids: 700, couleur: fonce, align: 'right' })
  ecrire(ctx, k, LIEU, xe, h - m - 8.2, { taille: 4.3 * PT, couleur: fonce, align: 'right' })

  // mention, numéro, signature, en bas
  ecrire(ctx, k, MENTION, m + 2.5, m + 1.9, { taille: 3.8 * PT, couleur: ton })
  ecrire(ctx, k, `n° BF-${coupure}-${numero}`, m + 2.5, m + 5.2, { taille: 4.3 * PT, couleur: fonce })
  // la ligne part juste après le petit montant retourné, comme dans la machine
  const xs0 = Math.max(l * 0.54, l / 2 + lm / 2 + 2), xs1 = Math.max(xs0 + 20, l - m - 2.5)
  s.trait(0.25); s.encre(fonce, 1); s.ligne(xs0, m + 5.0, xs1, m + 5.0)
  ecrire(ctx, k, 'signature', xs0, m + 1.9, { taille: 3.8 * PT, couleur: fonce })

  ctx.restore()
}

// ── le dessin à main levée, comme dessiner() de la machine : une liste de traits en mm
// {o: crayon|trait|rect|ellipse|texte, p: [[x, y]…], c, e (mm), a, f, t, s (points), g}
export function dessinerTraits(ctx, traits, { coupure, pxParMm }) {
  const { l, h } = COUPURES[coupure]
  tracerTraits(ctx, traits, l, h, pxParMm, c => couleurTon(c, coupure))
}

// La même chose sur une toile libre (atelier Paint, 2026-10-19) : pas de coupure, le format
// est donné en mm. Un mot de ton s'y calcule d'après la couleur du fond.
export function dessinerTraitsToile(ctx, traits, { l, h, pxParMm, fond = '#ffffff' }) {
  tracerTraits(ctx, traits, l, h, pxParMm, c => tonRelatif(c, fond))
}

const hexRgb = hex => {
  const n = parseInt(String(hex).slice(1, 7), 16)
  return Number.isNaN(n) ? [255, 255, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// « #rrggbb », ou un mot de TONS calculé d'après une couleur quelconque (#rrggbb)
export function tonRelatif(mot, base) {
  if (!mot) return '#1a1a1a'
  if (!mot.startsWith('ton')) return mot
  const f = TONS[mot]
  if (!f) return '#1a1a1a'
  return rgbHex(hlsRgb(f(...rgbHls(hexRgb(base)))))
}

function tracerTraits(ctx, traits, l, h, k, resoudre) {
  ctx.save()
  versRepereMm(ctx, k, h)
  ctx.beginPath(); ctx.rect(0, 0, l, h); ctx.clip()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const t of traits) {
    const col = resoudre(t.c || '#1a1a1a'), a = t.a ?? 1, e = Number(t.e ?? 0.5), p = t.p || []
    if (!p.length) continue
    ctx.globalAlpha = a
    ctx.strokeStyle = ctx.fillStyle = col
    ctx.lineWidth = Math.max(e, 0.5 / k)
    if (t.o === 'crayon' || t.o === 'trait') {
      ctx.beginPath()
      if (p.length === 1) { ctx.arc(p[0][0], p[0][1], Math.max(e / 2, 0.3 / k), 0, 2 * Math.PI); ctx.fill(); continue }
      p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      if (t.f && p.length > 2) { ctx.closePath(); ctx.fill() }
      ctx.stroke()
    } else if ((t.o === 'rect' || t.o === 'ellipse') && p.length >= 2) {
      const [x1, y1] = p[0], [x2, y2] = p[p.length - 1]
      ctx.beginPath()
      if (t.o === 'rect') ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1))
      else ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, 2 * Math.PI)
      t.f ? ctx.fill() : ctx.stroke()
    } else if (t.o === 'texte' && t.t) {
      ecrire(ctx, k, t.t, p[0][0], p[0][1], { taille: Number(t.s || 8) * PT, poids: t.g ? 700 : 400, couleur: col, alpha: a })
    }
  }
  ctx.restore()
}
