import { useEffect } from 'react'

export default function ImageLightbox({ images = [], initialIndex = 0, onClose, onPrev, onNext }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, onPrev, onNext])

  if (!images.length) return null
  const safeIndex = Math.min(Math.max(initialIndex, 0), images.length - 1)
  const current = images[safeIndex]

  return (
    <div className="lightbox-bg" onClick={onClose}>
      <div className="lightbox-shell" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>✕</button>
        {images.length > 1 && (
          <>
            <button className="lightbox-nav lightbox-prev" onClick={onPrev} aria-label="Image précédente">‹</button>
            <button className="lightbox-nav lightbox-next" onClick={onNext} aria-label="Image suivante">›</button>
          </>
        )}
        <img className="lightbox-image" src={current} alt="Agrandissement" />
        {images.length > 1 && (
          <div className="lightbox-counter">{safeIndex + 1} / {images.length}</div>
        )}
      </div>
    </div>
  )
}
