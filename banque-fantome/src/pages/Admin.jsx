import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import FilActu from '../components/FilActu'
import ActuForm from '../components/ActuForm'
import ObjetModal from '../components/ObjetModal'
import Deposer from './Deposer'
import Notif from '../components/Notif'
import ImageLightbox from '../components/ImageLightbox'
import { getPublicImageUrl, getObjetImageUrls } from '../utils/images'
import { COLONNES_OEUVRE, nomGenre } from '../lib/oeuvres'
import { estVente, echeance, tempsRestant, messageErreur } from '../utils/encheres'
import { emailValide, messageLettre, fonctionLettre } from '../lib/lettre'
import { useNouveautes, RUBRIQUE_DE_L_ONGLET } from '../components/Nouveautes'
import Crayon from '../components/Crayon'
import MessageModal from '../components/MessageModal'
import BoutonPlanche from '../components/BoutonPlanche'
import { planchesPdf, telechargerBlob } from '../lib/billet/planche'

// Espace du banquier : fil d'actu, billets à imprimer, billets émis, ventes (bon coin, la banque vend, E-market,
// bourse), œuvres, comptes (avec la fiche complète de chacun) et chiffres.
// La page n'est qu'un tableau de bord : les droits sont vérifiés côté base
// (bf_est_banquier, annuler_billet, admin_retirer_objet, lecture des transactions).

const ONGLETS = [
  { id: 'actu', label: "Fil d'actu" },
  { id: 'imprimer', label: 'À imprimer' },
  { id: 'billets', label: 'Billets émis' },
  { id: 'market', label: 'Ventes' },
  { id: 'oeuvres', label: 'Œuvres' },
  { id: 'comptes', label: 'Comptes et chiffres' },
  { id: 'lettre', label: 'Lettre' },
]

const dateCourte = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const dateHeure = d => d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`
// Une ligne est « nouvelle » si elle date d'après le dernier passage dans son onglet
const estNouveau = (date, depuis) => !!date && !!depuis && new Date(date) > new Date(depuis)
const Nouveau = () => <span className="stamp stamp-jaune admin-nouveau">nouveau</span>

export default function Admin() {
  const { user, loading, profile, estBanquier } = useAuth()
  const { data: nouveautes, compte, lettrePrete, recharger, marquerVu } = useNouveautes()
  // ?compte=<id> (le crayon mène à la fiche d'un compte) ouvre l'onglet des comptes sur cette fiche
  const [params, setParams] = useSearchParams()
  const compteDemande = params.get('compte')
  const [onglet, setOnglet] = useState(() => {
    if (compteDemande) return 'comptes'
    try { return sessionStorage.getItem('bf-admin-onglet') || 'actu' } catch { return 'actu' }
  })
  useEffect(() => { if (compteDemande) setOnglet('comptes') }, [compteDemande])
  const [notif, setNotif] = useState(null)
  // Ce qui était nouveau en arrivant : reste souligné dans les listes le temps de la visite
  const [depuis, setDepuis] = useState(null)

  useEffect(() => {
    if (!estBanquier) return
    recharger().then(d => d && setDepuis({ comptes: d.comptes.depuis, billets: d.billets.depuis, market: d.market.depuis, oeuvres: d.oeuvres?.depuis, abonnes: d.abonnes.depuis }))
  }, [estBanquier, recharger])

  // Ouvrir un onglet, c'est avoir vu ses nouveautés
  useEffect(() => { if (depuis) marquerVu(RUBRIQUE_DE_L_ONGLET[onglet]) }, [onglet, depuis, marquerVu])

  function choisir(id) {
    setOnglet(id)
    try { sessionStorage.setItem('bf-admin-onglet', id) } catch { /* navigation privée */ }
  }

  const aVoir = { imprimer: compte('a_imprimer'), comptes: compte('comptes'), billets: compte('billets'), market: compte('market'), oeuvres: compte('oeuvres'), lettre: compte('abonnes') + (lettrePrete ? 1 : 0) }

  // On attend aussi le profil : sans lui, le banquier voyait « Accès refusé » au rechargement
  if (loading || (user && !profile)) return <div className="loader">Chargement<span className="blink">_</span></div>
  if (!user || !estBanquier) return (
    <div className="acces-refuse">
      <div>
        <div className="titre">Accès refusé</div>
        <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>Cet espace est réservé au banquier.</p>
        <Link to={user ? '/' : '/connexion'} className="btn btn-noir">{user ? "Retour à l'accueil" : 'Se connecter →'}</Link>
      </div>
    </div>
  )

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Admin</h2>
          <span className="count">◈ banquier</span>
        </div>
        {nouveautes && <BlocNouveautes data={nouveautes} lettrePrete={lettrePrete} onOuvrir={choisir} />}
        <div className="filter-row admin-onglets" role="tablist">
          {ONGLETS.map(o => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`chip ${onglet === o.id ? 'active' : ''}`} onClick={() => choisir(o.id)}>
              {o.label}
              {aVoir[o.id] > 0 && <span className="chip-compte" aria-label={`${aVoir[o.id]} à voir`}>{aVoir[o.id]}</span>}
            </button>
          ))}
        </div>
        {onglet === 'actu' && <OngletActu onNotif={setNotif} />}
        {onglet === 'imprimer' && <OngletImprimer onNotif={setNotif} onImprime={recharger} />}
        {onglet === 'billets' && <OngletBillets onNotif={setNotif} depuis={depuis?.billets} />}
        {onglet === 'market' && <OngletMarket onNotif={setNotif} depuis={depuis?.market} />}
        {onglet === 'oeuvres' && <OngletOeuvres onNotif={setNotif} depuis={depuis?.oeuvres} />}
        {onglet === 'comptes' && <OngletComptes depuis={depuis?.comptes} onNotif={setNotif} fiche={compteDemande}
          onFiche={id => setParams(id ? { compte: id } : {}, { replace: !id })} />}
        {onglet === 'lettre' && <OngletLettre onNotif={setNotif} depuis={depuis?.abonnes} />}
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}

// ─── Nouveautés : ce qui s'est passé depuis la dernière visite de chaque onglet ───
function BlocNouveautes({ data, lettrePrete, onOuvrir }) {
  const { comptes, billets, market, oeuvres, abonnes, lettre } = data
  const lignes = []
  if (data.a_imprimer?.n) lignes.push({ onglet: 'imprimer', fort: true, texte: pluriel(data.a_imprimer.n, 'billet attend l’imprimante', 'billets attendent l’imprimante') })
  if (lettrePrete) lignes.push({ onglet: 'lettre', fort: true, texte: `La lettre est prête : ${lettre.en_attente} actus attendent d'être envoyées` })
  if (comptes.n) lignes.push({ onglet: 'comptes', texte: pluriel(comptes.n, 'nouveau compte', 'nouveaux comptes') })
  if (billets.n) lignes.push({ onglet: 'billets', texte: pluriel(billets.n, 'billet encaissé', 'billets encaissés') })
  if (market.n) lignes.push({ onglet: 'market', texte: pluriel(market.n, 'nouvelle vente', 'nouvelles ventes') })
  if (oeuvres?.n) lignes.push({ onglet: 'oeuvres', texte: pluriel(oeuvres.n, 'œuvre déposée', 'œuvres déposées') })
  const lettreMouvements = [
    abonnes.n > 0 && pluriel(abonnes.n, 'inscription', 'inscriptions'),
    abonnes.desinscrits > 0 && pluriel(abonnes.desinscrits, 'désinscription', 'désinscriptions'),
  ].filter(Boolean)
  if (lettreMouvements.length) lignes.push({ onglet: 'lettre', texte: `${lettreMouvements.join(', ')} à la lettre` })

  return (
    <div className="admin-nouveautes">
      <div className="admin-nouveautes-titre">◈ Nouveautés</div>
      {lignes.length === 0
        ? <p className="caption-gris">Rien de neuf depuis ta dernière visite.</p>
        : <ul>
            {lignes.map(l => (
              <li key={l.texte}>
                <button type="button" className={l.fort ? 'fort' : ''} onClick={() => onOuvrir(l.onglet)}>{l.texte} →</button>
              </li>
            ))}
          </ul>}
      {!lettrePrete && (
        <p className="caption-gris">
          Lettre : {lettre.en_attente} actu{lettre.en_attente > 1 ? 's' : ''} en attente, vous serez prévenu à {lettre.seuil}.
        </p>
      )}
    </div>
  )
}

// ─── Fil d'actu ───
function OngletActu({ onNotif }) {
  const [nouvelle, setNouvelle] = useState(false)
  const [version, setVersion] = useState(0)
  return (
    <div className="admin-panneau">
      <div className="admin-barre">
        <p className="texte-aide">Les brouillons (hachurés) ne sont visibles que par toi. « Publier » les met sur l'accueil et sur la page Actu.</p>
        {!nouvelle && <button type="button" className="btn btn-jaune btn-sm" onClick={() => setNouvelle(true)}>+ Nouvelle actu</button>}
      </div>
      {nouvelle && <ActuForm onNotif={onNotif} onFini={a => { setNouvelle(false); if (a) setVersion(v => v + 1) }} />}
      <FilActu limit={200} version={version} onNotif={onNotif} />
    </div>
  )
}

// ─── Billets émis ───
function OngletBillets({ onNotif, depuis }) {
  const { user } = useAuth()
  const [billets, setBillets] = useState(null)
  const [filtre, setFiltre] = useState('valide')
  const [agrandi, setAgrandi] = useState(null) // image du billet ouverte en grand
  const [enAnnulation, setEnAnnulation] = useState(null) // { id, motif }
  const [busy, setBusy] = useState(false)
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    let q = supabase.from('billets_emis').select('*').order('created_at', { ascending: false }).limit(300)
    if (filtre !== 'tous') q = q.eq('statut', filtre)
    q.then(({ data }) => setBillets(data || []))
  }, [filtre, recharge])

  async function annuler() {
    setBusy(true)
    const { error } = await supabase.rpc('annuler_billet', { p_billet: enAnnulation.id, p_motif: enAnnulation.motif.trim() || null })
    setBusy(false)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    onNotif({ msg: 'Billet annulé, le compte a été débité.', type: 'ok' })
    setEnAnnulation(null)
    setRecharge(n => n + 1)
  }

  return (
    <div className="admin-panneau">
      <div className="admin-barre">
        <div className="filter-row">
          {[['valide', 'valides'], ['annule', 'annulés'], ['tous', 'tous']].map(([v, l]) => (
            <button key={v} type="button" className={`chip ${filtre === v ? 'active' : ''}`} onClick={() => setFiltre(v)}>{l}</button>
          ))}
        </div>
        <span className="caption-gris">Annuler un billet débite son montant du compte de son auteur.</span>
      </div>
      {billets === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : billets.length === 0 ? <p className="vide">Aucun billet.</p>
        : <div className="admin-liste">
            {billets.map(b => {
              const nouveau = b.user_id !== user?.id && estNouveau(b.created_at, depuis)
              return (
              <div key={b.id} className={`admin-ligne ${b.statut === 'annule' ? 'barre' : ''} ${nouveau ? 'nouvelle' : ''}`}>
                <button type="button" className="admin-vignette" onClick={() => setAgrandi(getPublicImageUrl(b.image_path))} aria-label="Voir le billet en grand">
                  <img src={getPublicImageUrl(b.image_path)} alt="" loading="lazy" />
                </button>
                <div className="admin-infos">
                  <div className="admin-titre">{b.valeur} {b.devise || 'billets'}{b.titre ? ` · « ${b.titre} »` : ''}{nouveau && <Nouveau />}</div>
                  <div className="caption-gris">par <strong>{b.pseudo}</strong>{b.artiste && b.artiste !== b.pseudo ? ` (${b.artiste})` : ''} · {dateHeure(b.created_at)}{b.technique ? ` · ${b.technique}` : ''}</div>
                  {b.statut === 'annule' && <div className="caption-gris">Annulé le {dateCourte(b.annule_at)}{b.motif ? ` : ${b.motif}` : ''}</div>}
                </div>
                <div className="admin-actions">
                  {b.statut === 'valide' && (enAnnulation?.id === b.id
                    ? <>
                        <input className="admin-motif" placeholder="Motif (facultatif)" value={enAnnulation.motif} onChange={e => setEnAnnulation({ ...enAnnulation, motif: e.target.value })} />
                        <button type="button" className="btn btn-rouge btn-xs" disabled={busy} onClick={annuler}>Confirmer</button>
                        <button type="button" className="btn btn-outline btn-xs" onClick={() => setEnAnnulation(null)}>Non</button>
                      </>
                    : <button type="button" className="btn btn-outline btn-xs" onClick={() => setEnAnnulation({ id: b.id, motif: '' })}>Annuler le billet</button>)}
                  {b.statut === 'annule' && <span className="stamp stamp-rouge">annulé</span>}
                </div>
              </div>
              )
            })}
          </div>}
      {agrandi && <ImageLightbox images={[agrandi]} onClose={() => setAgrandi(null)} />}
    </div>
  )
}

// ─── Market ───
function OngletMarket({ onNotif, depuis }) {
  const { user } = useAuth()
  const [objets, setObjets] = useState(null)
  const [filtre, setFiltre] = useState('disponible')
  const [rayon, setRayon] = useState('supermarket') // supermarket (objets physiques) | market (œuvres) | bourse (billets dessinés)
  const [depot, setDepot] = useState(false)      // formulaire de mise en vente ouvert
  const [aRetirer, setARetirer] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    let q = supabase.from('objets').select('*').order('created_at', { ascending: false }).limit(300)
    if (filtre !== 'tous') q = q.eq('statut', filtre)
    q = rayon === 'bourse' ? q.not('dessin_id', 'is', null) : rayon === 'market' ? q.not('oeuvre_id', 'is', null) : q.is('dessin_id', null).is('oeuvre_id', null)
    q.then(({ data }) => setObjets(data || []))
  }, [filtre, rayon, recharge])

  async function retirer(o) {
    setBusy(true)
    const { data, error } = await supabase.rpc('admin_retirer_objet', { p_objet: o.id })
    setBusy(false)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    onNotif({ msg: data?.rembourse ? `Retiré. ${data.rembourse} billets rendus à ${o.encherisseur_pseudo}.` : 'Retiré de la vente.', type: 'ok' })
    setARetirer(null)
    setRecharge(n => n + 1)
  }

  return (
    <div className="admin-panneau">
      <div className="admin-barre">
        <div className="filter-row">
          {[['supermarket', 'Objets réels (bon coin, la banque vend)'], ['market', 'E-market (œuvres)'], ['bourse', 'Bourse aux billets']].map(([v, l]) => (
            <button key={v} type="button" className={`chip ${rayon === v ? 'active' : ''}`} onClick={() => setRayon(v)}>{l}</button>
          ))}
        </div>
        {rayon === 'supermarket' && (
          <button type="button" className={`btn btn-sm ${depot ? 'btn-outline' : 'btn-jaune'}`} onClick={() => setDepot(d => !d)}>
            {depot ? '✕ Fermer le formulaire' : '+ Mettre un article en vente'}
          </button>
        )}
      </div>
      {depot && rayon === 'supermarket' && (
        <div className="admin-depot">
          <Deposer integre onDepose={() => { setDepot(false); setFiltre('disponible'); setRecharge(n => n + 1) }} />
        </div>
      )}
      <div className="admin-barre">
        <div className="filter-row">
          {[['disponible', 'en vente'], ['échangé', 'vendus'], ['retiré', 'retirés'], ['tous', 'tous']].map(([v, l]) => (
            <button key={v} type="button" className={`chip ${filtre === v ? 'active' : ''}`} onClick={() => setFiltre(v)}>{l}</button>
          ))}
        </div>
        <span className="caption-gris">Retirer une vente de la bourse ou du market rend ses billets au meilleur enchérisseur ; au bon coin et chez la banque, rien n'a été débité.</span>
      </div>
      {objets === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : objets.length === 0 ? <p className="vide">Aucun dépôt.</p>
        : <div className="admin-liste">
            {objets.map(o => {
              const img = getObjetImageUrls(o)[0]
              const enVente = o.statut === 'disponible' || o.statut === 'réservé'
              const nouveau = o.user_id !== user?.id && estNouveau(o.created_at, depuis)
              return (
                <div key={o.id} className={`admin-ligne ${nouveau ? 'nouvelle' : ''}`}>
                  <button type="button" className="admin-vignette" onClick={() => setSelected(o)} aria-label={`Ouvrir ${o.titre}`}>
                    {img ? <img src={img} alt="" loading="lazy" /> : <span>BF</span>}
                  </button>
                  <div className="admin-infos">
                    <div><button type="button" className="admin-titre lien-texte" onClick={() => setSelected(o)}>{o.titre}</button>{nouveau && <Nouveau />}</div>
                    <div className="caption-gris">
                      par <strong>{o.pseudo || 'Anonyme'}</strong> · déposé le {dateCourte(o.created_at)} · <span className="admin-statut">{o.statut}</span>
                    </div>
                    {estVente(o) && (
                      <div className="caption-gris">
                        {o.statut === 'échangé'
                          ? `adjugé ${o.prix_final} à ${o.vendu_a_pseudo || '?'}`
                          : `${o.enchere_courante != null ? `enchère ${o.enchere_courante} (${o.encherisseur_pseudo})` : `mise ${o.mise_depart}`} · ${o.nb_encheres} enchère${o.nb_encheres > 1 ? 's' : ''}${enVente ? ` · ${tempsRestant(echeance(o))}` : ''}`}
                      </div>
                    )}
                  </div>
                  <div className="admin-actions">
                    {enVente && (aRetirer === o.id
                      ? <>
                          <button type="button" className="btn btn-rouge btn-xs" disabled={busy} onClick={() => retirer(o)}>Confirmer le retrait</button>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => setARetirer(null)}>Non</button>
                        </>
                      : <button type="button" className="btn btn-outline btn-xs" onClick={() => setARetirer(o.id)}>Retirer de la vente</button>)}
                  </div>
                </div>
              )
            })}
          </div>}
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); setRecharge(n => n + 1) }} />}
    </div>
  )
}

// ─── Œuvres : ce qui sort des ateliers (2026-10-19). La banque peut en retirer une. ───
function OngletOeuvres({ onNotif, depuis }) {
  const [oeuvres, setOeuvres] = useState(null)
  const [aAnnuler, setAAnnuler] = useState(null) // { id, motif }
  const [busy, setBusy] = useState(false)
  const [agrandi, setAgrandi] = useState(null)
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    supabase.from('oeuvres').select(COLONNES_OEUVRE).order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setOeuvres(data || []))
  }, [recharge])

  async function annuler() {
    setBusy(true)
    const { error } = await supabase.rpc('annuler_oeuvre', { p_oeuvre: aAnnuler.id, p_motif: aAnnuler.motif || null })
    setBusy(false)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    onNotif({ msg: 'Œuvre retirée des vitrines (et de la vente, enchère remboursée).', type: 'ok' })
    setAAnnuler(null)
    setRecharge(n => n + 1)
  }

  return (
    <div className="admin-panneau">
      <div className="admin-barre"><span className="caption-gris">Retirer une œuvre la sort du market et des vitrines publiques ; son auteur et son propriétaire la voient encore, marquée retirée.</span></div>
      {oeuvres === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : oeuvres.length === 0 ? <p className="vide">Aucune œuvre pour le moment.</p>
        : <div className="admin-liste">
            {oeuvres.map(w => {
              const nouveau = estNouveau(w.created_at, depuis)
              const img = getPublicImageUrl(w.apercu_path)
              return (
                <div key={w.id} className={`admin-ligne ${w.statut === 'annule' ? 'barre' : ''} ${nouveau ? 'nouvelle' : ''}`}>
                  <button type="button" className="admin-vignette" onClick={() => setAgrandi(img)} aria-label="Voir l’œuvre en grand">
                    <img src={img} alt="" loading="lazy" />
                  </button>
                  <div className="admin-infos">
                    <div className="admin-titre">{w.titre}{nouveau && <Nouveau />}</div>
                    <div className="caption-gris">{nomGenre(w.genre)} · par <strong>{w.auteur_pseudo || '?'}</strong> · {dateHeure(w.created_at)} · chez {w.proprietaire_pseudo || '?'} · <span className="admin-statut">{w.statut}</span></div>
                  </div>
                  <div className="admin-actions">
                    {w.statut !== 'annule' && (aAnnuler?.id === w.id
                      ? <>
                          <input className="admin-motif" placeholder="Motif (facultatif)" value={aAnnuler.motif} onChange={e => setAAnnuler({ ...aAnnuler, motif: e.target.value })} />
                          <button type="button" className="btn btn-rouge btn-xs" disabled={busy} onClick={annuler}>Confirmer</button>
                          <button type="button" className="btn btn-outline btn-xs" onClick={() => setAAnnuler(null)}>Non</button>
                        </>
                      : <button type="button" className="btn btn-outline btn-xs" onClick={() => setAAnnuler({ id: w.id, motif: '' })}>Retirer l’œuvre</button>)}
                    {w.statut === 'annule' && <span className="stamp stamp-rouge">retirée</span>}
                  </div>
                </div>
              )
            })}
          </div>}
      {agrandi && <ImageLightbox images={[agrandi]} onClose={() => setAgrandi(null)} />}
    </div>
  )
}

// ─── Comptes et chiffres ───
function OngletComptes({ depuis, fiche, onFiche, onNotif }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [comptes, setComptes] = useState(null)
  const [transactions, setTransactions] = useState(null)
  const [depots, setDepots] = useState(new Map()) // user_id → { n, total } des billets valides

  useEffect(() => {
    supabase.rpc('stats_banque').then(({ data }) => setStats(data || {}))
    supabase.from('profiles').select('id, pseudo, solde, role, created_at').order('solde', { ascending: false })
      .then(({ data }) => setComptes(data || []))
    supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setTransactions(data || []))
    supabase.from('billets_emis').select('user_id, valeur').eq('statut', 'valide').limit(10000)
      .then(({ data }) => {
        const m = new Map()
        for (const b of data || []) { const d = m.get(b.user_id) || { n: 0, total: 0 }; d.n += 1; d.total += b.valeur || 0; m.set(b.user_id, d) }
        setDepots(m)
      })
  }, [])

  const pseudos = useMemo(() => new Map((comptes || []).map(c => [c.id, c.pseudo])), [comptes])

  const CHIFFRES = [
    ['Commissions de la banque', stats?.tresor],
    ['Billets en circulation', stats?.en_circulation],
    ['Billets au coffre', stats?.billets_emis],
    ['Valeur du coffre', stats?.montant_emis != null ? `${stats.montant_emis} billets` : null],
    ['Ventes en cours', stats?.ventes_en_cours],
    ['Ventes conclues', stats?.ventes_conclues],
    ['Volume échangé', stats?.volume_echange],
  ]

  return (
    <div className="admin-panneau">
      {fiche && <FicheCompte id={fiche} onClose={() => onFiche(null)} onNotif={onNotif} />}
      <p className="caption-gris" style={{ marginBottom: '1rem' }}>Cliquez sur un pseudo : tout ce qui touche au compte (billets, œuvres, ventes, enchères, argent), avec le crayon sur chaque publication.</p>
      <div className="admin-chiffres">
        {CHIFFRES.map(([l, v]) => (
          <div key={l} className="admin-chiffre">
            <div className="stat-label">{l}</div>
            <div className="stat-value">{v ?? '…'}</div>
          </div>
        ))}
      </div>

      <div className="admin-deux">
        <div>
          <h3 className="admin-soustitre">Comptes ({comptes?.length ?? '…'})</h3>
          {comptes === null ? <div className="loader">Chargement<span className="blink">_</span></div>
            : <table className="admin-table">
                <thead><tr><th>Pseudo</th><th>Solde</th><th>Billets encaissés</th><th>Inscrit</th></tr></thead>
                <tbody>
                  {comptes.map(c => {
                    const nouveau = c.id !== user?.id && estNouveau(c.created_at, depuis)
                    return (
                    <tr key={c.id} className={nouveau ? 'nouvelle' : ''}>
                      <td><button type="button" className="lien-texte" onClick={() => onFiche(c.id)} title="Tout ce qui touche à ce compte">{c.pseudo}</button>{c.role === 'banquier' && <span className="stamp stamp-jaune admin-role">banquier</span>}{nouveau && <Nouveau />}</td>
                      <td className="num">{c.solde}</td>
                      <td className="num">{depots.get(c.id)?.n || 0} · {depots.get(c.id)?.total || 0} billets</td>
                      <td>{dateCourte(c.created_at)}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>}
        </div>
        <div>
          <h3 className="admin-soustitre">Dernières transactions</h3>
          {transactions === null ? <div className="loader">Chargement<span className="blink">_</span></div>
            : transactions.length === 0 ? <p className="vide">Aucune transaction.</p>
            : <table className="admin-table">
                <thead><tr><th>Quand</th><th>Compte</th><th>Montant</th><th>Libellé</th></tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>{dateHeure(t.created_at)}</td>
                      <td>{pseudos.get(t.user_id) || '?'}</td>
                      <td className={`num ${t.montant < 0 ? 'neg' : 'pos'}`}>{t.montant > 0 ? '+' : ''}{t.montant}</td>
                      <td>{t.libelle || t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>}
        </div>
      </div>
    </div>
  )
}

// ─── Lettre de la banque ───
// La lettre raconte les actus publiées depuis la précédente, plus le mot du banquier.
// Elle part seule le lundi matin (si l'envoi auto est coché), ou tout de suite d'ici.

// « Nom <a@b.fr> », « Nom ; a@b.fr », « a@b.fr » : une adresse par ligne
function lireAdresses(texte) {
  return texte.split(/\r?\n/).map(l => {
    const email = l.match(/[^\s<>;,]+@[^\s<>;,]+\.[^\s<>;,]+/)?.[0]
    if (!email) return null
    const nom = l.replace(email, '').replace(/[<>;,]/g, ' ').replace(/\s+/g, ' ').trim()
    return { email, nom: nom || null }
  }).filter(Boolean)
}

function OngletLettre({ onNotif, depuis }) {
  const { data: nouveautes, recharger } = useNouveautes()
  const [reglages, setReglages] = useState(null)
  const [mot, setMot] = useState('')
  const [abonnes, setAbonnes] = useState(null)
  const [pseudos, setPseudos] = useState(new Map())
  const [historique, setHistorique] = useState([])
  const [apercu, setApercu] = useState(null)
  const [emailTest, setEmailTest] = useState('')
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [enVrac, setEnVrac] = useState(null) // texte collé, null = fermé
  const [confirmEnvoi, setConfirmEnvoi] = useState(false)
  const [aSupprimer, setASupprimer] = useState(null)
  const [busy, setBusy] = useState(null) // nom de l'action en cours
  const [recharge, setRecharge] = useState(0)
  const apercuRef = useRef(null)

  // L'aperçu s'affiche sous les boutons, souvent hors de l'écran : on y descend
  // (2026-10-12, Jiiji ne le voyait pas apparaître)
  useEffect(() => {
    if (apercu) apercuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [apercu])

  useEffect(() => {
    supabase.from('lettre_reglages').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => { setReglages(data || { envoi_auto: true, mot: '' }); setMot(data?.mot || '') })
    supabase.from('lettres').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setHistorique(data || []))
    supabase.from('lettre_abonnes').select('*').order('created_at', { ascending: false })
      .then(async ({ data }) => {
        setAbonnes(data || [])
        const ids = (data || []).filter(a => a.user_id).map(a => a.user_id)
        if (ids.length) {
          const { data: p } = await supabase.from('profiles').select('id, pseudo').in('id', ids)
          setPseudos(new Map((p || []).map(x => [x.id, x.pseudo])))
        }
      })
  }, [recharge])

  const actifs = (abonnes || []).filter(a => a.actif)

  async function majReglages(champs) {
    const { error } = await supabase.from('lettre_reglages').update({ ...champs, updated_at: new Date().toISOString() }).eq('id', 1)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return false }
    setReglages(r => ({ ...r, ...champs }))
    return true
  }

  async function lancer(action, extra) {
    setBusy(action)
    try { return await fonctionLettre(action, extra) }
    catch (e) { onNotif({ msg: e.message, type: 'err' }); return null }
    finally { setBusy(null) }
  }

  async function voirApercu() {
    if (mot !== (reglages?.mot || '') && !(await majReglages({ mot: mot.trim() || null }))) return
    setApercu(null)
    const r = await lancer('apercu')
    if (r) setApercu(r)
  }

  async function envoyerTest() {
    if (emailTest && !emailValide(emailTest)) { onNotif({ msg: 'Adresse de test invalide.', type: 'err' }); return }
    const r = await lancer('test', emailTest ? { email: emailTest.trim() } : {})
    if (r?.ok) { onNotif({ msg: `Test envoyé à ${emailTest || 'l\'adresse de la banque'}.`, type: 'ok' }); setRecharge(n => n + 1) }
  }

  async function envoyerATous() {
    setConfirmEnvoi(false)
    const r = await lancer('envoyer')
    if (!r) return
    if (r.saute) onNotif({ msg: r.saute, type: 'err' })
    else onNotif({ msg: `Lettre envoyée à ${r.envoyes} abonné${r.envoyes > 1 ? 's' : ''}${r.echecs ? `, ${r.echecs} échec${r.echecs > 1 ? 's' : ''} (voir l'historique)` : ''}.`, type: r.echecs ? 'err' : 'ok' })
    setApercu(null)
    setMot('')
    setRecharge(n => n + 1)
    recharger()
  }

  async function changerSeuil(seuil) {
    if (await majReglages({ seuil_actus: seuil })) recharger()
  }

  async function ajouter(liste) {
    if (!liste.length) { onNotif({ msg: 'Aucune adresse valide.', type: 'err' }); return }
    setBusy('ajout')
    const deja = new Set((abonnes || []).map(a => a.email.toLowerCase()))
    const neufs = liste.filter((a, i) => !deja.has(a.email.toLowerCase()) && liste.findIndex(b => b.email.toLowerCase() === a.email.toLowerCase()) === i)
    const { error } = neufs.length
      ? await supabase.from('lettre_abonnes').insert(neufs.map(a => ({ ...a, source: 'partenaire' })))
      : { error: null }
    setBusy(null)
    if (error) { onNotif({ msg: messageLettre(error), type: 'err' }); return }
    const ignores = liste.length - neufs.length
    onNotif({ msg: `${neufs.length} adresse${neufs.length > 1 ? 's' : ''} ajoutée${neufs.length > 1 ? 's' : ''}${ignores ? ` (${ignores} déjà dans la liste)` : ''}.`, type: 'ok' })
    setNom(''); setEmail(''); setEnVrac(null)
    setRecharge(n => n + 1)
  }

  async function basculer(a) {
    const { error } = await supabase.from('lettre_abonnes')
      .update({ actif: !a.actif, desinscrit_at: a.actif ? new Date().toISOString() : null }).eq('id', a.id)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    setRecharge(n => n + 1)
  }

  async function supprimer(a) {
    const { error } = await supabase.from('lettre_abonnes').delete().eq('id', a.id)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    setASupprimer(null)
    setRecharge(n => n + 1)
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(actifs.map(a => a.email).join(', '))
      onNotif({ msg: `${actifs.length} adresses copiées.`, type: 'ok' })
    } catch { onNotif({ msg: 'Copie impossible dans ce navigateur.', type: 'err' }) }
  }

  if (!reglages || abonnes === null) return <div className="loader">Chargement<span className="blink">_</span></div>

  return (
    <div className="admin-panneau">
      {/* ── La prochaine lettre ── */}
      <h3 className="admin-soustitre">La prochaine lettre</h3>
      <p className="texte-aide">
        La lettre raconte les actus <strong>publiées</strong> depuis la précédente (photo, titre, début du texte, lien vers le site),
        et ton mot s'il y en a un. Sans actu nouvelle ni mot, elle ne part pas.
      </p>
      <label className="check-line" style={{ marginBottom: 0 }}>
        <input type="checkbox" checked={reglages.envoi_auto} onChange={e => majReglages({ envoi_auto: e.target.checked })} />
        Envoyer automatiquement chaque lundi matin
      </label>
      <div className="lettre-seuil">
        <label>
          Me prévenir quand
          <select value={reglages.seuil_actus ?? 3} onChange={e => changerSeuil(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          actu{(reglages.seuil_actus ?? 3) > 1 ? 's' : ''} attend{(reglages.seuil_actus ?? 3) > 1 ? 'ent' : ''}
        </label>
        {nouveautes && <span className="caption-gris">En ce moment : {pluriel(nouveautes.lettre.en_attente, 'actu en attente', 'actus en attente')}.</span>}
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Le mot du banquier (facultatif, en tête de la prochaine lettre)</label>
        <textarea value={mot} onChange={e => setMot(e.target.value)} placeholder="Une annonce, une date d'expo, un mot aux partenaires…" />
      </div>
      <div className="admin-barre">
        <div className="admin-actions" style={{ justifyContent: 'flex-start' }}>
          {mot !== (reglages.mot || '') && <button type="button" className="btn btn-noir btn-sm" onClick={() => majReglages({ mot: mot.trim() || null }).then(ok => ok && onNotif({ msg: 'Mot enregistré pour la prochaine lettre.', type: 'ok' }))}>Enregistrer le mot</button>}
          <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={voirApercu}>{busy === 'apercu' ? 'Aperçu en préparation…' : "Voir l'aperçu"}</button>
        </div>
        <div className="admin-actions">
          <input className="admin-motif" type="email" placeholder="Test à (vide = la banque)" value={emailTest} onChange={e => setEmailTest(e.target.value)} />
          <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={envoyerTest}>{busy === 'test' ? 'Envoi…' : 'Envoyer un test'}</button>
          {confirmEnvoi
            ? <>
                <button type="button" className="btn btn-rouge btn-sm" onClick={envoyerATous}>Confirmer l'envoi à {actifs.length}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmEnvoi(false)}>Non</button>
              </>
            : <button type="button" className="btn btn-jaune btn-sm" disabled={!!busy || !actifs.length} onClick={() => setConfirmEnvoi(true)}>{busy === 'envoyer' ? 'Envoi en cours…' : `Envoyer maintenant à ${actifs.length}`}</button>}
        </div>
      </div>
      {busy === 'apercu' && (
        <p className="texte-aide">
          L'IA écrit l'ouverture de la lettre à partir des actus : quelques secondes, rarement plus
          d'une demi-minute. L'aperçu s'affichera juste ici.
        </p>
      )}
      {apercu && (
        <div ref={apercuRef}>
          <div className="caption-gris" style={{ marginBottom: '.5rem' }}>
            {apercu.vide
              ? 'Rien à raconter pour l\'instant : aucune actu publiée depuis la dernière lettre, et pas de mot. Elle ne partirait pas.'
              : <>Objet : <strong>{apercu.objet}</strong> · {apercu.nb_actus} actu{apercu.nb_actus > 1 ? 's' : ''} · {apercu.nb_destinataires} destinataire{apercu.nb_destinataires > 1 ? 's' : ''}{apercu.expediteur ? ` · envoyée par ${apercu.expediteur}` : ''}</>}
          </div>
          {!apercu.vide && <iframe className="lettre-apercu" title="Aperçu de la lettre" srcDoc={apercu.html} sandbox="" />}
        </div>
      )}

      {/* ── Les abonnés ── */}
      <div className="admin-barre" style={{ marginTop: '1.5rem' }}>
        <h3 className="admin-soustitre" style={{ margin: 0 }}>Abonnés ({actifs.length} actif{actifs.length > 1 ? 's' : ''} sur {abonnes.length})</h3>
        <div className="admin-actions">
          <button type="button" className="btn btn-outline btn-xs" onClick={() => setEnVrac(enVrac === null ? '' : null)}>{enVrac === null ? 'Coller une liste' : 'Fermer'}</button>
          <button type="button" className="btn btn-outline btn-xs" disabled={!actifs.length} onClick={copier}>Copier les adresses</button>
        </div>
      </div>
      {enVrac !== null
        ? <div>
            <div className="field" style={{ marginBottom: '.6rem' }}>
              <label>Une adresse par ligne (« Nom de la structure &lt;adresse&gt; » ou juste l'adresse)</label>
              <textarea value={enVrac} onChange={e => setEnVrac(e.target.value)} placeholder={'Le Quadrilatère <contact@exemple.fr>\nautre@exemple.fr'} />
            </div>
            <button type="button" className="btn btn-noir btn-sm" disabled={busy === 'ajout'} onClick={() => ajouter(lireAdresses(enVrac))}>Ajouter {lireAdresses(enVrac).length} adresse{lireAdresses(enVrac).length > 1 ? 's' : ''}</button>
          </div>
        : <div className="admin-actions" style={{ justifyContent: 'flex-start' }}>
            <input className="admin-motif" placeholder="Structure partenaire" value={nom} onChange={e => setNom(e.target.value)} />
            <input className="admin-motif" type="email" placeholder="adresse@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && emailValide(email) && ajouter([{ email: email.trim(), nom: nom.trim() || null }])} />
            <button type="button" className="btn btn-noir btn-xs" disabled={busy === 'ajout' || !emailValide(email)} onClick={() => ajouter([{ email: email.trim(), nom: nom.trim() || null }])}>+ Ajouter</button>
          </div>}
      {abonnes.length === 0
        ? <p className="vide">Personne pour l'instant. Ajoute les structures partenaires ci-dessus ; les comptes s'inscrivent depuis Mon compte.</p>
        : <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Qui</th><th>E-mail</th><th>Depuis</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {abonnes.map(a => {
                  const nouveau = a.actif ? a.source === 'membre' && estNouveau(a.created_at, depuis) : estNouveau(a.desinscrit_at, depuis)
                  return (
                  <tr key={a.id} className={`${a.actif ? '' : 'lettre-inactif'} ${nouveau ? 'nouvelle' : ''}`}>
                    <td>{a.source === 'membre' ? <>{pseudos.get(a.user_id) || 'compte'} <span className="caption-gris">(compte)</span></> : (a.nom || <span className="caption-gris">partenaire</span>)}{nouveau && <Nouveau />}</td>
                    <td>{a.email}</td>
                    <td>{dateCourte(a.created_at)}</td>
                    <td>{a.actif ? 'inscrit' : `désinscrit${a.desinscrit_at ? ` le ${dateCourte(a.desinscrit_at)}` : ''}`}</td>
                    <td className="admin-actions">
                      <button type="button" className="btn btn-outline btn-xs" onClick={() => basculer(a)}>{a.actif ? 'Suspendre' : 'Réinscrire'}</button>
                      {aSupprimer === a.id
                        ? <>
                            <button type="button" className="btn btn-rouge btn-xs" onClick={() => supprimer(a)}>Confirmer</button>
                            <button type="button" className="btn btn-outline btn-xs" onClick={() => setASupprimer(null)}>Non</button>
                          </>
                        : <button type="button" className="btn btn-outline btn-xs" onClick={() => setASupprimer(a.id)}>Retirer</button>}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>}

      {/* ── Historique ── */}
      {historique.length > 0 && (
        <>
          <h3 className="admin-soustitre" style={{ marginTop: '1.5rem' }}>Lettres envoyées</h3>
          <div style={{ overflowX: 'auto' }}><table className="admin-table">
            <thead><tr><th>Quand</th><th>Comment</th><th>Objet</th><th>Envoyées</th><th>Échecs</th></tr></thead>
            <tbody>
              {historique.map(l => (
                <tr key={l.id}>
                  <td>{dateHeure(l.created_at)}</td>
                  <td>{{ auto: 'lundi (auto)', manuel: "depuis l'admin", test: 'test' }[l.mode]}</td>
                  <td>{l.objet}</td>
                  <td className="num">{l.nb_destinataires}</td>
                  <td className={`num ${l.nb_echecs ? 'neg' : ''}`} title={l.erreurs || ''}>{l.nb_echecs}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  )
}

// ─── À imprimer (2026-10-19, demande de Jiiji : « faut que moi la banque je reçoive les
// nouveaux billets en planche pour les imprimer en vrai, c'est le principe ») ───
// Tout billet dessiné sur le site attend ici jusqu'à ce que la banque l'ait imprimé.
// Un seul PDF, une planche A4 par billet (lib/billet/planche.js), puis « imprimés ».
const COLONNES_FILE = 'id, numero, code, coupure, titre, image_path, auteur_id, auteur_pseudo, statut, en_pause, created_at, imprime_at'
const ETAT_BILLET = { collection: 'chez son auteur', en_vente: 'en vente à la bourse', encaisse: 'encaissé (au coffre)', annule: 'annulé' }

function OngletImprimer({ onNotif, onImprime }) {
  const [file, setFile] = useState(null)
  const [faits, setFaits] = useState(null)
  const [choisis, setChoisis] = useState(new Set())
  const [etat, setEtat] = useState(null) // 'pdf' | 'marque' pendant le travail
  const [agrandi, setAgrandi] = useState(null)
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    supabase.from('dessins').select(COLONNES_FILE).is('imprime_at', null).neq('statut', 'annule')
      .order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => { setFile(data || []); setChoisis(new Set((data || []).map(d => d.id))) })
    supabase.from('dessins').select(COLONNES_FILE).not('imprime_at', 'is', null)
      .order('imprime_at', { ascending: false }).limit(30)
      .then(({ data }) => setFaits(data || []))
  }, [recharge])

  const basculer = id => setChoisis(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function pdf() {
    if (!choisis.size) return
    setEtat('pdf')
    try {
      // la trace (le dessin lui-même) n'est lue qu'ici : elle refait chaque billet à 300 dpi
      const { data, error } = await supabase.from('dessins').select('*').in('id', [...choisis]).order('created_at')
      if (error) throw error
      telechargerBlob(await planchesPdf(data), `planches-a-imprimer-${new Date().toISOString().slice(0, 10)}-${data.length}-billets.pdf`)
    } catch (e) {
      onNotif({ msg: e?.message ? messageErreur(e) : 'Le PDF n’a pas pu être fait.', type: 'err' })
    }
    setEtat(null)
  }

  async function marquer(ids, imprime = true) {
    setEtat('marque')
    const { error } = await supabase.rpc('admin_marquer_imprimes', { p_ids: ids, p_imprime: imprime })
    setEtat(null)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    onNotif({ msg: imprime ? `${pluriel(ids.length, 'billet marqué imprimé', 'billets marqués imprimés')}.` : 'Remis dans la file.', type: 'ok' })
    setRecharge(n => n + 1)
    onImprime?.()
  }

  const ligne = (d, dansFile) => {
    const img = getPublicImageUrl(d.image_path)
    return (
      <div key={d.id} className={`admin-ligne ${d.statut === 'annule' ? 'barre' : ''}`}>
        {dansFile && <input type="checkbox" className="admin-coche" checked={choisis.has(d.id)} onChange={() => basculer(d.id)} aria-label={`Imprimer ${d.code || d.numero}`} />}
        <button type="button" className="admin-vignette" onClick={() => setAgrandi(img)} aria-label="Voir le billet en grand">
          <img src={img} alt="" loading="lazy" />
        </button>
        <div className="admin-infos">
          <div className="admin-titre">{d.titre || `Billet de ${d.coupure}`} <span className="caption-gris">· {d.coupure} · n° {d.code || d.numero}</span></div>
          <div className="caption-gris">
            par <strong>{d.auteur_pseudo || '?'}</strong> · dessiné le {dateHeure(d.created_at)} · {ETAT_BILLET[d.statut] || d.statut}
            {d.imprime_at && <> · imprimé le {dateCourte(d.imprime_at)}</>}
          </div>
        </div>
        <div className="admin-actions">
          <BoutonPlanche dessin={d} className="btn btn-outline btn-xs" libelle="↓ Sa planche" />
          {!dansFile && <button type="button" className="btn btn-outline btn-xs" disabled={!!etat} onClick={() => marquer([d.id], false)}>↺ Remettre dans la file</button>}
          <Crayon type="dessin" onNotif={onNotif} onChange={() => setRecharge(n => n + 1)}
            cible={{ id: d.id, titre: d.titre || `Billet de ${d.coupure}`, en_pause: d.en_pause, auteur: { id: d.auteur_id, pseudo: d.auteur_pseudo } }} />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panneau">
      <p className="texte-aide" style={{ marginBottom: '1rem' }}>
        Chaque billet dessiné sur le site s’imprime en vrai. Le PDF met une planche A4 par billet, à taille réelle,
        traits de coupe compris : imprimez à <strong>100 % (taille réelle)</strong>, sans « ajuster à la page ».
        Une fois imprimés, marquez-les : ils sortent de la file.
      </p>
      {file === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : file.length === 0 ? <p className="vide">Rien à imprimer : tous les billets dessinés sont passés sous la presse.</p>
        : <>
            <div className="admin-barre">
              <button type="button" className="btn btn-jaune btn-sm" disabled={!!etat || !choisis.size} onClick={pdf}>
                {etat === 'pdf' ? 'Fabrication du PDF…' : `↓ Planches PDF (${choisis.size})`}
              </button>
              <button type="button" className="btn btn-noir btn-sm" disabled={!!etat || !choisis.size} onClick={() => marquer([...choisis])}>
                ✓ Marquer imprimés ({choisis.size})
              </button>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setChoisis(choisis.size === file.length ? new Set() : new Set(file.map(d => d.id)))}>
                {choisis.size === file.length ? 'Tout décocher' : 'Tout cocher'}
              </button>
              <span className="caption-gris">{pluriel(file.length, 'billet attend', 'billets attendent')}, du plus ancien au plus récent.</span>
            </div>
            <div className="admin-liste">{file.map(d => ligne(d, true))}</div>
          </>}
      {!!faits?.length && <>
        <h3 className="admin-soustitre" style={{ marginTop: '2rem' }}>Déjà imprimés (les 30 derniers)</h3>
        <div className="admin-liste">{faits.map(d => ligne(d, false))}</div>
      </>}
      {agrandi && <ImageLightbox images={[agrandi]} onClose={() => setAgrandi(null)} />}
    </div>
  )
}

// ─── La fiche d'un compte (2026-10-19, « dans l'admin j'ai accès à tout dans la partie users ») ───
// admin_fiche_compte (supabase_moderation.sql) : billets, œuvres, ventes, enchères, argent.
// Pas les messages privés. Le crayon sur chaque publication.
const rayonDe = o => o.dessin_id ? 'bourse' : o.oeuvre_id ? 'E-market' : o.vendeur_banque ? 'la banque vend' : 'bon coin'

function FicheCompte({ id, onClose, onNotif }) {
  const [f, setF] = useState(null)
  const [recharge, setRecharge] = useState(0)
  const [ecrire, setEcrire] = useState(false)
  const [vente, setVente] = useState(null)
  const relire = () => setRecharge(n => n + 1)

  useEffect(() => {
    let annule = false
    supabase.rpc('admin_fiche_compte', { p_user: id }).then(({ data, error }) => {
      if (annule) return
      if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); onClose(); return }
      setF(data)
    })
    return () => { annule = true }
  }, [id, recharge]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!f) return <div className="admin-fiche"><div className="loader">Chargement de la fiche<span className="blink">_</span></div></div>
  if (!f.profil) return <div className="admin-fiche"><p className="vide">Compte introuvable.</p><button type="button" className="btn btn-outline btn-sm" onClick={onClose}>✕ Fermer</button></div>
  const p = f.profil
  const auteur = { id: p.id, pseudo: p.pseudo }

  return (
    <div className="admin-fiche">
      <div className="admin-fiche-tete">
        <div>
          <div className="meta-label">Fiche du compte</div>
          <h3 className="modal-titre" style={{ margin: 0 }}>{p.pseudo}{p.role === 'banquier' && <span className="stamp stamp-jaune admin-role">banquier</span>}</h3>
          <div className="caption-gris">solde <strong>{p.solde}</strong> billets · inscrit le {dateCourte(p.created_at)}</div>
        </div>
        <div className="crayon-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEcrire(true)}>✉ Écrire à {p.pseudo}</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>✕ Fermer la fiche</button>
        </div>
      </div>

      <h4 className="admin-soustitre">Billets ({f.billets.length})</h4>
      {f.billets.length === 0 ? <p className="caption-gris">Aucun.</p> : <div className="admin-liste">
        {f.billets.map(d => (
          <div key={d.id} className={`admin-ligne ${d.statut === 'annule' ? 'barre' : ''}`}>
            <span className="admin-vignette"><img src={getPublicImageUrl(d.image_path)} alt="" loading="lazy" /></span>
            <div className="admin-infos">
              <div className="admin-titre">{d.titre || `Billet de ${d.coupure}`} <span className="caption-gris">· {d.coupure} · n° {d.code || d.numero}</span></div>
              <div className="caption-gris">
                {d.auteur_id === p.id ? 'dessiné' : `dessiné par ${d.auteur_pseudo || '?'}`}{d.proprietaire_id === p.id ? ', à lui' : d.proprietaire_id ? `, chez ${d.proprietaire_pseudo}` : ', au coffre'}
                {' · '}{ETAT_BILLET[d.statut] || d.statut}{d.imprime_at ? ' · imprimé' : ' · à imprimer'} · {dateCourte(d.created_at)}
              </div>
            </div>
            <div className="admin-actions">
              <Crayon type="dessin" onNotif={onNotif} onChange={relire}
                cible={{ id: d.id, titre: d.titre || `Billet de ${d.coupure}`, en_pause: d.en_pause, auteur: { id: d.auteur_id, pseudo: d.auteur_pseudo } }} />
            </div>
          </div>
        ))}
      </div>}

      <h4 className="admin-soustitre">Œuvres ({f.oeuvres.length})</h4>
      {f.oeuvres.length === 0 ? <p className="caption-gris">Aucune.</p> : <div className="admin-liste">
        {f.oeuvres.map(w => (
          <div key={w.id} className={`admin-ligne ${w.statut === 'annule' ? 'barre' : ''}`}>
            <span className="admin-vignette"><img src={getPublicImageUrl(w.apercu_path)} alt="" loading="lazy" /></span>
            <div className="admin-infos">
              <div className="admin-titre">{w.titre}</div>
              <div className="caption-gris">
                {nomGenre(w.genre)} · n° {w.numero} · {w.auteur_id === p.id ? 'faite' : `faite par ${w.auteur_pseudo || '?'}`}{w.proprietaire_id === p.id ? ', à lui' : `, chez ${w.proprietaire_pseudo || '?'}`} · {w.statut}{w.nb_ventes ? ` · ${pluriel(w.nb_ventes, 'vente', 'ventes')}` : ''}
              </div>
            </div>
            <div className="admin-actions">
              <Crayon type="oeuvre" onNotif={onNotif} onChange={relire}
                cible={{ id: w.id, titre: w.titre, description: w.description, en_pause: w.en_pause, auteur: { id: w.auteur_id, pseudo: w.auteur_pseudo } }} />
            </div>
          </div>
        ))}
      </div>}

      <h4 className="admin-soustitre">Ventes et achats ({f.ventes.length})</h4>
      {f.ventes.length === 0 ? <p className="caption-gris">Aucun.</p> : <div className="admin-liste">
        {f.ventes.map(o => (
          <div key={o.id} className={`admin-ligne ${o.statut === 'retiré' ? 'barre' : ''}`}>
            <button type="button" className="admin-vignette" onClick={() => setVente(o)} aria-label="Ouvrir la fiche de la vente">
              {getObjetImageUrls(o)[0] ? <img src={getObjetImageUrls(o)[0]} alt="" loading="lazy" /> : <span className="no-img">BF</span>}
            </button>
            <div className="admin-infos">
              <div className="admin-titre">{o.titre}</div>
              <div className="caption-gris">
                {rayonDe(o)} · {o.user_id === p.id ? 'mis en vente' : `acheté à ${o.pseudo || '?'}`} · {o.statut}
                {o.prix_final != null ? ` · ${o.prix_final} billets${o.user_id === p.id && o.vendu_a_pseudo ? ` à ${o.vendu_a_pseudo}` : ''}` : o.enchere_courante != null ? ` · enchère ${o.enchere_courante}` : o.mise_depart != null ? ` · mise ${o.mise_depart}` : ''}
                {' · '}{dateCourte(o.created_at)}
              </div>
            </div>
            <div className="admin-actions">
              <Crayon type="objet" onNotif={onNotif} onChange={relire}
                cible={{ id: o.id, titre: o.titre, description: o.description, en_pause: o.en_pause, auteur: { id: o.user_id, pseudo: o.pseudo } }} />
            </div>
          </div>
        ))}
      </div>}

      <div className="admin-deux">
        <div>
          <h4 className="admin-soustitre">Enchères ({f.encheres.length})</h4>
          {f.encheres.length === 0 ? <p className="caption-gris">Aucune.</p>
            : <table className="admin-table">
                <thead><tr><th>Quand</th><th>Vente</th><th>Montant</th><th>État</th></tr></thead>
                <tbody>{f.encheres.map(e => (
                  <tr key={e.id}><td>{dateHeure(e.created_at)}</td><td>{e.titre || '?'}</td><td className="num">{e.montant}</td><td>{e.statut}</td></tr>
                ))}</tbody>
              </table>}
        </div>
        <div>
          <h4 className="admin-soustitre">Argent ({f.transactions.length})</h4>
          {f.transactions.length === 0 ? <p className="caption-gris">Aucun mouvement.</p>
            : <table className="admin-table">
                <thead><tr><th>Quand</th><th>Montant</th><th>Libellé</th></tr></thead>
                <tbody>{f.transactions.map(t => (
                  <tr key={t.id}><td>{dateHeure(t.created_at)}</td><td className={`num ${t.montant < 0 ? 'neg' : 'pos'}`}>{t.montant > 0 ? '+' : ''}{t.montant}</td><td>{t.libelle || t.type}</td></tr>
                ))}</tbody>
              </table>}
        </div>
      </div>

      {ecrire && <MessageModal objet={{ id: null, titre: 'Message de la banque' }} destinataire={auteur} onClose={() => setEcrire(false)} />}
      {vente && <ObjetModal objet={vente} onClose={() => { setVente(null); relire() }} />}
    </div>
  )
}
