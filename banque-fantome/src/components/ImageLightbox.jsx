import { useEffect, useRef } from 'react'
import Portal from './Portal'

// La visionneuse des photos (actus, objets, visuels).
// Au téléphone (2026-11-15, Jiiji : « les flèches, ça marche pas ») : on glisse le doigt vers la gauche ou la
// droite, ou on touche le bord gauche ou droit de la photo. Les flèches restent pour la souris et le clavier ;
// au téléphone elles sont en bas, et toujours au-dessus de la photo (avant, la photo les recouvrait).
export default function ImageLightbox({ images = [], initialIndex = 0, onClose, onPrev, onNext }) {
  const depart = useRef(null)      // où le doigt s'est posé
  const aGlisse = useRef(false)    // le dernier geste était un glissement : le clic qui suit ne compte pas

  useEffect(() => {
    document.body.classList.add('no-scroll')
    return () => { if (!document.querySelector('.modal-bg')) document.body.classList.remove('no-scroll') }
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, onPrev, onNext])

  const plusieurs = images.length > 1
  const safeIndex = images.length ? Math.min(Math.max(initialIndex, 0), images.length - 1) : 0

  // Les deux photos voisines se chargent d'avance : le changement est immédiat.
  useEffect(() => {
    if (!plusieurs) return
    for (const i of [safeIndex + 1, safeIndex - 1]) {
      const voisine = new Image()
      voisine.src = images[(i + images.length) % images.length]
    }
  }, [safeIndex, plusieurs, images])

  if (!images.length) return null
  const current = images[safeIndex]

  function doigtPose(e) {
    aGlisse.current = false
    depart.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
  }

  function doigtLeve(e) {
    const d = depart.current
    depart.current = null
    if (!d || !plusieurs || e.touches.length > 0) return
    if ((window.visualViewport?.scale || 1) > 1.05) return   // photo zoomée à deux doigts : on la laisse se déplacer
    const t = e.changedTouches[0]
    const dx = t.clientX - d.x
    const dy = t.clientY - d.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    aGlisse.current = true
    if (dx < 0) onNext?.()
    else onPrev?.()
  }

  function toucherPhoto(e) {
    if (aGlisse.current) { aGlisse.current = false; return }
    if (!plusieurs) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    if (x < 0.33) onPrev?.()
    else if (x > 0.67) onNext?.()
  }

  return (
    <Portal>
    <div className="lightbox-bg" onClick={onClose} onTouchStart={doigtPose} onTouchEnd={doigtLeve}>
      <div className="lightbox-shell" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Fermer">✕</button>
        <img key={current} className="lightbox-image" src={current} alt="Agrandissement" draggable={false} onClick={toucherPhoto} />
        {plusieurs && (
          <>
            <button className="lightbox-nav lightbox-prev" onClick={onPrev} aria-label="Image précédente">‹</button>
            <button className="lightbox-nav lightbox-next" onClick={onNext} aria-label="Image suivante">›</button>
            <div className="lightbox-counter">{safeIndex + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
    </Portal>
  )
}
