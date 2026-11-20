# Plan — 035 Organisation documentaire, statuts de page et ADR

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et clôture de V2-DOC-01 (034).

## 1. Lecture de l'existant
- `docs/technical.md:393-412` (index actuel), `docs/architecture.md:160-225` (décisions et contrôles de release), `docs/architecture/*.md` (archives v1.0.0), `docs/adr/` et `docs/v2/` (initialisés par la PR `docs/v2-specs`).
- Références entrantes à vérifier avant tout déplacement : `grep -rn "docs/" README.md CONTRIBUTING.md AGENTS.md specs tests components`.

## 2. Approche retenue (et alternatives écartées)
- **Retenue** : bandeaux + index + ADR + contrôle automatique d'abord (valables quelle que soit Q1), puis réorganisation par public (option B) en un seul lot si Q1 = B.
- Écartée : générateur de site (nouvelle dépendance, hébergement).
- Écartée : réorganisation progressive page par page (liens instables pendant plusieurs lots).

## 3. Étapes
1. Ajouter la légende des statuts dans `docs/README.md` (nouveau) et la référencer depuis `.specify/conventions.md`.
2. Poser le bandeau sur chaque page de `docs/`.
3. Écrire `scripts/check-docs.mjs` + script `docs:check` dans `package.json` ; test unitaire sur fixtures.
4. Convertir les « Decision vX » en ADR `acceptee` (0010+), retirer les sections de `docs/architecture.md`.
5. Rédiger les ADR complémentaires au statut `proposee` (résultat non signé, frontière backend/relais, portrait téléphone, baseline navigateurs, Node/npm, React 19).
6. Si Q1 = B : `git mv` vers l'arborescence cible, renvois aux anciens chemins, mise à jour des liens (README, CONTRIBUTING, AGENTS, specs).
7. Créer `product/status.md` (état livré) et `architecture/access-modes.md`.
8. Demander à V2-QA-10 d'ajouter `docs:check` au job `validate`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `docs/README.md` (nouveau) | Index + légende |
| `docs/**/*.md` | Bandeau de statut ; déplacements si Q1 = B |
| `docs/architecture.md` | Retrait des « Decision vX » |
| `docs/adr/00NN-*.md` (nouveaux) | ADR historiques et complémentaires |
| `scripts/check-docs.mjs` (nouveau), `package.json` | Contrôle `docs:check` |
| `tests/unit/tooling/docsCheck.test.ts` (nouveau) | Test du contrôle |
| `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `.specify/conventions.md` | Liens |

## 5. Impacts UI / domaine / application / infrastructure
Aucun.

## 6. Stratégie de migration
Déplacements par `git mv` (historique conservé) ; page de renvoi d'une ligne à chaque ancien chemin pendant au moins une version mineure.

## 7. Stratégie de test
Test unitaire du script ; exécution sur le dépôt en CI ; relecture des liens du `README.md`.

## 8. Non-régression
`tests/unit/tooling/partnerSimulator.test.ts` vert (simulateur non déplacé ou test adapté).

## 9. Rollback / désactivation
`git revert` du lot ; le contrôle `docs:check` peut être retiré de la CI sans effet applicatif.

## 10. Documentation à mettre à jour avec l'implémentation
`AGENTS.md` (§6 « Où trouver quoi »), `CONTRIBUTING.md`, `.specify/conventions.md`, `docs/adr/README.md`.
