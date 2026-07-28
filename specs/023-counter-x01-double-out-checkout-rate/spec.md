# Spec 023 - counter x01 double out checkout rate

## Meta

- ID: `023-counter-x01-double-out-checkout-rate`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Redefinir le taux de checkout X01 en `Double Out` pour mesurer des tentatives reelles de finish, sans penaliser les tours de placement joues depuis une plage de checkout.

## Decisions

- le calcul reste dans la couche application, sans dependance React ni UI
- une opportunite de checkout reste un score de depart de tour finissable en 3 flechettes ou moins
- une tentative de checkout est comptee uniquement si le tour depuis cette opportunite se termine par un finish reussi ou par un bust
- un tour de placement depuis une opportunite de checkout ne compte pas comme tentative
- le detail `1 fleche / 2 fleches / 3 fleches` repose sur les flechettes reellement lancees sur la tentative comptee

## Invariants critiques

- aucune chaine de presentation n est ajoutee dans `matchStats`
- le taux de checkout reste derive uniquement de l historique de match et des regles X01
- en `Double Out`, un placement volontaire ne degrade plus le taux de checkout
- un finish valide continue a compter comme tentative et comme reussite
- un bust depuis une opportunite de checkout compte comme tentative ratee

## Impacted Code

- `src/application/scoring/matchStats.ts`
- `tests/unit/application/matchStats.test.ts`
- `src/presentation/stats/statsPresenter.fr.ts`

## Canonical Entry Points

- `calculateDetailedStats*`
- `getMinDartsForScore`

## Key Tests

- `tests/unit/application/matchStats.test.ts`
- `npm run test:unit -- tests/unit/application/matchStats.test.ts`
- `npm run typecheck`

## Validation

- un checkout reussi en 1, 2 ou 3 flechettes alimente le bon bucket
- un bust depuis une opportunite de checkout augmente les tentatives sans augmenter les reussites
- un score de placement depuis une opportunite de checkout ne modifie pas les tentatives