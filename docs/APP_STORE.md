# Chemin vers l’App Store d’Apple

État au 26 octobre 2026 : LA VOIX est une application web React avec API Node/PostgreSQL. Il n’existe pas encore de projet iOS, de build TestFlight ni de fiche App Store. Le Blueprint Render est prêt dans le dépôt, mais **il ne faut pas créer la base gratuite avant la phase finale** : ses 30 jours commencent à sa création, pas à la publication de l’app.

## 1. Décisions à prendre tôt, sans démarrer Render

- Désigner l’éditeur de l’application et l’exploitant des données. Le code MIT reste libre et chacun peut le modifier, mais Apple exige un titulaire de compte pour publier. Sous un compte individuel, le nom légal de la personne apparaît comme vendeur ; une organisation/association légalement constituée peut publier sous son nom après vérification. L’adhésion Apple Developer Program coûte normalement 99 USD/an, en devise locale selon le pays. Sources : [inscription](https://developer.apple.com/help/account/membership/program-enrollment), [tarif](https://developer.apple.com/programs/whats-included/).
- Définir ce que signifie le « vote citoyen » : consultation participative non officielle, sans prétention à représenter un scrutin institutionnel. Prévoir des sources vérifiables pour chaque loi et des dates tenues à jour ; supprimer le contenu fictif de la version destinée à l’App Store.
- Choisir une infrastructure durable pour le lancement réel. La base gratuite Render expire après 30 jours et n’inclut pas de sauvegarde gérée : elle convient à un essai/TestFlight, pas à la conservation durable de comptes et de votes. Source : [Render Free](https://render.com/docs/free).

## 2. Construire la version iPhone hors ligne et en local

- Ajouter un projet iOS à partir de l’interface existante, par exemple avec Capacitor, puis adapter navigation, taille des écrans, clavier, liens profonds et accessibilité. Tester sur de vrais iPhone. Ajouter une valeur propre à l’app mobile (par exemple lecture hors ligne, partage natif ou notifications pertinentes) : Apple peut refuser un simple site emballé dans une WebView. Source : [App Review, règle 4.2](https://developer.apple.com/app-store/review/guidelines/).
- Ajouter dans l’application la suppression du compte et des données associées, avec confirmation claire. Apple l’exige pour les applications qui permettent de créer un compte. Source : [suppression du compte](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion/).
- Ajouter filtrage des contenus, signalement, blocage et traitement de la modération des réformes/avis publiés par les membres, ainsi qu’un contact public. Source : [App Review, règle 1.2](https://developer.apple.com/app-store/review/guidelines/).
- Rédiger et afficher la politique de confidentialité : données collectées (courriel, compte, votes et opinions), finalités, prestataires, conservation et suppression. Préparer les réponses de confidentialité App Store Connect. Source : [App Review, règle 5.1.1](https://developer.apple.com/app-store/review/guidelines/).
- Si la connexion Google devient disponible sur iOS, vérifier la règle Apple sur les services de connexion équivalents. Le parcours courriel propre à l’application peut rester le parcours principal. Source : [App Review, règle 4.8](https://developer.apple.com/app-store/review/guidelines/).

## 3. Préparer la soumission avant le compte à rebours Render

- Ouvrir l’adhésion Apple Developer au nom de l’éditeur retenu, créer l’identifiant iOS, les certificats/signatures et l’entrée App Store Connect. Préparer l’icône, les captures iPhone, la description, l’âge conseillé, les URL d’assistance et de confidentialité. Source : [soumission Apple](https://developer.apple.com/app-store/submitting/).
- Vérifier les flux mobiles avec une API de préproduction non éphémère ou locale, des comptes fictifs et un relais courriel de test. Tester inscription, confirmation, vote, récupération, modération, suppression, absence de réseau et mise à jour.
- Construire un binaire et faire passer les vérifications automatiques et les premiers essais TestFlight. Pour l’examen Apple, prévoir un compte de démonstration pleinement fonctionnel et une API joignable ; Apple demande que les services backend restent accessibles pendant la revue. Une version explicitement bêta ou d’essai relève de TestFlight, pas de la fiche App Store publique. Source : [App Review, règles 2.1 et 2.2](https://developer.apple.com/app-store/review/guidelines/).

## 4. Dernier moment : Render, TestFlight final et publication

1. Quand le binaire, les contenus réels, la modération, le relais courriel et la fiche App Store sont prêts, créer la base et le service depuis [`render.yaml`](../render.yaml). **C’est à cet instant que commencent les 30 jours de la base gratuite.**
2. Vérifier l’URL HTTPS, `/api/health`, les courriels réels, les parcours iPhone, la sauvegarde et la restauration. Remplacer les données fictives et `DEMO_MODE=true` par le contenu public avant la soumission App Store.
3. Fournir à Apple un compte de démonstration et garder l’API disponible pendant la revue. Après approbation, publier l’app seulement avec une solution de base durable ou un plan ferme de migration/sauvegarde avant l’expiration.

Le code open source et l’app distribuée sont deux choses distinctes : la licence MIT n’exige pas de propriétaire unique du projet, mais l’App Store impose un éditeur légal responsable de sa fiche et de son exploitation.
