# Plan — 109 Étude : cadrage du contrat compteur ↔ Bougnat_Darts_Tournaments

> Plan proposé. Il ne s'exécute qu'après validation de la spec et disponibilité du contrat de projection V2-TV-02 (084).

## 1. Lecture de l'existant
- Compteur : `types.ts:28-55`, `src/features/external-match/externalMatchLink.ts`, `public/_headers:2`, état X01 remonté au shell dans `App.tsx`.
- BDT : `internal/platform/config/config.go:82-87`, `internal/modules/runtimeops/domain/runtime.go:196-250`, `specs/042-bdt-runtime-scoring-live/spec.md`.
- Workspace : `.specify-workspace/constitution.transverse.md` §1-5, `.specify-workspace/backlog/next-specs.md`.

## 2. Approche retenue (et alternatives écartées)
Cadrage documentaire et atelier conjoint, livrables déposés dans le workspace. Écarté : implémentation d'un adaptateur avant 057, 058 et 084.

## 3. Étapes
1. Relire 084 (projection) et l'état d'avancement de 057 et 058.
2. Rédiger la table de correspondance `Turn` → `ScoreVisit` et les cas non couverts.
3. Préparer l'atelier Q1 à Q8 ; le tenir avec le mainteneur BDT.
4. Rédiger la note de cadrage du workspace `001-xrepo-scoring-contract-v1`.
5. Proposer un complément à ADR-0009 (adaptateur réseau optionnel, CSP).
6. Soumettre D1 à D5 au product owner.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `specs/109-counter-bdt-contract-framing/cadrage.md` (nouveau) | Synthèse côté compteur |
| `.specify-workspace/…/001-xrepo-scoring-contract-v1` | Hors de ce dépôt, après accord |

Aucun code applicatif.

## 5. Impacts UI / domaine / application / infrastructure
Aucun pendant l'étude ; la cible prévoit un adaptateur d'infrastructure réseau isolé.

## 6. Stratégie de migration
Sans objet pendant l'étude ; la future spec traitera la file hors ligne et la reprise.

## 7. Stratégie de test
Scénarios de conformité rédigés (idempotence, séquence obsolète, coupure réseau) pour la future spec.

## 8. Non-régression
Aucun changement ; le mode sans BDT et `v=1` restent la référence.

## 9. Rollback / désactivation
Sans objet ; la cible devra être inactive sans session de cible.

## 10. Documentation à mettre à jour
Aucune dans ce dépôt pendant l'étude.
