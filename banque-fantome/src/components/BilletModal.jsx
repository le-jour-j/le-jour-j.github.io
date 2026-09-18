import Portal from './Portal'
import { useModal } from '../utils/useModal'
import { getPublicImageUrl } from '../utils/images'

// Un billet, c'est une œuvre : image en grand + cartel (titre, artiste, technique, devise, valeur).
export default function BilletModal({ billet, onClose, onPrev, onNext, index, total, estBanquier, onAnnuler }) {
  useModal(onClose)
  if (!billet) return null
  const url = getPublicImageUrl(billet.image_path)
  const date = billet.created_at ? new Date(billet.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <Portal>
      <div className="modal-bg" onClick={onClose}>
        <div className="modal modal-large billet-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
          <div className="billet-modal-image">
            {total > 1 && <button type="button" className="lightbox-nav lightbox-prev" onClick={onPrev} aria-label="Billet précédent">‹</button>}
            <img src={url} alt={billet.titre || `Billet de ${billet.valeur}`} />
            {total > 1 && <button type="button" className="lightbox-nav lightbox-next" onClick={onNext} aria-label="Billet suivant">›</button>}
          </div>
          <div className="cartel">
            <div className="cartel-tete">
              <div>
                <div className="cartel-titre">{billet.titre || 'Sans titre'}</div>
                <div className="cartel-artiste">{billet.artiste || billet.pseudo || 'anonyme'}{date && <span className="caption-gris"> · {date}</span>}</div>
              </div>
              <div className="cartel-valeur">{billet.valeur}<small>{billet.devise ? billet.devise : 'billets'}</small></div>
            </div>
            <dl className="cartel-infos">
              {billet.technique && <><dt>Technique</dt><dd>{billet.technique}</dd></>}
              {billet.devise && <><dt>Devise</dt><dd>{billet.devise}</dd></>}
              <dt>Émis par</dt><dd>{billet.pseudo || 'anonyme'}</dd>
              {billet.statut === 'annule' && <><dt>Statut</dt><dd className="msg-err" style={{ margin: 0 }}>Annulé par la banque{billet.motif ? ` — ${billet.motif}` : ''}</dd></>}
            </dl>
            {billet.description && <p className="cartel-desc">{billet.description}</p>}
            <div className="cartel-pied">
              {total > 1 && <span className="caption-gris">{index + 1} / {total}</span>}
              {estBanquier && billet.statut === 'valide' && onAnnuler && (
                <button type="button" className="btn btn-rouge btn-xs" onClick={() => onAnnuler(billet)}>Annuler ce billet</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
