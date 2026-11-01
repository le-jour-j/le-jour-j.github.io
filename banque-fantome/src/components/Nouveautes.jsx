import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { estEnVeille, surVeille } from '../lib/veille'

// Les nouveautés du banquier (supabase_nouveautes.sql) : comptes créés, billets
// déposés, dépôts au market, inscriptions à la lettre, et la lettre prête quand
// assez d'actus attendent. Les autres comptes n'appellent rien.
// Rechargées toutes les 2 minutes quand le banquier est là. Depuis le 2026-11-01 (alerte Supabase
// « Disk IO Budget » : un onglet d'admin resté ouvert faisait 580 appels par jour), la relève suit
// la veille de la page (lib/veille.js) : toutes les 15 minutes si la page est visible mais que
// personne n'y touche, plus rien si l'onglet est caché, et un rechargement au réveil.
const RELEVE_ACTIF = 2 * 60 * 1000
const RELEVE_VEILLE = 15 * 60 * 1000

const NouveautesCtx = createContext(null)

// Onglet de l'admin → rubrique marquée « vue » quand on l'ouvre
export const RUBRIQUE_DE_L_ONGLET = { comptes: 'comptes', billets: 'billets', market: 'market', oeuvres: 'oeuvres', lettre: 'abonnes' }

export function NouveautesProvider({ children }) {
  const { estBanquier } = useAuth()
  const [data, setData] = useState(null)

  const recharger = useCallback(async () => {
    if (!estBanquier) { setData(null); return null }
    const { data: d, error } = await supabase.rpc('admin_nouveautes')
    if (error) return null
    setData(d)
    return d
  }, [estBanquier])

  useEffect(() => {
    recharger()
    if (!estBanquier) return
    let t = null
    const programmer = veille => {
      clearInterval(t)
      t = setInterval(() => { if (document.visibilityState === 'visible') recharger() }, veille ? RELEVE_VEILLE : RELEVE_ACTIF)
    }
    programmer(estEnVeille())
    const desabonner = surVeille(veille => { programmer(veille); if (!veille) recharger() })
    return () => { clearInterval(t); desabonner() }
  }, [estBanquier, recharger])

  const marquerVu = useCallback(async rubrique => {
    if (!estBanquier || !rubrique) return
    // Le compteur tombe tout de suite, la base suit
    setData(d => d && ({ ...d, [rubrique]: { ...d[rubrique], n: 0, desinscrits: 0 } }))
    const { error } = await supabase.rpc('admin_marquer_vu', { p_rubriques: [rubrique] })
    if (!error) recharger()
  }, [estBanquier, recharger])

  const compte = r => (data?.[r]?.n || 0) + (data?.[r]?.desinscrits || 0)
  const lettrePrete = !!data && data.lettre.en_attente >= data.lettre.seuil
  // Les billets à imprimer ne se « voient » pas : ils comptent tant qu'ils ne sont pas imprimés
  const total = data ? compte('comptes') + compte('billets') + compte('market') + compte('oeuvres') + compte('a_imprimer') + compte('abonnes') + (lettrePrete ? 1 : 0) : 0

  return (
    <NouveautesCtx.Provider value={{ data, total, compte, lettrePrete, recharger, marquerVu }}>
      {children}
    </NouveautesCtx.Provider>
  )
}

export const useNouveautes = () => useContext(NouveautesCtx)
