import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import Portal from './Portal'
import MessageModal from './MessageModal'
import { useModal } from '../utils/useModal'
import { messageErreur } from '../utils/encheres'
import { verifierTexte } from '../lib/billet/motsRefuses'

// Le crayon de la banque (2026-10-19, demande de Jiiji : « un petit crayon pour édition sur
// chaque post des users », éditer, contacter, mettre en pause). Visible du seul banquier.
// type : objet | oeuvre | dessin ; cible : { id, titre, description, en_pause, auteur: { id, pseudo } }
// onChange(patch) : ce qui a changé ({ titre, description } ou { en_pause }), pour la carte qui l'affiche.
// La base fait le reste (supabase_moderation.sql, admin_moderer) : une œuvre ou un billet entraîne
// sa vente en cours, une vente d'œuvre son œuvre.

const NOMS = { objet: 'cette vente', oeuvre: 'cette œuvre', dessin: 'ce billet' }

export default function Crayon({ type, cible, onChange, onNotif, className = '' }) {
  const { estBanquier } = useAuth()
  const [ouvert, setOuvert] = useState(false)
  if (!estBanquier || !cible?.id) return null
  return (
    <>
      <button type="button" className={`crayon ${cible.en_pause ? 'en-pause' : ''} ${className}`} title="Modérer (banque)" aria-label="Modérer"
        onClick={e => { e.stopPropagation(); e.preventDefault(); setOuvert(true) }}>
        ✎{cible.en_pause && <span className="crayon-pause">en pause</span>}
      </button>
      {ouvert && <FenetreCrayon type={type} cible={cible} onChange={onChange} onNotif={onNotif} onClose={() => setOuvert(false)} />}
    </>
  )
}

function FenetreCrayon({ type, cible, onChange, onNotif, onClose }) {
  const [titre, setTitre] = useState(cible.titre || '')
  const [description, setDescription] = useState(cible.description || '')
  const [enPause, setEnPause] = useState(!!cible.en_pause)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ecrire, setEcrire] = useState(false)
  useModal(ecrire ? null : onClose)

  async function agir(action, extra = {}) {
    setBusy(true); setMsg(null)
    const { error } = await supabase.rpc('admin_moderer', { p_type: type, p_id: cible.id, p_action: action, ...extra })
    setBusy(false)
    if (error) { setMsg({ type: 'err', texte: messageErreur(error) }); return false }
    return true
  }

  async function basculerPause() {
    const pause = !enPause
    if (!(await agir(pause ? 'pause' : 'reprendre'))) return
    setEnPause(pause)
    onChange?.({ en_pause: pause })
    const texte = pause ? `En pause : ${NOMS[type]} n’est plus visible que de son auteur et de la banque.` : 'Remis en ligne.'
    setMsg({ type: 'ok', texte }); onNotif?.({ msg: texte, type: 'ok' })
  }

  async function enregistrer() {
    const t = titre.trim()
    if (!t) { setMsg({ type: 'err', texte: 'Le titre ne peut pas être vide.' }); return }
    const refus = verifierTexte(t) || verifierTexte(description)
    if (refus) { setMsg({ type: 'err', texte: refus }); return }
    if (!(await agir('editer', { p_titre: t, p_description: description }))) return
    onChange?.(type === 'dessin' ? { titre: t } : { titre: t, description: description.trim() || null })
    setMsg({ type: 'ok', texte: 'Modifié.' }); onNotif?.({ msg: 'Modifié.', type: 'ok' })
  }

  const auteur = cible.auteur || {}
  return (
    <Portal>
      <div className="modal-bg" onClick={e => { e.stopPropagation(); onClose() }}>
        <div className="modal crayon-fenetre" role="dialog" aria-modal="true" aria-labelledby="crayon-titre" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
          <div className="meta-label">✎ Modération · {NOMS[type]}</div>
          <h3 id="crayon-titre" className="modal-titre" style={{ marginBottom: '.3rem' }}>{cible.titre || 'Sans titre'}</h3>
          <p className="caption-gris" style={{ marginBottom: '1rem' }}>
            par <strong>{auteur.pseudo || '?'}</strong>
            {auteur.id && <> · <Link to={`/admin?compte=${auteur.id}`} className="lien-texte" onClick={onClose}>fiche du compte →</Link></>}
            {enPause && <span className="stamp stamp-rouge" style={{ marginLeft: '.6rem' }}>en pause</span>}
          </p>

          <div className="crayon-actions">
            <button type="button" className={`btn btn-sm ${enPause ? 'btn-jaune' : 'btn-rouge'}`} disabled={busy} onClick={basculerPause}>
              {enPause ? '▶ Remettre en ligne' : '⏸ Mettre en pause'}
            </button>
            {auteur.id && <button type="button" className="btn btn-outline btn-sm" onClick={() => setEcrire(true)}>✉ Contacter {auteur.pseudo || 'l’auteur'}</button>}
          </div>
          <p className="caption-gris" style={{ margin: '.5rem 0 1.2rem' }}>
            En pause : invisible des vitrines, enchères gelées, ni vente ni encaissement. L’auteur la voit encore.
          </p>

          <div className="field">
            <label htmlFor="crayon-t">Titre</label>
            <input id="crayon-t" value={titre} maxLength={120} onChange={e => setTitre(e.target.value)} />
          </div>
          {type !== 'dessin' && (
            <div className="field">
              <label htmlFor="crayon-d">Description</label>
              <textarea id="crayon-d" rows={3} value={description} maxLength={2000} onChange={e => setDescription(e.target.value)} />
            </div>
          )}
          <button type="button" className="btn btn-noir btn-sm" disabled={busy} onClick={enregistrer}>✓ Enregistrer</button>
          {msg && <p className={msg.type === 'err' ? 'msg-err' : 'msg-ok'} style={{ marginTop: '.8rem' }}>{msg.texte}</p>}
        </div>
      </div>
      {ecrire && (
        <MessageModal
          objet={{ id: type === 'objet' ? cible.id : null, titre: cible.titre }}
          destinataire={{ id: auteur.id, pseudo: auteur.pseudo }}
          onClose={() => setEcrire(false)} />
      )}
    </Portal>
  )
}
