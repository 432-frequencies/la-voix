# LA VOIX

Application de consultation citoyenne : consulter des lois, voter, proposer et soutenir des réformes, comparer les prises de position. Interface React et API TypeScript avec PostgreSQL et Better Auth. Le fonctionnement local ne nécessite aucun compte Base44.

**État : version locale indépendante de Base44, sous licence MIT.** Le jeu fourni est fictif. Le nouveau projet repart volontairement de zéro : aucun compte, vote ou autre contenu de production de l’ancienne application n’est repris. Chacun peut utiliser, modifier et redistribuer le code en conservant la notice de licence. Voir [l’avancement](docs/AVANCEMENT.md).

## Démarrage sur son ordinateur

Prérequis : Node.js 22.12 ou plus récent, npm, connexion Internet pour installer les dépendances. Exécuter sous un compte utilisateur normal, pas root.

```sh
npm ci
npm run dev
```

Ouvrir **http://localhost:5173** (utiliser `localhost`, comme dans `APP_URL`). Le premier lancement crée un `.env` privé avec des secrets aléatoires, initialise PostgreSQL et ajoute une loi fictive. PostgreSQL embarqué est réservé au développement ; ses binaires sont fournis par une dépendance npm. Les systèmes pris en charge sont ceux de `embedded-postgres`.

- API : `127.0.0.1:3001`, accessible au navigateur par `/api`.
- PostgreSQL local : `127.0.0.1:55432` ; données persistantes dans `.local/postgres`.
- Confirmation de compte et récupération de mot de passe : **http://localhost:5173/dev-mail**. Aucun courriel réel n’est envoyé sans configuration SMTP.
- Créer un compte depuis « Se connecter ». Un mot de passe de 12 caractères minimum est demandé. Confirmer l’adresse dans la boîte locale avant de participer.
- `Ctrl+C` arrête les services. `npm run dev` les relance sans effacer les données.
- Ne pas supprimer `.local` ou `.env` pour une mise à jour : ils contiennent les données et secrets de votre instance.

Si un `.env` existe, il est respecté. Pour un PostgreSQL externe, renseigner `DATABASE_URL`, `BETTER_AUTH_SECRET` et `APP_URL` à partir de `.env.example`. Le lancement embarqué ne s’active que pour `127.0.0.1:55432`. Ne pas utiliser ce port pour un autre serveur.

## Commandes

| Commande | Usage |
|---|---|
| `npm run dev` | Base locale, migrations, exemples, API et interface |
| `npm run build` | Construction de l’interface |
| `npm start` | API seule ; servir aussi `dist` avec `SERVE_WEB=true` |
| `npm run db:migrate` | Schéma d’authentification et migrations SQL du domaine |
| `npm run db:seed` | Ajouter les exemples sans écraser les contenus existants |
| `npm run content:import -- fichier.json` | Valider un lot de lois et articles |
| `npm run content:import -- fichier.json --apply` | Importer ce lot en transaction |
| `npm run db:backup` | Sauvegarde privée cohérente dans `backups/` |
| `npm run db:restore -- sauvegarde.json` | Restaurer uniquement dans une base migrée et vide |
| `npm test` | Tests d’intégration avec une base PostgreSQL temporaire |
| `npm run lint` | Analyse du frontend |
| `npm run typecheck` | Vérification TypeScript stricte du serveur et des scripts |

Le contrôle `typecheck:legacy` conserve l’ancien contrôle JS de l’export. Il comporte des erreurs préexistantes d’inférence des composants React et n’est pas présenté comme une validation réussie du frontend. Le frontend est vérifié par le build, le lint et les parcours navigateur.

## Docker Compose

Une configuration locale alternative est fournie. Docker n’était pas disponible sur la machine de développement : cette voie doit encore être exécutée et vérifiée.

1. Préparer `.env` avec un `BETTER_AUTH_SECRET` aléatoire et un `POSTGRES_PASSWORD` aléatoire (valeur hexadécimale recommandée pour l’URL de connexion).
2. Exécuter `docker compose up --build`.
3. Ouvrir http://localhost:8080 et la boîte de test http://localhost:8025.
4. Pour ajouter les exemples : `docker compose exec app npm run db:seed`.

Compose démarre avec une base vide et une boîte SMTP de développement. Il expose uniquement des ports sur l’interface locale. Ce fichier n’est pas une configuration de production.

## Hébergement public

Voir [EXPLOITATION.md](docs/EXPLOITATION.md). Utiliser une base PostgreSQL gérée ou administrée, HTTPS et un service SMTP. Définir `NODE_ENV=production`, `APP_URL=https://votre-domaine`, `DATABASE_URL` et `BETTER_AUTH_SECRET`. Les migrations sont une étape préalable au démarrage, pas une opération exécutée à chaque requête.

Un [Blueprint Render d’essai](docs/DEPLOIEMENT_RENDER.md) prépare un service web gratuit et une base PostgreSQL gratuite de 30 jours. Il nécessite un compte Render et un relais de courriel configuré ; le site n’est en ligne qu’une fois ces ressources créées et vérifiées.

Pour une publication iPhone, voir le [plan App Store](docs/APP_STORE.md) et le [plan d’intégration iOS](docs/PLAN_INTEGRATION_IOS.md). La création du service Render est volontairement reportée à la phase finale afin de conserver les 30 jours gratuits pour les essais proches du lancement.

Le [guide de développement iOS](docs/IOS_DEVELOPMENT.md) décrit la compilation Xcode, la configuration HTTPS de l’API et les essais sans Render. Le projet iOS utilise une valeur temporaire pour l’identifiant d’application, à remplacer avant la signature de distribution.

La connexion Google est optionnelle : définir `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET`, et enregistrer le callback `APP_URL/api/auth/callback/google`. Elle n’a pas été testée avec un fournisseur réel. Les rappels Google Calendar de l’ancienne application ne sont pas encore migrés.

## Participer

Les conventions et la gouvernance proposée figurent dans [CONTRIBUTING.md](CONTRIBUTING.md) et [GOVERNANCE.md](GOVERNANCE.md). Le dépôt ne contient aucun historique de production, aucune clé de service et aucune sauvegarde. Le code est distribué sous [licence MIT](LICENSE). L’hébergement d’une instance publique exige encore un exploitant, une base persistante, HTTPS, SMTP et une politique sur les données personnelles.
