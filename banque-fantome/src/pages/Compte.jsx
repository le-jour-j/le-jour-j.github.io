import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import ObjetCard from '../components/ObjetCard'
import ObjetModal from '../components/ObjetModal'
import Notif from '../components/Notif'

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
      {msg && (
        <div style={{ color: msg.t === 'ok' ? '#1a7a1a' : 'var(--rouge)', fontSize: '.82rem', fontWeight: 500, marginBottom: '1rem' }}>
          {msg.m}
        </div>
      )}
      <button className="btn btn-outline" onClick={submit} disabled={loading}>
        {loading ? '…' : 'Changer le mot de passe'}
      </button>
    </div>
  )
}

export default function Compte() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [profile, setProfile]   = useState(null)
  const [objets, setObjets]     = useState([])
  const [selected, setSelected] = useState(null)
  const [notif, setNotif]       = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/connexion'); return }
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    supabase.from('objets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setObjets(data || []))
  }, [user])

  async function deleteObjet(id) {
    setDeleting(id)
    const { error } = await supabase.from('objets').delete().eq('id', id)
    if (error) { setNotif({ msg: 'Erreur suppression', type: 'err' }) }
    else { setObjets(prev => prev.filter(o => o.id !== id)); setNotif({ msg: 'Objet retiré.', type: 'ok' }) }
    setDeleting(null)
  }

  async function changeStatut(id, statut) {
    const { error } = await supabase.from('objets').update({ statut }).eq('id', id)
    if (!error) { setObjets(prev => prev.map(o => o.id === id ? { ...o, statut } : o)); setNotif({ msg: `Statut → ${statut}`, type: 'ok' }) }
  }

  if (!user) return null

  return (
    <div style={{ padding: '0 0 5rem' }}>
      <div className="compte-header">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.2em', color: 'var(--gris)', marginBottom: '.4rem' }}>OPÉRATEUR</div>
          <div style={{ fontFamily: 'var(--bebas)', fontSize: '2.5rem', color: 'var(--blanc)', letterSpacing: '.04em' }}>{profile?.pseudo || '—'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.15em', color: 'var(--gris)', marginBottom: '.4rem' }}>OBJETS DÉPOSÉS</div>
          <div style={{ fontFamily: 'var(--bebas)', fontSize: '3rem', color: 'var(--jaune)', lineHeight: 1 }}>{objets.length}</div>
        </div>
      </div>

      <div className="container">
        <div className="section-head">
          <h2>Mes dépôts</h2>
          <Link to="/deposer" className="count">+ Nouveau →</Link>
        </div>

        {objets.length === 0
          ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gris)' }}>
              <div style={{ fontFamily: 'var(--bebas)', fontSize: '1.8rem', marginBottom: '1rem' }}>Aucun objet en circulation</div>
              <Link to="/deposer"><button className="btn btn-noir">Déposer un objet →</button></Link>
            </div>
          : <div className="grid-3">
              {objets.map(o => (
                <div key={o.id} style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <ObjetCard objet={o} onClick={setSelected} />
                  <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                    {['disponible', 'réservé', 'échangé'].map(s => (
                      <button key={s}
                        className={`btn ${o.statut === s ? 'btn-noir' : 'btn-outline'}`}
                        style={{ fontSize: '.62rem', padding: '.25rem .7rem' }}
                        onClick={() => changeStatut(o.id, s)}
                      >{s}</button>
                    ))}
                    <button className="btn btn-rouge" style={{ fontSize: '.62rem', padding: '.25rem .7rem', marginLeft: 'auto' }}
                      disabled={deleting === o.id}
                      onClick={() => { if (confirm('Retirer cet objet ?')) deleteObjet(o.id) }}
                    >{deleting === o.id ? '…' : 'retirer'}</button>
                  </div>
                </div>
              ))}
            </div>
        }

        {/* Changer mot de passe */}
        <div style={{ marginTop: '3rem', borderTop: '2px solid var(--gris-bord)', paddingTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Changer de mot de passe</h3>
          <ChangerMdp />
        </div>
      </div>

      {selected && <ObjetModal objet={selected} onClose={() => setSelected(null)} />}
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
