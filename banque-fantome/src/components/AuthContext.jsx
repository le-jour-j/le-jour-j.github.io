import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCanal } from '../lib/veille'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)   // { pseudo, solde, role }

  const refreshProfile = useCallback(async (u = user) => {
    if (!u) { setProfile(null); return null }
    const { data } = await supabase.from('profiles').select('id, pseudo, solde, role').eq('id', u.id).maybeSingle()
    setProfile(data || null)
    return data
  }, [user])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Profil (pseudo + solde) : chargé à la connexion, tenu à jour en temps réel tant que la page
  // ne dort pas (lib/veille.js), relu au réveil.
  // Dépend de l'id seul : l'objet user change à chaque rafraîchissement du jeton.
  // INSERT aussi : à l'inscription, le profil naît après l'ouverture de la session.
  const uid = user?.id
  useEffect(() => {
    if (!uid) { setProfile(null); return }
    refreshProfile({ id: uid })
  }, [uid])
  useCanal('profil', [{ event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }],
    payload => payload ? payload.new?.id && setProfile(p => ({ ...(p || {}), ...payload.new })) : refreshProfile({ id: uid }),
    { actif: !!uid })

  return (
    <AuthCtx.Provider value={{ user, loading, profile, solde: profile?.solde ?? 0, estBanquier: profile?.role === 'banquier', refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
