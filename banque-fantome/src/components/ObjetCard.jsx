import { useState } from 'react'
import { getObjetImageUrls } from '../utils/images'
import { estVente, estEnCours, tempsRestant, urgent } from '../utils/encheres'

export default function ObjetCard({ objet, onClick }) {
  const [imgErr, setImgErr] = useState(false)
  const imgUrls = getObjetImageUrls(objet)
  const imgUrl = imgUrls[0] || null
  const vente = estVente(objet)
  const enCours = estEnCours(objet)
  const statut = objet.statut || 'disponible'
  const numero = String(objet.numero || objet.id?.slice(-4) || '???').padStart(4, '0')

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(objet) }
  }

  // Cartouche en haut à droite : prix
  let prix = null
  if (vente) {
    if (statut === 'échangé') prix = <span className="card-valeur vendu">Vendu {objet.prix_final}</span>
    else if (objet.enchere_courante != null) prix = <span className="card-valeur"><small>Enchère</small>{objet.enchere_courante}</span>
    else prix = <span className="card-valeur"><small>Mise</small>{objet.mise_depart}</span>
  } else if (objet.valeur) {
    prix = <span className="card-valeur">{objet.valeur} billets</span>
  }

  // Pied de carte : temps restant ou statut
  let pied
  if (vente && enCours) {
    pied = <span className={`card-timer ${urgent(objet.expire_at) ? 'urgent' : ''}`}>⏱ {tempsRestant(objet.expire_at)}{objet.nb_encheres > 0 && ` · ${objet.nb_encheres} ench.`}</span>
  } else if (vente && statut === 'disponible') {
    pied = <span className="card-statut expiré">clôture…</span>
  } else {
    const libelle = vente && statut === 'échangé' ? `vendu à ${objet.vendu_a_pseudo || '?'}` : statut
    pied = <span className={`card-statut ${statut}`}>{libelle}</span>
  }

  return (
    <article
      className={`objet-card ${vente ? 'vente' : ''} ${statut === 'échangé' || statut === 'expiré' || statut === 'retiré' ? 'terminee' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Voir ${objet.titre}`}
      onClick={() => onClick && onClick(objet)}
      onKeyDown={handleKey}
    >
      <span className="card-num">#{numero}</span>
      {prix}
      <div className="img-wrap">
        {imgUrl && !imgErr
          ? <img src={imgUrl} alt={objet.titre} loading="lazy" onError={() => setImgErr(true)} />
          : <div className="no-img">BF</div>
        }
        {imgUrls.length > 1 && <span className="img-count-badge">+{imgUrls.length - 1}</span>}
        {vente && enCours && objet.prix_achat && <span className="card-achat">Achat imm. {objet.prix_achat}</span>}
      </div>
      <div className="card-body">
        <div className="card-tags">
          {objet.categorie && <span className="tag">{objet.categorie}</span>}
          <span className={`rarete-badge rarete-${objet.rarete || 'commun'}`}>{objet.rarete || 'commun'}</span>
        </div>
        <div className="card-title">{objet.titre}</div>
        <div className="card-desc">{objet.description?.slice(0, 90)}{objet.description?.length > 90 ? '…' : ''}</div>
        <div className="card-foot">
          <span className="card-user">par {objet.pseudo || 'Anonyme'}</span>
          {pied}
        </div>
      </div>
      <span className="card-cta" aria-hidden="true">{vente && enCours ? 'Enchérir →' : 'Ouvrir la fiche →'}</span>
    </article>
  )
}
