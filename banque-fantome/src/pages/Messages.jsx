import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'

export default function Messages() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [conversations, setConversations] = useState([]) // liste des interlocuteurs
  const [selected, setSelected]           = useState(null) // { userId, pseudo, objetId, objetTitre }
  const [thread, setThread]               = useState([])
  const [reply, setReply]                 = useState('')
  const [loading, setLoading]             = useState(true)
  const [sending, setSending]             = useState(false)
  const [notif, setNotif]                 = useState(null)
  const [unread, setUnread]               = useState(0)

  useEffect(() => {
    if (!user) { navigate('/connexion'); return }
    loadConversations()
  }, [user])

  useEffect(() => {
    if (!selected) return
    loadThread()
    markRead()
  }, [selected])

  async function loadConversations() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    // Grouper par interlocuteur + objet
    const map = {}
    data.forEach(m => {
      const otherId     = m.expediteur_id === user.id ? m.destinataire_id : m.expediteur_id
      const otherPseudo = m.expediteur_id === user.id ? m.destinataire_pseudo : m.expediteur_pseudo
      const key = `${otherId}_${m.objet_id || 'general'}`
      if (!map[key]) {
        map[key] = {
          userId:     otherId,
          pseudo:     otherPseudo,
          objetId:    m.objet_id,
          objetTitre: m.objet_titre || null,
          last:       m.contenu,
          date:       m.created_at,
          unread:     0,
        }
      }
      if (!m.lu && m.destinataire_id === user.id) map[key].unread++
    })

    const convs = Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date))
    setConversations(convs)
    setUnread(convs.reduce((acc, c) => acc + c.unread, 0))
    setLoading(false)
  }

  async function loadThread() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(expediteur_id.eq.${user.id},destinataire_id.eq.${selected.userId}),and(expediteur_id.eq.${selected.userId},destinataire_id.eq.${user.id})`)
      .eq('objet_id', selected.objetId || null)
      .order('created_at', { ascending: true })
    setThread(data || [])
  }

  async function markRead() {
    await supabase.from('messages')
      .update({ lu: true })
      .eq('destinataire_id', user.id)
      .eq('expediteur_id', selected.userId)
  }

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true)

    const { data: profile } = await supabase
      .from('profiles').select('pseudo').eq('id', user.id).single()

    const { error } = await supabase.from('messages').insert({
      objet_id:            selected.objetId || null,
      expediteur_id:       user.id,
      destinataire_id:     selected.userId,
      expediteur_pseudo:   profile?.pseudo || 'Anonyme',
      destinataire_pseudo: selected.pseudo,
      contenu:             reply.trim(),
    })

    if (error) {
      setNotif({ msg: 'Erreur envoi', type: 'err' })
    } else {
      setReply('')
      loadThread()
      loadConversations()
    }
    setSending(false)
  }

  if (!user) return null

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        <div className="section-head">
          <h2>Messages</h2>
          {unread > 0 && <span className="stamp warn" style={{ fontSize: '.8rem' }}>{unread} non lu{unread > 1 ? 's' : ''}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── LISTE CONVERSATIONS ── */}
          <div>
            {loading
              ? <div className="loader">chargement<span className="blink">_</span></div>
              : conversations.length === 0
                ? <div style={{ color: 'var(--grey)', fontFamily: 'var(--vt)', fontSize: '1.3rem', padding: '2rem 0' }}>
                    AUCUN MESSAGE
                  </div>
                : conversations.map(c => {
                    const key = `${c.userId}_${c.objetId}`
                    const isActive = selected?.userId === c.userId && selected?.objetId === c.objetId
                    return (
                      <div
                        key={key}
                        onClick={() => setSelected(c)}
                        style={{
                          padding: '1rem',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'crosshair',
                          background: isActive ? 'var(--ink)' : c.unread > 0 ? 'var(--accent_light)' : 'var(--paper)',
                          color: isActive ? 'var(--paper)' : 'var(--ink)',
                          transition: 'background .1s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                          <strong style={{ fontFamily: 'var(--type)', fontSize: '1rem' }}>{c.pseudo}</strong>
                          {c.unread > 0 && <span style={{ background: 'var(--red)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem' }}>{c.unread}</span>}
                        </div>
                        {c.objetTitre && <div style={{ fontSize: '.7rem', color: isActive ? 'var(--grey)' : 'var(--grey)', marginBottom: '.2rem', textTransform: 'uppercase', letterSpacing: '.08em' }}>re: {c.objetTitre}</div>}
                        <div style={{ fontSize: '.8rem', color: isActive ? '#ccc' : 'var(--grey)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.last}
                        </div>
                      </div>
                    )
                  })
            }
          </div>

          {/* ── THREAD ── */}
          {selected && (
            <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '60vh' }}>
              {/* Header */}
              <div style={{ padding: '.8rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--ink)', color: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: 'var(--type)', fontSize: '1rem' }}>{selected.pseudo}</div>
                  {selected.objetTitre && <div style={{ fontSize: '.7rem', color: 'var(--grey)' }}>re: {selected.objetTitre}</div>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--grey)', cursor: 'crosshair', fontSize: '1.2rem' }}>✕</button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
                {thread.map(m => {
                  const isMine = m.expediteur_id === user.id
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        background: isMine ? 'var(--ink)' : 'var(--bg2)',
                        color: isMine ? 'var(--paper)' : 'var(--ink)',
                        padding: '.6rem .9rem',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--type)',
                        lineHeight: 1.6,
                      }}>
                        {m.contenu}
                      </div>
                      <div style={{ fontSize: '.65rem', color: 'var(--grey)', marginTop: '.2rem' }}>
                        {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Répondre */}
              <div style={{ padding: '.8rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.6rem' }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  placeholder="Votre message… (Entrée pour envoyer)"
                  style={{ flex: 1, resize: 'none', height: 60, background: 'var(--bg2)', border: '1px solid var(--border)', padding: '.5rem', fontFamily: 'var(--mono)', fontSize: '.85rem', color: 'var(--ink)', outline: 'none' }}
                />
                <button className="btn btn-solid" onClick={sendReply} disabled={sending} style={{ alignSelf: 'flex-end' }}>
                  {sending ? '…' : '→'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
