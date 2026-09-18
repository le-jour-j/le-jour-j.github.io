import { createPortal } from 'react-dom'

// Rend les fenêtres modales / notifications directement dans <body> (v3).
// Évite qu'un parent animé (transform) ne « capture » le position: fixed.
export default function Portal({ children }) {
  return createPortal(children, document.body)
}
