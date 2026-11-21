---
id: 120-counter-qa-codecov
v2_id: V2-QA-12
titre: Codecov — suivi de la couverture et couverture du code modifié dans les PR
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: S
recommandation: optionnel
lot: 2
poids: 20
depend_de: [V2-QA-11, V2-CICD-01]
remplace: []
remplacee_par: []
issue: '#310'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 120 — Codecov : suivi de la couverture et couverture du code modifié dans les PR

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§14) impose Codecov (offre gratuite des projets publics) pour la couverture globale, celle du nouveau code, les commentaires de PR et le suivi dans le temps, en cohérence avec Vitest et StrykerJS. Le dépôt utilise déjà **SonarCloud** pour la couverture du nouveau code (80 %) et une gouvernance stricte des exclusions (spec 029). Cette spec définit un rôle pour Codecov **sans dupliquer** la décision de qualité.

## 2. Problématique

Les relecteurs ne voient pas, dans la PR, quelles lignes modifiées ne sont pas testées ; Sonar affiche un pourcentage global du nouveau code mais échoue sur les PR de forks faute de secret. Ajouter un second juge de couverture risquerait des verdicts contradictoires.

## 3. Objectifs

- O1 : chaque PR (y compris de fork) affiche la couverture des lignes modifiées et l'évolution par composant métier.
- O2 : une seule source d'exclusions (029) et une seule règle bloquante (Q1).
- O3 : aucun jeton à longue durée de vie exposé.

## 4. État actuel vérifié dans le code

- [vérifié] Vitest produit `lcov` et `json-summary` (`vitest.config.ts:24`) sur le périmètre `App.tsx` + `components,functions,lib,src,utils,views` (`:26`), exclusions lues dans `sonar-project.properties:9` (`vitest.config.ts:5-11, 27`) : un fichier exclu n'apparaît pas dans `lcov.info`.
- [vérifié] Planchers globaux 90/80/90/90 (`vitest.config.ts:28-33`) ; quality gate Sonar « nouveau code ≥ 80 % » (`CONTRIBUTING.md`, section « Gouvernance de couverture Sonar ») ; checks requis `SonarCloud` et `SonarCloud Code Analysis`.
- [vérifié] Sonar dépend de `SONAR_TOKEN` (`quality-gate.yml:146`) : indisponible sur les PR de forks (043 C8).
- [vérifié] Badges de couverture Sonar dans `README.md:108-111`.
- [vérifié] Aucun fichier `codecov.yml`, aucune référence à Codecov.
- [vérifié, source externe] Offre « Developer » gratuite : dépôts publics illimités, envois illimités pour les dépôts publics, commentaires de PR, couverture du patch et du projet, drapeaux, composants, report de drapeaux — about.codecov.io/pricing, consulté le 2026-11-20.
- [vérifié, source externe] `codecov-action` v5 : envoi sans jeton pris en charge pour les PR de forks vers des dépôts publics ; sinon jeton ou **OIDC** (`use_oidc: true`, `id-token: write`) — README `codecov/codecov-action`, consulté le 2026-11-20.

## 5. Comportement cible

Le rapport `lcov` produit une seule fois (113 FR-06) est envoyé à Codecov par OIDC (branches du dépôt) ou sans jeton (forks). Codecov commente la PR (couverture du patch, composants), publie des statuts **informatifs** et suit l'historique. Sonar reste juge du nouveau code tant que Q1 n'en décide pas autrement.

## 6. Périmètre

### Inclus
- Envoi du rapport, `codecov.yml` (statuts, composants, commentaires), badge, documentation de la politique de couverture.

### Exclu
- Exclusions (029, source unique) ; mutation (122) ; seuils Vitest (inchangés).

## 7. User stories

- En tant que relecteur, je veux voir dans la PR les lignes modifiées non couvertes, afin de demander un test ciblé.
- En tant que contributeur externe, je veux un retour de couverture sans secret, afin de corriger avant revue.

## 8. Règles métier

- RM-01 Codecov ne définit aucune exclusion propre : il reçoit le `lcov` déjà filtré par la gouvernance 029.
- RM-02 Une seule règle bloquante de couverture du nouveau code (Sonar ou Codecov, Q1).
- RM-03 Aucune baisse de seuil sans décision du product owner.

## 9. Parcours utilisateurs

PR → `ci` → envoi Codecov → commentaire « patch 85 %, domaine +0,4 % » → relecture.

## 10. Exigences fonctionnelles

- FR-01 Job `codecov` consommant l'artefact `coverage/` ; `codecov/codecov-action` épinglé, `use_oidc: true` (job `id-token: write`) sur les branches du dépôt ; envoi sans jeton sur les forks ; `fail_ci_if_error: false` tant que Codecov est informatif.
- FR-02 `codecov.yml` : statut projet (cible `auto`, tolérance 1 %, informatif), statut patch (cible 80 %, informatif), composants `domaine` (`src/domain/`), `application` (`src/application/`), `moteurs` (`utils/` moteurs de jeu), `infrastructure` (`src/infrastructure/`), `fonctions` (`functions/`, `lib/`) ; commentaire condensé, publié seulement en cas de changement.
- FR-03 Rapport JUnit (113 FR-06) envoyé pour l'analyse des tests instables si disponible gratuitement [à confirmer].
- FR-04 Un seul badge de couverture dans le README (Q4).
- FR-05 Documentation de la politique : rôle de Vitest (planchers), Sonar (nouveau code), Codecov (visibilité), Stryker (qualité des tests).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € (offre gratuite des dépôts publics).
- NFR-02 Données envoyées : chemins et couverture du code source, déjà public ; aucune donnée utilisateur.
- NFR-03 Disponibilité : une panne de Codecov ne bloque pas la CI (FR-01).

## 12. Cas nominaux et alternatifs

- Nominal : commentaire de PR et statuts informatifs.
- Alternatif : PR de fork → envoi sans jeton ; Sonar ignoré proprement (043 FR-09).

## 13. Cas limites

- PR ne modifiant que des fichiers exclus : patch « sans objet ».
- Exécution annulée : aucun envoi partiel (artefact absent → étape ignorée et signalée).

## 14. Gestion des erreurs

Échec d'envoi signalé dans le résumé, non bloquant.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Interface avec Codecov (service tiers gratuit) ; application GitHub Codecov à installer pour les commentaires et statuts [à confirmer : nécessaire avec l'envoi par action].

## 17. Compatibilité avec l'existant

Sonar inchangé ; badges README rationalisés (128).

## 18. Dépendances

- Bloquantes : V2-QA-11 (029, exclusions), V2-CICD-01 (113, couverture unique).
- Liées : V2-QA-14 (122), V2-CICD-04 (127), V2-CICD-05 (128).

## 19. Critères d'acceptation

- AC-01 Une PR du dépôt affiche un commentaire Codecov avec couverture du patch et des composants.
- AC-02 Une PR de fork de test obtient le même commentaire sans secret.
- AC-03 Une PR qui ajoute du code métier non testé affiche une couverture de patch en baisse (détection de baisse significative).
- AC-04 Les fichiers exclus par 029 n'apparaissent pas dans Codecov.
- AC-05 Une indisponibilité simulée (envoi désactivé) ne fait pas échouer la CI.

## 20. Scénarios de tests

PR jetables (AC-01, AC-03) ; fork de test (AC-02) ; comparaison de la liste de fichiers Codecov avec les exclusions (AC-04).

## 21. Exigences de non-régression

Planchers Vitest et quality gate Sonar inchangés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Verdicts contradictoires Sonar / Codecov | Moyen | Moyenne | Codecov informatif (RM-02) |
| Bruit de commentaires | Faible | Moyenne | Commentaire condensé, seulement sur changement |
| Évolution des conditions gratuites | Faible | Faible | Retrait simple (job et fichier) |

## 23. Décisions architecturales

Aucun ADR ; politique de couverture documentée (FR-05).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Rôle de Codecov face à Sonar | A : ne pas adopter / B : informatif / C : remplace le gate de couverture Sonar | B pendant 3 mois, puis décision sur données (C seulement si Sonar est retiré ou trop bruyant) | — |
| Q2 | Authentification | Jeton de dépôt / OIDC | OIDC (aucun secret) | — |
| Q3 | Statut patch bloquant à terme | Oui / non | Non tant que Sonar juge le nouveau code | — |
| Q4 | Badge de couverture | Sonar / Codecov | Un seul ; Codecov s'il est adopté (lisible pour les contributeurs) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (redondances) ; demande DevSecOps §14 ; specs 029, 043, 113, 122, 127, 128.
