import PresenceBanquier from '../components/PresenceBanquier'
import { AGENCES } from '../lib/agences'

// Infos pratiques (2026-10-13) : où est le banquier, et les agences de la banque.
export default function Info() {
  return (
    <div className="page-pad">
      <div className="container container-actu">
        <div className="section-head">
          <h2>Infos pratiques</h2>
          <span className="count">Agences et permanences</span>
        </div>

        <section style={{ marginBottom: '2.4rem' }}>
          <h3 className="info-titre">Le banquier est-il au guichet ?</h3>
          <PresenceBanquier />
          <p className="caption-gris" style={{ marginTop: '.8rem' }}>
            Les permanences viennent directement de l'agenda du banquier et se mettent à jour toutes les quinze minutes.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h3 className="info-titre">Les agences</h3>
          <p className="texte-aide" style={{ marginBottom: '1rem' }}>
            La banque est installée dans des lieux publics. Ils ont leurs propres horaires : le banquier n'y est pas en permanence, ses créneaux sont indiqués ci-dessus.
          </p>
          <div className="agences">
            {Object.entries(AGENCES).map(([id, a]) => (
              <article key={id} className="agence">
                <span className={`stamp ${a.statut === 'Agence actuelle' ? 'stamp-jaune' : ''}`}>{a.statut}</span>
                <h4 className="agence-nom">{a.nom}</h4>
                <p className="agence-adresse">{a.adresse}</p>
                <dl className="agence-horaires">
                  {a.horaires.map(([j, h]) => <div key={j}><dt>{j}</dt><dd>{h}</dd></div>)}
                </dl>
                <p className="caption-gris">{a.note} <a href={a.source} target="_blank" rel="noopener noreferrer" className="lien-texte">Site du lieu</a></p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
