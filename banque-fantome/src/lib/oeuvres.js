import { supabase, STORAGE_BUCKET } from './supabase'

// Les œuvres du market numérique (2026-10-19, supabase_market_numerique.sql) : faites dans
// les ateliers de /creer, déposées dans la collection, vendues en argent du site.
// Deux images par œuvre : l'aperçu, public et réduit (bucket objets, oeuvres/<uid>/),
// et la haute définition, privée, que seul le propriétaire télécharge (bucket oeuvres-hd).

export const GENRES = {
  paint:   { nom: 'Paint',   icone: '🖌️', phrase: 'Dessiner et peindre sur une toile libre' },
  poesie:  { nom: 'Poésie',  icone: '✒️', phrase: 'Écrire et mettre en page un poème' },
  image:   { nom: 'Image',   icone: '📷', phrase: 'Déposer sa photo et la retoucher' },
  collage: { nom: 'Collage', icone: '✂️', phrase: 'Découper, assembler, coller' },
}
export const nomGenre = g => GENRES[g]?.nom || g

// Tout sauf la source (traits, texte, réglages), qui peut peser lourd
export const COLONNES_OEUVRE = 'id, numero, genre, auteur_id, auteur_pseudo, proprietaire_id, proprietaire_pseudo, titre, description, apercu_path, hd_path, largeur, hauteur, nb_ventes, statut, en_pause, created_at'

const COTE_APERCU = 1000 // px : assez pour regarder, pas pour imprimer en grand

// Réduit une image (Blob) à COTE_APERCU de grand côté, en WebP (PNG sur Safari)
export async function reduireImage(blob, cote = COTE_APERCU) {
  const bmp = await createImageBitmap(blob)
  const k = Math.min(1, cote / Math.max(bmp.width, bmp.height))
  const cv = document.createElement('canvas')
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k)
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height)
  bmp.close?.()
  const petit = await new Promise(res => cv.toBlob(res, 'image/webp', 0.86))
  if (!petit) throw new Error('L’aperçu de l’œuvre n’a pas pu être fabriqué.')
  return petit
}

const extension = type => type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : 'png'

// Le dépôt complet : HD privée, aperçu public, puis l'inscription en base (deposer_oeuvre)
export async function deposerOeuvre(user, { genre, titre, description, blob, type, largeur, hauteur, source }) {
  const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const hdPath = `${user.id}/${nom}.${extension(type)}`
  const { error: hdErr } = await supabase.storage.from('oeuvres-hd').upload(hdPath, blob, { contentType: type, upsert: false })
  if (hdErr) throw hdErr
  const apercu = await reduireImage(blob)
  const apercuPath = `oeuvres/${user.id}/${nom}.${extension(apercu.type)}`
  const { error: apErr } = await supabase.storage.from(STORAGE_BUCKET).upload(apercuPath, apercu, { contentType: apercu.type, cacheControl: '31536000', upsert: false })
  if (apErr) throw apErr
  const { data, error } = await supabase.rpc('deposer_oeuvre', {
    p_genre: genre, p_titre: titre, p_description: description || null, p_apercu_path: apercuPath,
    p_hd_path: hdPath, p_largeur: largeur || null, p_hauteur: hauteur || null, p_source: source || null,
  })
  if (error) throw error
  return data // { oeuvre_id, numero }
}

// Lien de téléchargement de la HD, valable deux minutes (refusé si l'œuvre n'est pas à vous)
export async function lienHD(oeuvre) {
  const nom = `oeuvre-${oeuvre.numero}-${(oeuvre.titre || 'sans-titre').toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}`
  const { data, error } = await supabase.storage.from('oeuvres-hd').createSignedUrl(oeuvre.hd_path, 120, { download: `${nom}.${oeuvre.hd_path.split('.').pop()}` })
  if (error || !data?.signedUrl) throw new Error('Téléchargement refusé : seule la personne qui possède l’œuvre peut la télécharger en grand.')
  return data.signedUrl
}
