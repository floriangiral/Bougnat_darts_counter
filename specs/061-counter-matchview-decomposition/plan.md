# Plan — 061 Découpage de MatchView (reliquat 022)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `views/MatchView.tsx` : responsabilités et lignes listées dans la spec §4.
- `App.tsx:85-199` (état, restauration, persistance), lien partenaire (`App.tsx:91-104`, `205-209`).
- Extractions existantes : `src/features/x01/hooks/*`, `src/features/x01/scoring/*`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : tests de composant d'abord, puis extraction hook par hook, après la spec 057.
- Écartées : réécriture complète de `MatchView` (risque) ; découpe immédiate de `useDeepgramStreaming` (bien testé, pas de besoin avant un 2ᵉ moteur).

## 3. Étapes
1. Écrire le test de composant `MatchView` (manche 101 complète, robot, voix simulée).
2. Extraire `useLegTransition`.
3. Extraire `useX01BotTurn` (retirer la dépendance au chrono).
4. Extraire `useX01VoiceAssist`.
5. Remplacer la détection `matchMedia` par la classe de taille de la spec 070.
6. Extraire l'écran de victoire et les modales en composants.
7. `App.tsx` : hook de restauration/persistance (aligné spec 010), hook partenaire, table de rendu.
8. Retirer les deux fichiers des exclusions de couverture.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `views/MatchView.tsx` | Réduction à la composition |
| `src/features/x01/hooks/{useLegTransition,useX01BotTurn,useX01VoiceAssist}.ts` | Création |
| `components/match/*` | Écran de victoire, modales |
| `App.tsx`, `src/app/*` | Hooks de session et partenaire |
| `sonar-project.properties` | Exclusions réduites |
| `tests/unit/x01/`, `tests/unit/app/` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI identique ; domaine inchangé ; application/features : nouveaux hooks ; infrastructure inchangée.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune.

## 7. Stratégie de test
Test de composant écrit avant toute extraction ; tests unitaires de chaque hook (minuteries simulées) ; E2E existants.

## 8. Non-régression
Golden tests X01, E2E X01 / partenaire / Triathlon / tablette / smartphone.

## 9. Rollback / désactivation
Une PR par extraction, réversible indépendamment.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (structure X01), spec 022 (clôture), `docs/technical.md` si des chemins cités changent.
