import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import { RARETES, rangRarete, libelleRarete } from '../utils/rarete'
import { useAuth } from '../components/AuthContext'

// Le supermarket (2026-10-19, ancien market) : les objets physiques que la banque vend, à venir
// chercher en main propre, payés en promesses de billets papier. Seule la banque y dépose ;
// les ventes physiques des joueurs d'avant vont au bout et expirent sans relance.

const STATUTS = ['tous', 'disponible', 'échangé']
const LIBELLES = { disponible: 'en vente', échangé: 'vendu', expiré: 'expiré', retiré: 'retiré', tous: 'tous' }
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

export default function Supermarket() {
  const { estBanquier } = useAuth()
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

  // Les ventes échues sont adjugées (ou relancées si personne n'a enchéri) à l'ouverture de la page (idempotent)
  useEffect(() => { supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(v => v + 1)) }, [])

  // La recherche part 300 ms après la dernière frappe, pas à chaque touche
  const [cherche, setCherche] = useState('')
  useEffect(() => { const t = setTimeout(() => setCherche(search.trim()), 300); return () => clearTimeout(t) }, [search])
  const [erreur, setErreur] = useState(false)

  useEffect(() => {
    let annule = false // une réponse en retard n'écrase pas la plus récente
    setLoading(true)
    // Seulement les objets physiques : billets à la bourse, œuvres au market (2026-10-19).
    // Les ventes retirées n'y ont plus leur place.
    let q = supabase.from('objets').select('*', { count: 'exact' }).is('dessin_id', null).is('oeuvre_id', null)
    if (statut !== 'tous') q = q.eq('statut', statut)
    else q = q.neq('statut', 'retiré')
    if (categorie !== 'toutes') q = q.eq('categorie', categorie)
    if (rarete !== 'toutes') q = q.eq('rarete', rarete)
    if (cherche) q = q.ilike('titre', `%${cherche}%`)
    if (tri === 'fin') q = q.order('expire_at', { ascending: true, nullsFirst: false })
    else q = q.order('created_at', { ascending: false }) // 'recent', 'rarete' et 'valeur' (triés côté client)

    q.then(({ data, count, error }) => {
      if (annule) return
      setErreur(!!error)
      let result = data || []
      // Valeur = l'enchère en cours, sinon la mise de départ (une vente à 500 sans enchère passait avant une enchère à 10)
      const prix = o => o.enchere_courante ?? o.mise_depart ?? o.valeur ?? 0
      if (tri === 'rarete') result = [...result].sort((a, b) => rangRarete(b.rarete) - rangRarete(a.rarete))
      else if (tri === 'valeur_asc') result = [...result].sort((a, b) => prix(a) - prix(b))
      else if (tri === 'valeur_desc') result = [...result].sort((a, b) => prix(b) - prix(a))
      setObjets(result)
      setTotal(count || 0)
      setLoading(false)
    })
    return () => { annule = true }
  }, [statut, categorie, rarete, tri, cherche, version])

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Supermarket</h2>
          <span className="count" aria-live="polite">{total} entrée{total !== 1 ? 's' : ''}</span>
        </div>
        <div className="market-intro">
          <p className="texte-aide">
            Les objets, œuvres physiques et services que la banque met en vente, à venir chercher en main propre.
            On y enchérit en <strong>billets papier</strong> : rien n'est débité sur le site, on contacte la banque
            pour se voir et on paie à la remise. Des billets papier ? Imprimez <Link to="/senrichir" className="lien-texte">les planches</Link>.
            Pour vendre vos propres créations, passez par <Link to="/creer" className="lien-texte">Créer</Link> et le <Link to="/market" className="lien-texte">market</Link>.
          </p>
          {estBanquier && <Link to="/deposer" className="btn btn-jaune btn-sm">+ Mettre un article en vente</Link>}
        </div>

        <div className="market-toolbar">
          <div className="market-search">
            <div className="field">
              <input type="search" placeholder="Rechercher au supermarket…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher" />
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
                {r === 'toutes' ? r : libelleRarete(r)}
              </button>
            ))}
            {filtresActifs && (
              <button type="button" className="btn btn-outline btn-xs filter-reset" onClick={reset}>✕ Réinitialiser</button>
            )}
          </div>
        </div>

        {loading
          ? <div className="loader">Chargement<span className="blink">_</span></div>
          : erreur
            ? <div className="market-vide">
                <div className="titre">Le supermarket ne répond pas</div>
                <p style={{ margin: '0 auto' }}>La connexion à la banque a échoué. Réessayez dans un instant.</p>
                <button type="button" className="btn btn-noir" style={{ marginTop: '1.2rem' }} onClick={() => setVersion(v => v + 1)}>↻ Réessayer</button>
              </div>
          : objets.length === 0
            ? <div className="market-vide">
                <div className="titre">{filtresActifs ? 'Aucune entrée ne correspond' : 'Vitrine vide'}</div>
                <p style={{ margin: '0 auto' }}>{filtresActifs ? 'Essayez d’élargir vos filtres.' : 'La banque n’a rien en rayon pour le moment.'}</p>
                {filtresActifs && <button type="button" className="btn btn-noir" style={{ marginTop: '1.2rem' }} onClick={reset}>Tout afficher</button>}
              </div>
            : <div className="grid-3" key={`${statut}-${categorie}-${rarete}-${tri}-${cherche}`}>
                {objets.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}
              </div>
        }
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} onUpdate={o => setObjets(prev => prev.map(x => x.id === o.id ? o : x))} />}
    </div>
  )
}
