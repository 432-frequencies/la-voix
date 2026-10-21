# Essai public sur Render (base gratuite de 30 jours)

Le fichier [`render.yaml`](../render.yaml) décrit un service web Node et une base PostgreSQL, tous deux sur l’offre gratuite de Render, dans la région de Francfort. La base est neuve : aucun compte ni vote de Base44 n’est repris. Les migrations sont exécutées au démarrage. Le site d’essai reçoit une loi explicitement fictive, signalée `[Démo]`, pour permettre de vérifier le parcours de vote ; aucun compte n’est précréé.

## Mise en ligne

1. Se connecter à [Render](https://dashboard.render.com/) et relier le dépôt public `432-frequencies/la-voix` à un nouveau **Blueprint**. Vérifier que le plan affiché pour le service et la base est **Free** avant de créer les ressources.
2. Créer ou utiliser un compte chez un relais de courriel transactionnel. Le Blueprint est préparé pour [Brevo](https://www.brevo.com/) sur le port `2525`, utilisable lorsque les ports SMTP ordinaires de Render sont bloqués. Faire vérifier l’expéditeur choisi par Brevo. Dans le formulaire initial du Blueprint, renseigner `SMTP_USER`, `SMTP_PASSWORD` et `MAIL_FROM` avec les valeurs de ce compte. Ne jamais ajouter ces valeurs au dépôt.
3. Laisser Render construire et démarrer l’application. Ouvrir l’URL HTTPS `onrender.com` attribuée au service, puis vérifier `/api/health` (réponse `{ "ok": true }`). Créer un compte de test, recevoir le courriel, confirmer l’adresse, voter et vérifier la déconnexion.
4. Contrôler les journaux et la date d’expiration de la base dans le tableau de bord Render. Informer les utilisateurs que leurs comptes et votes d’essai seront perdus à l’expiration sans export ou mise à niveau. Avant toute participation à de vrais contenus, définir les règles de modération, la suppression de compte, le contact de l’exploitant et la méthode de sauvegarde.

L’URL publique est renseignée automatiquement dans `APP_URL` depuis `RENDER_EXTERNAL_URL`. Un domaine personnalisé nécessite de mettre à jour `APP_URL` dans Render et de vérifier les liens de courriel et les origines autorisées.

## Limites de l’essai

- Selon [Render](https://render.com/docs/free), la base gratuite expire **30 jours après sa création** ; elle est ensuite inaccessible, puis supprimée après la période de grâce si elle n’est pas mise à niveau. Elle n’a **aucune sauvegarde gérée**. Prévoir une sauvegarde privée avant l’échéance si de nouvelles participations doivent être conservées.
- Le service web gratuit se met en veille après 15 minutes sans trafic. Le premier accès suivant peut prendre environ une minute. Le système de fichiers est éphémère ; les données doivent rester dans PostgreSQL.
- Les ports SMTP `25`, `465` et `587` sont bloqués sur le service gratuit Render. Le port `2525` est pris en charge par [Brevo](https://help.brevo.com/hc/en-us/articles/10905415650322-Which-SMTP-port-should-I-use-Port-587-465-or-2525). Le service de courriel peut avoir ses propres limites et ses propres conditions.
- Le dépôt public et la licence MIT restent accessibles même lorsque l’essai d’hébergement prend fin.

Le service gratuit sert à valider une version publique d’essai ; une exploitation durable avec comptes et votes demande un stockage pérenne, des sauvegardes vérifiées et une responsabilité éditoriale et légale définie.
