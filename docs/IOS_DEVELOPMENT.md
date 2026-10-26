# Développement iPhone local

Le projet iOS est dans `ios/App/App.xcodeproj`. Il contient les ressources React construites localement par Capacitor ; l’API Node/PostgreSQL reste un service séparé. Aucun compte Render n’est nécessaire pour compiler ou essayer l’application.

## Prérequis

- macOS avec Xcode 26 ou plus récent et ses outils de ligne de commande ; ce dépôt a été compilé avec Xcode 26.4.
- Node.js 22.12 ou plus récent et npm.
- Une URL **HTTPS** accessible depuis le simulateur ou l’iPhone pour l’API de test. Une adresse `localhost` ne fonctionne pas sur un appareil physique et est refusée par le script de build iOS.
- Des comptes et des contenus fictifs uniquement pour les essais. La boîte de test locale `/dev-mail` reste accessible sur le Mac, sans être exposée publiquement.

## Construire

```sh
npm ci
IOS_API_ORIGIN=https://api-de-test.example.org npm run ios:sync
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17e' CODE_SIGNING_ALLOWED=NO build
```

Remplacer le domaine d’exemple par une véritable API HTTPS de test. `ios:sync` construit `dist/`, y inclut **l’origine publique** de l’API et synchronise les fichiers dans le projet Xcode. Un changement du frontend ou de l’URL exige une nouvelle synchronisation. Ouvrir Xcode avec `npm run ios:open` pour démarrer un simulateur ou signer l’app sur un iPhone. L’identifiant `org.lavoix.mobile` est provisoire ; l’équipe Apple et le Bundle ID définitifs ne sont pas dans le dépôt. Ne pas commiter de certificats, de profils ni de secrets.

Avant d’archiver une version destinée à la distribution, exécuter `IOS_RELEASE_API_ORIGIN=https://votre-domaine npm run ios:release-check` après `ios:sync`. Ce contrôle refuse un `server.url`, une URL de tunnel et l’absence du domaine attendu dans les ressources embarquées.

Pour démarrer l’API locale, suivre le [README](../README.md). Un tunnel HTTPS de développement temporaire vers le port 3001 peut donner accès au téléphone sans démarrer Render. Dans ce cas, définir `APP_URL` à l’origine du tunnel, `IOS_APP_ORIGIN=capacitor://localhost`, et utiliser des identifiants fictifs. Arrêter le tunnel après l’essai. Les liens de confirmation et de récupération sont générés pour l’URL web `APP_URL` ; ils s’ouvrent dans le navigateur et l’utilisateur revient ensuite se connecter dans l’app. Une boîte de réception de test joignable sur le téléphone sera nécessaire pour valider le parcours complet.

## Sessions et données sur l’appareil

Le web conserve les cookies de session Better Auth. L’application iPhone demande un jeton de session signé via le plugin Bearer de Better Auth et le garde dans le trousseau iOS. Il n’est pas stocké dans `localStorage`, dans une URL ou dans Git. La déconnexion révoque la session côté serveur et efface le trousseau. Un marqueur local efface aussi un ancien jeton conservé par iOS après une réinstallation. Les textes sauvegardés hors ligne sont publics et résident dans le stockage local de l’app ; les votes et données de compte ne sont pas sauvegardés hors ligne.

Le build iPhone accepte uniquement l’origine `capacitor://localhost` si `IOS_APP_ORIGIN` est explicitement configuré sur l’API ; CORS reste limité à cette origine. L’API de test doit conserver un certificat TLS valide. Ne jamais utiliser `server.url` dans `capacitor.config.ts` pour une version distribuée : les ressources web doivent être intégrées à l’app.

## Vérifications restantes avant TestFlight

Les tests automatisés valident les requêtes API, CORS et les règles métier, et Xcode valide la compilation simulateur. La session, la confirmation par courriel, le retour après fermeture, le vote, le partage, la lecture hors ligne, le clavier, VoiceOver et la perte de réseau doivent encore être rejoués sur un iPhone réel avec l’équipe de signature Apple. Les Universal Links requièrent le domaine public stable, le Bundle ID et l’identifiant de l’équipe Apple ; leur configuration finale est donc reportée à ce choix. Render ne doit être créé qu’à la phase de lancement.
