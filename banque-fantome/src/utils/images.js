import { supabase, STORAGE_BUCKET } from '../lib/supabase'

export function getPublicImageUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data?.publicUrl || null
}

export function getObjetImagePaths(objet) {
  if (!objet) return []
  const many = Array.isArray(objet.image_paths) ? objet.image_paths.filter(Boolean) : []
  if (many.length) return many
  if (objet.image_path) return [objet.image_path]
  return []
}

export function getObjetImageUrls(objet) {
  return getObjetImagePaths(objet).map(getPublicImageUrl).filter(Boolean)
}
