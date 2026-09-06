import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'
import RecoveryCodeReveal from '../components/RecoveryCodeReveal'
import { generateRecoveryCode, hashRecoveryCode } from '../utils/recoveryCode'

function fakeEmail(pseudo) {
  return `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, '_')}@banquefantome.local`
}

export default function Connexion() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]         = useState('login') // 'login' | 'register' | 'reset'
  const [pseudo, setPseudo]     = useState('')
  const [mdp, setMdp]           = useState('')
  const [code, setCode]         = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [loading, setLoad]      = useState(false)
  const [notif, setNotif]       = useState(null)
  const [errors, setErrors]     = useState({})
  const [revealCode, setRevealCode] = useState(null)

  if (user) { navigate('/compte'); return null }

  function validate() {
    const e = {}
    if (!pseudo.trim() || pseudo.trim().length < 3) e.pseudo = 'Pseudo requis (min 3 caractères)'
    if (mode === 'login' || mode === 'register') {
      if (!mdp || mdp.length < 6) e.mdp = 'Mot de passe requis (min 6 caractères)'
    }
    if (mode === 'reset') {
      if (!code.trim()) e.code = 'Code de récupération requis'
      if (!nouveauMdp || nouveauMdp.length < 6) e.nouveauMdp = 'Min 6 caractères'
    }
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
        if (data.user) {
          const recoveryCode = generateRecoveryCode()
          const recoveryHash = await hashRecoveryCode(recoveryCode)
          await supabase.from('profiles').upsert({ id: data.user.id, pseudo: pseudo.trim(), recovery_code_hash: recoveryHash })
          setRevealCode(recoveryCode)
        }

      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: mdp })
        if (error) throw error
        setNotif({ msg: 'Connexion réussie.', type: 'ok' })
        setTimeout(() => navigate('/'), 1000)

      } else if (mode === 'reset') {
        const { data, error: fnErr } = await supabase.functions.invoke('reset-password', {
          body: { pseudo: pseudo.trim(), code: code.trim(), newPassword: nouveauMdp },
        })
        if (fnErr) {
          let msg = 'Pseudo ou code incorrect.'
          try { const body = await fnErr.context.json(); if (body?.error) msg = body.error } catch {}
          throw new Error(msg)
        }
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: nouveauMdp })
        if (loginErr) throw loginErr
        setRevealCode(data.newCode)
      }
    } catch (e) {
      const msg = e.message?.includes('already registered') ? 'Ce pseudo est déjà pris.'
        : e.message?.includes('Invalid login') ? 'Pseudo ou mot de passe incorrect.'
        : e.message || 'Erreur'
      setNotif({ msg, type: 'err' })
    } finally { setLoad(false) }
  }

  const titres = { login: 'Connexion', register: 'Nouveau compte', reset: 'Changer de mot de passe' }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'var(--gris-clair)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header jaune */}
        <div style={{ background: 'var(--jaune)', padding: '2rem 2rem 1.5rem' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.18em', marginBottom: '.5rem' }}>
            BANQUE FANTÔME
          </div>
          <h2 style={{ color: 'var(--noir)' }}>{titres[mode]}</h2>
        </div>

        {/* Formulaire */}
        <div style={{ background: 'var(--blanc)', padding: '2rem', border: '2px solid var(--noir)', borderTop: 'none' }}>
          <p className="texte-aide" style={{ marginBottom: '1.8rem' }}>
            {mode === 'login' && 'Identifiez-vous pour déposer des objets et gérer vos échanges.'}
            {mode === 'register' && 'Pas de mail requis. Choisissez un pseudo — vous devenez opérateur de la Banque.'}
            {mode === 'reset' && 'Entrez votre pseudo, votre code de récupération, puis votre nouveau mot de passe.'}
          </p>

          <div className="field">
            <label>Pseudo</label>
            <input value={pseudo} onChange={e => setPseudo(e.target.value)} placeholder="ex: operateur_fantome" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {errors.pseudo && <span className="error-msg">{errors.pseudo}</span>}
          </div>

          {mode === 'reset'
            ? <div className="field">
                <label>Code de récupération</label>
                <input value={code} onChange={e => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                {errors.code && <span className="error-msg">{errors.code}</span>}
              </div>
            : <div className="field">
                <label>Mot de passe</label>
                <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                {errors.mdp && <span className="error-msg">{errors.mdp}</span>}
              </div>
          }

          {mode === 'reset' && (
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              {errors.nouveauMdp && <span className="error-msg">{errors.nouveauMdp}</span>}
            </div>
          )}

          <button className="btn btn-noir" onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
            {loading ? 'Traitement…'
              : mode === 'login' ? '→ Se connecter'
              : mode === 'register' ? '→ Créer mon compte'
              : '→ Changer le mot de passe'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.82rem', color: 'var(--gris)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {mode === 'login' && <>
              <span>Pas de compte ? <button className="lien-texte" onClick={() => setMode('register')}>En créer un</button></span>
              <span>Mot de passe oublié ? <button className="lien-texte" onClick={() => setMode('reset')}>Le changer</button></span>
            </>}
            {mode === 'register' && (
              <span>Déjà un compte ? <button className="lien-texte" onClick={() => setMode('login')}>Se connecter</button></span>
            )}
            {mode === 'reset' && (
              <span><button className="lien-texte" onClick={() => setMode('login')}>← Retour à la connexion</button></span>
            )}
          </div>
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
      {revealCode && <RecoveryCodeReveal code={revealCode} onConfirm={() => navigate('/')} />}
    </div>
  )
}
