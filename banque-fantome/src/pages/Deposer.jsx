import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'

const CATEGORIES = ['objet', 'œuvre', 'service']

export default function Deposer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ titre: '', description: '', histoire: '', lieu: '', categorie: 'objet' })
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState(null)
  const [errors, setErrors] = useState({})
  const inputRef = useRef()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url))
  }, [previews])

  function handleFiles(incoming) {
    const selected = Array.from(incoming || [])
    if (!selected.length) return
    const valid = []
    for (const f of selected) {
      if (!f.type.startsWith('image/')) {
        setNotif({ msg: 'Fichiers image uniquement', type: 'err' })
        continue
      }
      if (f.size > 5 * 1024 * 1024) {
        setNotif({ msg: 'Chaque image doit faire moins de 5 Mo', type: 'err' })
        continue
      }
      valid.push(f)
    }
    if (!valid.length) return
    const nextFiles = [...files, ...valid].slice(0, 8)
    if (files.length + valid.length > 8) setNotif({ msg: 'Maximum 8 images par dépôt', type: 'err' })
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles(nextFiles)
    setPreviews(nextFiles.map(file => URL.createObjectURL(file)))
  }

  function removeFile(index) {
    const nextFiles = files.filter((_, i) => i !== index)
    previews.forEach(url => URL.revokeObjectURL(url))
    setFiles(nextFiles)
    setPreviews(nextFiles.map(file => URL.createObjectURL(file)))
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
      const image_paths = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(name, file, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        image_paths.push(name)
      }
      const image_path = image_paths[0] || null
      const payload = {
        titre: form.titre.trim(),
        description: form.description.trim(),
        histoire: form.histoire.trim() || null,
        lieu: form.lieu.trim() || null,
        categorie: form.categorie,
        image_path,
        image_paths: image_paths.length ? image_paths : null,
        pseudo,
        user_id: user?.id || null,
        statut: 'disponible',
      }
      const { error: insErr } = await supabase.from('objets').insert(payload)
      if (insErr) {
        if (insErr.message?.toLowerCase().includes('categorie')) {
          throw new Error("La colonne 'categorie' manque dans Supabase. Exécute la mise à jour SQL fournie avec le projet.")
        }
        if (insErr.message?.toLowerCase().includes('image_paths')) {
          throw new Error("La colonne 'image_paths' manque dans Supabase. Exécute la mise à jour SQL fournie avec le projet pour activer plusieurs images.")
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', maxWidth: 900 }}>
          <div>
            <p style={{ color: 'var(--gris)', marginBottom: '2rem', lineHeight: 1.7, fontSize: '.92rem' }}>
              Votre dépôt peut prendre la forme d'un objet, d'une œuvre ou d'un service. Il entre dans le circuit de la Banque Fantôme et peut être obtenu contre de la monnaie produite par les joueurs.
            </p>
            <div className="field">
              <label>Images (8 max, 5 Mo chacune)</label>
              <div className={`upload-zone ${drag ? 'drag' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => inputRef.current.click()}
              >
                <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} />
                {previews.length
                  ? <div className="upload-previews">
                      {previews.map((src, index) => (
                        <div key={src + index} className="upload-preview-item">
                          <img src={src} alt={`aperçu ${index + 1}`} />
                          <button type="button" className="upload-preview-remove" onClick={e => { e.stopPropagation(); removeFile(index) }}>✕</button>
                        </div>
                      ))}
                    </div>
                  : <><span className="uz-icon">📷</span><span className="uz-text">Cliquez ou glissez une ou plusieurs images</span></>
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
