// Supprime les PDF en double de public/docs/.
// Chaque recherche régionale y existe en trois exemplaires : le nom court
// (référencé par src/data/documents.js), le nom accentué d'origine, et une
// version au nom encodé en mojibake. Seuls les 13 noms courts servent.
//
//   node outils/nettoyer-pdf.mjs          → liste ce qui serait supprimé
//   node outils/nettoyer-pdf.mjs --faire  → supprime

import fs from "fs";
import path from "path";

const DOSSIER = "public/docs";
const GARDER = [
  "occitanie.pdf", "corse.pdf", "paca.pdf", "auvergne-rhone-alpes.pdf",
  "bourgogne-franche-comte.pdf", "grand-est.pdf", "hauts-de-france.pdf",
  "ile-de-france-banlieue.pdf", "normandie.pdf", "bretagne.pdf",
  "pays-de-la-loire.pdf", "centre-val-de-loire.pdf", "nouvelle-aquitaine.pdf",
];

if (!fs.existsSync(DOSSIER)) {
  console.log(`${DOSSIER} est introuvable — rien à faire.`);
  process.exit(0);
}

const faire = process.argv.includes("--faire");
const pdfs = fs.readdirSync(DOSSIER).filter((f) => f.toLowerCase().endsWith(".pdf"));
const manquants = GARDER.filter((f) => !pdfs.includes(f));
if (manquants.length) {
  console.error("Des PDF référencés manquent, on ne touche à rien :", manquants.join(", "));
  process.exit(1);
}

const aSupprimer = pdfs.filter((f) => !GARDER.includes(f));
if (!aSupprimer.length) {
  console.log("Aucun doublon : les 13 PDF référencés sont là, et rien d'autre.");
  process.exit(0);
}

let octets = 0;
for (const f of aSupprimer) octets += fs.statSync(path.join(DOSSIER, f)).size;
console.log(`${aSupprimer.length} PDF en double (${(octets / 1048576).toFixed(1)} Mo) :`);
for (const f of aSupprimer) console.log("  " + f);

if (!faire) {
  console.log("\nRien n'a été supprimé. Relance avec --faire pour supprimer.");
  process.exit(0);
}
for (const f of aSupprimer) fs.unlinkSync(path.join(DOSSIER, f));
console.log(`\n${aSupprimer.length} fichiers supprimés, ${(octets / 1048576).toFixed(1)} Mo récupérés.`);
