import { useEffect } from 'react'

// Comportement commun aux fenêtres modales (v3) :
// bloque le défilement de la page derrière (compteur : gère les modales empilées)
// et ferme sur la touche Échap.
let ouvertes = 0

export function useModal(onClose) {
  useEffect(() => {
    ouvertes++
    document.body.classList.add('no-scroll')
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => {
      ouvertes = Math.max(0, ouvertes - 1)
      if (ouvertes === 0) document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
}
