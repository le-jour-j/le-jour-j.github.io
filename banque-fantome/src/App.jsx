import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Inventaire from './pages/Inventaire'
import Deposer from './pages/Deposer'
import Connexion from './pages/Connexion'
import Compte from './pages/Compte'
import Messages from './pages/Messages'

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/inventaire" element={<Inventaire />} />
          <Route path="/deposer"    element={<Deposer />} />
          <Route path="/connexion"  element={<Connexion />} />
          <Route path="/compte"     element={<Compte />} />
          <Route path="/messages"   element={<Messages />} />
        </Routes>
      </main>
    </AuthProvider>
  )
}
