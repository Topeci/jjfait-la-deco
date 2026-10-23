/* Annonces de location meublée : galerie, calendrier, réservation sur WhatsApp */
(function () {
  "use strict";
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var JOURS = ["L", "M", "M", "J", "V", "S", "D"];

  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function lire(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function ajouter(s, n) { var d = lire(s); d.setDate(d.getDate() + n); return iso(d); }
  function court(s) { var d = lire(s); return d.getDate() + " " + MOIS_COURT[d.getMonth()]; }
  function long(s) { var d = lire(s); return d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear(); }
  function argent(n) { return Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ") + " FCFA"; }
  function nbNuits(a, b) { return Math.round((lire(b) - lire(a)) / 86400000); }
  function stocker(cle, val) { try { if (val === null) localStorage.removeItem(cle); else localStorage.setItem(cle, val); } catch (e) {} }
  function lireStock(cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } }

  document.querySelectorAll(".annonce").forEach(function (annonce) {
    var A = JSON.parse(annonce.dataset.annonce);
    var reserve = ((window.DATES_RESERVEES || {})[A.id] || []);
    var aujourdhui = iso(new Date());
    var etat = { arrivee: null, depart: null, voyageurs: 1, mois: lire(aujourdhui.slice(0, 8) + "01") };

    function bloquee(s) { return reserve.some(function (r) { return s >= r[0] && s < r[1]; }); }
    function plageLibre(a, b) { for (var s = a; s < b; s = ajouter(s, 1)) { if (bloquee(s)) return false; } return true; }
    function remise(n) {
      var r = A.remises.slice().sort(function (x, y) { return y[0] - x[0]; }).find(function (x) { return n >= x[0]; });
      return r ? r[1] : 0;
    }
    function calcul() {
      if (!etat.arrivee || !etat.depart) return null;
      var n = nbNuits(etat.arrivee, etat.depart);
      var brut = n * A.prix, p = remise(n), red = Math.round(brut * p / 100);
      return { nuits: n, brut: brut, pourcent: p, reduction: red, total: brut - red };
    }

    /* Modales */
    function modale(nom) { return annonce.querySelector('[data-modale="' + nom + '"]'); }
    function ouvrir(nom) {
      var m = modale(nom);
      if (m.showModal) m.showModal(); else m.setAttribute("open", "");
      document.documentElement.classList.add("ab-bloque");
    }
    function fermer(m) {
      if (m.close) m.close(); else m.removeAttribute("open");
      document.documentElement.classList.remove("ab-bloque");
    }
    annonce.querySelectorAll("dialog").forEach(function (m) {
      m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-fermer]")) fermer(m); });
      m.addEventListener("close", function () { document.documentElement.classList.remove("ab-bloque"); });
    });

    /* Calendriers */
    var cals = annonce.querySelectorAll("[data-calendrier]");
    function dessinerCal(zone) {
      var nbMois = window.innerWidth >= 760 && !zone.closest("dialog") ? 2 : (window.innerWidth >= 760 ? 2 : 1);
      var html = '<div class="cal-nav"><button type="button" data-cal="prec" aria-label="Mois précédent">‹</button><button type="button" data-cal="suiv" aria-label="Mois suivant">›</button></div><div class="cal-mois-liste">';
      for (var k = 0; k < nbMois; k++) {
        var m = new Date(etat.mois.getFullYear(), etat.mois.getMonth() + k, 1);
        html += '<div class="cal-mois"><p class="cal-nom">' + MOIS[m.getMonth()] + " " + m.getFullYear() + '</p><div class="cal-grille">';
        JOURS.forEach(function (j) { html += '<span class="cal-jour-nom">' + j + "</span>"; });
        var decalage = (m.getDay() + 6) % 7;
        for (var v = 0; v < decalage; v++) html += "<span></span>";
        var fin = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
        for (var d = 1; d <= fin; d++) {
          var s = iso(new Date(m.getFullYear(), m.getMonth(), d));
          var cls = ["cal-j"], off = false;
          var choixDepart = etat.arrivee && !etat.depart && s > etat.arrivee;
          if (s < aujourdhui) { cls.push("passe"); off = true; }
          else if (choixDepart) { if (!plageLibre(etat.arrivee, s)) { cls.push("prise"); off = true; } }
          else if (bloquee(s)) { cls.push("prise"); off = true; }
          if (s === etat.arrivee) cls.push("debut");
          if (s === etat.depart) cls.push("fin");
          if (etat.arrivee && etat.depart && s > etat.arrivee && s < etat.depart) cls.push("dedans");
          if (s === aujourdhui) cls.push("auj");
          html += '<button type="button" class="' + cls.join(" ") + '" data-jour="' + s + '"' + (off ? " disabled" : "") + ' aria-label="' + long(s) + '"><span>' + d + "</span></button>";
        }
        html += "</div></div>";
      }
      zone.innerHTML = html + "</div>";
    }
    function majCals() { cals.forEach(dessinerCal); }
    cals.forEach(function (zone) {
      zone.addEventListener("click", function (e) {
        var nav = e.target.closest("[data-cal]");
        if (nav) {
          var delta = nav.dataset.cal === "suiv" ? 1 : -1;
          var cible = new Date(etat.mois.getFullYear(), etat.mois.getMonth() + delta, 1);
          if (iso(cible).slice(0, 7) < aujourdhui.slice(0, 7)) return;
          etat.mois = cible; majCals(); return;
        }
        var b = e.target.closest("[data-jour]");
        if (!b || b.disabled) return;
        var s = b.dataset.jour;
        if (!etat.arrivee || etat.depart || s <= etat.arrivee) {
          if (bloquee(s)) return;
          etat.arrivee = s; etat.depart = null;
        } else {
          etat.depart = s;
        }
        majTout();
      });
    });

    /* Carte de réservation */
    function champ(nom) { return annonce.querySelectorAll('[data-champ="' + nom + '"]'); }
    function texte(nom, t) { champ(nom).forEach(function (el) { el.textContent = t; }); }
    var detail = annonce.querySelector("[data-detail]");
    var boutonsResa = annonce.querySelectorAll('[data-action="reserver"]');
    function majTout() {
      majCals();
      texte("arrivee", etat.arrivee ? court(etat.arrivee) : "Ajouter une date");
      texte("depart", etat.depart ? court(etat.depart) : "Ajouter une date");
      texte("voyageurs", etat.voyageurs + (etat.voyageurs > 1 ? " voyageurs" : " voyageur"));
      var c = calcul();
      annonce.querySelectorAll(".ab-cal-titre").forEach(function (t) {
        t.textContent = c ? c.nuits + (c.nuits > 1 ? " nuits" : " nuit") + " à la " + A.nom : (etat.arrivee ? "Sélectionnez la date de départ" : "Sélectionnez vos dates");
      });
      annonce.querySelectorAll(".ab-cal-sous").forEach(function (t, i) {
        if (c) t.textContent = long(etat.arrivee) + " – " + long(etat.depart);
        else t.textContent = "Arrivée à partir de " + A.arrivee + " · départ avant " + A.depart;
      });
      texte("resume", c ? court(etat.arrivee) + " – " + court(etat.depart) + " · " + argent(c.total) : "Ajoutez vos dates");
      boutonsResa.forEach(function (b) {
        if (b.classList.contains("ab-reserver")) b.textContent = c ? "Réserver" : "Vérifier la disponibilité";
      });
      if (c) {
        var h = '<div><span>' + argent(A.prix) + " × " + c.nuits + (c.nuits > 1 ? " nuits" : " nuit") + "</span><span>" + argent(c.brut) + "</span></div>";
        if (c.reduction) h += '<div class="ab-remise"><span>Réduction long séjour (−' + c.pourcent + " %)</span><span>−" + argent(c.reduction) + "</span></div>";
        else {
          var prochaine = A.remises.slice().sort(function (x, y) { return x[0] - y[0]; })[0];
          if (prochaine && c.nuits < prochaine[0]) h += '<p class="ab-astuce">Restez ' + prochaine[0] + " nuits ou plus et profitez de −" + prochaine[1] + " %.</p>";
        }
        h += '<div><span>Frais de ménage</span><span>Offerts</span></div><div class="ab-total"><span>Total</span><span>' + argent(c.total) + "</span></div>";
        detail.innerHTML = h; detail.hidden = false;
      } else { detail.hidden = true; detail.innerHTML = ""; }
    }
    annonce.querySelector('[data-action="moins"]').addEventListener("click", function () { if (etat.voyageurs > 1) { etat.voyageurs--; majTout(); } });
    annonce.querySelector('[data-action="plus"]').addEventListener("click", function () { if (etat.voyageurs < A.capacite) { etat.voyageurs++; majTout(); } });
    annonce.querySelectorAll('[data-action="dates"]').forEach(function (b) { b.addEventListener("click", function () { ouvrir("dates"); }); });
    annonce.querySelectorAll('[data-action="effacer"]').forEach(function (b) { b.addEventListener("click", function () { etat.arrivee = etat.depart = null; majTout(); }); });

    var recap = annonce.querySelector("[data-recap]");
    boutonsResa.forEach(function (b) {
      b.addEventListener("click", function () {
        var c = calcul();
        if (!c) { ouvrir("dates"); return; }
        recap.innerHTML = '<div><span>Dates</span><b>' + long(etat.arrivee) + " – " + long(etat.depart) + "</b></div>" +
          "<div><span>Voyageurs</span><b>" + etat.voyageurs + "</b></div>" +
          "<div><span>" + c.nuits + (c.nuits > 1 ? " nuits" : " nuit") + (c.reduction ? " (−" + c.pourcent + " %)" : "") + "</span><b>" + argent(c.total) + "</b></div>";
        ouvrir("confirmer");
      });
    });

    var form = annonce.querySelector(".ab-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, premier = null;
      ["nom", "telephone"].forEach(function (n) {
        var el = form.elements[n], err = el.parentElement.querySelector(".erreur");
        var vide = !el.value.trim();
        err.textContent = vide ? "Ce champ est nécessaire pour vous répondre." : "";
        if (vide) { ok = false; if (!premier) premier = el; }
      });
      if (!ok) { premier.focus(); return; }
      var c = calcul();
      var t = "Bonjour, je souhaite réserver la " + A.nom + ".\n\n" +
        "Arrivée : " + long(etat.arrivee) + " (à partir de " + A.arrivee + ")\n" +
        "Départ : " + long(etat.depart) + " (avant " + A.depart + ")\n" +
        "Durée : " + c.nuits + (c.nuits > 1 ? " nuits" : " nuit") + "\n" +
        "Voyageurs : " + etat.voyageurs + "\n" +
        "Montant : " + argent(c.total) + (c.reduction ? " (réduction long séjour de " + c.pourcent + " % incluse)" : "") + "\n\n" +
        "Nom : " + form.elements.nom.value.trim() + "\n" +
        "Téléphone : " + form.elements.telephone.value.trim() +
        (form.elements.message.value.trim() ? "\n\nMessage : " + form.elements.message.value.trim() : "");
      var url = "https://wa.me/" + A.wa + "?text=" + encodeURIComponent(t);
      var lien = form.querySelector(".ab-lien-wa");
      lien.href = url; lien.hidden = false;
      window.location.href = url;
    });

    /* Galerie */
    annonce.querySelectorAll('[data-action="photos"], .ab-photo').forEach(function (b) {
      b.addEventListener("click", function () {
        ouvrir("photos");
        var i = +(b.dataset.index || 0);
        var fig = modale("photos").querySelectorAll("figure")[i];
        if (fig) setTimeout(function () { fig.scrollIntoView({ block: "start" }); }, 30);
      });
    });
    var carrousel = annonce.querySelector(".ab-carrousel"), compteur = annonce.querySelector(".ab-compteur");
    var total = carrousel.querySelectorAll("img").length;
    carrousel.addEventListener("scroll", function () {
      var i = Math.round(carrousel.scrollLeft / carrousel.clientWidth);
      compteur.textContent = (i + 1) + " / " + total;
    }, { passive: true });
    carrousel.querySelectorAll("img").forEach(function (img) {
      img.addEventListener("click", function () {
        ouvrir("photos");
        var fig = modale("photos").querySelectorAll("figure")[+img.dataset.index];
        if (fig) setTimeout(function () { fig.scrollIntoView({ block: "start" }); }, 30);
      });
    });

    /* Description et équipements */
    var bDesc = annonce.querySelector('[data-action="description"]');
    bDesc.addEventListener("click", function () {
      var ouvert = annonce.classList.toggle("desc-ouverte");
      bDesc.setAttribute("aria-expanded", String(ouvert));
      bDesc.firstChild.textContent = ouvert ? "Réduire " : "Lire la suite ";
    });
    annonce.querySelector('[data-action="equipements"]').addEventListener("click", function () { ouvrir("equipements"); });

    /* Partager et enregistrer */
    annonce.querySelector('[data-action="partager"]').addEventListener("click", function () {
      var url = location.href.split("#")[0] + "#" + A.id;
      var titre = A.nom + " · Location meublée à Cocody";
      if (navigator.share) { navigator.share({ title: titre, url: url }).catch(function () {}); return; }
      window.open("https://wa.me/?text=" + encodeURIComponent(titre + " : " + url), "_blank", "noopener");
    });
    var bSave = annonce.querySelector('[data-action="enregistrer"]');
    var cle = "favori-" + A.id;
    function majSave(on) { bSave.setAttribute("aria-pressed", String(on)); bSave.querySelector("span").textContent = on ? "Enregistré" : "Enregistrer"; }
    majSave(lireStock(cle) === "1");
    bSave.addEventListener("click", function () {
      var on = bSave.getAttribute("aria-pressed") !== "true";
      stocker(cle, on ? "1" : null); majSave(on);
    });

    var largeur = window.innerWidth;
    window.addEventListener("resize", function () { if (Math.abs(window.innerWidth - largeur) > 80) { largeur = window.innerWidth; majCals(); } });
    majTout();
  });
})();
