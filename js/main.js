/* JJ Fait la Déco — scripts du site */
(function () {
  "use strict";
  var WHATSAPP = "2250103778817";
  document.documentElement.classList.add("js");

  /* En-tête qui se réduit au défilement */
  var entete = document.querySelector(".entete");
  function majEntete() { if (entete) entete.classList.toggle("defile", window.scrollY > 20); }
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  /* Menu mobile */
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var ouvert = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!ouvert));
      nav.classList.toggle("ouvert", !ouvert);
      document.body.style.overflow = ouvert ? "" : "hidden";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        burger.setAttribute("aria-expanded", "false");
        nav.classList.remove("ouvert");
        document.body.style.overflow = "";
      });
    });
  }

  /* Apparition des blocs au défilement */
  var reveles = document.querySelectorAll(".revele");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveles.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add("visible");
      else obs.observe(el);
    });
  } else {
    reveles.forEach(function (el) { el.classList.add("visible"); });
  }

  /* Compteurs animés */
  function anime(el) {
    var cible = parseInt(el.getAttribute("data-cible"), 10) || 0;
    var suffixe = el.getAttribute("data-suffixe") || "";
    var debut = null, duree = 1800;
    function pas(t) {
      if (!debut) debut = t;
      var p = Math.min((t - debut) / duree, 1);
      var v = Math.round(cible * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + suffixe;
      if (p < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }
  var compteurs = document.querySelectorAll("[data-cible]");
  if (compteurs.length && "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var obsC = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { anime(e.target); obsC.unobserve(e.target); } });
    }, { threshold: 0.5 });
    compteurs.forEach(function (c) {
      var r = c.getBoundingClientRect();
      if (r.top > window.innerHeight) { c.textContent = "0" + (c.getAttribute("data-suffixe") || ""); obsC.observe(c); }
    });
  }

  /* Cartes prestations : retournement au toucher sur mobile */
  document.querySelectorAll(".carte-retour").forEach(function (carte) {
    carte.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (matchMedia("(hover: none)").matches) carte.classList.toggle("retournee");
    });
  });

  /* Diaporama de couverture */
  var diaporama = document.querySelector(".diaporama");
  if (diaporama) {
    var diapos = diaporama.querySelectorAll(".diapo");
    var points = diaporama.querySelectorAll(".diapo-points button");
    var courant = 0, minuteur = null;
    var calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
    function montrer(n) {
      courant = (n + diapos.length) % diapos.length;
      diapos.forEach(function (d, i) {
        var actif = i === courant;
        d.classList.toggle("active", actif);
        if (actif) d.removeAttribute("aria-hidden"); else d.setAttribute("aria-hidden", "true");
        var img = d.querySelector("img");
        if (actif && img && img.loading === "lazy") img.loading = "eager";
      });
      points.forEach(function (p, i) { if (i === courant) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current"); });
    }
    function relancer() {
      clearInterval(minuteur);
      if (!calme) minuteur = setInterval(function () { if (!document.hidden) montrer(courant + 1); }, 6500);
    }
    points.forEach(function (p, i) { p.addEventListener("click", function () { montrer(i); relancer(); }); });
    var prec = diaporama.querySelector(".prec"), suiv = diaporama.querySelector(".suiv");
    if (prec) prec.addEventListener("click", function () { montrer(courant - 1); relancer(); });
    if (suiv) suiv.addEventListener("click", function () { montrer(courant + 1); relancer(); });
    var xd = null;
    diaporama.addEventListener("touchstart", function (e) { xd = e.touches[0].clientX; }, { passive: true });
    diaporama.addEventListener("touchend", function (e) {
      if (xd === null) return;
      var dx = e.changedTouches[0].clientX - xd;
      if (Math.abs(dx) > 50) { montrer(courant + (dx < 0 ? 1 : -1)); relancer(); }
      xd = null;
    });
    /* précharge les photos suivantes après l'affichage */
    window.addEventListener("load", function () { diapos.forEach(function (d) { var im = d.querySelector("img"); if (im) im.loading = "eager"; }); });
    relancer();
  }

  /* Cartes prestations : ouverture au toucher sur mobile */
  document.querySelectorAll(".carte-presta").forEach(function (carte) {
    carte.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (matchMedia("(hover: none)").matches) {
        var ouvert = carte.classList.contains("ouvert");
        document.querySelectorAll(".carte-presta.ouvert").forEach(function (c) { c.classList.remove("ouvert"); });
        if (!ouvert) carte.classList.add("ouvert");
      }
    });
  });

  /* Parallaxe de la photo des compteurs */
  var para = document.querySelector(".parallaxe");
  if (para && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var bloc = para.parentElement, enAttente = false;
    function deplacer() {
      enAttente = false;
      var r = bloc.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var progres = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      para.style.transform = "translate3d(0," + (progres * -18).toFixed(2) + "%,0)";
    }
    window.addEventListener("scroll", function () { if (!enAttente) { enAttente = true; requestAnimationFrame(deplacer); } }, { passive: true });
    deplacer();
  }

  /* Engagements : affichage du détail au toucher */
  document.querySelectorAll(".engagement").forEach(function (eng) {
    eng.addEventListener("click", function () {
      if (matchMedia("(hover: none)").matches) eng.classList.toggle("ouvert");
    });
  });

  /* Vidéo de la boutique : bouton son */
  document.querySelectorAll(".btn-son").forEach(function (btn) {
    var video = document.getElementById(btn.getAttribute("aria-controls"));
    if (!video) return;
    btn.addEventListener("click", function () {
      video.muted = !video.muted;
      if (!video.muted) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      btn.setAttribute("aria-pressed", String(!video.muted));
    });
  });

  /* Avant / après : changement de projet */
  document.querySelectorAll(".avant-apres").forEach(function (bloc) {
    var boutons = bloc.querySelectorAll(".aa-onglets button");
    var projets = bloc.querySelectorAll(".aa-projet");
    boutons.forEach(function (b) {
      b.addEventListener("click", function () {
        boutons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        projets.forEach(function (p) { p.classList.toggle("actif", p.dataset.projet === b.dataset.projet); });
      });
    });
  });

  /* Comparateur avant / après */
  document.querySelectorAll(".comparateur").forEach(function (comp) {
    var curseur = comp.querySelector("input");
    function maj() { comp.style.setProperty("--pos", curseur.value + "%"); }
    curseur.addEventListener("input", maj);
    maj();
  });

  /* Filtres de la page réalisations */
  var filtres = document.querySelectorAll("[data-filtre]");
  filtres.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filtre");
      filtres.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      document.querySelectorAll(".mosaique .tuile").forEach(function (t) {
        t.hidden = !(f === "tout" || (t.getAttribute("data-cat") || "").split(" ").indexOf(f) > -1);
      });
    });
  });

  /* Visionneuse photo */
  var tuiles = Array.prototype.slice.call(document.querySelectorAll(".tuile[data-src]"));
  var vis = null, index = 0, liste = [];
  function legende(t) { var b = t.querySelector(".legende b"); return b ? b.textContent : ""; }
  function afficher() {
    var t = liste[index];
    var zone = vis.querySelector(".vis-image");
    var src = t.getAttribute("data-video");
    if (src) {
      zone.innerHTML = '<video controls autoplay playsinline></video>';
      zone.querySelector("video").src = src;
    } else {
      zone.innerHTML = '<img alt="">';
      zone.querySelector("img").src = t.getAttribute("data-src");
      zone.querySelector("img").alt = t.querySelector("img").alt;
    }
    vis.querySelector("p").textContent = legende(t) + "  ·  " + (index + 1) + " / " + liste.length;
  }
  function fermer() { if (vis) { vis.remove(); vis = null; document.body.style.overflow = ""; } }
  function ouvrir(t) {
    liste = tuiles.filter(function (x) { return !x.hidden; });
    index = Math.max(0, liste.indexOf(t));
    vis = document.createElement("div");
    vis.className = "visionneuse";
    vis.setAttribute("role", "dialog");
    vis.setAttribute("aria-modal", "true");
    vis.setAttribute("aria-label", "Photo agrandie");
    vis.innerHTML = '<div class="vis-image"><img alt=""></div><p></p>' +
      '<button class="vis-btn vis-fermer" aria-label="Fermer">×</button>' +
      '<button class="vis-btn vis-prec" aria-label="Photo précédente">‹</button>' +
      '<button class="vis-btn vis-suiv" aria-label="Photo suivante">›</button>';
    document.body.appendChild(vis);
    document.body.style.overflow = "hidden";
    afficher();
    vis.querySelector(".vis-fermer").addEventListener("click", fermer);
    vis.querySelector(".vis-prec").addEventListener("click", function () { index = (index - 1 + liste.length) % liste.length; afficher(); });
    vis.querySelector(".vis-suiv").addEventListener("click", function () { index = (index + 1) % liste.length; afficher(); });
    vis.addEventListener("click", function (e) { if (e.target === vis || e.target.classList.contains("vis-image")) fermer(); });
    var x0 = null;
    vis.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    vis.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { index = (index + (dx < 0 ? 1 : -1) + liste.length) % liste.length; afficher(); }
      x0 = null;
    });
    vis.querySelector(".vis-fermer").focus();
  }
  tuiles.forEach(function (t) { t.addEventListener("click", function () { ouvrir(t); }); });
  document.addEventListener("keydown", function (e) {
    if (!vis) return;
    if (e.key === "Escape") fermer();
    if (e.key === "ArrowRight") { index = (index + 1) % liste.length; afficher(); }
    if (e.key === "ArrowLeft") { index = (index - 1 + liste.length) % liste.length; afficher(); }
  });

  /* Avis clients : la section n'apparaît que s'il y a de vrais avis dans js/avis.js */
  var blocAvis = document.getElementById("avis");
  if (blocAvis) {
    var avis = window.AVIS || [];
    if (avis.length) {
      var grille = blocAvis.querySelector(".grille-avis");
      avis.forEach(function (a) {
        var art = document.createElement("article");
        art.className = "avis";
        var n = Math.max(1, Math.min(5, a.note || 5));
        art.innerHTML = '<div class="etoiles" aria-label="' + n + ' sur 5">' + "★★★★★".slice(0, n) + "</div><blockquote></blockquote><cite></cite>";
        art.querySelector("blockquote").textContent = "« " + a.texte + " »";
        art.querySelector("cite").textContent = a.nom + (a.lieu ? " · " + a.lieu : "");
        grille.appendChild(art);
      });
      blocAvis.hidden = false;
    }
  }

  /* Formulaire de devis : ouvre WhatsApp avec le message prérempli */
  var form = document.getElementById("form-devis");
  if (form) {
    var choix = form.querySelector("#prestation");
    var ancre = decodeURIComponent((location.hash || "").slice(1));
    if (ancre && choix) {
      Array.prototype.forEach.call(choix.options, function (o) { if (o.getAttribute("data-ancre") === ancre) choix.value = o.value; });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["nom", "telephone", "message"].forEach(function (id) {
        var champ = form.querySelector("#" + id);
        var err = form.querySelector('[data-erreur="' + id + '"]');
        var vide = !champ.value.trim();
        if (err) err.textContent = vide ? "Ce champ est nécessaire pour vous recontacter." : "";
        if (vide) ok = false;
      });
      if (!ok) { form.querySelector(".erreur:not(:empty)").previousElementSibling.focus(); return; }
      var v = function (id) { var c = form.querySelector("#" + id); return c ? c.value.trim() : ""; };
      var texte = "Bonjour JJ Fait la Déco, je souhaite un devis.\n\n" +
        "Nom : " + v("nom") + "\n" +
        "Téléphone : " + v("telephone") + "\n" +
        "Prestation : " + v("prestation") + "\n" +
        (v("lieu") ? "Commune / ville : " + v("lieu") + "\n" : "") +
        "\nMon projet : " + v("message");
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texte);
      var lien = form.querySelector("#lien-wa");
      lien.href = url;
      lien.hidden = false;
      window.location.href = url;
    });
  }

  /* Visites 360° des chantiers */
  var blocVisites = document.getElementById("visites");
  var visites = window.VISITES || [];
  if (blocVisites && visites.length) {
    blocVisites.hidden = false;
    var lien = document.createElement("link");
    lien.rel = "stylesheet"; lien.href = "css/pannellum.css";
    document.head.appendChild(lien);
    var visionneuse360 = null;
    var onglets = document.getElementById("visite-onglets");
    var zonePieces = document.getElementById("visite-pieces");
    var aide360 = document.getElementById("visite-aide");

    function etiquette(div, texte) {
      var s = document.createElement("span");
      s.textContent = texte;
      div.appendChild(s);
    }
    function scenes(chantier) {
      var res = {};
      chantier.pieces.forEach(function (p) {
        var angle = p.angle || 360;
        var hauteur = angle >= 360 ? 180 : Math.min(180, angle / 4.3);
        var cfg = {
          type: "equirectangular", panorama: p.image,
          yaw: p.depart || 0, hfov: 95,
          hotSpots: []
        };
        if (angle < 360) {
          cfg.haov = angle; cfg.vaov = hauteur;
          cfg.minPitch = -hauteur / 2; cfg.maxPitch = hauteur / 2;
          cfg.minYaw = -angle / 2; cfg.maxYaw = angle / 2;
        }
        (p.passages || []).forEach(function (l) {
          cfg.hotSpots.push({ type: "scene", sceneId: l.vers, yaw: l.direction, pitch: l.hauteur || -6,
            cssClass: "visite-passage", createTooltipFunc: etiquette, createTooltipArgs: l.titre });
        });
        (p.points || []).forEach(function (pt) {
          cfg.hotSpots.push({ type: "info", yaw: pt.direction, pitch: pt.hauteur || 0,
            cssClass: "visite-point", createTooltipFunc: etiquette, createTooltipArgs: pt.texte });
        });
        res[p.id] = cfg;
      });
      return res;
    }
    function boutonsPieces(chantier) {
      zonePieces.innerHTML = "";
      chantier.pieces.forEach(function (p) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = p.titre; b.dataset.id = p.id;
        b.addEventListener("click", function () { visionneuse360.loadScene(p.id); });
        zonePieces.appendChild(b);
      });
    }
    function marquerPiece(id) {
      zonePieces.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.id === id)); });
    }
    function ouvrir(index) {
      var chantier = visites[index];
      onglets.querySelectorAll("button").forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === index)); });
      if (visionneuse360) visionneuse360.destroy();
      visionneuse360 = window.pannellum.viewer("visite-vue", {
        "default": { firstScene: chantier.pieces[0].id, sceneFadeDuration: 900, autoLoad: true,
          autoRotate: -2, autoRotateInactivityDelay: 8000, showControls: false, compass: false },
        scenes: scenes(chantier)
      });
      visionneuse360.on("scenechange", marquerPiece);
      visionneuse360.on("mousedown", function () { aide360.classList.add("cache"); });
      visionneuse360.on("touchstart", function () { aide360.classList.add("cache"); });
      boutonsPieces(chantier);
      marquerPiece(chantier.pieces[0].id);
    }
    function demarrer() {
      if (visites.length > 1) {
        visites.forEach(function (c, i) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "puce"; b.textContent = c.nom;
          b.addEventListener("click", function () { ouvrir(i); });
          onglets.appendChild(b);
        });
      } else {
        onglets.hidden = true;
      }
      ouvrir(0);
      setTimeout(function () { aide360.classList.add("cache"); }, 7000);
    }
    var lancee = false;
    function charger() {
      if (lancee) return; lancee = true;
      var sc = document.createElement("script");
      sc.src = "js/pannellum.js"; sc.onload = demarrer;
      document.body.appendChild(sc);
    }
    if ("IntersectionObserver" in window) {
      var obs360 = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { charger(); obs360.disconnect(); } }, { rootMargin: "400px" });
      obs360.observe(blocVisites);
    } else { charger(); }
  }

  /* Réservation de location meublée */
  document.querySelectorAll(".form-resa").forEach(function (form) {
    var prix = parseInt(form.dataset.prix, 10) || 0;
    var arrivee = form.querySelector('[name="arrivee"]'), depart = form.querySelector('[name="depart"]');
    var zoneNuits = form.querySelector(".loc-nuits"), zoneMontant = form.querySelector(".loc-montant");
    var noteRemise = form.querySelector(".loc-note-remise");
    function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    function lisible(v) { if (!v) return ""; var p = v.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
    function argent(n) { return n.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ") + " FCFA"; }
    var aujourdhui = iso(new Date());
    arrivee.min = aujourdhui; depart.min = aujourdhui;
    function nuits() {
      if (!arrivee.value || !depart.value) return 0;
      var n = Math.round((new Date(depart.value) - new Date(arrivee.value)) / 86400000);
      return n > 0 ? n : 0;
    }
    function maj() {
      if (arrivee.value) {
        var lendemain = new Date(arrivee.value); lendemain.setDate(lendemain.getDate() + 1);
        depart.min = iso(lendemain);
        if (depart.value && depart.value <= arrivee.value) depart.value = "";
      }
      var n = nuits();
      if (n) {
        zoneNuits.textContent = n + (n > 1 ? " nuits" : " nuit") + " × " + argent(prix);
        zoneMontant.textContent = argent(n * prix);
      } else {
        zoneNuits.textContent = "Choisissez vos dates";
        zoneMontant.textContent = "";
      }
      noteRemise.hidden = n < 7;
    }
    arrivee.addEventListener("change", maj);
    depart.addEventListener("change", maj);
    maj();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, premier = null;
      ["arrivee", "depart", "nom", "telephone"].forEach(function (nom) {
        var c = form.querySelector('[name="' + nom + '"]');
        var err = c.parentElement.querySelector(".erreur");
        var msg = c.value.trim() ? "" : "Ce champ est nécessaire.";
        if (nom === "depart" && !msg && !nuits()) msg = "La date de départ doit suivre l'arrivée.";
        if (err) err.textContent = msg;
        if (msg) { ok = false; if (!premier) premier = c; }
      });
      if (!ok) { premier.focus(); return; }
      var v = function (n) { return form.querySelector('[name="' + n + '"]').value.trim(); };
      var n = nuits();
      var texte = "Bonjour, je souhaite réserver la " + form.dataset.residence + ".\n\n" +
        "Arrivée : " + lisible(v("arrivee")) + "\n" +
        "Départ : " + lisible(v("depart")) + "\n" +
        "Durée : " + n + (n > 1 ? " nuits" : " nuit") + "\n" +
        "Nombre de personnes : " + v("personnes") + "\n" +
        "Montant estimé : " + argent(n * prix) + (n >= 7 ? " (long séjour, remise possible)" : "") + "\n\n" +
        "Nom : " + v("nom") + "\n" +
        "Téléphone : " + v("telephone") +
        (v("message") ? "\n\nMessage : " + v("message") : "");
      var url = "https://wa.me/" + form.dataset.wa + "?text=" + encodeURIComponent(texte);
      var lien = form.querySelector(".lien-wa-resa");
      lien.href = url; lien.hidden = false;
      window.location.href = url;
    });
  });

  /* Bouton pour remonter en haut de page */
  var haut = document.createElement("button");
  haut.type = "button"; haut.className = "haut-page"; haut.setAttribute("aria-label", "Remonter en haut de la page");
  haut.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(haut);
  haut.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  function majHaut() { haut.classList.toggle("visible", window.scrollY > window.innerHeight * 0.8); }
  window.addEventListener("scroll", majHaut, { passive: true });
  majHaut();

  /* Année du pied de page */
  document.querySelectorAll("[data-annee]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
