import { useEffect, useState } from 'react'

// Bouton « Installer l'appli » (PWA) + bandeau hors-ligne.
//  - Android / Chrome / Edge : le navigateur émet `beforeinstallprompt`, on le garde
//    sous le coude et on l'affiche au clic sur le bouton.
//  - iPhone / Safari : pas d'événement, on explique la manip (Partager → Sur l'écran d'accueil).
//  - Déjà installée (mode standalone) : rien n'est affiché.

const STANDALONE = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const IOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream

export default function InstallPWA() {
  const [prompt, setPrompt]       = useState(null)   // événement beforeinstallprompt en attente
  const [installed, setInstalled] = useState(STANDALONE())
  const [showIos, setShowIos]     = useState(false)
  const [offline, setOffline]     = useState(!navigator.onLine)
  const [hidden, setHidden]       = useState(() => { try { return sessionStorage.getItem('bf-install-cache') === '1' } catch { return false } })

  useEffect(() => {
    function onPrompt(e) { e.preventDefault(); setPrompt(e) }
    function onInstalled() { setInstalled(true); setPrompt(null) }
    function on() { setOffline(false) }
    function off() { setOffline(true) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  async function installer() {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setPrompt(null)
    } else if (IOS()) {
      setShowIos(v => !v)
    }
  }

  function cacher() {
    setHidden(true)
    try { sessionStorage.setItem('bf-install-cache', '1') } catch {}
  }

  const peutProposer = !installed && !hidden && (prompt || IOS())

  return (
    <>
      {offline && (
        <div className="hors-ligne" role="status">
          ◈ Hors ligne — le market et les messages seront à jour au retour du réseau.
        </div>
      )}
      {peutProposer && (
        <div className="install-bar">
          <span className="install-texte">
            <strong>Banque Fantôme</strong> sur votre écran d'accueil, comme une appli.
          </span>
          <button type="button" className="btn btn-jaune btn-sm" onClick={installer}>
            ↓ Installer l'appli
          </button>
          <button type="button" className="install-fermer" onClick={cacher} aria-label="Ne plus proposer">✕</button>
          {showIos && (
            <div className="install-ios">
              Sur iPhone : touchez <strong>Partager</strong> (le carré avec une flèche) puis <strong>« Sur l'écran d'accueil »</strong>.
            </div>
          )}
        </div>
      )}
    </>
  )
}
