# Plan — 036 Onboarding des agents IA (AGENTS.md)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. `AGENTS.md` a été créé par anticipation dans la PR `docs/v2-specs`.

## 1. Lecture de l'existant
- `AGENTS.md` (71 lignes, 6 sections) ; `CONTRIBUTING.md:35-48` (vérification minimale) ; `.github/pull_request_template.md` ; `package.json` (scripts) ; `playwright.config.ts`, `scripts/run-playwright.sh`, `docker/playwright.Dockerfile` (prérequis E2E).

## 2. Approche retenue (et alternatives écartées)
- **Retenue** : un fichier unique `AGENTS.md` (format ouvert), court, avec renvois ; contrôle automatique partagé avec `docs:check` (035).
- Écartée : un fichier par outil avec contenu dupliqué (dérive garantie).
- Écartée : instructions par dossier dès la V2 (coût de maintenance).

## 3. Étapes
1. Compléter `AGENTS.md` : prérequis E2E (FR-02), interdits (FR-03), définition de « terminé » (FR-04), règles de maintenance M-01 à M-06 (FR-05).
2. Vérifier/créer la cible `docs/roadmap-v2.md` ou corriger le lien (AC-03).
3. Ajouter au script `scripts/check-docs.mjs` (035) la vérification des `npm run <script>` cités (FR-06).
4. Ajouter la case FR-07 au modèle de PR et les règles M-01 à M-06 à `CONTRIBUTING.md`.
5. Selon Q1, créer `.github/copilot-instructions.md` (renvoi d'une ligne).
6. Essai à blanc AC-04 avec un agent sans contexte.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `AGENTS.md` | Compléments FR-02 à FR-05 |
| `CONTRIBUTING.md` | Règles de maintenance, renvoi |
| `.github/pull_request_template.md` | Case FR-07 |
| `scripts/check-docs.mjs`, `tests/unit/tooling/docsCheck.test.ts` | Contrôle des commandes citées (avec 035) |
| `.github/copilot-instructions.md` (selon Q1) | Renvoi |

## 5. Impacts UI / domaine / application / infrastructure
Aucun.

## 6. Stratégie de migration
Sans objet.

## 7. Stratégie de test
Test unitaire du contrôle (script cité inexistant → échec) ; essai manuel AC-04.

## 8. Non-régression
Contrôle en CI (via V2-QA-10) à chaque PR.

## 9. Rollback / désactivation
`git revert` ; aucun effet applicatif.

## 10. Documentation à mettre à jour avec l'implémentation
`AGENTS.md` à chaque spec qui supprime un piège connu (M-02) ; date revalidée à chaque release (M-03).
