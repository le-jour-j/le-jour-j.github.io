import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from './AuthContext'
import CarteDessin from './CarteDessin'
import AtelierBillet from './AtelierBillet'
import { COLONNES_DESSIN } from '../lib/dessins'
import { messageErreur } from '../utils/encheres'

// L'atelier à billets de /creer?atelier=billet : le cartel (titre, nom de la monnaie), l'atelier,
// puis le dépôt dans la collection. Un billet terminé s'encaisse (la banque le garde, le compte
// est crédité) ou se vend aux enchères au market, rayon « Billets ». Les règles font foi côté
// base : supabase_bourse.sql. (Était l'onglet « Atelier » de la page Bourse, sorti le 2026-11-01.)
export default function DepotBillet({ quota, onNotif, onChange, onVoirVente }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [titre, setTitre] = useState('')
  const [devise, setDevise] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [nouveau, setNouveau] = useState(null) // le billet qui vient d'être déposé

  async function rechargerNouveau(id = nouveau?.id) {
    if (!id) return
    const { data } = await supabase.from('dessins').select(COLONNES_DESSIN).eq('id', id).single()
    if (data) setNouveau(data)
  }

  // Appelé par l'atelier. Lever une erreur garde le brouillon dans le navigateur.
  async function valider({ blob, type, coupure, graine, numero, trace }) {
    if (!user) {
      onNotif({ msg: 'Connectez-vous pour déposer votre billet : votre dessin reste gardé dans ce navigateur.', type: 'err' })
      navigate(`/connexion?retour=${encodeURIComponent('/creer?atelier=billet')}`)
      throw new Error('connexion requise')
    }
    setEnvoi(true)
    try {
      const ext = type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : 'png'
      const chemin = `dessins/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(chemin, blob, { contentType: type, cacheControl: '31536000', upsert: false })
      if (upErr) throw upErr
      const { data, error } = await supabase.rpc('deposer_dessin', {
        p_coupure: coupure, p_graine: graine, p_code: `BF-${coupure}-${numero}`, p_image_path: chemin, p_trace: trace,
        p_titre: titre.trim() || null, p_devise: devise.trim() || null,
      })
      if (error) throw error
      setTitre('')
      await rechargerNouveau(data.dessin_id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      if (e?.message !== 'connexion requise') onNotif({ msg: messageErreur(e), type: 'err' })
      throw e
    } finally { setEnvoi(false) }
  }

  if (nouveau) return (
    <div className="atelier-choix">
      <p className="texte-aide"><strong>Votre billet est déposé dans votre collection.</strong> Que voulez-vous en faire ?</p>
      <CarteDessin dessin={nouveau} moi={user?.id} quota={quota} onNotif={onNotif} onVoirVente={onVoirVente}
        onChange={() => { onChange(); rechargerNouveau() }} />
      <div className="dessin-actions" style={{ marginTop: '1.2rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => setNouveau(null)}>✎ Dessiner un autre billet</button>
        <Link to="/collection?type=billets" className="btn btn-outline">Ma collection →</Link>
        <Link to="/market?rayon=billets" className="btn btn-outline">Les billets en vente →</Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="atelier-cartel">
        <div className="field">
          <label>Titre du billet (facultatif)</label>
          <input value={titre} maxLength={120} onChange={e => setTitre(e.target.value)} placeholder="ex : Le billet qui pleure" />
        </div>
        <div className="field">
          <label>Nom de votre monnaie (facultatif)</label>
          <input value={devise} maxLength={40} onChange={e => setDevise(e.target.value)} placeholder="ex : le Phantom" />
        </div>
      </div>
      {!user && (
        <p className="texte-aide" style={{ marginBottom: '1rem' }}>
          Vous pouvez dessiner sans compte ; pour déposer le billet, il faudra <Link to="/connexion?retour=%2Fcreer%3Fatelier%3Dbillet" className="lien-texte">ouvrir un compte</Link>.
        </p>
      )}
      {user && quota && (
        <p className="caption-gris" style={{ marginBottom: '1rem' }}>
          Encaissements possibles aujourd'hui : {quota.restant} sur {quota.plafond}. Au-delà, vos billets se gardent ou se vendent.
        </p>
      )}
      <AtelierBillet onValider={valider} enCours={envoi} libelleValider={user ? '→ Déposer ce billet' : '→ Déposer (connexion)'} />
    </>
  )
}
