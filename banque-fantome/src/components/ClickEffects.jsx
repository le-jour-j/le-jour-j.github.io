import { useEffect } from 'react'

// Effets globaux au clic (v3) :
//  1. « onde d'encre » à l'intérieur des boutons/chips/cartes (classe .ripple)
//  2. petite tache d'encre jaune à l'endroit du clic, n'importe où sur la page (.click-ink)
// Tout est délégué au document : aucun composant n'a besoin de câbler quoi que ce soit.
// Désactivé automatiquement si l'utilisateur préfère réduire les animations.

const CIBLES = '.btn, .chip, .objet-card, .card-link, .conv, .mode-switch button, .visual-card, .modal-media-item'

export default function ClickEffects() {
  useEffect(() => {
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduit) return

    function onPointerDown(e) {
      if (e.button !== 0) return

      // 1. onde d'encre dans l'élément interactif le plus proche
      const cible = e.target.closest?.(CIBLES)
      if (cible) {
        const rect = cible.getBoundingClientRect()
        const taille = Math.max(rect.width, rect.height) * 2.2
        const onde = document.createElement('span')
        onde.className = 'ripple'
        onde.style.width = onde.style.height = `${taille}px`
        onde.style.left = `${e.clientX - rect.left}px`
        onde.style.top = `${e.clientY - rect.top}px`
        cible.appendChild(onde)
        onde.addEventListener('animationend', () => onde.remove(), { once: true })
      }

      // 2. tache d'encre jaune sur le fond de page (pas dans les champs de saisie)
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const tache = document.createElement('span')
      tache.className = 'click-ink'
      tache.style.left = `${e.clientX}px`
      tache.style.top = `${e.clientY}px`
      document.body.appendChild(tache)
      tache.addEventListener('animationend', () => tache.remove(), { once: true })
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  return null
}
