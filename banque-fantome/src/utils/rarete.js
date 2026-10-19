// Rareté façon hôtel des ventes — du plus commun au plus exceptionnel.
export const RARETES = ['commun', 'rare', 'precieux', 'exceptionnel']

// Libellés affichés (la base garde les valeurs sans accent)
export const LIBELLE_RARETE = { commun: 'commun', rare: 'rare', precieux: 'précieux', exceptionnel: 'exceptionnel' }
export const libelleRarete = r => LIBELLE_RARETE[r] || r || 'commun'

const RANG = Object.fromEntries(RARETES.map((r, i) => [r, i]))

export function rangRarete(rarete) {
  return RANG[rarete] ?? 0
}
