import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Les billets dessinés dans l'atelier (table `dessins`, supabase_bourse.sql). Sortis de la
// page Bourse le 2026-11-01, quand ses ventes sont devenues le rayon « Billets » du market.

// Tout sauf la trace du dessin (25 à 50 Ko par billet, jusqu'à 2 Mo) : la carte n'affiche que l'image
export const COLONNES_DESSIN = 'id, numero, auteur_id, auteur_pseudo, proprietaire_id, proprietaire_pseudo, coupure, graine, code, titre, devise, image_path, nb_traits, nb_ventes, statut, en_pause, billet_id, created_at'

// Encaissements encore permis sur 24 h glissantes (même calcul que encaisser_dessin)
export function useQuota(user) {
  const [quota, setQuota] = useState(null)
  const recharger = useCallback(async () => {
    if (!user) { setQuota(null); return }
    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const [{ data: banque }, { count }] = await Promise.all([
      supabase.from('banque').select('plafond_encaissement_jour').eq('id', 1).single(),
      supabase.from('billets_emis').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', depuis),
    ])
    const plafond = banque?.plafond_encaissement_jour ?? 3
    setQuota({ plafond, restant: Math.max(0, plafond - (count || 0)) })
  }, [user])
  useEffect(() => { recharger() }, [recharger])
  return [quota, recharger]
}
