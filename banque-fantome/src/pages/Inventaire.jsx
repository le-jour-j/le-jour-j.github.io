import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import { RARETES, rangRarete } from '../utils/rarete'

const STATUTS = ['tous', 'disponible', 'échangé', 'expiré']
const LIBELLES = { disponible: 'en vente', échangé: 'vendu', expiré: 'expiré', tous: 'tous' }
const CATEGORIES = ['toutes', 'objet', 'œuvre', 'service']
const RARETES_FILTRE = ['toutes', ...RARETES]
const TRIS = [
  { key: 'recent', label: 'Plus récent' },
  { key: 'fin', label: 'Se termine bientôt' },
  { key: 'valeur_desc', label: 'Valeur décroissante' },
  { key: 'valeur_asc', label: 'Valeur croissante' },
  { key: 'rarete', label: 'Rareté' },
]

function FiltreRow({ label, valeurs, actif, onChange, libelles = {} }) {
  return (
    <div className="filter-row" role="group" aria-label={label}>
      <span className="filter-label">{label}</span>
      {valeurs.map(v => (
        <button key={v} type="button" className={`chip ${actif === v ? 'active' : ''}`} aria-pressed={actif === v} onClick={() => onChange(v)}>
          {libelles[v] || v}
        </button>
      ))}
    </div>
  )
}

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

  const filtresActifs = statut !== 'tous' || categorie !== 'toutes' || rarete !== 'toutes' || search.trim() !== ''
  function reset() { setStatut('tous'); setCategorie('toutes'); setRarete('toutes'); setSearch(''); setTri('recent') }

  const [version, setVersion] = useState(0) // relance le chargement après une action dans une fiche

  // Les ventes expirées sont clôturées à l'ouverture du market (idempotent)
  useEffect(() => { supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(v => v + 1)) }, [])

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('objets').select('*', { count: 'exact' })
    if (statut !== 'tous') q = q.eq('statut', statut)
    if (categorie !== 'toutes') q = q.eq('categorie', categorie)
    if (rarete !== 'toutes') q = q.eq('rarete', rarete)
    if (search.trim()) q = q.ilike('titre', `%${search.trim()}%`)
    if (tri === 'valeur_desc') q = q.order('enchere_courante', { ascending: false, nullsFirst: false }).order('valeur', { ascending: false, nullsFirst: false })
    else if (tri === 'valeur_asc') q = q.order('enchere_courante', { ascending: true, nullsFirst: false }).order('valeur', { ascending: true, nullsFirst: false })
    else if (tri === 'fin') q = q.order('expire_at', { ascending: true, nullsFirst: false })
    else q = q.order('created_at', { ascending: false }) // 'recent' et 'rarete' (rarete triee cote client)

    q.then(({ data, count }) => {
      let result = data || []
      if (tri === 'rarete') result = [...result].sort((a, b) => rangRarete(b.rarete) - rangRarete(a.rarete))
      setObjets(result)
      setTotal(count || 0)
      setLoading(false)
    })
  }, [statut, categorie, rarete, tri, search, version])

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Market</h2>
          <span className="count" aria-live="polite">{total} entrée{total !== 1 ? 's' : ''}</span>
        </div>

        <div className="market-toolbar">
          <div className="market-search">
            <div className="field">
              <input type="search" placeholder="Rechercher dans le market…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher" />
            </div>
            <div className="field">
              <select value={tri} onChange={e => setTri(e.target.value)} aria-label="Trier par">
                {TRIS.map(t => <option key={t.key} value={t.key}>Trier par : {t.label}</option>)}
              </select>
            </div>
          </div>
          <FiltreRow label="Catégorie" valeurs={CATEGORIES} actif={categorie} onChange={setCategorie} />
          <FiltreRow label="Statut" valeurs={STATUTS} actif={statut} onChange={setStatut} libelles={LIBELLES} />
          <div className="filter-row">
            <span className="filter-label">Rareté</span>
            {RARETES_FILTRE.map(r => (
              <button key={r} type="button" className={`chip ${rarete === r ? 'active' : ''}`} aria-pressed={rarete === r} onClick={() => setRarete(r)}>
                {r}
              </button>
            ))}
            {filtresActifs && (
              <button type="button" className="btn btn-outline btn-xs filter-reset" onClick={reset}>✕ Réinitialiser</button>
            )}
          </div>
        </div>

        {loading
          ? <div className="loader">Chargement<span className="blink">_</span></div>
          : objets.length === 0
            ? <div className="market-vide">
                <div className="titre">{filtresActifs ? 'Aucune entrée ne correspond' : 'Market vide'}</div>
                <p style={{ margin: '0 auto' }}>{filtresActifs ? 'Essayez d’élargir vos filtres.' : 'Déposez la première entrée dans le circuit.'}</p>
                {filtresActifs && <button type="button" className="btn btn-noir" style={{ marginTop: '1.2rem' }} onClick={reset}>Tout afficher</button>}
              </div>
            : <div className="grid-3" key={`${statut}-${categorie}-${rarete}-${tri}-${search}`}>
                {objets.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}
              </div>
        }
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} onUpdate={o => setObjets(prev => prev.map(x => x.id === o.id ? o : x))} />}
    </div>
  )
}
