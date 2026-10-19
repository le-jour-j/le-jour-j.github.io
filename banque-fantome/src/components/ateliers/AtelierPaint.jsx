import AtelierBillet from '../AtelierBillet'
import { Encart, exporterToile } from './commun'

// L'atelier Paint libre (2026-10-19) : les outils du Paint billet sur une toile nue.
// Pas de coupure, pas d'habillage, pas de numéro : un format, un fond uni, le dessin.
// Le dessin reste une liste de traits en mm (origine en bas à gauche, y vers le haut),
// comme pour le billet ; ici ce sont des mm virtuels, rendus à 8 px/mm.
//
//   <AtelierPaint onValider={async ({ blob, type, largeur, hauteur, source }) => …}
//                 enCours={bool} libelleValider="→ Déposer dans ma collection" />
//
//   source = { version: 1, format: { l, h }, fond, dessin: [...traits] }

export const FORMATS_TOILE = [
  { id: 'carre',    nom: 'carré',    l: 200, h: 200 },
  { id: 'portrait', nom: 'portrait', l: 210, h: 297 },
  { id: 'paysage',  nom: 'paysage',  l: 297, h: 210 },
  { id: 'banniere', nom: 'bannière', l: 300, h: 100 },
]

const SUPPORT = { formats: FORMATS_TOILE, cleBrouillon: 'bf-atelier-paint-brouillon', fond: '#ffffff' }

export default function AtelierPaint({ onValider, enCours = false, libelleValider = '→ Déposer dans ma collection' }) {
  // L'atelier garde le dessin et le brouillon si cette fonction lève une erreur
  async function deposer({ toile, format, fond, dessin }) {
    if (!onValider) return
    const image = await exporterToile(toile)
    const source = { version: 1, format: { l: format.l, h: format.h }, fond, dessin }
    await onValider({ ...image, source })
  }

  return (
    <div className="atelier-paint">
      <Encart titre="Le geste avant l'idée">
        <p>
          En 1924, dans le <em>Manifeste du surréalisme</em>, André Breton définit le surréalisme
          comme un « automatisme psychique pur », une façon d'écrire ou de dessiner « en l'absence
          de tout contrôle exercé par la raison ». André Masson en tire des dessins automatiques,
          tracés vite, sans plan.
        </p>
        <p>
          En 1985, Andy Warhol colore en public, à la souris, un portrait de Debbie Harry sur un
          ordinateur Amiga. L'outil change, le geste reste. Essayez : un trait sans lever le doigt,
          puis regardez ce qu'il est devenu.
        </p>
      </Encart>
      <AtelierBillet support={SUPPORT} onValider={onValider ? deposer : undefined} enCours={enCours} libelleValider={libelleValider} />
    </div>
  )
}
