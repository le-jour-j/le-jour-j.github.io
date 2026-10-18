// Les mots que la machine à bifton refuse d'écrire (MOTS_REFUSES de machine_a_bifton.py) :
// rien qui renvoie à la BCE ou à une banque centrale. La banque fantôme est le seul émetteur.
const MOTS_REFUSES = [
  /\bbce\b/, /\becb\b/, /\bezb\b/, /\bekt\b/, /\bbke\b/,
  /banque centrale/, /central bank/, /zentralbank/, /banca centrale/, /banco central/,
  /eurosyst/, /banque de france/, /bundesbank/, /banca d.italia/, /banco de espa/,
  /\beuropa\b/, /draghi/, /lagarde/, /trichet/, /duisenberg/,
]

// Minuscules, sans accents, comme verifier_texte()
const aplatir = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function texteRefuse(texte) {
  if (!texte) return false
  const plat = aplatir(texte)
  return MOTS_REFUSES.some(m => m.test(plat))
}

// Le message à afficher, ou null si le texte passe
export function verifierTexte(texte) {
  return texteRefuse(texte)
    ? `« ${texte} » refusé : la banque n'écrit rien qui renvoie à une banque centrale. Elle est le seul émetteur.`
    : null
}
