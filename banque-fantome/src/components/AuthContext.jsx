import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)   // { pseudo, solde, role }

  const refreshProfile = useCallback(async (u = user) => {
    if (!u) { setProfile(null); return null }
    const { data } = await supabase.from('profiles').select('id, pseudo, solde, role').eq('id', u.id).single()
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

  // Profil (pseudo + solde) : chargé à la connexion, tenu à jour en temps réel
  useEffect(() => {
    if (!user) { setProfile(null); return }
    refreshProfile(user)
    const channel = supabase.channel(`profil-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        payload => setProfile(p => ({ ...(p || {}), ...payload.new })))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  return (
    <AuthCtx.Provider value={{ user, loading, profile, solde: profile?.solde ?? 0, estBanquier: profile?.role === 'banquier', refreshProfile }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
