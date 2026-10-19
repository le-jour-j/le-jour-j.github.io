import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useJournal, phrase } from './Journal'
import { useNouveautes } from './Nouveautes'

export default function Navbar() {
  const { user, profile, estBanquier } = useAuth()
  const { total: nouveautes } = useNouveautes()
  const navigate  = useNavigate()
  const location  = useLocation()
  // /creer est l'outil de deux entrées : le billet pour S'enrichir, les œuvres pour le Market
  const surCreer = location.pathname === '/creer'
  const atelierBillet = surCreer && new URLSearchParams(location.search).get('atelier') === 'billet'
  const atelierOeuvre = surCreer && !atelierBillet
  const [unread, setUnread] = useState(0)
  const [open, setOpen]     = useState(false) // menu mobile
  const journal = useJournal(8)             // ticker vivant : les dernières opérations de la banque

  // Non lus : recomptés à chaque message reçu ou marqué lu (temps réel), et quand la
  // page Messages signale une lecture (événement bf-messages-lus).
  const uid = user?.id
  useEffect(() => {
    if (!uid) { setUnread(0); return }
    const recompter = () => supabase.from('messages').select('id', { count: 'exact', head: true })
      .eq('destinataire_id', uid).eq('lu', false)
      .then(({ count }) => setUnread(count || 0))
    recompter()
    const channel = supabase.channel(`non-lus-${uid}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `destinataire_id=eq.${uid}` }, recompter)
      .subscribe()
    window.addEventListener('bf-messages-lus', recompter)
    return () => { supabase.removeChannel(channel); window.removeEventListener('bf-messages-lus', recompter) }
  }, [uid])

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
          ><span />{!open && unread + nouveautes > 0 && <i className="nav-burger-point" aria-hidden="true" />}</button>
          <ul id="nav-menu" className={`nav-links ${open ? 'open' : ''}`}>
            {/* 2026-10-19, ordre voulu par Jiiji : l'admin en premier (pour la banque seule), l'actu tout
                à gauche, puis S'enrichir et le Market ; Info juste avant le compte. Créer n'a plus d'entrée :
                c'est l'outil de S'enrichir (créer son billet) et du Market (créer une œuvre), et l'onglet
                allumé suit l'atelier ouvert. */}
            {user && estBanquier && (
              <li>
                <NavLink to="/admin">
                  Admin
                  {nouveautes > 0 && <span className="nav-badge" aria-label={`${nouveautes} nouveauté${nouveautes > 1 ? 's' : ''}`}>{nouveautes}</span>}
                </NavLink>
              </li>
            )}
            <li className="nav-accueil"><NavLink to="/" end>Accueil</NavLink></li>
            <li><NavLink to="/actu">Actu</NavLink></li>
            <li><NavLink to="/senrichir" className={({ isActive }) => isActive || atelierBillet ? 'active' : ''}>S'enrichir</NavLink></li>
            <li><NavLink to="/market" className={({ isActive }) => isActive || atelierOeuvre ? 'active' : ''}>Market</NavLink></li>
            <li><NavLink to="/bourse">Bourse</NavLink></li>
            {user && <>
              <li><NavLink to="/collection">Collection</NavLink></li>
              <li>
                <NavLink to="/messages">
                  Messages
                  {unread > 0 && <span className="nav-badge" aria-label={`${unread} non lu`}>{unread}</span>}
                </NavLink>
              </li>
            </>}
            <li><NavLink to="/info">Info</NavLink></li>
            {user ? <>
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
          ◈ BANQUE FANTÔME ◈ INSTITUTION DE CIRCULATION ◈ {journal.length
            ? journal.map((e, i) => <span key={i} className={`ticker-item ${e.type}`}>{phrase(e)} ◈ </span>)
            : 'OUVREZ UN COMPTE ◈ FABRIQUEZ VOTRE FAUX ARGENT ◈ DÉPOSEZ · ENCHÉRISSEZ · FAITES CIRCULER ◈ '}
          CHAQUE OBJET PEUT DEVENIR UN ACTIF NARRATIF ◈ &nbsp;
        </span>
      </div>
    </>
  )
}
