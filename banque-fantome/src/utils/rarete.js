// Rareté façon hôtel des ventes — du plus commun au plus exceptionnel.
export const RARETES = ['commun', 'rare', 'precieux', 'exceptionnel']

const RANG = Object.fromEntries(RARETES.map((r, i) => [r, i]))

export function rangRarete(rarete) {
  return RANG[rarete] ?? 0
}
