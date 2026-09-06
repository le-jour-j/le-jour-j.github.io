import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

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