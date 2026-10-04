import { useState } from 'react'
import { useAuth } from '../components/AuthContext'
import FilActu from '../components/FilActu'
import ActuForm from '../components/ActuForm'
import Notif from '../components/Notif'
import BoutonLettre from '../components/BoutonLettre'

// Le fil d'actu complet : ce qui arrive à la Banque Fantôme, au fil des expos et des ateliers.
export default function Actu() {
  const { estBanquier } = useAuth()
  const [nouvelle, setNouvelle] = useState(false)
  const [version, setVersion] = useState(0)
  const [notif, setNotif] = useState(null)

  return (
    <div className="page-pad">
      <div className="container container-actu">
        <div className="section-head">
          <h2>Le fil de la banque</h2>
          {estBanquier && !nouvelle && <button type="button" className="btn btn-jaune btn-sm" onClick={() => setNouvelle(true)}>+ Nouvelle actu</button>}
        </div>
        <p className="texte-aide" style={{ marginBottom: '1rem' }}>
          Expositions, ateliers, billets, installations : ce qui arrive à la Banque Fantôme, au fur et à mesure.
        </p>
        <div className="actu-lettre">
          <span className="caption-gris">Chaque semaine, ces nouvelles en résumé dans votre boîte mail.</span>
          <BoutonLettre className="btn btn-outline btn-sm" />
        </div>
        {nouvelle && <ActuForm onNotif={setNotif} onFini={a => { setNouvelle(false); if (a) setVersion(v => v + 1) }} />}
        <FilActu version={version} onNotif={setNotif} />
      </div>
      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
    </div>
  )
}
