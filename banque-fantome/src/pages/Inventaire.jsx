import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'

const STATUTS = ['tous', 'disponible', 'réservé', 'échangé']
const CATEGORIES = ['toutes', 'objet', 'œuvre', 'service']

export default function Inventaire() {
  const [objets, setObjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statut, setStatut] = useState('tous')
  const [categorie, setCategorie] = useState('toutes')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('objets').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (statut !== 'tous') q = q.eq('statut', statut)
    if (categorie !== 'toutes') q = q.eq('categorie', categorie)
    if (search.trim()) q = q.ilike('titre', `%${search.trim()}%`)
    q.then(({ data, count, error }) => {
      if (error && categorie !== 'toutes' && error.message?.toLowerCase().includes('categorie')) {
        supabase.from('objets').select('*', { count: 'exact' }).order('created_at', { ascending: false }).then(({ data: fallback, count: fallbackCount }) => {
          let filtered = fallback || []
          if (statut !== 'tous') filtered = filtered.filter(o => o.statut === statut)
          if (search.trim()) filtered = filtered.filter(o => o.titre?.toLowerCase().includes(search.trim().toLowerCase()))
          setObjets(filtered)
          setTotal(filtered.length || fallbackCount || 0)
          setLoading(false)
        })
        return
      }
      setObjets(data || [])
      setTotal(count || 0)
      setLoading(false)
    })
  }, [statut, categorie, search])

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

        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '2.5rem', alignItems: 'center' }}>
          <span className="count" style={{ minWidth: 80 }}>Statuts</span>
          {STATUTS.map(s => (
            <button key={s} className={`btn ${statut === s ? 'btn-noir' : 'btn-outline'}`}
              style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setStatut(s)}>
              {s}
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
