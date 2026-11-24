---
id: 043-counter-qa-ci-hardening
v2_id: V2-QA-10
titre: Durcissement de la CI
type: fonctionnel
statut: implementee
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
verifie_au_commit: 7bdb292
derniere_revue: 2026-11-23
---

# 043 — Durcissement de la CI

> **Statut : IMPLÉMENTÉE, validation en attente.** Spec validée par le product owner le 2026-11-23 (« Go », recommandations retenues) ; code livré au commit `7bdb292`. Les observations GitHub réelles (PR de démonstration, exécution nocturne, PR de fork) restent à faire : voir « Implémentation ».

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
| Q1 | `lint:type-aware` bloquant sur avertissement ? | Oui (`--max-warnings 0`) / non | Oui après un lot de nettoyage ; sinon seuil chiffré temporaire | 2026-11-23 : `--max-warnings 0` si la dette est nettoyable dans ce lot, sinon seuil chiffré temporaire documenté. Appliqué : aucune dette (0 avertissement), `--max-warnings 0` en local et en CI |
| Q2 | E2E sur chaque PR vers `develop` ou nightly seule (H.8) ? | PR + nightly / nightly seule | PR (chromium + profils PR) + nightly complète | 2026-11-23 : E2E sur chaque PR vers `develop` (Chromium + profils PR) et exécution nocturne complète |
| Q3 | Tests « flaky » : signaler ou bloquer ? | Signaler / bloquer | Signaler, puis bloquer si > 2 % sur 2 semaines | 2026-11-23 : signaler, sans bloquer |
| Q4 | Notification d'échec nocturne | Issue automatique / e-mail GitHub par défaut | Issue automatique étiquetée (aucun service tiers) | 2026-11-23 : issue automatique étiquetée, unique par workflow, aucun service tiers |
| Q5 | `rg` ou `git grep` dans la garde ? | `rg` + contrôle / `git grep` | `git grep` (toujours présent, aucun prérequis) | 2026-11-23 : `git grep` |

## 25. Traçabilité

Rapport `docs/v2/audit/10-docs-quality.md` (§3.4 C1-C11, V2-QA-10) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.3, §F.1, §G (lot 0), §H.8 ; specs 008, 029, 032, 033, 041, 042, 056.

## Révision DevSecOps (2026-11-20)

> **Statut : validée avec la spec le 2026-11-23.** Proposition issue du chantier DevSecOps (audit `docs/v2/audit/11-devsecops.md`). DSO-FR-02 : la décision 113 Q1 (branche cible) n'étant pas prise, les E2E se déclenchent sur les PR vers `develop` **et** `main` (en plus de `preprod` et `release/**`).

### Articulation

Cette spec reste le **lot 0** de corrections ponctuelles de la CI existante. L'architecture cible des workflows est portée par **V2-CICD-01 (spec 113)**, l'agrégation des checks requis et l'auto-merge par **V2-CICD-02 (114)**, le sort de Snyk par **V2-SEC-02 (117)**. 043 ne renomme aucun job : la migration des noms de checks est faite par 113/114.

### Constats complémentaires (lecture `gh`, 2026-11-20)

- Le workflow planifié `Security Review` a échoué les lundis 2, 9 et 16 novembre (job `Snyk Dependencies`, `undici@7.30.1`) sans notification ni issue : la question Q4 (notification des échecs nocturnes) est déjà un besoin réel pour les planifiés **hebdomadaires** existants.
- Dependabot cible `develop` (`.github/dependabot.yml:6, 19`) ; le chantier DevSecOps propose de le remplacer par Renovate et de décider la branche cible (113 Q1) : l'ajout de `develop` aux déclencheurs E2E (FR-03) dépend de cette décision.
- Le ruleset `main` exige `Global Quality Baseline`, ignoré (« skipped ») hors PR vers `main` (`quality-gate.yml:81`) ; GitHub compte un job ignoré comme réussi [à confirmer] — traité par l'agrégateur de 114.

### Exigences proposées

- DSO-FR-01 Avancer en lot 0 la notification des échecs planifiés (Q4) avec le mécanisme commun de 113 FR-11 (une issue `ci:echec-planifie` par workflow, fermée au succès suivant), appliquée aux planifiés existants.
- DSO-FR-02 FR-03 : remplacer `develop` par la branche cible décidée en 113 Q1 (recommandation : `main`).
- DSO-FR-03 FR-09 : la garde « secret absent » ne concerne plus que Sonar si Snyk est retiré (117 Q1) ; ne pas investir dans la garde Snyk au-delà du nécessaire.
- DSO-FR-04 Toute modification de workflow de cette spec conserve les noms de jobs actuels (checks requis du ruleset `main`).

### Critères d'acceptation proposés

- DSO-AC-01 Un échec simulé du workflow planifié `Security Review` (branche jetable, `workflow_dispatch`) ouvre une issue `ci:echec-planifie`.
- DSO-AC-02 Aucun nom de check requis n'est modifié par les PR de 043.

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| DSO-Q1 | Notification des échecs planifiés en lot 0 (043) ou avec 113 | 043 / 113 | 043 (besoin avéré, coût faible), mécanisme réutilisé par 113 | 2026-11-23 : 043 (recommandation retenue) |

### Dépendances

V2-CICD-01 (113, Q1 branche cible), V2-CICD-02 (114), V2-SEC-02 (117).

## Implémentation (2026-11-23)

Livré au commit `7bdb292` (branche `ci/v2-qa-10-ci-hardening`, PR vers `develop`) :

- FR-01, FR-02 : le job `Lint, Typecheck, Unit Tests, Build` exécute `env:check`, `guard:clean`, `wrangler:check`, `governance:coverage`, `lint`, `lint:type-aware`, `typecheck`, `test:unit`, `build` ; `lint:type-aware` passe à `--max-warnings 0` (dette constatée : 0 avertissement) et rejoint `ci:check`. Emplacements réservés (commentaire) pour `governance:specs` (032) et la garde de couches (056).
- FR-03, DSO-FR-02 : `End-to-End` sur PR vers `develop`, `main`, `preprod`, `release/**`, manuel conservé, nuit à 03:17 UTC sur `develop` (entrée `ref` du workflow réutilisable). Sur PR le smoke reste non bloquant (choix du commit `a50f40b`) ; en planifié il fait échouer le job pour déclencher la notification. La suite exécutée est la configuration Playwright actuelle (Chromium + profils tablette et téléphone) ; la matrice complète de 042 s'y ajoutera.
- FR-04 : `scripts/ci-coverage-summary.mjs` lit les planchers dans `vitest.config.ts` (fonctions pures dans `scripts/lib/ciSummaries.mjs`, testées dans `tests/unit/tooling/ciSummaries.test.ts`).
- FR-05 : `run-local-smoke` exporte `PLAYWRIGHT_EXTERNAL_SERVER=1`, vérifie que le port est libre, démarre `vite preview --strictPort` et échoue si le serveur s'arrête ; journal dans `$RUNNER_TEMP`, publié en artefact `preview-server-log` en cas d'échec. `scripts/run-playwright.sh` utilise aussi `--strictPort` et n'écrit plus dans `/tmp`.
- FR-06 : `guard:clean` utilise `git grep --untracked -F` et distingue « aucun résultat » d'une erreur ; sans Git, échec explicite.
- FR-07 : reporter JSON Playwright en CI et `scripts/ci-playwright-flaky-summary.mjs` (résumé + annotations, non bloquant).
- FR-08 : la baseline publie `coverage/` en artefact ; `SonarCloud` le télécharge quand la baseline a réussi, sinon calcule la couverture lui-même.
- FR-09 : `SonarCloud` est ignoré avec « Analyse ignorée » sans `SONAR_TOKEN`. La partie Snyk est livrée par la PR « ci(security-review): reconfigurer Snyk » (spec 117).
- DSO-FR-01 : workflow `Scheduled Failure Notification` (`workflow_run` sur `Quality Gate`, `Security Review`, `Secret Scan`, `Dependency Watch`, `End-to-End`) : une issue `ci:echec-planifie` par workflow, mise à jour à chaque échec planifié, fermée au succès planifié suivant ; permissions `issues: write` seulement.
- DSO-FR-04 : aucun nom de workflow ni de job modifié (checks requis du ruleset `main` vérifiés le 2026-11-23).

Vérifications locales : `actionlint` 1.7.12 avec `shellcheck` 0.11.0 sans erreur ; garde testée avec `index.css`, une référence `src/ui/` non suivie et une référence imbriquée sous `views/` (échecs attendus), sans `rg` (succès) et sans Git (échec explicite) ; exclusion de couverture non documentée rejetée par `governance:coverage` ; démarrage du serveur unique validé, port occupé = échec ; rapport JSON et résumé « flaky » produits sur une exécution E2E locale.

Point d'attention : le smoke E2E compte déjà des échecs connus sur PR (5 échecs au run `45197140949` du 2026-11-23, non bloquants) ; tant qu'ils ne sont pas corrigés, l'exécution nocturne échouera et ouvrira l'issue `ci:echec-planifie` d'`End-to-End`.

Reste à observer sur GitHub (validation `en-attente`) : PR de démonstration (AC-01, AC-02, AC-05, AC-06), première exécution nocturne et issue de notification (AC-03, DSO-AC-01 ; les `schedule` et `workflow_run` ne s'exécutent qu'une fois les fichiers présents sur `main`), PR de fork (AC-07), durée ajoutée au job `validate` (NFR-01 ; environ 25 s mesurées en local).

### Correctif de sécurité du 2026-11-24 — frontière de cache du nocturne

Les alertes CodeQL 24–30 sur `main` partagent une cause : le cron déclenché
sur `main` checkout `develop` puis exécute ses actions et scripts dans le
contexte de cache de `main`. Le risque concerne un contributeur pouvant
pousser sur `develop` ; il ne démontre pas un accès équivalent depuis une PR
de fork. L'alerte 31 sur le checkout de PR non privilégié reste un signal
conservateur, sans exploitation démontrée ; aucune alerte n'est fermée manuellement.

Le correctif dédié conserve FR-03 et DSO-FR-01 : le cron ne checkout rien et
dispatch uniquement `e2e.yml` sur `develop` (`nightly=true`). Ce déclencheur
seul a `actions: write` ; les tests gardent `contents: read`, sans secrets.
L'entrée générique `ref` du workflow réutilisable est supprimée. Les tests
se déroulent ainsi dans le contexte de leur propre branche ; leurs rapports
restent conservés 14 jours. Les incidents de dispatch et de tests sont
distincts, pour qu'un déclenchement réussi ne ferme pas un échec des tests.
Les dispatchs sont identifiés par `run-name` : seuls les nocturnes bloquants
sur `develop` participent aux notifications ; un dispatch manuel ordinaire
non bloquant ne ferme pas leur incident.

Preuve locale ciblée : `tests/unit/tooling/ciSmokeTrustBoundary.test.ts`
contrôle l'absence de checkout interbranche, le dispatch fixe sur `develop`,
la propagation des erreurs et la séparation des notifications. Aucun
E2E/smoke local n'est exécuté. Après revue et fusion de la PR dédiée,
la recette nécessite la synchronisation des workflows sur `develop`, une
exécution nocturne et ses notifications en CI, ainsi qu'une analyse complète
de `main`.
Une analyse différentielle de PR sans résultats ne suffit pas à clôturer
les alertes existantes de `main`.

Recette partielle sur GitHub : PR #344 fusionnée sur `main` au commit
`50fad46`, après contrôles qualité, sécurité et les deux smokes réussis sur
`299ed86` (135 fichiers de tests, couverture des branches 92,74 %).
L'analyse Actions complète 2242443295 de ce commit ne rapporte aucun résultat.
Les alertes 24–31 sont passées à `fixed`, sans fermeture manuelle. Les workflows
de `develop` ont été synchronisés par la PR #345, fusionnée au commit `8607165`
après les contrôles CI, pour accepter l'entrée `nightly` sans checkout de secours.
La première exécution nocturne et ses notifications restent à observer.
