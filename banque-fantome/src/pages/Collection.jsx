import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import CarteDessin from '../components/CarteDessin'
import CarteOeuvre from '../components/CarteOeuvre'
import ObjetModal from '../components/ObjetModal'
import Notif from '../components/Notif'
import { COLONNES_DESSIN, useQuota } from './Bourse'
import { COLONNES_OEUVRE } from '../lib/oeuvres'

// Ma collection (2026-10-19) : tout ce qu'on possède, au même endroit. Les billets (dessinés
// ou achetés) s'encaissent ou se vendent à la bourse ; les œuvres se vendent à l'E-market.
// ?type=billets|oeuvres ; sans paramètre, tout.
const TYPES = [['tout', 'Tout'], ['billets', '◈ Billets'], ['oeuvres', '✦ Œuvres']]

export default function Collection() {
  const { user, loading, refreshProfile } = useAuth()
  const [params, setParams] = useSearchParams()
  const type = TYPES.some(([t]) => t === params.get('type')) ? params.get('type') : 'tout'
  const [quota, rechargerQuota] = useQuota(user)
  const [notif, setNotif] = useState(null)
  const [selected, setSelected] = useState(null)
  const [data, setData] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!user) return
    let annule = false
    Promise.all([
      supabase.from('dessins').select(COLONNES_DESSIN).eq('proprietaire_id', user.id).order('created_at', { ascending: false }).limit(300),
      supabase.from('oeuvres').select(COLONNES_OEUVRE).eq('proprietaire_id', user.id).order('created_at', { ascending: false }).limit(300),
      supabase.from('dessins').select(COLONNES_DESSIN).eq('auteur_id', user.id).in('statut', ['encaisse', 'annule']).order('created_at', { ascending: false }).limit(48),
      supabase.from('oeuvres').select(COLONNES_OEUVRE).eq('auteur_id', user.id).neq('proprietaire_id', user.id).order('created_at', { ascending: false }).limit(48),
    ]).then(([billets, oeuvres, encaisses, parties]) => {
      if (annule) return
      setData({ billets: billets.data || [], oeuvres: oeuvres.data || [], encaisses: encaisses.data || [], parties: parties.data || [] })
    })
    return () => { annule = true }
  }, [user, version])

  const changer = useCallback(() => { rechargerQuota(); refreshProfile?.(); setVersion(v => v + 1) }, [rechargerQuota, refreshProfile])

  async function voirVente(x) {
    const col = x.coupure ? 'dessin_id' : 'oeuvre_id'
    const { data: o } = await supabase.from('objets').select('*').eq(col, x.id).eq('statut', 'disponible').maybeSingle()
    if (o) setSelected(o)
    else setNotif({ msg: 'Cette vente vient de se terminer.', type: 'err' })
  }

  if (loading) return <div className="loader">Chargement<span className="blink">_</span></div>
  if (!user) return (
    <div className="acces-refuse">
      <div>
        <div className="titre">Ma collection</div>
        <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>Vos billets et vos œuvres apparaissent ici une fois connecté.</p>
        <Link to="/connexion?retour=%2Fcollection" className="btn btn-noir">Se connecter →</Link>
      </div>
    </div>
  )

  const billets = type === 'oeuvres' ? [] : data?.billets || []
  const oeuvres = type === 'billets' ? [] : data?.oeuvres || []
  const vide = data && !billets.length && !oeuvres.length

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Ma collection</h2>
          {data && <span className="count">{data.billets.length} billet{data.billets.length > 1 ? 's' : ''} · {data.oeuvres.length} œuvre{data.oeuvres.length > 1 ? 's' : ''}</span>}
        </div>
        <div className="bourse-barre">
          <div className="filter-row participer-onglets" role="tablist" aria-label="Type">
            {TYPES.map(([t, l]) => (
              <button key={t} type="button" role="tab" aria-selected={type === t} className={`chip ${type === t ? 'active' : ''}`}
                onClick={() => setParams(t === 'tout' ? {} : { type: t }, { replace: true })}>{l}</button>
            ))}
          </div>
          <Link to="/creer" className="btn btn-jaune btn-sm">+ Créer</Link>
        </div>
        <p className="caption-gris" style={{ margin: '-.6rem 0 1.4rem' }}>
          Ici, ce qui est numérique : vos billets et vos œuvres. Les objets réels achetés au market sont dans <Link to="/compte" className="lien-texte">Mon compte</Link>.
        </p>

        {data === null ? <div className="loader">Chargement<span className="blink">_</span></div>
          : vide ? (
            <div className="market-vide">
              <div className="titre">{type === 'billets' ? 'Aucun billet' : type === 'oeuvres' ? 'Aucune œuvre' : 'Collection vide'}</div>
              <p style={{ margin: '0 auto' }}>Ce que vous créez ou achetez arrive ici.</p>
              <Link to={type === 'billets' ? '/creer?atelier=billet' : '/creer'} className="btn btn-jaune" style={{ marginTop: '1.2rem' }}>→ Créer</Link>
            </div>
          ) : (
            <>
              {billets.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <div className="section-head"><h2>Billets</h2><span className="count">s’encaissent ou se vendent à la <Link to="/bourse">bourse</Link></span></div>
                  {quota && <p className="caption-gris" style={{ marginBottom: '1rem' }}>Encaissements possibles aujourd’hui : {quota.restant} sur {quota.plafond}.</p>}
                  <div className="dessins-liste">
                    {billets.map(d => <CarteDessin key={d.id} dessin={d} moi={user.id} quota={quota} onNotif={setNotif} onChange={changer} onVoirVente={voirVente} />)}
                  </div>
                </section>
              )}
              {oeuvres.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <div className="section-head"><h2>Œuvres</h2><span className="count">se vendent à l’<Link to="/market?rayon=emarket">E-market</Link></span></div>
                  <div className="dessins-liste">
                    {oeuvres.map(w => <CarteOeuvre key={w.id} oeuvre={w} moi={user.id} onNotif={setNotif} onChange={changer} onVoirVente={voirVente} />)}
                  </div>
                </section>
              )}
            </>
          )}

        {data && type !== 'oeuvres' && data.encaisses.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div className="section-head"><h2>Encaissés</h2><span className="count">Au <Link to="/bourse?onglet=coffre">coffre de la banque</Link></span></div>
            <div className="dessins-liste">{data.encaisses.map(d => <CarteDessin key={d.id} dessin={d} moi={user.id} />)}</div>
          </section>
        )}
        {data && type !== 'billets' && data.parties.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <div className="section-head"><h2>Vos œuvres chez d’autres</h2><span className="count">Vendues, elles vivent leur vie</span></div>
            <div className="dessins-liste">{data.parties.map(w => <CarteOeuvre key={w.id} oeuvre={w} moi={user.id} />)}</div>
          </section>
        )}
      </div>
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); changer() }} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
