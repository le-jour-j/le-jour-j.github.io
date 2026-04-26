import { useState } from 'react'
import { useAuth } from './AuthContext'
import MessageModal from './MessageModal'
import ImageLightbox from './ImageLightbox'
import { getObjetImageUrls } from '../utils/images'

export default function ObjetModal({ objet, onClose }) {
  const { user } = useAuth()
  const [showMsg, setShowMsg] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  if (!objet) return null
  const imgUrls = getObjetImageUrls(objet)
  const isOwn = user && objet.user_id === user.id

  return (
    <>
      <div className="modal-bg" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>✕</button>
          <span className="stamp stamp-jaune" style={{ marginBottom: '1rem', display: 'inline-block' }}>
            #{String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')}
          </span>
          {!!imgUrls.length &&
            <div style={{ marginBottom: '1.2rem' }}>
              <div className={`modal-media-grid ${imgUrls.length === 1 ? 'single' : ''}`}>
                {imgUrls.map((url, index) => (
                  <button key={url + index} type="button" className="modal-media-item" onClick={() => setLightboxIndex(index)} aria-label={`Voir l'image ${index + 1} en grand`}>
                    <img src={url} alt={`${objet.titre} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
              {imgUrls.length > 1 && <div className="modal-media-hint">Cliquer sur une image pour l’agrandir.</div>}
            </div>
          }
          {objet.categorie && <div style={{ marginBottom: '.8rem' }}><span className="tag">{objet.categorie}</span></div>}
          <h3 style={{ marginBottom: '.5rem' }}>{objet.titre}</h3>
          <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--gris)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: '1rem' }}>
            Déposé par {objet.pseudo || 'Anonyme'} · {new Date(objet.created_at).toLocaleDateString('fr-FR')}
          </div>
          <p style={{ lineHeight: 1.7, marginBottom: '1.2rem', color: 'var(--noir)' }}>{objet.description}</p>
          {objet.histoire &&
            <div style={{ borderTop: '2px solid var(--gris-bord)', paddingTop: '1rem', marginTop: '.5rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--gris)', marginBottom: '.5rem' }}>Histoire</div>
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
      {lightboxIndex !== null && (
        <ImageLightbox
          images={imgUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i - 1 + imgUrls.length) % imgUrls.length)}
          onNext={() => setLightboxIndex(i => (i + 1) % imgUrls.length)}
        />
      )}
    </>
  )
}
