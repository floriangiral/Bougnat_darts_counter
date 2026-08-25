# Spec 026 - counter release v1.1.2 stabilization

## Meta

- ID: `026-counter-release-v1-1-stabilization`
- Statut: `active`
- Milestone cible: `M9: Open Source Release v1.1`
- Issues GitHub: `#103` (issue parent historique v1.1; checklist v1.1.2 a creer)

## Objectif

Stabiliser et publier la release `v1.1.2` de `Bougnat_darts_counter` comme base open source propre, testee, documentee et publiable depuis `develop` vers `main`.

## Decisions

- la release `v1.1.2` consolide les travaux deja valides sur `v1.1.1`, puis les realigne sur `develop`
- aucun elargissement du scope open source n est autorise pendant cette stabilisation
- les clarifications de perimetre doivent supprimer les faux contrats d integration, pas les documenter comme si le runtime en dependait
- la documentation produit, la couverture spec-driven, le versioning package, l ecran d accueil et la gouvernance Git doivent raconter la meme release `v1.1.2`
- la gouvernance de branche, tag et PR reste celle de `spec:counter/release-governance-v1.0.x`

## Invariants critiques

- zero dependance runtime obligatoire a `Bougnat_Darts_Tournaments`
- zero regression sur le gameplay local, les jeux supportes, la reprise locale et l offline-first
- le voice scoring reste optionnel avec fallback manuel obligatoire
- la regle Capital `3 a cotes` suit l invariant canonique documente dans `docs/specifications.md`
- la cible Capital `Moins de 21` exige trois flechettes non miss et un total strictement inferieur a 21
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
- `docs/release/v1.1.2.md`
- `docs/release/v1.1.2-coverage-map.md`
- `views/HomeView.tsx`
- `components/ui/ChangelogModal.tsx`
- `specs/README.md`

## Canonical Entry Points

- `package.json`
- `docs/release/v1.1.2.md`
- `docs/release/v1.1.2-coverage-map.md`
- `views/HomeView.tsx`
- `release/1.1`

## Key Tests

- `npm run ci:check`
- `npm run test:e2e`
- `npm run preprod:check`
- `npm run production:check`

## Validation

- `develop` pousse avec la documentation `v1.1.2` et la version `1.1.2`
- PR `develop -> main` ouverte sans merge automatique