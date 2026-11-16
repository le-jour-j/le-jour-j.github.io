(function () {
  'use strict';

  // Adresse et cle publique (anon) du projet Supabase du site : prevues pour le navigateur.
  var SUPABASE_URL = 'https://eopygceibkbtkqmrgnxt.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcHlnY2VpYmtidGtxbXJnbnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY0MjYsImV4cCI6MjA4ODg5MjQyNn0.QwymmSPu8cYHbwDo0WzGlCCzu883uFuGyUYj4-bEqnw';

  var CODE = '';
  try { CODE = decodeURIComponent((location.hash || '').replace(/^#/, '')); } catch (e) { CODE = ''; }
  // Si on colle le lien complet dans un onglet deja ouvert sans le code, la page se recharge avec le code.
  window.addEventListener('hashchange', function () { location.reload(); });

  var PERSONNES = [
    { id: 'jeanson', nom: 'Jeanson', role: 'organise', note: '' },
    { id: 'zazen', nom: 'Zazen', role: 'exposante, et prof pour les deux étudiants en prépa', note: '' },
    { id: 'mieszko', nom: 'Mieszko', role: 'exposant', note: '' },
    { id: 'alexandre', nom: 'Alexandre', role: 'exposant', note: '' },
    { id: 'dimitri', nom: 'Dimitri', role: 'filme', note: 'il filme' }
  ];
  var JOURS = [
    { n: 14, nom: 'lun', long: 'lundi 14' }, { n: 15, nom: 'mar', long: 'mardi 15' },
    { n: 16, nom: 'mer', long: 'mercredi 16' }, { n: 17, nom: 'jeu', long: 'jeudi 17' },
    { n: 18, nom: 'ven', long: 'vendredi 18' }, { n: 19, nom: 'sam', long: 'samedi 19' },
    { n: 20, nom: 'dim', long: 'dimanche 20' }
  ];
  var ARRETS_DEFAUT = [
    { id: 'a1', txt: "L'appartement : le vernissage (demande en cours)" },
    { id: 'a2', txt: 'Un stand sur un marché de Noël (piste)' }
  ];
  var TODOS_DEFAUT = [
    { id: 't1', txt: "Demander l'appartement (Jeanson)" },
    { id: 't2', txt: 'Trouver les autres arrêts' },
    { id: 't3', txt: 'Où on dort' },
    { id: 't4', txt: 'Où on mange' },
    { id: 't5', txt: 'La voiture de Jeanson pour se déplacer' }
  ];

  var etat = {};            // cle -> valeur (miroir de la base, avec les ecritures en cours)
  var file = Promise.resolve();
  var enCours = 0;          // ecritures en attente ou en route

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  // ---------- message ----------
  var msgTimer = null;
  function message(txt) {
    var m = $('message');
    m.textContent = txt;
    m.hidden = false;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(function () { m.hidden = true; }, 4000);
  }

  // ---------- reseau ----------
  function rpc(nom, corps) {
    return fetch(SUPABASE_URL + '/rest/v1/rpc/' + nom, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(corps)
    }).then(function (r) {
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var err = new Error('http ' + r.status);
          err.refuse = !!(data && data.code === '42501');
          throw err;
        }
        return data;
      });
    });
  }

  function lire() {
    return rpc('expo_orga_lire', { p_code: CODE }).then(function (rows) {
      if (enCours > 0) return;          // une ecriture est en route : on ne l'ecrase pas
      var nouveau = {};
      (rows || []).forEach(function (r) { nouveau[r.cle] = r.valeur; });
      etat = nouveau;
      rendre();
    });
  }

  function ecrire(cle, valeur) {
    var avant = Object.prototype.hasOwnProperty.call(etat, cle) ? etat[cle] : undefined;
    if (valeur === '' || valeur == null) delete etat[cle]; else etat[cle] = valeur;
    rendre();
    enCours++;
    file = file.then(function () {
      return rpc('expo_orga_ecrire', { p_code: CODE, p_cle: cle, p_valeur: valeur || '' });
    }).then(function () {
      enCours--;
      if (enCours === 0) lire().catch(function () {});
    }, function () {
      enCours--;
      if (avant === undefined) delete etat[cle]; else etat[cle] = avant;
      rendre();
      message('Pas enregistré, réessaie.');
    });
  }

  // ---------- rendu ----------
  function rendreGrille() {
    var t = $('grille');
    t.textContent = '';
    var thead = el('thead'), tr = el('tr');
    var corner = el('th', 'qui'); corner.setAttribute('scope', 'col'); tr.appendChild(corner);
    var totaux = JOURS.map(function (j) {
      return PERSONNES.filter(function (p) { return etat['j.' + p.id + '.' + j.n] === '1'; }).length;
    });
    var max = Math.max.apply(null, totaux);
    JOURS.forEach(function (j, i) {
      var th = el('th', max > 0 && totaux[i] === max ? 'meilleur-j' : '');
      th.setAttribute('scope', 'col');
      th.appendChild(document.createTextNode(j.nom));
      th.appendChild(el('br'));
      th.appendChild(document.createTextNode(String(j.n)));
      tr.appendChild(th);
    });
    thead.appendChild(tr); t.appendChild(thead);

    var tbody = el('tbody');
    PERSONNES.forEach(function (p) {
      var r = el('tr');
      var th = el('th', 'qui'); th.setAttribute('scope', 'row');
      th.appendChild(document.createTextNode(p.nom));
      if (p.note) th.appendChild(el('small', '', '(' + p.note + ')'));
      r.appendChild(th);
      JOURS.forEach(function (j) {
        var cle = 'j.' + p.id + '.' + j.n;
        var on = etat[cle] === '1';
        var td = el('td');
        var b = el('button', 'case', on ? '✓' : '');
        b.type = 'button';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', p.nom + ', ' + j.long);
        b.addEventListener('click', function () { ecrire(cle, on ? '' : '1'); });
        td.appendChild(b); r.appendChild(td);
      });
      tbody.appendChild(r);
    });
    t.appendChild(tbody);

    var tfoot = el('tfoot'), fr = el('tr');
    var ft = el('th', 'qui', 'Total'); ft.setAttribute('scope', 'row'); fr.appendChild(ft);
    totaux.forEach(function (n) {
      fr.appendChild(el('td', max > 0 && n === max ? 'meilleur-j' : '', String(n)));
    });
    tfoot.appendChild(fr); t.appendChild(tfoot);

    var m = $('meilleur');
    m.textContent = '';
    if (max === 0) {
      m.appendChild(el('span', 'vide', "Personne n'a encore coché de jour."));
    } else {
      m.appendChild(document.createTextNode(max === 1 ? 'Meilleur jour (1 personne) : ' : 'Meilleur jour (' + max + ' personnes) : '));
      JOURS.forEach(function (j, i) {
        if (totaux[i] === max) m.appendChild(el('span', 'badge', j.long));
      });
    }
  }

  function parseLigne(v) {
    var i = v.indexOf('|');
    return { fait: v.slice(0, i) === '1', txt: v.slice(i + 1) };
  }

  function rendreListe(ul, prefixe, defauts) {
    ul.textContent = '';
    var ids = {};
    var lignes = [];
    defauts.forEach(function (d) {
      var v = etat[prefixe + '.' + d.id];
      lignes.push({ id: d.id, fait: v ? parseLigne(v).fait : false, txt: d.txt, defaut: true });
      ids[d.id] = 1;
    });
    var ajoutes = [];
    Object.keys(etat).forEach(function (k) {
      if (k.indexOf(prefixe + '.') !== 0) return;
      var id = k.slice(prefixe.length + 1);
      if (ids[id] || !/^n[a-z0-9]+$/.test(id)) return;
      var p = parseLigne(etat[k]);
      ajoutes.push({ id: id, fait: p.fait, txt: p.txt, defaut: false });
    });
    ajoutes.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    lignes = lignes.concat(ajoutes);

    lignes.forEach(function (l) {
      var cle = prefixe + '.' + l.id;
      var li = el('li');
      var b = el('button', 'ligne');
      b.type = 'button';
      b.setAttribute('aria-pressed', l.fait ? 'true' : 'false');
      b.appendChild(el('span', 'boite'));
      b.appendChild(el('span', 'txt', l.txt));
      b.addEventListener('click', function () { ecrire(cle, (l.fait ? '0|' : '1|') + l.txt); });
      li.appendChild(b);
      if (!l.defaut) {
        var x = el('button', 'retire', '×');
        x.type = 'button';
        x.setAttribute('aria-label', 'Enlever : ' + l.txt);
        x.addEventListener('click', function () { ecrire(cle, ''); });
        li.appendChild(x);
      }
      ul.appendChild(li);
    });
  }

  function rendreMontre() {
    var zone = $('montre');
    if (zone.children.length === 0) {
      PERSONNES.forEach(function (p) {
        if (p.id === 'dimitri') return;
        var bloc = el('div', 'perso');
        bloc.appendChild(el('h3', '', p.nom));
        bloc.appendChild(el('p', 'role', p.role));
        [['montre', 'Montre ou vend'], ['apporte', 'Apporte']].forEach(function (c) {
          var cle = 'mv.' + p.id + '.' + c[0];
          var lab = el('label', '', c[1]);
          var ta = el('textarea');
          ta.rows = 2; ta.maxLength = 400; ta.dataset.cle = cle;
          ta.addEventListener('change', function () {
            var v = ta.value.trim();
            if ((etat[cle] || '') !== v) ecrire(cle, v);
          });
          lab.appendChild(ta);
          bloc.appendChild(lab);
        });
        zone.appendChild(bloc);
      });
    }
    var tas = zone.querySelectorAll('textarea');
    for (var i = 0; i < tas.length; i++) {
      var ta = tas[i];
      if (document.activeElement === ta) continue;   // pas d'ecrasement pendant la frappe
      var v = etat[ta.dataset.cle] || '';
      if (ta.value !== v) ta.value = v;
    }
  }

  function rendre() {
    rendreGrille();
    rendreListe($('arrets'), 'arret', ARRETS_DEFAUT);
    rendreListe($('todos'), 'todo', TODOS_DEFAUT);
    rendreMontre();
  }

  // ---------- ajout de lignes ----------
  function nouvelId() {
    return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  }
  function brancherAjouts() {
    var forms = document.querySelectorAll('form.ajout');
    for (var i = 0; i < forms.length; i++) {
      (function (f) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var inp = f.querySelector('input');
          var txt = inp.value.replace(/\s+/g, ' ').trim();
          if (!txt) return;
          ecrire(f.dataset.liste + '.' + nouvelId(), '0|' + txt);
          inp.value = '';
        });
      })(forms[i]);
    }
  }

  // ---------- demarrage ----------
  function refus(txt) {
    $('entree').textContent = '';
    $('entree').appendChild(el('p', 'refus', txt || 'Il faut le lien complet pour entrer.'));
  }

  function rafraichirSiVisible() {
    if (document.visibilityState === 'visible' && enCours === 0) lire().catch(function () {});
  }

  function demarrer() {
    if (!CODE || CODE.length < 20) { refus(); return; }
    lire().then(function () {
      $('entree').hidden = true;
      $('page').hidden = false;
      brancherAjouts();
      rendre();
      setInterval(rafraichirSiVisible, 30000);
      document.addEventListener('visibilitychange', rafraichirSiVisible);
    }).catch(function (e) {
      if (e && e.refuse) refus();
      else refus('Impossible de charger la page. Recharge dans un instant.');
    });
  }

  demarrer();
})();
