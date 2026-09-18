import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './components/AuthContext'
import Navbar from './components/Navbar'
import ClickEffects from './components/ClickEffects'
import InstallPWA from './components/InstallPWA'
import Home from './pages/Home'
import Inventaire from './pages/Inventaire'
import Deposer from './pages/Deposer'
import Connexion from './pages/Connexion'
import Compte from './pages/Compte'
import Messages from './pages/Messages'
import Senrichir from './pages/Senrichir'

export default function App() {
  const location = useLocation()

  // Retour en haut à chaque changement de page
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])

  return (
    <AuthProvider>
      <ClickEffects />
      <Navbar />
      {/* key = pathname : relance l'animation d'entrée (.page) à chaque navigation */}
      <main className="page" key={location.pathname}>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/market"     element={<Inventaire />} />
          <Route path="/inventaire" element={<Navigate to="/market" replace />} />
          <Route path="/senrichir"  element={<Senrichir />} />
          <Route path="/deposer"    element={<Deposer />} />
          <Route path="/connexion"  element={<Connexion />} />
          <Route path="/compte"     element={<Compte />} />
          <Route path="/messages"   element={<Messages />} />
        </Routes>
      </main>
      <InstallPWA />
      <footer className="footer">
        <div className="container">
          <span>◈ Banque Fantôme — institution de circulation</span>
          <span>La valeur ne préexiste pas : elle se dessine.</span>
        </div>
      </footer>
    </AuthProvider>
  )
}
