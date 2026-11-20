# Plan — 056 Frontières de couches et sort du domaine X01 inutilisé

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Règle documentée : `docs/architecture.md:105-109`.
- Lint : `eslint.config.js`, `package.json:15` (`--max-warnings 0`).
- Violations V1-V7 et cycle de types : voir spec §4.
- Code mort : `src/domain/scoring/**`, `src/application/scoring/{RecordThrow,UndoThrow,StartGame,EndLeg,EndGame,index}.ts`, `src/application/scoring/ports.ts:9-10`, `src/features/x01/session/useSharedX01Session.ts`, `src/app/appShell.ts:21,23`.

## 2. Approche retenue (et alternatives écartées)
- Retenue : `no-restricted-imports` natif, en `error`, avec liste d'exceptions décroissante.
- Écartées : `eslint-plugin-boundaries` / `dependency-cruiser` (nouvelle dépendance) ; règle en `warn` (incompatible avec `--max-warnings 0`) ; déplacement de `views/`/`components/` sous `src/` (coût sans gain).

## 3. Étapes
1. Ajouter les règles par dossier et la liste d'exceptions (V1-V7) ; test d'outillage.
2. Créer `src/domain/shared/` (types du noyau) ; `types.ts` ré-exporte ; retirer les `import(` de `types.ts` (casse le cycle) ; supprimer V1 et V4.
3. Déplacer `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `utils/triathlonScoring.ts` vers `src/domain/<jeu>/` avec ré-exports ; supprimer V6.
4. Déplacer `formatDuration` vers `src/presentation/` et la rotation vers `src/domain/match/rotation.ts`.
5. Déplacer `AppAccessMode` vers `src/shared/` (supprime V3) ; `IndexedDBSessionRepository` lit la clé de stockage depuis `src/shared/` ou `infrastructure` (supprime V5).
6. Après livraison de la spec 057 : supprimer `src/domain/scoring`, les use cases morts et leurs tests (ou les porter).
7. Supprimer `useSharedX01Session`, `SyncRepository`, `KILLER_STATS`/`GOTCHA_STATS` (selon Q3) ; compléter `guard-clean-codebase.sh`.
8. Supprimer les ré-exports transitoires ; vider la liste d'exceptions ; mettre à jour `docs/architecture.md`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `eslint.config.js` | Règles de couches + exceptions |
| `tests/unit/tooling/` | Test de la configuration |
| `types.ts` | Ré-export transitoire |
| `src/domain/shared/`, `src/domain/match/rotation.ts` | Création |
| `utils/{cricketLogic,capitalLogic,triathlonScoring}.ts` | Déplacement vers `src/domain/<jeu>/` |
| `src/application/scoring/**`, `src/domain/scoring/**` | Suppressions |
| `src/features/x01/session/useSharedX01Session.ts`, `views/MatchView.tsx` | Suppression du stub et de ses appels |
| `src/app/appShell.ts` | Écrans morts ; `AppAccessMode` déplacé |
| `scripts/guard-clean-codebase.sh` | Nouveaux fichiers interdits |
| `docs/architecture.md` | Arborescence et règle réelles |

## 5. Impacts UI / domaine / application / infrastructure
Aucun impact visible. Domaine enrichi du noyau de types et des moteurs legacy ; application allégée ; infrastructure inchangée fonctionnellement.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune migration de données : seuls des chemins d'import changent.

## 7. Stratégie de test
Test d'outillage ESLint ; suites existantes rejouées à chaque étape ; couverture (spec 029) contrôlée après suppression des tests du domaine mort.

## 8. Non-régression
`typecheck`, `test:unit`, `build`, E2E smoke à chaque PR.

## 9. Rollback / désactivation
Chaque étape est une PR réversible ; la règle ESLint peut être désactivée par dossier en cas de blocage, avec ticket.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (arborescence, règle, convention `features/`), `CONTRIBUTING.md` (commande lint), futur `AGENTS.md` (spec 036).
