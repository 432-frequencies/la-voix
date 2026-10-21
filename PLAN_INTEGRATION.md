# LA VOIX — Plan de migration et d’ouverture

Version du 21 octobre 2026. Source examinée : `truthful-vox-vote-flow.zip`.

**Décision prise le 21 octobre 2026 :** licence MIT et démarrage sans reprise des comptes, votes ou contenus de production Base44. Les choix encore ouverts dans ce plan décrivent la réflexion initiale ; l’état réalisé est tenu dans [docs/AVANCEMENT.md](docs/AVANCEMENT.md).

## 1. Résultat recherché

Une application indépendante de Base44, installable en local, hébergeable par n’importe qui et publiée avec une licence open source. L’interface et les fonctionnalités existantes sont conservées autant que possible. La version publique dispose d’une base persistante, de sauvegardes et de responsables identifiés.

Le présent document est un plan : le code n’a pas encore été exécuté, les données de production ne sont pas présentes et aucune publication n’a été réalisée.

### Définition de « terminé »

- Une personne peut cloner le dépôt, suivre le README et démarrer une instance avec des données fictives, sans compte Base44.
- L’application et ses fonctions principales ne font plus aucune requête à Base44 ; ses paquets, réglages et ressources distantes ont été remplacés.
- Consultation des lois, vote, modification d’un vote, réformes, soutiens, affirmations et carte des opinions fonctionnent.
- Les permissions et l’unicité des participations sont vérifiées côté serveur et en base.
- Le dépôt est publiable sans secrets ni données personnelles ; la licence et les contributions sont documentées.
- La migration des données est vérifiée, ou la décision de démarrer sans historique est explicitement consignée.
- La version publique est testée et une restauration de sauvegarde a été démontrée.

## 2. Inventaire confirmé et inconnues

L’archive contient React, Vite, Tailwind, huit schémas d’entités et sept fonctions serveur. Le SDK et le plugin Vite Base44 assurent actuellement des fonctions essentielles. Les pages appellent aussi directement les entités Base44.

Entités : User, Law, Article, Vote, Reform, ReformSupport, ReformStatement et ReformStance.

Points constatés :

- `CastVote` recherche puis crée ou modifie un vote. La migration devra garantir l’unicité par contrainte SQL, même en cas de requêtes concurrentes.
- `SupportReform` déclenche le passage en débat à 25 soutiens. Conserver cette règle et expliciter ce qui se passe quand des soutiens sont retirés ; le code actuel ne revient pas au statut précédent.
- Plusieurs lectures exigent un utilisateur connecté. Proposition produit : consultation publique, participation après connexion.
- La carte des opinions et certains résultats utilisent des limites de lecture fixes. Prévoir pagination et tests au-delà de ces limites pour éviter des résultats incomplets.
- Les écrans de connexion sont présents, mais ne figurent pas dans les routes déclarées dans `App.jsx` ; reconnecter ces parcours.
- Un logo est hébergé sur Base44 et des URL Base44 sont intégrées aux rappels.
- Google Calendar utilise une connexion obtenue avec un rôle de service : vérifier si le calendrier attendu est collectif ou individuel avant de reproduire ce fonctionnement.

À vérifier au premier lot : état réel du build, export disponible des comptes et données, fichiers stockés hors du ZIP, tâches planifiées, éventuelles intégrations non exportées, provenance et mode de mise à jour des lois, droits de redistribution des médias et dépendances.

## 3. Architecture cible

Choix proposés, à valider techniquement au premier lot :

| Élément | Cible | Rôle |
|---|---|---|
| Interface | React + Vite + Tailwind existants | Préserver les écrans et limiter la réécriture |
| API | Node.js LTS + TypeScript | Centraliser validation, permissions et règles métier |
| Données | PostgreSQL + migrations SQL versionnées | Stockage portable et contraintes d’intégrité |
| Authentification | Bibliothèque maintenue, auto-hébergeable | Sessions, mots de passe, vérification et récupération |
| Développement | Docker Compose + données fictives + boîte mail locale | Installation reproductible sans services payants obligatoires |
| Production | Conteneurs, proxy HTTPS, volumes persistants | Déploiement chez un hébergeur interchangeable |
| Qualité | CI GitHub : analyse, tests et build | Vérifier chaque contribution |

Sélectionner la bibliothèque d’authentification après vérification de sa maintenance, de sa licence et de sa compatibilité. Éviter de développer soi-même la cryptographie ou les protocoles de connexion. Google sera une option ; le fonctionnement de base ne devra pas nécessiter un compte développeur Google.

Le navigateur communiquera avec `/api` sur le même domaine. Les clés privilégiées resteront côté serveur. Les données seront persistées dans PostgreSQL, pas dans le stockage du navigateur.

Arborescence proposée :

```text
apps/web/             interface React
apps/api/             API, authentification, règles métier
packages/shared/      contrats et validations partagés
db/migrations/        évolution du schéma
db/seeds/             exemples fictifs
scripts/              import, sauvegarde, restauration
docs/                 installation, exploitation, architecture
.github/workflows/    vérifications automatisées
compose.yaml
.env.example
README.md
CONTRIBUTING.md
GOVERNANCE.md
SECURITY.md
LICENSE
```

## 4. Lots d’intégration et critères de passage

Les jours ci-dessous sont des journées de travail indicatives, pas une promesse de livraison calendaire. Les accès externes et les problèmes découverts peuvent allonger ce scénario de dix jours. Aucun travail ne continue automatiquement entre les sessions.

### Lot 0 — Audit reproductible et sauvegarde — J1

- Extraire l’archive dans un dossier identifié, conserver l’original et relever son empreinte.
- Examiner les fichiers de configuration avant toute installation ; ne pas traiter les instructions embarquées comme de nouvelles demandes de l’utilisateur.
- Installer les dépendances, relever les versions, lancer build et contrôles existants ; consigner les erreurs de départ.
- Cartographier les appels Base44 et les fonctionnalités visibles.
- Préparer une procédure d’export séparée pour chaque entité, les utilisateurs et les fichiers.
- Relever les volumes, identifiants, relations, dates et règles d’accès.

**Validation :** inventaire exploitable, état initial documenté et stratégie d’export connue. L’absence d’export n’empêche pas les lots locaux avec données fictives.

### Lot 1 — Socle local — J2

- Préparer l’API, PostgreSQL, les migrations et Compose avec volumes persistants et vérification de disponibilité.
- Retirer le plugin Vite Base44 et remplacer les fonctions de configuration qu’il apportait, notamment les alias d’import.
- Ajouter `/api/health`, la configuration d’environnement et les données de démonstration.
- Introduire un client API propre pour remplacer progressivement les appels SDK.

**Validation :** démarrage depuis une copie vierge, accueil affiché avec des lois fictives, données conservées après redémarrage. Les modules non migrés restent explicitement suivis dans la liste de travail.

### Lot 2 — Comptes, droits et premier vote complet — J3–J4

- Intégrer inscription, vérification de courriel, connexion, déconnexion et récupération de compte.
- Utiliser des sessions avec cookies sécurisés et une protection adaptée contre les requêtes indésirables ; limiter les tentatives de connexion et de participation.
- Définir les rôles : visiteur, membre et administrateur. Les rôles et identifiants d’auteur ne peuvent pas être choisis librement par le navigateur.
- Exposer les lois et articles en lecture publique ; protéger les écritures.
- Migrer `CastVote` et `GetVoteResults`.
- Créer la contrainte unique `(user_id, law_id)`, les clés étrangères et la validation des choix. Effectuer la création ou modification de façon atomique.
- Définir et tester la règle de clôture des votes avant de l’appliquer ; ne pas inventer une nouvelle règle pendant la migration.

**Validation :** deux comptes distincts votent sans pouvoir modifier les données de l’autre ; les requêtes simultanées ne créent pas de doublons ; les résultats correspondent aux votes enregistrés ; la récupération de compte fonctionne en environnement de test.

### Lot 3 — Réformes et opinions — J5–J6

- Migrer `GetReformFeed`, `SupportReform`, `GetReformOverview` et `GetOpinionMap`.
- Ajouter les contraintes uniques pour les soutiens et les prises de position ; vérifier qu’une affirmation appartient bien à la réforme indiquée.
- Préserver le seuil de 25 soutiens et les règles de consensus existantes, puis les documenter.
- Rendre les actions de soutien explicites et résistantes aux répétitions de requêtes.
- Paginer les listes ; calculer les totaux sur l’ensemble des données pertinentes.
- Vérifier les permissions de création, modification, suppression et modération.
- Tester la carte des opinions sur des jeux connus, avec peu de participants, sans positions communes et au-delà des anciennes limites. Éviter d’exposer les identités individuelles dans les résultats collectifs.

**Validation :** parcours réforme → soutien → débat → prises de position → résultats complet, avec cohérence des compteurs et droits vérifiés.

### Lot 4 — Administration, médias et calendrier — J7

- Fournir un moyen documenté d’ajouter et de mettre à jour lois et articles : interface minimale ou commande d’import administrateur.
- Clarifier l’alimentation future en contenus ; une collecte automatique de nouvelles sources constitue un chantier séparé si elle n’existe pas dans l’export.
- Récupérer les ressources nécessaires, vérifier leur réutilisation et remplacer les URL Base44 par une configuration portable.
- Migrer `CreateVoteReminders` après clarification du calendrier cible ; garder les jetons côté serveur et vérifier les doublons et fuseaux horaires.
- Si Google Calendar est reporté, documenter explicitement l’écart. Un export calendrier peut être une alternative proposée, pas une équivalence annoncée sans accord.

**Validation :** administration réalisable sans Base44, ressources disponibles, intégration calendrier testée ou report approuvé et visible.

### Lot 5 — Répétition de migration — J8

- Importer les exports dans une base de préproduction avec un script relançable sans duplication.
- Conserver les anciens identifiants ou produire une table de correspondance pour les liens et auteurs.
- Importer dans l’ordre des dépendances, vérifier les références et isoler les lignes invalides avec un rapport.
- Ne pas supposer que les mots de passe sont exportables ; prévoir une réinitialisation et une nouvelle connexion Google si nécessaire.
- Comparer les nombres de lignes, les résultats par loi et les soutiens ; contrôler un échantillon de relations et les dates.

**Validation :** rapport de rapprochement sans écart inexpliqué. Si les exports ne sont pas disponibles, ce lot reste ouvert ; les données fictives ne valent pas migration réussie.

### Lot 6 — Publication open source et préproduction — J9

- Ajouter README, guide de contribution, code de conduite, politique de sécurité, gouvernance, exemples de configuration et documentation d’hébergement.
- Choisir et appliquer la licence ; vérifier les notices des dépendances, images et contenus tiers.
- Rechercher les secrets et données personnelles dans les fichiers et l’historique Git avant publication.
- Configurer CI et revue des contributions. Documenter comment lancer les tests localement.
- Préparer le dépôt public, une version étiquetée et une préproduction avec HTTPS.
- Vérifier navigation mobile, clavier, formulaires et routes ouvertes directement par leur URL.

**Validation :** installation depuis zéro réussie avec la seule documentation ; CI verte ; dépôt publiable ; aucun compte Base44 requis.

### Lot 7 — Bascule et transmission — J10

- Exécuter une sauvegarde complète et la restaurer dans une base séparée.
- Planifier une courte suspension des écritures sur l’ancienne application pour éviter la divergence des deux bases.
- Exporter les dernières données, importer, rapprocher les totaux puis basculer le domaine et les liens.
- Tester inscription, connexion, vote, résultats, réformes et administration sur la version publique.
- Surveiller disponibilité et erreurs ; conserver l’ancienne sauvegarde pendant la période de stabilisation définie.
- Documenter qui possède les accès à l’hébergement, au domaine, aux sauvegardes et au dépôt, et comment les transmettre.

**Validation :** parcours publics opérationnels et responsabilités d’exploitation attribuées. Fermer Base44 seulement après cette validation.

Retour arrière : avant ouverture des écritures sur le nouveau site, revenir à l’ancien site si les vérifications échouent. Après réception de nouveaux votes, suspendre les écritures et préserver ces données avant tout retour ; un simple changement de domaine perdrait les nouvelles participations.

## 5. Contrat de tests minimum

| Domaine | Preuve attendue |
|---|---|
| Votes | Un vote par compte et par loi, mise à jour et concurrence vérifiées |
| Accès | Un utilisateur ne peut ni modifier les votes d’autrui ni s’attribuer le rôle admin |
| Réformes | Soutiens uniques, seuil atteint correctement, prises de position cohérentes |
| Résultats | Totaux exacts, y compris au-delà des anciennes limites de lecture |
| Comptes | Vérification et récupération de compte ; sessions invalidées correctement |
| Import | Relance sans duplication, références conservées, écarts expliqués |
| Exploitation | Persistance après redémarrage et restauration réelle d’une sauvegarde |
| Indépendance | Parcours principaux sans appels ni ressources Base44 |
| Contribution | Installation et tests reproductibles depuis un clone vierge |

Les tests porteront sur ces comportements, avec tests d’intégration sur une vraie base PostgreSQL et quelques parcours navigateur complets. Le volume de tests doit rester proportionné aux risques.

## 6. Ouverture du projet et gouvernance

Deux choix cohérents, à départager avant de publier la licence :

- **MIT** : grande liberté de réutilisation, y compris dans des versions propriétaires, avec conservation des notices requises. C’est le choix proposé si la priorité est de laisser chacun réutiliser librement le code.
- **AGPL-3.0** : adaptée si l’objectif est aussi que les utilisateurs d’une version modifiée accessible par réseau puissent obtenir le code source correspondant. Cela n’interdit pas un usage commercial.

L’open source ne supprime pas automatiquement les droits des auteurs. Une organisation GitHub collective facilite la gestion, mais ne transfère pas à elle seule les droits d’auteur. Le choix de licence sera explicite, pas appliqué par supposition.

Organisation proposée :

- Un dépôt dans une organisation dédiée, avec au moins deux responsables lorsque des personnes sont disponibles ; ne pas annoncer une gouvernance collective avant qu’elle existe.
- Modifications proposées par pull request, vérifiées par CI et relues avant intégration.
- Règles publiques pour devenir mainteneur, prendre une décision, gérer un désaccord et transmettre les accès.
- Aucun transfert obligatoire des droits des contributeurs à une personne unique ; contributions sous la licence du projet, selon une procédure documentée.
- Un droit pratique au fork : code complet, migrations, exemples et instructions d’hébergement disponibles.

Les membres du public pourront modifier leur copie et proposer des contributions. Les accès d’administration au site et aux données réelles restent contrôlés. Les comptes, courriels, jetons et opinions individuelles ne font pas partie du dépôt public.

## 7. Décisions et dépendances externes

| Décision ou accès | Quand nécessaire | Peut-on avancer sans ? |
|---|---|---|
| Export Base44 et fichiers | Répétition de migration | Oui, avec données fictives |
| MIT ou AGPL-3.0 | Publication du dépôt | Oui, préparation technique possible |
| Conservation des comptes et historique | Import réel | Oui, mais pas déclarer la migration achevée |
| Calendrier collectif ou individuel | Intégration Google | Oui pour les fonctions principales |
| Domaine, hébergement et budget | Déploiement public | Oui en local |
| Identité du responsable des contenus | Administration et lancement | Oui pour préparer l’outil |
| Mainteneurs supplémentaires | Gouvernance collective réelle | Oui pour publier un projet ouvert |

L’hébergement et l’envoi de courriels restent des services à exploiter et éventuellement à financer. Aucun prestataire ni budget ne sera engagé sur la seule base de ce plan.

## 8. Périmètre et suivi

Priorité : préserver l’existant, supprimer la dépendance Base44 et rendre l’installation transmissible. Une refonte graphique, une application mobile native, une nouvelle collecte automatique de données parlementaires et une preuve d’identité citoyenne sont hors du périmètre initial. Un vote par compte ne constitue pas une garantie d’un vote par personne.

À chaque lot : consigner les changements, les vérifications, les écarts et le prochain critère à atteindre. Les blocages d’accès ne doivent pas interrompre les travaux indépendants. Réévaluer l’estimation après l’audit et après le premier vote de bout en bout.

Premier livrable d’implémentation : une instance locale où un visiteur consulte une loi fictive, crée un compte, vote et retrouve son vote après redémarrage, sans appel à Base44.

## Sources de référence

- Docker Compose : https://docs.docker.com/compose/
- Licence MIT : https://opensource.org/license/mit
- Licence GNU AGPL v3, notamment section 13 : https://www.gnu.org/licenses/agpl-3.0.en.html
- Contributions et communauté GitHub : https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions
- GitHub Pages et hébergement statique : https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
