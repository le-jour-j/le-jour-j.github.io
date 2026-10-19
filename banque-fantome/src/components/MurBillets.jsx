import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { getPublicImageUrl } from '../utils/images'
import { messageErreur } from '../utils/encheres'
import BilletModal from './BilletModal'

// Mur des billets encaissés (public), avec cartel : utilisé sur S'enrichir et sur l'accueil.
// Sorti de GuichetEmission.jsx le 2026-10-19, quand le guichet photo a quitté le code.
export default function MurBillets({ limit = 12, titre = 'Derniers billets émis', sousTitre = 'La monnaie en circulation', onNotif }) {
  const { estBanquier } = useAuth()
  const [billets, setBillets] = useState([])
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    charger()
    const channel = supabase.channel(`mur-billets-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billets_emis' }, () => charger())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [limit])

  async function charger() {
    const { data } = await supabase.from('billets_emis').select('*').order('created_at', { ascending: false }).limit(limit)
    setBillets(data || [])
  }

  async function annuler(b) {
    const motif = window.prompt(`Annuler « ${b.titre || 'Sans titre'} » (${b.valeur}) de ${b.pseudo} ? Motif (facultatif) :`)
    if (motif === null) return
    const { error } = await supabase.rpc('annuler_billet', { p_billet: b.id, p_motif: motif || null })
    if (error) onNotif?.({ msg: messageErreur(error), type: 'err' })
    else { onNotif?.({ msg: 'Billet annulé, compte débité.', type: 'ok' }); setZoom(null); charger() }
  }

  if (!billets.length) return null
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div className="section-head">
        <h2>{titre}</h2>
        <span className="count">{sousTitre}</span>
      </div>
      <div className="billets-mur">
        {billets.map((b, i) => (
          <figure key={b.id} className={`billet-mur-item ${b.statut}`}>
            <button type="button" className="billet-mur-img" onClick={() => setZoom(i)} aria-label={`Voir ${b.titre || 'le billet'}`}>
              <img src={getPublicImageUrl(b.image_path)} alt={b.titre || `Billet de ${b.valeur} par ${b.pseudo}`} loading="lazy" />
            </button>
            <figcaption>
              <div className="cartel-mini-titre">{b.titre || 'Sans titre'}</div>
              <div className="cartel-mini-ligne">{b.artiste || b.pseudo || 'anonyme'}{b.technique && ` · ${b.technique}`}</div>
              <div className="cartel-mini-valeur"><strong>{b.valeur}</strong> {b.devise || 'billets'}
                {b.statut === 'annule' && <span className="stamp stamp-rouge" style={{ marginLeft: '.4rem', fontSize: '.6rem' }}>annulé</span>}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {zoom !== null && (
        <BilletModal billet={billets[zoom]} index={zoom} total={billets.length} estBanquier={estBanquier} onAnnuler={annuler}
          onClose={() => setZoom(null)}
          onPrev={() => setZoom(i => (i - 1 + billets.length) % billets.length)}
          onNext={() => setZoom(i => (i + 1) % billets.length)} />
      )}
    </section>
  )
}
