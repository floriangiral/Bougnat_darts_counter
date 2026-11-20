# Plan - Sonar coverage governance

## Phase 1 - Contract

- Publish the coverage classification and exception rules in `spec.md`.
- Reference the contract from `CONTRIBUTING.md` and `specs/README.md`.

## Phase 2 - CI alignment

- Keep Vitest global floors and Sonar new-code coverage as independent gates.
- Ensure every Playwright browser declared in `playwright.config.ts` is installed by CI.
- Keep coverage exclusions narrow and documented.

## Phase 3 - Adoption

- Require every feature spec to declare changed layers and test strategy.
- Add unit tests for business and presentation-model behavior before merge.
- Add component or E2E acceptance tests for user-visible UI composition.
- Review temporary exceptions during release readiness checks.

## Exit criteria

- The contribution guide links to the active governance spec.
- CI configuration has no browser-install mismatch.
- Sonar exclusions are explicit and justified.
- New-code coverage remains at or above 80% on pull requests.

## Révision V2 — plan proposé

> Plan proposé (V2-QA-11), à exécuter uniquement après validation de la révision V2 de la spec. Les chemins exclus de la couverture sont écrits sans accents graves seuls (voir la convention de la révision V2 de `spec.md`).

1. **Lecture de l'existant** : `sonar-project.properties:8-9`, `vitest.config.ts:5-33`, `scripts/validate-sonar-coverage.mjs:1-35`, `.github/workflows/quality-gate.yml:79-147`, liste « Approved current exclusions » de `spec.md`.
2. **Approche retenue** : retrait progressif, une exclusion par PR d'extraction (058), garde-fou durci et testé, couverture « toutes sources » publiée à titre informatif. Écartées : retrait immédiat de toutes les exclusions (planchers non tenables sans extraction préalable) ; abaissement des planchers (interdit par la spec) ; exclusions par motif large.
3. **Étapes** :
   1. Garde-fou : analyser uniquement la section « Approved current exclusions » ; étendre les préfixes protégés ; ajouter `tests/unit/tooling/validateSonarCoverage.test.ts` (fichiers de configuration factices en mémoire ou dossier temporaire du test).
   2. Ajouter dans `spec.md` le tableau des exclusions restantes (raison, preuve, spec de retrait, critère de sortie).
   3. CI (avec 043) : étape informative « couverture toutes sources » (`vitest run --coverage` avec liste d'exclusions vide, rapport dans un dossier distinct) et résumé des fichiers modifiés exclus.
   4. Pour chaque jeu migré par 058 : retirer la vue de `sonar-project.properties` **et** de la liste approuvée dans la même PR ; vérifier les planchers.
   5. Après 061/049 : réévaluer views/SetupView.tsx, views/MatchView.tsx et App.tsx.
4. **Fichiers impactés** : `scripts/validate-sonar-coverage.mjs`, `tests/unit/tooling/validateSonarCoverage.test.ts` (nouveau), `sonar-project.properties`, `specs/029-…/spec.md` (liste et tableau), `.github/workflows/quality-gate.yml`.
5. **Migration** : aucune donnée ; ordre de retrait calé sur 058.
6. **Tests** : tests unitaires du garde-fou (V2-AC-02, V2-AC-03) ; `npm run test:unit:coverage` à chaque retrait (V2-AC-01) ; preuves E2E de 040.
7. **Non-régression** : planchers inchangés ; nouvelle couverture Sonar ≥ 80 % sur le code nouveau.
8. **Rollback** : réintroduire une exclusion n'est possible que comme exception temporaire documentée (invariant 8), avec issue de suivi.
9. **Documentation** : `CONTRIBUTING.md` (règle « aucune nouvelle exclusion de vue »), guide de test (035), `AGENTS.md` (036).
