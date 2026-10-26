# Plan d’intégration iPhone — étape 1

Version du 26 octobre 2026. Objet : transformer l’application web LA VOIX existante en une vraie application iPhone testable localement, sans encore créer de ressource Render ni soumettre à Apple.

## Résultat attendu

Un projet iOS versionné dans le dépôt, compilable avec Xcode, qui conserve les fonctions web essentielles (lecture des lois, compte, vote, réformes, partage) et apporte une expérience adaptée à l’iPhone. Un build **Release** contient les ressources web dans l’application ; il n’ouvre pas simplement le site distant dans une WebView. Les données restent servies par l’API Node/PostgreSQL existante. Pour les essais, l’API est accessible depuis un environnement local ou de préproduction séparé de Render.

Cette étape ne prétend pas rendre l’app publiable immédiatement : suppression de compte, modération, confidentialité, contenus réels, compte Apple Developer et fiche App Store sont les lots suivants du [plan général](APP_STORE.md). Elle ne démarre pas le compte à rebours des 30 jours gratuits.

## Constat sur le dépôt

| Élément | État actuel | Conséquence iOS |
|---|---|---|
| Interface | React/Vite, `dist/`, `BrowserRouter` | Réutilisable dans Capacitor avec adaptation des liens entrants et du bouton Retour |
| API | `fetch('/api…')` avec `credentials: 'same-origin'` dans `src/api/client.js` | Échoue depuis l’origine `capacitor://localhost` ; créer un client à URL de base configurable |
| Sécurité serveur | Vérification stricte de `Origin` dans `server/app.ts` ; Better Auth fait confiance à `APP_URL` | Définir explicitement l’origine mobile et les réponses CORS nécessaires, sans `*` ni relâchement global |
| Sessions | Better Auth par cookies web | Vérifier sur appareil le comportement de session entre WebView et API ; ne pas supposer qu’un login navigateur persiste dans l’app |
| Courriels | Confirmation et récupération redirigent vers des chemins web | Prévoir un retour fiable vers l’app, avec repli web et validation des URL |
| Partage | URL construite depuis `window.location.origin` | Utiliser l’URL HTTPS publique du contenu, jamais `capacitor://localhost` |
| Navigation externe | Articles, OAuth optionnel et réseaux sociaux | Ouvrir les sites externes hors de la WebView de confiance ; valider les retours vers l’app |
| Présentation | Quelques `safe-area-inset-top`, viewport adapté | Compléter les zones sûres, le clavier, l’accessibilité et les états sans réseau |

## Choix technique proposé

Utiliser **Capacitor** pour empaqueter les fichiers Vite et ajouter seulement les fonctions iOS nécessaires. C’est le chemin le plus court pour conserver l’interface React ; il laisse le code web et l’API auto-hébergeables sous MIT. La documentation officielle indique que Capacitor s’intègre à un projet web disposant de `package.json`, d’un `index.html` et d’un répertoire de build, comme ce dépôt, puis ajoute un projet Xcode via `npx cap add ios`. La version courante exige Xcode 26.0 ou plus ; Xcode 26.4 est installé ici. [Installation](https://capacitorjs.com/docs/getting-started), [iOS](https://capacitorjs.com/docs/ios).

Le périmètre initial est **iPhone**. Le support iPad est à décider avant la fiche App Store ; ne pas l’annoncer tant que l’interface n’y est pas vérifiée. Le nom, le Bundle ID et l’équipe de signature seront fixés avec l’éditeur Apple choisi ; utiliser des valeurs de développement temporaires jusque-là.

## Lots de réalisation et portes de validation

### Lot 0 — Faisabilité et base de référence (1–2 jours)

1. Vérifier les versions Node, Xcode et iOS réellement disponibles, puis conserver les résultats dans la documentation.
2. Rejouer `npm ci`, lint, contrôle TypeScript, tests et build sur la branche de travail ; photographier le comportement mobile web de référence.
3. Choisir un accès **HTTPS de développement** à l’API depuis un simulateur et un iPhone réel, avec données et comptes fictifs. Prévoir une boîte ou un relais de courriel de test accessible au téléphone : la boîte `/dev-mail` actuelle reste réservée au `localhost` du Mac. Ne pas modifier la configuration Release pour accepter HTTP ou ignorer la validation TLS.

**Passage :** projet web vert, API de test joignable depuis le téléphone, aucun compte Render créé.

### Lot 1 — Projet iOS reproductible (1–2 jours)

1. Installer des versions compatibles de `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` et des plugins nécessaires, en fixant les versions dans `package-lock.json`.
2. Configurer `webDir: 'dist'`, générer `ios/`, versionner le projet Xcode et documenter `npm run build`, `npx cap sync ios`, puis la compilation simulateur. Ne pas inscrire de clé ou certificat de signature dans Git.
3. Garder l’interface web ordinaire inchangée ; aucun `server.url` distant dans le build Release. Ajouter une commande de vérification qui refuse un bundle Release pointant vers `localhost` ou une URL de développement.

**Passage :** lancement de l’écran d’accueil dans le simulateur, après clone vierge et sans dépendance Base44 ni Render.

### Lot 2 — API et authentification sur appareil (3–5 jours, chemin critique)

1. Introduire une configuration contrôlée pour l’URL HTTPS de l’API et l’URL HTTPS publique de partage. Le web conserve `/api` relatif ; iOS utilise une URL de test explicite, remplacée au build de lancement.
2. Ajouter uniquement les origines nécessaires aux endpoints API et à Better Auth. Vérifier requêtes `OPTIONS`, en-têtes autorisés, refus des origines inconnues et comportement des cookies/jetons sur WKWebView. Garder les protections CSRF et l’authentification du web intactes.
3. Réaliser d’abord un **spike sur un vrai iPhone** : inscription, réception du lien, confirmation, connexion, redémarrage de l’app, vote, modification du vote, déconnexion. Si les cookies inter-origines ne sont pas fiables, évaluer un mécanisme mobile explicite avec Better Auth et stockage natif protégé ; ne jamais mettre un jeton durable dans une URL, le code source ou `localStorage` par facilité. Documenter la décision et ses tests.
4. Garder Google OAuth désactivé dans le premier build iOS, sauf si son retour dans l’app et les exigences Apple sont traités séparément. Le compte courriel suffit au premier parcours.

**Passage :** les parcours ci-dessus fonctionnent sur appareil réel et dans le navigateur ; aucun utilisateur ne peut voter pour un autre, aucune origine arbitraire n’est acceptée, aucune donnée d’authentification n’est journalisée.

### Lot 3 — Navigation et fonctions propres à l’iPhone (3–4 jours)

1. Gérer les liens entrants vers une loi, une réforme, la confirmation d’adresse et la récupération du compte. Préférer les **Universal Links** HTTPS et un domaine stable ; prévoir un repli dans Safari si l’app n’est pas installée. Les liens sont vérifiés et ne déclenchent jamais d’écriture sensible directement. Le fichier `apple-app-site-association` et l’entitlement ne seront activés qu’avec le Bundle ID et le domaine retenus. [Capacitor](https://capacitorjs.com/docs/guides/deep-links), [Apple](https://developer.apple.com/documentation/xcode/supporting-associated-domains).
2. Ajouter un vrai partage iOS des liens HTTPS et une liste locale de textes sauvegardés pour une **lecture hors ligne**. Mettre en évidence la date de synchronisation ; aucun vote n’est mis en file d’attente hors ligne, et aucune opinion ou donnée de compte n’est mise en cache sans besoin précis.
3. Ouvrir les articles externes avec le navigateur système ou une vue dédiée sûre ; empêcher les domaines externes de prendre la place de l’interface de l’app. Adapter navigation, retour, zones sûres, clavier et affichage des erreurs réseau.

**Passage :** un lien partagé s’ouvre au bon endroit, le mode hors ligne permet de lire un texte déjà sauvegardé et interdit clairement de voter, les sites externes restent identifiables. Ces fonctions donnent à l’app une utilité mobile au-delà d’un simple site empaqueté, sans garantir à elles seules l’acceptation par Apple. [Règle 4.2](https://developer.apple.com/app-store/review/guidelines/).

### Lot 4 — Qualité, sécurité et livraison technique (2–4 jours)

1. Tester au minimum un petit et un grand iPhone en simulateur, puis un iPhone réel : installation propre, mise à jour, clavier, gestes, mode sombre, taille de texte augmentée, VoiceOver, perte puis retour de réseau.
2. Rejouer les parcours de consultation, inscription, confirmation, récupération, vote unique, modification, création de réforme et partage. Tester URL malformée, session expirée, serveur indisponible, CORS refusé et lien de courriel déjà consommé.
3. Faire passer CI web et API, ajouter une compilation iOS reproductible sur Mac et documenter les étapes manuelles de signature. Inspecter le bundle pour secrets, URL de test, accès HTTP et permissions inutiles.
4. Livrer une archive iOS de développement installable et un guide pour reconstruire à partir du dépôt. Les certificats de distribution et TestFlight attendent le titulaire Apple Developer.

**Passage final de l’étape 1 :** app iPhone réellement testée, tous les parcours essentiels vérifiés, site web toujours fonctionnel, aucune donnée de production ni service Render créé. Les écarts restants sont listés avant d’ouvrir l’étape App Store suivante.

## Planning et dépendances

**Estimation : 10 à 17 journées de travail**, surtout selon le résultat du spike d’authentification et les retouches d’interface. C’est une fourchette de réalisation, pas une promesse de date ni de validation Apple. Si le modèle de session actuel doit être remplacé sur mobile, réserver du temps supplémentaire pour la revue de sécurité et les tests de régression.

L’utilisateur devra décider, avant la signature finale, de l’éditeur App Store (personne ou structure), du domaine public stable et d’un iPhone de test. Ces décisions ne bloquent ni le prototype iOS ni le travail local. Le dépôt et les données fictives suffisent pour démarrer ; **l’offre Render de 30 jours reste intacte jusqu’à la phase de lancement**.
