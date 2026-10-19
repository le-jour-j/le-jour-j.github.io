import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import ObjetModal from '../components/ObjetModal'
import CarteOeuvre from '../components/CarteOeuvre'
import Notif from '../components/Notif'
import { OngletAtelier, useQuota } from './Bourse'
import { GENRES, COLONNES_OEUVRE, deposerOeuvre } from '../lib/oeuvres'
import { verifierTexte } from '../lib/billet/motsRefuses'
import { messageErreur } from '../utils/encheres'
import { getPublicImageUrl } from '../utils/images'

// Créer (2026-10-19, demande de Jiiji) : tous les ateliers de la banque au même endroit.
// Le billet fait de l'argent (encaissé ou vendu à la bourse) ; les autres ateliers font des
// œuvres, uniques, qui se vendent à l'E-market en argent du site. Tout arrive dans la collection.
// ?atelier=billet|paint|poesie|image|collage ; sans paramètre, la vitrine des ateliers.

const ATELIERS = {
  paint:   lazy(() => import('../components/ateliers/AtelierPaint')),
  poesie:  lazy(() => import('../components/ateliers/AtelierPoesie')),
  image:   lazy(() => import('../components/ateliers/AtelierImage')),
  collage: lazy(() => import('../components/ateliers/AtelierCollage')),
}
const CHOIX = [
  { id: 'billet', nom: 'Billet', icone: '◈', phrase: 'Dessiner un billet : l’encaisser ou le vendre à la bourse', sortie: 'de l’argent' },
  ...Object.entries(GENRES).map(([id, g]) => ({ id, nom: g.nom, icone: g.icone, phrase: g.phrase, sortie: 'une œuvre pour l’E-market' })),
]

export default function Creer() {
  const [params, setParams] = useSearchParams()
  const atelier = CHOIX.some(c => c.id === params.get('atelier')) ? params.get('atelier') : null
  const { user, refreshProfile } = useAuth()
  const [notif, setNotif] = useState(null)
  const [selected, setSelected] = useState(null) // vente ouverte en fiche
  const [quota, rechargerQuota] = useQuota(user)
  const apresAction = useCallback(() => { rechargerQuota(); refreshProfile?.() }, [rechargerQuota, refreshProfile])

  // La vente en cours d'un billet ou d'une œuvre, ouverte en fiche
  async function voirVente(x) {
    const col = x.coupure ? 'dessin_id' : 'oeuvre_id'
    const { data } = await supabase.from('objets').select('*').eq(col, x.id).eq('statut', 'disponible').maybeSingle()
    if (data) setSelected(data)
    else setNotif({ msg: 'Cette vente vient de se terminer.', type: 'err' })
  }
  const choisir = id => { setParams(id ? { atelier: id } : {}, { replace: false }); window.scrollTo({ top: 0 }) }

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Créer</h2>
          {user ? <Link to="/collection" className="count">Ma collection →</Link> : <span className="count">Les ateliers de la banque</span>}
        </div>

        {!atelier ? (
          <>
            <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
              Choisissez un atelier. Le billet fabrique de l’argent : encaissé, il crédite votre compte. Les autres ateliers
              fabriquent des œuvres uniques, qui rejoignent votre collection et se vendent à l’<Link to="/market?rayon=emarket" className="lien-texte">E-market</Link>,
              en argent du site. On peut commencer sans compte : il en faut un pour déposer.
            </p>
            <div className="creer-choix">
              {CHOIX.map(c => (
                <button key={c.id} type="button" className={`creer-carte ${c.id === 'billet' ? 'creer-carte-billet' : ''}`} onClick={() => choisir(c.id)}>
                  <span className="creer-icone" aria-hidden="true">{c.icone}</span>
                  <span className="creer-nom">{c.nom}</span>
                  <span className="creer-phrase">{c.phrase}</span>
                  <span className="creer-sortie">→ {c.sortie}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="filter-row participer-onglets" role="tablist" aria-label="Ateliers">
              <button type="button" className="chip" onClick={() => choisir(null)}>← Tous les ateliers</button>
              {CHOIX.map(c => (
                <button key={c.id} type="button" role="tab" aria-selected={atelier === c.id} className={`chip ${atelier === c.id ? 'active' : ''}`} onClick={() => choisir(c.id)}>
                  {c.icone} {c.nom}
                </button>
              ))}
            </div>
            {atelier === 'billet'
              ? <OngletAtelier quota={quota} onNotif={setNotif} onChange={apresAction} onVoirVente={voirVente} />
              : <DepotOeuvre key={atelier} genre={atelier} onNotif={setNotif} onVoirVente={voirVente} />}
          </>
        )}
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); apresAction() }} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}

// Un atelier d'œuvre : le cartel (titre, mot de l'artiste), l'atelier, puis le dépôt.
function DepotOeuvre({ genre, onNotif, onVoirVente }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const Atelier = ATELIERS[genre]
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [nouvelle, setNouvelle] = useState(null) // l'œuvre qui vient d'être déposée
  // Le collage puise aussi dans ce qu'on possède : ses billets et ses œuvres
  const [reserve, setReserve] = useState([])
  useEffect(() => {
    if (genre !== 'collage' || !user) return
    let annule = false
    Promise.all([
      supabase.from('oeuvres').select('titre, apercu_path').eq('proprietaire_id', user.id).neq('statut', 'annule').order('created_at', { ascending: false }).limit(24),
      supabase.from('dessins').select('titre, coupure, image_path').eq('proprietaire_id', user.id).order('created_at', { ascending: false }).limit(24),
    ]).then(([o, d]) => {
      if (annule) return
      setReserve([
        ...(o.data || []).map(w => ({ url: getPublicImageUrl(w.apercu_path), nom: w.titre })),
        ...(d.data || []).map(b => ({ url: getPublicImageUrl(b.image_path), nom: b.titre || `Billet de ${b.coupure}` })),
      ])
    })
    return () => { annule = true }
  }, [genre, user])

  async function recharger(id = nouvelle?.id) {
    if (!id) return
    const { data } = await supabase.from('oeuvres').select(COLONNES_OEUVRE).eq('id', id).single()
    if (data) setNouvelle(data)
  }

  // Appelé par l'atelier. Lever une erreur garde l'œuvre en cours et le brouillon.
  async function valider({ blob, type, largeur, hauteur, source }) {
    if (!user) {
      onNotif({ msg: 'Connectez-vous pour déposer votre œuvre : elle reste gardée dans ce navigateur.', type: 'err' })
      navigate(`/connexion?retour=${encodeURIComponent(`/creer?atelier=${genre}`)}`)
      throw new Error('connexion requise')
    }
    // Le poème a son propre titre : c'est celui de l'œuvre
    const t = (genre === 'poesie' ? source?.titre || '' : titre).trim()
    if (!t) {
      onNotif({ msg: genre === 'poesie' ? 'Donnez un titre à votre poème.' : 'Donnez un titre à votre œuvre (en haut de l’atelier).', type: 'err' })
      document.getElementById('oeuvre-titre')?.focus()
      throw new Error('titre requis')
    }
    const refus = verifierTexte(t) || verifierTexte(description)
    if (refus) { onNotif({ msg: refus, type: 'err' }); throw new Error('texte refusé') }
    setEnvoi(true)
    try {
      const { oeuvre_id } = await deposerOeuvre(user, { genre, titre: t, description: description.trim(), blob, type, largeur, hauteur, source })
      setTitre(''); setDescription('')
      await recharger(oeuvre_id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      onNotif({ msg: messageErreur(e), type: 'err' })
      throw e
    } finally { setEnvoi(false) }
  }

  if (nouvelle) return (
    <div className="atelier-choix">
      <p className="texte-aide"><strong>Votre œuvre est déposée dans votre collection.</strong> Vous pouvez la vendre à l’E-market dès maintenant, ou la garder.</p>
      <CarteOeuvre oeuvre={nouvelle} moi={user?.id} onNotif={onNotif} onVoirVente={onVoirVente} onChange={() => recharger()} />
      <div className="dessin-actions" style={{ marginTop: '1.2rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => setNouvelle(null)}>✎ Créer une autre œuvre</button>
        <Link to="/collection" className="btn btn-outline">Ma collection →</Link>
        <Link to="/market?rayon=emarket" className="btn btn-outline">L’E-market →</Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="atelier-cartel">
        {genre !== 'poesie' && (
          <div className="field">
            <label htmlFor="oeuvre-titre">Titre de l’œuvre *</label>
            <input id="oeuvre-titre" value={titre} maxLength={120} onChange={e => setTitre(e.target.value)} placeholder="ex : La pluie sur le guichet" />
          </div>
        )}
        <div className="field">
          <label htmlFor="oeuvre-mot">Le mot de l’artiste (facultatif)</label>
          <input id="oeuvre-mot" value={description} maxLength={400} onChange={e => setDescription(e.target.value)} placeholder="Une phrase sur l’œuvre, affichée au market" />
        </div>
      </div>
      {!user && (
        <p className="texte-aide" style={{ marginBottom: '1rem' }}>
          Vous pouvez créer sans compte ; pour déposer l’œuvre, il faudra <Link to={`/connexion?retour=${encodeURIComponent(`/creer?atelier=${genre}`)}`} className="lien-texte">ouvrir un compte</Link>.
        </p>
      )}
      <Suspense fallback={<div className="loader">Ouverture de l’atelier<span className="blink">_</span></div>}>
        <Atelier onValider={valider} enCours={envoi} libelleValider={user ? '→ Déposer dans ma collection' : '→ Déposer (connexion)'}
          {...(genre === 'collage' ? { reserve } : {})} />
      </Suspense>
    </>
  )
}
