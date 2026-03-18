import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'

function fakeEmail(pseudo) {
  return `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, '_')}@banquefantome.local`
}

export default function Connexion() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]     = useState('login')
  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp]       = useState('')
  const [loading, setLoad]  = useState(false)
  const [notif, setNotif]   = useState(null)
  const [errors, setErrors] = useState({})

  if (user) { navigate('/compte'); return null }

  function validate() {
    const e = {}
    if (!pseudo.trim() || pseudo.trim().length < 3) e.pseudo = 'Pseudo requis (min 3 caractères)'
    if (!mdp || mdp.length < 6) e.mdp = 'Mot de passe requis (min 6 caractères)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoad(true)
    const email = fakeEmail(pseudo.trim())
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password: mdp })
        if (error) throw error
        if (data.user) await supabase.from('profiles').upsert({ id: data.user.id, pseudo: pseudo.trim() })
        setNotif({ msg: 'Compte créé ! Bienvenue.', type: 'ok' })
        setTimeout(() => navigate('/'), 1200)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: mdp })
        if (error) throw error
        setNotif({ msg: 'Connexion réussie.', type: 'ok' })
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (e) {
      const msg = e.message?.includes('already registered') ? 'Ce pseudo est déjà pris.'
        : e.message?.includes('Invalid login') ? 'Pseudo ou mot de passe incorrect.'
        : e.message || 'Erreur'
      setNotif({ msg, type: 'err' })
    } finally { setLoad(false) }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'var(--gris-clair)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header jaune */}
        <div style={{ background: 'var(--jaune)', padding: '2rem 2rem 1.5rem' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.18em', marginBottom: '.5rem' }}>
            BANQUE FANTÔME
          </div>
          <h2 style={{ color: 'var(--noir)' }}>{mode === 'login' ? 'Connexion' : 'Nouveau compte'}</h2>
        </div>

        {/* Formulaire */}
        <div style={{ background: 'var(--blanc)', padding: '2rem', border: '2px solid var(--noir)', borderTop: 'none' }}>
          <p style={{ fontSize: '.88rem', color: 'var(--gris)', marginBottom: '1.8rem', lineHeight: 1.6 }}>
            {mode === 'login'
              ? 'Identifiez-vous pour déposer des objets et gérer vos échanges.'
              : 'Pas de mail requis. Choisissez un pseudo — vous devenez opérateur de la Banque.'}
          </p>
          <div className="field">
            <label>Pseudo</label>
            <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="ex: collector_picardie" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {errors.pseudo && <span className="error-msg">{errors.pseudo}</span>}
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {errors.mdp && <span className="error-msg">{errors.mdp}</span>}
          </div>
          <button className="btn btn-noir" onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
            {loading ? 'Traitement…' : mode === 'login' ? '→ Se connecter' : '→ Créer mon compte'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.82rem', color: 'var(--gris)' }}>
            {mode === 'login'
              ? <>Pas de compte ? <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: 'var(--noir)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontFamily: 'var(--sans)' }}>En créer un</button></>
              : <>Déjà un compte ? <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: 'var(--noir)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontFamily: 'var(--sans)' }}>Se connecter</button></>
            }
          </div>
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
