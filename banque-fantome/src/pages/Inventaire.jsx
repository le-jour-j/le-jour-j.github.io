import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'

const STATUTS = ['tous', 'disponible', 'réservé', 'échangé']

export default function Inventaire() {
  const [objets, setObjets]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [statut, setStatut]     = useState('tous')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [total, setTotal]       = useState(0)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('objets').select('*', { count: 'exact' }).order('created_at', { ascending: false })
    if (statut !== 'tous') q = q.eq('statut', statut)
    if (search.trim()) q = q.ilike('titre', `%${search.trim()}%`)
    q.then(({ data, count }) => { setObjets(data || []); setTotal(count || 0); setLoading(false) })
  }, [statut, search])

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div className="section-head">
          <h2>Inventaire</h2>
          <span className="count">{total} objet{total !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem', alignItems: 'center' }}>
          <div className="field" style={{ margin: 0, flex: '1 1 220px' }}>
            <input placeholder="Rechercher un objet…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {STATUTS.map(s => (
              <button key={s} className={`btn ${statut === s ? 'btn-noir' : 'btn-outline'}`}
                style={{ fontSize: '.72rem', padding: '.35rem .9rem' }} onClick={() => setStatut(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading
          ? <div className="loader">Chargement<span className="blink">_</span></div>
          : objets.length === 0
            ? <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--gris)' }}>
                <div style={{ fontFamily: 'var(--bebas)', fontSize: '2rem', marginBottom: '.5rem' }}>Inventaire vide</div>
                <p style={{ fontSize: '.9rem' }}>Déposez le premier objet dans le circuit.</p>
              </div>
            : <div className="grid-3">{objets.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
        }
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
