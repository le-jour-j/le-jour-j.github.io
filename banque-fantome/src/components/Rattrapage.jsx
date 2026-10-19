import { Component } from 'react'

// Une erreur d'affichage dans une page ne doit pas laisser l'écran blanc (2026-10-19).
// Remis à zéro à chaque changement de page (key = pathname dans App).
export default class Rattrapage extends Component {
  state = { erreur: null }
  static getDerivedStateFromError(erreur) { return { erreur } }
  componentDidCatch(erreur, info) { console.error('[Banque Fantôme]', erreur, info?.componentStack) }
  render() {
    if (!this.state.erreur) return this.props.children
    return (
      <div className="acces-refuse">
        <div>
          <div className="titre">Incident au guichet</div>
          <p className="texte-aide" style={{ marginBottom: '1.5rem' }}>Cette page a eu un problème d'affichage. Rechargez-la ; si ça recommence, prévenez la banque.</p>
          <button type="button" className="btn btn-noir" onClick={() => window.location.reload()}>↻ Recharger</button>
        </div>
      </div>
    )
  }
}
