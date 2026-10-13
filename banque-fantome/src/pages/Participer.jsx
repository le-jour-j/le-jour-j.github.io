import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'
import GuichetEmission from '../components/GuichetEmission'
import Deposer from './Deposer'
import Notif from '../components/Notif'

// Participer : les deux gestes qui font entrer quelque chose dans la banque.
//   • mettre un objet, une œuvre ou un service en vente dans le market ;
//   • déposer un billet original au guichet (le compte est crédité).
// Le dépôt d'objet vient en premier (Jiiji, 2026-10-13) ; ?onglet=billet ouvre le guichet,
// ?onglet=market reste accepté (l'ancienne adresse /deposer y mène).
const ONGLETS = [
  { id: 'market', label: 'Mettre en vente au market' },
  { id: 'billet', label: 'Déposer un billet original' },
]

export default function Participer() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const onglet = params.get('onglet') === 'billet' ? 'billet' : 'market'
  const [notif, setNotif] = useState(null)

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>Participer</h2>
          <span className="count">Ce qui entre dans la banque</span>
        </div>
        <p className="texte-aide" style={{ marginBottom: '1.4rem' }}>
          Deux façons d'alimenter la banque : mettre aux enchères un objet, une œuvre ou un service ;
          ou y déposer un billet original, dessiné à la main, que la banque crédite sur votre compte. Les billets imprimés depuis les <Link to="/senrichir" className="lien-texte">planches</Link> se jouent sur papier, hors du site.
        </p>
        <div className="filter-row participer-onglets" role="tablist">
          {ONGLETS.map(o => (
            <button key={o.id} type="button" role="tab" aria-selected={onglet === o.id} className={`chip ${onglet === o.id ? 'active' : ''}`}
              onClick={() => setParams(o.id === 'billet' ? { onglet: 'billet' } : {}, { replace: true })}>{o.label}</button>
          ))}
        </div>

        {onglet === 'market' && (user
          ? <Deposer integre />
          : <p className="texte-aide">Ouvrez un compte pour déposer dans le market. <Link to="/connexion" className="lien-texte">Se connecter →</Link></p>)}

        {onglet === 'billet' && <GuichetEmission onNotif={setNotif} />}
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
