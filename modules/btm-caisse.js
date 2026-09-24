/* ──────────────────────────────────────────────────────────────────────────
   btm-caisse.js — la caisse des modules HTML de la Chambre de Compensation
   ──────────────────────────────────────────────────────────────────────────
   Les trois modules servis en iframe (constellation, boîtes à noms, BOBI)
   étaient des zones franches : tout y était gratuit et rien n'atteignait le
   compteur du site. Ce fichier est leur guichet.

   Utilisation dans une page de module :

     <script src="btm-caisse.js"></script>
     ...
     const ok = await BTM.payer("Consultation d'archive", 12);
     if (!ok) return;            // le site a refusé : on annule l'action

   API :
     BTM.payer(label, coutUL)      -> Promise<boolean>   (débite, ou refuse)
     BTM.crediter(label, montantUL)-> Promise<boolean>   (plafonné côté site)
     BTM.deposer(titre, prixAchat) -> void               (pousse dans l'inventaire)
     BTM.etat                      -> { solde, modeGratuit, inflationRate }
     BTM.prix(coutUL)              -> nombre d'UL réellement demandées
     BTM.etiquette(coutUL)         -> " [-12.30 €]" pour coller dans un bouton
     BTM.surEtat(cb)               -> rappel à chaque mise à jour du solde
     BTM.branche                   -> false si la page est ouverte hors du site

   Hors du site (page ouverte seule), tout est autorisé et rien n'est débité :
   le module reste jouable tel quel.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  var dansUnCadre = window.parent && window.parent !== window;
  var attentes = {};
  var compteur = 0;
  var abonnes = [];

  var BTM = {
    branche: !!dansUnCadre,
    etat: { solde: null, modeGratuit: false, inflationRate: 1, tauxEuro: 1 },
    prix: function (coutUL) {
      return Math.round((Number(coutUL) || 0) * (BTM.etat.inflationRate || 1) * 100) / 100;
    },
    etiquette: function (coutUL) {
      if (!dansUnCadre) return "";
      if (BTM.etat.modeGratuit) return " [-0.00 €]";
      // Le site compte en UL et affiche des euros : on applique son taux.
      return " [-" + (BTM.prix(coutUL) * (BTM.etat.tauxEuro || 1)).toFixed(2) + " €]";
    },
    surEtat: function (cb) { if (typeof cb === "function") abonnes.push(cb); },
  };

  function envoyer(message) {
    if (!dansUnCadre) return null;
    var id = "btm-" + (++compteur);
    message.id = id;
    window.parent.postMessage(message, window.location.origin);
    return id;
  }

  function demande(type, charge) {
    if (!dansUnCadre) return Promise.resolve(true);
    return new Promise(function (resolve) {
      charge.type = type;
      var id = envoyer(charge);
      if (!id) { resolve(true); return; }
      var fini = false;
      attentes[id] = function (rep) { fini = true; resolve(!!rep.ok); };
      // Filet : si le site ne répond pas en 4 s, on refuse plutôt que de
      // laisser le module croire qu'il a payé.
      setTimeout(function () {
        if (!fini) { delete attentes[id]; resolve(false); }
      }, 4000);
    });
  }

  BTM.payer = function (label, coutUL) {
    return demande("btm:demande", { label: String(label || "Action"), coutUL: Number(coutUL) || 0 });
  };

  BTM.crediter = function (label, montantUL) {
    return demande("btm:credit", { label: String(label || "Crédit"), montantUL: Number(montantUL) || 0 });
  };

  BTM.deposer = function (titre, prixAchat) {
    if (!dansUnCadre) return;
    window.parent.postMessage({
      type: "btm:inventaire",
      titre: String(titre || "Pièce"),
      prixAchat: Number(prixAchat) || 0,
    }, window.location.origin);
  };

  window.addEventListener("message", function (event) {
    if (event.origin !== window.location.origin) return;
    var d = event.data;
    if (!d || typeof d !== "object") return;

    if (d.type === "btm:etat" || (d.type === "btm:reponse" && typeof d.solde !== "undefined")) {
      if (typeof d.solde !== "undefined") BTM.etat.solde = d.solde;
      if (typeof d.modeGratuit !== "undefined") BTM.etat.modeGratuit = d.modeGratuit;
      if (typeof d.inflationRate !== "undefined") BTM.etat.inflationRate = d.inflationRate;
      if (typeof d.tauxEuro !== "undefined") BTM.etat.tauxEuro = d.tauxEuro;
      for (var i = 0; i < abonnes.length; i++) {
        try { abonnes[i](BTM.etat); } catch (e) { /* un abonné fautif ne bloque pas les autres */ }
      }
    }

    if (d.type === "btm:reponse" && d.id && attentes[d.id]) {
      var cb = attentes[d.id];
      delete attentes[d.id];
      cb(d);
    }
  });

  // Demande d'état au chargement (le parent répond aussi de lui-même).
  if (dansUnCadre) {
    try { window.parent.postMessage({ type: "btm:etat?" }, window.location.origin); } catch (e) { /* origine bloquée */ }
  }

  window.BTM = BTM;
})();
