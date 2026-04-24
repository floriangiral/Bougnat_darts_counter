# Spec 008 - counter e2e runtime reliability

## Meta

- ID: `008-counter-e2e-runtime-reliability`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#to-create`

## Objectif

Rendre les smoke e2e fiables entre local et CI en eliminant les causes frequentes de flakiness runtime (serveur non demarre, parallellisme instable, environnement incomplet).

## Decisions

- execution e2e locale stable priorisee sur la vitesse
- preconditions explicites: build, preview server, base URL joignable
- artifacts de debug conserves en cas d echec
- parite de comportement local/CI documentee

## Invariants critiques

- les scenarios critiques gameplay restent couverts
- pas de couplage aux services backend metier
- tests reproductibles sur runner standard

## Impacted Code

- `playwright.config.ts`
- `scripts/run-playwright.sh`
- `.github/workflows/reusable-integration-smoke.yml`
- `.github/workflows/e2e.yml`

## Canonical Entry Points

- commande `npm run test:e2e`
- workflow `Reusable Integration Smoke`

## Key Tests

- `npm run test:e2e`
- echec volontaire sans preview pour verifier message d erreur

## Validation

- 100% pass sur scenarios smoke cibles en local stable
- execution CI reproductible sans erreur environnementale recurrente
