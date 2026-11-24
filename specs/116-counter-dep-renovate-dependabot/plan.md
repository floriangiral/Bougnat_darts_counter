# Plan — 116 Renovate et Dependabot (veille de sécurité)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `.github/dependabot.yml:1-28` ; réglage « Dependabot security updates » actif.
- `package.json:5-95` (packageManager, engines, dépendances, overrides, allowScripts) ; `package-lock.json`.
- `.nvmrc` ; aucun outillage Docker maintenu depuis la décision du product owner du 2026-11-24.
- `docs/technical.md:63-150` (contraintes de versions et épinglage des actions).

## 2. Approche retenue (et alternatives écartées)

Retenue : application Mend Renovate hébergée, configuration versionnée, activation en trois temps (PR sans auto-merge → auto-merge des catégories sûres → retrait de Dependabot).
Écartées : Dependabot seul (pas de maturité configurable fine ni de Dashboard équivalent) [à confirmer : Dependabot propose désormais des options de délai] ; Renovate auto-hébergé (jeton à gérer) ; double outil (doublons).

## 3. Étapes

1. Opération manuelle (128) : installer l'application Mend Renovate sur ce seul dépôt ; accepter les permissions.
2. Fusionner la PR d'onboarding remplacée par un `renovate.json` complet (FR-01 à FR-05, FR-07, FR-10) avec `automerge: false` partout.
3. Job CI de validation de configuration (FR-08).
4. Supprimer `.github/dependabot.yml` dans la même PR (FR-09, version updates).
5. Observer 2 vagues ; ajuster groupes et limites.
6. Activer l'auto-merge des catégories autorisées (FR-06) après livraison de 114.
7. À la première PR de sécurité Renovate réussie : désactiver les mises à jour de sécurité Dependabot (115 FR-08).
8. Retirer `dependency-watch.yml` (113).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `renovate.json` (nouveau) | Configuration |
| `.github/dependabot.yml` | Suppression |
| `.github/workflows/ci.yml` (ou équivalent) | Job de validation de configuration |
| `docs/technical.md` | « Dependabot » → « Renovate » (`:149-150`), politique de mise à jour |
| `CONTRIBUTING.md`, documentation CI (128) | Politique, Dashboard, procédure en cas d'échec |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Période de recouvrement courte : les alertes Dependabot restent actives ; les mises à jour de sécurité Dependabot ne sont coupées qu'après preuve du relais Renovate.

## 7. Stratégie de test

PR jetable de configuration invalide (AC-07) ; observation des vagues (AC-02 à AC-04, AC-08) ; contrôle de l'absence de PR Dependabot après bascule (AC-06).

## 8. Non-régression

`npm ci`, build, E2E verts sur chaque PR Renovate ; contraintes TypeScript/Undici/@types/node respectées.

## 9. Rollback / désactivation

Désinstaller ou suspendre l'application Renovate ; restaurer `.github/dependabot.yml` depuis l'historique ; réactiver les mises à jour de sécurité Dependabot.

## 10. Documentation à mettre à jour avec l'implémentation

`docs/technical.md` (sections dépendances et actions), `CONTRIBUTING.md`, documentation CI (128), `AGENTS.md` (Renovate seul générateur de PR).
