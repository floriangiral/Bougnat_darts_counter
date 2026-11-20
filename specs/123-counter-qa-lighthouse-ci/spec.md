---
id: 123-counter-qa-lighthouse-ci
v2_id: V2-QA-15
titre: Lighthouse CI — performance, accessibilité et bonnes pratiques sur un build de production
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: M
recommandation: recommande
lot: 2
poids: 10
depend_de: [V2-CICD-01, V2-PERF-01]
remplace: []
remplacee_par: []
issue: '#312'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 123 — Lighthouse CI : performance, accessibilité et bonnes pratiques sur un build de production

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§13) impose Lighthouse CI sur un build représentatif, avec baseline, budgets réalistes, attention au mobile et aux réseaux dégradés, sans viser 100 partout. Deux specs existantes couvrent une partie du besoin : **044** (V2-PERF-01, budgets de bundle et INP en laboratoire Playwright) et **041** (V2-QA-05, axe-core et régression visuelle par écran). Cette spec ajoute la mesure **de chargement** (LCP, CLS, TBT, bonnes pratiques, SEO) que ni 044 ni 041 ne fournissent, en réutilisant leurs budgets et sans dupliquer leurs contrôles.

## 2. Problématique

Aucune mesure automatique du chargement de l'application n'existe ; une régression (image lourde, police bloquante, script tiers) n'est détectée qu'en production, alors que l'usage réel est sur smartphone et tablette, parfois en 4G de bar.

## 3. Objectifs

- O1 : une baseline Lighthouse mobile et bureau sur le build de production servi localement.
- O2 : empêcher les régressions significatives de chargement, d'accessibilité et de bonnes pratiques, avec une variabilité maîtrisée.
- O3 : un seul jeu de budgets partagé avec 044.

## 4. État actuel vérifié dans le code

- [vérifié] Aucun Lighthouse ni `lighthouserc` dans le dépôt ; aucune mesure de chargement en CI (`.github/workflows/*.yml`).
- [vérifié] Application monopage : seule l'URL `/` et l'entrée du lien partenaire (`/?v=1&game=x01…`, `tests/e2e/external-match-link.smoke.spec.ts`) sont atteignables sans interaction ; les écrans de jeu nécessitent des interactions ou une session injectée.
- [vérifié] Les en-têtes de sécurité (`public/_headers:2-7`, CSP, HSTS) sont appliqués par Cloudflare Pages et non par `vite preview` : les audits « bonnes pratiques » liés aux en-têtes ne sont pas représentatifs en CI.
- [vérifié] Le manifeste et le service worker ne sont pas servis à la racine (spec 031, V2-REL-02) ; la catégorie PWA de Lighthouse n'est donc pas un critère pertinent avant 031 [disponibilité de la catégorie PWA dans la version courante de Lighthouse à confirmer].
- [vérifié] 044 propose des budgets gzip (chargement initial ≤ 210 Ko puis ≤ 150 Ko, chunk d'écran ≤ 40 Ko, CSS ≤ 25 Ko) et un laboratoire INP Playwright ; 041 propose axe-core avec fichier de dette par écran.
- [vérifié, source externe] Lighthouse CI exécute plusieurs passages par URL, accepte des assertions et peut téléverser vers un stockage **public temporaire** ; sans serveur LHCI, pas d'historique ni de comparaison automatique — `GoogleChrome/lighthouse-ci`, `docs/getting-started.md`, consulté le 2026-11-20.

## 5. Comportement cible

Sur chaque PR (et à la demande), le build de production (artefact 113) est servi par `vite preview` ; Lighthouse CI mesure `/` et l'entrée partenaire, 3 passages, profils mobile (émulation et limitation par défaut) et bureau ; les assertions s'appliquent à la médiane ; les rapports sont publiés en artefact et résumés dans le job. Mode informatif pendant 2 semaines (baseline), puis bloquant sur les régressions significatives définies au §8.

## 6. Périmètre

### Inclus
- `lighthouserc` (URLs, passages, profils, assertions), workflow `performance.yml`, baseline, résumé, documentation des budgets.

### Exclu
- Budgets de bundle et INP (044), accessibilité par écran (041), en-têtes Cloudflare (mesurés en preprod, Q3), tests sur appareils réels (042).

## 7. User stories

- En tant que joueur en 4G, je veux que l'application s'ouvre vite, afin de lancer la partie sans attendre.
- En tant que mainteneur, je veux qu'une PR qui alourdit le chargement soit signalée, afin de corriger avant fusion.

## 8. Règles métier

Assertions proposées (à calibrer sur la baseline, Q2) :

| Indicateur | Profil | Niveau |
|---|---|---|
| Accessibilité ≥ 0,90 | mobile et bureau | Bloquant |
| Bonnes pratiques ≥ 0,90 (hors audits d'en-têtes) | mobile | Avertissement |
| SEO ≥ 0,80 | mobile | Avertissement |
| Performance ≥ baseline − 0,05 | mobile | Avertissement puis bloquant |
| CLS ≤ 0,1 | mobile | Bloquant |
| LCP ≤ baseline + 15 % | mobile | Bloquant après calibrage |
| TBT ≤ baseline + 20 % | mobile | Avertissement |
| Poids des scripts (resource-summary) | mobile | Repris des budgets 044 |

- RM-01 Aucun objectif de 100 imposé.
- RM-02 Un relèvement de budget est justifié dans la PR et accepté par le product owner.

## 9. Parcours utilisateurs

PR → `performance` → résumé (scores, LCP, CLS, TBT, version de Chrome) → artefacts.

## 10. Exigences fonctionnelles

- FR-01 `lighthouserc.json` : URLs `/` et entrée partenaire de test ; `numberOfRuns: 3` ; profils mobile et bureau ; assertions §8 ; `upload.target: filesystem` (Q1).
- FR-02 Job `performance.yml` réutilisant l'artefact `dist/` (113 FR-07) et le même environnement de build que le smoke (`run-local-smoke/action.yml:25-39`).
- FR-03 Baseline : 10 exécutions sur `main` ; médianes consignées dans un fichier versionné ; seuils déduits (Q2).
- FR-04 Résumé de job : tableau par URL et profil, écart à la baseline, version de Chrome.
- FR-05 Artefacts HTML/JSON 7 jours.
- FR-06 Mesure ponctuelle sur preprod (en-têtes Cloudflare réels) à chaque release (Q3), consignée dans la note de version (033).

## 11. Exigences non fonctionnelles

- NFR-01 Durée ≤ 5 min par PR [à mesurer].
- NFR-02 Variabilité : écart-type des scores de performance sur 10 exécutions ≤ 5 points ; sinon seuils élargis.
- NFR-03 Coût : 0 € ; aucun service tiers obligatoire.

## 12. Cas nominaux et alternatifs

- Nominal : PR sans impact → scores stables.
- Alternatif : ajout d'une image non optimisée → LCP en hausse → échec avec indicateur fautif.

## 13. Cas limites

- Runner lent ponctuellement : médiane de 3 passages ; relance unique autorisée.
- Changement de version de Chrome du runner : signalé dans le résumé ; recalibrage si dérive.

## 14. Gestion des erreurs

Échec de démarrage du serveur → message explicite et journal publié (043 FR-05).

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Budgets partagés avec 044 (une seule source) ; axe (041) reste l'autorité d'accessibilité par écran, Lighthouse donne un score de chargement global.

## 18. Dépendances

- Bloquantes : V2-CICD-01 (113, artefact de build), V2-PERF-01 (044, budgets).
- Liées : V2-QA-05 (041), V2-REL-02 (031), V2-CICD-04 (127).

## 19. Critères d'acceptation

- AC-01 Une PR exécute Lighthouse CI et publie un résumé et des rapports.
- AC-02 La baseline (10 exécutions) est consignée avec l'écart-type observé.
- AC-03 Une PR jetable ajoutant une ressource lourde bloquante est signalée (régression détectée).
- AC-04 Une PR jetable dégradant le CLS (élément inséré sans dimension) échoue.
- AC-05 Les budgets de poids de scripts proviennent de la source unique de 044.

## 20. Scénarios de tests

PR jetables (AC-03, AC-04) ; 10 exécutions `workflow_dispatch` sur `main` (AC-02).

## 21. Exigences de non-régression

Aucun contrôle de 041 ou 044 retiré ; durée de PR dans les limites de 113.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Faux positifs dus à la variabilité des runners | Moyen | Élevée | 3 passages, médiane, mode informatif initial, seuils relatifs |
| Mesure non représentative (pas d'en-têtes Cloudflare, pas d'interactions) | Moyen | Certaine | Mesure preprod à chaque release ; INP via 044 |
| Doublon avec 044/041 | Faible | Moyenne | Budgets et rôles partagés (§17) |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Stockage des rapports | Artefact / stockage public temporaire / serveur LHCI | Artefact (aucun service tiers, aucun serveur à maintenir) | — |
| Q2 | Seuils de performance | Absolus / relatifs à la baseline | Relatifs, recalibrés à chaque montée de Chrome | — |
| Q3 | Mesure sur preprod | Manuelle à la release / planifiée | Manuelle à la release (preprod non publique en continu [à confirmer]) | — |
| Q4 | Outil d'exécution | `@lhci/cli` en dépendance de développement / action tierce | `@lhci/cli` épinglé (mis à jour par Renovate, pas d'action tierce supplémentaire) | — |
| Q5 | Exécution sur chaque PR | Toutes / applicatives seulement | Toutes (pas de filtre de chemins sur un check requis, 114) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §13 ; specs 031, 033, 041, 042, 043, 044, 113, 127.
