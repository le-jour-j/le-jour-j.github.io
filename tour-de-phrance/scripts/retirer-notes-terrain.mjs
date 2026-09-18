// Retire les notes de terrain du fichier publié src/data/locations.js.
// Elles nomment des librairies et certaines sont peu flatteuses : elles restent
// dans contenu/prive/, hors du site.
import fs from "fs";
import { RAW_LOCATIONS } from "../src/data/locations.js";

const sansNotes = RAW_LOCATIONS.map(({ field_note, ...reste }) => reste);

const entete = `// Base des lieux — Tour de Phrance
// Refonte du 12/09/2026 : chaque lieu a été recherché sur le web (2 à 4 requêtes),
// seules les informations vues sur une page sont notées, avec la source.
// Les ids ne changent JAMAIS : ils portent l'historique des passages et des
// commentaires de la tournée n°1. Un lieu hors sujet est marqué retired,
// jamais supprimé.
//
// status : active (aucune fermeture trouvée) | closed | doubtful | unverified
// fit    : oui (diffuse fanzines / micro-édition / livres d'artiste)
//          possible (librairie indépendante ou lieu d'art avec point de vente)
//          non (pas de point de vente de livres, hors sujet, chaîne)
// origine: v1 (base d'origine) | ajout-2026 (ajouté lors de la refonte)
//
// Les notes de terrain de la tournée n°1 ne figurent PAS ici : elles nomment des
// librairies et certaines sont peu flatteuses. Elles ont servi à classer les
// lieux (fit, status) et sont conservées hors du site, dans contenu/prive/.

export const RAW_LOCATIONS = `;

fs.writeFileSync("src/data/locations.js", entete + JSON.stringify(sansNotes, null, 2) + ";\n");
console.log("lieux :", sansNotes.length, "| notes restantes :", sansNotes.filter((l) => l.field_note).length);
