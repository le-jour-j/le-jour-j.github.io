import { useState } from 'react'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'

function getImgUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export default function ObjetCard({ objet, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  const imgUrl = objet.image_path ? getImgUrl(objet.image_path) : null
  const statutColor = objet.statut === 'échangé' ? '#1a7a1a' : objet.statut === 'réservé' ? '#E63946' : 'var(--gris)'

  return (
    <div className="objet-card" onClick={() => onClick && onClick(objet)}>
      <span className="card-num">#{String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')}</span>
      <div className="img-wrap">
        {imgUrl && !imgErr
          ? <img src={imgUrl} alt={objet.titre} onError={() => setImgErr(true)} />
          : <div className="no-img">BF</div>
        }
      </div>
      <div className="card-body">
        <div className="card-title">{objet.titre}</div>
        <div className="card-desc">{objet.description?.slice(0, 80)}{objet.description?.length > 80 ? '…' : ''}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '.4rem' }}>
          <span className="card-user">par {objet.pseudo || 'Anonyme'}</span>
          <span style={{ fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: statutColor }}>{objet.statut || 'disponible'}</span>
        </div>
      </div>
    </div>
  )
}
