import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import FilActu from '../components/FilActu'
import ActuForm from '../components/ActuForm'
import ObjetModal from '../components/ObjetModal'
import Notif from '../components/Notif'
import { getPublicImageUrl, getObjetImageUrls } from '../utils/images'
import { estVente, echeance, tempsRestant, messageErreur } from '../utils/encheres'
import { emailValide, messageLettre, fonctionLettre } from '../lib/lettre'

// Espace du banquier : fil d'actu, billets émis, market, comptes et chiffres.
// La page n'est qu'un tableau de bord : les droits sont vérifiés côté base
// (bf_est_banquier, annuler_billet, admin_retirer_objet, lecture des transactions).

const ONGLETS = [
  { id: 'actu', label: "Fil d'actu" },
  { id: 'billets', label: 'Billets émis' },
  { id: 'market', label: 'Market' },
  { id: 'comptes', label: 'Comptes et chiffres' },
  { id: 'lettre', label: 'Lettre' },
]

const dateCourte = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const dateHeure = d => d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

export default function Admin() {
  const { user, loading, estBanquier } = useAuth()
  const [onglet, setOnglet] = useState(() => {
    try { return sessionStorage.getItem('bf-admin-onglet') || 'actu' } catch { return 'actu' }
  })
  const [notif, setNotif] = useState(null)

  function choisir(id) {
    setOnglet(id)
    try { sessionStorage.setItem('bf-admin-onglet', id) } catch { /* navigation privée */ }
  }

  if (loading) return <div className="loader">Chargement<span className="blink">_</span></div>
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
        <div className="filter-row admin-onglets" role="tablist">
          {ONGLETS.map(o => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`chip ${onglet === o.id ? 'active' : ''}`} onClick={() => choisir(o.id)}>{o.label}</button>
          ))}
        </div>
        {onglet === 'actu' && <OngletActu onNotif={setNotif} />}
        {onglet === 'billets' && <OngletBillets onNotif={setNotif} />}
        {onglet === 'market' && <OngletMarket onNotif={setNotif} />}
        {onglet === 'comptes' && <OngletComptes />}
        {onglet === 'lettre' && <OngletLettre onNotif={setNotif} />}
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
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
function OngletBillets({ onNotif }) {
  const [billets, setBillets] = useState(null)
  const [filtre, setFiltre] = useState('valide')
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
            {billets.map(b => (
              <div key={b.id} className={`admin-ligne ${b.statut === 'annule' ? 'barre' : ''}`}>
                <a className="admin-vignette" href={getPublicImageUrl(b.image_path)} target="_blank" rel="noreferrer">
                  <img src={getPublicImageUrl(b.image_path)} alt="" loading="lazy" />
                </a>
                <div className="admin-infos">
                  <div className="admin-titre">{b.valeur} {b.devise || 'billets'}{b.titre ? ` · « ${b.titre} »` : ''}</div>
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
            ))}
          </div>}
    </div>
  )
}

// ─── Market ───
function OngletMarket({ onNotif }) {
  const [objets, setObjets] = useState(null)
  const [filtre, setFiltre] = useState('disponible')
  const [aRetirer, setARetirer] = useState(null)
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    let q = supabase.from('objets').select('*').order('created_at', { ascending: false }).limit(300)
    if (filtre !== 'tous') q = q.eq('statut', filtre)
    q.then(({ data }) => setObjets(data || []))
  }, [filtre, recharge])

  async function retirer(o) {
    setBusy(true)
    const { data, error } = await supabase.rpc('admin_retirer_objet', { p_objet: o.id })
    setBusy(false)
    if (error) { onNotif({ msg: messageErreur(error), type: 'err' }); return }
    onNotif({ msg: data?.rembourse ? `Retiré. ${data.rembourse} billets rendus à ${o.encherisseur_pseudo}.` : 'Retiré du market.', type: 'ok' })
    setARetirer(null)
    setRecharge(n => n + 1)
  }

  return (
    <div className="admin-panneau">
      <div className="admin-barre">
        <div className="filter-row">
          {[['disponible', 'en vente'], ['échangé', 'vendus'], ['retiré', 'retirés'], ['tous', 'tous']].map(([v, l]) => (
            <button key={v} type="button" className={`chip ${filtre === v ? 'active' : ''}`} onClick={() => setFiltre(v)}>{l}</button>
          ))}
        </div>
        <span className="caption-gris">Retirer une vente rend ses billets au meilleur enchérisseur.</span>
      </div>
      {objets === null ? <div className="loader">Chargement<span className="blink">_</span></div>
        : objets.length === 0 ? <p className="vide">Aucun dépôt.</p>
        : <div className="admin-liste">
            {objets.map(o => {
              const img = getObjetImageUrls(o)[0]
              const enVente = o.statut === 'disponible' || o.statut === 'réservé'
              return (
                <div key={o.id} className="admin-ligne">
                  <button type="button" className="admin-vignette" onClick={() => setSelected(o)} aria-label={`Ouvrir ${o.titre}`}>
                    {img ? <img src={img} alt="" loading="lazy" /> : <span>BF</span>}
                  </button>
                  <div className="admin-infos">
                    <button type="button" className="admin-titre lien-texte" onClick={() => setSelected(o)}>{o.titre}</button>
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
                      : <button type="button" className="btn btn-outline btn-xs" onClick={() => setARetirer(o.id)}>Retirer du market</button>)}
                  </div>
                </div>
              )
            })}
          </div>}
      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); setRecharge(n => n + 1) }} />}
    </div>
  )
}

// ─── Comptes et chiffres ───
function OngletComptes() {
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
    ['Trésor de la banque', stats?.tresor],
    ['Billets en circulation', stats?.en_circulation],
    ['Billets déposés', stats?.billets_emis],
    ['Montant déposé', stats?.montant_emis != null ? `${stats.montant_emis} €` : null],
    ['Ventes en cours', stats?.ventes_en_cours],
    ['Ventes conclues', stats?.ventes_conclues],
    ['Volume échangé', stats?.volume_echange],
  ]

  return (
    <div className="admin-panneau">
      <div className="admin-chiffres">
        {CHIFFRES.map(([l, v]) => (
          <div key={l} className="admin-chiffre">
            <div className="stat-label">{l}</div>
            <div className="stat-value">{v ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="admin-deux">
        <div>
          <h3 className="admin-soustitre">Comptes ({comptes?.length ?? '…'})</h3>
          {comptes === null ? <div className="loader">Chargement<span className="blink">_</span></div>
            : <table className="admin-table">
                <thead><tr><th>Pseudo</th><th>Solde</th><th>Billets déposés</th><th>Inscrit</th></tr></thead>
                <tbody>
                  {comptes.map(c => (
                    <tr key={c.id}>
                      <td>{c.pseudo}{c.role === 'banquier' && <span className="stamp stamp-jaune admin-role">banquier</span>}</td>
                      <td className="num">{c.solde}</td>
                      <td className="num">{depots.get(c.id)?.n || 0} · {depots.get(c.id)?.total || 0} €</td>
                      <td>{dateCourte(c.created_at)}</td>
                    </tr>
                  ))}
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

function OngletLettre({ onNotif }) {
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
      <div className="field" style={{ marginBottom: 0 }}>
        <label>Le mot du banquier (facultatif, en tête de la prochaine lettre)</label>
        <textarea value={mot} onChange={e => setMot(e.target.value)} placeholder="Une annonce, une date d'expo, un mot aux partenaires…" />
      </div>
      <div className="admin-barre">
        <div className="admin-actions" style={{ justifyContent: 'flex-start' }}>
          {mot !== (reglages.mot || '') && <button type="button" className="btn btn-noir btn-sm" onClick={() => majReglages({ mot: mot.trim() || null }).then(ok => ok && onNotif({ msg: 'Mot enregistré pour la prochaine lettre.', type: 'ok' }))}>Enregistrer le mot</button>}
          <button type="button" className="btn btn-outline btn-sm" disabled={!!busy} onClick={voirApercu}>{busy === 'apercu' ? '…' : "Voir l'aperçu"}</button>
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
      {apercu && (
        <div>
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
                {abonnes.map(a => (
                  <tr key={a.id} className={a.actif ? '' : 'lettre-inactif'}>
                    <td>{a.source === 'membre' ? <>{pseudos.get(a.user_id) || 'compte'} <span className="caption-gris">(compte)</span></> : (a.nom || <span className="caption-gris">partenaire</span>)}</td>
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
                ))}
              </tbody>
            </table>
          </div>}

      {/* ── Historique ── */}
      {historique.length > 0 && (
        <>
          <h3 className="admin-soustitre" style={{ marginTop: '1.5rem' }}>Lettres envoyées</h3>
          <table className="admin-table">
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
          </table>
        </>
      )}
    </div>
  )
}
