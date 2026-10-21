# Avancement de la migration — 21 octobre 2026

## Réalisé et vérifié

- Code de l’interface récupéré depuis le ZIP, avec empreinte de l’archive dans `docs/SOURCE.md`. Le plugin et le SDK Base44 ont été retirés de l’application active ; la configuration et les fonctions d’origine restent seulement dans `.local/base44-export`, ignoré par Git, pour consultation pendant la migration.
- API TypeScript et base PostgreSQL indépendantes. Installation locale par `npm ci` puis `npm run dev`, sans Docker ni compte Base44. La base, les comptes et les votes persistent après redémarrage.
- Comptes par courriel, confirmation, connexion, récupération du mot de passe et connexion Google optionnelle (seul le parcours courriel local a été testé).
- Consultation publique des lois et résultats ; votes liés au compte, uniques par loi, modifiables avant clôture, avec accès aux choix individuels limité au compte concerné.
- Réformes, soutiens, seuil de 25, affirmations, prises de position et carte des opinions remplacés côté serveur. Les calculs ne dépendent plus des limites de lecture de l’export.
- Import de contenus structurés (lois et articles), sauvegarde privée et restauration dans une base vide. Tests d’intégration du vote concurrent, des permissions, des agrégations, de la récupération de compte et d’un redémarrage réel de PostgreSQL.
- Interface vérifiée en local pour inscription, confirmation, vote, modification du vote, création de réforme, soutien et publication d’un avis fictif.
- README, documentation d’exploitation, guide de contribution, proposition de gouvernance et CI préparés.
- Dépôt [GitHub public](https://github.com/432-frequencies/la-voix) créé sur `main`, licence MIT appliquée. La vérification GitHub Actions est en cours lors de cette mise à jour.

Les tests d’intégration utilisent une base et des comptes fictifs. La base locale contient aussi un compte et des participations fictifs créés pendant la vérification navigateur ; rien de cela n’est suivi dans Git. Le choix du 21 octobre est la licence MIT et un démarrage public sans reprise des comptes ni votes historiques.

## Reste à faire avant l’ouverture d’une instance publique

1. **Clarifier les rappels Google Calendar** : l’ancien code utilise un calendrier connecté par le rôle de service. Déterminer si le nouveau calendrier doit être collectif ou propre à chaque membre, puis implémenter et tester l’option retenue.
2. **Préparer l’exploitation publique** : domaine, hébergement, SMTP, sauvegardes programmées, responsabilités, modération, suppression de compte et informations sur les données personnelles. Le Compose local fourni n’a pas été exécuté ici, faute de Docker sur cette machine.
3. **Contrôler les futurs médias et contenus** : éviter de publier des textes ou photographies sans droit confirmé. Le logo original hébergé chez Base44 et les photos non vérifiées ont été remplacés par des ressources locales.
4. **Valider la version publique** : tests sur préproduction avec HTTPS, courriels réels, installation depuis un clone vierge et restauration d’une sauvegarde. Aucune donnée historique ne sera importée.
5. **Organiser la maintenance du dépôt public** : identifier d’autres responsables lorsque disponibles et configurer un canal privé de signalement de sécurité.

Ce document reflète l’état vérifié à la date indiquée. Le `PLAN_INTEGRATION.md` conserve les options historiques ; les points ci-dessus empêchent de présenter l’hébergement public comme terminé.
