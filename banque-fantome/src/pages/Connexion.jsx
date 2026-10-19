import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'
import RecoveryCodeReveal from '../components/RecoveryCodeReveal'
import { generateRecoveryCode, hashRecoveryCode } from '../utils/recoveryCode'
import { emailValide, enregistrerAbonnement } from '../lib/lettre'

function fakeEmail(pseudo) {
  return `${pseudo.toLowerCase().replace(/[^a-z0-9]/g, '_')}@banquefantome.local`
}

// ?retour=/creer?atelier=billet : où revenir une fois connecté (chemin interne seulement)
function cheminRetour(v) {
  return v && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : null
}

export default function Connexion() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  // ?lettre=1 : on arrive du bouton « Recevoir la lettre » → nouveau compte, case cochée
  const [params] = useSearchParams()
  const depuisLettre = params.get('lettre') === '1'
  const retour = cheminRetour(params.get('retour'))
  const [mode, setMode]         = useState(depuisLettre ? 'register' : 'login') // 'login' | 'register' | 'reset'
  const [lettre, setLettre]     = useState(depuisLettre)
  const [emailLettre, setEmailLettre] = useState('')
  const [pseudo, setPseudo]     = useState('')
  const [mdp, setMdp]           = useState('')
  const [code, setCode]         = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [loading, setLoad]      = useState(false)
  const [notif, setNotif]       = useState(null)
  const [errors, setErrors]     = useState({})
  const [revealCode, setRevealCode] = useState(null)
  // Inscription ou nouveau mot de passe en cours : la session s'ouvre avant la fin,
  // il ne faut pas quitter la page avant d'avoir montré le code de récupération.
  const [garde, setGarde] = useState(false)
  const partir = !!user && !garde && !revealCode

  // Déjà connecté → page de retour ou mon compte (dans un effet, pas pendant le rendu)
  useEffect(() => { if (partir) navigate(retour || '/compte', { replace: true }) }, [partir])
  if (partir) return null

  function validate() {
    const e = {}
    if (!pseudo.trim() || pseudo.trim().length < 3) e.pseudo = 'Pseudo requis (min 3 caractères)'
    if (mode === 'login' || mode === 'register') {
      if (!mdp || mdp.length < 6) e.mdp = 'Mot de passe requis (min 6 caractères)'
    }
    if (mode === 'register' && lettre && !emailValide(emailLettre)) e.emailLettre = 'Adresse e-mail requise pour recevoir la lettre'
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
    if (mode !== 'login') setGarde(true)
    const email = fakeEmail(pseudo.trim())
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password: mdp })
        if (error) throw error
        if (data.user) {
          const recoveryCode = generateRecoveryCode()
          const recoveryHash = await hashRecoveryCode(recoveryCode)
          // Insertion simple : le hash n'est plus lisible par les comptes, un upsert qui le
          // réécrirait serait refusé (supabase_garde_fous.sql). Le profil n'existe pas encore.
          const { error: profilErr } = await supabase.from('profiles')
            .upsert({ id: data.user.id, pseudo: pseudo.trim(), recovery_code_hash: recoveryHash }, { ignoreDuplicates: true })
          if (profilErr) throw profilErr
          await refreshProfile?.(data.user)
          // Le compte existe : un souci d'inscription à la lettre ne doit pas le bloquer
          if (lettre) {
            try { await enregistrerAbonnement(data.user.id, emailLettre) }
            catch (err) { setNotif({ msg: `Compte créé, mais la lettre : ${err.message} (à refaire dans Mon compte)`, type: 'err' }) }
          }
          setRevealCode(recoveryCode)
        }

      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: mdp })
        if (error) throw error
        // l'effet du haut renvoie vers la page de retour dès que la session est ouverte

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
      setGarde(false)
    } finally { setLoad(false) }
  }

  const titres = { login: 'Connexion', register: 'Nouveau compte', reset: 'Changer de mot de passe' }

  return (
    <div className="connexion-wrap">
      <div className="connexion-box">
        {/* Header jaune */}
        <div className="connexion-head">
          <div className="eyebrow">BANQUE FANTÔME</div>
          <h2 style={{ color: 'var(--noir)' }}>{titres[mode]}</h2>
        </div>

        {/* Formulaire */}
        <div className="connexion-form">
          <div className="mode-switch" role="tablist" aria-label="Mode">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Connexion</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Nouveau compte</button>
          </div>
          <p className="texte-aide" style={{ marginBottom: '1.6rem' }}>
            {mode === 'login' && (retour?.startsWith('/bourse')
              ? 'Connectez-vous pour déposer votre billet : votre dessin vous attend dans l’atelier.'
              : 'Identifiez-vous pour créer, vendre et enchérir.')}
            {mode === 'register' && 'Pas de mail requis. Choisissez un pseudo : vous devenez opérateur de la Banque.'}
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

          {mode === 'register' && (
            <>
              <label className="check-line">
                <input type="checkbox" checked={lettre} onChange={e => setLettre(e.target.checked)} />
                Recevoir la lettre de la banque (les nouvelles du projet, une fois par semaine)
              </label>
              {lettre && (
                <div className="field">
                  <label>E-mail (pour la lettre seulement)</label>
                  <input type="email" value={emailLettre} onChange={e => setEmailLettre(e.target.value)} placeholder="vous@exemple.fr" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                  {errors.emailLettre && <span className="error-msg">{errors.emailLettre}</span>}
                </div>
              )}
            </>
          )}

          {mode === 'reset' && (
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input type="password" value={nouveauMdp} onChange={e => setNouveauMdp(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              {errors.nouveauMdp && <span className="error-msg">{errors.nouveauMdp}</span>}
            </div>
          )}

          <button className="btn btn-noir btn-bloc" onClick={handleSubmit} disabled={loading} style={{ marginTop: '.5rem' }}>
            {loading ? 'Traitement…'
              : mode === 'login' ? '→ Se connecter'
              : mode === 'register' ? '→ Créer mon compte'
              : '→ Changer le mot de passe'}
          </button>

          <div className="connexion-liens">
            {mode === 'login' && (
              <span>Mot de passe oublié ? <button className="lien-texte" onClick={() => setMode('reset')}>Le changer</button></span>
            )}
            {mode === 'reset' && (
              <span><button className="lien-texte" onClick={() => setMode('login')}>← Retour à la connexion</button></span>
            )}
          </div>
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
      {revealCode && <RecoveryCodeReveal code={revealCode} onConfirm={() => navigate(retour || '/compte', { replace: true })} />}
    </div>
  )
}
