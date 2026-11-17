import { Component } from 'react'

// Une erreur d'affichage dans une page ne doit pas laisser l'écran blanc (2026-10-19).
// Remis à zéro à chaque changement de page (key = pathname dans App).
//
// Cas particulier (2026-11-14) : les pages se chargent à la demande. Un onglet ouvert avant une
// mise en ligne réclame alors un morceau de programme qui n'existe plus. Ce n'est pas une
// panne : on recharge la page une fois, toute seule, pour prendre la nouvelle version.
const MORCEAU_PERIME = /dynamically imported module|Importing a module script failed|Failed to fetch dynamically/i
const CLE = 'bf-rechargement-auto'

function rechargerUneFois() {
  try {
    const dernier = Number(sessionStorage.getItem(CLE) || 0)
    if (Date.now() - dernier < 30000) return false // déjà tenté il y a moins de 30 s : on affiche l'incident
    sessionStorage.setItem(CLE, String(Date.now()))
  } catch {
    return false // stockage indisponible : pas de rechargement automatique, pour ne jamais boucler
  }
  window.location.reload()
  return true
}

export default class Rattrapage extends Component {
  state = { erreur: null }
  static getDerivedStateFromError(erreur) { return { erreur } }
  componentDidCatch(erreur, info) {
    if (MORCEAU_PERIME.test(String(erreur?.message || erreur)) && rechargerUneFois()) return
    console.error('[Banque Fantôme]', erreur, info?.componentStack)
  }
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
