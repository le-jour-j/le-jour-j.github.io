import { useState } from 'react'
import Portal from './Portal'

export default function RecoveryCodeReveal({ code, onConfirm }) {
  const [copied, setCopied]   = useState(false)
  const [checked, setChecked] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => {})
  }

  return (
    <Portal>
    <div className="modal-bg">
      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: '.4rem' }}>Votre code de récupération</h3>
        <p className="texte-aide" style={{ marginBottom: '1.2rem' }}>
          Notez-le précieusement : c'est le seul moyen de récupérer votre compte si vous oubliez votre mot de passe. Il ne sera plus jamais affiché.
        </p>
        <div className="code-recup">
          {code}
        </div>
        <button className="btn btn-outline btn-bloc" onClick={copy} style={{ marginBottom: '1.2rem' }}>
          {copied ? '✓ Copié !' : 'Copier le code'}
        </button>
        <label className="check-line">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
          J'ai noté mon code de récupération
        </label>
        <button className="btn btn-noir btn-bloc" disabled={!checked} onClick={onConfirm}>
          → Continuer
        </button>
      </div>
    </div>
    </Portal>
  )
}
