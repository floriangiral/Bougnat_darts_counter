# Plan — 111 Module neutre « match lié »

> Plan d'implémentation proposé. Il ne s'exécute qu'après validation de la spec **et** acceptation d'un deuxième canal partenaire.

## 1. Lecture de l'existant
- `src/features/external-match/externalMatchLink.ts` (478 l.), `externalMatchStartup.ts`, `externalMatchAddressBar.ts`.
- `src/shared/session/persistedAppSession.ts:12-31`.
- `App.tsx:91-104` (états), `:196-209` (navigation), `:270-305` (gestionnaires).
- Tests : `tests/unit/externalMatch/*`, `tests/e2e/external-match-link.smoke.spec.ts`.

## 2. Approche retenue (et alternatives écartées)
Refactor par étapes, chaque étape verte. Écartés : réécriture d'un coup ; port générique « PartnerIntegration » multi-protocoles (sur-conception).

## 3. Étapes
1. Vérifier la présence des tests golden de V2-INT-01.
2. Extraire `returnPolicy.ts` (fonctions de politique) avec réexports.
3. Extraire `contract/v1/inbound.ts` (analyse) et `contract/v1/outbound.ts` (URL de résultat et d'abandon).
4. Extraire `linkedMatch.ts` (contexte, gardes, TTL) et ajouter le champ `game` avec lecture rétrocompatible.
5. Extraire `linkedMatchResult.ts` (projection et statistiques).
6. Extraire `src/app/useLinkedMatch.ts` depuis `App.tsx`.
7. Supprimer les réexports, mettre à jour les en-têtes `// Spec:`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/external-match/externalMatchLink.ts` | Découpé puis supprimé ou réduit |
| `src/features/external-match/{linkedMatch,linkedMatchResult,returnPolicy}.ts` (nouveaux) | Modules purs |
| `src/features/external-match/contract/v1/{inbound,outbound}.ts` (nouveaux) | Adaptateurs `v=1` |
| `src/app/useLinkedMatch.ts` (nouveau) | Orchestration |
| `App.tsx` | Remplacement des états par le hook |
| `src/shared/session/persistedAppSession.ts` | Union discriminée du contexte |
| `tests/unit/externalMatch/*` | Imports mis à jour, test de restauration rétrocompatible |

## 5. Impacts UI / domaine / application / infrastructure
UI inchangée ; feature pure restructurée ; app shell allégé ; aucun changement d'infrastructure.

## 6. Stratégie de migration
Contexte sans `game` lu comme `x01` ; écriture du champ à chaque création. Aucune migration de stockage nécessaire.

## 7. Stratégie de test
Tests existants sans modification d'attendus ; ajout : restauration rétrocompatible, tests du hook ; couverture 100 % sur les modules purs.

## 8. Non-régression
Invariants 1 à 8 de la spec 030 ; tests golden ; E2E du lien.

## 9. Rollback / désactivation
Revert de la série de commits ; le champ `game` supplémentaire est ignoré par l'ancienne garde (à vérifier par test avant fusion).

## 10. Documentation à mettre à jour
Tableau « Changed layers » de la spec 030 (dans une Révision), `docs/architecture.md` (section intégrations), ADR-0009.
