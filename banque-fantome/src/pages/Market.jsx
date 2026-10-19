import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import { GENRES } from '../lib/oeuvres'

// Le market numérique (2026-10-19, demande de Jiiji) : les œuvres faites dans les ateliers
// de /creer, uniques, vendues aux enchères en argent du site (celui qu'on encaisse en
// dessinant des billets). Achetée, l'œuvre passe dans la collection de l'acheteur, qui peut
// la télécharger en haute définition et la revendre. Les objets physiques sont au supermarket.

const STATUTS = [['disponible', 'en vente'], ['échangé', 'adjugées']]
const TRIS = [['recent', 'Plus récent'], ['fin', 'Se termine bientôt'], ['prix_asc', 'Prix croissant'], ['prix_desc', 'Prix décroissant']]
const prix = o => o.statut === 'échangé' ? o.prix_final ?? 0 : o.enchere_courante ?? o.mise_depart ?? 0

export default function Market() {
  const [ventes, setVentes] = useState(null)
  const [erreur, setErreur] = useState(false)
  const [statut, setStatut] = useState('disponible')
  const [genre, setGenre] = useState('tous')
  const [tri, setTri] = useState('recent')
  const [search, setSearch] = useState('')
  const [cherche, setCherche] = useState('')
  const [selected, setSelected] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => { const t = setTimeout(() => setCherche(search.trim()), 300); return () => clearTimeout(t) }, [search])
  // Les ventes échues sont adjugées (ou relancées) à l'ouverture, comme partout
  useEffect(() => { supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(v => v + 1)) }, [])

  useEffect(() => {
    let annule = false
    // oeuvre!inner : le filtre par atelier porte sur l'œuvre liée à la vente
    let q = supabase.from('objets').select('*, oeuvre:oeuvres!inner(genre, auteur_pseudo, numero)')
      .not('oeuvre_id', 'is', null).eq('statut', statut).limit(150)
    if (genre !== 'tous') q = q.eq('oeuvre.genre', genre)
    if (cherche) q = q.ilike('titre', `%${cherche}%`)
    q = tri === 'fin' && statut === 'disponible' ? q.order('expire_at', { ascending: true })
      : q.order(statut === 'échangé' ? 'vendu_at' : 'created_at', { ascending: false })
    q.then(({ data, error }) => {
      if (annule) return
      setErreur(!!error)
      const liste = data || []
      setVentes(tri === 'prix_asc' ? [...liste].sort((a, b) => prix(a) - prix(b))
        : tri === 'prix_desc' ? [...liste].sort((a, b) => prix(b) - prix(a)) : liste)
    })
    return () => { annule = true }
  }, [statut, genre, tri, cherche, version])

  const filtres = genre !== 'tous' || cherche !== ''

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Market</h2>
          <span className="count" aria-live="polite">{ventes ? `${ventes.length} œuvre${ventes.length > 1 ? 's' : ''}` : ''}</span>
        </div>
        <div className="market-intro">
          <p className="texte-aide">
            Les œuvres faites dans les <Link to="/creer" className="lien-texte">ateliers</Link> de la banque : dessins, poèmes, images, collages.
            Chacune est unique. On les achète aux enchères avec l’argent du site, celui qu’on gagne en
            dessinant des <Link to="/creer?atelier=billet" className="lien-texte">billets</Link>. Achetée, l’œuvre rejoint votre collection :
            vous la téléchargez en grand, vous la gardez ou la revendez.
          </p>
          <Link to="/creer" className="btn btn-jaune btn-sm">+ Créer une œuvre</Link>
        </div>

        <div className="market-toolbar">
          <div className="market-search">
            <div className="field">
              <input type="search" placeholder="Rechercher une œuvre…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher" />
            </div>
            <div className="field">
              <select value={tri} onChange={e => setTri(e.target.value)} aria-label="Trier par">
                {TRIS.map(([v, l]) => <option key={v} value={v}>Trier par : {l}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-row" role="group" aria-label="Atelier">
            <span className="filter-label">Atelier</span>
            <button type="button" className={`chip ${genre === 'tous' ? 'active' : ''}`} aria-pressed={genre === 'tous'} onClick={() => setGenre('tous')}>tous</button>
            {Object.entries(GENRES).map(([g, d]) => (
              <button key={g} type="button" className={`chip ${genre === g ? 'active' : ''}`} aria-pressed={genre === g} onClick={() => setGenre(g)}>{d.icone} {d.nom}</button>
            ))}
          </div>
          <div className="filter-row" role="group" aria-label="Statut">
            <span className="filter-label">Statut</span>
            {STATUTS.map(([v, l]) => (
              <button key={v} type="button" className={`chip ${statut === v ? 'active' : ''}`} aria-pressed={statut === v} onClick={() => setStatut(v)}>{l}</button>
            ))}
            {filtres && <button type="button" className="btn btn-outline btn-xs filter-reset" onClick={() => { setGenre('tous'); setSearch('') }}>✕ Réinitialiser</button>}
          </div>
        </div>

        {ventes === null
          ? <div className="loader">Chargement<span className="blink">_</span></div>
          : erreur
            ? <div className="market-vide">
                <div className="titre">Le market ne répond pas</div>
                <p style={{ margin: '0 auto' }}>La connexion à la banque a échoué. Réessayez dans un instant.</p>
                <button type="button" className="btn btn-noir" style={{ marginTop: '1.2rem' }} onClick={() => setVersion(v => v + 1)}>↻ Réessayer</button>
              </div>
            : ventes.length === 0
              ? <div className="market-vide">
                  <div className="titre">{filtres ? 'Aucune œuvre ne correspond' : statut === 'disponible' ? 'Aucune œuvre en vente' : 'Aucune œuvre adjugée'}</div>
                  <p style={{ margin: '0 auto' }}>{filtres ? 'Essayez d’élargir vos filtres.' : 'La première œuvre mise en vente fixera le goût de la maison.'}</p>
                  <Link to="/creer" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Créer une œuvre</Link>
                </div>
              : <div className="grid-3">{ventes.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>}
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); setVersion(v => v + 1) }} onUpdate={o => setVentes(prev => prev?.map(x => x.id === o.id ? { ...x, ...o } : x))} />}
    </div>
  )
}
