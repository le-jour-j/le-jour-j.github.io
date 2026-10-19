import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Service worker (PWA) : mise en cache de l'appli. Depuis le 2026-10-19 (Jiiji : l'appli installée
// sur le téléphone gardait l'ancienne version), une nouvelle version s'applique d'elle-même :
// l'appli en demande à chaque retour au premier plan et toutes les 30 minutes, et se recharge dès
// qu'elle en a une. Sauf là où l'on dessine ou écrit (ateliers, dépôt, admin, messages) : un
// bandeau propose la mise à jour, appliquée de toute façon en quittant la page ou l'appli.
const EN_TRAVAIL = ['/creer', '/deposer', '/admin', '/messages']
const enTravail = () => EN_TRAVAIL.some(p => window.location.pathname.startsWith('/banque-fantome' + p))
let majEnAttente = false
const appliquerMaj = () => window.location.reload()

function bandeauMaj() {
  if (document.getElementById('bf-maj')) return
  const d = document.createElement('div')
  d.id = 'bf-maj'
  d.className = 'bf-maj'
  d.setAttribute('role', 'status')
  const t = document.createElement('span')
  t.textContent = 'Nouvelle version de la banque.'
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'btn btn-noir btn-sm'
  b.textContent = '↻ Mettre à jour'
  b.onclick = appliquerMaj
  d.append(t, b)
  document.body.appendChild(d)
}

registerSW({
  immediate: true,
  onNeedReload() {
    if (document.visibilityState === 'hidden' || !enTravail()) return appliquerMaj()
    majEnAttente = true
    bandeauMaj()
  },
  onRegisteredSW(_url, r) {
    if (!r) return
    const verifier = () => r.update().catch(() => { /* hors ligne : on réessaiera */ })
    setInterval(verifier, 30 * 60 * 1000)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') verifier() })
  },
})
// Une mise à jour en attente part dès qu'on quitte l'atelier, ou que l'appli passe en arrière-plan
setInterval(() => { if (majEnAttente && !enTravail()) appliquerMaj() }, 3000)
document.addEventListener('visibilitychange', () => { if (majEnAttente && document.visibilityState === 'hidden') appliquerMaj() })

// GitHub Pages n'a pas de rewrite serveur : le 404.html racine redirige
// /banque-fantome/<route> vers /banque-fantome/ en gardant la route
// visée dans sessionStorage, qu'on restaure ici au chargement.
const redirect = sessionStorage.getItem('bf-redirect')
if (redirect) {
  sessionStorage.removeItem('bf-redirect')
  window.history.replaceState(null, '', '/banque-fantome' + redirect)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/banque-fantome">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)