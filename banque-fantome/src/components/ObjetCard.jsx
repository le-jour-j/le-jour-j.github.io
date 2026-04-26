import { useState } from 'react'
import { getObjetImageUrls } from '../utils/images'

export default function ObjetCard({ objet, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  const imgUrls = getObjetImageUrls(objet)
  const imgUrl = imgUrls[0] || null
  const statutColor = objet.statut === 'échangé' ? '#1a7a1a' : objet.statut === 'réservé' ? '#E63946' : 'var(--gris)'

  return (
    <div className="objet-card" onClick={() => onClick && onClick(objet)}>
      <span className="card-num">#{String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')}</span>
      <div className="img-wrap">
        {imgUrl && !imgErr
          ? <img src={imgUrl} alt={objet.titre} onError={() => setImgErr(true)} />
          : <div className="no-img">BF</div>
        }
        {imgUrls.length > 1 && <span className="img-count-badge">+{imgUrls.length - 1}</span>}
      </div>
      <div className="card-body">
        {objet.categorie && <span className="tag" style={{ alignSelf: 'flex-start' }}>{objet.categorie}</span>}
        <div className="card-title">{objet.titre}</div>
        <div className="card-desc">{objet.description?.slice(0, 80)}{objet.description?.length > 80 ? '…' : ''}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '.4rem', gap: '.75rem' }}>
          <span className="card-user">par {objet.pseudo || 'Anonyme'}</span>
          <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: statutColor, textAlign: 'right' }}>{objet.statut || 'disponible'}</span>
        </div>
      </div>
    </div>
  )
}
