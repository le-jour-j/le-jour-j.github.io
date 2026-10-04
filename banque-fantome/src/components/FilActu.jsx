import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import ImageLightbox from './ImageLightbox'
import ActuForm from './ActuForm'
import { chargerActus, urlImageActu, dateActu, supprimerImagesActu } from '../lib/actus'
import { messageErreur } from '../utils/encheres'

// Fil d'actu du projet, façon blog : date, titre, texte, photos.
// Le banquier voit aussi les brouillons et peut publier, modifier, supprimer.
// `version` : changer sa valeur recharge le fil (après une nouvelle publication, par exemple).
export default function FilActu({ limit = 50, version = 0, onNotif, vide }) {
  const { estBanquier } = useAuth()
  const [actus, setActus] = useState(null)
  const [enEdition, setEnEdition] = useState(null)   // id de l'actu en cours de modification
  const [aSupprimer, setASupprimer] = useState(null) // id en attente de confirmation
  const [galerie, setGalerie] = useState(null)       // { images, index }
  const [recharge, setRecharge] = useState(0)

  useEffect(() => {
    let actif = true
    chargerActus(limit).then(d => actif && setActus(d)).catch(() => actif && setActus([]))
    return () => { actif = false }
  }, [limit, version, recharge, estBanquier])

  async function basculerPublication(a) {
    const { error } = await supabase.from('actus').update({ publie: !a.publie }).eq('id', a.id)
    if (error) { onNotif?.({ msg: messageErreur(error), type: 'err' }); return }
    onNotif?.({ msg: a.publie ? 'Repassée en brouillon.' : 'Nouvelle publiée.', type: 'ok' })
    setRecharge(n => n + 1)
  }

  async function supprimer(a) {
    const { error } = await supabase.from('actus').delete().eq('id', a.id)
    if (error) { onNotif?.({ msg: messageErreur(error), type: 'err' }); return }
    await supprimerImagesActu(a.images)
    setASupprimer(null)
    onNotif?.({ msg: 'Nouvelle supprimée.', type: 'ok' })
    setRecharge(n => n + 1)
  }

  if (actus === null) return <div className="loader">Chargement<span className="blink">_</span></div>
  if (actus.length === 0) return vide || <p className="texte-aide">Pas encore de nouvelles.</p>

  return (
    <div className="fil-actu">
      {actus.map(a => {
        if (enEdition === a.id) {
          return <ActuForm key={a.id} actu={a} onNotif={onNotif} onFini={() => { setEnEdition(null); setRecharge(n => n + 1) }} />
        }
        const urls = (a.images || []).map(urlImageActu).filter(Boolean)
        return (
          <article key={a.id} className={`actu ${a.publie ? '' : 'actu-brouillon'}`}>
            <header className="actu-tete">
              <time className="actu-date" dateTime={a.date_actu}>{dateActu(a.date_actu)}</time>
              {!a.publie && <span className="stamp stamp-jaune">Brouillon</span>}
            </header>
            <h3 className="actu-titre">{a.titre}</h3>
            {a.texte && <div className="actu-texte">{a.texte.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>}
            {urls.length > 0 && (
              <div className={`actu-photos n${Math.min(urls.length, 5)}`}>
                {urls.slice(0, 5).map((src, i) => (
                  <button key={src} type="button" className="actu-photo" onClick={() => setGalerie({ images: urls, index: i })} aria-label={`Agrandir la photo ${i + 1} sur ${urls.length}`}>
                    <img src={src} alt="" loading="lazy" />
                    {i === 4 && urls.length > 5 && <span className="actu-plus">+{urls.length - 5}</span>}
                  </button>
                ))}
              </div>
            )}
            {estBanquier && (
              <div className="actu-actions">
                <button type="button" className={`btn btn-xs ${a.publie ? 'btn-outline' : 'btn-jaune'}`} onClick={() => basculerPublication(a)}>{a.publie ? 'Repasser en brouillon' : '→ Publier'}</button>
                <button type="button" className="btn btn-outline btn-xs" onClick={() => setEnEdition(a.id)}>Modifier</button>
                {aSupprimer === a.id
                  ? <>
                      <button type="button" className="btn btn-rouge btn-xs" onClick={() => supprimer(a)}>Confirmer la suppression</button>
                      <button type="button" className="btn btn-outline btn-xs" onClick={() => setASupprimer(null)}>Non</button>
                    </>
                  : <button type="button" className="btn btn-outline btn-xs" onClick={() => setASupprimer(a.id)}>Supprimer</button>}
              </div>
            )}
          </article>
        )
      })}
      {galerie && (
        <ImageLightbox
          images={galerie.images}
          initialIndex={galerie.index}
          onClose={() => setGalerie(null)}
          onPrev={() => setGalerie(g => ({ ...g, index: (g.index - 1 + g.images.length) % g.images.length }))}
          onNext={() => setGalerie(g => ({ ...g, index: (g.index + 1) % g.images.length }))}
        />
      )}
    </div>
  )
}
