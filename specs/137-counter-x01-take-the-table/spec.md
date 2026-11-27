---
id: 137-counter-x01-take-the-table
v2_id: V2-GAMES-36
titre: « Je prends la gagne » en X01
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande du product owner (2026-11-27)
famille: jeux
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [132-counter-x01-order-and-placements, 133-counter-x01-quick-last-format, 052-counter-x01-three-four-players, 010-counter-offline-session-recovery-guarantees]
remplace: []
remplacee_par: []
issue: '#363'
verifie_au_commit: 22035df
derniere_revue: 2026-11-27
---

# 137 — « Je prends la gagne » en X01

> **Statut : IMPLÉMENTÉE, recette à faire.** Exigences validées par le product owner le 2026-11-27 (décisions Q1 à Q6). Les précisions P1 à P8 sont rédigées sur sa délégation explicite (« décide et documente précisément »), dans le cadre de ces décisions. Implémentée le 2026-11-27 sur `release/v2.2.0` (voir §26) ; implémentation vérifiée au commit `22035df`. CI (dont E2E) et recette terrain (T023) en attente. L'état des lieux du §4 a été vérifié au commit `77b1d6b`.

## 1. Origine et contexte

Demande du product owner du 2026-11-27 : retrouver en X01 l'usage du flipper ou du baby-foot, « je prends la gagne ». À la fin d'un match, le vainqueur garde la table et un challenger remplace le perdant ; on relance la même partie, remise à zéro, avec la nouvelle composition.

Aujourd'hui, l'écran de fin X01 propose « Revanche » (mêmes joueurs), « Partager » et « Sortie ». Changer un seul joueur oblige à sortir, rechoisir X01, corriger les prénoms et relancer.

## 2. Problématique

Au bar ou au club, plusieurs personnes attendent leur tour : passer d'un match au suivant avec un nouveau joueur doit prendre quelques secondes, sans repasser par la préparation et sans oublier qui attend.

## 3. Objectifs

- Depuis l'écran de fin X01, relancer la même partie avec le vainqueur et un challenger en deux gestes : « Je prends la gagne », puis « Lancer » (challenger proposé par la file d'attente).
- Tenir une file d'attente des challengers pendant la session, rechargement compris.
- Ne rien changer à « Revanche », au lien partenaire ni aux autres jeux.

## 4. État actuel vérifié dans le code (`77b1d6b`)

- [vérifié] `views/StatsView.tsx:221-249` : une rangée de boutons Revanche (`secondary`, si `onRematch`), Partager (`secondary`) et Sortie (`primary`), taille `sm` (`min-h-10`, soit 40 px : `components/ui/Button.tsx:29`), dans un conteneur `max-w-lg`.
- [vérifié] `views/StatsView.tsx:51-57` : sortie automatique vers le choix des jeux après 2 minutes, suspendue pendant le partage et pour un match partenaire.
- [vérifié] `App.tsx:643` : Revanche est absente d'un match partenaire (`externalMatch` ou `partnerResultStatus`) ; elle est présente contre le robot et en solo.
- [vérifié] `src/app/useGameLifecycle.ts:225-237` : `handleMatchRematch` sauvegarde le match terminé (`saveFinishedMatchLocally`) puis appelle `createMatch(finishedMatch.players, finishedMatch.config)`. La nouvelle partie repose « Qui commence ? » (duel, 2 contre 2) ou « Ordre de passage » (3 ou 4 joueurs, spec 132), car `skipStartingPlayerPrompt` n'est pas transmis à `MatchView` (`App.tsx:522-531`, `views/MatchView.tsx:1316-1329`).
- [vérifié] `views/MatchView.tsx:367,516-523` : `hasGameStarted` vaut `skipStartingPlayerPrompt` au montage et il est publié dans l'instantané X01 persisté.
- [vérifié] `src/application/scoring/x01Ranking.ts:41` (`rankX01Competitors`) et `src/presentation/stats/x01RankingPresenter.fr.ts` (`presentX01Ranking`) : classement final, places jouées d'abord ; à égalité, l'ordre de jeu est conservé.
- [vérifié] `src/features/game-setup/setupModel.ts:513-552` : `buildSetupPlayers` construit les joueurs (`p1`…`p4` en simple, `t1p1`…`t2p2` en 2 contre 2) et remplace un prénom vide par « Joueur N ».
- [vérifié] `src/app/x01QuickFormatController.ts` : `rememberX01QuickFormat` mémorise la partie rapide (spec 133, version 2 avec prénoms) ; une revanche ne la modifie pas (spec 133, RM-05).
- [vérifié] `src/shared/session/persistedAppSession.ts:48,151-174` : session versionnée (`APP_SESSION_SCHEMA_VERSION = 2`), validée champ par champ par `src/app/sessionRecovery.ts:80-97` ; aucun champ de file d'attente.
- [vérifié] `src/styles/tokens/themes.css` : aucun rôle de couleur dédié à une action de fin de partie ; les rôles `game-*` sont réservés aux couleurs métier (`docs/design-system.md`).

## 5. Comportement cible

Sur l'écran de fin d'un match X01 éligible, le bouton « Je prends la gagne » ouvre la fenêtre « Qui prend la gagne ? ». Le vainqueur y est affiché avec un trophée, non modifiable ; on choisit le ou les sortants (3 ou 4 joueurs), on saisit le ou les challengers (proposés par la file), on gère la file, puis « Lancer » démarre la même partie remise à zéro : le challenger lance en premier, sans question « Qui commence ? » ni écran d'ordre.

## 6. Périmètre

### Inclus

- X01 en simple, de 2 à 4 joueurs humains, et en 2 contre 2, quelle que soit l'origine du match terminé (préparation, partie rapide, revanche, « Je prends la gagne »), hors exclusions de Q5.
- Le bouton, la fenêtre, la file d'attente persistée, la disposition adaptative des quatre actions et deux familles de rôles de couleur.

### Exclu

- Cricket, Capital, 180 Around the Clock et les autres jeux (plus tard, spec à créer).
- Match avec un robot, solo, match ouvert par lien partenaire (Q5).
- Changement des règles depuis la fenêtre (score, manches, sorties) : on relance la même partie.
- Compteur de victoires d'affilée, historique de la file, partage de la file entre appareils.

## 7. User stories

- En tant que vainqueur, je veux garder la table et affronter le suivant sans ressaisir la partie, afin d'enchaîner les matchs.
- En tant que joueur qui attend, je veux être inscrit dans la file, afin d'être proposé automatiquement quand vient mon tour.
- En tant que perdant, je veux me remettre en fin de file en un geste, afin de rejouer plus tard.

## 8. Décisions

### Décisions du product owner (2026-11-27)

| # | Question | Décision du product owner |
|---|---|---|
| Q1 | Nom du bouton | « Je prends la gagne » sur tous les écrans, avec adaptation de la taille au format d'écran, rien de fixe, tout adaptatif. |
| Q2 | Mise en valeur | Sortie reste mise en valeur (bouton principal actuel) ; Revanche et Je prends la gagne ont chacun une couleur dédiée. |
| Q3 | Qui commence la nouvelle partie | Le challenger, d'office (pas de demande du premier lanceur). À 3 ou 4 joueurs, le challenger est n° 1 et les autres gardent leur ordre relatif de la partie précédente, sans écran d'ordre. En 2 contre 2, l'équipe challenger commence (premier lanceur de l'équipe = premier prénom saisi). |
| Q4 | Sortant à 3 ou 4 joueurs | Un seul sortant par défaut, le dernier du classement final ; on peut choisir un autre sortant. Plusieurs sortants sont permis : par défaut 1, modification possible, chacun remplacé par un challenger. |
| Q5 | Exclusions | Pas de fonctionnalité s'il y a un robot dans la partie, ni en solo (bouton absent). Absente aussi pour un match ouvert par lien partenaire (comme Revanche). |
| Q6 | File d'attente des challengers | Oui : on saisit le challenger et on peut ajouter d'autres prénoms à la file ; le premier de la file est proposé automatiquement ; le sortant peut être ajouté en un geste en fin de file ; on peut retirer (au minimum) et réordonner simplement ; la file est conservée pendant la session et après un rechargement, et effacée en quittant par « Sortie » vers le choix des jeux. |

Autres règles demandées par le product owner le même jour : en 2 contre 2, l'équipe perdante est remplacée par une équipe challenger de deux prénoms (on peut garder un des perdants) ; prénoms du match terminé proposés en raccourcis ; vainqueur affiché avec trophée, non modifiable ; « Lancer » (et Entrée) démarre, « Annuler » revient aux statistiques ; sortie automatique de l'écran de fin suspendue pendant la fenêtre ; match terminé sauvegardé dans l'historique local avant la nouvelle partie (comme Revanche) ; la partie rapide mémorise la nouvelle composition (spec 133 révisée) ; prénom vide interdit ou remplacé par défaut (choix laissé à la spec) ; doublon avec un joueur restant signalé ; boutons en deux lignes de deux sur téléphone en portrait, en une ligne de quatre ailleurs ; cibles ≥ 44 px au téléphone et ≥ 48 px sur tablette ; libellés ajustés automatiquement (`FitText`) ; le tableau de statistiques défile, rien n'est masqué ; X01 seulement.

### Précisions rédigées sur délégation (2026-11-27)

| # | Sujet | Précision retenue | Justification |
|---|---|---|---|
| P1 | Prénom vide | **Interdit** : un champ challenger vide (ou d'espaces) bloque « Lancer » avec un message ; aucun prénom par défaut. | « Joueur 2 » ne dit pas qui tient la table et peut créer un doublon ; la file et les raccourcis rendent la saisie rapide. |
| P2 | Doublon | **Bloquant** : un challenger qui reprend le prénom d'un joueur restant ou d'un autre challenger (comparaison sans espaces de bord ni casse) empêche le lancement ; le message suggère d'ajouter une initiale. | Deux « Paul » rendent le score, le classement et le partage ambigus. |
| P3 | Plusieurs sortants | Cases « Qui sort ? » sur les joueurs non vainqueurs ; le dernier du classement coché par défaut ; au moins 1, au plus tous les non-vainqueurs ; un champ challenger par sortant coché. | Q4. |
| P4 | Ordre avec plusieurs challengers | Challengers dans l'ordre des champs (« Challenger 1 » = n° 1…), puis joueurs restants dans leur ordre relatif de la partie précédente. | Q3 étendue, sans écran d'ordre. |
| P5 | 2 contre 2 | L'équipe perdante sort entière ; deux champs pour l'équipe challenger, un perdant accepté ; l'équipe challenger ouvre, son premier champ lance ; l'équipe gagnante garde son ordre interne. | Q3 et règle demandée. |
| P6 | File d'attente | Liste ordonnée, 12 prénoms au plus, sans doublon ; modifiée dans la fenêtre et enregistrée seulement par « Lancer » ; « Annuler » n'en garde rien. Actions « Retirer » et « Monter ». | Q6 ; « Monter » suffit pour une courte liste au doigt, sans glisser-déposer. |
| P7 | Effacement de la file | À tout retour au choix des jeux : « Sortie », sortie automatique de l'écran de fin, « Quitter » pendant une partie. Conservée par « Revanche », « Je prends la gagne » et le rechargement. | Q6 : ces trois chemins mènent au même écran que « Sortie ». |
| P8 | Rôles de couleur | Deux familles de rôles sémantiques, `rematch-*` (Revanche) et `challenge-*` (Je prends la gagne), déclarées dans les deux thèmes, de teintes distinctes de `brand`, des états (`success`, `danger`, `warning`, `info`) et des `game-*`. | Q2, ADR 0006. |

## 9. Règles métier

- RM-01 **Éligibilité.** « Je prends la gagne » apparaît sur l'écran de fin X01 si et seulement si le match est terminé avec un vainqueur, compte au moins deux camps, ne contient aucun robot (`isBot`) et n'est pas un match partenaire (`externalMatch` ou `partnerResultStatus`). Sinon, le bouton est absent (pas désactivé).
- RM-02 **Vainqueur.** Le camp vainqueur (`matchWinnerId`) reste à la table. Il est affiché en tête de la fenêtre avec un trophée et la mention « Vainqueur », sans champ modifiable.
- RM-03 **Duel.** Le perdant sort ; un champ « Challenger » ; nouvel ordre : challenger, vainqueur.
- RM-04 **3 ou 4 joueurs en simple.** « Qui sort ? » liste les joueurs non vainqueurs avec leur rang final (`presentX01Ranking`). Le dernier de la liste du classement est coché par défaut (à égalité au dernier rang, le dernier dans l'ordre du classement). La dernière case cochée ne peut pas être décochée ; tous les non-vainqueurs peuvent être cochés. Un champ « Challenger N » par sortant coché : cocher ajoute un champ en dernier, décocher retire le dernier champ.
- RM-05 **Ordre en simple.** Nouvel ordre de passage : challengers dans l'ordre des champs, puis joueurs restants (vainqueur compris) dans leur ordre relatif de la partie précédente (`players`). Le n° 1 ouvre le match ; ni « Qui commence ? » ni « Ordre de passage » ne s'affichent (exception à la RM-01 de la spec 132, décision Q3).
- RM-06 **2 contre 2.** L'équipe perdante sort entière. Deux champs « Équipe challenger », le premier lance en premier dans l'équipe. Nouvelle partie : équipe challenger en `team1`, ouvreuse du match ; équipe gagnante en `team2`, dans son ordre interne de la partie précédente. Aucune question « Qui commence ? ».
- RM-07 **Même partie.** La nouvelle partie reprend le score de départ (personnalisé compris), le mode manches ou sets et leur nombre, l'ouverture, la sortie et la limite de volées (`maxVisitsPerLeg`, absente si elle l'était). Scores, manches, sets, places et statistiques repartent de zéro, avec un nouvel identifiant de match.
- RM-08 **Prénoms.** Comparaison sans espaces de bord ni distinction de casse ; 100 caractères au plus. Lancement refusé si un champ challenger est vide (P1) ou reprend le prénom d'un joueur restant ou d'un autre challenger (P2). Le prénom d'un sortant est accepté.
- RM-09 **Raccourcis.** Sous les champs, un bouton par prénom de joueur du match terminé qui quitte la table (sortants cochés, ou équipe perdante). Un appui remplit le champ challenger actif, à défaut le premier champ vide. Les joueurs restants ne sont pas proposés.
- RM-10 **File : contenu.** Liste ordonnée d'au plus 12 prénoms non vides, de 100 caractères au plus, sans doublon (comparaison de RM-08). Le prénom d'un joueur restant ne peut pas y être ajouté.
- RM-11 **File : préremplissage.** À l'ouverture, les champs challengers reçoivent, dans l'ordre, les premiers prénoms de la file qui ne sont pas ceux de joueurs restants. Sans file, les champs sont vides.
- RM-12 **File : affichage.** La fenêtre affiche « Prochain : Paul, puis Léa » (« Prochain : Paul » pour un seul, « File vide » sinon), puis la liste modifiable. Cette liste est la file telle qu'elle sera après le lancement : prénoms de la file absents des champs challengers, dans leur ordre, puis les ajouts. Si un prénom prérempli est remplacé dans son champ, il réapparaît à sa place dans la liste.
- RM-13 **File : modification.** Champ « Ajouter à la file » et bouton « Ajouter » (Entrée dans ce champ ajoute sans lancer). Chaque prénom a « Retirer » et, sauf le premier, « Monter ». Pour chaque sortant, « Ajouter Bob en fin de file » l'ajoute en un geste (bouton à bascule : un second appui le retire) ; ce bouton est absent si Bob est challenger. Ajout refusé avec message si le prénom est vide, déjà en file, à la table ou si la file est pleine.
- RM-14 **File : enregistrement.** « Lancer » enregistre la liste de RM-12 comme nouvelle file. « Annuler », Échap ou un rechargement pendant la fenêtre n'enregistrent aucune modification.
- RM-15 **File : durée de vie.** La file est conservée dans la session persistée : elle survit aux parties suivantes (Revanche comprise) et au rechargement. Elle est effacée à tout retour au choix des jeux (P7) et à l'expiration de la session (7 jours, spec 010).
- RM-16 **Lancer.** « Lancer » ou Entrée dans un champ challenger (Entrée passe au champ suivant, puis lance depuis le dernier). Le lancement, s'il est valide : (1) sauvegarde le match terminé dans l'historique local, comme Revanche ; (2) enregistre la file ; (3) mémorise la nouvelle partie pour la partie rapide (spec 133 : règles, composition, prénoms dans le nouvel ordre, sans robot), en exception à la RM-05 de la spec 133 ; (4) démarre la nouvelle partie en plein écran, challenger au lancer.
- RM-17 **Annuler.** « Annuler », Échap ou un appui hors de la fenêtre la ferment sans effet et rendent le focus au bouton « Je prends la gagne ».
- RM-18 **Sortie automatique.** La sortie automatique de l'écran de fin (2 minutes) est suspendue tant que la fenêtre est ouverte et repart de zéro à sa fermeture.
- RM-19 **Boutons de fin.** Ordre : Revanche, Je prends la gagne, Partager, Sortie. Sortie garde la variante principale (`primary`) ; Revanche prend la variante `rematch`, Je prends la gagne la variante `challenge`, Partager reste `secondary`. Libellés identiques sur tous les écrans, ajustés par `FitText`, jamais abrégés ni tronqués.
- RM-20 **Disposition adaptative.** Téléphone en portrait (`data-size-w="compact"`, `data-orientation="portrait"`) avec quatre boutons : deux lignes de deux (Revanche, Je prends la gagne / Partager, Sortie). Téléphone en paysage, tablette et ordinateur : une ligne de quatre, rangée élargie à la largeur des statistiques (`max-w-4xl`). Avec trois boutons ou moins, la rangée unique actuelle est conservée. Hauteur des cibles : ≥ 44 px au téléphone, ≥ 48 px sur tablette et ordinateur. Le tableau de statistiques garde son défilement ; rien n'est masqué par les actions.
- RM-21 **Nouvelle partie ordinaire.** Instantané, annulation, voix, places jouées (spec 132) et reprise sont inchangés. Un rechargement avant la première fléchette ne fait apparaître ni « Qui commence ? » ni « Ordre de passage ».

## 10. Parcours utilisateurs

### Duel avec file

1. Alice bat Bob. L'écran de fin affiche Revanche, Je prends la gagne, Partager, Sortie.
2. « Je prends la gagne » : la fenêtre « Qui prend la gagne ? » montre « Alice — Vainqueur » avec un trophée, « Bob sort », le champ « Challenger » (vide, focus dedans), le raccourci « Bob » et « File vide ».
3. Saisie de « Paul » ; « Ajouter à la file » : « Léa », Ajouter ; appui sur « Ajouter Bob en fin de file ». La fenêtre affiche « Prochain : Léa, puis Bob ».
4. Entrée dans le champ Challenger : le match Paul contre Alice démarre au même format, Paul lance.
5. Alice gagne encore : la fenêtre propose « Léa » en challenger et « Prochain : Bob ». « Lancer ».

### 4 joueurs, deux sortants

1. Classement final : 1ᵉʳ Alice, 2ᵉ Bob, 3ᵉ Chloé, 4ᵉ David ; ordre de passage précédent : Bob, Chloé, Alice, David.
2. « Qui sort ? » : David est coché ; on coche aussi Chloé. Deux champs : Challenger 1 « Paul » (file), Challenger 2 « Léa ».
3. « Lancer » : ordre Paul, Léa, Bob, Alice ; Paul ouvre ; pas d'écran d'ordre.

### 2 contre 2

1. Alice / Bob battent Chloé / David ; Bob avait lancé en premier pour son équipe.
2. Équipe challenger : « Paul », puis raccourci « David ». « Lancer » : Paul / David (`team1`) contre Bob / Alice (`team2`) ; Paul lance, puis Bob.

## 11. Exigences fonctionnelles

- FR-01 Modèle pur, sans React : éligibilité (RM-01), sortant par défaut (RM-04), validation des prénoms (RM-08), composition de la nouvelle partie (RM-03 à RM-07), opérations de file (RM-10 à RM-14) et assainissement d'une file relue.
- FR-02 Fenêtre « Qui prend la gagne ? » (RM-02, RM-04, RM-09 à RM-17).
- FR-03 Écran de fin : bouton, variantes, disposition et sortie automatique (RM-18 à RM-20).
- FR-04 Cycle de vie : sauvegarde, mémorisation, file, démarrage sans question de départ (RM-16, RM-21).
- FR-05 Session : champ optionnel `x01ChallengerQueue`, validé et assaini (RM-15, §16).

## 12. Exigences non fonctionnelles

- NFR-01 **Accessibilité.** Fenêtre `<dialog>` modale nommée par son titre ; focus initial sur le premier champ challenger, contenu dans la fenêtre ; Échap = Annuler ; retour du focus au bouton d'origine. Champs étiquetés ; erreurs reliées (`aria-describedby`, `aria-invalid`) et annoncées (`role="alert"`). Cases « Qui sort ? » natives ; file en liste ordonnée ; boutons nommés « Retirer Léa de la file », « Monter Léa » ; ajout du sortant avec `aria-pressed`. Trophée décoratif (`aria-hidden`) doublé du texte « Vainqueur ». La couleur ne porte jamais seule l'information. Contrastes dans les deux thèmes : texte ≥ 4,5:1, bordures et focus ≥ 3:1.
- NFR-02 **Cibles tactiles.** ≥ 44 px au téléphone, ≥ 48 px sur tablette, y compris dans la fenêtre (raccourcis, Retirer, Monter, cases).
- NFR-03 **Adaptatif.** Disposition pilotée par les attributs du résolveur (`data-size-w`, `data-orientation`, `data-recipe`, `data-input`), jamais par `matchMedia` dans la vue (ADR 0007). La fenêtre défile si la hauteur manque (téléphone en paysage) ; « Lancer » et « Annuler » restent atteignables.
- NFR-04 **Confidentialité.** File et prénoms restent dans le stockage local de l'appareil ; rien n'est transmis.
- NFR-05 Aucune dépendance runtime nouvelle ; identifiants par `src/shared/ids` (pas de `crypto.randomUUID` direct).
- NFR-06 Textes en français accentué ; couleurs par rôles sémantiques uniquement (`npm run guard:clean`).

## 13. Cas nominaux et alternatifs

- Duel, 3 joueurs, 4 joueurs (1 à 3 sortants), 2 contre 2.
- Match à 3 ou 4 joueurs terminé avec places jouées (spec 132) : le classement intègre les places jouées.
- Sets, score personnalisé, ouverture Double ou Master, limite de volées : reconduits (RM-07).
- Enchaînement de plusieurs « Je prends la gagne », Revanche intercalée : la file est conservée.

## 14. Cas limites

- Ex æquo au dernier rang : sortant par défaut = dernier de la liste du classement (RM-04).
- Prénom de la file qui joue encore (saisi à la main comme challenger d'une partie précédente puis resté à la table) : il reste dans la file mais n'est jamais prérempli tant qu'il est à la table (RM-11).
- File pleine (12) : « Ajouter » refusé avec message ; les boutons d'ajout des sortants sont désactivés.
- Prénom long (jusqu'à 100 caractères, `maxLength`) : affiché par `FitText` sans débordement.
- 4 joueurs, trois sortants : trois challengers, le vainqueur devient n° 4.
- Rechargement pendant la fenêtre : retour sur l'écran de fin, fenêtre fermée, file inchangée (RM-14).

## 15. Gestion des erreurs

- Messages : « Saisis le prénom du challenger. » ; « Paul joue déjà : choisis un autre prénom, par exemple « Paul B. ». » ; « Léa est déjà dans la file. » ; « Alice est à la table. » ; « File complète (12 prénoms). ».
- Échec de la sauvegarde d'historique : non bloquant, comme Revanche.
- Échec d'écriture de la partie rapide mémorisée : ignoré sans erreur (comportement de `x01QuickFormatStore`).
- File relue invalide : assainie sans écarter la session (§16).

## 16. Impacts sur les données et les interfaces

- `PersistedAppSession` gagne le champ **optionnel** `x01ChallengerQueue?: string[]`. `APP_SESSION_SCHEMA_VERSION` reste 2 : un champ absent vaut une file vide.
- `sessionRecovery` : une valeur présente mais invalide (pas un tableau, élément non textuel, vide après rognage, plus de 100 caractères, doublons, plus de 12 éléments) est **assainie** (éléments invalides et doublons retirés, 12 premiers gardés, `[]` si ce n'est pas un tableau) sans écarter la session : la file est accessoire, la partie en cours prime.
- Partie rapide (`bougnat-x01-quick-format`, version 2) : format inchangé ; seule la règle d'écriture change (RM-16).
- `MatchState`, `GameConfig`, instantanés X01, historique local et contrat partenaire `v=1` : inchangés.

## 17. Compatibilité avec l'existant

- Session antérieure (sans `x01ChallengerQueue`) : relue avec une file vide.
- Retour arrière vers une version sans cette spec : le champ est ignoré à la lecture, puis perdu à la prochaine écriture ; aucune session n'est écartée.
- Historique local : sauvegarde par le même chemin que Revanche (`saveFinishedMatchLocally`).
- Revanche, Partager, Sortie, lien partenaire et écrans de fin des autres jeux inchangés.

## 18. Dépendances

- Spec 132 : ordre de passage et classement à 3 ou 4 joueurs.
- Spec 133 : partie rapide mémorisée avec prénoms (RM-16 crée une exception à sa RM-05, à reporter dans la spec 133 à l'implémentation).
- Spec 052 : X01 à 3 ou 4 joueurs. Spec 010 : session persistée et versionnée.
- ADR 0006 (tokens et thèmes) et ADR 0007 (classes de taille) ; spec 030 (contrat partenaire, à ne pas modifier).

## 19. Critères d'acceptation

- AC-01 Duel Alice contre Bob terminé, sans robot ni partenaire : l'écran de fin affiche, dans cet ordre, Revanche (`data-variant="rematch"`), Je prends la gagne (`data-variant="challenge"`), Partager (`secondary`) et Sortie (`primary`).
- AC-02 Le bouton est absent contre le robot, en solo et pour un match partenaire ; Revanche reste présente contre le robot et en solo, absente en partenaire.
- AC-03 Duel, challenger « Paul » : nouvelle partie Paul puis Alice, mêmes score de départ, mode, nombre de manches ou sets, ouverture, sortie et limite de volées ; scores à zéro ; nouvel identifiant ; Paul lance ; ni « Qui commence ? » ni « Ordre de passage » ; le match terminé est sauvegardé avant le démarrage.
- AC-04 4 joueurs (ordre Bob, Chloé, Alice, David ; Alice vainqueur, David dernier) : David coché par défaut ; avec « Paul », ordre Paul, Bob, Chloé, Alice, sans écran d'ordre.
- AC-05 Même match, Chloé et David cochés, challengers Paul et Léa : ordre Paul, Léa, Bob, Alice. La dernière case cochée ne se décoche pas ; le vainqueur n'est pas proposé.
- AC-06 2 contre 2, Alice / Bob vainqueurs (Bob premier lanceur de l'équipe), challengers « Paul » et « David » : Paul / David en `team1` ouvre, Paul lance ; l'équipe Alice / Bob joue Bob puis Alice.
- AC-07 Champ vide ou d'espaces : « Lancer » et Entrée refusent avec « Saisis le prénom du challenger. » ; « alice » face à Alice restante : refus avec le message de doublon ; deux challengers « Léa » : refus.
- AC-08 File : ajout de « Léa » puis « Zoé », puis « Ajouter Bob en fin de file » ; la fenêtre affiche « Prochain : Léa, puis Zoé, puis Bob ». Après « Lancer » et une nouvelle fin, « Léa » est préremplie et la liste montre Zoé, Bob. « Retirer » et « Monter » modifient la liste ; l'ajout d'un doublon, d'un joueur à la table ou d'un 13ᵉ prénom est refusé avec message.
- AC-09 Remplacer « Léa » préremplie par « Max » : Léa réapparaît en tête de liste et y reste après le lancement.
- AC-10 « Annuler » ou Échap après des modifications : retour aux statistiques, file inchangée, focus sur « Je prends la gagne ».
- AC-11 Fenêtre ouverte 3 minutes (minuteries simulées) : l'écran de fin reste affiché ; après fermeture, la sortie automatique a lieu 2 minutes plus tard.
- AC-12 La file survit au rechargement et à une Revanche ; « Sortie », la sortie automatique et « Quitter » en cours de partie la vident ; une session sans le champ ou avec une file invalide est restaurée avec une file vide ou assainie, sans être écartée.
- AC-13 Après le lancement, la partie rapide propose la nouvelle composition (prénoms dans le nouvel ordre, même format) ; une Revanche ne la modifie toujours pas.
- AC-14 Rechargement juste après le lancement, avant la première fléchette : la partie reprend sans « Qui commence ? » ni « Ordre de passage », challenger au lancer.
- AC-15 Téléphone en portrait avec quatre boutons : grille de deux colonnes, Revanche et Je prends la gagne en première ligne ; téléphone en paysage, tablette et ordinateur : une ligne de quatre ; hauteur minimale 44 px au téléphone et 48 px sur tablette (test de composant ; contrôle visuel en recette à 360×640, 390×844, 844×390, 768×1024, 1024×768 et 1440×900, thèmes Sombre et Clair, libellés entiers et statistiques défilantes).
- AC-16 Les rôles `rematch-*` et `challenge-*` existent dans les deux thèmes et dans le pont Tailwind ; le test de contraste les couvre ; `npm run guard:clean` passe sans hausse de la référence.
- AC-17 Fenêtre : nom accessible, focus initial, Échap, erreurs annoncées, boutons de file nommés, trophée doublé du texte « Vainqueur ».
- AC-18 Non-régression : Revanche identique (mêmes joueurs, mêmes questions de départ), partage, Sortie, flux partenaire et écrans de fin des autres jeux inchangés (tests existants verts).

## 20. Scénarios de tests

- Unitaires (modèle pur) : éligibilité, sortant par défaut et ex æquo, compositions (duel, 3-4 joueurs, plusieurs sortants, 2 contre 2), configuration reconduite, validation des prénoms, opérations et assainissement de la file.
- Composants : `X01ChallengerDialog` (préremplissage, raccourcis, file, erreurs, Entrée, Annuler, accessibilité) ; `StatsView` (présence, ordre, variantes, disposition, sortie automatique).
- Application : `useGameLifecycle` (sauvegarde, mémorisation, file, démarrage sans question) ; `sessionRecovery` (champ optionnel).
- Thèmes : contraste des nouveaux rôles.
- E2E (CI uniquement) : duel puis « Je prends la gagne » avec file, rechargement, Sortie qui vide la file.
- Terrain : téléphone portrait et paysage, tablette, ordinateur, deux thèmes.

## 21. Exigences de non-régression

Revanche, ordre de passage et places jouées (spec 132), partie rapide (spec 133), reprise de session (spec 010), lien partenaire (spec 030), partage X01 (spec 102), écrans de fin des autres jeux.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Quatre boutons serrés sur petit téléphone | Libellé illisible, cible trop petite | Moyenne | Grille 2 × 2 en portrait, `FitText`, cibles ≥ 44 px, contrôle à 360 px. |
| Rechargement entre le lancement et le premier instantané | Question de départ affichée | Faible | Instantané publié au montage de `MatchView` ; test AC-14. |
| Nouvelles couleurs confondues avec les états ou les couleurs métier | Lecture ambiguë | Faible | Rôles dédiés, teintes distinctes, test de contraste, revue design. |
| Travaux parallèles sur `StatsView` (partage X01) | Conflits | Moyenne | Implémenter après intégration du partage, rebaser, tests de `StatsView` verts. |

## 23. Décisions architecturales

Pas d'ADR nouveau : la règle tient dans une façade pure de `src/features/x01/`, sans dépendance nouvelle ; les rôles suivent l'ADR 0006, la disposition l'ADR 0007.

## 24. Questions ouvertes

Aucune : Q1 à Q6 sont tranchées par le product owner, P1 à P8 rédigées sur sa délégation.

## 25. Traçabilité

- Issue : [#363](https://github.com/floriangiral/Bougnat_darts_counter/issues/363).
- Specs liées : 010, 030, 052, 102, 132, 133.
- Code concerné : `views/StatsView.tsx`, `src/app/useGameLifecycle.ts`, `App.tsx`, `src/shared/session/persistedAppSession.ts`, `src/app/sessionRecovery.ts`, `src/styles/tokens/`.

## 26. Notes d'implémentation (2026-11-27)

- **Modèle pur** : `src/features/x01/challenger/x01Challenger.ts` (éligibilité, contexte et sortant par défaut, validation, composition, partie rapide) et `x01ChallengerQueue.ts` (file : préremplissage, liste affichée, ajout, retrait, montée, assainissement, plafond de 12). La composition réutilise `buildSetupPlayers` ; la configuration est reconstruite champ par champ (RM-07) avec `initialStartingPlayerIndex: 0` en simple, `initialStartingTeamId: 'team1'` et `teamStarterIds` (`t1p1`, `t2p1`) en 2 contre 2.
- **Démarrage du challenger** : `handleTakeTheTable` (`src/app/useGameLifecycle.ts`) retient l'identifiant du match lancé ; `App.tsx` passe alors `skipStartingPlayerPrompt` à `MatchView`, dont l'instantané publié au montage porte `hasGameStarted: true` : un rechargement ne repose donc aucune question (RM-21). Aucun champ de `GameConfig` n'est ajouté.
- **File** : état `x01ChallengerQueue` de `App.tsx`, écrit dans la session (champ optionnel de `PersistedAppSession`, schéma inchangé) et assaini par `sessionRecovery` ; vidé par `handleReturnToGameSelection` et, par sécurité, à tout passage sur l'accueil ou le choix des jeux (retour du navigateur compris).
- **Couleurs** : rôles `rematch-*` (indigo) et `challenge-*` (fuchsia) dans les deux thèmes et le pont Tailwind ; variantes `rematch` et `challenge` de `Button` (bordure, fond teinté, libellé coloré ; fond plein au survol) ; paires ajoutées au test de contraste.
- **Disposition** : `views/StatsView.tsx` lit `useViewport()` : `data-actions-layout="grid"` (2 × 2) sur téléphone en portrait (`widthClass` compact, portrait) avec quatre boutons, `row-wide` (ligne de quatre, `max-w-4xl`, pleine largeur sur tablette par `tablet-pages.css`) ailleurs, `row` avec trois boutons ou moins. Cibles `min-h-11` en présentation téléphone, `min-h-12` ailleurs ; libellés dans `FitText`.
- **Écarts au plan** : libellés dans `src/presentation/stats/x01ChallengerLabels.fr.ts` plutôt que `statsLabels.fr.ts`, et tests de l'écran de fin dans `tests/unit/components/statsViewActions.test.tsx` plutôt que `statsViews.test.tsx`, pour ne pas croiser les travaux parallèles sur le partage ; la fenêtre est rendue hors de la rangée d'actions, pour ne pas hériter des hauteurs de boutons de l'écran de fin sur tablette. Une saisie dans « Ajouter à la file » du prénom d'un challenger en cours de saisie est refusée comme « à la table ». Notes de version et changelog in-app (T021) traités dans un lot séparé.
