---
id: 016-counter-x01-simple-bot-opponent
v2_id: null
type: fonctionnel
statut: cloturee
validation: validee
statut_reel: "Clôturée le 2026-11-23 : robot X01 livré ; plage Pro alignée sur le code (86-120, affichée « + de 85 ») par décision PO."
traitement_propose: "Clôturer après arbitrage de la plage."
decision_traitement: validee
issue: null
verifie_au_commit: 863b4bd
derniere_revue: 2026-11-23
---
# Spec 016 - counter x01 simple bot opponent

## Meta

- ID: `016-counter-x01-simple-bot-opponent`
- Statut: `active`
- Milestone cible: `M2: Game Modes Stability`
- Issues GitHub: `#to-create`

## Objectif

Ajouter la possibilite de jouer contre un robot en X01, uniquement en format SIMPLE, avec un niveau technique reglable.

## Decisions

- exposer l option uniquement dans le setup X01 SIMPLE
- representer le robot comme un `Player` marque `isBot`
- generer les tours du robot dans une couche application X01 dediee
- garder Triathlon, Cricket, Capital et X01 Doublettes inchanges
- proposer 5 niveaux exclusifs avec moyenne cible: Amateur 30-40, Loisir 40-55, Club 55-70, Confirme 70-85, Pro 86-120 (affichée « + de 85 de moyenne ») — plage Pro alignée sur le code livré par décision du product owner du 2026-11-23 (voir « Clôture »)

## Invariants critiques

- le robot ne peut pas etre active en Doublettes
- le robot ne peut pas etre active hors X01
- une partie contre robot force une rotation simple a 2 joueurs
- les scores generes restent des scores de tour X01 possibles
- les finishes robot doivent etre reellement atteignables selon la regle de sortie
- le bot joue automatiquement son tour sans passer par la saisie humaine
- le clavier humain est bloque pendant le tour automatique du bot
- une victoire du bot affiche un apercu court avant la suite du flux

## Impacted Code

- `types.ts`
- `src/domain/x01Bot/x01Bot.ts`
- `src/application/x01Bot/x01BotTurn.ts`
- `src/features/game-setup/setupModel.ts`
- `views/SetupView.tsx`
- `views/MatchView.tsx`
- `tests/unit/gameSetup/setupModel.test.ts`
- `tests/unit/x01/x01BotTurn.test.ts`

## Key Tests

- `tests/unit/gameSetup/setupModel.test.ts`
- `tests/unit/x01/x01BotTurn.test.ts`
- `npm run typecheck`
- `npm run lint`

## Validation

- l option "Jouer contre un robot" apparait uniquement en X01 SIMPLE
- les 5 niveaux apparaissent quand l option est active
- le robot remplace le joueur 2 et joue automatiquement ses tours
- le clavier est inactif pendant le tour du robot
- une victoire de manche ou de match par le robot affiche un apercu de 2 secondes
- les validations unitaires, lint et typecheck passent

## Clôture (2026-11-23)

Vérifiée au commit `863b4bd` (`origin/develop`) ; décision du product owner du 2026-11-23 (spec 032, Q4, #215).

Critères vérifiés :

- Option « Jouer contre un robot » proposée uniquement en X01 simple (`components/game-setup/SetupPlayersSection.tsx:141-152`, `canPlayAgainstBot`) ; refus en doublettes (`src/features/game-setup/setupModel.ts:133`).
- Cinq niveaux exclusifs (`src/domain/x01Bot/x01Bot.ts:11-17`) ; le robot remplace le joueur 2 et force une partie à 2 joueurs (`X01_BOT_MATCH_PLAYERS`, `setupModel.ts:83-86`), y compris depuis le passage du X01 simple à 4 joueurs (spec 052).
- Tour automatique, clavier bloqué pendant le tour du robot (`views/MatchView.tsx:642-644`, `isKeyboardLocked`) et aperçu de victoire de 2 secondes (`MatchView.tsx:669-679`).
- Scores et finishes atteignables : `src/application/x01Bot/x01BotTurn.ts` ; tests `tests/unit/x01/x01BotTurn.test.ts`, `x01BotDefinition.test.ts`, `botVictoryPreview.test.ts`, `tests/unit/gameSetup/setupModel.test.ts`, verts.

Écart arbitré : la spec indiquait Pro 100-120 ; le code livré depuis `e94d921` (2026-04-29) utilise 86-120, affiché « + de 85 de moyenne » (`x01Bot.ts:16`, `formatX01BotAverageRange`). **Décision du product owner du 2026-11-23 : le comportement livré fait foi** ; la ligne « Decisions » ci-dessus est alignée, le code n'est pas modifié.

Aucun reliquat.
