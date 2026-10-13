// Edge Function : où est le banquier ? (2026-10-13)
//
// Lit l'agenda Google « CLEA Jeanson 2026 » par son adresse iCal secrète (coffre de la base,
// « presences_ical »), garde seulement les créneaux qui disent dans quelle agence Jiiji se
// trouve, et les recopie dans la table `presences` que le site lit :
//   titre contenant « quadri »          → 'quadrilatere'  (« quadri », « prépa quadri »…)
//   titre contenant « mediatheque bvs » → 'mediatheque'
// Les titres, descriptions et le reste de l'agenda ne sortent jamais d'ici.
//
// Appelée toutes les 15 minutes par pg_cron (supabase_presences.sql) avec l'en-tête
// x-bf-secret, le même code que la lettre.
//
// Déploiement : supabase functions deploy presences --no-verify-jwt

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const FUSEAU = 'Europe/Paris'
const JOUR = 86400000
const FENETRE_AVANT = 2 * JOUR    // on garde les créneaux d'hier
const FENETRE_APRES = 90 * JOUR   // et trois mois à venir

function agenceDe(titre: string): 'quadrilatere' | 'mediatheque' | null {
  const t = titre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (/annul/.test(t)) return null
  if (/mediatheque\s*(bvs|beauvais)/.test(t)) return 'mediatheque'
  if (/quadri/.test(t)) return 'quadrilatere'
  return null
}

// Décalage de Paris (en ms) à un instant donné
function decalage(utc: number) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: FUSEAU, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utc)).map(x => [x.type, x.value]))
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utc
}
function heureDeParis(a: number, m: number, j: number, h: number, mi: number, s: number) {
  const naif = Date.UTC(a, m - 1, j, h, mi, s)
  let t = naif - decalage(naif)
  t = naif - decalage(t)
  return t
}

// « 20261014T093000 », « 20261014T073000Z » ou « 20261014 » (journée entière)
function lireDate(valeur: string, params: string): { t: number, journee: boolean } | null {
  const m = valeur.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/)
  if (!m) return null
  const [, a, mo, j, h, mi, s, z] = m
  if (!h) return { t: heureDeParis(+a, +mo, +j, 0, 0, 0), journee: true }
  if (z) return { t: Date.UTC(+a, +mo - 1, +j, +h, +mi, +s), journee: false }
  // TZID absent ou autre fuseau : l'agenda de Jiiji est à l'heure de Paris
  void params
  return { t: heureDeParis(+a, +mo, +j, +h, +mi, +s), journee: false }
}

type Evt = { uid: string, titre: string, debut: number, fin: number, journee: boolean,
  rrule?: string, exdates: Set<number>, recurrenceId?: number, annule: boolean }

function lireIcal(texte: string): Evt[] {
  const lignes = texte.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const evts: Evt[] = []
  let e: Partial<Evt> & { exdates?: Set<number> } | null = null
  for (const ligne of lignes) {
    if (ligne === 'BEGIN:VEVENT') { e = { exdates: new Set(), annule: false }; continue }
    if (ligne === 'END:VEVENT') {
      if (e && e.uid && e.debut !== undefined) {
        if (e.fin === undefined) e.fin = e.debut + (e.journee ? JOUR : 3600000)
        evts.push(e as Evt)
      }
      e = null; continue
    }
    if (!e) continue
    const i = ligne.indexOf(':')
    if (i < 0) continue
    const [nom, ...p] = ligne.slice(0, i).split(';')
    const params = p.join(';')
    const valeur = ligne.slice(i + 1)
    if (nom === 'UID') e.uid = valeur
    else if (nom === 'SUMMARY') e.titre = valeur.replace(/\\([,;\\])/g, '$1').replace(/\\n/gi, ' ')
    else if (nom === 'STATUS') e.annule = valeur.toUpperCase() === 'CANCELLED'
    else if (nom === 'RRULE') e.rrule = valeur
    else if (nom === 'DTSTART') { const d = lireDate(valeur, params); if (d) { e.debut = d.t; e.journee = d.journee } }
    else if (nom === 'DTEND') { const d = lireDate(valeur, params); if (d) e.fin = d.t }
    else if (nom === 'RECURRENCE-ID') { const d = lireDate(valeur, params); if (d) e.recurrenceId = d.t }
    else if (nom === 'EXDATE') for (const v of valeur.split(',')) { const d = lireDate(v, params); if (d) e.exdates!.add(d.t) }
  }
  return evts
}

// Les répétitions simples (quotidiennes ou hebdomadaires) : c'est ce que Google produit
// pour « toutes les semaines » ; le reste est ignoré plutôt que mal compris.
const JOURS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
function occurrences(e: Evt, de: number, a: number): number[] {
  if (!e.rrule) return [e.debut]
  const r = Object.fromEntries(e.rrule.split(';').map(x => x.split('=')))
  const freq = r.FREQ, intervalle = +(r.INTERVAL || 1)
  if (freq !== 'DAILY' && freq !== 'WEEKLY') return [e.debut]
  const fin = r.UNTIL ? (lireDate(r.UNTIL, '')?.t ?? a) : a
  const max = r.COUNT ? +r.COUNT : Infinity
  const jours = freq === 'WEEKLY' && r.BYDAY ? r.BYDAY.split(',').map((d: string) => JOURS.indexOf(d.slice(-2))) : null
  const res: number[] = []
  let n = 0
  // on avance jour par jour à l'heure de Paris pour rester juste aux changements d'heure
  const d0 = new Date(e.debut + decalage(e.debut))
  for (let k = 0; k < 800 && n < max; k++) {
    const jourN = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate() + k))
    const t = heureDeParis(jourN.getUTCFullYear(), jourN.getUTCMonth() + 1, jourN.getUTCDate(),
      d0.getUTCHours(), d0.getUTCMinutes(), d0.getUTCSeconds())
    if (t > fin || t > a) break
    let garde: boolean
    if (freq === 'DAILY') garde = k % intervalle === 0
    else {
      const semaine = Math.floor(k / 7)
      const jourSemaine = jourN.getUTCDay()
      garde = semaine % intervalle === 0 && (jours ? jours.includes(jourSemaine) : k % 7 === 0)
    }
    if (!garde) continue
    n++
    if (t >= de - (e.fin - e.debut)) res.push(t)
  }
  return res
}

Deno.serve(async (req) => {
  try {
    const secret = req.headers.get('x-bf-secret')
    const { data: ok } = secret ? await admin.rpc('lettre_verifier_secret', { p_secret: secret }) : { data: false }
    if (!ok) return Response.json({ error: 'Non autorisé.' }, { status: 401 })

    const { data: url } = await admin.rpc('presences_ical_url')
    if (!url) return Response.json({ ok: true, saute: "Pas d'adresse iCal dans le coffre (presences_ical)." })

    const rep = await fetch(String(url).trim(), { signal: AbortSignal.timeout(20000) })
    if (!rep.ok) throw new Error(`Agenda illisible : ${rep.status}`)
    const evts = lireIcal(await rep.text())

    const maintenant = Date.now()
    const de = maintenant - FENETRE_AVANT, a = maintenant + FENETRE_APRES
    // occurrences remplacées une à une dans Google (RECURRENCE-ID) : on saute l'originale
    const remplacees = new Set(evts.filter(e => e.recurrenceId !== undefined).map(e => `${e.uid}|${e.recurrenceId}`))

    const lignes = new Map<string, { uid: string, agence: string, debut: string, fin: string }>()
    for (const e of evts) {
      if (e.annule || !e.titre) continue
      const agence = agenceDe(e.titre)
      if (!agence) continue
      const duree = e.fin - e.debut
      for (const t of occurrences(e, de, a)) {
        if (e.exdates.has(t)) continue
        if (e.recurrenceId === undefined && e.rrule && remplacees.has(`${e.uid}|${t}`)) continue
        if (t + duree < de || t > a) continue
        const uid = `${e.uid}|${t}`
        lignes.set(uid, { uid, agence, debut: new Date(t).toISOString(), fin: new Date(t + duree).toISOString() })
      }
    }

    // On remplace toute la fenêtre : un créneau effacé dans l'agenda disparaît du site
    const { error: e1 } = await admin.from('presences').delete().gte('fin', new Date(de).toISOString())
    if (e1) throw e1
    if (lignes.size) {
      const { error: e2 } = await admin.from('presences').upsert([...lignes.values()].map(l => ({ ...l, maj_at: new Date().toISOString() })))
      if (e2) throw e2
    }
    return Response.json({ ok: true, evenements: evts.length, presences: lignes.size })
  } catch (e) {
    console.error('presences', e)
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
})
