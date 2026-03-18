import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) { setUnread(0); return }
    supabase.from('messages').select('id', { count: 'exact' })
      .eq('destinataire_id', user.id).eq('lu', false)
      .then(({ count }) => setUnread(count || 0))
    const channel = supabase.channel('unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `destinataire_id=eq.${user.id}` },
        () => setUnread(n => n + 1))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  async function logout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <>
      <nav>
        <div className="nav-inner">
          <NavLink to="/" className="nav-logo">
            <span className="logo-badge">BF</span>
            BANQUE FANTÔME
          </NavLink>
          <ul className="nav-links">
            <li><NavLink to="/" end>Accueil</NavLink></li>
            <li><NavLink to="/inventaire">Inventaire</NavLink></li>
            <li><NavLink to="/deposer">Déposer</NavLink></li>
            {user ? <>
              <li>
                <NavLink to="/messages" style={{ position: 'relative' }}>
                  Messages
                  {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -10, background: '#FFD600', color: '#111', borderRadius: '50%', width: 16, height: 16, fontSize: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>}
                </NavLink>
              </li>
              <li><NavLink to="/compte">Mon compte</NavLink></li>
              <li><button className="btn btn-jaune" style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={logout}>Quitter</button></li>
            </> : (
              <li><NavLink to="/connexion"><button className="btn btn-jaune" style={{ fontSize: '.72rem', padding: '.35rem .9rem' }}>Connexion</button></NavLink></li>
            )}
          </ul>
        </div>
      </nav>
      <div className="ticker-wrap">
        <span className="ticker">
          ◈ BANQUE FANTÔME — INSTITUTION ARTISTIQUE MOBILE DE TROC ◈ CAPITAL INITIAL : 300 CHÈQUES DESSINÉS + 50 CARTES VERNIES ◈ CHAQUE OBJET A UNE HISTOIRE ◈ DÉPOSEZ · ÉCHANGEZ · CIRCULEZ ◈ TRANSACTIONS EN COURS ◈ VOS OBJETS SONT DES ACTIFS ◈ &nbsp;
        </span>
      </div>
    </>
  )
}
