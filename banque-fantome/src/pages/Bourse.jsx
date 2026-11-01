import { Navigate, useSearchParams } from 'react-router-dom'

// La bourse aux billets (2026-10-18) n'a plus de page à elle depuis le 2026-11-01 (Jiiji :
// « je crois que l'onglet bourse sert à rien ») : l'atelier vivait déjà dans /creer, la collection
// dans /collection ; ses ventes sont devenues le rayon « Billets » du market et son coffre une
// section de S'enrichir. L'adresse reste pour les anciens liens et les moteurs.
const RENVOIS = {
  atelier: '/creer?atelier=billet',
  collection: '/collection?type=billets',
  coffre: '/senrichir#coffre',
}

export default function Bourse() {
  const [params] = useSearchParams()
  return <Navigate to={RENVOIS[params.get('onglet')] || '/market?rayon=billets'} replace />
}
