# Contribuer à LA VOIX

La publication et la licence du projet sont en préparation. Le choix de licence doit être explicite avant d’accepter des contributions externes sous cette licence.

1. Décrire le problème ou l’amélioration dans une issue.
2. Créer une branche courte (`codex/…` pour les travaux assistés par Codex).
3. Préserver les comportements existants, les accès individuels et les contraintes d’intégrité.
4. Exécuter `npm run lint`, `npm run typecheck`, `npm test` et `npm run build`.
5. Ouvrir une pull request expliquant le comportement avant/après et la validation.

Ne jamais inclure `.env`, `.local`, exports, sauvegardes, identifiants ou données de personnes réelles. Ajouter une migration SQL pour faire évoluer le schéma ; ne pas modifier une migration déjà appliquée. Les améliorations de l’accessibilité et de la documentation sont les bienvenues.

Les nouvelles fonctionnalités importantes doivent faire l’objet d’une discussion avant leur réalisation. Pour une vulnérabilité, suivre SECURITY.md et éviter de publier une méthode d’exploitation ou des données personnelles dans une issue publique.
