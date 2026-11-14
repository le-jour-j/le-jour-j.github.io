# Fabrique les vignettes des photos d'actu : public/images/actu/mini/<nom>.jpg (720 px sur le grand côté).
# Le fil d'actu affiche la vignette et n'ouvre la grande photo qu'au clic. Écrit le 2026-11-14, demande de
# Jiiji : « le site est trop lourd, il met des plombes à se charger sur une faible connexion ».
# À relancer après avoir ajouté des photos dans public/images/actu/ (il ne refait que ce qui manque) :
#   py scripts/vignettes-actu.py
import os

from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
ACTU = os.path.join(ICI, "..", "public", "images", "actu")
MINI = os.path.join(ACTU, "mini")
os.makedirs(MINI, exist_ok=True)
faites = poids = 0
for nom in sorted(os.listdir(ACTU)):
    if not nom.lower().endswith((".jpg", ".jpeg", ".png")):
        continue
    cible = os.path.join(MINI, os.path.splitext(nom)[0] + ".jpg")
    if not os.path.exists(cible):
        im = Image.open(os.path.join(ACTU, nom)).convert("RGB")
        im.thumbnail((720, 720), Image.LANCZOS)
        im.save(cible, "JPEG", quality=68, optimize=True, progressive=True)
        im.close()
        faites += 1
    poids += os.path.getsize(cible)
print("vignettes faites :", faites, "| total :", len(os.listdir(MINI)), "fichiers,", round(poids / 1e6, 1), "Mo")
