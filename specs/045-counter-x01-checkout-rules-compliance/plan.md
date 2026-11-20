# Plan — 045 X01 : conformité des sorties

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Soumission : `src/features/x01/scoring/matchSubmission.ts:39-88` (`buildScoreSubmissionResult`), `:90-114` (`buildCheckoutConfirmResult`).
- Moteur : `src/application/scoring/matchLifecycle.ts:259-291` (`submitTurn`, bust l. 264).
- Finissabilité : `src/features/x01/scoring/checkoutEligibility.ts:5-15` ; doublons `ScoringRules.ts:4,25-35`, `matchStats.ts:3-4,63-80`, `x01BotTurn.ts:11,28-34`.
- Vue : `views/MatchView.tsx:388-423` (RESTE), `:425-480` (appui long, garde l. 429), `:836-856` (confirmation).
- Robot : `src/application/x01Bot/x01BotTurn.ts:18-26,57-86,110-113`.
- Aide : `components/game/CheckoutHint.tsx`, `components/match/MatchStatusPill.tsx:47`, `constants.ts` (`CHECKOUT_GUIDE`).

## 2. Approche retenue (et alternatives écartées)

Créer **une** fonction pure `getFinishInfo(remaining, rule) → { finishable, minDarts }` adossée à des tables précalculées (1 à 3 fléchettes, fléchettes finales par règle), placée dans `src/domain/scoring/` (emplacement à confirmer avec la spec 057). Tous les consommateurs l'utilisent.
Écartées : corriger chaque doublon séparément (perpétue la divergence) ; attendre la refonte complète de la spec 057 (bloque un P0).

## 3. Étapes

1. Écrire les golden tests de finissabilité (3 règles × restes 1-180) issus de la spec 050 / 039.
2. Implémenter `getFinishInfo` + tables ; supprimer les 4 listes de bogeys.
3. `submitTurn` : bust si reste 1 en Double **ou** Master.
4. `buildScoreSubmissionResult` : si total = reste et non finissable → `submitTurn` avec bust forcé et retour « SORTIE IMPOSSIBLE ».
5. `MatchView` : RESTE (cible 1 en Master), garde l. 429, confirmation filtrée par `minDarts`.
6. Robot : limite de placement `reste − 2` pour Double et Master ; fléchettes finales sans 25 en Master (Q1).
7. `getMinDartsForScore` délègue à `getFinishInfo`.
8. Aide de sortie : prop `rule`, routes par règle (Q3), libellé FR.
9. Migration Q4 (si retenue) dans la restauration de session.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/domain/scoring/` (nouveau module ou `ScoringRules.ts`) | Fonction et tables de finissabilité |
| `src/application/scoring/matchLifecycle.ts` | Bust Master à 1 ; option « bust forcé » |
| `src/features/x01/scoring/matchSubmission.ts`, `checkoutEligibility.ts` | Vérification avant confirmation ; délégation |
| `src/application/scoring/matchStats.ts` | `getMinDartsForScore`, `isCheckoutOpportunity` délèguent |
| `src/application/x01Bot/x01BotTurn.ts` | Bornes et fléchettes finales |
| `views/MatchView.tsx`, `components/game/CheckoutHint.tsx`, `components/match/MatchStatusPill.tsx` | Garde, RESTE, aide par règle |
| `src/features/x01/scoring/matchFeedback.ts` | Retour « SORTIE IMPOSSIBLE » |
| `tests/unit/**` cités en spec §20 | Nouveaux cas |

## 5. Impacts UI / domaine / application / infrastructure

Domaine : nouvelle fonction pure. Application : moteur et robot. UI : messages et aide. Infrastructure : migration de session (Q4) seulement.

## 6. Stratégie de migration

Pas de changement de schéma. Si Q4 = a : fonction pure `normalizeRestoredX01Match` (domaine/application) appelée après la restauration (`src/app/appShell.ts:124` → `src/infrastructure/local/sessionPersistence.ts:7`), qui convertit en trop une dernière visite laissant 1 en Master-Out (`currentMatch` et `matchRuntime.match`).

## 7. Stratégie de test

Unitaires table-driven (golden), tests robot à graine fixe (10 000 tirages), test composant de l'aide, E2E Double-Out 180. Couverture conforme à la spec 029.

## 8. Non-régression

Suites existantes `tests/unit/x01/*`, `tests/unit/application/*`, E2E X01 et lien externe (spec 030).

## 9. Rollback / désactivation

Changement de règle non flaggé (correctif de conformité) ; rollback par revert du commit. Les sessions restent lisibles par l'ancienne version (pas de champ ajouté).

## 10. Documentation à mettre à jour avec l'implémentation

Règles affichées (`src/features/game-setup/setupPresentation.ts:103-113`), référence des règles (spec 050), `docs/specifications.md`, notes de version.
