"use strict";
/* ================================================================ site : stockage et reseau (charge en tout premier)

   Sur le site, l'ecran de poiasie est une demonstration : il ne lit rien dans le navigateur du
   visiteur, n'y ecrit rien (aucun reglage n'est garde), et ne parle qu'a des fichiers du site. Ce
   fichier pose ces garde-fous avant que le moteur ne se charge. */
(function () {
  const PREFIXE = "poiasie";

  // 1. rien de ce que le moteur garde (cles « poiasie-... ») n'est lu ni ecrit
  try {
    const lire = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) { return String(k).indexOf(PREFIXE) === 0 ? null : lire.apply(this, arguments); };
    Storage.prototype.setItem = (function (ecrire) {
      return function (k) { if (String(k).indexOf(PREFIXE) === 0) return; return ecrire.apply(this, arguments); };
    })(Storage.prototype.setItem);
  } catch (e) { /* stockage refuse : tant pis, il ne servait a rien ici */ }

  // 2. le moteur sait parler a un petit serveur local (votes, generateur, banque de l'IA) : sur le site
  //    rien de tout cela n'existe. Ces demandes ne partent pas, elles recoivent une reponse vide.
  const VIDE = /hors-ligne|direct\.json|\.bat\b/;
  const BANQUE_IA = /banque-ia/;
  if (typeof window.fetch === "function") {
    const vrai = window.fetch;
    window.fetch = function (u) {
      const s = String(u && u.url || u);
      if (BANQUE_IA.test(s)) return Promise.resolve(new Response("[]", { status: 200 }));
      if (VIDE.test(s)) return Promise.resolve(new Response("", { status: 404 }));
      return vrai.apply(this, arguments);
    };
  }
  try {
    const ouvrir = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (methode, url) {
      if (BANQUE_IA.test(String(url))) arguments[1] = "data:application/json,%5B%5D";
      return ouvrir.apply(this, arguments);
    };
  } catch (e) { /* pas de XHR : rien a faire */ }

  // 3. pour essayer le repli sans carte graphique : scene.html?sanswebgl=1
  try {
    if (/[?&]sanswebgl=1/.test(location.search)) {
      const ctx = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) {
        if (/webgl/i.test(String(type))) return null;
        return ctx.apply(this, arguments);
      };
    }
  } catch (e) { /* tant pis */ }
})();
