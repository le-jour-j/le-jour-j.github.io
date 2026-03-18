import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Récupère la route sauvegardée par 404.html
const redirect = sessionStorage.getItem('redirect')
if (redirect) {
  sessionStorage.removeItem('redirect')
  window.history.replaceState(null, '', '/banque-fantome' + redirect)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/banque-fantome">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)