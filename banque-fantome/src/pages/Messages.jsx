import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthContext'
import Notif from '../components/Notif'

export default function Messages() {
  const { user, loading: authLoading } = useAuth()
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
    if (authLoading) return // on attend de savoir si une session existe (évite une redirection à tort au rechargement)
    if (!user) { navigate('/connexion'); return }
    loadConversations()
  }, [user, authLoading])

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
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Messages</h2>
          {unread > 0 && <span className="stamp stamp-rouge">{unread} non lu{unread > 1 ? 's' : ''}</span>}
        </div>

        <div className={`messages-grid ${selected ? 'has-thread' : 'solo'}`}>

          {/* ── LISTE CONVERSATIONS ── */}
          <div className="conv-list">
            {loading
              ? <div className="loader">chargement<span className="blink">_</span></div>
              : conversations.length === 0
                ? <div className="vide"><div className="titre">Aucun message</div><p style={{ margin: '0 auto' }}>Proposez un échange depuis une fiche du market pour démarrer une conversation.</p></div>
                : conversations.map(c => {
                    const key = `${c.userId}_${c.objetId}`
                    const isActive = selected?.userId === c.userId && selected?.objetId === c.objetId
                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(c)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(c) } }}
                        className={`conv ${isActive ? 'active' : ''} ${c.unread > 0 ? 'unread' : ''}`}
                      >
                        <div className="conv-head">
                          <strong>{c.pseudo}</strong>
                          {c.unread > 0 && <span className="conv-count">{c.unread}</span>}
                        </div>
                        {c.objetTitre && <div className="conv-objet">re: {c.objetTitre}</div>}
                        <div className="conv-last">{c.last}</div>
                      </div>
                    )
                  })
            }
          </div>

          {/* ── THREAD ── */}
          {selected && (
            <div className="thread">
              <div className="thread-head">
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{selected.pseudo}</div>
                  {selected.objetTitre && <div className="caption-gris">re: {selected.objetTitre}</div>}
                </div>
                <button className="thread-close" onClick={() => setSelected(null)} aria-label="Fermer la conversation">✕</button>
              </div>

              <div className="thread-body">
                {thread.map(m => {
                  const isMine = m.expediteur_id === user.id
                  return (
                    <div key={m.id} className={`bulle-wrap ${isMine ? 'mine' : ''}`}>
                      <div className="bulle">{m.contenu}</div>
                      <div className="caption-gris" style={{ marginTop: '.2rem' }}>
                        {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="thread-reply">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  placeholder="Votre message… (Entrée pour envoyer, Maj+Entrée pour un retour à la ligne)"
                  aria-label="Votre message"
                />
                <button className="btn btn-noir" onClick={sendReply} disabled={sending || !reply.trim()} style={{ alignSelf: 'flex-end' }} aria-label="Envoyer">
                  {sending ? '…' : 'Envoyer →'}
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
