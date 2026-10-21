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

Les tests d’intégration utilisent une base et des comptes fictifs. La base locale contient aussi un compte et des participations fictifs créés pendant la vérification navigateur ; rien de cela n’est suivi dans Git.

## Reste à faire avant la publication et la bascule

1. **Décider de la licence** : MIT pour une réutilisation très libre, ou AGPL-3.0 pour imposer l’accès au code des versions modifiées proposées en ligne. Ajouter le fichier `LICENSE` et vérifier les droits de redistribution du code exporté et des ressources tierces.
2. **Exporter les données Base44**, si leur conservation est souhaitée. Le ZIP contient les schémas, sans comptes, lois, votes ni médias de production. Écrire et tester l’import historique à partir du format réel des exports, y compris la correspondance des auteurs et des liens. Aucun mot de passe ni accès Google n’est supposé transférable.
3. **Clarifier les rappels Google Calendar** : l’ancien code utilise un calendrier connecté par le rôle de service. Déterminer si le nouveau calendrier doit être collectif ou propre à chaque membre, puis implémenter et tester l’option retenue.
4. **Préparer l’exploitation publique** : domaine, hébergement, SMTP, sauvegardes programmées, responsabilités, modération, suppression de compte et informations sur les données personnelles. Le Compose local fourni n’a pas été exécuté ici, faute de Docker sur cette machine.
5. **Terminer la vérification des médias et contenus** : pages Wikimedia, licences, attributions ; éviter de publier des textes ou photographies sans droit confirmé. Le logo original hébergé chez Base44 a été remplacé par un SVG local provisoire.
6. **Valider la version publique** : tests sur préproduction avec HTTPS, courriels réels, installation depuis un clone vierge, restauration d’une sauvegarde, rapprochement des données importées, puis bascule contrôlée.
7. **Créer le dépôt GitHub public** dans le compte ou l’organisation retenue, configurer les responsables, règles de contribution et signalement privé de sécurité. Aucun dépôt distant n’est configuré dans cette copie locale.

Ce document reflète l’état vérifié à la date indiquée. Le `PLAN_INTEGRATION.md` décrit les objectifs et critères plus larges ; les points ci-dessus empêchent de présenter la migration et l’ouverture publique comme terminées.
