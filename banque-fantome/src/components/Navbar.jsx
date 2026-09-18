import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useJournal, phrase } from './Journal'

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [unread, setUnread] = useState(0)
  const [open, setOpen]     = useState(false) // menu mobile
  const journal = useJournal(8)             // ticker vivant : les dernières opérations de la banque

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

  // Ferme le menu mobile à chaque navigation, et sur Échap
  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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
          <button
            type="button"
            className="nav-burger"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="nav-menu"
            onClick={() => setOpen(v => !v)}
          ><span /></button>
          <ul id="nav-menu" className={`nav-links ${open ? 'open' : ''}`}>
            <li><NavLink to="/" end>Accueil</NavLink></li>
            <li><NavLink to="/market">Market</NavLink></li>
            <li><NavLink to="/senrichir">S'enrichir</NavLink></li>
            <li><NavLink to="/deposer">Déposer</NavLink></li>
            {user ? <>
              <li>
                <NavLink to="/messages">
                  Messages
                  {unread > 0 && <span className="nav-badge" aria-label={`${unread} non lu`}>{unread}</span>}
                </NavLink>
              </li>
              <li><NavLink to="/compte">Mon compte{profile && <span className="nav-solde" title="Votre solde de billets">◈ {profile.solde}</span>}</NavLink></li>
              <li><button className="btn btn-jaune btn-sm" onClick={logout}>Quitter</button></li>
            </> : (
              <li><NavLink to="/connexion" className="btn btn-jaune btn-sm">Connexion</NavLink></li>
            )}
          </ul>
        </div>
      </nav>
      <div className="ticker-wrap" aria-hidden="true">
        <span className="ticker" key={journal.length}>
          ◈ BANQUE FANTÔME — INSTITUTION DE CIRCULATION ◈ {journal.length
            ? journal.map((e, i) => <span key={i} className={`ticker-item ${e.type}`}>{phrase(e)} ◈ </span>)
            : 'OUVREZ UN COMPTE ◈ FABRIQUEZ VOTRE FAUX ARGENT ◈ DÉPOSEZ · ENCHÉRISSEZ · FAITES CIRCULER ◈ '}
          CHAQUE OBJET PEUT DEVENIR UN ACTIF NARRATIF ◈ &nbsp;
        </span>
      </div>
    </>
  )
}
