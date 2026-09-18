import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, STORAGE_BUCKET } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'
import { RARETES } from '../utils/rarete'
import { DUREES, COMMISSION_PCT } from '../utils/encheres'

const CATEGORIES = ['objet', 'œuvre', 'service']

export default function Deposer() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ titre: '', description: '', histoire: '', lieu: '', categorie: 'objet', rarete: 'commun', mise_depart: 10, prix_achat: '', duree_jours: 3 })
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
    if (!(Number(form.mise_depart) >= 1)) e.mise_depart = 'Mise de départ requise (1 billet minimum)'
    if (form.prix_achat !== '' && Number(form.prix_achat) < Number(form.mise_depart)) e.prix_achat = 'Doit être ≥ à la mise de départ'
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
        rarete: form.rarete,
        // Hôtel des ventes : la base calcule expire_at et verrouille les colonnes d'enchère
        mise_depart: Number(form.mise_depart),
        prix_achat: form.prix_achat !== '' ? Number(form.prix_achat) : null,
        duree_jours: Number(form.duree_jours),
        valeur: Number(form.mise_depart),
        image_path,
        image_paths: image_paths.length ? image_paths : null,
        pseudo,
        user_id: user?.id || null,
        statut: 'disponible',
      }
      const { error: insErr } = await supabase.from('objets').insert(payload)
      if (insErr) throw insErr
      setNotif({ msg: `Mis en vente pour ${form.duree_jours} jour${form.duree_jours > 1 ? 's' : ''}.`, type: 'ok' })
      setTimeout(() => navigate('/market'), 1500)
    } catch (e) {
      setNotif({ msg: e.message || 'Erreur lors du dépôt', type: 'err' })
    } finally { setLoading(false) }
  }

  if (authLoading) return <div className="loader">Chargement<span className="blink">_</span></div>

  if (!user) return (
    <div className="acces-refuse">
      <div>
        <div className="titre">Accès refusé</div>
        <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>Vous devez être connecté pour déposer une entrée dans le market.</p>
        <Link to="/connexion" className="btn btn-noir">Se connecter →</Link>
      </div>
    </div>
  )

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head"><h2>Déposer dans le market</h2><span className="count">* champs obligatoires</span></div>
        <div className="form-grid">
          <div>
            <p className="texte-aide" style={{ marginBottom: '2rem' }}>
              Votre dépôt peut prendre la forme d'un objet, d'une œuvre ou d'un service. Il est mis aux enchères : les joueurs misent les billets qu'ils ont fabriqués, et le plus offrant l'emporte à la clôture.
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
              <label>Rareté</label>
              <select value={form.rarete} onChange={e => set('rarete', e.target.value)}>
                {RARETES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="vente-params">
              <div className="meta-label" style={{ marginBottom: '.6rem' }}>◈ Hôtel des ventes</div>
              <div className="grid-2" style={{ gap: '1rem' }}>
                <div className="field">
                  <label>Mise de départ *</label>
                  <input type="number" min="1" step="5" value={form.mise_depart} onChange={e => set('mise_depart', e.target.value)} />
                  {errors.mise_depart && <span className="error-msg">{errors.mise_depart}</span>}
                </div>
                <div className="field">
                  <label>Achat immédiat</label>
                  <input type="number" min="1" step="5" value={form.prix_achat} onChange={e => set('prix_achat', e.target.value)} placeholder="facultatif" />
                  {errors.prix_achat && <span className="error-msg">{errors.prix_achat}</span>}
                </div>
              </div>
              <div className="field">
                <label>Durée de la vente</label>
                <div className="filter-row">
                  {DUREES.map(d => (
                    <button key={d.jours} type="button" className={`chip ${Number(form.duree_jours) === d.jours ? 'active' : ''}`} aria-pressed={Number(form.duree_jours) === d.jours} onClick={() => set('duree_jours', d.jours)}>{d.label}</button>
                  ))}
                </div>
              </div>
              <p className="caption-gris">À la clôture, le plus offrant l'emporte ; la banque prélève {COMMISSION_PCT} % sur le prix. Sans enchère, le dépôt expire et peut être remis en vente.</p>
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
            <button className="btn btn-noir btn-bloc" onClick={submit} disabled={loading}>
              {loading ? 'Dépôt en cours…' : '→ Mettre en vente'}
            </button>
          </div>
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
