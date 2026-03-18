import { useState } from 'react'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from './AuthContext'
import MessageModal from './MessageModal'

function getImgUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export default function ObjetModal({ objet, onClose }) {
  const { user } = useAuth()
  const [showMsg, setShowMsg] = useState(false)
  if (!objet) return null
  const imgUrl = objet.image_path ? getImgUrl(objet.image_path) : null
  const isOwn  = user && objet.user_id === user.id

  return (
    <>
      <div className="modal-bg" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <span className="stamp stamp-jaune" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            #{String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')}
          </span>
          {imgUrl &&
            <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', marginBottom: '1.2rem', background: 'var(--gris-clair)', border: '2px solid var(--gris-bord)' }}>
              <img src={imgUrl} alt={objet.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          }
          <h3 style={{ marginBottom: '.5rem' }}>{objet.titre}</h3>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '1rem' }}>
            Déposé par {objet.pseudo || 'Anonyme'} · {new Date(objet.created_at).toLocaleDateString('fr-FR')}
          </div>
          <p style={{ lineHeight: 1.7, marginBottom: '1.2rem', color: 'var(--noir)' }}>{objet.description}</p>
          {objet.histoire &&
            <div style={{ borderTop: '2px solid var(--gris-bord)', paddingTop: '1rem', marginTop: '.5rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--gris)', marginBottom: '.5rem' }}>Histoire de l'objet</div>
              <p style={{ lineHeight: 1.7, color: 'var(--noir)', fontStyle: 'italic' }}>{objet.histoire}</p>
            </div>
          }
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="stamp stamp-vert">{objet.statut || 'disponible'}</span>
            {objet.lieu && <span className="tag">📍 {objet.lieu}</span>}
            {!isOwn && objet.user_id &&
              <button className="btn btn-jaune" style={{ marginLeft: 'auto', fontSize: '.8rem' }} onClick={() => setShowMsg(true)}>
                ⇄ Proposer un échange
              </button>
            }
          </div>
        </div>
      </div>
      {showMsg && <MessageModal objet={objet} onClose={() => setShowMsg(false)} />}
    </>
  )
}
