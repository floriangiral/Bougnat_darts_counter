---
id: 121-counter-qa-knip
v2_id: V2-QA-13
titre: Knip — détection hebdomadaire du code, des exports et des dépendances inutilisés
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: S
recommandation: recommande
lot: 2
poids: 20
depend_de: [V2-CICD-01]
remplace: []
remplacee_par: []
issue: '#311'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 121 — Knip : détection hebdomadaire du code, des exports et des dépendances inutilisés

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§15) impose Knip pour repérer fichiers, exports, types, dépendances et scripts inutilisés, avec une analyse hebdomadaire exploitable par des agents IA, sans suppression massive automatique. L'audit V2 a déjà identifié du code mort significatif (domaine X01 non exécuté, `AGENTS.md` §3) traité par V2-ARCH-01 (spec 056).

## 2. Problématique

La dette « inutilisée » n'est détectée que manuellement : la garde `guard:clean` interdit une liste figée de fichiers legacy, mais rien ne signale un nouvel export orphelin, une dépendance devenue inutile ou un fichier jamais importé.

## 3. Objectifs

- O1 : un rapport hebdomadaire fiable (faux positifs traités) des éléments inutilisés.
- O2 : des PR de nettoyage petites, dédiées et validées par la CI, jamais de suppression de masse.
- O3 : à terme, empêcher l'ajout d'une **nouvelle** dépendance inutilisée (Q2).

## 4. État actuel vérifié dans le code

- [vérifié] Aucune configuration Knip, aucun binaire `knip` dans `node_modules/.bin`.
- [vérifié] `scripts/guard-clean-codebase.sh:12-69` : liste figée de fichiers, dossiers et motifs d'import legacy interdits (complémentaire, non remplacé).
- [vérifié] Candidats probables (à confirmer par Knip) :
  - `autoprefixer` (`package.json:50`) : référencé nulle part ; `postcss.config.mjs:3` n'utilise que `@tailwindcss/postcss`.
  - `qrcode` déclaré en dépendance d'**exécution** (`package.json:34`) mais utilisé seulement par `scripts/generate-app-qr.mjs` (build) — à reclasser, sauf si V2-QR-01 (092) l'embarque côté client.
  - `src/domain/scoring/` (entités, services, objets-valeurs) : utilisé seulement par les tests selon `AGENTS.md` §3 — traité par 056 ; Knip doit le signaler en mode production.
- [vérifié] Points d'entrée non standard à déclarer : `index.tsx`, `functions/api/**` (Pages Functions), `scripts/*.mjs`, `sw.js` (racine), `public/pcmCaptureWorklet.js` (chargé par URL), `docs/integration/partner-simulator/` (testé par `tests/unit/tooling/partnerSimulator.test.ts`), vues chargées par `React.lazy` (`App.tsx:54-65`).
- [vérifié, source externe] Knip fournit des greffons pour les outils courants (Vite, Vitest, Playwright, ESLint, Tailwind…) et un mode « production » — knip.dev, consulté le 2026-11-20 [liste exacte des greffons activés à confirmer à l'installation].

## 5. Comportement cible

Knip (dépendance de développement épinglée) avec `knip.json` versionné ; exécution hebdomadaire et manuelle ; rapport JSON et Markdown en artefact, résumé dans le job et dans le rapport hebdomadaire (127) ; chaque élément confirmé donne une PR de nettoyage dédiée (humaine ou agent, 126). Option : contrôle en PR limité aux **nouvelles** dépendances inutilisées.

## 6. Périmètre

### Inclus
- Installation, configuration (entrées, projets, exclusions justifiées), workflow hebdomadaire, format de rapport, procédure de nettoyage.

### Exclu
- Suppression du domaine X01 (056) ; refactorings ; suppression automatique.

## 7. User stories

- En tant que mainteneur, je veux savoir chaque semaine quelles dépendances sont inutiles, afin de réduire la surface d'attaque et les PR Renovate.
- En tant qu'agent IA, je veux un rapport structuré, afin de proposer une PR de nettoyage ciblée et vérifiable.

## 8. Règles métier

- RM-01 Aucune suppression sans PR dédiée, tests verts et vérification de l'impact fonctionnel (imports dynamiques, chargement par URL).
- RM-02 Toute exclusion Knip est justifiée par un commentaire ou une entrée dans la documentation.
- RM-03 Une PR de nettoyage ne mélange pas suppression et changement de comportement.

## 9. Parcours utilisateurs

Lundi → Knip → rapport → issue unique « Dette Knip » mise à jour → PR de nettoyage → CI → fusion.

## 10. Exigences fonctionnelles

- FR-01 `knip` en dépendance de développement (justification : outil de dette exigé par la demande ; aucune dépendance d'exécution).
- FR-02 `knip.json` : `entry` (FR §4), `project`, greffons Vite/Vitest/Playwright/ESLint actifs, exclusions justifiées ; script `npm run knip` et `npm run knip:production`.
- FR-03 Job hebdomadaire (`weekly-maintenance.yml`, 113) : rapport JSON + Markdown en artefact (14 jours), résumé (compte par catégorie).
- FR-04 Issue unique « Dette Knip » mise à jour (pas de nouvelle issue par semaine).
- FR-05 Option Q2 : job PR qui échoue seulement si une **nouvelle** dépendance inutilisée apparaît (comparaison avec la base).
- FR-06 Traitement initial des candidats du §4 en PR dédiées après confirmation.

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € ; durée ≤ 3 min [à mesurer].
- NFR-02 Taux de faux positifs résiduels ≤ 5 % du rapport après configuration [à mesurer].

## 12. Cas nominaux et alternatifs

- Nominal : rapport vide ou court, traité dans la semaine.
- Alternatif : faux positif → exclusion justifiée.

## 13. Cas limites

- Fichier chargé par URL (`public/pcmCaptureWorklet.js`) ou par le service worker : déclaré en entrée.
- Exports consommés seulement par les tests : signalés en mode production, décision au cas par cas (056).

## 14. Gestion des erreurs

Échec de configuration → issue d'échec planifié (113).

## 15. Impacts architecturaux

Aucun sur l'application ; aide à faire respecter la frontière de couches (056).

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

`guard:clean` conservé (interdits explicites) ; Knip détecte les nouveaux cas.

## 18. Dépendances

- Bloquante : V2-CICD-01 (113).
- Liées : V2-ARCH-01 (056), V2-CICD-03 (126), V2-CICD-04 (127), V2-QR-01 (092, sort de `qrcode`).

## 19. Critères d'acceptation

- AC-01 Une dépendance ajoutée et non utilisée (branche jetable) est signalée par Knip.
- AC-02 Le rapport hebdomadaire est publié en artefact et résumé dans l'issue « Dette Knip ».
- AC-03 Les entrées non standard (§4) ne sont pas signalées à tort.
- AC-04 `autoprefixer` et `qrcode` font l'objet d'une décision consignée (supprimé, reclassé ou justifié).

## 20. Scénarios de tests

Branche jetable (AC-01) ; exécution manuelle et revue du rapport initial (AC-03, AC-04).

## 21. Exigences de non-régression

Build, tests et E2E verts après chaque PR de nettoyage ; fonctionnement hors ligne et voix inchangés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Suppression d'un fichier chargé dynamiquement | Élevé | Faible | RM-01, entrées déclarées, E2E |
| Bruit initial important | Faible | Élevée | Traitement progressif, issue unique |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Knip en dépendance ou via `npx` épinglé | Dépendance / `npx` | Dépendance (mise à jour par Renovate, lockfile) | — |
| Q2 | Contrôle en PR des nouvelles dépendances inutilisées | Oui / non | Oui après 4 semaines de rapport stable | — |
| Q3 | Mode production dans le rapport hebdomadaire | Oui / non | Oui (révèle le code utilisé seulement par les tests) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §15 ; `AGENTS.md` §3 ; specs 044 (§4 `qrcode`), 056, 092, 113, 126, 127.
