import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENCES, chargerPresences, jour, creneau, heure, journeeEntiere } from '../lib/agences'

// Où est le banquier ? Lu dans son agenda (table `presences`), rafraîchi chaque minute.
// `compact` : une ligne pour l'accueil ; sinon l'état du moment et les prochains créneaux.
export default function PresenceBanquier({ compact = false }) {
  const [presences, setPresences] = useState(null)
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    let actif = true
    const charger = () => chargerPresences().then(d => actif && setPresences(d)).catch(() => actif && setPresences([]))
    charger()
    const t = setInterval(() => { setMaintenant(Date.now()); charger() }, 60000)
    return () => { actif = false; clearInterval(t) }
  }, [])

  if (presences === null) return compact ? null : <div className="loader">Chargement<span className="blink">_</span></div>

  const avenir = presences.filter(p => Date.parse(p.fin) > maintenant)
  const enCours = avenir.find(p => Date.parse(p.debut) <= maintenant)
  const suivants = avenir.filter(p => p !== enCours)
  const prochain = suivants[0]

  const etat = enCours
    ? <><span className="presence-point presence-la" aria-hidden="true">●</span> Le banquier est au guichet {AGENCES[enCours.agence].court}{journeeEntiere(enCours) ? ' aujourd\'hui' : ` jusqu'à ${heure(enCours.fin)}`}.</>
    : <><span className="presence-point" aria-hidden="true">●</span> Le banquier n'est pas au guichet en ce moment.{prochain && <> Prochaine permanence {jour(prochain.debut)} {creneau(prochain)}, {AGENCES[prochain.agence].court}.</>}</>

  if (compact) {
    return (
      <div className="presence-encart">
        <p>{etat}</p>
        <Link to="/info" className="btn btn-outline btn-sm">Horaires et agences →</Link>
      </div>
    )
  }

  return (
    <div className="presence">
      <p className="presence-etat">{etat}</p>
      {suivants.length > 0 ? (
        <ul className="presence-liste">
          {suivants.slice(0, 8).map(p => (
            <li key={p.debut + p.agence}>
              <span className="presence-jour">{jour(p.debut)}</span>
              <span>{creneau(p)}</span>
              <span className="presence-lieu">{AGENCES[p.agence].nom}</span>
            </li>
          ))}
        </ul>
      ) : !enCours && <p className="texte-aide">Les prochaines permanences seront annoncées ici.</p>}
    </div>
  )
}
