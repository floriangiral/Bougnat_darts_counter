---
id: 043-counter-qa-ci-hardening
v2_id: V2-QA-10
titre: Durcissement de la CI
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: qualite
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 40
depend_de: []
remplace: []
remplacee_par: []
issue: '#212'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 043 — Durcissement de la CI

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le rapport 10 (§3.4, constats C1 à C11) relève que plusieurs contrôles exigés des contributeurs ne tournent pas en CI, que les E2E ne sont exécutés que tardivement, et que le résumé de couverture affiche des planchers faux. Le compte rendu V2 (§B.3, §F.1, §G lot 0) classe ce durcissement en P0 : il conditionne la publication 2.0.0 (V2-REL-01, spec 033) et sécurise toutes les specs V2 suivantes.

## 2. Problématique

La CI peut être verte alors que des contrôles documentés comme obligatoires échouent, que des montées de dépendances cassent les E2E ou que la garde de code legacy est inopérante ; les chiffres affichés aux relecteurs sont faux.

## 3. Objectifs

- O1 : toute commande listée comme obligatoire dans `CONTRIBUTING.md` est exécutée en CI.
- O2 : les E2E tournent sur les PR vers `develop` (cible de Dependabot) et chaque nuit.
- O3 : les informations affichées (planchers, instabilités) sont exactes.
- O4 : l'exécution E2E en CI est déterministe (un seul serveur, port strict, journaux conservés).

## 4. État actuel vérifié dans le code

- [vérifié] C1 — Le job `validate` exécute `env:check`, `lint`, `typecheck`, `test:unit`, `build` (`.github/workflows/quality-gate.yml:42-55`) ; `lint:type-aware`, `guard:clean` et `wrangler:check` n'apparaissent dans aucun workflow (`grep` sur `.github/`), alors que `CONTRIBUTING.md:39-48` exige `lint:type-aware` et `wrangler:check`. `governance:coverage` ne tourne que dans le job Sonar (`quality-gate.yml:140-141`).
- [vérifié] `lint:type-aware` n'a pas `--max-warnings 0`, contrairement à `lint` (`package.json:15-16`).
- [vérifié] C2 — `e2e.yml:6-12` : PR vers `main`, `preprod`, `release/**` + déclenchement manuel ; ni `develop`, ni planification. Dependabot cible `develop` chaque semaine (`.github/dependabot.yml:6-8, 19-21`).
- [vérifié] C3 — Le résumé « Global Quality Baseline » écrit « Floors: 75% statements/lines, 60% branches, 75% functions » (`quality-gate.yml:115`) alors que les seuils réels sont 90/80/90/90 (`vitest.config.ts:28-33`, spec 029).
- [vérifié] C4 — `run-local-smoke` démarre `vite preview` en arrière-plan (`.github/actions/run-local-smoke/action.yml:49-53`) puis `npm run test:e2e` → `scripts/run-playwright.sh:75-91` en démarre un second sur le même port, faute de `PLAYWRIGHT_EXTERNAL_SERVER` ; aucun `--strictPort` ; journaux écrits dans `/tmp` (`action.yml:20`, `run-playwright.sh:82`) et non publiés.
- [vérifié] C5 — `scripts/guard-clean-codebase.sh:60, 65` utilise `rg` dans un `if` : si `rg` est absent, la commande renvoie 127, la condition est fausse et la garde passe [présence de `rg` sur `ubuntu-latest` : à confirmer].
- [vérifié] C6 — `retries: 1` en CI (`playwright.config.ts:7`) sans signalement des tests réussis au second essai.
- [vérifié] C7 — La couverture est calculée deux fois sur les PR vers `main` (`quality-gate.yml:97-98` et `137-138`).
- [vérifié] C8 — Sonar et Snyk dépendent de secrets (`quality-gate.yml:146`, `security-review.yml:99`) : échec attendu sur les PR de forks (dépôt public `floriangiral/Bougnat_darts_counter`).
- [vérifié] Le workflow `quality-gate.yml` est déjà planifié chaque lundi (`:16-17`) ; `promote-production.yml:96` exécute le smoke avant production.
- [vérifié] La spec 029 exige qu'« any change to either workflow requires a corresponding update to this spec and a CI validation note » (`specs/029-…/spec.md:121`).

## 5. Comportement cible

Le job `validate` exécute l'équivalent de `ci:check` plus `lint:type-aware`, avec la même liste que `CONTRIBUTING.md`. Les E2E tournent sur les PR vers `develop`, `main`, `preprod`, `release/**`, et chaque nuit sur `develop` (matrice complète de 042 quand elle existe). Le smoke CI utilise un seul serveur, sur un port strict, avec journaux publiés en artefact. Le résumé de couverture lit les seuils dans la configuration. Les tests instables sont listés dans le résumé. Les jobs à secret sont ignorés proprement sur les forks.

## 6. Périmètre

### Inclus
- C1 à C8 du rapport 10 ; alignement `CONTRIBUTING.md` ↔ CI.
- Réservation des emplacements CI pour `governance:specs` (V2-SDD-01, 032) et la garde de couches (V2-ARCH-01, 056).

### Exclu
- Contrôle de liens de documentation et « doc drift » (C10, C11 partiel) : portés par 032/034.
- Règles ESLint de couches (056), matrice d'appareils (042), visuels (041).

## 7. User stories

- En tant que mainteneur, je veux qu'une PR Dependabot vers `develop` exécute les E2E, afin de ne pas découvrir la casse à la release.
- En tant que contributeur externe, je veux que ma PR de fork ne soit pas rouge à cause d'un secret absent.

## 8. Règles métier

- RM-01 Une commande déclarée obligatoire dans la documentation contributeur est exécutée en CI, ou retirée de la liste.
- RM-02 Aucun seuil n'est affiché en dur dans un workflow : il est lu à la source.
- RM-03 Toute modification de workflow ajoute une note de validation à la spec 029.

## 9. Parcours utilisateurs

PR vers `develop` → jobs `validate` (complet), `e2e` (chromium + profils PR) → résumé exact → fusion. Chaque nuit → E2E complets sur `develop` → issue ou notification en cas d'échec.

## 10. Exigences fonctionnelles

- FR-01 Ajouter au job `validate` : `guard:clean`, `wrangler:check`, `governance:coverage`, `lint:type-aware`.
- FR-02 Décider (Q1) si `lint:type-aware` bloque sur avertissement ; appliquer la même règle localement et en CI.
- FR-03 `e2e.yml` : ajouter `develop` aux branches de PR, un `schedule` nocturne et l'exécution manuelle conservée.
- FR-04 Résumé de couverture : seuils lus depuis `vitest.config.ts` (ou une source unique partagée), plus de valeurs en dur.
- FR-05 `run-local-smoke` : un seul serveur (`PLAYWRIGHT_EXTERNAL_SERVER=1` ou suppression du démarrage dans l'action), `--strictPort`, journaux dans `$RUNNER_TEMP` publiés en artefact en cas d'échec.
- FR-06 `guard-clean-codebase.sh` : échec explicite si `rg` est absent (`command -v rg`), ou remplacement par `git grep`.
- FR-07 Signalement des tests « flaky » (réussis au second essai) dans le résumé du job, sans échec bloquant (Q3).
- FR-08 Couverture calculée une seule fois par exécution (artefact partagé entre baseline et Sonar, ou fusion des jobs).
- FR-09 Jobs Sonar/Snyk ignorés avec message explicite quand le secret est indisponible (PR de fork).
- FR-10 `CONTRIBUTING.md` « Vérification minimale » aligné sur la CI (ajout de `guard:clean` et `test:e2e`).

## 11. Exigences non fonctionnelles

- NFR-01 Durée du job `validate` augmentée de ≤ 3 min [à mesurer].
- NFR-02 Coût : minutes GitHub Actions ; dépôt public → runners standard gratuits [à confirmer] ; nightly estimée 15-25 min/jour.
- NFR-03 Sécurité : pas de secret exposé aux PR de forks ; actions toujours épinglées par SHA (`docs/technical.md`, section « Actions GitHub »).

## 12. Cas nominaux et alternatifs

- Nominal : PR conforme → tout vert, résumé exact.
- Alternatif : `rg` absent → `guard:clean` échoue avec message explicite.
- Alternatif : nightly rouge → notification (Q4) ; la PR suivante n'est pas bloquée.

## 13. Cas limites

- PR Dependabot (secrets restreints) : comportement identique à un fork pour Sonar/Snyk.
- `wrangler:check` sans réseau : le script ne lit que des fichiers locaux (`scripts/validate-wrangler-config.mjs:1-4`, aucun appel réseau) [vérifié].

## 14. Gestion des erreurs

Chaque étape ajoutée a un nom explicite ; en échec E2E, rapport Playwright et journal du serveur publiés.

## 15. Impacts architecturaux

Aucun sur l'application. Workflows, action composite, script de garde.

## 16. Impacts sur les données et les interfaces

Aucun.

## 17. Compatibilité avec l'existant

Les jobs et noms existants (statuts requis de branche protégée) sont conservés ; tout renommage de job exige la mise à jour des règles de protection [à vérifier dans les réglages GitHub].

## 18. Dépendances

- Aucune dépendance bloquante.
- Requis par : V2-REL-01 (033).
- Accueille : V2-SDD-01 (032, `governance:specs`), V2-ARCH-01 (056), V2-QA-09 (042, nightly), V2-QA-05 (041, job visuel).
- Mise à jour obligatoire : spec 029 (V2-QA-11).

## 19. Critères d'acceptation

- AC-01 Une PR qui réintroduit `index.css` (fichier interdit par `guard-clean-codebase.sh:14`) échoue au job `validate`.
- AC-02 Une PR qui ajoute une exclusion de couverture non documentée échoue au job `validate` (et non plus seulement au job Sonar).
- AC-03 Une PR vers `develop` déclenche le workflow E2E ; une exécution nocturne apparaît dans l'onglet Actions le lendemain de la fusion.
- AC-04 Le résumé de couverture affiche 90/80/90/90 ; modifier un seuil dans `vitest.config.ts` change l'affichage sans toucher au workflow.
- AC-05 Le journal du smoke montre un seul `vite preview` ; un port occupé fait échouer le démarrage au lieu de basculer.
- AC-06 Sur un environnement sans `rg`, `npm run guard:clean` échoue avec un message explicite.
- AC-07 Une PR de fork n'échoue pas à cause de `SONAR_TOKEN`/`SNYK_TOKEN` absents ; le résumé indique « analyse ignorée ».
- AC-08 Une note de validation CI datée est ajoutée à la spec 029.

## 20. Scénarios de tests

Validation par PR de démonstration (branches jetables) pour AC-01, AC-02, AC-05, AC-06 ; exécution réelle pour AC-03, AC-07.

## 21. Exigences de non-régression

Aucun contrôle existant retiré ; les seuils ne sont ni abaissés ni dupliqués ; `promote-production.yml` inchangé fonctionnellement.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| `lint:type-aware` révèle une dette importante | Moyen | Moyenne | Lot de correction préalable ou seuil d'avertissements temporaire documenté |
| Nightly rouge ignorée | Moyen | Moyenne | Notification et responsable désigné (Q4) |
| Renommage de jobs casse la protection de branche | Moyen | Faible | Conserver les noms |
| Temps CI accru | Faible | Élevée | Nightly pour la matrice complète |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | `lint:type-aware` bloquant sur avertissement ? | Oui (`--max-warnings 0`) / non | Oui après un lot de nettoyage ; sinon seuil chiffré temporaire | — |
| Q2 | E2E sur chaque PR vers `develop` ou nightly seule (H.8) ? | PR + nightly / nightly seule | PR (chromium + profils PR) + nightly complète | — |
| Q3 | Tests « flaky » : signaler ou bloquer ? | Signaler / bloquer | Signaler, puis bloquer si > 2 % sur 2 semaines | — |
| Q4 | Notification d'échec nocturne | Issue automatique / e-mail GitHub par défaut | Issue automatique étiquetée (aucun service tiers) | — |
| Q5 | `rg` ou `git grep` dans la garde ? | `rg` + contrôle / `git grep` | `git grep` (toujours présent, aucun prérequis) | — |

## 25. Traçabilité

Rapport `docs/v2/audit/10-docs-quality.md` (§3.4 C1-C11, V2-QA-10) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.3, §F.1, §G (lot 0), §H.8 ; specs 008, 029, 032, 033, 041, 042, 056.
