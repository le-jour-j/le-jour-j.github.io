import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

// « Recevoir la lettre » : l'inscription passe par le compte. Connecté, on va
// au réglage de Mon compte ; sinon, à la création de compte, case déjà cochée.
// (Les structures partenaires, sans compte, sont ajoutées par le banquier dans l'admin.)
export default function BoutonLettre({ className = 'btn btn-outline' }) {
  const { user } = useAuth()
  return <Link to={user ? '/compte#lettre' : '/connexion?lettre=1'} className={className}>✉ Recevoir la lettre</Link>
}
