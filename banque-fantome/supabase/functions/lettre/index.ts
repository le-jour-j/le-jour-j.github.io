// Edge Function : la lettre de la banque (newsletter hebdomadaire).
//
// Fabrique la lettre à partir des actus publiées et pas encore racontées
// (actus.en_lettre_at vide), plus le mot du banquier s'il y en a un, puis
// l'envoie une par une depuis l'adresse Gmail de la banque : chaque abonné
// reçoit son propre exemplaire, avec son propre lien de désinscription, et
// personne ne voit l'adresse des autres.
//
// Qui peut l'appeler :
//   • la base, chaque lundi (pg_cron, voir supabase_lettre.sql partie 5),
//     avec l'en-tête x-bf-secret : action « hebdo » ;
//   • le banquier depuis l'admin : « apercu », « test », « envoyer » ;
//   • la base avec ce même en-tête : « test » seulement (un exemplaire à une adresse) ;
//   • n'importe qui avec ?desinscription=<jeton> (le bouton « se désinscrire »
//     de Gmail, qui appelle l'adresse sans être connecté).
//
// Secrets à poser (Supabase → Edge Functions → Secrets) :
//   GMAIL_USER          le compte Gmail qui se connecte pour envoyer
//   GMAIL_APP_PASSWORD  un « mot de passe d'application » de ce compte (16 lettres)
//   GMAIL_FROM          facultatif : l'adresse affichée comme expéditeur, si ce n'est
//                       pas GMAIL_USER. Elle doit être déclarée dans le Gmail de
//                       GMAIL_USER (Paramètres → Comptes → « Envoyer des e-mails en
//                       tant que »), sinon Gmail remet GMAIL_USER à sa place.
//   SITE_URL            facultatif, https://jeansonpechin.com/banque-fantome par défaut
//   GEMINI_API_KEY      la clé Google AI Studio (gratuite) qui écrit l'ouverture de la lettre
//   ANTHROPIC_API_KEY   à la place de Gemini, si un jour on préfère Claude (payant)
// Sans ces secrets, les trois identifiants Gmail sont lus dans le coffre de la base
// (vault : gmail_user, gmail_app_password, gmail_from), voir supabase_lettre.sql partie 6,
// et les clés d'IA aussi (vault : gemini_api_key, anthropic_api_key), partie 7.
// Le code de l'appel du lundi n'est pas un secret de la fonction : il est dans le
// coffre de la base (vault, « bf_lettre_secret »), vérifié par lettre_verifier_secret.
//
// L'ouverture : une IA lit les actus de la semaine et écrit un court texte qui les
// raconte (ajouté le 2026-10-05, Jiiji : « pour l'écrire elle doit piocher dans les
// news »). Sans clé, ou si l'IA ne répond pas, la lettre part avec sa phrase fixe.
//
// Le ton (2026-11-15, Jiiji : « elle pourrait être quand même un peu plus bizarre dans
// son contenu », « le ton qu'il y a plus dans les affiches de la banque fantôme ») : la
// lettre est un relevé de banque qui déraille. Objet, en-tête, phrases fixes, pied et
// consigne de l'IA reprennent le mécanisme des affiches (une formule de banque, une chute
// courte). La version d'avant est à côté : index-2026-11-15-avant-ton-affiches.ts.
// Même jour, après un premier essai refusé (« C'est trop descriptif. Il faut pas décrire.
// Il y a des images. ») : l'ouverture ne raconte plus les actus, elle parle en grand de la
// valeur qui se crée et du pactole (seul chiffre autorisé, voir PACTOLE) ; sous une image,
// il ne reste que la date et le titre.
//
// Déploiement : supabase functions deploy lettre --no-verify-jwt
// (--no-verify-jwt car la base et le lien de désinscription n'ont pas de
// session : les droits sont vérifiés ici, action par action.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6.9.16'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SITE = (Deno.env.get('SITE_URL') || 'https://jeansonpechin.com/banque-fantome').replace(/\/+$/, '')
const FONCTION = `${SUPABASE_URL}/functions/v1/lettre`

// Au-delà, on montre seulement les titres (une lettre se lit en deux minutes)
const ACTUS_DETAILLEES = 8
// Gmail refuse au-delà d'environ 500 destinataires par jour
const PLAFOND_GMAIL = 450

const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Identifiants Gmail : les secrets de la fonction s'ils sont posés, sinon le coffre
// de la base (vault, lu par lettre_identifiants_gmail, réservée au service_role)
type Gmail = { user: string, pass: string, from: string }
let gmail: Gmail | null = null
async function identifiantsGmail(): Promise<Gmail> {
  if (gmail) return gmail
  let user = Deno.env.get('GMAIL_USER') || ''
  let pass = Deno.env.get('GMAIL_APP_PASSWORD') || ''
  let from = Deno.env.get('GMAIL_FROM') || ''
  if (!user || !pass) {
    const { data } = await admin.rpc('lettre_identifiants_gmail')
    user = user || data?.user || ''
    pass = pass || data?.pass || ''
    from = from || data?.from || ''
  }
  gmail = { user, pass: pass.replace(/\s+/g, ''), from: from || user }
  return gmail
}

// L'ouverture écrite par une IA à partir des actus de la semaine (et du mot du banquier)
// Le plus rapide d'abord : 2.5 Flash sans « réflexion » répond en quelques secondes ;
// gemini-flash-latest réfléchit avant d'écrire et pouvait prendre plus d'une minute
// (2026-10-12 : l'aperçu de l'admin mettait deux minutes).
// 2026-11-15 : un peu de réflexion, mais bornée (1024), pour que la forme des affiches
// soit tenue ; si ce réglage ne passe pas, le même modèle sans réflexion, comme avant.
const MODELES_GEMINI: [string, Record<string, unknown>][] = [
  ['gemini-2.5-flash', { thinkingConfig: { thinkingBudget: 1024 } }],
  ['gemini-2.5-flash', { thinkingConfig: { thinkingBudget: 0 } }],
  ['gemini-flash-lite-latest', {}],
  ['gemini-flash-latest', {}],
]
// Temps total laissé à l'IA. Au-delà, la lettre part avec sa phrase fixe : la fonction
// est coupée par Supabase à 150 s, et un envoi coupé avant Gmail ne partirait pas.
const BUDGET_IA_MS = 35000
const MODELE_IA = 'claude-sonnet-5-5'
// Le pactole : le dernier comptage des billets dessinés en atelier (actu du 2026-10-13,
// « 837 dessins, 8 381 billets prêts à imprimer »). C'est ce que Jiiji appelle « le pactole »,
// « les 500 000 balles ». À mettre à jour ici quand un nouveau comptage est publié : c'est
// le seul chiffre que l'ouverture a le droit de citer, avec ceux du relevé lui-même.
const PACTOLE = { date: '2026-10-13', dessins: 837, valeurDessins: 45810, billets: 8381, euros: 459290 }
const nombre = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// La consigne (refaite le 2026-11-15 après le retour de Jiiji sur le premier essai : « C'est
// trop descriptif. Il faut pas décrire. Il y a des images. Parler plus large de tout ce qui
// se passe. La valeur qui se crée. Le pactole. Les 500 000 balles, qu'est-ce que ça fait de
// vouloir faire plus de dessins, plus de techniques, nouvelles valeurs. »)
const CONSIGNE_IA = `Tu écris l'ouverture du relevé que la Banque Fantôme envoie à sa clientèle : le mot de la direction, placé en tête, avant les images.

Ce qu'est la Banque Fantôme : une œuvre de l'artiste Jeanson Péchin, dit Jiiji. Une fausse banque où chacun dessine ses propres billets. Sa règle : la valeur ne préexiste pas, elle se dessine, se met en jeu et circule. Elle est en résidence dans le Beauvaisis (CLEA), dans des écoles, des médiathèques, des centres sociaux, une salle d'exposition, et sur son site (un atelier, une bourse aux billets, un market).
Qui lit : ces structures partenaires (enseignants, bibliothécaires, animateurs, agents de la mairie) et les membres du site. Ce sont eux qui ont fabriqué cette valeur avec la banque. Ils doivent sourire, être un peu déroutés, jamais se sentir moqués.

Ce que Jiiji demande, avec ses mots : « Il faut pas décrire. Il y a des images. » « Parler plus large de tout ce qui se passe. La valeur qui se crée. Le pactole. Les 500 000 balles. Qu'est-ce que ça fait de vouloir faire plus de dessins, plus de techniques, nouvelles valeurs. »

Donc l'ouverture ne raconte pas les actus et ne décrit rien de ce qu'on voit sur les photos. Elle prend de la hauteur et parle de ce qui arrive à la banque en grand :
- la valeur qui se crée : de l'argent que personne n'a gagné, qui a été dessiné ;
- le pactole : ce que la banque a amassé (le vrai chiffre est dans le message), et ce qu'on fait d'une fortune qu'on a fabriquée soi-même ;
- l'appétit : ce que ça fait de vouloir toujours plus de dessins, plus de techniques, de nouvelles valeurs. Où ça s'arrête. Si ça s'arrête.

La voix. C'est la banque qui parle : « nous », « nos équipes », « la direction », « nos services ». Elle s'adresse à « vous », « notre clientèle ». Elle parle de sa croissance comme une vraie banque parle de la sienne (résultats, encours, émission, capital, rendement, diversification, taux, coffre, solde), mais elle déraille :
- elle prend les mots de la banque au pied de la lettre ;
- elle avoue calmement qu'elle est vide, absente, un peu hantée, dépassée par ses clients ;
- elle se pose de vraies questions sur la valeur, sans avoir la réponse.

Le mécanisme est celui de ses affiches : une formule de banque, puis une chute très courte qui la retourne. Exemples tirés des affiches, pour comprendre le mécanisme (n'en recopie aucun) :
« Nos équipes sont là pour vous. Enfin, sont là. »
« Nous sommes passés. Vous n'étiez pas là. Nous non plus. »
« Votre épargne travaille. La nuit, surtout. »
« Fuite des capitaux : nous avons mis un seau. »
« Le coffre est vide. C'est plus sûr. »
« Nous valorisons votre travail. Dans les deux sens. »
« Votre solde est une opinion. »

Interdit de décrire. Aucune scène, aucun objet posé quelque part, aucun geste, aucun dessin en particulier, aucun lieu, aucune couleur : les images de la lettre le montrent déjà. Les titres des actus servent seulement à sentir ce qui bouge dans la période. Tu peux en tirer deux ou trois mots de technique ou de matière (une façon de peindre, d'imprimer, de découper), cités en passant comme des lignes de bilan, jamais racontés. Le test : si une phrase pouvait servir de légende à une photo, supprime-la.

Forme : trois courts paragraphes séparés par une ligne vide, 70 à 120 mots en tout. Phrases courtes, sèches, au présent. Chaque paragraphe finit par une chute de deux à neuf mots, qui parle de la banque. Une question au moins, posée sérieusement, sur ce que ça fait de vouloir plus. Le dernier paragraphe renvoie au guichet en ligne, sans écrire d'adresse. Aucun point d'exclamation.

Un exemple de la manière, pour le ton et la hauteur (n'en reprends ni les phrases ni l'ordre, écris le tien) :

Le pactole approche les 500 000. Personne ne l'a gagné : il a été dessiné, coupure après coupure. C'est notre seule méthode.

La direction constate une envie de plus. Plus de dessins, plus de techniques, des valeurs que nous n'avions pas prévues. Le feutre est entré au capital, le crayon aussi. Nous ne savons plus très bien ce que nous émettons. Nous émettons.

Que fait-on d'une fortune qu'on a fabriquée soi-même ? Nos services étudient la question. Le guichet en ligne reste ouvert pendant les réflexions.

Règles strictes :
- chiffres : seulement ceux du message (le pactole, le relevé). Le pactole peut être donné exact ou arrondi (« près de 500 000 »). Aucun autre chiffre, aucun autre montant, aucune date, aucun lieu, aucun nom de personne ou de structure. Les nombres s'écrivent en chiffres ;
- n'annonce rien (pas de rendez-vous, d'horaire, d'événement à venir) ;
- ne te moque jamais des personnes (enfants, résidents, enseignants, bibliothécaires, visiteurs) ni de leurs dessins : la seule chose ridicule ici, c'est la banque ;
- ne cite aucune vraie banque, aucune banque centrale, aucune institution financière réelle : écris « une vraie banque » ;
- vouvoiement, jamais de tutoiement ;
- pas de titre, pas de liste, pas de formule d'appel (« Bonjour », « Chère clientèle »), pas de signature ;
- pas d'emoji, pas de markdown, pas de guillemets autour du texte ;
- n'utilise jamais le tiret cadratin ni le demi-cadratin ;
- réponds uniquement par le texte de l'ouverture.`

// Filet : une phrase de l'ouverture qui nomme une vraie banque ou une banque centrale
// est retirée (la consigne l'interdit déjà).
const VRAIES_BANQUES = /caisse d['’]\s*[ée]pargne|cr[ée]dit (agricole|mutuel|lyonnais|coop[ée]ratif)|\bbnp\b|soci[ée]t[ée] g[ée]n[ée]rale|banque postale|banque populaire|\blcl\b|\bcic\b|\bhsbc\b|\bbce\b|banque centrale|banque de france|boursorama/i
function sansPhrases(t: string, interdite: (phrase: string) => boolean) {
  return t.split(/\n\s*\n/)
    .map(p => p.split(/(?<=[.!?…])\s+/).filter(ph => !interdite(ph)).join(' ').trim())
    .filter(Boolean).join('\n\n')
}

// Deux moteurs possibles : Gemini (gratuit, choisi par Jiiji le 2026-10-05 : « j'ai pas
// envie de mettre d'argent ») et Claude (payant, si une clé Anthropic est un jour posée).
async function cle(env: string, rpc: string): Promise<string> {
  const c = Deno.env.get(env) || ''
  if (c) return c.trim()
  const { data } = await admin.rpc(rpc)
  return typeof data === 'string' ? data.trim() : ''
}

// La version gratuite de Gemini est souvent « surchargée » (503) : on réessaie, puis on
// passe au modèle suivant de la liste.
async function demanderGemini(cleApi: string, consigne: string, demande: string): Promise<string> {
  let derniere = ''
  const limite = Date.now() + BUDGET_IA_MS
  for (const [modele, reglage] of MODELES_GEMINI) {
    for (let essai = 0; essai < 2; essai++) {
      if (essai) await new Promise(r => setTimeout(r, 2000))
      const reste = limite - Date.now()
      if (reste < 3000) throw new Error(`Gemini trop lent (${BUDGET_IA_MS / 1000} s dépassées) ; dernier essai : ${derniere}`)
      const rep = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': cleApi, 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: consigne }] },
          contents: [{ role: 'user', parts: [{ text: demande }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.9, ...reglage },
        }),
        signal: AbortSignal.timeout(Math.min(25000, reste)),
      }).catch(e => { derniere = `${modele} : ${e}`; return null })
      if (!rep) continue
      if (rep.ok) {
        const data = await rep.json()
        const t = (data?.candidates?.[0]?.content?.parts || [])
          .filter((p: { text?: string, thought?: boolean }) => p.text && !p.thought)
          .map((p: { text: string }) => p.text).join('').trim()
        if (t) return t
        derniere = `${modele} : réponse vide`
        break
      }
      derniere = `${modele} ${rep.status} : ${(await rep.text()).slice(0, 200)}`
      if (rep.status === 401 || rep.status === 403) throw new Error(`Gemini ${derniere}`) // la clé est refusée : inutile d'insister
      if (![429, 500, 503].includes(rep.status)) break // modèle inconnu ou autre refus : modèle suivant
    }
  }
  throw new Error(`Gemini ${derniere}`)
}

async function demanderClaude(cleApi: string, consigne: string, demande: string): Promise<string> {
  const rep = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': cleApi, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELE_IA, max_tokens: 700, system: consigne, messages: [{ role: 'user', content: demande }] }),
    signal: AbortSignal.timeout(45000),
  })
  if (!rep.ok) throw new Error(`Claude ${rep.status} : ${(await rep.text()).slice(0, 300)}`)
  const data = await rep.json()
  return (data?.content || []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim()
}

async function ouvertureIA(actus: Actu[], mot: string): Promise<string | null> {
  if (!actus.length) return null
  // L'IA ne reçoit que les titres (et le texte des actus sans image) : avec les textes,
  // qui décrivent les photos, elle décrit à son tour.
  const titres = actus.map(a => `- ${a.titre}${a.images?.length ? '' : ` : ${(a.texte || '').trim().slice(0, 400)}`}`).join('\n')
  const demande = `Repères, les seuls chiffres autorisés :
- le pactole, au dernier comptage (${dateFr(PACTOLE.date)}) : ${nombre(PACTOLE.dessins)} dessins originaux faits en atelier, par des enfants et des adultes, valeur ${nombre(PACTOLE.valeurDessins)} € ; chacun tiré à dix exemplaires, soit ${nombre(PACTOLE.billets)} billets prêts à imprimer, pour ${nombre(PACTOLE.euros)} €. Jiiji dit « le pactole », « les 500 000 balles ». Les ateliers ont continué depuis ; il n'a pas été recompté ;
- ce relevé : ${actus.length} opération${actus.length > 1 ? 's' : ''}, ${periode(actus).toLowerCase()}.

Titres des actus de la période (pour sentir ce qui bouge, pas pour les raconter) :
${titres}` +
    (mot ? `\n\nLe banquier ajoute lui-même un mot, affiché juste après ton texte (ne le répète pas) :\n${mot}` : '')
  try {
    const gemini = await cle('GEMINI_API_KEY', 'lettre_cle_gemini')
    const claude = gemini ? '' : await cle('ANTHROPIC_API_KEY', 'lettre_cle_ia')
    if (!gemini && !claude) return null
    const t = gemini ? await demanderGemini(gemini, CONSIGNE_IA, demande) : await demanderClaude(claude, CONSIGNE_IA, demande)
    if (!t) return null
    // filets : les tirets longs deviennent des virgules, le markdown éventuel s'efface,
    // et une phrase qui nomme une vraie banque est retirée
    const propre = sansPhrases(t.replace(/\s*[—–]\s*/g, ', ').replace(/\*\*?|__/g, '').trim(), ph => VRAIES_BANQUES.test(ph))
    return propre || null
  } catch (e) {
    console.error('ouverture IA', e)
    return null
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
}

function texte(body: string, status = 200) {
  return new Response(body, { status, headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' } })
}

const esc = (s: string) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
function dateFr(iso: string) {
  const [a, m, j] = String(iso).slice(0, 10).split('-').map(Number)
  return a ? `${j === 1 ? '1er' : j} ${MOIS[m - 1]} ${a}` : ''
}

// « Période du 20 septembre au 13 novembre 2026 » : ce que couvre le relevé
function periode(actus: { date_actu: string }[]) {
  if (!actus.length) return ''
  const dates = actus.map(a => String(a.date_actu).slice(0, 10)).sort()
  const debut = dates[0], fin = dates[dates.length - 1]
  if (debut === fin) return `Journée du ${dateFr(fin)}`
  const memeAnnee = debut.slice(0, 4) === fin.slice(0, 4)
  return `Période du ${memeAnnee ? dateFr(debut).replace(/ \d{4}$/, '') : dateFr(debut)} au ${dateFr(fin)}`
}

function extrait(t: string | null, max = 280) {
  const s = (t || '').trim()
  if (s.length <= max) return s
  return s.slice(0, s.lastIndexOf(' ', max) > max * .6 ? s.lastIndexOf(' ', max) : max).trim() + '…'
}

// Même règle que src/lib/actus.js : « images/... » est livrée avec le site,
// le reste est dans le bucket public « actus ».
function urlImage(chemin?: string) {
  if (!chemin) return null
  if (chemin.startsWith('images/')) return `${SITE}/${chemin}`
  return `${SUPABASE_URL}/storage/v1/object/public/actus/${chemin.split('/').map(encodeURIComponent).join('/')}`
}

type Actu = { id: string, date_actu: string, titre: string, texte: string | null, images: string[] }
type Lettre = { vide: boolean, objet: string, actus: Actu[], mot: string, ouverture: string | null, html: string, txt: string }

const JETON_ICI = '%%JETON%%'

async function composer(): Promise<Lettre> {
  const [{ data: reglages }, { data: actusData, error }, { count: dejaParties }] = await Promise.all([
    admin.from('lettre_reglages').select('mot').eq('id', 1).maybeSingle(),
    admin.from('actus').select('id, date_actu, titre, texte, images')
      .eq('publie', true).is('en_lettre_at', null)
      .order('date_actu', { ascending: false }).order('created_at', { ascending: false }).limit(50),
    // les lettres vraiment parties (pas les tests) : elles donnent le numéro du relevé
    admin.from('lettres').select('id', { count: 'exact', head: true }).in('mode', ['auto', 'manuel']).gt('nb_destinataires', 0),
  ])
  if (error) throw error
  const actus = (actusData || []) as Actu[]
  const mot = (reglages?.mot || '').trim()
  const vide = actus.length === 0 && !mot
  // Le mot du banquier passe seul (demande de Jiiji, 2026-11-15 : « Oui, mon texte seul ») :
  // quand il a écrit un mot, c'est l'ouverture, tel quel, et l'IA n'écrit rien.
  const ouverture = vide ? null : (mot || await ouvertureIA(actus, ''))
  // Les phrases fixes, si l'IA ne répond pas
  const chapo = ouverture
    ? ouverture.split(/\n\s*\n/).map(p => `<p style="margin:0 0 12px">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')
    : (actus.length
      ? 'Notre rédacteur est en congé. Il a laissé son drap. Voici donc les opérations de la période, sans commentaire.'
      : 'Aucune opération constatée sur la période. Le banquier a tout de même un mot.')

  // La lettre est un relevé : chaque actu est une opération
  const releve = typeof dejaParties === 'number' ? `relevé n° ${dejaParties + 1}` : 'relevé'
  const objet = actus.length === 1 ? `Banque Fantôme · ${releve} : ${actus[0].titre}`
    : actus.length > 1 ? `Banque Fantôme · ${releve} : ${actus.length} opérations, aucune à votre débit`
    : `Banque Fantôme · ${releve} : aucune opération, un mot du banquier`
  const ligneReleve = [
    periode(actus),
    actus.length ? `${actus.length} opération${actus.length > 1 ? 's' : ''}` : 'aucune opération',
    `pactole au dernier comptage : ${nombre(PACTOLE.euros)} €`,
    'solde : une opinion',
  ].filter(Boolean).join(' · ')

  const detail = actus.slice(0, ACTUS_DETAILLEES)
  const reste = actus.slice(ACTUS_DETAILLEES)
  const lienActu = `${SITE}/actu/`

  const blocsActus = detail.map(a => {
    const img = urlImage(a.images?.[0])
    return `
    <tr><td style="padding:24px 32px 0">
      ${img ? `<a href="${lienActu}"><img src="${esc(img)}" alt="" width="536" style="display:block;width:auto;max-width:100%;max-height:340px;height:auto;margin:0 auto;border:2px solid #1A1A1A"></a>` : ''}
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#66604F;margin:14px 0 4px">Opération du ${esc(dateFr(a.date_actu))}</div>
      <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1.1;letter-spacing:.02em;color:#1A1A1A;margin-bottom:8px">${esc(a.titre)}</div>
      ${a.texte && !img ? `<div style="font-size:16px;line-height:1.6;color:#1A1A1A">${esc(extrait(a.texte)).replace(/\n/g, '<br>')}</div>` : ''}
      <div style="margin-top:10px"><a href="${lienActu}" style="color:#1A1A1A;font-weight:700;font-size:14px">Voir l'opération sur le site →</a></div>
    </td></tr>`
  }).join('')

  const blocReste = reste.length ? `
    <tr><td style="padding:24px 32px 0;font-size:15px;line-height:1.7;color:#1A1A1A">
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#66604F;margin-bottom:6px">Autres mouvements de la période</div>
      ${reste.map(a => `· <a href="${lienActu}" style="color:#1A1A1A">${esc(a.titre)}</a> <span style="color:#66604F">(${esc(dateFr(a.date_actu))})</span>`).join('<br>')}
    </td></tr>` : ''

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(objet)}</title></head>
<body style="margin:0;padding:0;background:#FFF9E8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFDF7;border:2px solid #1A1A1A;font-family:'DM Sans',Helvetica,Arial,sans-serif">
  <tr><td style="background:#F5E27A;border-bottom:2px solid #1A1A1A;padding:22px 32px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#1A1A1A">Avis à la clientèle · ${esc(releve)}</div>
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:44px;line-height:1;letter-spacing:.02em;color:#1A1A1A;margin-top:6px">BANQUE FANTÔME</div>
    <div style="font-family:'Space Mono','Courier New',Courier,monospace;font-size:12px;line-height:1.5;color:#1A1A1A;margin-top:10px">${esc(ligneReleve)}</div>
  </td></tr>
  <tr><td style="padding:24px 32px ${ouverture ? '4px' : '16px'};font-size:${ouverture ? '17px' : '16px'};line-height:1.6;color:#1A1A1A">
    ${chapo}
  </td></tr>
  ${blocsActus}
  ${blocReste}
  <tr><td style="padding:32px 32px 8px" align="center">
    <a href="${SITE}/" style="display:inline-block;background:#1A1A1A;color:#FFFDF7;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border:2px solid #1A1A1A">→ Passer au guichet</a>
  </td></tr>
  <tr><td style="padding:8px 32px 28px;font-size:14px;line-height:1.6;color:#4C463D" align="center">
    Ouvrir un compte, dessiner sa monnaie, enchérir au market :
    <a href="${SITE}/connexion/" style="color:#1A1A1A">jeansonpechin.com/banque-fantome</a><br>
    Le guichet en ligne ne ferme jamais : la clé a été déposée au coffre.
  </td></tr>
  <tr><td style="border-top:2px solid #1A1A1A;padding:16px 32px;font-size:12px;line-height:1.6;color:#66604F">
    ◈ Banque Fantôme, institution de circulation. La valeur ne préexiste pas : elle se dessine.<br>
    Aucun cours légal. Établissement agréé par lui-même. Les performances passées ne préjugent pas des performances fantômes.<br>
    Une œuvre de Jeanson Péchin, artiste en résidence CLEA dans le Beauvaisis.<br>
    Vous recevez ce relevé parce que votre structure travaille avec la banque, ou parce que vous vous y êtes inscrit·e.
    <a href="${SITE}/lettre/?desinscription=${JETON_ICI}" style="color:#66604F">Se désinscrire</a> (clôture immédiate, sans frais).
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  const txt = [
    `BANQUE FANTÔME · AVIS À LA CLIENTÈLE · ${releve.toUpperCase()}`,
    `${ligneReleve}\n`,
    ouverture ? `${ouverture}\n` : `${chapo}\n`,
    // comme dans la version illustrée : le texte d'une actu ne s'affiche que si elle n'a pas d'image
    detail.length ? detail.map(a => `Opération du ${dateFr(a.date_actu)} · ${a.titre}${a.images?.length || !a.texte ? '' : `\n${extrait(a.texte)}`}`).join('\n') + '\n' : '',
    reste.length ? `Autres mouvements de la période :\n${reste.map(a => `· ${a.titre} (${dateFr(a.date_actu)})`).join('\n')}\n` : '',
    `Voir les opérations sur le site : ${lienActu}`,
    `Passer au guichet : ${SITE}/`,
    'Le guichet en ligne ne ferme jamais : la clé a été déposée au coffre.\n',
    'Aucun cours légal. Établissement agréé par lui-même. Les performances passées ne préjugent pas des performances fantômes.',
    'Une œuvre de Jeanson Péchin, artiste en résidence CLEA dans le Beauvaisis.',
    `Se désinscrire (clôture immédiate, sans frais) : ${SITE}/lettre/?desinscription=${JETON_ICI}`,
  ].filter(l => l !== '').join('\n')

  return { vide, objet, actus, mot, ouverture, html, txt }
}

type Destinataire = { email: string, jeton: string }

async function expedier(lettre: Lettre, destinataires: Destinataire[]) {
  const { user, pass, from: EXPEDITEUR } = await identifiantsGmail()
  if (!user || !pass) throw new Error('Identifiants Gmail manquants (secrets de la fonction ou coffre de la base).')
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true, // le port 587 est fermé chez Supabase
    auth: { user, pass },
    pool: true, maxConnections: 1,
  })
  let envoyes = 0
  const erreurs: string[] = []
  try {
    for (const d of destinataires) {
      try {
        await transport.sendMail({
          from: `"Banque Fantôme" <${EXPEDITEUR}>`,
          replyTo: EXPEDITEUR,
          to: d.email,
          subject: lettre.objet,
          html: lettre.html.replaceAll(JETON_ICI, d.jeton),
          text: lettre.txt.replaceAll(JETON_ICI, d.jeton),
          headers: {
            // Lien seul, sans mailto : le bouton « Se désabonner » de Gmail envoyait sinon
            // un mail que rien ne traite (retiré le 2026-10-12, comme pour la lettre du site)
            'List-Unsubscribe': `<${FONCTION}?desinscription=${d.jeton}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        envoyes++
      } catch (e) {
        erreurs.push(`${d.email} : ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } finally {
    transport.close()
  }
  return { envoyes, erreurs }
}

async function abonnesActifs(): Promise<Destinataire[]> {
  const { data, error } = await admin.from('lettre_abonnes').select('email, jeton').eq('actif', true).order('created_at')
  if (error) throw error
  return (data || []) as Destinataire[]
}

// Envoi à toute la liste, puis on marque les actus racontées et on efface le mot
async function envoyerATous(mode: 'auto' | 'manuel') {
  const lettre = await composer()
  if (lettre.vide) return { ok: true, saute: 'Rien à raconter : aucune actu publiée depuis la dernière lettre, et pas de mot du banquier.' }
  const liste = await abonnesActifs()
  if (liste.length === 0) return { ok: true, saute: 'Aucun abonné actif.' }
  if (liste.length > PLAFOND_GMAIL) throw new Error(`${liste.length} abonnés : au-delà de ${PLAFOND_GMAIL}, Gmail bloque l'envoi. Il faut passer à un service d'envoi.`)

  const { envoyes, erreurs } = await expedier(lettre, liste)
  if (envoyes > 0) {
    if (lettre.actus.length) await admin.from('actus').update({ en_lettre_at: new Date().toISOString() }).in('id', lettre.actus.map(a => a.id))
    if (lettre.mot) await admin.from('lettre_reglages').update({ mot: null, updated_at: new Date().toISOString() }).eq('id', 1)
  }
  await admin.from('lettres').insert({
    mode, objet: lettre.objet, nb_actus: lettre.actus.length, nb_destinataires: envoyes,
    nb_echecs: erreurs.length, erreurs: erreurs.length ? erreurs.join('\n').slice(0, 4000) : null,
  })
  return { ok: envoyes > 0, envoyes, echecs: erreurs.length, erreurs: erreurs.slice(0, 5) }
}

async function estBanquier(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return false
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return false
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'banquier'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })

  try {
    // Désinscription en un clic (bouton de Gmail, ou lien ouvert directement)
    const jeton = new URL(req.url).searchParams.get('desinscription')
    if (jeton) {
      if (!/^[0-9a-f-]{36}$/i.test(jeton)) return texte('Lien de désinscription invalide.', 400)
      await admin.rpc('lettre_desinscrire', { p_jeton: jeton })
      return texte('Désinscription enregistrée. Vous ne recevrez plus la lettre de la Banque Fantôme. Clôture sans frais.')
    }

    const body = await req.json().catch(() => ({}))
    const action = body?.action

    // Le code du coffre (vault) : l'appel du lundi, et un envoi de test lancé depuis la base
    const secret = req.headers.get('x-bf-secret')
    const { data: parSecret } = secret ? await admin.rpc('lettre_verifier_secret', { p_secret: secret }) : { data: false }

    if (action === 'hebdo') {
      if (!parSecret) return json({ error: 'Non autorisé.' }, 401)
      const { data: reglages } = await admin.from('lettre_reglages').select('envoi_auto').eq('id', 1).maybeSingle()
      if (reglages && !reglages.envoi_auto) return json({ ok: true, saute: 'Envoi automatique désactivé.' })
      return json(await envoyerATous('auto'))
    }

    if (!(action === 'test' && parSecret) && !(await estBanquier(req))) return json({ error: 'Réservé au banquier.' }, 403)

    if (action === 'apercu') {
      const lettre = await composer()
      const liste = await abonnesActifs()
      return json({
        vide: lettre.vide, objet: lettre.objet, nb_actus: lettre.actus.length, nb_destinataires: liste.length,
        ouverture_ia: !!lettre.ouverture,
        html: lettre.html.replaceAll(JETON_ICI, '00000000-0000-0000-0000-000000000000'),
        expediteur: (await identifiantsGmail()).from || null,
      })
    }

    if (action === 'test') {
      const email = String(body?.email || (await identifiantsGmail()).from).trim()
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Adresse de test invalide.' }, 400)
      const lettre = await composer()
      lettre.objet = `[TEST] ${lettre.objet}`
      const { envoyes, erreurs } = await expedier(lettre, [{ email, jeton: '00000000-0000-0000-0000-000000000000' }])
      await admin.from('lettres').insert({ mode: 'test', objet: lettre.objet, nb_actus: lettre.actus.length, nb_destinataires: envoyes, nb_echecs: erreurs.length, erreurs: erreurs.join('\n') || null })
      if (!envoyes) return json({ error: erreurs[0] || "L'envoi a échoué." }, 502)
      return json({ ok: true, envoyes })
    }

    if (action === 'envoyer') return json(await envoyerATous('manuel'))

    return json({ error: 'Action inconnue.' }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur.' }, 500)
  }
})
