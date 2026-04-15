const billets = [
  '/images/billet/billet-a-colorier-001.jpg',
  '/images/billet/billet-a-colorier-002.png',
  '/images/billet/billet-a-colorier-003.png',
  '/images/billet/billet-a-colorier-004.png',
  '/images/billet/billet-a-colorier-005.png',
  '/images/billet/billet-a-colorier-006.png',
  '/images/billet/billet-a-colorier-007.png',
  '/images/billet/billet-a-colorier-008.jpg',
  '/images/billet/billet-a-colorier-009.jpg',
  '/images/billet/billet-a-colorier-010.jpg',
  '/images/billet/billet-a-colorier-011.jpg',
  '/images/billet/billet-a-colorier-012.jpg',
  '/images/billet/billet-a-colorier-013.jpg',
]

export default function Senrichir() {
  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Billets à imprimer et colorier</span>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,226,122,.45), rgba(255,255,255,.95))' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '.7rem', color: 'var(--gris-fonce)' }}>
              Mode d'emploi
            </div>
            <p style={{ lineHeight: 1.8, color: 'var(--gris-fonce)', maxWidth: 900 }}>
              Ici, vous fabriquez votre monnaie artistique. Téléchargez un billet, imprimez-le, coloriez-le, complétez-le, puis utilisez-le pour entrer dans le jeu d'échanges de la Banque Fantôme. Plus vous produisez de faux argent, plus vous pouvez tenter d'obtenir un objet, une œuvre ou un service présent dans le market.
            </p>
          </div>
        </section>

        <div className="grid-3">
          {billets.map((src, index) => (
            <article key={src} className="objet-card" style={{ cursor: 'default' }}>
              <div className="img-wrap" style={{ aspectRatio: '4 / 2.8' }}>
                <img src={src} alt={`Billet à colorier ${index + 1}`} />
              </div>
              <div className="card-body">
                <div className="card-title">Billet {String(index + 1).padStart(2, '0')}</div>
                <div className="card-desc">Support imprimable pour fabriquer votre monnaie artistique et acheter dans le market.</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.8rem', marginTop: 'auto', paddingTop: '.4rem', flexWrap: 'wrap' }}>
                  <span className="tag">à imprimer</span>
                  <a className="btn btn-noir" href={src} download style={{ fontSize: '.68rem', padding: '.4rem .9rem' }}>
                    Télécharger
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
