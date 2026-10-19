import { COUPURES } from './coupures'
import { dessinerHabillage, dessinerTraits, chargerPolices } from './habillage'

// Planche A4 d'un billet dessiné dans l'atelier (2026-10-19, demande de Jiiji : « chaque
// billet dessiné dans la bourse doit se retrouver en PDF A4 dans S'enrichir »).
// Le billet est refait depuis sa trace (habillage + traits, vectoriels) à 300 dpi, pas
// depuis l'image de la bourse, puis posé à taille réelle autant de fois que la feuille
// le permet, comme les planches de machine_a_bifton.py : 6 billets de 5, 4 de 10 à 50,
// 3 de 100 à 500. Le PDF est écrit à la main (une image JPEG reprise N fois), sans
// bibliothèque : rien de plus à télécharger pour le reste du site.

const MM = 72 / 25.4            // points PDF par mm
const A4 = { l: 210, h: 297 }
const MARGE = 6                 // mm : ce que la plupart des imprimantes laissent blanc
const PX_PAR_MM = 300 / 25.4    // 300 dpi
const REPERE = 4                // mm : longueur des traits de coupe

// Grille la plus remplie, en portrait ou en paysage, billets bord à bord (une coupe sert deux billets)
export function disposition(coupure) {
  const { l, h } = COUPURES[coupure]
  const essais = [false, true].map(paysage => {
    const W = paysage ? A4.h : A4.l, H = paysage ? A4.l : A4.h
    const cols = Math.floor((W - 2 * MARGE) / l), rangs = Math.floor((H - 2 * MARGE) / h)
    return { paysage, W, H, cols, rangs, n: cols * rangs }
  })
  return essais.sort((a, b) => b.n - a.n || (a.paysage ? 1 : -1))[0]
}

// Le billet en image, refait depuis sa trace
export async function rendreBillet(trace, pxParMm = PX_PAR_MM) {
  const { coupure, graine, numero, dessin } = trace
  const { l, h } = COUPURES[coupure]
  await chargerPolices()
  const cv = document.createElement('canvas')
  cv.width = Math.round(l * pxParMm); cv.height = Math.round(h * pxParMm)
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height) // le JPEG n'a pas de transparence
  dessinerHabillage(ctx, { coupure, graine, numero, pxParMm })
  dessinerTraits(ctx, dessin || [], { coupure, pxParMm })
  return cv
}

// Texte PDF en WinAnsi (accents français, « » compris) : les caractères hors Latin-1 deviennent « ? »
function latin1(s) {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); out[i] = c < 256 ? c : 63 }
  return out
}
const echapper = s => s.replace(/[\\()]/g, m => '\\' + m).replace(/[‘’]/g, "'")

function ecrirePdf({ W, H, jpeg, largeurPx, hauteurPx, contenu }) {
  const morceaux = []; const positions = []; let taille = 0
  const pousser = b => { const u = typeof b === 'string' ? latin1(b) : b; morceaux.push(u); taille += u.length }
  const objet = (n, corps, flux) => {
    positions[n] = taille
    pousser(`${n} 0 obj\n${corps}\n`)
    if (flux) { pousser('stream\n'); pousser(flux); pousser('\nendstream\n') }
    pousser('endobj\n')
  }
  const flux = latin1(contenu)
  pousser('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  objet(1, '<< /Type /Catalog /Pages 2 0 R >>')
  objet(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objet(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${(W * MM).toFixed(2)} ${(H * MM).toFixed(2)}] /Resources << /XObject << /Im0 5 0 R >> /Font << /F1 6 0 R >> >> /Contents 4 0 R >>`)
  objet(4, `<< /Length ${flux.length} >>`, flux)
  objet(5, `<< /Type /XObject /Subtype /Image /Width ${largeurPx} /Height ${hauteurPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg)
  objet(6, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const xref = taille
  pousser(`xref\n0 7\n0000000000 65535 f \n${positions.slice(1).map(p => String(p).padStart(10, '0') + ' 00000 n \n').join('')}`)
  pousser(`trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(morceaux, { type: 'application/pdf' })
}

// dessin : une ligne de la table dessins, AVEC sa trace
export async function planchePdf(dessin) {
  const trace = { coupure: dessin.coupure, graine: dessin.graine, ...(dessin.trace || {}) }
  const { l, h } = COUPURES[trace.coupure]
  const g = disposition(trace.coupure)
  const cv = await rendreBillet(trace)
  const jpeg = new Uint8Array(await (await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.92))).arrayBuffer())

  // la grille centrée sur la feuille ; PDF : origine en bas à gauche, en points
  const x0 = (g.W - g.cols * l) / 2, y0 = (g.H - g.rangs * h) / 2
  const p = v => (v * MM).toFixed(2)
  let c = ''
  for (let i = 0; i < g.cols; i++) for (let j = 0; j < g.rangs; j++)
    c += `q ${p(l)} 0 0 ${p(h)} ${p(x0 + i * l)} ${p(y0 + j * h)} cm /Im0 Do Q\n`
  // traits de coupe, hors des billets, dans le prolongement de chaque bord
  c += '0.25 w 0.35 G\n'
  const xs = Array.from({ length: g.cols + 1 }, (_, i) => x0 + i * l)
  const ys = Array.from({ length: g.rangs + 1 }, (_, j) => y0 + j * h)
  const x1 = x0 + g.cols * l, y1 = y0 + g.rangs * h
  for (const x of xs) c += `${p(x)} ${p(y0 - 1)} m ${p(x)} ${p(y0 - 1 - REPERE)} l S ${p(x)} ${p(y1 + 1)} m ${p(x)} ${p(y1 + 1 + REPERE)} l S\n`
  for (const y of ys) c += `${p(x0 - 1)} ${p(y)} m ${p(x0 - 1 - REPERE)} ${p(y)} l S ${p(x1 + 1)} ${p(y)} m ${p(x1 + 1 + REPERE)} ${p(y)} l S\n`
  // cartel en pied de page
  const cartel = echapper(`Banque Fantôme · billet n° ${dessin.code || dessin.numero}${dessin.titre ? `, « ${dessin.titre} »` : ''}, dessiné par ${dessin.auteur_pseudo || 'un compte disparu'} · jeansonpechin.com/banque-fantome`)
  c += `BT /F1 6.5 Tf 0.4 g ${p(MARGE)} ${p(Math.min(3.5, y0 - REPERE - 2.5))} Td (${cartel}) Tj ET\n`

  return ecrirePdf({ W: g.W, H: g.H, jpeg, largeurPx: cv.width, hauteurPx: cv.height, contenu: c })
}

export function nomPlanche(dessin) {
  const code = (dessin.code || `BF-${dessin.coupure}-${dessin.numero}`).replace(/[^\w-]/g, '')
  return `planche-${code}-A4.pdf`
}

// Télécharge la planche d'un billet (va chercher la trace si la ligne ne l'a pas)
export async function telechargerPlanche(supabase, dessin) {
  let d = dessin
  if (!d.trace) {
    const { data, error } = await supabase.from('dessins').select('*').eq('id', dessin.id).single()
    if (error || !data) throw new Error('Billet introuvable.')
    d = data
  }
  const blob = await planchePdf(d)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nomPlanche(d)
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
