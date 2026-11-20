# Plan — 027 Affichage tablette

> Fichier créé lors de la révision V2 du 2026-11-20 : la spec 027 historique n'avait pas de plan.

## Révision V2 — plan proposé

> Plan proposé pour V2-TAB-04. Il ne s'exécute qu'après validation de la Révision V2 par le product owner.

### 1. Lecture de l'existant
- `src/features/tablet/tabletLayout.ts:22-62`, `useTabletLayout.ts`, `App.tsx:213-220`, `:322-327`.
- `src/styles/tailwind.css:112-270` (contrat tablette), `:494-540` (exceptions pavé, bureau compact).
- `tests/e2e/tablet-layout.smoke.spec.ts:17`, `playwright.config.ts:24-36`, `tests/unit/tabletLayout.test.ts`.

### 2. Approche
027 n'est pas réimplémentée : elle est **corrigée** par 071 puis **remplacée** par 070, 072 et 073. Ce plan coordonne la succession et la traçabilité.

### 3. Étapes
1. Livrer 071 (correctifs, invariants 3 et 5) — Lot 0.
2. Livrer 070 (résolveur) — Lot 1 ; retirer la définition 768-1279.
3. Livrer 072 (arène) et 073 (orientation) — Lot 2.
4. Reporter les invariants conservés (2, 4, 6, 7, isolation téléphone/bureau) dans les sections « non-régression » de 070 et 072.
5. Arbitrer la fusion avec 028 (Q2) ; préparer la fiche de traçabilité de 027.
6. Statut final de 027 décidé par le PO (Q1).

### 4. Fichiers impactés
Ceux de 070, 071, 072, 073 (voir leurs plans). Pour 027 elle-même : `specs/027-counter-tablet-display/*` (statut, `remplacee_par`) et l'index des specs (gouvernance).

### 5. Stratégie de test
Celle des successeurs ; vérification finale : V2-AC-01 à V2-AC-03.

### 6. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Invariant perdu lors de la succession | Moyen | Moyenne | Report explicite dans 070/072 (étape 4) |
| Deux définitions de « tablette » coexistent trop longtemps | Moyen | Moyenne | Seuils transitoires de 071 retirés à la livraison de 070 |
| Fusion 027/028 prématurée | Faible | Faible | Fusion après arbitrage de 028 (V2-TAB-06) |

### 7. Rollback
Sans objet pour 027 (spec de succession) ; chaque successeur a son propre rollback.

### 8. Documentation
Notes de release (points connus tablette levés), index des specs, guide tablette.
