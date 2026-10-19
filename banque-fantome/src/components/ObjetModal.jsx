import { useState, useEffect } from 'react'
import { libelleRarete } from '../utils/rarete'
import Portal from './Portal'
import BoutonPlanche from './BoutonPlanche'
import { useAuth } from './AuthContext'
import MessageModal from './MessageModal'
import ImageLightbox from './ImageLightbox'
import { getObjetImageUrls } from '../utils/images'
import { useModal } from '../utils/useModal'
import EnchereBloc from './EnchereBloc'
import Notif from './Notif'
import { estVente } from '../utils/encheres'

export default function ObjetModal({ objet: objetInitial, onClose, onUpdate }) {
  const { user } = useAuth()
  const [objet, setObjet] = useState(objetInitial)
  const [notif, setNotif] = useState(null)
  useEffect(() => { setObjet(objetInitial) }, [objetInitial])
  function majObjet(o) { setObjet(o); onUpdate?.(o) }
  const [showMsg, setShowMsg] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [principale, setPrincipale] = useState(0) // image affichée en grand dans la fiche
  // Échap ferme la fiche, sauf si une sous-fenêtre (message / lightbox) est ouverte : c'est elle qui se ferme.
  useModal(showMsg || lightboxIndex !== null ? undefined : onClose)
  if (!objet) return null
  const imgUrls = getObjetImageUrls(objet)
  const isOwn = user && objet.user_id === user.id
  const statut = objet.statut || 'disponible'
  const vente = estVente(objet)
  const billet = !!objet.dessin_id
  const oeuvre = !!objet.oeuvre_id
  const physique = !billet && !oeuvre
  const banque = !!objet.vendeur_banque
  const stampStatut = statut === 'réservé' ? 'stamp-rouge' : statut === 'échangé' ? 'stamp-noir' : statut === 'expiré' || statut === 'retiré' ? 'stamp-rouge' : 'stamp-vert'
  const libelleStatut = vente ? (statut === 'disponible' ? 'en vente' : statut === 'échangé' ? 'adjugé' : statut) : statut

  return (
    <Portal>
      <div className="modal-bg" onClick={onClose}>
        <div className="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="objet-titre" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            <span className="stamp stamp-jaune">
              #{String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')}
            </span>
            {!vente && !!objet.valeur && <span className="stamp stamp-noir">{objet.valeur} billets</span>}
            {vente && <span className="stamp stamp-noir">{billet ? '◈ Bourse aux billets' : oeuvre ? '◈ E-market' : banque ? '◈ La banque vend' : '◇ Le bon coin'}</span>}
          </div>
          <div className="card-tags" style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.8rem' }}>
            {objet.categorie && <span className="tag">{objet.categorie}</span>}
            {physique && <span className={`rarete-badge rarete-${objet.rarete || 'commun'}`}>{libelleRarete(objet.rarete)}</span>}
          </div>
          <h3 id="objet-titre" className="modal-titre">{objet.titre}</h3>
          <div className="meta-label" style={{ marginBottom: '1rem' }}>
            {banque ? 'Mis en vente par la banque' : !physique ? `Mis en vente par ${objet.pseudo || 'Anonyme'}` : `Déposé par ${objet.pseudo || 'Anonyme'}`} · {new Date(objet.created_at).toLocaleDateString('fr-FR')}
          </div>
          {vente && <EnchereBloc objet={objet} onChange={majObjet} onNotif={setNotif} onContacter={() => setShowMsg(true)} />}
          {!!imgUrls.length &&
            <div className="modal-galerie">
              <button type="button" className="modal-media-item modal-media-principale" onClick={() => setLightboxIndex(principale)} aria-label="Agrandir l'image">
                <img key={imgUrls[principale]} src={imgUrls[principale]} alt={`${objet.titre} ${principale + 1}`} />
              </button>
              {imgUrls.length > 1 && (
                <div className="modal-vignettes">
                  {imgUrls.map((url, index) => (
                    <button key={url + index} type="button" className={`modal-vignette ${index === principale ? 'active' : ''}`} onClick={() => setPrincipale(index)} aria-label={`Image ${index + 1}`} aria-pressed={index === principale}>
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
              )}
              <div className="modal-media-hint">{imgUrls.length > 1 ? 'Cliquer sur une vignette pour la voir, sur la grande image pour l’agrandir.' : 'Cliquer sur l’image pour l’agrandir.'}</div>
            </div>
          }
          <p className="modal-texte">{objet.description}</p>
          {vente && physique && <p className="texte-aide">{banque
            ? 'Les enchères se font en billets papier, sans toucher à votre compte : le gagnant paie en main propre en venant chercher l’objet, ou règle avec l’argent de son compte. Une livraison ? Écrivez à la banque.'
            : 'Les enchères se font en billets papier, sans toucher à votre compte : le gagnant et le vendeur s’arrangent entre eux, par messages, pour la remise et le paiement.'}</p>}
          {objet.histoire &&
            <div className="modal-histoire">
              <div className="meta-label" style={{ marginBottom: '.4rem' }}>Histoire</div>
              <p>{objet.histoire}</p>
            </div>
          }
          <div className="modal-foot">
            <span className={`stamp ${stampStatut} stamp-anim`}>{libelleStatut}</span>
            {!vente && !!objet.valeur && <span className="meta-label">Valeur estimée : {objet.valeur} billets</span>}
            {objet.lieu && <span className="tag">📍 {objet.lieu}</span>}
            {billet && <BoutonPlanche dessin={{ id: objet.dessin_id }} />}
            {!isOwn && objet.user_id && !vente &&
              <button className="btn btn-jaune" onClick={() => setShowMsg(true)}>
                ⇄ Proposer un échange
              </button>
            }
            {!isOwn && objet.user_id && vente && statut === 'disponible' &&
              <button className="btn btn-outline btn-sm" onClick={() => setShowMsg(true)}>
                {banque ? '✉ Contacter la banque' : '✉ Question au vendeur'}
              </button>
            }
          </div>
        </div>
      </div>
      {showMsg && <MessageModal objet={objet} onClose={() => setShowMsg(false)} destinataire={isOwn && objet.vendu_a ? { id: objet.vendu_a, pseudo: objet.vendu_a_pseudo } : undefined} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={imgUrls}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i - 1 + imgUrls.length) % imgUrls.length)}
          onNext={() => setLightboxIndex(i => (i + 1) % imgUrls.length)}
        />
      )}
    </Portal>
  )
}
