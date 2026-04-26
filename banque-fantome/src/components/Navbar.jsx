import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

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

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  async function logout() {
    await supabase.auth.signOut()
    setMenuOpen(false)
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <nav>
        <div className="nav-inner">
          <NavLink to="/" className="nav-logo" onClick={closeMenu}>
            <span className="logo-badge">BF</span>
            <span className="nav-logo-text">BANQUE FANTÔME</span>
          </NavLink>

          <button
            className={`nav-toggle ${menuOpen ? 'is-open' : ''}`}
            type="button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <ul className={`nav-links ${menuOpen ? 'is-open' : ''}`}>
            <li><NavLink to="/" end onClick={closeMenu}>Accueil</NavLink></li>
            <li><NavLink to="/market" onClick={closeMenu}>Market</NavLink></li>
            <li><NavLink to="/senrichir" onClick={closeMenu}>S'enrichir</NavLink></li>
            <li><NavLink to="/deposer" onClick={closeMenu}>Déposer</NavLink></li>
            {user ? <>
              <li>
                <NavLink to="/messages" style={{ position: 'relative' }} onClick={closeMenu}>
                  Messages
                  {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -10, background: '#FFD600', color: '#111', borderRadius: '50%', width: 16, height: 16, fontSize: '.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{unread}</span>}
                </NavLink>
              </li>
              <li><NavLink to="/compte" onClick={closeMenu}>Mon compte</NavLink></li>
              <li><button className="btn btn-jaune nav-auth-btn" onClick={logout}>Quitter</button></li>
            </> : (
              <li><NavLink to="/connexion" onClick={closeMenu}><button className="btn btn-jaune nav-auth-btn">Connexion</button></NavLink></li>
            )}
          </ul>
        </div>
      </nav>
      <div className="ticker-wrap">
        <span className="ticker">
          ◈ BANQUE FANTÔME — INSTITUTION ARTISTIQUE DE CIRCULATION ◈ OUVREZ UN COMPTE ◈ FABRIQUEZ VOTRE FAUX ARGENT ARTISTIQUE ◈ TÉLÉCHARGEZ DES BILLETS À COLORIER ◈ DÉPOSEZ · ÉCHANGEZ · FAITES CIRCULER ◈ CHAQUE OBJET PEUT DEVENIR UN ACTIF NARRATIF ◈ &nbsp;
        </span>
      </div>
    </>
  )
}
