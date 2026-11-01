import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

// La veille de la page (2026-11-01, après trois alertes Supabase « Disk IO Budget » : 4/10, 22/10,
// 29/10). La base gratuite a un petit budget disque par jour. Tant qu'un onglet garde un abonnement
// Realtime ouvert, Supabase lit le journal des écritures de la base en boucle, jour et nuit : relevé
// le 01/11, 2,8 millions de lectures depuis le 06/10, plus que tout le reste réuni. Un onglet
// d'admin oublié ouvert suffisait à le tenir allumé.
//
// La page passe donc en veille quand l'onglet est caché depuis une minute, ou que personne ne l'a
// touchée depuis dix minutes (souris, clavier, doigt, molette). En veille, les abonnements se
// ferment ; au réveil, ils se rouvrent et chaque composant se recharge une fois pour rattraper ce
// qu'il a manqué. Les écrans d'exposition, visibles mais sans personne, gardent une relève lente
// là où le composant le demande (le journal, toutes les 5 minutes).

const CACHE_MS = 60 * 1000
const INACTIF_MS = 10 * 60 * 1000
const ECOUTES = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll']

const cache = () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
let enVeille = cache()
let derniere = Date.now()
let minuteurCache = null
let minuteurInactif = null
const abonnes = new Set()

function changer(v) {
  if (v === enVeille) return
  enVeille = v
  abonnes.forEach(f => f(v))
}

function armerInactivite() {
  clearTimeout(minuteurInactif)
  minuteurInactif = setTimeout(() => changer(true), INACTIF_MS)
}

// Un signe de vie : pointermove arrive par dizaines à la seconde, on n'en garde qu'un toutes les 2 s
function signeDeVie() {
  const t = Date.now()
  if (t - derniere < 2000 && !enVeille) return
  derniere = t
  armerInactivite()
  if (!cache()) changer(false)
}

if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    clearTimeout(minuteurCache)
    if (cache()) minuteurCache = setTimeout(() => changer(true), CACHE_MS)
    else { derniere = 0; signeDeVie() }
  })
  ECOUTES.forEach(e => window.addEventListener(e, signeDeVie, { passive: true, capture: true }))
  armerInactivite()
}

export const estEnVeille = () => enVeille

/** fn(enVeille) à chaque changement. Renvoie de quoi se désabonner. */
export function surVeille(fn) {
  abonnes.add(fn)
  return () => abonnes.delete(fn)
}

/**
 * Un canal Realtime qui dort quand la page dort.
 *   nom          préfixe du canal (un suffixe au hasard évite les collisions entre composants)
 *   ecoutes      liste de filtres postgres_changes : [{ event, schema, table, filter? }]
 *   surChangement(payload) appelé à chaque changement reçu, et avec null au réveil
 *   actif        false : rien n'est ouvert (pas encore connecté…)
 *   releve       en ms : en veille mais page visible, surChangement(null) à ce rythme (0 : jamais)
 */
export function useCanal(nom, ecoutes, surChangement, { actif = true, releve = 0 } = {}) {
  const rappel = useRef(surChangement)
  useEffect(() => { rappel.current = surChangement })
  const cle = JSON.stringify(ecoutes)

  useEffect(() => {
    if (!actif) return
    const liste = JSON.parse(cle)
    let canal = null
    let minuteur = null
    const ouvrir = () => {
      if (canal) return
      canal = supabase.channel(`${nom}-${Math.random().toString(36).slice(2)}`)
      liste.forEach(e => canal.on('postgres_changes', e, p => rappel.current(p)))
      canal.subscribe()
    }
    const fermer = () => {
      if (!canal) return
      supabase.removeChannel(canal)
      canal = null
    }
    const appliquer = (veille, reveil) => {
      clearInterval(minuteur)
      minuteur = null
      if (veille) {
        fermer()
        if (releve) minuteur = setInterval(() => { if (!cache()) rappel.current(null) }, releve)
      } else {
        ouvrir()
        if (reveil) rappel.current(null)
      }
    }
    appliquer(enVeille, false)
    const desabonner = surVeille(v => appliquer(v, !v))
    return () => { desabonner(); clearInterval(minuteur); fermer() }
  }, [nom, cle, actif, releve])
}
