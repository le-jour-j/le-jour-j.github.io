import { useState } from 'react'
import ImageLightbox from '../components/ImageLightbox'
import GuichetEmission, { MurBillets } from '../components/GuichetEmission'
import CoursDevises from '../components/CoursDevises'
import Notif from '../components/Notif'

const BASE = import.meta.env.BASE_URL
const billets = [
  `${BASE}images/billet/billet-a-colorier-001.jpg`,
  `${BASE}images/billet/billet-a-colorier-002.png`,
  `${BASE}images/billet/billet-a-colorier-003.png`,
  `${BASE}images/billet/billet-a-colorier-004.png`,
  `${BASE}images/billet/billet-a-colorier-005.png`,
  `${BASE}images/billet/billet-a-colorier-006.png`,
  `${BASE}images/billet/billet-a-colorier-007.png`,
  `${BASE}images/billet/billet-a-colorier-008.jpg`,
  `${BASE}images/billet/billet-a-colorier-009.jpg`,
  `${BASE}images/billet/billet-a-colorier-010.jpg`,
  `${BASE}images/billet/billet-a-colorier-011.jpg`,
  `${BASE}images/billet/billet-a-colorier-012.jpg`,
  `${BASE}images/billet/billet-a-colorier-013.jpg`,
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
  const [notif, setNotif] = useState(null)

  function copyPrompt(text, index) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1600)
  }

  return (
    <div className="page-pad">
      <div className="container">
        <div className="section-head">
          <h2>S'enrichir</h2>
          <span className="count">Billets, modèles et prompts</span>
        </div>

        <section style={{ marginBottom: '2.5rem' }}>
          <div className="info-drawer" style={{ margin: 0 }}>
            <div className="info-drawer-title">Mode d'emploi</div>
            <p>
              Ici, vous fabriquez votre monnaie. Téléchargez un billet, imprimez-le, coloriez-le, complétez-le — ou dessinez le vôtre — puis photographiez-le au guichet ci-dessous : la banque le crédite sur votre compte. Ce sont ces billets que vous misez dans le market. Plus vous produisez de faux argent, plus vous pouvez enchérir.
            </p>
          </div>
        </section>

        <GuichetEmission onNotif={setNotif} />

        <MurBillets limit={12} onNotif={setNotif} />

        <section style={{ marginBottom: '3rem' }}>
          <div className="section-head">
            <h2>Cours des devises</h2>
            <span className="count">Les monnaies inventées par les joueurs</span>
          </div>
          <CoursDevises />
        </section>

        <section style={{ marginBottom: '4rem' }}>
          <div className="section-head">
            <h2>Billets à imprimer</h2>
            <span className="count">Cliquez pour agrandir</span>
          </div>
          <div className="grid-3">
            {billets.map((src, index) => (
              <article key={src} className="objet-card billet-card">
                <span className="card-num">#{String(index + 1).padStart(2, '0')}</span>
                <div className="img-wrap">
                  <button className="enrichir-billet-button" onClick={() => setLightboxIndex(index)} aria-label={`Agrandir le billet ${index + 1}`}>
                    <img src={src} alt={`Billet à colorier ${index + 1}`} loading="lazy" />
                  </button>
                </div>
                <div className="card-body">
                  <div className="card-title">Billet {String(index + 1).padStart(2, '0')}</div>
                  <div className="card-desc">Support imprimable pour fabriquer votre monnaie et acheter dans le market.</div>
                  <div className="card-foot">
                    <button type="button" className="tag enrichir-zoom-tag" onClick={() => setLightboxIndex(index)}>⤢ agrandir</button>
                    <a className="btn btn-noir btn-sm" href={src} download>
                      ↓ Télécharger
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
                  <button className={`btn btn-sm ${copiedIndex === index ? 'btn-noir' : 'btn-outline'}`} onClick={() => copyPrompt(prompt.text, index)}>
                    {copiedIndex === index ? '✓ Copié' : 'Copier le prompt'}
                  </button>
                </div>
                {copiedIndex === index && <span className="stamp-copie" aria-hidden="true">Copié</span>}
                <textarea value={prompt.text} readOnly onFocus={e => e.target.select()} aria-label={`Prompt ${prompt.label}`} />
              </article>
            ))}
          </div>
        </section>
      </div>

      {notif && <Notif msg={notif.msg} type={notif.type} onClose={() => setNotif(null)} />}
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
