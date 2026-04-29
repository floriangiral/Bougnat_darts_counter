# Tasks — Spec 022

## Livrables

| Tâche | Commit | Statut |
|---|---|---|
| useGameLifecycle.ts extrait de App.tsx | `71ff0f0` | ✅ livré |
| analyticsInstance.ts singleton | `71ff0f0` | ✅ livré |
| useMatchTimer.ts extrait de MatchView | `71ff0f0` | ✅ livré |
| useMatchShortcuts.ts extrait de MatchView | `71ff0f0` | ✅ livré |
| setupPresentation.ts extrait de setupModel | `71ff0f0` | ✅ livré |
| Suppression X01_501_BO5 / isQuickPreset | `55f6bb0` | ✅ livré |
| SetupPlayersSection.tsx extrait de SetupView | local | ✅ livré |
| SetupSummarySection.tsx extrait de SetupView | local | ✅ livré |
| setupViewModel.ts helpers de composition | local | ✅ livré |
| voiceStreamingModel.ts helpers purs Deepgram | local | ✅ livré |
| voiceStreamingLogger.ts logs structures | local | ✅ livré |
| triathlonTypes.ts et triathlonScoringRules.ts | local | ✅ livré |
| capitalGameModel.ts state machine | local | ✅ livré |
| cricketGameModel.ts helpers de match | local | ✅ livré |
| audioContextManager.ts capture audio | local | ✅ livré |
| deepgramConnectionManager.ts socket Deepgram | local | ✅ livré |

## Résultat

- App.tsx : 530 → 347 lignes (−183)
- MatchView.tsx : 892 → 848 lignes (−44)
- setupModel.ts : 609 → 459 lignes (−150)
- SetupView.tsx : sections joueurs + resume extraites vers 2 composants et 1 helper metier de presentation
- useDeepgramStreaming.ts : helpers buffer/transcript/logging/audio/socket extraits vers 4 modules
- triathlonScoring.ts : types/regles sortis du fichier utilitaire historique
- CapitalGameView.tsx / CricketGameView.tsx : logique pure déplacée vers des game models dédiés
- 15 nouveaux modules à responsabilité unique au total sur la spec
- 12 fichiers nettoyés (suppression X01_501_BO5)
- CI local vert : 132/132 tests unitaires + typecheck
