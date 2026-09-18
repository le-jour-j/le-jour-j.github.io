import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Portal from './Portal'
import { useAuth } from './AuthContext'
import { useModal } from '../utils/useModal'

export default function MessageModal({ objet, onClose, destinataire }) {
  // destinataire facultatif { id, pseudo } — par défaut le déposant de l'objet
  const dest = destinataire || { id: objet.user_id, pseudo: objet.pseudo }
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [contenu, setContenu] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone]       = useState(false)
  useModal(onClose)

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
      destinataire_id:     dest.id,
      expediteur_pseudo:   myProfile?.pseudo || 'Anonyme',
      destinataire_pseudo: dest.pseudo || 'Anonyme',
      contenu:             contenu.trim(),
    })

    setSending(false)
    if (!error) setDone(true)
  }

  return (
    <Portal>
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>

        {done
          ? <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="stamp stamp-vert stamp-anim" style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Message envoyé</div>
              <p style={{ fontFamily: 'var(--sans)', color: 'var(--gris-fonce)', lineHeight: 1.7 }}>
                {dest.pseudo} recevra votre message.<br />
                Suivez la réponse dans <strong>Mes messages</strong>.
              </p>
              <button className="btn btn-noir" style={{ marginTop: '1.5rem' }} onClick={() => { onClose(); navigate('/messages') }}>
                → Voir mes messages
              </button>
            </div>
          : <>
              <h3 style={{ marginBottom: '.4rem' }}>{destinataire ? 'Écrire' : objet.mise_depart != null ? 'Question au vendeur' : 'Proposer un échange'}</h3>
              <div className="meta-label" style={{ marginBottom: '1.2rem' }}>
                à {dest.pseudo} · re: {objet.titre}
              </div>
              {!user &&
                <p className="msg-err">
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
                className="btn btn-noir btn-bloc"
                onClick={user ? send : () => navigate('/connexion')}
                disabled={sending || (user && !contenu.trim())}
              >
                {sending ? 'Envoi…' : !user ? '→ Se connecter pour écrire' : '→ Envoyer'}
              </button>
            </>
        }
      </div>
    </div>
    </Portal>
  )
}
