// Insère (si absent) le hack SPA GitHub Pages pour banque-fantome dans un
// fichier 404.html déjà construit.
//
// Le 404.html source du repo est régénéré à l'identique d'index.html par le
// pipeline de build du site portfolio racine (autre process, voir commits
// "Deploiement groupe : ... 404.html resynchronisé avec index.html") : un
// edit manuel du fichier source ne survit donc jamais au déploiement
// suivant. On injecte donc ce bloc ici, au moment du build de CE workflow,
// directement sur le fichier de sortie — après le fichier source.
//
// Usage : node scripts/inject-bf-redirect.cjs <chemin vers 404.html>

const fs = require('fs')

const MARKER = '<!-- bf-redirect -->'
const SNIPPET = `${MARKER}
  <script>
    // Deep-link SPA banque-fantome : GitHub Pages n'a pas de rewrite serveur,
    // donc on redirige /banque-fantome/<route> vers l'app en gardant la route visée.
    if (location.pathname.startsWith('/banque-fantome/')) {
      sessionStorage.setItem('bf-redirect', location.pathname.replace('/banque-fantome', '') + location.search + location.hash)
      location.replace('/banque-fantome/')
    }
  </script>
`

const file = process.argv[2]
if (!file) {
  console.error('Usage: node inject-bf-redirect.cjs <chemin vers 404.html>')
  process.exit(1)
}

let html = fs.readFileSync(file, 'utf8')
if (html.includes(MARKER)) {
  console.log('bf-redirect déjà présent dans', file, '— rien à faire.')
} else {
  if (!html.includes('</head>')) {
    console.error(`Balise </head> introuvable dans ${file}, injection impossible.`)
    process.exit(1)
  }
  html = html.replace('</head>', SNIPPET + '</head>')
  fs.writeFileSync(file, html)
  console.log('bf-redirect injecté dans', file)
}
