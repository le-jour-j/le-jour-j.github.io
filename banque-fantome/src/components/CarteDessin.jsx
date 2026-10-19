import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getPublicImageUrl } from '../utils/images'
import ImageLightbox from './ImageLightbox'
import { DUREES, messageErreur } from '../utils/encheres'

// Un billet dessiné dans l'atelier, tel qu'il apparaît dans « Ma collection » et juste
// après son dépôt. Les deux gestes possibles (voir supabase_bourse.sql) :
//   • l'encaisser : la banque le garde, le compte est crédité de sa valeur ;
//   • le mettre aux enchères dans la bourse.
// `quota` = { restant, plafond } : encaissements encore permis sur 24 h.
export default function CarteDessin({ dessin: d, moi, quota, onChange, onNotif, onVoirVente }) {
  const [busy, setBusy] = useState(false)
  const [confirmer, setConfirmer] = useState(false)
  const [vente, setVente] = useState(null) // { mise, prix, duree } quand le formulaire est ouvert
  const [agrandi, setAgrandi] = useState(false)

  const aMoi = moi && d.proprietaire_id === moi
  const auteur = moi && d.auteur_id === moi
  const encaissable = aMoi && auteur && d.statut === 'collection' && d.nb_ventes === 0
  const plusDeQuota = quota && quota.restant <= 0

  async function rpc(fn, args, ok) {
    setBusy(true)
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { onNotif?.({ msg: messageErreur(error), type: 'err' }); return false }
    onNotif?.({ msg: typeof ok === 'function' ? ok(data) : ok, type: 'ok' })
    setConfirmer(false); setVente(null)
    onChange?.()
    return true
  }

  const encaisser = () => rpc('encaisser_dessin', { p_dessin: d.id }, data => `Encaissé : +${d.coupure} billets. Votre solde : ${data?.solde}.`)
  const vendre = () => rpc('mettre_dessin_en_vente', {
    p_dessin: d.id, p_mise: Number(vente.mise), p_prix_achat: vente.prix ? Number(vente.prix) : null, p_duree: Number(vente.duree),
  }, 'Votre billet est en vente dans la bourse.')

  const etat = {
    collection: aMoi ? 'dans votre collection' : 'en collection',
    en_vente: 'en vente',
    encaisse: 'encaissé par la banque',
    annule: 'annulé par la banque',
  }[d.statut] || d.statut

  return (
    <article className={`dessin-carte ${d.statut}`}>
      <button type="button" className="dessin-image" onClick={() => setAgrandi(true)} aria-label="Voir le billet en grand">
        <img src={getPublicImageUrl(d.image_path)} alt={d.titre || `Billet de ${d.coupure}`} loading="lazy" />
      </button>
      {agrandi && <ImageLightbox images={[getPublicImageUrl(d.image_path)]} onClose={() => setAgrandi(false)} />}
      <div className="dessin-infos">
        <div className="dessin-titre">{d.titre || `Billet de ${d.coupure}`}</div>
        <div className="caption-gris">
          <strong>{d.coupure}</strong> {d.devise || 'billets'} · n° {d.code || d.numero}
          {' · '}{auteur ? 'dessiné par vous' : `dessiné par ${d.auteur_pseudo || 'un compte disparu'}`}
          {d.nb_ventes > 0 && ` · ${d.nb_ventes} vente${d.nb_ventes > 1 ? 's' : ''}`}
        </div>
        <span className={`stamp ${d.statut === 'annule' ? 'stamp-rouge' : d.statut === 'en_vente' ? 'stamp-vert' : d.statut === 'encaisse' ? 'stamp-noir' : 'stamp-jaune'}`}>{etat}</span>

        {aMoi && d.statut === 'collection' && !vente && (
          <div className="dessin-actions">
            {encaissable && (confirmer
              ? <>
                  <button type="button" className="btn btn-jaune btn-sm" disabled={busy} onClick={encaisser}>Confirmer : la banque garde ce billet</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmer(false)}>Non</button>
                </>
              : <button type="button" className="btn btn-jaune btn-sm" disabled={busy || plusDeQuota} onClick={() => setConfirmer(true)}>◈ Encaisser · +{d.coupure} billets</button>)}
            <button type="button" className="btn btn-noir btn-sm" disabled={busy} onClick={() => setVente({ mise: d.coupure, prix: '', duree: 3 })}>⚑ Mettre en vente</button>
          </div>
        )}
        {encaissable && plusDeQuota && (
          <p className="caption-gris">La banque encaisse {quota.plafond} billets par jour et par compte : revenez demain, ou vendez-le dans la bourse.</p>
        )}
        {aMoi && d.statut === 'collection' && !encaissable && d.nb_ventes > 0 && (
          <p className="caption-gris">Un billet qui a circulé ne s'encaisse plus : il se garde ou se revend.</p>
        )}

        {vente && (
          <div className="remise-form">
            <div className="field"><label>Mise de départ</label><input type="number" min="1" step="5" value={vente.mise} onChange={e => setVente({ ...vente, mise: e.target.value })} /></div>
            <div className="field"><label>Achat immédiat (facultatif)</label><input type="number" min="1" step="5" value={vente.prix} onChange={e => setVente({ ...vente, prix: e.target.value })} placeholder="aucun" /></div>
            <div className="field"><label>Durée</label>
              <div className="filter-row">{DUREES.map(x => <button key={x.jours} type="button" className={`chip ${Number(vente.duree) === x.jours ? 'active' : ''}`} onClick={() => setVente({ ...vente, duree: x.jours })}>{x.label}</button>)}</div>
            </div>
            <div className="dessin-actions">
              <button type="button" className="btn btn-noir btn-sm" disabled={busy || !(Number(vente.mise) >= 1)} onClick={vendre}>→ Mettre aux enchères</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setVente(null)}>Annuler</button>
            </div>
          </div>
        )}

        {d.statut === 'en_vente' && onVoirVente && (
          <div className="dessin-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => onVoirVente(d)}>Voir la vente →</button>
          </div>
        )}
      </div>
    </article>
  )
}
