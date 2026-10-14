/* Visites 360° des chantiers de JJ Fait la Déco
   ------------------------------------------------------------
   La section « Visitez nos chantiers » de l'accueil reste cachée tant que cette liste est vide.

   1. Déposez les panoramas dans le dossier img/visites/ (un fichier .jpg par pièce).
   2. Ajoutez un chantier sur ce modèle :

   {
     nom: "Villa Cocody",                      // nom affiché sur l'onglet
     pieces: [
       {
         id: "salon",                          // identifiant court, sans espace ni accent
         titre: "Salon",                       // nom affiché
         image: "img/visites/villa-salon.jpg",
         angle: 280,                           // largeur du panorama en degrés : 360 pour une caméra 360°, environ 280 pour le mode Pano de l'iPhone
         depart: 0,                            // direction de départ du regard, en degrés
         passages: [                           // flèches pour aller dans une autre pièce
           { vers: "cuisine", direction: 60, titre: "Cuisine" }
         ],
         points: [                             // étiquettes facultatives sur l'image
           { direction: -20, hauteur: -10, texte: "Faux plafond avec gorge LED" }
         ]
       },
       { id: "cuisine", titre: "Cuisine", image: "img/visites/villa-cuisine.jpg", angle: 280, depart: 0,
         passages: [ { vers: "salon", direction: -120, titre: "Salon" } ] }
     ]
   },

   Les chantiers sont séparés par une virgule.
*/
window.VISITES = [
];
