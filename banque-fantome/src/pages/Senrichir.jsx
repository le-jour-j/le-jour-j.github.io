import { useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'

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

const prompts = [
  {
    label: 'Billet 5 €',
    text: `Create a highly accurate artistic representation of a 5 euro banknote with the exact same dimensions, proportions, layout and composition as the official 5 euro banknote (120mm x 62mm aspect ratio), grey-green color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 10 €',
    text: `Create a highly accurate artistic representation of a 10 euro banknote with the exact same dimensions, proportions, layout and composition as the official 10 euro banknote (127mm x 67mm aspect ratio), red color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 20 €',
    text: `Create a highly accurate artistic representation of a 20 euro banknote with the exact same dimensions, proportions, layout and composition as the official 20 euro banknote (133mm x 72mm aspect ratio), blue color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 50 €',
    text: `Create a highly accurate artistic representation of a 50 euro banknote with the exact same dimensions, proportions, layout and composition as the official 50 euro banknote (140mm x 77mm aspect ratio), orange color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 100 €',
    text: `Create a highly accurate artistic representation of a 100 euro banknote with the exact same dimensions, proportions, layout and composition as the official 100 euro banknote (147mm x 82mm aspect ratio), green color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 200 €',
    text: `Create a highly accurate artistic representation of a 200 euro banknote with the exact same dimensions, proportions, layout and composition as the official 200 euro banknote (153mm x 82mm aspect ratio), yellow-brown color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
  {
    label: 'Billet 500 €',
    text: `Create a highly accurate artistic representation of a 500 euro banknote with the exact same dimensions, proportions, layout and composition as the official 500 euro banknote (160mm x 82mm aspect ratio), purple color palette, featuring a stylized depiction of [INSÈRE TON MONUMENT OU IMAGE ICI] as the main central vignette, abstract contemporary artistic banknote style, geometric patterns, decorative security elements, clean professional composition, clearly fictional and artistic, not realistic counterfeit, fine line details, experimental typography, no real numbers or text that mimic genuine currency, ultra detailed, sharp edges, perfect aspect ratio, both front (recto) and back (verso) sides visible on the same image with recto on the left and verso on the right, 8k resolution, viewed straight on as a flat document`,
  },
]

export default function Senrichir() {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  function copyPrompt(text, index) {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1400)
  }

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Billets, modèles et prompts</span>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,226,122,.45), rgba(255,255,255,.95))' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: '.7rem', color: 'var(--gris-fonce)' }}>
              Mode d'emploi
            </div>
            <p style={{ lineHeight: 1.8, color: 'var(--gris-fonce)', maxWidth: 900 }}>
              Ici, vous fabriquez votre monnaie. Téléchargez un billet, imprimez-le, coloriez-le, complétez-le, puis utilisez-le pour entrer dans le jeu d'échanges de la Banque Fantôme. Plus vous produisez de faux argent, plus vous pouvez tenter d'obtenir un objet, une œuvre ou un service présent dans le market.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '4rem' }}>
          <div className="section-head">
            <h2>Billets à imprimer</h2>
            <span className="count">Cliquez pour agrandir</span>
          </div>
          <div className="grid-3">
            {billets.map((src, index) => (
              <article key={src} className="objet-card" style={{ cursor: 'default' }}>
                <button className="img-wrap enrichir-billet-button" style={{ aspectRatio: '4 / 2.8' }} onClick={() => setLightboxIndex(index)} aria-label={`Agrandir le billet ${index + 1}`}>
                  <img src={src} alt={`Billet à colorier ${index + 1}`} />
                </button>
                <div className="card-body">
                  <div className="card-title">Billet {String(index + 1).padStart(2, '0')}</div>
                  <div className="card-desc">Support imprimable pour fabriquer votre monnaie et acheter dans le market.</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.8rem', marginTop: 'auto', paddingTop: '.4rem', flexWrap: 'wrap' }}>
                    <button type="button" className="tag enrichir-zoom-tag" onClick={() => setLightboxIndex(index)}>agrandir</button>
                    <a className="btn btn-noir" href={src} download style={{ fontSize: '.68rem', padding: '.4rem .9rem' }}>
                      Télécharger
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h2>Prompts</h2>
            <span className="count">Billets personnalisés</span>
          </div>
          <div className="prompt-list">
            {prompts.map((prompt, index) => (
              <article key={prompt.label} className="prompt-card">
                <div className="prompt-card-head">
                  <h3>{prompt.label}</h3>
                  <button className="btn btn-outline" onClick={() => copyPrompt(prompt.text, index)}>
                    {copiedIndex === index ? 'Copié' : 'Copier'}
                  </button>
                </div>
                <textarea value={prompt.text} readOnly />
              </article>
            ))}
          </div>
        </section>
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={billets}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => (i === 0 ? billets.length - 1 : i - 1))}
          onNext={() => setLightboxIndex(i => (i === billets.length - 1 ? 0 : i + 1))}
        />
      )}
    </div>
  )
}
