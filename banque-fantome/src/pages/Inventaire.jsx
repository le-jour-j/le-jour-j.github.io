import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import { RARETES, rangRarete } from '../utils/rarete'

const STATUTS = ['tous', 'disponible', 'réservé', 'échangé']
const CATEGORIES = ['toutes', 'objet', 'œuvre', 'service']
const RARETES_FILTRE = ['toutes', ...RARETES]
const TRIS = [
  { key: 'recent', label: 'Plus récent' },
  { key: 'valeur_desc', label: 'Valeur décroissante' },
  { key: 'valeur_asc', label: 'Valeur croissante' },
  { key: 'rarete', label: 'Rareté' },
]

export default function Inventaire() {
  const [objets, setObjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState('tous')
  const [categorie, setCategorie] = useState('toutes')
  const [rarete, setRarete] = useState('toutes')
  const [tri, setTri] = useState('recent')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('objets').select('*', { count: 'exact' })
    if (statut !== 'tous') q = q.eq('statut', statut)
    if (categorie !== 'toutes') q = q.eq('categorie', categorie)
    if (rarete !== 'toutes') q = q.eq('rarete', rarete)
    if (search.trim()) q = q.ilike('titre', `%${search.trim()}%`)
    if (tri === 'valeur_desc') q = q.order('valeur', { ascending: false, nullsFirst: false })
    else if (tri === 'valeur_asc') q = q.order('valeur', { ascending: true, nullsFirst: false })
    else q = q.order('created_at', { ascending: false }) // 'recent' et 'rarete' (rarete triee cote client)

    q.then(({ data, count }) => {
      let result = data || []
      if (tri === 'rarete') result = [...result].sort((a, b) => rangRarete(b.rarete) - rangRarete(a.rarete))
      setObjets(result)
      setTotal(count || 0)
      setLoading(false)
    })
  }, [statut, categorie, rarete, tri, search])

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div className="section-head">
          <h2>Market</h2>
          <span className="count">{total} entrée{total !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.2rem', alignItems: 'center' }}>
          <div className="field" style={{ margin: 0, flex: '1 1 220px' }}>
            <input placeholder="Rechercher dans le market…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <select value={tri} onChange={e => setTri(e.target.value)}>
              {TRIS.map(t => <option key={t.key} value={t.key}>Trier par : {t.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.8rem', alignItems: 'center' }}>
          <span className="count" style={{ minWidth: 80 }}>Catégories</span>
          {CATEGORIES.map(c => (
            <button key={c} className={`btn ${categorie === c ? 'btn-noir' : 'btn-outline'}`}
              style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setCategorie(c)}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '.8rem', alignItems: 'center' }}>
          <span className="count" style={{ minWidth: 80 }}>Statuts</span>
          {STATUTS.map(s => (
            <button key={s} className={`btn ${statut === s ? 'btn-noir' : 'btn-outline'}`}
              style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setStatut(s)}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '2.5rem', alignItems: 'center' }}>
          <span className="count" style={{ minWidth: 80 }}>Rareté</span>
          {RARETES_FILTRE.map(r => (
            <button key={r} className={`btn ${rarete === r ? 'btn-noir' : 'btn-outline'}`}
              style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setRarete(r)}>
              {r}
            </button>
          ))}
        </div>

        {loading
          ? <div className="loader">Chargement<span className="blink">_</span></div>
          : objets.length === 0
            ? <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gris)' }}>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '2rem', marginBottom: '.5rem' }}>Market vide</div>
                <p style={{ fontSize: '.9rem' }}>Déposez la première entrée dans le circuit.</p>
              </div>
            : <div className="grid-3">{objets.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
        }
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
