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
- proposer 5 niveaux exclusifs avec moyenne cible: Amateur 30-40, Loisir 40-55, Club 55-70, Confirme 70-85, Pro 100-120

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
