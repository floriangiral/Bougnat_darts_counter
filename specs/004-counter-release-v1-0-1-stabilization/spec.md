---
id: 004-counter-release-v1-0-1-stabilization
v2_id: null
type: fonctionnel
statut: cloturee
validation: validee
statut_reel: "Clôturée le 2026-11-23 : release v1.0.1 publiée (tag et GitHub Release du 2026-04-24)."
traitement_propose: "Clôturer."
decision_traitement: validee
issue: null
verifie_au_commit: 863b4bd
derniere_revue: 2026-11-23
---
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

## Clôture (2026-11-23)

Vérifiée au commit `863b4bd` (`origin/develop`) ; décision du product owner du 2026-11-23 (spec 032, Q4, #215).

Critères vérifiés :

- Tag `v1.0.1` et GitHub Release « v1.0.1 » publiés le 2026-04-24.
- Notes et traçabilité présentes : `docs/release/v1.0.1.md`, `docs/release/v1.0.1-coverage-map.md`.
- Frontière respectée depuis : pas de backend métier, de profils distants ni de logique tournoi dans le dépôt (`scripts/guard-clean-codebase.sh`, exécuté par `npm run guard:clean`).

Aucun reliquat.
