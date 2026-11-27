# Tâches — 137 « Je prends la gagne » en X01

> Spec validée par le product owner le 2026-11-27. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables

- [x] T000 Vérifier que la spec est `validee` et que les travaux parallèles sur `views/StatsView.tsx` (partage X01) sont intégrés ; passer la spec à `en-cours`. Spec `validee` le 2026-11-27 ; implémentée en parallèle des travaux sur le partage (modifications ciblées de `views/StatsView.tsx`), statut passé directement à `implementee`.

## Implémentation

- [x] T001 Modèle pur `src/features/x01/challenger/x01Challenger.ts` : éligibilité, sortant par défaut et ex æquo, validation des prénoms (RM-01, RM-04, RM-08 ; AC-02, AC-04, AC-07).
- [x] T002 Composition de la nouvelle partie : duel, 3-4 joueurs, plusieurs sortants, 2 contre 2, configuration reconduite (RM-03 à RM-07 ; AC-03 à AC-06). `buildTakeTheTableSetup`.
- [x] T003 Opérations de file : préremplissage, liste d'attente, ajout, retrait, montée, assainissement, plafond de 12 (RM-10 à RM-14 ; AC-08, AC-09). Dans `src/features/x01/challenger/x01ChallengerQueue.ts`.
- [x] T004 Rôles `rematch-*` et `challenge-*` dans les deux thèmes et le pont ; variantes `rematch` et `challenge` de `Button` (RM-19, P8 ; AC-01, AC-16). `src/styles/tokens/`, `components/ui/Button.tsx`.
- [x] T005 Fenêtre `components/stats/X01ChallengerDialog.tsx` et libellés (RM-02, RM-04, RM-09 à RM-17 ; AC-07 à AC-10, AC-17). Libellés dans `src/presentation/stats/x01ChallengerLabels.fr.ts`.
- [x] T006 Écran de fin `views/StatsView.tsx` : bouton, ordre, variantes, sortie automatique suspendue, disposition adaptative, cibles, `FitText` (RM-18 à RM-20 ; AC-01, AC-02, AC-11, AC-15). Règle tablette dans `src/styles/screens/tablet-pages.css`.
- [x] T007 Cycle de vie : `handleTakeTheTable` (sauvegarde, mémorisation partie rapide, file, démarrage sans question) et file vidée au retour au choix des jeux (RM-15, RM-16, RM-21 ; AC-03, AC-12 à AC-14). `handleTakeTheTable`, `skipStartingPlayerPrompt` passé par `App.tsx`.
- [x] T008 Session : champ optionnel `x01ChallengerQueue`, restauration, assainissement, écriture (RM-15 ; AC-12).

## Tests

- [x] T010 Tests unitaires du modèle (`tests/unit/x01/x01Challenger.test.ts`) : AC-03 à AC-09, AC-12 (assainissement), AC-13.
- [x] T011 Tests de composant de la fenêtre et de l'écran de fin : AC-01, AC-02, AC-07 à AC-11, AC-15, AC-17. `tests/unit/components/x01ChallengerDialog.test.tsx`, `tests/unit/components/statsViewActions.test.tsx`.
- [x] T012 Tests du cycle de vie et de `sessionRecovery` : AC-03, AC-12, AC-14. `tests/unit/app/useGameLifecycle.test.ts`, `tests/unit/session/x01ChallengerQueueRecovery.test.ts`, `tests/unit/session/x01TakeTheTableApp.test.tsx`.
- [x] T013 Test de contraste des nouveaux rôles et `npm run guard:clean` : AC-16.
- [ ] T014 Tests E2E du parcours (duel avec file, rechargement, Sortie) : exécutés en CI uniquement. **Écrit, à exécuter en CI** : `tests/e2e/x01-take-the-table.smoke.spec.ts` (duel avec file, rechargement, Quitter qui vide la file), jamais lancé en local.
- [x] T015 Non-régression : suites existantes de Revanche, partage, partenaire, ordre et places, partie rapide, autres jeux (AC-18) ; couverture `npm run test:unit:coverage && npm run governance:coverage`.

## Documentation et clôture

- [x] T020 Documentation : `docs/design-system.md`, `docs/specifications.md`, note d'exception dans la spec 133, `AGENTS.md` si besoin. Fait.
- [ ] T021 Notes de version `docs/release/v2.2.0.md` et changelog in-app `components/ui/ChangelogModal.tsx`. **Reporté** : notes de version et changelog in-app traités dans un lot séparé.
- [ ] T022 Passer la spec à `implementee`, renseigner `verifie_au_commit`, mettre à jour `specs/README.md` et l'issue. Fait : statut `implementee`, `specs/README.md`. **Reste** : `verifie_au_commit` (actuellement `null`) au commit d'intégration et commentaire sur l'issue #363.
- [ ] T023 Recette terrain (téléphone portrait et paysage, tablette, ordinateur, thèmes Sombre et Clair) avant `validation: validee`. **À faire** : recette terrain.
