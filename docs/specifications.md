# Bougnat Darts Counter - Product And Technical Specifications

## 1. Product Scope

Bougnat Darts Counter est une application de scorage de flechettes orientee usage terrain.

Le produit est pense pour :

- les joueurs qui veulent une interface claire et rapide
- les scoreurs qui ont besoin d une saisie fiable sous pression
- les clubs ou structures qui cherchent une base de scorage serieuse et reusable

Le scope courant couvre :

- ecran d accueil
- demarrage rapide de partie
- configuration d arena
- matchs locaux multi-modes
- statistiques de fin de partie
- reprise locale de session
- historique local
- assistance vocale `X01`

Les fonctions sociales, cloud et backend metier sont hors perimetre de `v1.0.2`.
Elles ne font plus partie du runtime supporte de l application open source.

## 1.bis Specification Discipline

Le projet adopte une approche spec-driven.

Cela signifie que :

- le perimetre produit est formule explicitement avant les refactors importants
- les responsabilites de chaque partie du systeme sont documentees
- les changements de comportement attendus doivent etre lisibles dans la documentation avant ou en meme temps que le code
- les migrations architecturales se font par phases, avec livrables clairs

## 2. User Journeys

### Quick game

1. Arrivee sur l accueil
2. Choix d un mode de jeu
3. Configuration des joueurs et des regles
4. Lancement du match
5. Saisie des scores
6. Consultation des statistiques
7. Rematch ou retour au menu

### Scoreur en match

1. Ouvre une partie en quelques actions
2. Suit les scores et les manches
3. Saisit les visites ou les scores restants selon le contexte
4. Utilise les aides visuelles et les raccourcis
5. Termine la partie sans sortir du flux de jeu

### Joueur

1. Lit le score a distance
2. Suit les fermetures et la progression de manche
3. Consulte les statistiques finales

## 3. Supported Game Modes

- `X01`
- `501 Double Out`
- `Cricket`
- `Capital`
- `Killer`
- `Gotcha`
- `Triathlon`

## 4. Current Functional Rules

### X01

- bust rule
- open / double / master in
- open / double / master out
- format legs / sets
- mode doubles selon la configuration
- assistance vocale optionnelle
- calcul du score restant pendant la volee

Fonctionnement de l assistance vocale `X01` :

- capture micro navigateur
- transcription temps reel
- parsing darts / X01 dedie
- proposition de score dans la barre de scoring
- validation finale par l utilisateur via le flux de score existant

Contraintes volontaires :

- uniquement `X01`
- pas d auto-validation
- fallback manuel permanent
- interpretation bornee au vocabulaire darts / score restant / score du tour

### Cricket

- fermeture progressive des segments
- score en surplus sur segments fermes
- statistiques specifiques de fin de partie

### Capital

- enchainement des cibles et progression par objectif
- historique des rounds
- statistiques de reussite et de regularite

### Triathlon

- enchainement multi-epreuves
- agregat final des performances
- ecran de resultat dedie

## 5. Frontend Structure

Principales zones frontend :

- `views/` : ecrans applicatifs
- `components/` : UI partagee et blocs metier
- `src/app/` : garde-fous d environnements, session locale et cycle de vie des jeux
  - `appShell.ts` : session persistence, screen guards
  - `useAppScreenHistory.ts` : historique ecrans pour le bouton retour
  - `useGameLifecycle.ts` : handlers de fin de partie, rematch et sortie de jeu [v1.0.2]
- `src/application/` : use cases et ports
- `src/infrastructure/` : persistence locale et adapters
- `src/features/game-setup/` : reducer de configuration, factories joueurs/config
  - `setupModel.ts` : reducer, etat, factories
  - `setupPresentation.ts` : labels, descriptions de regles, noms de jeux [v1.0.2]
- `src/features/x01/voice/` : moteur vocal `X01`
- `src/features/x01/hooks/` : hooks metier extraits des vues [v1.0.2]
  - `useMatchTimer.ts` : chronometre et horloge
  - `useMatchShortcuts.ts` : raccourcis score personnalisables
- `src/lib/` : utilitaires application
  - `env.ts` : variables d environnement typees
  - `analyticsInstance.ts` : singleton analytics [v1.0.2]
- `src/shared/` : types et utilitaires transverses

## 5.bis Traceabilite v1.0.2

Specifications locales actives :

- `spec:counter/scoring-access-modes`
- `spec:counter/offline-scoring-terminal-foundation`
- `spec:counter/voice-scoring-reliability`
- `spec:counter/release-v1.0.1-stabilization`
- `spec:counter/score-layout-font-scale-resilience`
- `spec:counter/inp-phase1-quick-wins`
- `spec:counter/gotcha-game`
- `spec:counter/killer-game`

Points d entree canoniques :

- `src/app/appShell.ts`
- `src/app/useGameLifecycle.ts` [v1.0.2]
- `src/application/scoring/*`
- `src/features/game-setup/setupModel.ts`
- `src/features/game-setup/setupPresentation.ts` [v1.0.2]
- `src/features/x01/hooks/useMatchTimer.ts` [v1.0.2]
- `src/features/x01/hooks/useMatchShortcuts.ts` [v1.0.2]
- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/features/x01/voice/*`
- `views/HomeView.tsx`
- `views/MatchView.tsx`

Jeux de tests clefs :

- `tests/unit/app/appShell.test.ts`
- `tests/unit/application/matchLifecycle.test.ts`
- `tests/unit/application/matchStats.test.ts`
- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/dartsSpeechParser.test.ts`
- `tests/unit/x01/matchScoring.test.ts`
- `tests/e2e/app.smoke.spec.ts`
- `tests/e2e/gameplay-entry.smoke.spec.ts`

## 6. Main Data Model

Les objets metier majeurs du coeur de scorage sont :

- `Game`
- `Leg`
- `Turn`
- `Throw`
- `Score`
- `ScoreInput`
- `Checkout`

Les objets applicatifs utiles au produit incluent aussi :

- session locale de jeu
- snapshot de match en cours
- historique local de parties
- etats de statistiques

## 7. Local Persistence Purpose

La persistence locale doit permettre :

- reprise d une partie apres reload
- restauration de l etat de jeu
- historique recent sur le device
- resilience offline

## 8. Architecture Direction

Le projet evolue vers une architecture :

- clean
- testable
- offline-first
- decouplee du backend

Principes :

- le domaine de scorage ne depend pas de React
- les use cases orchestrent la logique de partie
- la persistence locale est geree en infrastructure
- les integrations distantes futures passent par des ports explicites
- chaque fichier cible une responsabilite metier identifiable (principe Single Responsibility)
- les helpers de presentation (labels, descriptions) ne vivent pas dans les reducers d etat
- les handlers de lifecycle ne vivent pas dans le composant racine
- les effects secondaires isolables (timer, listeners) sortent dans des hooks dedies

Fichiers cibles du prochain cycle de decoupe :

- `views/SetupView.tsx` : extraire `PlayerConfigSection`, `GameRulesSection`, `SetupSummary`
- `src/features/x01/voice/useDeepgramStreaming.ts` : extraire `audioContextManager`, `deepgramConnectionManager`, `pcmBufferManager`
- `utils/triathlonScoring.ts` : types domaine → `src/domain/triathlon/`, regles → `src/domain/triathlon/triathlonScoringRules.ts`

## 9. Environment Model

### Local development

- application lancee avec Vite
- variables locales dans `.env.local`
- persistence locale sur le device

### Voice support

- option activee par configuration
- cle privee conservee hors frontend
- experience de scoring manuel toujours disponible

## 10. Voice Architecture

Le scoring vocal `X01` repose sur quatre couches :

- capture audio navigateur
- client de transcription temps reel
- parser darts / X01 contextualise
- integration UI dans `MatchView`

Principes :

- la cle privee reste hors frontend
- seul le resultat confirme est soumis comme score
- la logique metier darts reste separee des composants React
