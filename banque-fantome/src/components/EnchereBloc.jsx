import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DUREES, INCREMENT_MIN, estEnCours, echeance, enchereMinimale, tempsRestant, urgent, commission, messageErreur } from '../utils/encheres'

// Bloc « hôtel des ventes » d'une fiche objet : enchère courante, compte à rebours,
// formulaire d'enchère / achat immédiat, historique, actions du vendeur.
// `objet` est une vente (mise_depart non nulle). `onChange(objetMisAJour)` est appelé après chaque action.
export default function EnchereBloc({ objet, onChange, onNotif, onContacter }) {
  const { user, solde, estBanquier, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const versConnexion = () => navigate(`/connexion?retour=${encodeURIComponent(location.pathname + location.search)}`)
  const [montant, setMontant] = useState(enchereMinimale(objet))
  const [encheres, setEncheres] = useState([])
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  const [remise, setRemise] = useState(null) // formulaire de remise en vente { mise, prix, duree }
  const [aConfirmer, setAConfirmer] = useState(null) // 'encherir' | 'acheter' | 'defaire' : un geste qui engage se confirme

  const enCours = estEnCours(objet)
  const isOwn = user && objet.user_id === user.id
  const billet = !!objet.dessin_id           // vente de la bourse : un billet dessiné dans l'atelier
  const oeuvre = !!objet.oeuvre_id           // vente du market : une œuvre des ateliers (2026-10-19)
  const banque = !!objet.vendeur_banque      // vente de la banque (affichage, contact)
  // Le market (2026-10-19) : on enchérit en promesses de billets papier, rien n'est débité,
  // le gagnant paie en main propre. Seule la bourse se paie avec l'argent du site.
  // Bourse et E-market se paient en argent du site ; le bon coin et la banque vend, en billets papier.
  const papier = !billet && !oeuvre
  const chose = billet ? 'Le billet' : 'L’œuvre'
  const vendeur = banque ? 'la banque' : objet.pseudo || 'le vendeur'
  const meneur = user && objet.encherisseur_id === user.id
  const minimum = enchereMinimale(objet)
  const disponible = solde + (meneur ? objet.enchere_courante : 0) // ma mise en cours me revient si je surenchéris

  // Compte à rebours (une fois par minute suffit, sauf dernière heure)
  useEffect(() => {
    if (!enCours) return
    const t = setInterval(() => setTick(n => n + 1), urgent(echeance(objet)) ? 1000 : 30000)
    return () => clearInterval(t)
  }, [echeance(objet), enCours])

  // Le minimum bouge quand quelqu'un surenchérit
  useEffect(() => { setMontant(m => (m == null || m < minimum ? minimum : m)) }, [minimum])

  // Historique des enchères + mise à jour en direct de l'objet
  useEffect(() => {
    chargerEncheres()
    const channel = supabase.channel(`objet-${objet.id}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'objets', filter: `id=eq.${objet.id}` },
        payload => { onChange?.({ ...objet, ...payload.new }); chargerEncheres() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [objet.id])

  async function chargerEncheres() {
    const { data } = await supabase.from('encheres').select('pseudo, montant, statut, created_at')
      .eq('objet_id', objet.id).order('created_at', { ascending: false }).limit(8)
    setEncheres(data || [])
  }

  async function recharger() {
    const { data } = await supabase.from('objets').select('*').eq('id', objet.id).single()
    if (data) onChange?.(data)
    chargerEncheres()
    refreshProfile()
  }

  async function rpc(fn, args, okMsg) {
    if (!user) { versConnexion(); return }
    setAConfirmer(null)
    setBusy(true)
    const { data, error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { onNotif?.({ msg: messageErreur(error), type: 'err' }); return }
    onNotif?.({ msg: typeof okMsg === 'function' ? okMsg(data) : okMsg, type: 'ok' })
    recharger()
  }

  const conclu = d => papier ? `C'est à vous, pour ${d?.montant} billets papier : contactez ${vendeur} pour la remise.` : `C'est à vous, pour ${d?.montant} billets.`
  const encherir = () => rpc('placer_enchere', { p_objet: objet.id, p_montant: Number(montant) },
    d => d?.mode === 'achat' ? conclu(d) : papier ? `Promesse de ${d?.montant} billets papier posée.` : `Enchère de ${d?.montant} billets posée.`)
  const acheter = () => rpc('acheter_immediat', { p_objet: objet.id }, conclu)
  const retirer = () => rpc('retirer_vente', { p_objet: objet.id }, 'Vente retirée.')
  const remettre = () => rpc('remettre_en_vente', { p_objet: objet.id, p_mise: Number(remise.mise), p_prix_achat: remise.prix ? Number(remise.prix) : null, p_duree: Number(remise.duree) }, 'Remis en vente.')
  // Market : l'acheteur ne vient pas. Le vendeur ou la banque défait la vente (supabase_garde_fous.sql).
  const defaire = () => rpc('annuler_adjudication_papier', { p_objet: objet.id }, 'Vente défaite : l’objet est de nouveau à vous, vous pouvez le remettre en vente.')
  const payer = () => rpc('payer_avec_compte', { p_objet: objet.id }, 'Réglé avec votre compte. Reste à venir chercher l’objet à la banque.')

  // ─── Vente terminée ───
  if (!enCours) {
    const vendu = objet.statut === 'échangé'
    return (
      <div className="enchere-bloc terminee">
        <div className="enchere-ligne">
          <div>
            <div className="meta-label">{vendu ? 'Adjugé' : objet.statut === 'retiré' ? 'Retiré de la vente' : objet.statut === 'disponible' ? 'Clôture en cours' : 'Expiré sans enchère'}</div>
            {vendu && <div className="enchere-prix">{objet.prix_final} <small>billets</small></div>}
          </div>
          {vendu && <div className="enchere-meneur">à <strong>{objet.vendu_a_pseudo || '?'}</strong>{objet.vendu_at && ` · ${new Date(objet.vendu_at).toLocaleDateString('fr-FR')}`}</div>}
        </div>
        {vendu && user && !papier && (isOwn || objet.vendu_a === user.id) && (
          <p className="texte-aide" style={{ marginTop: '.8rem' }}>
            {isOwn
              ? `Vendu : vous touchez ${objet.prix_final - commission(objet.prix_final)} billets (commission ${commission(objet.prix_final)}). ${chose} est passé${oeuvre ? 'e' : ''} dans la collection de ${objet.vendu_a_pseudo || "l'acheteur"}.`
              : `${chose} est dans votre collection${oeuvre ? ' : téléchargez-la en grand, gardez-la ou revendez-la' : ' : vous pouvez le garder, l’encaisser ou le revendre'}. `}
            {!isOwn && <Link to={`/collection?type=${oeuvre ? 'oeuvres' : 'billets'}`} className="lien-texte">Ma collection →</Link>}
          </p>
        )}
        {vendu && user && papier && (isOwn || objet.vendu_a === user.id) && (
          <p className="texte-aide" style={{ marginTop: '.8rem' }}>
            {objet.regle_compte_at
              ? (isOwn ? `${objet.vendu_a_pseudo || "L'acheteur"} a réglé avec son compte. ` : 'Réglé avec votre compte. ')
              : isOwn
                ? `${objet.vendu_a_pseudo || "L'acheteur"} vous doit ${objet.prix_final} billets papier. `
                : `Vous devez ${objet.prix_final} billets papier à ${vendeur}${banque ? ', ou réglez avec votre compte' : ''}. `}
            Reste la remise en main propre : {' '}
            <button type="button" className="lien-texte" onClick={onContacter}>{isOwn ? "écrire à l'acheteur" : banque ? 'contacter la banque (rendez-vous ou livraison)' : 'écrire au vendeur'}</button>.
          </p>
        )}
        {/* La banque vend aussi contre l'argent du site (supabase_bon_coin.sql, payer_avec_compte) */}
        {vendu && user && banque && papier && objet.vendu_a === user.id && !objet.regle_compte_at && (
          aConfirmer === 'payer'
            ? <div className="enchere-actions" style={{ marginTop: '.8rem' }}>
                <span className="texte-aide">{objet.prix_final} billets seront débités de votre solde ({solde ?? 0} disponibles).</span>
                <button type="button" className="btn btn-jaune btn-sm" disabled={busy} onClick={payer}>Confirmer</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAConfirmer(null)}>Non</button>
              </div>
            : <button type="button" className="btn btn-jaune btn-sm" style={{ marginTop: '.8rem' }} disabled={busy || (solde ?? 0) < objet.prix_final} onClick={() => setAConfirmer('payer')}>
                ◈ Payer avec mon compte · {objet.prix_final}
              </button>
        )}
        {vendu && papier && (isOwn || estBanquier) && (
          aConfirmer === 'defaire'
            ? <div className="enchere-actions" style={{ marginTop: '.8rem' }}>
                <span className="texte-aide">L'acheteur perd l'objet{objet.regle_compte_at ? ' (il est remboursé sur son compte)' : ''}, et l'objet revient {isOwn ? 'dans vos ventes' : 'à son vendeur'}.</span>
                <button type="button" className="btn btn-rouge btn-sm" disabled={busy} onClick={defaire}>Confirmer</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAConfirmer(null)}>Non</button>
              </div>
            : <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '.8rem' }} onClick={() => setAConfirmer('defaire')}>
                Défaire la vente (personne n'est venu)
              </button>
        )}
        {isOwn && !papier && (objet.statut === 'retiré' || objet.statut === 'expiré') && (
          <p className="texte-aide" style={{ marginTop: '.8rem' }}>{chose} est revenu{oeuvre ? 'e' : ''} dans votre <Link to={`/collection?type=${oeuvre ? 'oeuvres' : 'billets'}`} className="lien-texte">collection</Link> : vous pouvez l{oeuvre ? 'a' : 'e'} remettre en vente depuis là.</p>
        )}
        {isOwn && papier && (objet.statut === 'expiré' || objet.statut === 'retiré') && (
          remise
            ? <div className="remise-form">
                <div className="field"><label>Mise de départ</label><input type="number" min="1" step="5" value={remise.mise} onChange={e => setRemise({ ...remise, mise: e.target.value })} /></div>
                <div className="field"><label>Achat immédiat (facultatif)</label><input type="number" min="1" step="5" value={remise.prix} onChange={e => setRemise({ ...remise, prix: e.target.value })} placeholder="aucun" /></div>
                <div className="field"><label>Durée</label>
                  <div className="filter-row">{DUREES.map(d => <button key={d.jours} type="button" className={`chip ${Number(remise.duree) === d.jours ? 'active' : ''}`} onClick={() => setRemise({ ...remise, duree: d.jours })}>{d.label}</button>)}</div>
                </div>
                <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-noir btn-sm" disabled={busy} onClick={remettre}>→ Remettre en vente</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setRemise(null)}>Annuler</button>
                </div>
              </div>
            : <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '.8rem' }} onClick={() => setRemise({ mise: objet.mise_depart, prix: objet.prix_achat || '', duree: objet.duree_jours || 3 })}>↻ Remettre en vente</button>
        )}
      </div>
    )
  }

  // ─── Vente en cours ───
  return (
    <div className="enchere-bloc">
      <div className="enchere-ligne">
        <div>
          <div className="meta-label">{objet.enchere_courante != null ? 'Enchère actuelle' : 'Mise de départ'}</div>
          <div className="enchere-prix">{objet.enchere_courante ?? objet.mise_depart} <small>{papier ? 'billets papier' : 'billets'}</small></div>
          {objet.encherisseur_pseudo && <div className="enchere-meneur">meneur : <strong>{meneur ? 'vous' : objet.encherisseur_pseudo}</strong> · {objet.nb_encheres} enchère{objet.nb_encheres > 1 ? 's' : ''}</div>}
        </div>
        <div className="enchere-droite">
          <div className="meta-label">Se termine dans</div>
          <div className={`enchere-timer ${urgent(echeance(objet)) ? 'urgent' : ''}`} key={tick}>{tempsRestant(echeance(objet))}</div>
          {objet.prix_achat && <div className="enchere-meneur">achat immédiat : <strong>{objet.prix_achat}</strong></div>}
        </div>
      </div>

      {isOwn ? (
        <div className="enchere-actions">
          <span className="texte-aide">{billet ? "C'est votre billet." : oeuvre ? "C'est votre œuvre." : banque ? 'Vente de la banque.' : "C'est votre dépôt."}</span>
          {objet.nb_encheres === 0 && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={retirer}>Retirer la vente</button>}
        </div>
      ) : !user ? (
        <div className="enchere-actions">
          <span className="texte-aide">Connectez-vous pour enchérir.</span>
          <button type="button" className="btn btn-noir btn-sm" onClick={versConnexion}>→ Se connecter</button>
        </div>
      ) : aConfirmer === 'encherir' || aConfirmer === 'acheter' ? (
        <div className="enchere-actions">
          <span className="texte-aide">
            {aConfirmer === 'acheter'
              ? (papier ? `Vous vous engagez à payer ${objet.prix_achat} billets papier à ${vendeur}, en main propre.` : `${objet.prix_achat} billets seront débités de votre solde.`)
              : (papier ? `Vous promettez ${Number(montant)} billets papier à ${vendeur}, payables en main propre si vous l'emportez.` : `${Number(montant)} billets seront bloqués sur votre solde tant que vous menez.`)}
          </span>
          <button type="button" className="btn btn-jaune btn-sm" disabled={busy} onClick={aConfirmer === 'acheter' ? acheter : encherir}>Confirmer</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setAConfirmer(null)}>Non</button>
        </div>
      ) : (
        <>
          <div className="enchere-form">
            <div className="enchere-saisie">
              <button type="button" className="chip" onClick={() => setMontant(m => Math.max(minimum, Number(m) - INCREMENT_MIN))} aria-label="Moins">−</button>
              <input type="number" min={minimum} step={INCREMENT_MIN} value={montant} onChange={e => setMontant(e.target.value)} aria-label="Montant de l'enchère" id="enchere-montant" />
              <button type="button" className="chip" onClick={() => setMontant(m => Number(m) + INCREMENT_MIN)} aria-label="Plus">+</button>
              {[10, 50].map(n => <button key={n} type="button" className="chip" onClick={() => setMontant(m => Number(m) + n)}>+{n}</button>)}
            </div>
            <button type="button" className="btn btn-jaune" disabled={busy || Number(montant) < minimum || (!papier && Number(montant) > disponible)} onClick={() => setAConfirmer('encherir')}>
              {papier ? '⚑ Promettre' : '⚑ Enchérir'} {Number(montant) || ''}
            </button>
            {objet.prix_achat && (
              <button type="button" className="btn btn-noir" disabled={busy || (!papier && disponible < objet.prix_achat)} onClick={() => setAConfirmer('acheter')}>
                {papier ? '⚡ Je le prends' : '⚡ Acheter maintenant'} · {objet.prix_achat}
              </button>
            )}
          </div>
          <div className="enchere-aide">
            {papier
              ? <>minimum {minimum} billets papier · rien n'est débité de votre compte</>
              : <>minimum {minimum} · votre solde {solde} billets{meneur ? ' (+ votre mise en cours)' : ''}</>}
            {!papier && Number(montant) > disponible && <span className="msg-err" style={{ margin: '0 0 0 .6rem', display: 'inline' }}>solde insuffisant : <button type="button" className="lien-texte" onClick={() => navigate('/creer?atelier=billet')}>dessiner des billets</button></span>}
          </div>
        </>
      )}

      {encheres.length > 0 && (
        <details className="enchere-histo">
          <summary>Historique ({encheres.length})</summary>
          <ul>
            {encheres.map((e, i) => (
              <li key={i} className={e.statut}>
                <span>{e.pseudo}</span><strong>{e.montant}</strong>
                <span className="caption-gris">{new Date(e.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
