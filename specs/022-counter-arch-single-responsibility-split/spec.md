# Spec 022 — Architecture : Découpage Single Responsibility

**Slug** : `spec:counter/arch-single-responsibility-split`
**Statut** : `active`
**Milestone** : M6 — Architecture & Technical Cleanup

## Contexte

`App.tsx`, `views/MatchView.tsx`, `views/SetupView.tsx`, `src/features/game-setup/setupModel.ts` et `src/features/x01/voice/useDeepgramStreaming.ts` avaient évolué en fichiers centraux trop volumineux. Chaque fichier portait plusieurs responsabilités : state management, effets secondaires, présentation, orchestration ou diagnostics runtime.

Cette concentration rendait les fichiers difficiles à lire, à tester et à faire évoluer.

## Objectif

Découper chaque fichier central en modules à responsabilité unique, sans modifier le comportement observable de l'application ni exposer plus d'informations runtime au client.

## Périmètre

- `App.tsx` → lifecycle handlers extraits dans `src/app/useGameLifecycle.ts`
- `views/MatchView.tsx` → timer extrait dans `src/features/x01/hooks/useMatchTimer.ts`, shortcuts dans `src/features/x01/hooks/useMatchShortcuts.ts`
- `src/features/game-setup/setupModel.ts` → fonctions présentation extraites dans `src/features/game-setup/setupPresentation.ts`
- Observabilite frontend extraite a l epoque dans un singleton partage, depuis retiree
- `views/SetupView.tsx` → sections UI extraites dans `components/game-setup/SetupPlayersSection.tsx` et `components/game-setup/SetupSummarySection.tsx`, helpers de composition dans `src/features/game-setup/setupViewModel.ts`
- `src/features/x01/voice/useDeepgramStreaming.ts` → assemblage d'utterance / buffer PCM extraits dans `src/features/x01/voice/voiceStreamingModel.ts`, diagnostics extraits dans `src/features/x01/voice/voiceStreamingLogger.ts`
- `utils/triathlonScoring.ts` → types et regles extraits dans `src/domain/triathlon/`
- `views/CapitalGameView.tsx` → state machine extraite dans `src/features/capital/capitalGameModel.ts`
- `views/CricketGameView.tsx` → helpers competiteurs / snapshots / resume extraits dans `src/features/cricket/cricketGameModel.ts`

## Hors périmètre

- Comportements UI
- Logique de scoring
- Règles métier des jeux
- Flux de navigation

## Contraintes

- Aucune régression sur les 120 tests unitaires existants
- CI vert obligatoire après chaque sous-tâche
- Aucune feature exploratoire introduite
- Les logs client ne doivent pas exposer des payloads vocaux complets ni des erreurs fournisseur brutes

## Decision v1.0.3

Le refactoring courant prolonge la spec 022 sur les hotspots encore ouverts sans changement fonctionnel volontaire.

- `SetupView.tsx` : extraction de la configuration joueurs/bot et du résumé de match hors du composant écran
- `setupViewModel.ts` : centralisation des options joueurs, labels de résumé et choix de starters d'équipes
- `useDeepgramStreaming.ts` : extraction de l'assemblage des utterances, de la file PCM bornée et du logging runtime
- `voiceStreamingLogger.ts` : logs debug limités au mode dev, erreurs client structurées sans payload brut

Resultat: baisse du couplage dans le setup et le voice streaming, nouveaux helpers purs testés, et réduction du bruit de logs sensibles côté navigateur.

## Decision v1.0.4

La passe courante poursuit le backlog de decoupe sur les fichiers de domaine et les ecrans de match encore trop couplés.

- `utils/triathlonScoring.ts` : types et regles formalisés dans `src/domain/triathlon/triathlonTypes.ts` et `src/domain/triathlon/triathlonScoringRules.ts`
- `CapitalGameView.tsx` : reducer, snapshots et tri des résultats sortis dans `src/features/capital/capitalGameModel.ts`
- `CricketGameView.tsx` : competiteurs, snapshots, agrégats et resume de match sortis dans `src/features/cricket/cricketGameModel.ts`
- `useDeepgramStreaming.ts` : gestion audio et connexion Deepgram sorties dans `audioContextManager.ts` et `deepgramConnectionManager.ts`

Resultat: le domaine triathlon n'est plus embarqué dans un utilitaire unique, les vues Capital/Cricket perdent leur logique pure la plus dense, et le hook voice se recentre sur l'orchestration React.

## Decision v1.1.5

La passe de refactor continue sur `MatchView.tsx` par extraction des décisions
de présentation métier encore embarquées dans le composant.

- `isCheckoutPossible` est extrait vers `src/features/x01/scoring/checkoutEligibility.ts`
- le rendu d'une zone joueur X01 est extrait vers `components/game/MatchPlayerArea.tsx`
- les scores bogey et les règles `Open`, `Double` et `Master` restent inchangés
- le helper est couvert par des tests unitaires indépendants de React
- `MatchView.tsx` reste responsable du wiring UI et de l'orchestration du rendu

Fichiers restant a decouvper (backlog):

- `views/SetupView.tsx` : poursuivre l'extraction de `GameRulesSection` si le flux setup evolue encore
- `src/features/x01/voice/useDeepgramStreaming.ts` : poursuivre le decoupage fin des callbacks evenementiels si le flux vocal evolue encore
- `views/CapitalGameView.tsx` : extraire le rendu winner/statistiques si de nouvelles variantes UI arrivent
- `views/CricketGameView.tsx` : extraire un hook d'orchestration de tour si le flux cricket continue de grossir
- `utils/triathlonScoring.ts` : migrer eventuellement les calculateurs d'epreuves vers `src/domain/triathlon/` si de nouvelles regles sont ajoutees
