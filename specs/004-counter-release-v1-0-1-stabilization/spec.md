# Spec 004 - counter release v1.0.1 stabilization

## Meta

- ID: `004-counter-release-v1-0-1-stabilization`
- Statut: `active`
- Milestone cible: `M7: Open Source Release v1.0.1`
- Issues GitHub: `#77`

## Objectif

Stabiliser et publier la release `v1.0.1` de `Bougnat_darts_counter` comme base open source propre, stable, lisible et exploitable.

## Decisions

- aucune extension fonctionnelle volontaire n est ajoutée pour cette release
- le périmètre public reste centré sur le scorage, les jeux, le voice scoring et les sessions locales
- tout ce qui relève du backend métier, des profils distants, des stats cloud et de la logique tournoi reste hors repo
- la documentation, les branches et les release notes doivent raconter la même histoire produit

## Invariants critiques

- zéro mélange entre open source scoring et métier propriétaire
- zéro ambiguïté sur le périmètre supporté
- le runtime doit rester utilisable en local et hors ligne
- les notes de version doivent refléter le vrai niveau de stabilisation

## Impacted Code

- `README.md`
- `docs/architecture.md`
- `docs/product-scope.md`
- `docs/specifications.md`
- `docs/release/v1.0.1.md`
- `docs/release/v1.0.1-coverage-map.md`
- `views/HomeView.tsx`

## Canonical Entry Points

- `HomeView`
- `MatchView`
- `SetupView`
- `docs/release/v1.0.1.md`

## Key Tests

- `npm run typecheck`
- `npm run lint`
- `npm run test:unit`
- `npm run build`

## Validation

- branche `release/1.0.1`
- tag `v1.0.1`
- PR vers `main`
