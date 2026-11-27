---
id: 133-counter-x01-quick-last-format
v2_id: V2-GAMES-34
titre: Partie rapide X01 — mémoriser la dernière partie lancée
type: fonctionnel
statut: implementee
validation: en-attente
origine: Retour de recette preprod 2.1.0 (contributeur, 2026-11-26)
famille: jeux
priorite: P2
difficulte: S
recommandation: recommande
lot: 2
poids: 25
depend_de: []
issue: '#350'
verifie_au_commit: a163da9
derniere_revue: 2026-11-27
---

# 133 — Partie rapide X01 : mémoriser la dernière partie lancée

> **Statut : IMPLÉMENTÉE, recette à faire.** Validée par le product owner le 2026-11-26 et prévue en 2.2.0 (`0ee2573`, PR #349), puis **révisée le 2026-11-27** (voir « Révision du 2026-11-27 ») : toute partie X01 est mémorisée, avec sa composition, ses prénoms, le robot et son niveau. Elle **revient sur une décision de la 2.1.0** (« Le mode n'est pas mémorisé », « ← Partie rapide » rétablit le standard). Révision implémentée au commit `a163da9` ; CI et recette sur téléphone en attente.

## Contexte

La partie rapide X01 (2.1.0, hors spec, décision du product owner du 2026-11-23) propose toujours le standard : 501, premier à 3 manches, 1 contre 1, départ libre, fin sur un double. Un joueur qui préfère un autre format, par exemple premier à 2 manches, doit passer par « Personnaliser la partie » **à chaque fois** : la partie rapide perd son intérêt pour lui.

Demande : la partie rapide propose le **dernier format paramétré** sur l'appareil.

## État actuel vérifié dans le code (`d8d5c77`)

- [vérifié] `views/SetupView.tsx:312-314` : la partie rapide est disponible en X01 hors lien partenaire et hors configuration pré-remplie ; l'écran s'ouvre toujours en mode rapide (`useState(true)`).
- [vérifié] `views/SetupView.tsx:487-489` : « ← Partie rapide » envoie `apply_x01_quick_defaults`, qui rétablit le standard.
- [vérifié] `src/features/game-setup/setupModel.ts:258-261` : `applyX01QuickDefaults` applique les défauts X01 (`applyGameTypeDefaults`) en gardant les deux premiers prénoms.
- [vérifié] `components/game-setup/SetupQuickX01Section.tsx:61-64` : la carte affiche déjà le format à partir de l'état (`legsToWin`, `checkIn`, `checkOut`), mais avec « manches » et « 1 contre 1 » écrits en dur.
- [vérifié] Les réglages de l'appareil sont déjà mémorisés localement (`src/infrastructure/local/counterSettingsStore.ts`) ; aucun format de partie n'y est conservé.

## Décisions du product owner (2026-11-26)

| # | Question | Décision |
|---|---|---|
| Q1 | Quoi mémoriser ? | *(Remplacée le 2026-11-27 par Q6 et Q7.)* Tout le **format** : score de départ (y compris personnalisé), manches ou sets et leur nombre, ouverture, sortie, limite de volées par manche. **Ni les prénoms, ni le robot.** |
| Q2 | Formats à plus de 2 camps | *(Remplacée le 2026-11-27.)* On ne mémorisait **que les formats en simple à 2 joueurs**. Un match à 3 ou 4 joueurs, en 2 contre 2 ou contre le robot ne changeait pas le format mémorisé. |
| Q3 | « ← Partie rapide » depuis l'écran complet | **Garde le format en cours** au lieu de rétablir le standard. |
| Q4 | Libellés de la carte | **Inchangés** (« Partie proposée »). |
| Q5 | Revenir au standard | Un bouton **« Revenir au standard »** sous la carte, visible seulement quand le format proposé diffère du standard. |

## Révision du 2026-11-27 — toutes les parties X01

Retour de recette du product owner : un X01 en 170, 1 manche, à 4 joueurs n'était pas repris par la partie rapide, car Q2 limitait la mémoire au 1 contre 1 sans robot. Décisions du product owner du 2026-11-27 :

| # | Question | Décision |
|---|---|---|
| Q2 (révisée) | Quelles parties mémoriser ? | **Toutes les parties X01** lancées depuis la préparation : solo, 2 à 4 joueurs en simple, 2 contre 2 et contre le robot. |
| Q6 | Prénoms | **Mémorisés** sur l'appareil, y compris ceux des équipes. Ils ne quittent jamais l'appareil. |
| Q7 | Robot | **Mémorisé avec son niveau** ; le prénom du robot reste tiré au sort à chaque partie. |
| Q8 | Ordre de passage et premiers lanceurs | Non mémorisés : à 3 ou 4 joueurs, l'ordre reste choisi au lancement (spec 132). |
| Q9 | Manches et sets personnalisés | Plafond commun de **99** dans l'écran et dans la mémoire, pour qu'une partie lancée soit toujours mémorisable. |

Cette révision remplace Q1 (« ni les prénoms, ni le robot ») et Q2. Les règles ci-dessous sont à jour.

## Règles

- RM-01 Lancer un match X01, depuis la partie rapide ou l'écran complet, enregistre sur l'appareil sa partie : score, manches ou sets et leur nombre, ouverture, sortie, limite de volées, nombre de joueurs, simple ou 2 contre 2, prénoms, robot et niveau. Le standard est mémorisé comme les autres parties.
- RM-02 La partie rapide s'ouvre avec la partie mémorisée ; sans partie mémorisée (première visite, stockage vide ou illisible), elle propose le standard actuel.
- RM-03 Au lancement, la partie effectivement lancée remplace la partie mémorisée.
- RM-04 « ← Partie rapide » conserve la partie affichée dans l'écran complet (Q3), quelle que soit sa composition ; si elle ne peut pas être lancée (valeur personnalisée invalide), il reprend la partie mémorisée, à défaut le standard.
- RM-05 Un match ouvert par lien partenaire (spec 030) ou par une configuration pré-remplie (revanche) ne lit ni ne modifie le format mémorisé.
- RM-06 La carte affiche le format réel : score, « Premier à N manches » ou « Premier à N sets », composition (« Solo », « 1 contre 1 », « 3 joueurs », « 4 joueurs », « 2 contre 2 » ou « Contre le robot Club »), ouverture, sortie et, s'il y en a une, la limite de volées. « Qui joue ? » propose un prénom par joueur : deux colonnes à 3 ou 4 joueurs (n° 1 en haut à gauche, n° 2 en haut à droite…), une colonne par équipe en 2 contre 2, un seul prénom face au robot. Entrée passe au prénom suivant puis lance la partie.
- RM-07 Une partie mémorisée invalide, incohérente ou d'une version inconnue (valeur hors bornes, champ manquant, robot à plus de 2 joueurs ou avec une ouverture Double ou Master, prénom de plus de 100 caractères) est ignorée au profit du standard, sans erreur.
- RM-08 Le bouton « Revenir au standard » n'apparaît que si la partie proposée diffère du standard par ses règles ou sa composition ; les prénoms n'entrent pas dans la comparaison. Un appui remet la carte au standard (501, premier à 3 manches, départ libre, fin sur un double, 1 contre 1, sans robot ni limite de volées), garde les deux premiers prénoms et mémorise ce standard ; le bouton disparaît.
- RM-09 Un format mémorisé par la version précédente (version 1, sans composition) est relu comme un 1 contre 1 sans robot, sans prénoms.
- RM-10 Les manches et sets personnalisés sont limités à 99 ; au-delà, le lancement est bloqué avec le message « Saisis entre 1 et 99 manches ».

## Critères d'acceptation

- AC-01 Je personnalise « Premier à 2 manches », je joue, je reviens au menu puis sur X01 : la carte propose « Premier à 2 manches » et « Lancer la partie » démarre ce format.
- AC-02 Un 701 Master Out mémorisé est relancé à l'identique depuis la partie rapide.
- AC-03 Après un 701 en 1 manche à 4 joueurs, la partie rapide propose « Premier à 1 manche · 4 joueurs », avec les quatre prénoms, et relance la même partie ; de même pour le solo, le 2 contre 2 (équipes et prénoms) et le robot (niveau compris).
- AC-04 Un match par lien partenaire laisse le format mémorisé inchangé.
- AC-05 Après un rechargement de la page, le format mémorisé est toujours proposé.
- AC-06 Un stockage corrompu ou effacé ramène le standard 501, 3 manches, sortie double.
- AC-07 Les prénoms sont mémorisés sur l'appareil et repris par la partie rapide ; le prénom du robot est tiré au sort à chaque partie.
- AC-12 Un format mémorisé en version 1 est proposé à l'identique en 1 contre 1.
- AC-13 Une valeur de 100 manches bloque le lancement ; « ← Partie rapide » reprend alors la partie mémorisée.
- AC-08 Avec une partie « Premier à 2 manches » à 4 joueurs mémorisée, « Revenir au standard » affiche 501, premier à 3 manches, 1 contre 1, garde les deux premiers prénoms et disparaît ; après retour au menu, X01 propose ce standard.
- AC-09 Avec le standard proposé, le bouton « Revenir au standard » est absent.
- AC-10 Depuis un format mémorisé, je passe par « Personnaliser la partie », choisis un autre format éligible, reviens en partie rapide et lance : après retour au menu, ce dernier format lancé est proposé.
- AC-11 Avec un format personnalisé mémorisé, je choisis le standard dans l'écran complet, reviens en partie rapide et lance : à la prochaine ouverture, le standard est proposé et « Revenir au standard » est absent.

## Hors périmètre

- Les autres jeux (Cricket, Capital…) : pas de partie rapide.
- La mémorisation de plusieurs formats favoris.
- Le changement des libellés de la carte (Q4).

## Compatibilité

- Clé de stockage local `bougnat-x01-quick-format`, indépendante de la session (`bougnat-app-session-v1`) et des réglages. La révision passe son contenu en version 2 et relit la version 1 (RM-09). Un retour arrière vers la 2.1.0 ignore la clé ; une version intermédiaire qui ne lit que la version 1 propose le standard.
- Confidentialité : les prénoms restent dans le stockage local de l'appareil, comme la partie en cours ; ils ne sont transmis à aucun serveur.
- Aucun impact sur le contrat partenaire `v=1`.

## Implémentation (2026-11-26, révisée le 2026-11-27)

- Modèle pur : `src/features/game-setup/x01QuickFormat.ts` (extraction, validation, sérialisation en version 2, relecture de la version 1, standard) ; action `apply_x01_quick_format` et plafond `X01_CUSTOM_MAX_LEGS_OR_SETS` de `src/features/game-setup/setupModel.ts` ; libellé du robot `getX01BotDisplayName` de `setupViewModel.ts`.
- Stockage : `src/infrastructure/local/x01QuickFormatStore.ts` (clé `bougnat-x01-quick-format`), contrôleur `src/app/x01QuickFormatController.ts`.
- Écran : `views/SetupView.tsx` (lecture à l'ouverture, enregistrement au lancement, « ← Partie rapide », « Revenir au standard ») et `components/game-setup/SetupQuickX01Section.tsx` (composition, prénoms, robot, manches ou sets, limite de volées, bouton).
- Tests : `tests/unit/gameSetup/x01QuickFormat.test.ts` et `setupModel.test.ts` (modèle, migration, stockage, plafond de 99), `tests/unit/components/setupViewQuickFormat.test.tsx` (AC-01 à AC-13) et `setupViewPresentation.test.tsx`.
- Contrôle visuel du 2026-11-26 à 390×780 avec le format le plus long (701, sets, Master, 15 volées) : « Lancer la partie » visible sans défilement. Les compositions à 3-4 joueurs et en 2 contre 2 (deux colonnes) restent à contrôler sur téléphone en recette.
