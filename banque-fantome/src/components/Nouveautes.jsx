import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Les nouveautés du banquier (supabase_nouveautes.sql) : comptes créés, billets
// déposés, dépôts au market, inscriptions à la lettre, et la lettre prête quand
// assez d'actus attendent. Rechargées toutes les 2 minutes et au retour sur
// l'onglet du navigateur. Les autres comptes n'appellent rien.

const NouveautesCtx = createContext(null)

// Onglet de l'admin → rubrique marquée « vue » quand on l'ouvre
export const RUBRIQUE_DE_L_ONGLET = { comptes: 'comptes', billets: 'billets', market: 'market', lettre: 'abonnes' }

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
    const t = setInterval(recharger, 120000)
    const onVisible = () => { if (document.visibilityState === 'visible') recharger() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
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
  const total = data ? compte('comptes') + compte('billets') + compte('market') + compte('abonnes') + (lettrePrete ? 1 : 0) : 0

  return (
    <NouveautesCtx.Provider value={{ data, total, compte, lettrePrete, recharger, marquerVu }}>
      {children}
    </NouveautesCtx.Provider>
  )
}

export const useNouveautes = () => useContext(NouveautesCtx)
