import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import CarteDessin from '../components/CarteDessin'
import AtelierBillet from '../components/AtelierBillet'
import Notif from '../components/Notif'
import { messageErreur } from '../utils/encheres'

// La bourse aux billets (2026-10-18, à la demande de Jiiji) : remplace le guichet photo.
// L'argent se dessine dans l'atelier, sur un billet habillé par le générateur de
// machine-a-bifton. Un billet terminé s'encaisse (la banque le garde, le compte est
// crédité) ou se vend aux enchères ; acheté, il rejoint la collection de l'acheteur,
// qui peut le revendre. Les règles font foi côté base : supabase_bourse.sql.
// ?onglet=atelier, ?onglet=collection ou ?onglet=coffre ; sans paramètre, les ventes en cours.
const ONGLETS = [
  { id: 'vente', label: 'En vente' },
  { id: 'atelier', label: 'Dessiner un billet' },
  { id: 'collection', label: 'Ma collection' },
  { id: 'coffre', label: 'Le coffre de la banque' },
]

// Encaissements encore permis sur 24 h glissantes (même calcul que encaisser_dessin)
function useQuota(user) {
  const [quota, setQuota] = useState(null)
  const recharger = useCallback(async () => {
    if (!user) { setQuota(null); return }
    const depuis = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    const [{ data: banque }, { count }] = await Promise.all([
      supabase.from('banque').select('plafond_encaissement_jour').eq('id', 1).single(),
      supabase.from('billets_emis').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', depuis),
    ])
    const plafond = banque?.plafond_encaissement_jour ?? 3
    setQuota({ plafond, restant: Math.max(0, plafond - (count || 0)) })
  }, [user])
  useEffect(() => { recharger() }, [recharger])
  return [quota, recharger]
}

export default function Bourse() {
  const { user, refreshProfile } = useAuth()
  const [params, setParams] = useSearchParams()
  const onglet = ONGLETS.some(o => o.id === params.get('onglet')) ? params.get('onglet') : 'vente'
  const [notif, setNotif] = useState(null)
  const [selected, setSelected] = useState(null) // vente ouverte en fiche
  const [quota, rechargerQuota] = useQuota(user)

  const apresAction = useCallback(() => { rechargerQuota(); refreshProfile?.() }, [rechargerQuota, refreshProfile])

  // Ouvre la fiche de la vente en cours d'un billet
  async function voirVente(d) {
    const { data } = await supabase.from('objets').select('*').eq('dessin_id', d.id).eq('statut', 'disponible').maybeSingle()
    if (data) setSelected(data)
    else setNotif({ msg: 'Cette vente vient de se terminer.', type: 'err' })
  }

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Bourse aux billets</h2>
          <span className="count">L'argent se dessine ici</span>
        </div>
        <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
          Dans l'atelier, vous dessinez sur un billet de la banque. Une fois terminé, deux possibilités :
          l'<strong>encaisser</strong> (la banque le garde et crédite votre compte de sa valeur), ou le <strong>vendre aux enchères</strong> aux
          autres comptes, qui paient avec les billets qu'ils ont encaissés. Un billet acheté rejoint votre collection : vous le gardez ou le revendez.
          Les objets, eux, s'échangent au <Link to="/market" className="lien-texte">market</Link>, en billets papier.
        </p>
        <div className="filter-row participer-onglets" role="tablist">
          {ONGLETS.map(o => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`chip ${onglet === o.id ? 'active' : ''}`}
              onClick={() => setParams(o.id === 'vente' ? {} : { onglet: o.id }, { replace: true })}>{o.label}</button>
          ))}
        </div>

        {onglet === 'vente' && <OngletVente onOuvrir={setSelected} />}
        {onglet === 'atelier' && <OngletAtelier quota={quota} onNotif={setNotif} onChange={apresAction} onVoirVente={voirVente} />}
        {onglet === 'collection' && <OngletCollection quota={quota} onNotif={setNotif} onChange={apresAction} onVoirVente={voirVente} />}
        {onglet === 'coffre' && <OngletCoffre />}
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); apresAction() }} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}

// ─── Les ventes ───
const FILTRES = [['disponible', 'en vente'], ['échangé', 'adjugés']]
const TRIS = [['recent', 'Plus récent'], ['fin', 'Se termine bientôt'], ['prix', 'Prix croissant']]

function OngletVente({ onOuvrir }) {
  const [ventes, setVentes] = useState(null)
  const [statut, setStatut] = useState('disponible')
  const [tri, setTri] = useState('recent')

  // Les ventes échues sont adjugées (ou relancées) à l'ouverture, comme au market
  const [version, setVersion] = useState(0)
  useEffect(() => { supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(v => v + 1)) }, [])

  useEffect(() => {
    let annule = false
    let q = supabase.from('objets').select('*').not('dessin_id', 'is', null).eq('statut', statut).limit(120)
    if (tri === 'fin' && statut === 'disponible') q = q.order('expire_at', { ascending: true })
    else if (tri === 'prix') q = q.order('enchere_courante', { ascending: true, nullsFirst: true }).order('mise_depart', { ascending: true })
    else q = q.order(statut === 'échangé' ? 'vendu_at' : 'created_at', { ascending: false })
    q.then(({ data }) => { if (!annule) setVentes(data || []) })
    return () => { annule = true }
  }, [statut, tri, version])

  return (
    <>
      <div className="market-toolbar">
        <div className="filter-row">
          {FILTRES.map(([v, l]) => <button key={v} type="button" className={`chip ${statut === v ? 'active' : ''}`} aria-pressed={statut === v} onClick={() => setStatut(v)}>{l}</button>)}
          <span className="filter-label" style={{ marginLeft: '.6rem' }}>Trier</span>
          {TRIS.map(([v, l]) => <button key={v} type="button" className={`chip ${tri === v ? 'active' : ''}`} aria-pressed={tri === v} onClick={() => setTri(v)}>{l}</button>)}
        </div>
      </div>
      {ventes === null
        ? <div className="loader">Chargement<span className="blink">_</span></div>
        : ventes.length === 0
          ? <div className="market-vide">
              <div className="titre">{statut === 'disponible' ? 'Aucun billet en vente' : 'Aucun billet adjugé'}</div>
              <p style={{ margin: '0 auto' }}>Le premier billet mis en vente fixera le cours.</p>
              <Link to="/bourse?onglet=atelier" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Dessiner un billet</Link>
            </div>
          : <div className="grid-3">{ventes.map(o => <ObjetCard key={o.id} objet={o} onClick={onOuvrir} />)}</div>}
    </>
  )
}

// ─── L'atelier ───
function OngletAtelier({ quota, onNotif, onChange, onVoirVente }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [titre, setTitre] = useState('')
  const [devise, setDevise] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [nouveau, setNouveau] = useState(null) // le billet qui vient d'être déposé

  async function rechargerNouveau(id = nouveau?.id) {
    if (!id) return
    const { data } = await supabase.from('dessins').select('*').eq('id', id).single()
    if (data) setNouveau(data)
  }

  // Appelé par l'atelier. Lever une erreur garde le brouillon dans le navigateur.
  async function valider({ blob, type, coupure, graine, numero, trace }) {
    if (!user) {
      onNotif({ msg: 'Connectez-vous pour déposer votre billet : votre dessin reste gardé dans ce navigateur.', type: 'err' })
      navigate('/connexion')
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
        <Link to="/bourse?onglet=collection" className="btn btn-outline">Ma collection →</Link>
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
          Vous pouvez dessiner sans compte ; pour déposer le billet, il faudra <Link to="/connexion" className="lien-texte">ouvrir un compte</Link>.
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

// ─── Ma collection ───
function OngletCollection({ quota, onNotif, onChange, onVoirVente }) {
  const { user } = useAuth()
  const [miens, setMiens] = useState(null)
  const [encaisses, setEncaisses] = useState([])
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let annule = false
    Promise.all([
      supabase.from('dessins').select('*').eq('proprietaire_id', user.id).order('created_at', { ascending: false }).limit(200),
      supabase.from('dessins').select('*').eq('auteur_id', user.id).in('statut', ['encaisse', 'annule']).order('created_at', { ascending: false }).limit(48),
    ]).then(([a, b]) => { if (!annule) { setMiens(a.data || []); setEncaisses(b.data || []) } })
    return () => { annule = true }
  }, [user, version])

  if (!user) return (
    <p className="texte-aide">Votre collection apparaît ici une fois connecté. <Link to="/connexion" className="lien-texte">Se connecter →</Link></p>
  )
  if (miens === null) return <div className="loader">Chargement<span className="blink">_</span></div>

  const changer = () => { onChange(); setVersion(v => v + 1) }
  return (
    <>
      {miens.length === 0
        ? <div className="market-vide">
            <div className="titre">Collection vide</div>
            <p style={{ margin: '0 auto' }}>Les billets que vous dessinez ou achetez arrivent ici.</p>
            <Link to="/bourse?onglet=atelier" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Dessiner un billet</Link>
          </div>
        : <div className="dessins-liste">
            {miens.map(d => <CarteDessin key={d.id} dessin={d} moi={user.id} quota={quota} onNotif={onNotif} onChange={changer} onVoirVente={onVoirVente} />)}
          </div>}
      {encaisses.length > 0 && (
        <section style={{ marginTop: '2.5rem' }}>
          <div className="section-head"><h2>Encaissés</h2><span className="count">Gardés par la banque</span></div>
          <div className="dessins-liste">
            {encaisses.map(d => <CarteDessin key={d.id} dessin={d} moi={user.id} />)}
          </div>
        </section>
      )}
    </>
  )
}

// ─── Le coffre (2026-10-19, demande de Jiiji) : les billets encaissés, que la banque garde ───
function OngletCoffre() {
  const { user } = useAuth()
  const [billets, setBillets] = useState(null)

  useEffect(() => {
    let annule = false
    supabase.from('dessins').select('*').eq('statut', 'encaisse').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => { if (!annule) setBillets(data || []) })
    return () => { annule = true }
  }, [])

  if (billets === null) return <div className="loader">Chargement<span className="blink">_</span></div>
  if (billets.length === 0) return (
    <div className="market-vide">
      <div className="titre">Le coffre est vide</div>
      <p style={{ margin: '0 auto' }}>Chaque billet encaissé vient s'y ranger.</p>
      <Link to="/bourse?onglet=atelier" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Dessiner un billet</Link>
    </div>
  )
  const total = billets.reduce((t, d) => t + d.coupure, 0)
  return (
    <section className="coffre">
      <p className="texte-aide" style={{ marginBottom: '1.2rem' }}>
        Les billets encaissés ne circulent plus : la banque les garde, en échange de l'argent qu'elle a crédité à leurs auteurs.
        Le coffre en compte <strong>{billets.length}</strong>, pour une valeur de <strong>{total.toLocaleString('fr-FR')} billets</strong>.
      </p>
      <div className="dessins-liste">
        {billets.map(d => <CarteDessin key={d.id} dessin={d} moi={user?.id} />)}
      </div>
    </section>
  )
}
