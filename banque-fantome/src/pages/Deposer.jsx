import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'

const CATEGORIES = ['objet', 'œuvre', 'service']

export default function Deposer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ titre: '', description: '', histoire: '', lieu: '', categorie: 'objet' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState(null)
  const [errors, setErrors] = useState({})
  const inputRef = useRef()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleFile(f) {
    if (!f) return
    if (!f.type.startsWith('image/')) { setNotif({ msg: 'Fichier image uniquement', type: 'err' }); return }
    if (f.size > 5 * 1024 * 1024) { setNotif({ msg: 'Image max 5 Mo', type: 'err' }); return }
    setFile(f); setPreview(URL.createObjectURL(f))
  }

  function validate() {
    const e = {}
    if (!form.titre.trim()) e.titre = 'Titre requis'
    if (!form.description.trim()) e.description = 'Description requise'
    if (!form.categorie.trim()) e.categorie = 'Catégorie requise'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    try {
      let pseudo = 'Anonyme'
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('pseudo').eq('id', user.id).single()
        if (profile?.pseudo) pseudo = profile.pseudo
      }
      let image_path = null
      if (file) {
        const ext = file.name.split('.').pop()
        const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(name, file, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        image_path = name
      }
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        histoire: form.histoire.trim() || null,
        lieu: form.lieu.trim() || null,
        categorie: form.categorie,
        image_path,
        pseudo,
        user_id: user?.id || null,
        statut: 'disponible',
      }
      const { error: insErr } = await supabase.from('objets').insert(payload)
      if (insErr) {
        if (insErr.message?.toLowerCase().includes('categorie')) {
          throw new Error("La colonne 'categorie' manque dans Supabase. Exécute la mise à jour SQL fournie avec le projet.")
        }
        throw insErr
      }
      setNotif({ msg: 'Entrée déposée dans le market.', type: 'ok' })
      setTimeout(() => navigate('/market'), 1500)
    } catch (e) {
      setNotif({ msg: e.message || 'Erreur lors du dépôt', type: 'err' })
    } finally { setLoading(false) }
  }

  if (!user) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--bebas)', fontSize: '3rem', marginBottom: '1rem' }}>Accès refusé</div>
        <p style={{ color: 'var(--gris)', marginBottom: '1.5rem' }}>Vous devez être connecté pour déposer une entrée dans le market.</p>
        <Link to="/connexion"><button className="btn btn-noir">Se connecter →</button></Link>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div className="section-head"><h2>Déposer dans le market</h2></div>
        <div className="page-grid-2">
          <div>
            <p style={{ color: 'var(--gris)', marginBottom: '2rem', lineHeight: 1.7, fontSize: '.92rem' }}>
              Votre dépôt peut prendre la forme d'un objet, d'une œuvre ou d'un service. Il entre dans le circuit de la Banque Fantôme et peut être obtenu contre de la monnaie artistique produite par les joueurs.
            </p>
            <div className="field">
              <label>Image (max 5 Mo)</label>
              <div className={`upload-zone ${drag ? 'drag' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => inputRef.current.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} />
                {preview
                  ? <img src={preview} alt="aperçu" style={{ maxHeight: 200, maxWidth: '100%', display: 'block', margin: '0 auto' }} />
                  : <><span className="uz-icon">📷</span><span className="uz-text">Cliquez ou glissez une image</span></>
                }
              </div>
            </div>
          </div>
          <div>
            <div className="field">
              <label>Catégorie *</label>
              <select value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.categorie && <span className="error-msg">{errors.categorie}</span>}
            </div>
            <div className="field">
              <label>Titre *</label>
              <input value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="ex : tirage, réparation de vélo, chaise bancale" />
              {errors.titre && <span className="error-msg">{errors.titre}</span>}
            </div>
            <div className="field">
              <label>Description *</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Décrivez ce qui est proposé…" />
              {errors.description && <span className="error-msg">{errors.description}</span>}
            </div>
            <div className="field">
              <label>Histoire</label>
              <textarea value={form.histoire} onChange={e => set('histoire', e.target.value)} placeholder="Contexte, origine, conditions, récit…" style={{ minHeight: 80 }} />
            </div>
            <div className="field">
              <label>Lieu</label>
              <input value={form.lieu} onChange={e => set('lieu', e.target.value)} placeholder="ex : atelier, brocante, quartier, en ligne…" />
            </div>
            <button className="btn btn-noir" onClick={submit} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Dépôt en cours…' : '→ Valider le dépôt'}
            </button>
          </div>
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
