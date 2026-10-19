import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getPublicImageUrl } from '../utils/images'
import { DUREES, messageErreur } from '../utils/encheres'
import { GENRES, lienHD } from '../lib/oeuvres'
import ImageLightbox from './ImageLightbox'
import Crayon from './Crayon'

// Une œuvre des ateliers, telle qu'elle apparaît dans « Ma collection » et juste après son
// dépôt (2026-10-19). Gestes du propriétaire : la mettre en vente à l'E-market, la télécharger
// en haute définition (pour l'imprimer ou la garder). Voir supabase_market_numerique.sql.
export default function CarteOeuvre({ oeuvre: w, moi, onChange, onNotif, onVoirVente }) {
  const [busy, setBusy] = useState(false)
  const [vente, setVente] = useState(null) // { mise, prix, duree } quand le formulaire est ouvert
  const [agrandi, setAgrandi] = useState(false)

  const aMoi = moi && w.proprietaire_id === moi
  const auteur = moi && w.auteur_id === moi
  const genre = GENRES[w.genre] || { nom: w.genre, icone: '◈' }
  const apercu = getPublicImageUrl(w.apercu_path)

  async function vendre() {
    setBusy(true)
    const { error } = await supabase.rpc('mettre_oeuvre_en_vente', {
      p_oeuvre: w.id, p_mise: Number(vente.mise), p_prix_achat: vente.prix ? Number(vente.prix) : null, p_duree: Number(vente.duree),
    })
    setBusy(false)
    if (error) { onNotif?.({ msg: messageErreur(error), type: 'err' }); return }
    onNotif?.({ msg: 'Votre œuvre est en vente à l’E-market.', type: 'ok' })
    setVente(null)
    onChange?.()
  }

  async function telecharger() {
    setBusy(true)
    try { window.location.href = await lienHD(w) }
    catch (e) { onNotif?.({ msg: e.message, type: 'err' }) }
    finally { setBusy(false) }
  }

  const etat = { collection: aMoi ? 'dans votre collection' : 'en collection', en_vente: 'en vente à l’E-market', annule: 'retirée par la banque' }[w.statut] || w.statut

  return (
    <article className={`dessin-carte oeuvre-carte ${w.statut}`}>
      <button type="button" className="dessin-image oeuvre-image" onClick={() => setAgrandi(true)} aria-label="Voir l’œuvre en grand">
        <img src={apercu} alt={w.titre} loading="lazy" />
      </button>
      {agrandi && <ImageLightbox images={[apercu]} onClose={() => setAgrandi(false)} />}
      <div className="dessin-infos">
        <div className="dessin-titre">{w.titre}</div>
        <div className="caption-gris">
          {genre.icone} {genre.nom} · n° {w.numero}
          {' · '}{auteur ? 'faite par vous' : `par ${w.auteur_pseudo || 'un compte disparu'}`}
          {w.nb_ventes > 0 && ` · ${w.nb_ventes} vente${w.nb_ventes > 1 ? 's' : ''}`}
        </div>
        <span className={`stamp ${w.statut === 'annule' ? 'stamp-rouge' : w.statut === 'en_vente' ? 'stamp-vert' : 'stamp-jaune'}`}>{etat}</span>
        {w.en_pause && <span className="stamp stamp-rouge" style={{ marginLeft: '.4rem' }}>en pause</span>}
        <Crayon type="oeuvre" onNotif={onNotif} onChange={() => onChange?.()}
          cible={{ id: w.id, titre: w.titre, description: w.description, en_pause: w.en_pause, auteur: { id: w.auteur_id, pseudo: w.auteur_pseudo } }} />

        {aMoi && w.statut === 'collection' && !vente && (
          <div className="dessin-actions">
            <button type="button" className="btn btn-noir btn-sm" disabled={busy} onClick={() => setVente({ mise: 10, prix: '', duree: 3 })}>⚑ Vendre à l’E-market</button>
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={telecharger} title="L’image en haute définition, pour l’imprimer ou la garder">↓ Haute définition</button>
          </div>
        )}
        {aMoi && w.statut === 'en_vente' && (
          <div className="dessin-actions">
            {onVoirVente && <button type="button" className="btn btn-outline btn-sm" onClick={() => onVoirVente(w)}>Voir la vente →</button>}
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={telecharger}>↓ Haute définition</button>
          </div>
        )}

        {vente && (
          <div className="remise-form">
            <p className="caption-gris" style={{ margin: 0 }}>En argent du site. L’acheteur la reçoit dans sa collection ; la banque prélève sa commission.</p>
            <div className="field"><label htmlFor={`mise-${w.id}`}>Mise de départ</label><input id={`mise-${w.id}`} type="number" min="1" step="5" value={vente.mise} onChange={e => setVente({ ...vente, mise: e.target.value })} /></div>
            <div className="field"><label htmlFor={`prix-${w.id}`}>Achat immédiat (facultatif)</label><input id={`prix-${w.id}`} type="number" min="1" step="5" value={vente.prix} onChange={e => setVente({ ...vente, prix: e.target.value })} placeholder="aucun" /></div>
            <div className="field"><label>Durée</label>
              <div className="filter-row">{DUREES.map(x => <button key={x.jours} type="button" className={`chip ${Number(vente.duree) === x.jours ? 'active' : ''}`} onClick={() => setVente({ ...vente, duree: x.jours })}>{x.label}</button>)}</div>
            </div>
            <div className="dessin-actions">
              <button type="button" className="btn btn-noir btn-sm" disabled={busy || !(Number(vente.mise) >= 1)} onClick={vendre}>→ Mettre aux enchères</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setVente(null)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
