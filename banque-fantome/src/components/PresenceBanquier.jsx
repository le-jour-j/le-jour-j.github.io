import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AGENCES, chargerPresences, jour, creneau, heure, journeeEntiere } from '../lib/agences'

// Où est le banquier ? Lu dans son agenda (table `presences`, recopiée toutes les 15 min par la
// fonction Edge). L'état « au guichet / pas au guichet » se recalcule chaque minute sans rien
// demander à la base ; la table n'est relue que toutes les 15 min et au retour sur l'onglet
// (alerte Supabase « Disk IO Budget », 2026-10-31).
// `compact` : une ligne pour l'accueil ; sinon l'état du moment et les prochains créneaux.
// « jeudi 15 octobre » → « Jeudi 15 octobre » (le mois garde sa minuscule)
const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1)

export default function PresenceBanquier({ compact = false }) {
  const [presences, setPresences] = useState(null)
  const [maintenant, setMaintenant] = useState(Date.now())

  useEffect(() => {
    let actif = true
    let lu = 0
    const charger = () => { lu = Date.now(); return chargerPresences().then(d => actif && setPresences(d)).catch(() => actif && setPresences([])) }
    charger()
    const horloge = setInterval(() => setMaintenant(Date.now()), 60000)
    // onglet caché : on ne relève rien (2026-11-01) ; au retour, seulement si la dernière lecture a plus de 5 min
    const releve = setInterval(() => { if (document.visibilityState === 'visible') charger() }, 15 * 60000)
    const onVisible = () => { if (document.visibilityState === 'visible') { setMaintenant(Date.now()); if (Date.now() - lu > 5 * 60000) charger() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { actif = false; clearInterval(horloge); clearInterval(releve); document.removeEventListener('visibilitychange', onVisible) }
  }, [])

  if (presences === null) return compact ? null : <div className="loader">Chargement<span className="blink">_</span></div>

  const avenir = presences.filter(p => Date.parse(p.fin) > maintenant)
  const enCours = avenir.find(p => Date.parse(p.debut) <= maintenant)
  const suivants = avenir.filter(p => p !== enCours)
  const prochain = suivants[0]

  const etat = enCours
    ? <><span className="presence-point presence-la" aria-hidden="true">●</span> Le banquier est au guichet {AGENCES[enCours.agence]?.court ?? enCours.agence}{journeeEntiere(enCours) ? ' aujourd\'hui' : ` jusqu'à ${heure(enCours.fin)}`}.</>
    : <><span className="presence-point" aria-hidden="true">●</span> Le banquier n'est pas au guichet en ce moment.{prochain && <> Prochaine permanence {jour(prochain.debut)} {creneau(prochain)}, {AGENCES[prochain.agence]?.court ?? prochain.agence}.</>}</>

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
              <span className="presence-jour">{majuscule(jour(p.debut))}</span>
              <span>{creneau(p)}</span>
              <span className="presence-lieu">{AGENCES[p.agence]?.nom ?? p.agence}</span>
            </li>
          ))}
        </ul>
      ) : !enCours && <p className="texte-aide">Les prochaines permanences seront annoncées ici.</p>}
    </div>
  )
}
