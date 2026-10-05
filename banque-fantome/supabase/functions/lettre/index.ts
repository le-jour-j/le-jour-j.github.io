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
const ACTUS_DETAILLEES = 6
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
const MODELES_GEMINI = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest']
const MODELE_IA = 'claude-sonnet-5-5'
const CONSIGNE_IA = `Tu écris l'ouverture de « la lettre de la banque », la lettre hebdomadaire de la Banque Fantôme.
La Banque Fantôme est un projet artistique de Jeanson Pechin, dit Jiiji : une fausse banque qui fabrique sa propre monnaie dessinée, avec un guichet, des billets, un market où l'on enchérit. Il est en résidence d'artiste dans le Beauvaisis (CLEA), avec des écoles, des centres sociaux, des associations et des services de l'agglomération.
La lettre part aux structures partenaires et aux membres du site.

Écris un texte de 70 à 130 mots, en un ou deux paragraphes, qui raconte ce qui s'est passé cette semaine à partir des actus fournies. Le ton : chaleureux, vivant, avec une pointe d'humour pince-sans-rire qui parodie gentiment la communication d'une banque. Tutoiement interdit, vouvoiement de politesse ou tournures impersonnelles. Termine en donnant envie d'aller voir sur le site.

Règles strictes :
- n'invente rien : pas de fait, de date, de nom, de chiffre ou de lieu absent des actus ;
- pas de titre, pas de liste, pas de formule d'appel (« Bonjour », « Chers partenaires »), pas de signature ;
- pas d'emoji, pas de markdown, pas de guillemets autour du texte ;
- n'utilise jamais le tiret cadratin ni le demi-cadratin ;
- réponds uniquement par le texte de l'ouverture.`

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
  for (const modele of MODELES_GEMINI) {
    for (let essai = 0; essai < 2; essai++) {
      if (essai) await new Promise(r => setTimeout(r, 4000))
      const rep = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': cleApi, 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: consigne }] },
          contents: [{ role: 'user', parts: [{ text: demande }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
        }),
        signal: AbortSignal.timeout(30000),
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
  const matiere = actus.map(a => `### ${dateFr(a.date_actu)} : ${a.titre}\n${(a.texte || '').trim().slice(0, 2000)}`).join('\n\n')
  const demande = `Les actus publiées depuis la dernière lettre :\n\n${matiere}` +
    (mot ? `\n\nLe banquier ajoute lui-même un mot, affiché juste après ton texte (ne le répète pas) :\n${mot}` : '')
  try {
    const gemini = await cle('GEMINI_API_KEY', 'lettre_cle_gemini')
    const claude = gemini ? '' : await cle('ANTHROPIC_API_KEY', 'lettre_cle_ia')
    if (!gemini && !claude) return null
    const t = gemini ? await demanderGemini(gemini, CONSIGNE_IA, demande) : await demanderClaude(claude, CONSIGNE_IA, demande)
    // filet : les tirets longs deviennent des virgules, le markdown éventuel s'efface
    return t ? t.replace(/\s*[—–]\s*/g, ', ').replace(/\*\*?|__/g, '').trim() : null
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
  const [{ data: reglages }, { data: actusData, error }] = await Promise.all([
    admin.from('lettre_reglages').select('mot').eq('id', 1).maybeSingle(),
    admin.from('actus').select('id, date_actu, titre, texte, images')
      .eq('publie', true).is('en_lettre_at', null)
      .order('date_actu', { ascending: false }).order('created_at', { ascending: false }).limit(50),
  ])
  if (error) throw error
  const actus = (actusData || []) as Actu[]
  const mot = (reglages?.mot || '').trim()
  const vide = actus.length === 0 && !mot
  const ouverture = vide ? null : await ouvertureIA(actus, mot)
  const chapo = ouverture
    ? ouverture.split(/\n\s*\n/).map(p => `<p style="margin:0 0 12px">${esc(p.trim()).replace(/\n/g, '<br>')}</p>`).join('')
    : (actus.length ? 'Ce qui est arrivé à la Banque Fantôme ces derniers jours.' : 'Des nouvelles de la Banque Fantôme.')

  const objet = actus.length === 1 ? `Banque Fantôme · ${actus[0].titre}`
    : actus.length > 1 ? `Banque Fantôme · ${actus.length} nouvelles de la banque`
    : 'Banque Fantôme · le mot du banquier'

  const detail = actus.slice(0, ACTUS_DETAILLEES)
  const reste = actus.slice(ACTUS_DETAILLEES)
  const lienActu = `${SITE}/actu/`

  const blocMot = mot ? `
    <tr><td style="padding:0 32px 8px">
      <div style="border:2px solid #1A1A1A;background:#FBF3C8;padding:18px 20px;font-size:16px;line-height:1.6;color:#1A1A1A">
        <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#4C463D;margin-bottom:8px">Le mot du banquier</div>
        ${esc(mot).replace(/\n/g, '<br>')}
      </div>
    </td></tr>` : ''

  const blocsActus = detail.map(a => {
    const img = urlImage(a.images?.[0])
    return `
    <tr><td style="padding:24px 32px 0">
      ${img ? `<a href="${lienActu}"><img src="${esc(img)}" alt="" width="536" style="display:block;width:auto;max-width:100%;max-height:340px;height:auto;margin:0 auto;border:2px solid #1A1A1A"></a>` : ''}
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#66604F;margin:14px 0 4px">${esc(dateFr(a.date_actu))}</div>
      <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:28px;line-height:1.1;letter-spacing:.02em;color:#1A1A1A;margin-bottom:8px">${esc(a.titre)}</div>
      ${a.texte ? `<div style="font-size:16px;line-height:1.6;color:#1A1A1A">${esc(extrait(a.texte)).replace(/\n/g, '<br>')}</div>` : ''}
      <div style="margin-top:10px"><a href="${lienActu}" style="color:#1A1A1A;font-weight:700;font-size:14px">Lire sur le site →</a></div>
    </td></tr>`
  }).join('')

  const blocReste = reste.length ? `
    <tr><td style="padding:24px 32px 0;font-size:15px;line-height:1.7;color:#1A1A1A">
      <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#66604F;margin-bottom:6px">Et aussi</div>
      ${reste.map(a => `· <a href="${lienActu}" style="color:#1A1A1A">${esc(a.titre)}</a> <span style="color:#66604F">(${esc(dateFr(a.date_actu))})</span>`).join('<br>')}
    </td></tr>` : ''

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(objet)}</title></head>
<body style="margin:0;padding:0;background:#FFF9E8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9E8"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFDF7;border:2px solid #1A1A1A;font-family:'DM Sans',Helvetica,Arial,sans-serif">
  <tr><td style="background:#F5E27A;border-bottom:2px solid #1A1A1A;padding:22px 32px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#1A1A1A">La lettre de la banque</div>
    <div style="font-family:'Bebas Neue',Impact,'Arial Narrow',sans-serif;font-size:44px;line-height:1;letter-spacing:.02em;color:#1A1A1A;margin-top:6px">BANQUE FANTÔME</div>
  </td></tr>
  <tr><td style="padding:24px 32px ${ouverture ? '4px' : '16px'};font-size:${ouverture ? '17px' : '16px'};line-height:1.6;color:#1A1A1A">
    ${chapo}
  </td></tr>
  ${blocMot}
  ${blocsActus}
  ${blocReste}
  <tr><td style="padding:32px 32px 8px" align="center">
    <a href="${SITE}/" style="display:inline-block;background:#1A1A1A;color:#FFFDF7;text-decoration:none;font-weight:700;font-size:15px;padding:14px 26px;border:2px solid #1A1A1A">→ Visiter la banque</a>
  </td></tr>
  <tr><td style="padding:8px 32px 28px;font-size:14px;line-height:1.6;color:#4C463D" align="center">
    Ouvrir un compte, fabriquer sa monnaie, enchérir au market :
    <a href="${SITE}/connexion/" style="color:#1A1A1A">jeansonpechin.com/banque-fantome</a>
  </td></tr>
  <tr><td style="border-top:2px solid #1A1A1A;padding:16px 32px;font-size:12px;line-height:1.6;color:#66604F">
    ◈ Banque Fantôme, institution de circulation. La valeur ne préexiste pas : elle se dessine.<br>
    Vous recevez cette lettre parce que vous êtes inscrit·e à la lettre de la banque.
    <a href="${SITE}/lettre/?desinscription=${JETON_ICI}" style="color:#66604F">Se désinscrire</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

  const txt = [
    'LA LETTRE DE LA BANQUE · BANQUE FANTÔME', '',
    ouverture ? `${ouverture}\n` : '',
    mot ? `Le mot du banquier :\n${mot}\n` : '',
    ...actus.map(a => `${dateFr(a.date_actu)} · ${a.titre}\n${extrait(a.texte)}\n`),
    `Lire sur le site : ${lienActu}`,
    `Visiter la banque : ${SITE}/`, '',
    `Se désinscrire : ${SITE}/lettre/?desinscription=${JETON_ICI}`,
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
            'List-Unsubscribe': `<${FONCTION}?desinscription=${d.jeton}>, <mailto:${EXPEDITEUR}?subject=desinscription>`,
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
      return texte('Désinscription enregistrée. Vous ne recevrez plus la lettre de la Banque Fantôme.')
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
