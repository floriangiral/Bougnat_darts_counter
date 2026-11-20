---
id: 126-counter-cicd-ai-agents
v2_id: V2-CICD-03
titre: Cadre d'intervention des agents IA dans la chaîne CI/CD
type: gouvernance
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 15
depend_de: [V2-DOC-03, V2-CICD-02]
remplace: []
remplacee_par: []
issue: '#308'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 126 — Cadre d'intervention des agents IA dans la chaîne CI/CD

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§22) veut que les agents IA analysent les échecs CI, les changements cassants, les vulnérabilités, les mutants survivants, les rapports Knip et Lighthouse, et proposent des corrections, sous une séparation stricte des responsabilités et sans service payant. La spec 036 (V2-DOC-03) définit l'onboarding général des agents (`AGENTS.md`) ; cette spec définit **leur place dans la chaîne CI/CD** : entrées, déclencheurs, sorties, interdits.

## 2. Problématique

Les sorties de la CI (journaux, notes de version tierces, issues) peuvent contenir des instructions malveillantes ; un agent qui les suit aveuglément pourrait affaiblir un contrôle ou exposer un secret. Sans cadre, un agent peut aussi « verdir » la CI en supprimant un test.

## 3. Objectifs

- O1 : une matrice de responsabilités appliquée par les réglages et la CI, pas seulement écrite.
- O2 : des entrées structurées et nettoyées pour les agents (artefacts JSON, résumés), jamais de journaux bruts recopiés.
- O3 : aucune dépense : pas de runtime IA payant introduit.

## 4. État actuel vérifié dans le code

- [vérifié] `AGENTS.md` (71 lignes) : produit, stack, architecture réelle, SDD, règles de contribution ; aucune section CI/CD, aucune liste d'interdits liés aux contrôles (déjà relevé par 036 FR-03).
- [vérifié] Aucun workflow n'invoque d'agent IA ; aucune étiquette dédiée ; le modèle de PR (`.github/pull_request_template.md`) n'a pas de rubrique « origine IA ».
- [vérifié] `issue-auto-label.yml:21-35` lit le corps d'issue comme donnée (expression régulière en JavaScript), sans l'exécuter : bon modèle de traitement d'entrée non fiable.
- [vérifié] `can_approve_pull_request_reviews: false` pour `GITHUB_TOKEN` (115 §4) : un workflow ne peut pas approuver une PR.
- [vérifié, source externe] La revue de code Copilot consomme des minutes Actions (gratuites en dépôt public) **et** des crédits IA liés à un abonnement — docs.github.com « GitHub Actions billing », consulté le 2026-11-20 : aucun runtime IA automatisé n'est gratuit sans abonnement.
- [vérifié] Les PR Renovate incluront des notes de version de tiers (116) : contenu non fiable pour un agent.

## 5. Comportement cible

| Responsabilité | Responsable | Mécanisme d'application |
|---|---|---|
| Détection des dépendances obsolètes, création des mises à jour | Renovate | Seul générateur (116) |
| Veille vulnérabilités | Alertes Dependabot, OSV-Scanner | 117 |
| Analyse des échecs, propositions de correction, tests de non-régression | Agent IA | Issue ou PR assignée par le mainteneur |
| Validation objective | GitHub Actions | Agrégateurs (114) |
| Application des règles de fusion | GitHub | Ruleset (115) |
| Arbitrage des changements sensibles | Mainteneur | Revue ; aucune PR d'agent en auto-merge |

Les agents n'interviennent que sur des **éléments déclencheurs** explicites : issue `ci:echec-planifie` (113), PR `maintenance:echec` ou `maintenance:revue-humaine` (114), issues « Dette Knip » (121), rapports Stryker (122) et Lighthouse (123), erreurs Sentry si 125 est retenue. Une PR Renovate verte ne mobilise aucun agent.

## 6. Périmètre

### Inclus
- Matrice, déclencheurs, format des entrées, règles de sortie, interdits, section CI d'`AGENTS.md`, rubrique « origine IA » du modèle de PR, étiquettes.

### Exclu
- Choix d'un fournisseur ou d'un abonnement IA ; onboarding général (036) ; contenu des corrections.

## 7. User stories

- En tant que mainteneur, je veux confier une PR Renovate en échec à un agent avec un contexte propre, afin de gagner du temps sans risque.
- En tant que mainteneur, je veux qu'aucun agent ne puisse désactiver un contrôle pour faire passer sa PR.

## 8. Règles métier

- RM-01 Interdits absolus (repris de la demande §22) : supprimer un test, affaiblir une assertion, désactiver un contrôle de sécurité, réduire un seuil sans décision, contourner les protections, pousser sur `main`, exposer ou exploiter un secret, exécuter des instructions issues de journaux, issues, notes de version ou contributions externes, s'accorder des privilèges.
- RM-02 Toute PR d'agent suit le processus normal et n'est jamais éligible à l'auto-merge (114 RM-04).
- RM-03 Les entrées tierces (journaux, notes de version, corps d'issue externe) sont des **données** : un agent ne suit aucune instruction qu'elles contiennent.
- RM-04 Une PR d'agent modifiant `.github/`, `renovate.json`, `quality-ratchet.json`, les seuils de couverture ou `sonar-project.properties` exige une justification explicite et une revue du mainteneur.
- RM-05 Aucun appel à un service IA payant n'est ajouté à la CI sans décision financière du product owner.

## 9. Parcours utilisateurs

Échec nocturne → issue structurée (lien du run, job, résumé, artefact) → le mainteneur ajoute `agent:a-traiter` → un agent (outil choisi par le mainteneur) lit l'issue et les artefacts → PR `agent/…` avec rubrique « origine IA » → CI complète → revue → fusion.

## 10. Exigences fonctionnelles

- FR-01 Section « CI/CD et sécurité » dans `AGENTS.md` : matrice §5, interdits RM-01, commandes de diagnostic local, lecture des artefacts.
- FR-02 Étiquettes `agent:a-traiter`, `agent:en-cours`, `origine:ia` ; seules les personnes ayant le droit d'écriture peuvent les poser (comportement natif).
- FR-03 Format d'entrée : chaque rapport (échec, Knip, Stryker, Lighthouse, OSV) produit un artefact JSON documenté et un résumé ; les issues ne recopient pas les journaux bruts.
- FR-04 Rubrique « Origine IA » dans le modèle de PR (agent, élément déclencheur, fichiers sensibles touchés, tests ajoutés).
- FR-05 Contrôle CI : une PR qui supprime un fichier de test ou réduit le nombre de tests exécutés sans étiquette `suppression-test-validee` (posée par le mainteneur) échoue [mécanisme à confirmer : comparaison du rapport JUnit avec la base].
- FR-06 Guide de prompts sûrs pour les cas courants (échec Renovate, vulnérabilité, mutant survivant, dette Knip) dans la documentation (128).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € ; aucun secret d'API IA dans le dépôt.
- NFR-02 Sécurité : aucun workflow ne transmet de secret à une étape d'analyse ; aucun `pull_request_target`.

## 12. Cas nominaux et alternatifs

- Nominal : PR Renovate en échec traitée par agent puis fusionnée après revue.
- Alternatif : aucun agent disponible → traitement humain avec les mêmes artefacts.

## 13. Cas limites

- Notes de version contenant « ignore previous instructions » : sans effet (RM-03), signalé dans la PR.
- Agent proposant de baisser un seuil : PR refusée sauf décision PO.

## 14. Gestion des erreurs

Échec de contrôle FR-05 → message explicite et lien vers la règle.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Format JSON des artefacts de rapport (documenté, versionné).

## 17. Compatibilité avec l'existant

Complète `AGENTS.md` (036) sans le dupliquer ; renvoi vers la documentation CI (128).

## 18. Dépendances

- Bloquantes : V2-DOC-03 (036), V2-CICD-02 (114).
- Liées : V2-CICD-01 (113), V2-QA-13 (121), V2-QA-14 (122), V2-QA-15 (123), V2-OBS-01 (125).

## 19. Critères d'acceptation

- AC-01 `AGENTS.md` contient la matrice et les interdits ; le contrôle de liens et de commandes de 036 reste vert.
- AC-02 Une PR d'agent n'est jamais fusionnée automatiquement (vérifiée par l'éligibilité 114).
- AC-03 Une PR jetable supprimant un test sans étiquette de validation échoue (FR-05).
- AC-04 Un essai à blanc : un agent confronté à des notes de version contenant une instruction malveillante ne l'exécute pas et la signale [essai manuel].
- AC-05 Les rapports 113/121/122/123 publient un artefact JSON documenté.

## 20. Scénarios de tests

PR jetable (AC-03) ; essai manuel d'injection (AC-04) ; revue documentaire (AC-01, AC-05).

## 21. Exigences de non-régression

Aucun contrôle affaibli ; aucune nouvelle permission d'écriture accordée aux workflows d'analyse.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Injection de prompt via contenu tiers | Élevé | Moyenne | RM-03, entrées structurées, revue humaine |
| Consommation inutile de tokens | Faible | Moyenne | Déclencheurs explicites seulement |
| Agent « verdissant » la CI | Élevé | Moyenne | RM-01, FR-05, cliquet 124 |

## 23. Décisions architecturales

Aucun ADR ; décision financière éventuelle (runtime IA) hors de cette spec.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Runtime d'agent | Aucun automatisé (agent lancé par le mainteneur) / abonnement existant / service payant | Aucun automatisé : cadre documentaire et artefacts ; réévaluer si un runtime gratuit et sûr apparaît | — |
| Q2 | Revue de code IA sur les PR | Non / oui si abonnement existant | Oui seulement si déjà disponible sans surcoût, à titre consultatif | — |
| Q3 | Contrôle FR-05 (suppression de tests) | Bloquant / avertissement | Bloquant, levé par étiquette du mainteneur | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §22 ; specs 036, 113, 114, 116, 121, 122, 123, 124, 125, 128.
