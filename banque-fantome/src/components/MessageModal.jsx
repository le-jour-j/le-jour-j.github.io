import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export default function MessageModal({ objet, onClose }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [contenu, setContenu] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)

  async function send() {
    if (!contenu.trim()) return
    if (!user) { navigate('/connexion'); return }
    setSending(true)

    const { data: myProfile } = await supabase
      .from('profiles').select('pseudo').eq('id', user.id).single()

    const { error } = await supabase.from('messages').insert({
      objet_id:            objet.id,
      objet_titre:         objet.titre,
      expediteur_id:       user.id,
      destinataire_id:     objet.user_id,
      expediteur_pseudo:   myProfile?.pseudo || 'Anonyme',
      destinataire_pseudo: objet.pseudo || 'Anonyme',
      contenu:             contenu.trim(),
    })

    setSending(false)
    if (!error) setDone(true)
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {done
          ? <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="stamp ok" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Message envoyé</div>
              <p style={{ fontFamily: 'var(--type)', color: 'var(--ink2)', lineHeight: 1.7 }}>
                {objet.pseudo} recevra votre proposition.<br />
                Suivez la réponse dans <strong>Mes messages</strong>.
              </p>
              <button className="btn btn-ink" style={{ marginTop: '1.5rem' }} onClick={() => { onClose(); navigate('/messages') }}>
                → Voir mes messages
              </button>
            </div>
          : <>
              <h3 style={{ fontFamily: 'var(--type)', marginBottom: '.4rem' }}>Proposer un échange</h3>
              <div style={{ fontSize: '.75rem', color: 'var(--grey)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                à {objet.pseudo} · re: {objet.titre}
              </div>
              {!user &&
                <p style={{ fontFamily: 'var(--type)', color: 'var(--red)', marginBottom: '1rem', fontSize: '.9rem' }}>
                  Vous devez être connecté pour envoyer un message.
                </p>
              }
              <div className="field">
                <label>Votre message</label>
                <textarea
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                  placeholder="Bonjour, je suis intéressé·e par cet objet. Je peux proposer en échange…"
                  style={{ minHeight: 120 }}
                  disabled={!user}
                />
              </div>
              <button
                className="btn btn-solid"
                onClick={user ? send : () => navigate('/connexion')}
                disabled={sending}
                style={{ width: '100%' }}
              >
                {sending ? 'Envoi…' : !user ? '→ Se connecter pour écrire' : '→ Envoyer la proposition'}
              </button>
            </>
        }
      </div>
    </div>
  )
}
