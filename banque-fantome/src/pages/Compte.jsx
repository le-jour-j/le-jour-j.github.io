import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import Notif from '../components/Notif'
import { estVente, estEnCours, tempsRestant, messageErreur } from '../utils/encheres'

function ChangerMdp() {
  const [mdp, setMdp]         = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState(null)

  async function submit() {
    if (mdp.length < 6) { setMsg({ t: 'err', m: 'Min 6 caractères' }); return }
    if (mdp !== confirm) { setMsg({ t: 'err', m: 'Les mots de passe ne correspondent pas' }); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: mdp })
    setLoading(false)
    if (error) setMsg({ t: 'err', m: error.message })
    else { setMsg({ t: 'ok', m: 'Mot de passe changé !' }); setMdp(''); setConfirm('') }
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <div className="field">
        <label>Nouveau mot de passe</label>
        <input type="password" value={mdp} onChange={e => setMdp(e.target.value)} placeholder="••••••••" />
      </div>
      <div className="field">
        <label>Confirmer</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
      </div>
      {msg && <div className={msg.t === 'ok' ? 'msg-ok' : 'msg-err'} role="status">{msg.m}</div>}
      <button className="btn btn-outline" onClick={submit} disabled={loading}>
        {loading ? '…' : 'Changer le mot de passe'}
      </button>
    </div>
  )
}

const TYPES = { emission: 'Émission', annulation: 'Annulation', enchere: 'Enchère', remboursement: 'Remboursement', achat: 'Achat', vente: 'Vente', commission: 'Commission' }

export default function Compte() {
  const { user, loading: authLoading, profile, solde, estBanquier, refreshProfile } = useAuth()
  const navigate  = useNavigate()
  const [objets, setObjets]     = useState([])        // mes dépôts
  const [encheres, setEncheres] = useState([])        // ventes où j'ai misé (en cours)
  const [achats, setAchats]     = useState([])        // ventes remportées
  const [livre, setLivre]       = useState([])        // grand livre
  const [selected, setSelected] = useState(null)
  const [notif, setNotif]       = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (authLoading) return // on attend de savoir si une session existe
    if (!user) { navigate('/connexion'); return }
    charger()
  }, [user, authLoading])

  async function charger() {
    const [d, e, a, l] = await Promise.all([
      supabase.from('objets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('encheres').select('objet_id').eq('user_id', user.id),
      supabase.from('objets').select('*').eq('vendu_a', user.id).order('vendu_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(40),
    ])
    setObjets(d.data || [])
    setAchats(a.data || [])
    setLivre(l.data || [])
    const ids = [...new Set((e.data || []).map(x => x.objet_id))]
    if (ids.length) {
      const { data } = await supabase.from('objets').select('*').in('id', ids).eq('statut', 'disponible').order('expire_at', { ascending: true })
      setEncheres(data || [])
    } else setEncheres([])
    refreshProfile()
  }

  async function deleteObjet(id) {
    setDeleting(id)
    const { error } = await supabase.from('objets').delete().eq('id', id)
    if (error) { setNotif({ msg: messageErreur(error), type: 'err' }) }
    else { setObjets(prev => prev.filter(o => o.id !== id)); setNotif({ msg: 'Objet retiré.', type: 'ok' }) }
    setDeleting(null)
  }

  async function changeStatut(id, statut) {
    const { error } = await supabase.from('objets').update({ statut }).eq('id', id)
    if (error) setNotif({ msg: messageErreur(error), type: 'err' })
    else { setObjets(prev => prev.map(o => o.id === id ? { ...o, statut } : o)); setNotif({ msg: `Statut → ${statut}`, type: 'ok' }) }
  }

  function majObjet(o) {
    setObjets(prev => prev.map(x => x.id === o.id ? o : x))
    setEncheres(prev => prev.map(x => x.id === o.id ? o : x))
    setSelected(s => (s && s.id === o.id ? o : s))
  }

  if (!user) return null

  const enVente = objets.filter(o => estEnCours(o)).length
  const meneurSur = encheres.filter(o => o.encherisseur_id === user.id)

  return (
    <div style={{ padding: '0 0 5rem' }}>
      <div className="compte-header">
        <div>
          <div className="eyebrow">OPÉRATEUR{estBanquier ? ' · BANQUIER' : ''}</div>
          <div className="pseudo">{profile?.pseudo || '—'}</div>
        </div>
        <div className="compte-chiffres">
          <div>
            <div className="eyebrow">SOLDE</div>
            <div className="nombre">{solde}<small> billets</small></div>
          </div>
          <div>
            <div className="eyebrow">EN VENTE</div>
            <div className="nombre">{enVente}</div>
          </div>
          <div>
            <div className="eyebrow">ENCHÈRES EN COURS</div>
            <div className="nombre">{encheres.length}</div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ── Mes enchères ── */}
        {encheres.length > 0 && (
          <>
            <div className="section-head">
              <h2>Mes enchères</h2>
              <span className="count">meneur sur {meneurSur.length} / {encheres.length}</span>
            </div>
            <div className="liste-encheres">
              {encheres.map(o => {
                const meneur = o.encherisseur_id === user.id
                return (
                  <button key={o.id} type="button" className={`ligne-enchere ${meneur ? 'meneur' : 'surencheri'}`} onClick={() => setSelected(o)}>
                    <span className={`stamp ${meneur ? 'stamp-jaune' : 'stamp-rouge'}`}>{meneur ? 'meneur' : 'surenchéri'}</span>
                    <strong className="ligne-titre">{o.titre}</strong>
                    <span className="ligne-prix">{o.enchere_courante} billets{!meneur && ` · par ${o.encherisseur_pseudo}`}</span>
                    <span className="caption-gris">⏱ {tempsRestant(o.expire_at)}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Mes achats ── */}
        {achats.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: '3rem' }}>
              <h2>Mes acquisitions</h2>
              <span className="count">{achats.length} adjugée{achats.length > 1 ? 's' : ''}</span>
            </div>
            <div className="grid-3">{achats.map(o => <ObjetCard key={o.id} objet={o} onClick={setSelected} />)}</div>
          </>
        )}

        {/* ── Mes dépôts ── */}
        <div className="section-head" style={{ marginTop: (encheres.length || achats.length) ? '3rem' : 0 }}>
          <h2>Mes dépôts</h2>
          <Link to="/deposer" className="count">+ Nouveau →</Link>
        </div>

        {objets.length === 0
          ? <div className="vide">
              <div className="titre">Aucun objet en circulation</div>
              <Link to="/deposer" className="btn btn-noir">Déposer un objet →</Link>
            </div>
          : <div className="grid-3">
              {objets.map(o => (
                <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <ObjetCard objet={o} onClick={setSelected} />
                  <div className="compte-actions">
                    {estVente(o)
                      ? <span className="caption-gris" style={{ alignSelf: 'center' }}>
                          {o.statut === 'disponible' ? `${o.nb_encheres} enchère${o.nb_encheres > 1 ? 's' : ''} · ${tempsRestant(o.expire_at)}` : o.statut === 'échangé' ? `adjugé ${o.prix_final} à ${o.vendu_a_pseudo}` : `${o.statut} — ouvrir la fiche pour remettre en vente`}
                        </span>
                      : ['disponible', 'réservé', 'échangé'].map(s => (
                          <button key={s} className={`chip ${o.statut === s ? 'active' : ''}`} aria-pressed={o.statut === s} onClick={() => changeStatut(o.id, s)}>{s}</button>
                        ))
                    }
                    {!(estVente(o) && (o.prix_final || (o.statut === 'disponible' && o.nb_encheres > 0))) && (
                      <button className="btn btn-rouge btn-xs" disabled={deleting === o.id}
                        onClick={() => { if (confirm('Retirer cet objet ?')) deleteObjet(o.id) }}
                      >{deleting === o.id ? '…' : 'supprimer'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
        }

        {/* ── Grand livre ── */}
        {livre.length > 0 && (
          <>
            <div className="section-head" style={{ marginTop: '3rem' }}>
              <h2>Grand livre</h2>
              <span className="count">{livre.length} derniers mouvements</span>
            </div>
            <div className="table-wrap">
              <table className="livre">
                <thead><tr><th>Date</th><th>Opération</th><th>Libellé</th><th className="num">Billets</th></tr></thead>
                <tbody>
                  {livre.map(t => (
                    <tr key={t.id} className={t.montant >= 0 ? 'credit' : 'debit'}>
                      <td>{new Date(t.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className="tag">{TYPES[t.type] || t.type}</span></td>
                      <td>{t.libelle}</td>
                      <td className="num">{t.montant > 0 ? '+' : ''}{t.montant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Changer mot de passe */}
        <div style={{ marginTop: '3rem' }}>
          <div className="section-head"><h2 style={{ fontSize: '2rem' }}>Changer de mot de passe</h2></div>
          <ChangerMdp />
        </div>
      </div>

      {selected && <ObjetModal objet={selected} onClose={() => { setSelected(null); charger() }} onUpdate={majObjet} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
