# Spec 026 - counter release v1.1 stabilization

## Meta

- ID: `026-counter-release-v1-1-stabilization`
- Statut: `active`
- Milestone cible: `M9: Open Source Release v1.1`
- Issues GitHub: `#103`

## Objectif

Stabiliser et publier la release `v1.1` de `Bougnat_darts_counter` comme base open source propre, testee, documentee et publiable via `release/1.1` puis PR vers `main`.

## Decisions

- la release `v1.1` consolide les travaux deja valides sur `release/1.0.2`, puis les realigne sur `develop`
- aucun elargissement du scope open source n est autorise pendant cette stabilisation
- les clarifications de perimetre doivent supprimer les faux contrats d integration, pas les documenter comme si le runtime en dependait
- la documentation produit, la couverture spec-driven, le versioning package, l ecran d accueil et la gouvernance Git doivent raconter la meme release
- la gouvernance de branche, tag et PR reste celle de `spec:counter/release-governance-v1.0.x`

## Invariants critiques

- zero dependance runtime obligatoire a `Bougnat_Darts_Tournaments`
- zero regression sur le gameplay local, les jeux supportes, la reprise locale et l offline-first
- le voice scoring reste optionnel avec fallback manuel obligatoire
- aucun merge direct sur `main`
- traceabilite commit -> spec -> code -> tests -> issue obligatoire jusqu a la PR release

## Impacted Code

- `package.json`
- `package-lock.json`
- `README.md`
- `docs/architecture.md`
- `docs/product-scope.md`
- `docs/technical.md`
- `docs/specifications.md`
- `docs/release/v1.1.md`
- `docs/release/v1.1-coverage-map.md`
- `views/HomeView.tsx`
- `components/ui/ChangelogModal.tsx`
- `specs/README.md`

## Canonical Entry Points

- `package.json`
- `docs/release/v1.1.md`
- `docs/release/v1.1-coverage-map.md`
- `views/HomeView.tsx`
- `release/1.1`

## Key Tests

- `npm run ci:check`
- `npm run test:e2e`
- `npm run preprod:check`
- `npm run production:check`

## Validation

- `develop` pousse avec la documentation `v1.1` et la version `1.1.0`
- branche `release/1.1` creee depuis `develop`
- tag `v1.1` pose sur le commit release valide
- PR `release/1.1 -> main` ouverte sans merge automatique