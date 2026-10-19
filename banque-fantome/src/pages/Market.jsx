import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import { useAuth } from '../components/AuthContext'
import { GENRES } from '../lib/oeuvres'

// Le market (2026-10-19 au soir, demande de Jiiji : « faut faire plein de différents market,
// le E market, le bon coin, ce que vend la banque ») : trois rayons sous un même toit.
//   • l'E-market : les œuvres des ateliers de /creer, uniques, en argent du site ;
//   • le bon coin : les objets réels des joueurs, en billets papier, remise arrangée entre eux ;
//   • la banque vend : le supermarket, en billets papier, à venir chercher à la banque.
// Les billets dessinés restent à la bourse. ?rayon=emarket|boncoin|banque ; sans paramètre, tout.

const RAYONS = [['tout', 'tous les rayons'], ['emarket', '✦ E-market'], ['boncoin', '◇ Le bon coin'], ['banque', '◈ La banque vend']]
// Les adresses d'avant la séparation en trois rayons
const ANCIENS_RAYONS = { oeuvres: 'emarket', supermarket: 'banque' }
const STATUTS = [['disponible', 'en vente'], ['échangé', 'adjugés']]
const CATEGORIES = ['toutes', 'objet', 'œuvre', 'service']
const LIBELLE_CATEGORIE = { œuvre: 'œuvre physique' } // à ne pas confondre avec les œuvres de l'E-market
const TRIS = [['recent', 'Plus récent'], ['fin', 'Se termine bientôt'], ['prix_asc', 'Prix croissant'], ['prix_desc', 'Prix décroissant']]
const prix = o => o.statut === 'échangé' ? o.prix_final ?? 0 : o.enchere_courante ?? o.mise_depart ?? o.valeur ?? 0

export default function Market() {
  const { estBanquier } = useAuth()
  const [params, setParams] = useSearchParams()
  const demande = ANCIENS_RAYONS[params.get('rayon')] || params.get('rayon')
  const rayon = RAYONS.some(([v]) => v === demande) ? demande : 'tout'
  const [ventes, setVentes] = useState(null)
  const [erreur, setErreur] = useState(false)
  const [statut, setStatut] = useState('disponible')
  const [genre, setGenre] = useState('tous')
  const [categorie, setCategorie] = useState('toutes')
  const [tri, setTri] = useState('recent')
  const [search, setSearch] = useState('')
  const [cherche, setCherche] = useState('')
  const [selected, setSelected] = useState(null)
  const [version, setVersion] = useState(0)

  function choisirRayon(v) {
    setGenre('tous'); setCategorie('toutes')
    setParams(v === 'tout' ? {} : { rayon: v }, { replace: true })
  }

  useEffect(() => { const t = setTimeout(() => setCherche(search.trim()), 300); return () => clearTimeout(t) }, [search])
  // Les ventes échues sont adjugées (ou relancées) à l'ouverture, comme partout
  useEffect(() => { supabase.rpc('resoudre_ventes_expirees').then(() => setVersion(v => v + 1)) }, [])

  useEffect(() => {
    let annule = false
    // Tout sauf les billets (la bourse). À l'E-market, oeuvre!inner : le filtre par atelier
    // porte sur l'œuvre liée à la vente.
    const jointure = rayon === 'emarket' ? 'oeuvre:oeuvres!inner(genre, auteur_pseudo, numero)' : 'oeuvre:oeuvres(genre, auteur_pseudo, numero)'
    let q = supabase.from('objets').select(`*, ${jointure}`).is('dessin_id', null).eq('statut', statut).limit(150)
    if (rayon === 'emarket') {
      q = q.not('oeuvre_id', 'is', null)
      if (genre !== 'tous') q = q.eq('oeuvre.genre', genre)
    } else if (rayon === 'boncoin' || rayon === 'banque') {
      q = q.is('oeuvre_id', null)
      q = rayon === 'banque' ? q.eq('vendeur_banque', true) : q.or('vendeur_banque.is.null,vendeur_banque.eq.false')
      if (categorie !== 'toutes') q = q.eq('categorie', categorie)
    }
    if (cherche) q = q.ilike('titre', `%${cherche}%`)
    q = tri === 'fin' && statut === 'disponible' ? q.order('expire_at', { ascending: true, nullsFirst: false })
      : q.order(statut === 'échangé' ? 'vendu_at' : 'created_at', { ascending: false })
    q.then(({ data, error }) => {
      if (annule) return
      setErreur(!!error)
      const liste = data || []
      setVentes(tri === 'prix_asc' ? [...liste].sort((a, b) => prix(a) - prix(b))
        : tri === 'prix_desc' ? [...liste].sort((a, b) => prix(b) - prix(a)) : liste)
    })
    return () => { annule = true }
  }, [rayon, statut, genre, categorie, tri, cherche, version])

  const filtres = genre !== 'tous' || categorie !== 'toutes' || cherche !== ''
  const n = ventes?.length ?? 0
  const vide = {
    tout: ['Rien en vente', 'La première œuvre mise en vente fixera le goût de la maison.'],
    emarket: ['Aucune œuvre en vente', 'La première œuvre mise en vente fixera le goût de la maison.'],
    boncoin: ['Aucune annonce', 'Un objet qui dort chez vous ? Mettez-le en vente, il trouvera preneur.'],
    banque: ['Rayon vide', 'La banque n’a rien en rayon pour le moment.'],
  }[rayon]

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Market</h2>
          <span className="count" aria-live="polite">{ventes ? `${n} entrée${n > 1 ? 's' : ''}` : ''}</span>
        </div>
        <div className="market-intro">
          <p className="texte-aide">
            Trois rayons. <strong>L’E-market</strong> : les œuvres faites dans les <Link to="/creer" className="lien-texte">ateliers</Link>, uniques,
            achetées avec l’argent du site (celui qu’on gagne en dessinant des <Link to="/creer?atelier=billet" className="lien-texte">billets</Link>) ;
            elles rejoignent votre collection. <strong>Le bon coin</strong> : les objets réels des joueurs ; vendeur et acheteur
            s’arrangent entre eux pour la remise. <strong>La banque vend</strong> : ses objets, à venir chercher à la banque. Au bon coin,
            on paie en <strong>billets papier</strong>, de la main à la main (des billets ? imprimez <Link to="/senrichir" className="lien-texte">les planches</Link>) ;
            chez la banque, en billets papier ou avec l’argent de son compte.
          </p>
          <div className="market-intro-actions">
            <Link to="/creer" className="btn btn-jaune btn-sm">+ Créer une œuvre</Link>
            <Link to="/deposer" className="btn btn-outline btn-sm">{estBanquier ? '+ La banque vend' : '+ Annonce au bon coin'}</Link>
          </div>
        </div>

        <div className="market-toolbar">
          <div className="filter-row" role="tablist" aria-label="Rayon">
            <span className="filter-label">Rayon</span>
            {RAYONS.map(([v, l]) => (
              <button key={v} type="button" role="tab" aria-selected={rayon === v} className={`chip ${rayon === v ? 'active' : ''}`} onClick={() => choisirRayon(v)}>{l}</button>
            ))}
          </div>
          <div className="market-search">
            <div className="field">
              <input type="search" placeholder="Rechercher au market…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Rechercher" />
            </div>
            <div className="field">
              <select value={tri} onChange={e => setTri(e.target.value)} aria-label="Trier par">
                {TRIS.map(([v, l]) => <option key={v} value={v}>Trier par : {l}</option>)}
              </select>
            </div>
          </div>
          {rayon === 'emarket' && (
            <div className="filter-row" role="group" aria-label="Atelier">
              <span className="filter-label">Atelier</span>
              <button type="button" className={`chip ${genre === 'tous' ? 'active' : ''}`} aria-pressed={genre === 'tous'} onClick={() => setGenre('tous')}>tous</button>
              {Object.entries(GENRES).map(([g, d]) => (
                <button key={g} type="button" className={`chip ${genre === g ? 'active' : ''}`} aria-pressed={genre === g} onClick={() => setGenre(g)}>{d.icone} {d.nom}</button>
              ))}
            </div>
          )}
          {(rayon === 'boncoin' || rayon === 'banque') && (
            <div className="filter-row" role="group" aria-label="Catégorie">
              <span className="filter-label">Catégorie</span>
              {CATEGORIES.map(c => (
                <button key={c} type="button" className={`chip ${categorie === c ? 'active' : ''}`} aria-pressed={categorie === c} onClick={() => setCategorie(c)}>{LIBELLE_CATEGORIE[c] || c}</button>
              ))}
            </div>
          )}
          <div className="filter-row" role="group" aria-label="Statut">
            <span className="filter-label">Statut</span>
            {STATUTS.map(([v, l]) => (
              <button key={v} type="button" className={`chip ${statut === v ? 'active' : ''}`} aria-pressed={statut === v} onClick={() => setStatut(v)}>{l}</button>
            ))}
            {filtres && <button type="button" className="btn btn-outline btn-xs filter-reset" onClick={() => { setGenre('tous'); setCategorie('toutes'); setSearch('') }}>✕ Réinitialiser</button>}
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
                  <div className="titre">{filtres ? 'Rien ne correspond' : statut === 'disponible' ? vide[0] : 'Rien d’adjugé pour le moment'}</div>
                  <p style={{ margin: '0 auto' }}>{filtres ? 'Essayez d’élargir vos filtres.' : vide[1]}</p>
                  {(rayon === 'tout' || rayon === 'emarket') && <Link to="/creer" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Créer une œuvre</Link>}
                  {rayon === 'boncoin' && <Link to="/deposer" className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Déposer une annonce</Link>}
                </div>
              : <div className="grid-3">{ventes.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>}
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); setVersion(v => v + 1) }} onUpdate={o => setVentes(prev => prev?.map(x => x.id === o.id ? { ...x, ...o } : x))} />}
    </div>
  )
}
