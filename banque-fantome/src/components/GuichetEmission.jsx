import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { getPublicImageUrl } from '../utils/images'
import { VALEURS } from '../utils/rarete'
import { messageErreur } from '../utils/encheres'
import BilletModal from './BilletModal'

const TECHNIQUES = ['feutre', 'crayon', 'aquarelle', 'collage', 'linogravure', 'tampon', 'coloriage', 'numérique']

// Guichet d'émission : on fabrique un billet (c'est une œuvre : titre, artiste, technique, devise),
// on le photographie, on choisit sa dénomination → la banque le crédite sur le compte.
// C'est la seule façon de s'enrichir. Le banquier peut annuler un billet (le compte est alors débité).
export default function GuichetEmission({ onNotif }) {
  const { user, profile, solde, estBanquier, refreshProfile } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [valeur, setValeur] = useState(10)
  const [cartel, setCartel] = useState({ titre: '', artiste: '', technique: '', devise: '', description: '' })
  const [busy, setBusy] = useState(false)
  const [mesBillets, setMesBillets] = useState([])
  const [devises, setDevises] = useState([])
  const inputRef = useRef()

  useEffect(() => { charger() }, [user])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => { if (profile?.pseudo && !cartel.artiste) setCartel(c => ({ ...c, artiste: profile.pseudo })) }, [profile?.pseudo])

  function set(k, v) { setCartel(c => ({ ...c, [k]: v })) }

  async function charger() {
    supabase.rpc('cours_devises').then(({ data }) => setDevises(data || []))
    if (user) {
      const { data: miens } = await supabase.from('billets_emis').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
      setMesBillets(miens || [])
      // la dernière devise utilisée est proposée par défaut
      const derniere = (miens || []).find(b => b.devise)?.devise
      if (derniere) setCartel(c => (c.devise ? c : { ...c, devise: derniere }))
    } else setMesBillets([])
  }

  function choisir(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { onNotif?.({ msg: 'Image uniquement', type: 'err' }); return }
    if (f.size > 8 * 1024 * 1024) { onNotif?.({ msg: 'Image trop lourde (8 Mo max)', type: 'err' }); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  async function emettre() {
    if (!file) { onNotif?.({ msg: 'Photographiez d’abord votre billet.', type: 'err' }); return }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const name = `billets/${user.id}_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(name, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { data, error } = await supabase.rpc('emettre_billet', {
        p_valeur: valeur, p_image_path: name,
        p_titre: cartel.titre || null, p_artiste: cartel.artiste || null, p_technique: cartel.technique || null,
        p_devise: cartel.devise || null, p_description: cartel.description || null,
      })
      if (error) throw error
      onNotif?.({ msg: `« ${cartel.titre || 'Sans titre'} » émis : ${valeur} ${cartel.devise || 'billets'}. Solde : ${data?.solde}.`, type: 'ok' })
      setFile(null); setPreview(null); setCartel(c => ({ ...c, titre: '', description: '' }))
      refreshProfile(); charger()
    } catch (e) {
      onNotif?.({ msg: messageErreur(e), type: 'err' })
    } finally { setBusy(false) }
  }

  return (
    <section className="guichet">
      <div className="guichet-tete">
        <div>
          <div className="meta-label">Guichet d'émission</div>
          <h3 style={{ marginTop: '.2rem' }}>Fabriquez un billet, la banque le crédite.</h3>
        </div>
        {user && profile && (
          <div className="guichet-solde">
            <div className="meta-label">Solde de {profile.pseudo}</div>
            <div className="enchere-prix">{solde} <small>billets</small></div>
          </div>
        )}
      </div>

      {!user ? (
        <p className="texte-aide">Ouvrez un compte pour émettre vos billets et enchérir dans le market. <Link to="/connexion" className="lien-texte">Se connecter →</Link></p>
      ) : (
        <div className="guichet-form">
          <div>
            <div className={`upload-zone ${preview ? 'has-preview' : ''}`} onClick={() => inputRef.current.click()}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choisir(e.dataTransfer.files?.[0]) }}>
              <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={e => choisir(e.target.files?.[0])} />
              {preview
                ? <img src={preview} alt="Votre billet" className="guichet-preview" />
                : <><span className="uz-icon">🖨️</span><span className="uz-text">Photo de votre billet dessiné, colorié ou imprimé</span></>}
            </div>
            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Dénomination</label>
              <div className="filter-row" role="group" aria-label="Dénomination">
                {VALEURS.map(v => <button key={v} type="button" className={`chip ${valeur === v ? 'active' : ''}`} aria-pressed={valeur === v} onClick={() => setValeur(v)}>{v}</button>)}
              </div>
            </div>
          </div>
          <div className="guichet-cartel">
            <div className="meta-label" style={{ marginBottom: '.6rem' }}>Cartel de l'œuvre</div>
            <div className="field">
              <label htmlFor="billet-titre">Titre</label>
              <input id="billet-titre" value={cartel.titre} onChange={e => set('titre', e.target.value)} placeholder="ex : Le grand fantôme vert, Billet de la Thune n° 3…" maxLength={120} />
            </div>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="field">
                <label htmlFor="billet-artiste">Artiste (prénom ou pseudonyme)</label>
                <input id="billet-artiste" value={cartel.artiste} onChange={e => set('artiste', e.target.value)} placeholder={profile?.pseudo || 'votre nom d’artiste'} maxLength={60} />
              </div>
              <div className="field">
                <label htmlFor="billet-devise">Nom de la devise</label>
                <input id="billet-devise" list="devises-connues" value={cartel.devise} onChange={e => set('devise', e.target.value)} placeholder="ex : le Phantom, la Thune, le Bifton…" maxLength={40} />
                <datalist id="devises-connues">{devises.map(d => <option key={d.devise} value={d.devise} />)}</datalist>
              </div>
            </div>
            <div className="field">
              <label htmlFor="billet-technique">Technique</label>
              <div className="filter-row" style={{ marginBottom: '.4rem' }}>
                {TECHNIQUES.map(t => <button key={t} type="button" className={`chip ${cartel.technique === t ? 'active' : ''}`} onClick={() => set('technique', cartel.technique === t ? '' : t)}>{t}</button>)}
              </div>
              <input id="billet-technique" value={cartel.technique} onChange={e => set('technique', e.target.value)} placeholder="ou précisez : gouache et tampon encreur, stylo bille sur papier kraft…" maxLength={80} />
            </div>
            <div className="field">
              <label htmlFor="billet-desc">Quelques mots (facultatif)</label>
              <textarea id="billet-desc" value={cartel.description} onChange={e => set('description', e.target.value)} placeholder="Ce que représente le billet, d'où vient le motif, pour qui il a été fait…" style={{ minHeight: 70 }} maxLength={600} />
            </div>
            <button type="button" className="btn btn-jaune" disabled={busy || !file} onClick={emettre}>
              {busy ? 'Émission…' : `◈ Émettre ${valeur} ${cartel.devise || 'billets'}`}
            </button>
            <p className="caption-gris" style={{ marginTop: '.8rem' }}>
              Crédité immédiatement. La banque se réserve le droit d'annuler un billet douteux (photocopie, image générée, billet déjà émis) — le compte est alors débité.
            </p>
          </div>
        </div>
      )}

      {user && mesBillets.length > 0 && (
        <div className="mes-billets">
          <div className="meta-label" style={{ marginBottom: '.5rem' }}>Mes billets émis ({mesBillets.length})</div>
          <div className="billets-strip">
            {mesBillets.map(b => (
              <div key={b.id} className={`billet-mini ${b.statut}`} title={b.statut === 'annule' ? `Annulé${b.motif ? ' : ' + b.motif : ''}` : `${b.titre || 'Sans titre'} — ${b.valeur} ${b.devise || 'billets'}`}>
                <img src={getPublicImageUrl(b.image_path)} alt="" loading="lazy" />
                <span>{b.valeur}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// Mur des billets émis (public), avec cartel — utilisé sur S'enrichir et sur l'accueil
export function MurBillets({ limit = 12, titre = 'Derniers billets émis', sousTitre = 'La monnaie en circulation', onNotif }) {
  const { estBanquier } = useAuth()
  const [billets, setBillets] = useState([])
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    charger()
    const channel = supabase.channel('mur-billets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billets_emis' }, () => charger())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [limit])

  async function charger() {
    const { data } = await supabase.from('billets_emis').select('*').order('created_at', { ascending: false }).limit(limit)
    setBillets(data || [])
  }

  async function annuler(b) {
    const motif = window.prompt(`Annuler « ${b.titre || 'Sans titre'} » (${b.valeur}) de ${b.pseudo} ? Motif (facultatif) :`)
    if (motif === null) return
    const { error } = await supabase.rpc('annuler_billet', { p_billet: b.id, p_motif: motif || null })
    if (error) onNotif?.({ msg: messageErreur(error), type: 'err' })
    else { onNotif?.({ msg: 'Billet annulé, compte débité.', type: 'ok' }); setZoom(null); charger() }
  }

  if (!billets.length) return null
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div className="section-head">
        <h2>{titre}</h2>
        <span className="count">{sousTitre}</span>
      </div>
      <div className="billets-mur">
        {billets.map((b, i) => (
          <figure key={b.id} className={`billet-mur-item ${b.statut}`}>
            <button type="button" className="billet-mur-img" onClick={() => setZoom(i)} aria-label={`Voir ${b.titre || 'le billet'}`}>
              <img src={getPublicImageUrl(b.image_path)} alt={b.titre || `Billet de ${b.valeur} par ${b.pseudo}`} loading="lazy" />
            </button>
            <figcaption>
              <div className="cartel-mini-titre">{b.titre || 'Sans titre'}</div>
              <div className="cartel-mini-ligne">{b.artiste || b.pseudo || 'anonyme'}{b.technique && ` · ${b.technique}`}</div>
              <div className="cartel-mini-valeur"><strong>{b.valeur}</strong> {b.devise || 'billets'}
                {b.statut === 'annule' && <span className="stamp stamp-rouge" style={{ marginLeft: '.4rem', fontSize: '.6rem' }}>annulé</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {zoom !== null && (
        <BilletModal billet={billets[zoom]} index={zoom} total={billets.length} estBanquier={estBanquier} onAnnuler={annuler}
          onClose={() => setZoom(null)}
          onPrev={() => setZoom(i => (i - 1 + billets.length) % billets.length)}
          onNext={() => setZoom(i => (i + 1) % billets.length)} />
      )}
    </section>
  )
}
