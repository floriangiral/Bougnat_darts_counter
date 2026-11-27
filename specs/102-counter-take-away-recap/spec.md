---
id: 102-counter-take-away-recap
v2_id: V2-SHARE-02
titre: Partage du résultat X01 en image
type: fonctionnel
statut: en-cours
validation: en-attente
origine: Décision du product owner
famille: innovation
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: []
remplace: []
remplacee_par: []
issue: '#362'
verifie_au_commit: null
derniere_revue: 2026-11-27
---

# 102 — Partage du résultat X01

> **Historique publié — V2-SHARE-01, issue #273** : le texte ci-dessous décrit l'évolution texte implémentée et intégrée au tag `v2.1.0`, vérifiée au commit `04f320a`. Son périmètre et ses décisions sont conservés comme historique ; la Révision V2 ci-après étend et prévaut sur ses exclusions image et QR. Le `verifie_au_commit` de l'en-tête concerne uniquement cette révision, encore en cours de vérification.

> **Décision du product owner (2026-11-23)** : le partage natif d'un résumé texte est retenu ; la carte image, le QR, le JSON et la vue de lecture sont hors périmètre.

## 1. Objectif

Après une partie X01 classique, les joueurs arrivent directement sur l'écran de statistiques, où ils peuvent partager le résultat, relancer une revanche ou quitter, sans compte ni serveur. L'écran de vainqueur intermédiaire est supprimé hors match partenaire.

## 2. Parcours utilisateur

1. À la fin d'un match X01 classique, l'écran de vainqueur est sauté et l'écran de statistiques s'ouvre directement.
2. À la fin d'un match partenaire, le compteur ouvre automatiquement l'URL de retour dans un nouvel onglet et affiche directement les statistiques dans l'onglet du compteur ; aucun écran intermédiaire ni bouton d'envoi n'est affiché.
3. Les stats classiques proposent « Revanche », « Partager » et « Sortie ». « Revanche » enregistre localement le match terminé puis relance une partie avec les mêmes joueurs et la même configuration.
4. « Partager » ouvre la feuille native avec un résumé texte. Si le partage natif n'est pas disponible, le texte est copié dans le presse-papiers et une confirmation est affichée.
5. Si l'ouverture du retour partenaire échoue ou est bloquée, les statistiques proposent « Réessayer » et « Prévenir l’organisation ». Ce dernier partage le résumé du match via les mécanismes natifs ou le presse-papiers ; il ne contacte pas directement l'organisation.
6. Après l'ouverture du retour partenaire, un message non bloquant de 2 secondes informe les joueurs que le résultat a été envoyé vers le partenaire.

## 3. Périmètre

### Inclus

- Matchs X01 terminés (simple, doublettes, robot, de deux à quatre joueurs).
- Résumé en français : format et règles d'entrée/sortie, vainqueur, score final en manches ou en sets, durée, moyenne 3 fléchettes, meilleur score et meilleur checkout par joueur ou équipe.
- Partage via `navigator.share({ title, text })` ; repli presse-papiers si l'API est indisponible.
- Revanche depuis les statistiques des matchs classiques, avec sauvegarde locale du match terminé avant le redémarrage.

### Exclu

- Carte image, QR dynamique, URL de récap, export JSON/CSV et historique partageable.
- Partage des résultats Cricket, Capital et Triathlon.
- Envoi automatique à un service, compte, stockage serveur ou télémétrie.

## 4. Règles et exigences fonctionnelles

- FR-01 : après un X01 classique, le compteur affiche directement l'écran de statistiques sans écran de vainqueur intermédiaire.
- FR-02 : la revanche conserve les joueurs et la configuration, crée un nouvel état X01 et enregistre le match terminé dans l'historique local.
- FR-03 : l'écran de statistiques X01 affiche « Revanche », « Partager » et « Sortie ».
- FR-04 : le texte partagé est calculé à partir du match terminé et des statistiques existantes ; les équipes de doublettes sont présentées comme une seule entrée.
- FR-05 : le partage natif reçoit un titre et un texte, sans fichier ni URL.
- FR-06 : si `navigator.share` est absent, le texte est copié avec `navigator.clipboard.writeText` et un message de confirmation accessible est affiché.
- FR-07 : une annulation de la feuille native ne produit pas d'erreur visible ; les autres échecs sont signalés clairement.
- FR-08 : pour un match partenaire, le compteur ouvre automatiquement le retour partenaire à la fin du match et affiche directement les statistiques ; aucun écran intermédiaire, bouton d'envoi ou bouton « Revanche » n'est proposé.
- FR-09 : l'envoi partenaire utilise le match terminé transmis par la vue, jamais un instantané antérieur ; l'onglet du compteur reste sur les statistiques.
- FR-10 : si l'ouverture du retour échoue, les statistiques proposent « Réessayer » et « Prévenir l’organisation » ; ce dernier partage le résumé et ne notifie pas directement un contact.
- FR-11 : après l'ouverture du retour, un message non bloquant est affiché pendant 2 secondes. Il indique l'ouverture du retour, pas un accusé de réception du partenaire.
- FR-12 : l'écran de statistiques X01 privilégie le tableau de statistiques. À 2 camps, l'en-tête est un bandeau de score compact : noms des deux camps, score final en manches (ou en sets au format sets), vainqueur marqué d'un trophée, puis format, règles et durée (« 501 · Sortie double · 12:34 ») ; au-delà de 2 camps, le nom du vainqueur et le classement (spec 052). Le titre interne du tableau n'est pas affiché (il reste lu par les lecteurs d'écran).
- FR-13 : les actions de fin tiennent sur une seule rangée en bas de l'écran ; les messages (copie, envoi partenaire) s'affichent en surimpression au-dessus des statistiques et disparaissent seuls (2 s pour l'envoi partenaire, 3 s pour le partage), sans décaler le tableau.

## 5. Confidentialité et compatibilité

- Le compteur ne transmet pas le résumé à son propre serveur. Le partage n'a lieu qu'à la demande du joueur via la feuille système ou le presse-papiers.
- Aucun changement de dépendance, de CSP ou de backend.
- Sur iPhone, vérifier le partage natif en Safari et en PWA installée ; les navigateurs sans Web Share utilisent le presse-papiers si autorisé.
- Le retour automatique de l'écran de stats est suspendu tant que la feuille de partage native est ouverte.

## 6. Critères d'acceptation

- AC-01 : après un X01 classique, l'écran de stats s'ouvre directement et propose « Revanche », « Partager » et « Sortie ».
- AC-02 : « Revanche » démarre une nouvelle partie avec les mêmes joueurs et règles, sans perdre l'historique du match terminé.
- AC-03 : le texte est exact pour les manches, les sets, les doublettes et les matchs sans meilleur checkout.
- AC-04 : `navigator.share` reçoit le titre et le texte attendus ; son annulation est silencieuse.
- AC-05 : en absence de Web Share, le presse-papiers reçoit le même texte et l'interface confirme la copie ; un refus du presse-papiers affiche une erreur explicite.
- AC-06 : la fin d'un match partenaire ouvre l'URL de retour dans un nouvel onglet et affiche directement les statistiques dans le compteur, sans revanche ni écran intermédiaire.
- AC-07 : si l'ouverture du retour échoue, « Réessayer » relance l'ouverture et « Prévenir l’organisation » partage le résumé du match.
- AC-08 : après rechargement d'un résultat partenaire envoyé, les statistiques restent affichées sans revanche ; après rechargement d'un résultat non envoyé, les actions de secours restent disponibles.
- AC-09 : les parcours E2E du lien partenaire sont ajustés à l'envoi automatique (`tests/e2e/external-match-link.smoke.spec.ts`, `external-match-voice.smoke.spec.ts`) ; à exécuter en CI, ils n'ont pas été lancés localement.
- AC-10 : à 2 camps, le bandeau affiche les deux camps, le score final et le vainqueur, puis « format · durée » ; le score est annoncé aux lecteurs d'écran (« Score final : 3 manches à 1 »).
- AC-11 : le message de copie disparaît après 3 secondes ; les actions de fin et le panneau d'échec partenaire restent accessibles sans défiler.

## 7. Décisions validées

| Sujet | Décision |
|---|---|
| Plateforme de jeu V1 | X01 classique |
| Format de partage | Texte via Web Share |
| Repli | Copie presse-papiers, avec confirmation |
| Données | Vainqueur, score, format, durée et statistiques clés par concurrent |
| Doublettes | Résumé par équipe |
| Image, QR, JSON, autres jeux | Hors périmètre de cette évolution |
| Match partenaire | Envoi automatique à la fin, stats directes ; actions de secours Réessayer / Prévenir l’organisation en cas d'échec |
| Écran de statistiques | Bandeau de score compact et actions sur une rangée : les statistiques occupent l'écran |
| Télémétrie et backend | Aucun |

## Révision V2 — V2-SHARE-02 : image du résultat X01

**Statut : `en-cours`, après validation ; validation terrain `en-attente`.** Le product owner a explicitement validé la proposition puis demandé : « Ok, tu implémentes pour le X01, embarque les stats de tous les joueurs ». Suivi : [#362](https://github.com/floriangiral/Bougnat_darts_counter/issues/362), lot 4, projet Bougnat Darts V2, décision validée. Cette révision n'est pas publiée ; aucun commit de vérification ne lui est encore attribué.

> **Refonte « feuille de match » (décision du product owner, 2026-11-27)** : une revue a mesuré que la première image (900 px de large, un bloc vertical de 22 lignes par joueur) atteignait 900 × 2 551 en duel, 900 × 4 667 à quatre et 900 × 6 359 en 2 contre 2 ; réduite à 1 600 px de grand côté par une messagerie, son texte tombait à 6–9 px et son QR à 1,5–2 px par module. Le product owner a retenu une feuille de match de 1 080 px de large, dessinée directement en Canvas 2D, et une fenêtre de partage simplifiée, décrites ci-dessous ; elles prévalent sur les formulations antérieures de cette révision.

### Périmètre et parcours

- À la fin d'un X01, « Partager » ouvre un aperçu accessible de l'image et une fermeture permettant de revenir aux statistiques. La fenêtre n'affiche que des actions utilisables sur l'appareil :
  - **une seule action principale** : « Partager l'image » si `navigator.canShare({ files })` accepte un PNG, sinon « Enregistrer l'image » ; aucun bouton grisé ni message d'indisponibilité sur ordinateur ;
  - en secondaire, « Enregistrer l'image » quand le partage est l'action principale, **sauf dans l'application installée sur iOS** (`navigator.standalone`) : le lien de téléchargement y ouvre l'image en plein écran sans retour à l'application, alors que la feuille de partage propose déjà « Enregistrer l'image » ;
  - « Copier le texte » (résumé existant, confirmation ou erreur explicite) ; « Partager le texte » seulement si `navigator.share` existe, sinon il doublerait la copie. Le partage texte conserve la feuille native texte.
- L'aperçu porte une description accessible reprenant le résultat (« Aperçu de l'image du résultat X01 : Alice gagne 3 manches à 1 contre Bruno, 501 sortie double » ; classement au-delà de deux camps). L'image est générée une seule fois par match (cache par identité de l'objet match, sauf échec), avant tout clic, pour que le partage parte directement du geste de l'utilisateur ; le texte n'est pas recalculé à chaque rendu.
- L'image est un PNG portrait « feuille de match » à l'identité sportive Bougnat Darts, générée localement à partir du match terminé ; elle inclut le logo Bougnat Darts et un QR pointant exactement vers `https://play.bougnatdarts.fr`, sans données de match dans l'URL. Nom du fichier daté : `bougnat-darts-x01-AAAA-MM-JJ.png`.
- Le partage natif transmet le fichier image uniquement si le navigateur et l'appareil le prennent en charge. L'enregistrement propose le fichier PNG au mécanisme de téléchargement de l'appareil ; ne pas prétendre qu'il est enregistré si l'opération échoue ou n'est pas disponible.
- Une annulation volontaire de la feuille native n'est pas une erreur. Les échecs de génération, de chargement des ressources, de partage, d'enregistrement et de copie sont explicitement signalés, sans résultat de succès mensonger ; l'utilisateur peut revenir ou réessayer.
- Les données, le logo et le QR nécessaires à la génération sont locaux, y compris hors ligne ; aucune transmission au serveur du compteur, aucun nouveau backend, aucune nouvelle dépendance runtime. La destination choisie par l'utilisateur dans la feuille native reçoit l'image.
- Préserver la politique CSP actuelle sans l'affaiblir : l'aperçu utilise une source d'image autorisée, par exemple `data:`, et ne repose pas sur `blob:` dans `img-src`. Le QR utilise toujours l'URL officielle, jamais une URL de préproduction, quel que soit l'environnement.
- Hors périmètre : autres jeux, « Je prends la gagne », URL de récapitulatif, export JSON/CSV et services de stockage. Cette révision ne modifie ni les règles de jeu ni le contrat partenaire.

### Contenu et exactitude

- Reprendre le résultat et le format réels : jeu et score de départ, règles d'entrée/sortie, durée, gagnant, scores en manches ou en sets selon le format, et classement de tous les camps lorsqu'il existe. Respecter les égalités, rangs et mentions de places jouées ou calculées, sans inventer de classement personnel en doublettes. Couvrir solo, simple de 2 à 4 joueurs, robot et doublettes ; identifier le robot comme dans les données disponibles.
- Inclure **tous les joueurs**, sans troncature de nom, de valeur ou de détail, et toutes les mesures effectivement affichées dans les deux onglets actuels `Vue d'ensemble` et `Scores` de `components/stats/StatsModal.tsx`, avec les mêmes conventions de calcul, arrondis et valeurs indisponibles. L'image ne dépend pas de l'onglet sélectionné.
- Vue d'ensemble : durée du match, moyenne 3 fléchettes, moyenne jusqu'à 170, taux de checkout avec nombre de réussites/tentatives et détail par nombre de fléchettes, meilleur checkout, meilleur score, moyenne de fléchettes des manches gagnantes et meilleure/pire manche (ou libellés de fléchettes gagnantes pour une seule manche). Scores : toutes les catégories affichées, de `180s / 171s` à `60+ / 57+`.
- En doublettes, identifier explicitement les deux équipes, leurs membres, leur résultat et toutes leurs statistiques d'équipe comme sur l'écran actuel. Ajouter pour chacun des quatre joueurs les statistiques individuelles attribuables à ses volées (`playerId`) : moyennes et scores, catégories de scores, checkout et détail des tentatives/réussites selon les mêmes règles et le score partagé de l'équipe avant chaque volée. Le meilleur checkout individuel doit provenir d'une volée de finition de ce joueur, pas de son partenaire.
- Les manches et sets étant gagnés par équipe, ne pas présenter comme personnelles les statistiques de manches gagnantes, meilleure/pire manche ou fléchettes de manche gagnante ; les conserver au niveau équipe et indiquer leur indisponibilité ou leur caractère non applicable au niveau individuel. La durée reste celle du match. Un départage au bull n'invente pas de checkout.
- Priorité à la lisibilité et à l'intégralité : la hauteur, la disposition et les retours à la ligne s'adaptent au contenu, notamment pour les noms longs et quatre joueurs. Aucun format fixe ne doit imposer de couper du texte ou des statistiques ; si les limites de génération de l'appareil empêchent un rendu complet et lisible, afficher une erreur explicite plutôt qu'une image tronquée.

### Feuille de match (refonte du 2026-11-27)

- **Rendu** : dessin direct en Canvas 2D (`fillText`, `fillRect`, tracés), sans SVG chargé dans une image, pour éviter un canvas « tainted » sur Safari ; logo redessiné en primitives d'après `logo.svg` ; aucune requête réseau. Fond sombre autonome : couleurs du thème sombre recopiées dans le fichier de rendu.
- **Dimensions** : 1 080 px de large ; hauteur ≤ 1 920 px jusqu'à quatre joueurs en simple (solo, duel, robot, 3–4 joueurs, sets), environ 2 400 px au plus en 2 contre 2. Corps choisis pour rester lisibles après réduction à 1 600 px de grand côté : valeurs du tableau en 30–32 px, libellés et détails en 26 px au moins.
- **En-tête** : logo, date de génération (JJ/MM/AAAA), règles (« 501 · Premier à 3 manches · Sortie double » ; entrée seulement si elle n'est pas libre ; sets ; limite de volées si présente) et durée, une seule fois ; pas de titre répétant le logo.
- **Résultat** : à deux camps (doublettes comprises), grand score « 3 – 1 » en manches ou en sets, noms des deux camps et vainqueur marqué d'un trophée et de « Vainqueur » ; à 3 ou 4 camps, classement en cartes (rang, ex aequo, place jouée ou calculée, manches, sets et reste, d'après `presentX01Ranking`) ; en solo, nom et résultat.
- **Tableau** : une ligne par mesure, une colonne par camp, comme `StatsModal` (mêmes calculs) : moyenne 3 fléchettes, jusqu'à 170, taux de checkout avec réussites/tentatives, détail compact « Checkout à 1 · 2 · 3 fléchettes », meilleur checkout, meilleur score, moyenne de fléchettes des manches gagnantes et meilleure/pire manche (ou libellés d'une manche unique), puis les sept catégories de scores. Meilleure valeur de chaque ligne mise en valeur ; décimales à la française ; « – » pour un checkout ou une manche gagnée inexistants.
- **2 contre 2** : un tableau par équipe (deux colonnes), puis un tableau individuel (quatre colonnes groupées par équipe) des statistiques attribuables à chaque joueur par `playerId`. Les mesures de manches gagnées restent au tableau par équipe. Pour tenir la hauteur, les catégories de scores ne figurent qu'au tableau individuel : celles d'une équipe sont exactement la somme de ses deux joueurs, ce que rappelle une note.
- **Noms longs** : jamais tronqués ; la police est réduite jusqu'à un plancher lisible, puis le texte passe à la ligne (après un trait d'union si nécessaire). Au-delà des limites du canvas (16 384 px de haut, 16 millions de pixels), une erreur explicite remplace l'image.
- **Pied de page** : QR de 333 px dessiné module par module (9 px par module, code de 261 px et marge blanche de 4 modules), matrice dérivée de `x01ResultQr.svg` généré par `qrcode` pour l'URL officielle (dépendance de développement seulement), et « Jouez sur play.bougnatdarts.fr ».

### Préservation des parcours

- Conserver la possibilité de partager/copier le résumé texte existant et ses informations, ainsi que « Revanche » et « Sortie ». Ne pas altérer l'ouverture automatique du retour partenaire, son statut persistant, ni « Réessayer » et « Prévenir l’organisation » en cas d'échec ; cette dernière action conserve son résumé texte et sa note destinée à l'organisation.
- Suspendre l'expiration automatique de l'écran de statistiques tant que l'aperçu ou une opération de partage est ouvert, y compris la feuille native ; la reprendre après fermeture ou fin de l'opération. Les matchs partenaires conservent leur absence d'expiration automatique.

### Critères d'acceptation de la révision

- **AC-R01** : depuis les statistiques X01, l'aperçu accessible affiche un PNG portrait local complet avec logo et QR décodable vers l'URL officielle exacte, y compris en préproduction ; fermeture et actions disponibles sans changer de jeu. L'aperçu fonctionne avec la CSP actuelle sans l'affaiblir ni exiger `blob:` dans `img-src`.
- **AC-R02** : résultat, format, scores, gagnant et classement sont fidèles pour solo, 2–4 joueurs, robot, sets, égalités et places jouées/calculées ; les noms longs et données ne sont ni coupés ni omis.
- **AC-R03** : les deux onglets et tous leurs détails sont représentés pour chaque camp, quelle que soit la sélection à l'écran ; en doublettes, résultats et statistiques d'équipe sont distincts des statistiques individuelles attribuées à chacun, sans manches personnelles fictives.
- **AC-R04** : partage natif du fichier si compatible, enregistrement PNG et copie du texte sont accessibles ; indisponibilité et erreurs sont explicites, annulation silencieuse, sans faux succès.
- **AC-R05** : le partage texte, la revanche, la sortie, le retour partenaire automatique et ses actions de secours persistent, y compris après restauration de session ; l'expiration est suspendue pendant aperçu et partage.
- **AC-R06** : tests unitaires ciblés de données, rendu, QR, erreurs, interface et sessions ; E2E/smoke exclusivement en CI. Recette réelle distincte sur Safari iOS, PWA iOS et Android, incluant la lisibilité et le scan du QR après compression par une application de partage. Les tests unitaires sont réussis localement ; CI et recette sur appareils restent à faire.
- **AC-R07** : la feuille de match mesure 1 080 px de large, au plus 1 920 px de haut jusqu'à quatre joueurs en simple et environ 2 400 px en 2 contre 2 ; texte d'au moins 26 px, valeurs d'au moins 30 px, QR d'au moins 260 px (marge non comprise) ; date, règles et durée une seule fois ; nom de fichier daté (`tests/unit/presentation/stats/x01ResultImage.test.ts`, `x01ResultImageModel.fr.test.ts`).
- **AC-R08** : la fenêtre n'a qu'une action principale selon `canShare` ; « Enregistrer l'image » secondaire hors application iOS installée ; « Partager le texte » seulement avec `navigator.share` ; description accessible du résultat ; image générée une fois par match (`tests/unit/components/statsViews.test.tsx`).
