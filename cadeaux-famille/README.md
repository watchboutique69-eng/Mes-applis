# 🎁 Cadeaux en famille

Application web (installable sur téléphone) pour organiser les cadeaux en famille.

## Fonctionnalités

- **Ma liste** : chacun note ses envies (lien, prix indicatif, niveau d'envie, précisions).
- **Famille** : on consulte les listes des autres et on clique sur « Je l'offre » pour réserver une idée.
  Les autres voient qu'elle est prise (fini les doublons), mais **la personne concernée ne voit jamais les réservations**.
- **Idées secrètes** : « 💡 Suggérer » ajoute une idée sur la liste de quelqu'un d'autre ; elle est visible et réservable
  par toute la famille, sauf par la personne concernée.
- **Prochaines occasions** : compte à rebours jusqu'à Noël et aux anniversaires (dates à saisir dans les réglages).
- **À offrir** : récapitulatif de ses réservations par destinataire, case « acheté » et budget estimé.
  Si quelqu'un retire de sa liste une idée que vous aviez réservée, vous en êtes averti ici.
- **Tirage** : tirage au sort façon Père Noël secret, avec exclusions (ex. les couples). Chacun ne voit que son résultat.
- Gestion des membres (prénom + emoji), export/import des données en JSON, mode sombre, fonctionne hors ligne.

## Lancer l'application

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
cd cadeaux-famille
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Pour la mettre en ligne gratuitement, activez **GitHub Pages** sur le dépôt
(Settings → Pages → branche principale) : l'application sera disponible à
`https://<utilisateur>.github.io/Mes-applis/cadeaux-famille/`.
Sur téléphone, « Ajouter à l'écran d'accueil » l'installe comme une application.

## Mode local ou mode partagé

Par défaut l'application est en **mode local** : les données restent dans le navigateur de l'appareil
(pratique pour essayer, ou si toute la famille utilise la même tablette).

Pour que chacun l'utilise depuis son propre téléphone, activez le **mode partagé** avec Firebase (gratuit) :

1. Créez un projet sur <https://console.firebase.google.com>.
2. Dans **Firestore Database**, créez une base (mode production).
3. Dans **Paramètres du projet → Vos applications**, ajoutez une application Web et copiez l'objet `firebaseConfig`.
4. Collez-le dans [`firebase-config.js`](firebase-config.js) à la place de `null`.
5. Dans Firestore → **Règles**, autorisez l'accès aux espaces famille :

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /familles/{famille}/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

Au premier lancement, l'application demande un **code famille** (ex. `dupont-noel-2026`).
Partagez ensuite le lien d'invitation (Réglages → « Copier le lien d'invitation ») avec la famille.

> Il n'y a pas de comptes ni de mots de passe : toute personne connaissant le code famille peut voir les listes.
> Choisissez un code difficile à deviner. Le secret des réservations et du tirage repose sur la confiance :
> l'application ne les affiche pas, mais quelqu'un de très curieux pourrait les retrouver dans les données.

## Tests

```bash
cd cadeaux-famille
node --test tests/*.test.mjs
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html`, `style.css` | Page et mise en forme |
| `app.js` | Interface et logique de l'application |
| `storage.js` | Stockage local (localStorage) ou partagé (Firestore) |
| `draw.js` | Algorithme du tirage au sort |
| `events.js` | Calcul des prochaines occasions (Noël, anniversaires) |
| `firebase-config.js` | Configuration Firebase optionnelle |
| `sw.js`, `manifest.webmanifest`, `icon.svg` | Installation sur téléphone et hors ligne |
