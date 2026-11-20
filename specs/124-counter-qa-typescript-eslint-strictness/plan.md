# Plan — 124 TypeScript strict et règles ESLint

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `tsconfig.json:1-32`, `eslint.config.js:44-72`, `eslint.type-aware.config.js`, `package.json:15-17`, `views/MatchView.tsx:164, 228`.

## 2. Approche retenue (et alternatives écartées)

Retenue : verrouillage immédiat des options à 0 erreur, lots ciblés pour les options restantes, cliquet sans dépendance.
Écartées : tout activer d'un coup (356 erreurs) ; plugin `eslint-comments` (dépendance supplémentaire pour un besoin couvert par un script).

## 3. Étapes

1. PR 1 : FR-01 (aucun changement de code attendu) ; vérifier l'usage de décorateurs avant retrait des options associées.
2. PR 2 : `ecmaVersion`, `purity`, `ban-ts-comment`, cliquet (`quality-ratchet.json` initialisé à 2 directives).
3. PR 3 : 33 corrections `exactOptionalPropertyTypes` + activation.
4. PR 4 : `tsconfig.strict-core.json` + corrections domaine/application + job CI.
5. PR 5+ : `set-state-in-effect`/`refs` selon Q2 ; extension de `noUncheckedIndexedAccess` selon Q1.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `tsconfig.json`, `tsconfig.strict-core.json` (nouveau) | Options strictes |
| `eslint.config.js` | `ecmaVersion`, règles |
| `scripts/ci/count-suppressions.mjs`, `quality-ratchet.json` (nouveaux) + tests | Cliquet |
| `package.json` | Script `typecheck:core` |
| Fichiers concernés par les 33 + 15 corrections | Corrections ciblées |
| `CONTRIBUTING.md`, `AGENTS.md` | Règles de contournement |

## 5. Impacts UI / domaine / application / infrastructure

Corrections de typage sans changement de comportement ; vues touchées uniquement pour les règles React Hooks.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Suite complète à chaque PR ; PR jetables négatives ; tests du script de cliquet.

## 8. Non-régression

E2E complets sur les PR touchant des vues (règles React Hooks).

## 9. Rollback / désactivation

Revert de l'option concernée (décision PO requise par RM-01).

## 10. Documentation à mettre à jour avec l'implémentation

`CONTRIBUTING.md`, `AGENTS.md` (§5 règles), `docs/technical.md` (section lint et typage).
