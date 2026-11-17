import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider } from './components/AuthContext'
import { NouveautesProvider } from './components/Nouveautes'
import Navbar from './components/Navbar'
import ClickEffects from './components/ClickEffects'
import InstallPWA from './components/InstallPWA'
import Rattrapage from './components/Rattrapage'
import Home from './pages/Home'
import { applySeo } from './lib/seo'

// Seul l'accueil arrive avec le programme principal. Toutes les autres pages se chargent à
// la demande, la première fois qu'on les ouvre (2026-11-14 : le site mettait « des plombes »
// à se charger sur une petite connexion). Le service worker les précharge ensuite en
// arrière-plan : dès la deuxième visite, elles s'ouvrent sans attente.
const Senrichir = lazy(() => import('./pages/Senrichir'))
const Admin = lazy(() => import('./pages/Admin'))
const Creer = lazy(() => import('./pages/Creer'))
const Collection = lazy(() => import('./pages/Collection'))
const Market = lazy(() => import('./pages/Market'))
const Connexion = lazy(() => import('./pages/Connexion'))
const Compte = lazy(() => import('./pages/Compte'))
const Messages = lazy(() => import('./pages/Messages'))
const Actu = lazy(() => import('./pages/Actu'))
const Deposer = lazy(() => import('./pages/Deposer'))
const Lettre = lazy(() => import('./pages/Lettre'))
const Info = lazy(() => import('./pages/Info'))
const Bourse = lazy(() => import('./pages/Bourse'))

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
          {/* Le supermarket est le rayon « La banque vend » du market depuis le 2026-10-19 */}
          <Route path="/supermarket" element={<Navigate to="/market?rayon=banque" replace />} />
          <Route path="/inventaire" element={<Navigate to="/market?rayon=boncoin" replace />} />
          <Route path="/senrichir"  element={<Senrichir />} />
          <Route path="/actu"       element={<Actu />} />
          {/* La bourse est le rayon « Billets » du market depuis le 2026-11-01, son coffre est dans S'enrichir */}
          <Route path="/bourse"     element={<Bourse />} />
          {/* Participer (dépôt au market + guichet photo) a laissé place à l'atelier à billets, 2026-10-18 */}
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
