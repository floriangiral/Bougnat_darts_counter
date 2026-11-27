---
id: 133-counter-x01-quick-last-format
v2_id: V2-GAMES-34
titre: Partie rapide X01 — mémoriser le dernier format joué
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
verifie_au_commit: 0ee2573
derniere_revue: 2026-11-27
---

# 133 — Partie rapide X01 : mémoriser le dernier format joué

> **Statut : IMPLÉMENTÉE, recette à faire.** Validée par le product owner le 2026-11-26 et prévue en 2.2.0 (`0ee2573`, PR #349). Elle **revient sur une décision de la 2.1.0** (« Le mode n'est pas mémorisé », « ← Partie rapide » rétablit le standard).

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
| Q1 | Quoi mémoriser ? | Tout le **format** : score de départ (y compris personnalisé), manches ou sets et leur nombre, ouverture, sortie, limite de volées par manche. **Ni les prénoms, ni le robot.** |
| Q2 | Formats à plus de 2 camps | On ne mémorise **que les formats en simple à 2 joueurs**. Un match à 3 ou 4 joueurs, en 2 contre 2 ou contre le robot ne change pas le format mémorisé. |
| Q3 | « ← Partie rapide » depuis l'écran complet | **Garde le format en cours** au lieu de rétablir le standard. |
| Q4 | Libellés de la carte | **Inchangés** (« Partie proposée »). |
| Q5 | Revenir au standard | Un bouton **« Revenir au standard »** sous la carte, visible seulement quand le format proposé diffère du standard. |

## Règles

- RM-01 Lancer un match X01 en simple à 2 joueurs sans robot, depuis la partie rapide ou l'écran complet, enregistre son format sur l'appareil ; lancer le standard efface le format mémorisé, ce qui revient au même.
- RM-02 La partie rapide s'ouvre avec le format mémorisé ; sans format mémorisé (première visite, stockage vide ou illisible), elle propose le standard actuel.
- RM-03 Au lancement depuis la partie rapide, le format effectivement lancé remplace le format mémorisé s'il diffère du standard ; si le format lancé est le standard, le format mémorisé est effacé.
- RM-04 « ← Partie rapide » conserve le format affiché dans l'écran complet (Q3) ; s'il n'est pas jouable en partie rapide (plus de 2 joueurs, doublettes, robot), il revient au format mémorisé.
- RM-05 Un match ouvert par lien partenaire (spec 030) ou par une configuration pré-remplie (revanche) ne lit ni ne modifie le format mémorisé.
- RM-06 La carte affiche le format réel : score, « Premier à N manches » ou « Premier à N sets », ouverture, sortie et, s'il y en a une, la limite de volées.
- RM-07 Un format mémorisé invalide ou obsolète (valeur hors bornes, champ manquant, autre version) est ignoré au profit du standard, sans erreur.
- RM-08 Le bouton « Revenir au standard » n'apparaît que si le format proposé diffère du standard. Un appui remet la carte au standard (501, premier à 3 manches, départ libre, fin sur un double, sans limite de volées), conserve les prénoms saisis et efface le format mémorisé ; le bouton disparaît.

## Critères d'acceptation

- AC-01 Je personnalise « Premier à 2 manches », je joue, je reviens au menu puis sur X01 : la carte propose « Premier à 2 manches » et « Lancer la partie » démarre ce format.
- AC-02 Un 701 Master Out mémorisé est relancé à l'identique depuis la partie rapide.
- AC-03 Un match à 3 joueurs, en 2 contre 2 ou contre le robot laisse le format mémorisé inchangé.
- AC-04 Un match par lien partenaire laisse le format mémorisé inchangé.
- AC-05 Après un rechargement de la page, le format mémorisé est toujours proposé.
- AC-06 Un stockage corrompu ou effacé ramène le standard 501, 3 manches, sortie double.
- AC-07 Les prénoms ne sont jamais mémorisés par cette fonction.
- AC-08 Avec un format « Premier à 2 manches » mémorisé, « Revenir au standard » affiche 501, premier à 3 manches, garde les prénoms et disparaît ; après retour au menu, X01 propose le standard.
- AC-09 Avec le standard proposé, le bouton « Revenir au standard » est absent.
- AC-10 Depuis un format mémorisé, je passe par « Personnaliser la partie », choisis un autre format éligible, reviens en partie rapide et lance : après retour au menu, ce dernier format lancé est proposé.
- AC-11 Avec un format personnalisé mémorisé, je choisis le standard dans l'écran complet, reviens en partie rapide et lance : à la prochaine ouverture, le standard est proposé et « Revenir au standard » est absent.

## Hors périmètre

- Les autres jeux (Cricket, Capital…) : pas de partie rapide.
- La mémorisation de plusieurs formats favoris.
- Le changement des libellés de la carte (Q4).

## Compatibilité

- Nouvelle clé de stockage local, indépendante de la session (`bougnat-app-session-v1`) et des réglages : aucune migration ; un retour arrière l'ignore simplement.
- Aucun impact sur le contrat partenaire `v=1`.

## Implémentation (2026-11-26)

- Modèle pur : `src/features/game-setup/x01QuickFormat.ts` (éligibilité, extraction, validation, sérialisation versionnée, standard) ; action `apply_x01_quick_format` de `src/features/game-setup/setupModel.ts`.
- Stockage : `src/infrastructure/local/x01QuickFormatStore.ts` (clé `bougnat-x01-quick-format`), contrôleur `src/app/x01QuickFormatController.ts`.
- Écran : `views/SetupView.tsx` (lecture à l'ouverture, enregistrement au lancement, « ← Partie rapide », « Revenir au standard ») et `components/game-setup/SetupQuickX01Section.tsx` (manches ou sets, limite de volées, bouton).
- Tests : `tests/unit/gameSetup/x01QuickFormat.test.ts` (modèle, stockage) et `tests/unit/components/setupViewQuickFormat.test.tsx` (AC-01 à AC-11).
- Contrôle visuel à 390×780 avec le format le plus long (701, sets, Master, 15 volées) : « Lancer la partie » visible sans défilement.
