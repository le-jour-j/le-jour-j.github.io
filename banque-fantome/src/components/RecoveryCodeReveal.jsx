import { useState } from 'react'

export default function RecoveryCodeReveal({ code, onConfirm }) {
  const [copied, setCopied]   = useState(false)
  const [checked, setChecked] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => {})
  }

  return (
    <div className="modal-bg">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--sans)', marginBottom: '.4rem' }}>Votre code de récupération</h3>
        <p style={{ fontFamily: 'var(--sans)', fontSize: '.85rem', color: 'var(--gris-fonce)', marginBottom: '1.2rem', lineHeight: 1.6 }}>
          Notez-le précieusement : c'est le seul moyen de récupérer votre compte si vous oubliez votre mot de passe. Il ne sera plus jamais affiché.
        </p>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '.08em',
          background: 'var(--gris-clair)', border: '2px solid var(--noir)', padding: '1rem',
          textAlign: 'center', marginBottom: '1rem', userSelect: 'all',
        }}>
          {code}
        </div>
        <button className="btn btn-outline" onClick={copy} style={{ width: '100%', justifyContent: 'center', marginBottom: '1.2rem' }}>
          {copied ? 'Copié !' : 'Copier le code'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontFamily: 'var(--sans)', fontSize: '.82rem', color: 'var(--gris-fonce)', marginBottom: '1.2rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
          J'ai noté mon code de récupération
        </label>
        <button className="btn btn-noir" disabled={!checked} onClick={onConfirm} style={{ width: '100%', justifyContent: 'center' }}>
          → Continuer
        </button>
      </div>
    </div>
  )
}
