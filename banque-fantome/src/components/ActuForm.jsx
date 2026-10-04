import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { urlImageActu, envoyerImageActu, supprimerImagesActu } from '../lib/actus'
import { messageErreur } from '../utils/encheres'

const MAX_IMAGES = 12
const aujourdhui = () => new Date().toLocaleDateString('sv-SE') // AAAA-MM-JJ en heure locale

// Formulaire du banquier : nouvelle actu, ou modification de `actu`.
// onFini(actuEnregistree | null) est appelé après l'enregistrement ou l'annulation.
export default function ActuForm({ actu, onFini, onNotif }) {
  const [titre, setTitre] = useState(actu?.titre || '')
  const [date, setDate] = useState(actu?.date_actu || aujourdhui())
  const [texte, setTexte] = useState(actu?.texte || '')
  const [gardees, setGardees] = useState(actu?.images || [])   // images déjà en ligne
  const [fichiers, setFichiers] = useState([])                 // nouvelles photos à envoyer
  const [apercus, setApercus] = useState([])
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef()

  useEffect(() => () => apercus.forEach(u => URL.revokeObjectURL(u)), [apercus])

  function ajouter(liste) {
    const images = Array.from(liste || []).filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (!images.length) return
    const place = MAX_IMAGES - gardees.length
    const suivants = [...fichiers, ...images].slice(0, Math.max(0, place))
    if (fichiers.length + images.length > place) onNotif?.({ msg: `${MAX_IMAGES} photos maximum par nouvelle`, type: 'err' })
    apercus.forEach(u => URL.revokeObjectURL(u))
    setFichiers(suivants)
    setApercus(suivants.map(f => URL.createObjectURL(f)))
  }

  function retirerFichier(i) {
    const suivants = fichiers.filter((_, j) => j !== i)
    apercus.forEach(u => URL.revokeObjectURL(u))
    setFichiers(suivants)
    setApercus(suivants.map(f => URL.createObjectURL(f)))
  }

  async function enregistrer(publie) {
    if (!titre.trim()) { onNotif?.({ msg: 'Il faut un titre', type: 'err' }); return }
    setBusy(true)
    try {
      const envoyees = []
      for (const f of fichiers) envoyees.push(await envoyerImageActu(f))
      const payload = { titre: titre.trim(), date_actu: date || aujourdhui(), texte: texte.trim() || null, images: [...gardees, ...envoyees], publie }
      const requete = actu
        ? supabase.from('actus').update(payload).eq('id', actu.id).select().single()
        : supabase.from('actus').insert(payload).select().single()
      const { data, error } = await requete
      if (error) { await supprimerImagesActu(envoyees); throw error }
      // Les photos retirées pendant la modification sont effacées du stockage
      if (actu) await supprimerImagesActu((actu.images || []).filter(c => !gardees.includes(c)))
      onNotif?.({ msg: publie ? 'Nouvelle publiée.' : 'Brouillon enregistré.', type: 'ok' })
      onFini?.(data)
    } catch (e) {
      onNotif?.({ msg: messageErreur(e), type: 'err' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="actu-form">
      <div className="meta-label" style={{ marginBottom: '1rem' }}>◈ {actu ? 'Modifier la nouvelle' : 'Nouvelle actu'}</div>
      <div className="actu-form-ligne">
        <div className="field">
          <label>Titre *</label>
          <input value={titre} maxLength={160} onChange={e => setTitre(e.target.value)} placeholder="Ce qui s'est passé" />
        </div>
        <div className="field actu-form-date">
          <label>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Texte</label>
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={5} placeholder="Quelques lignes (laisser une ligne vide pour changer de paragraphe)" />
      </div>
      <div className="field">
        <label>Photos ({MAX_IMAGES} max)</label>
        <div className={`upload-zone ${drag ? 'drag' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); ajouter(e.dataTransfer.files) }}
          onClick={() => inputRef.current.click()}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => { ajouter(e.target.files); e.target.value = '' }} />
          {gardees.length + apercus.length
            ? <div className="upload-previews">
                {gardees.map(c => (
                  <div key={c} className="upload-preview-item">
                    <img src={urlImageActu(c)} alt="" />
                    <button type="button" className="upload-preview-remove" aria-label="Retirer la photo" onClick={e => { e.stopPropagation(); setGardees(g => g.filter(x => x !== c)) }}>✕</button>
                  </div>
                ))}
                {apercus.map((src, i) => (
                  <div key={src} className="upload-preview-item">
                    <img src={src} alt="" />
                    <button type="button" className="upload-preview-remove" aria-label="Retirer la photo" onClick={e => { e.stopPropagation(); retirerFichier(i) }}>✕</button>
                  </div>
                ))}
              </div>
            : <><span className="uz-icon">📷</span><span className="uz-text">Cliquez ou glissez des photos (elles sont réduites avant l'envoi)</span></>
          }
        </div>
      </div>
      <div className="actu-form-actions">
        <button type="button" className="btn btn-jaune btn-sm" disabled={busy} onClick={() => enregistrer(true)}>{busy ? 'Envoi…' : '→ Publier'}</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => enregistrer(false)}>Garder en brouillon</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => onFini?.(null)}>Annuler</button>
      </div>
    </div>
  )
}
