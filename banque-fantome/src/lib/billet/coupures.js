// Les coupures de la machine à bifton (machine_a_bifton.py, COUPURES), en mm, et la
// couleur de chacune. Un ton uni choisi à l'atelier, pas la couleur d'un vrai billet.
export const COUPURES = {
  5:   { l: 120, h: 62, nom: 'gris',       rgb: [0x9E, 0xA3, 0xA8] },
  10:  { l: 127, h: 67, nom: 'rouge',      rgb: [0xD2, 0x6A, 0x63] },
  20:  { l: 133, h: 72, nom: 'bleu',       rgb: [0x5F, 0x8F, 0xC0] },
  50:  { l: 140, h: 77, nom: 'orange',     rgb: [0xEA, 0xA4, 0x4E] },
  100: { l: 147, h: 77, nom: 'vert',       rgb: [0x6F, 0xAB, 0x6C] },
  200: { l: 153, h: 77, nom: 'jaune-brun', rgb: [0xD8, 0xB2, 0x58] },
  500: { l: 160, h: 82, nom: 'violet',     rgb: [0x8F, 0x6E, 0xB0] },
}
export const VALEURS_COUPURES = [5, 10, 20, 50, 100, 200, 500]

// ── conversions, comme colorsys en Python (h, l, s entre 0 et 1)
export function rgbHls([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const maxc = Math.max(r, g, b), minc = Math.min(r, g, b), l = (minc + maxc) / 2
  if (minc === maxc) return [0, l, 0]
  const d = maxc - minc
  const s = l <= 0.5 ? d / (maxc + minc) : d / (2 - maxc - minc)
  const rc = (maxc - r) / d, gc = (maxc - g) / d, bc = (maxc - b) / d
  let h = r === maxc ? bc - gc : g === maxc ? 2 + rc - bc : 4 + gc - rc
  h = ((h / 6) % 1 + 1) % 1
  return [h, l, s]
}

function canal(m1, m2, t) {
  t = ((t % 1) + 1) % 1
  if (t < 1 / 6) return m1 + (m2 - m1) * t * 6
  if (t < 0.5) return m2
  if (t < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - t) * 6
  return m1
}

const borne01 = x => Math.max(0, Math.min(1, x))

export function hlsRgb([h, l, s]) {
  h = ((h % 1) + 1) % 1; l = borne01(l); s = borne01(s)
  if (s === 0) return [l, l, l].map(v => Math.round(v * 255))
  const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s, m1 = 2 * l - m2
  return [canal(m1, m2, h + 1 / 3), canal(m1, m2, h), canal(m1, m2, h - 1 / 3)].map(v => Math.round(v * 255))
}

export const rgbHex = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')

// k < 0 : vers le blanc (k = -0.55 : 55 % plus clair) ; k > 0 : vers le noir (teinte() de la machine)
export function teinte(rgb, k) {
  return rgbHex(rgb.map(v => k < 0 ? v + (255 - v) * -k : v * (1 - k)))
}

// ── les tons du billet : une couleur écrite comme un mot, calculée d'après la coupure.
// Un même dessin en « ton-fonce » sort bleu sur un 20 et rouge sur un 10.
export const TONS = {
  'ton':         (h, l, s) => [h, l, s],
  'ton-fonce':   (h, l, s) => [h, l * 0.45, s],
  'ton-clair':   (h, l, s) => [h, l + (1 - l) * 0.6, s],
  'ton-vif':     (h, l, s) => [h, 0.5, Math.min(1, s * 1.8 + 0.2)],
  'ton-sourd':   (h, l, s) => [h, l, s * 0.35],
  'ton-voisin':  (h, l, s) => [h + 1 / 12, l, s],
  'ton-voisin2': (h, l, s) => [h - 1 / 12, l, s],
  'ton-oppose':  (h, l, s) => [h + 0.5, l, s],
}

// « #rrggbb », ou un mot de TONS : rend toujours un #rrggbb
export function couleurTon(mot, coupure) {
  if (!mot) return '#1a1a1a'
  if (!mot.startsWith('ton')) return mot
  const f = TONS[mot]
  if (!f) return '#1a1a1a'
  return rgbHex(hlsRgb(f(...rgbHls(COUPURES[coupure].rgb))))
}

export function avecAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
