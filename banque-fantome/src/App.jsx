import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider } from './components/AuthContext'
import { NouveautesProvider } from './components/Nouveautes'
import Navbar from './components/Navbar'
import ClickEffects from './components/ClickEffects'
import InstallPWA from './components/InstallPWA'
import Rattrapage from './components/Rattrapage'
import Home from './pages/Home'
import Market from './pages/Market'
import Connexion from './pages/Connexion'
import Compte from './pages/Compte'
import Messages from './pages/Messages'
import Actu from './pages/Actu'
import Deposer from './pages/Deposer'
import Lettre from './pages/Lettre'
import Info from './pages/Info'
import { applySeo } from './lib/seo'

// Les pages lourdes se chargent à la demande : S'enrichir (le catalogue des 834 planches),
// l'admin, la bourse, les ateliers de Créer et la collection. Le reste du site ne les télécharge pas.
const Senrichir = lazy(() => import('./pages/Senrichir'))
const Admin = lazy(() => import('./pages/Admin'))
const Bourse = lazy(() => import('./pages/Bourse'))
const Creer = lazy(() => import('./pages/Creer'))
const Collection = lazy(() => import('./pages/Collection'))

// Une adresse inconnue : le serveur répond 404, l'appli le dit aussi (l'écran restait vide)
function Introuvable() {
  return (
    <div className="acces-refuse">
      <div>
        <div className="titre">Guichet introuvable</div>
        <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>Cette adresse ne mène nulle part dans la banque.</p>
        <Link to="/" className="btn btn-noir">Retour à l'accueil →</Link>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()

  // Retour en haut à chaque changement de page
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])

  // Titre, description, canonical et Open Graph de la page courante. Le
  // prérendu pose déjà ces balises dans le fichier statique : cet effet les
  // tient à jour quand on navigue dans l'appli sans recharger.
  useEffect(() => { applySeo(location.pathname) }, [location.pathname])

  return (
    <AuthProvider>
    <NouveautesProvider>
      <ClickEffects />
      <Navbar />
      {/* key = pathname : relance l'animation d'entrée (.page) à chaque navigation */}
      <main className="page" key={location.pathname}>
        <Rattrapage>
        <Suspense fallback={<div className="loader">Chargement<span className="blink">_</span></div>}>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/creer"      element={<Creer />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/market"     element={<Market />} />
          {/* Le supermarket est un rayon du market depuis le 2026-10-19 */}
          <Route path="/supermarket" element={<Navigate to="/market?rayon=supermarket" replace />} />
          <Route path="/inventaire" element={<Navigate to="/market?rayon=supermarket" replace />} />
          <Route path="/senrichir"  element={<Senrichir />} />
          <Route path="/actu"       element={<Actu />} />
          <Route path="/bourse"     element={<Bourse />} />
          {/* Participer (dépôt au market + guichet photo) a laissé place à la bourse, 2026-10-18 */}
          <Route path="/participer" element={<Navigate to="/creer?atelier=billet" replace />} />
          <Route path="/deposer"    element={<Deposer />} />
          <Route path="/connexion"  element={<Connexion />} />
          <Route path="/compte"     element={<Compte />} />
          <Route path="/messages"   element={<Messages />} />
          <Route path="/admin"      element={<Admin />} />
          <Route path="/lettre"     element={<Lettre />} />
          <Route path="/info"       element={<Info />} />
          <Route path="*"           element={<Introuvable />} />
        </Routes>
        </Suspense>
        </Rattrapage>
      </main>
      <InstallPWA />
      <footer className="footer">
        <div className="container">
          <span>◈ Banque Fantôme ◈ institution de circulation</span>
          <span>La valeur ne préexiste pas : elle se dessine.</span>
        </div>
      </footer>
    </NouveautesProvider>
    </AuthProvider>
  )
}
