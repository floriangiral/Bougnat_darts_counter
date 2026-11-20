---
id: 033-counter-release-v2-0-0-publication
v2_id: V2-REL-01
titre: Clôture et publication de la release 2.0.0
type: gouvernance
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: gouvernance
priorite: P0
difficulte: M
recommandation: recommande
lot: 0
poids: 40
depend_de: [V2-INT-01, V2-DOC-01, V2-QA-10, V2-GAMES-01, V2-GAMES-02]
remplace: []
remplacee_par: []
issue: '#211'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 033 — Clôture et publication de la release 2.0.0

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La version 2.0.0 (lien de match externe `v=1`, spec 030) est prête côté code mais **non publiée** : `package.json` = `2.0.0`, branche `release/v2.0.0` créée depuis `main` (1.1.5), développements sur `feat/v2.0.0`, aucun tag `v2.0.0` ; `origin/production:package.json` = 1.1.4 et `origin/main:package.json` = 1.1.5 [vérifié git]. Le club badarts.fr consomme déjà `v=1` (page `/bougnat-retour`) [EXT, compte rendu §C.10].

Plusieurs specs portent des fragments de clôture sans propriétaire unique : 007 (checklist de release et runbook absents, `specs/007-counter-release-governance-v1-0-x/tasks.md:5-6`), 025 (validations manuelles ouvertes, `specs/025-counter-react-19-migration/tasks.md:24-28`), 026 (historique), 030 (tâches non à jour, `specs/030-counter-external-match-link/tasks.md:21-23`), 031 (séquencement). Cette spec est la **porte de sortie unique** de la 2.0.0 (rapport 01 : V2-BKL-02/03 ; compte rendu §F.1, §G lot 0, §H.1).

## 2. Problématique

Publier un contrat public partenaire alors que la suite E2E complète n'a pas été exécutée, que la qualité distante (SonarCloud, Snyk) n'est pas confirmée, que la documentation se contredit et que des règles X01 visibles sont fausses exposerait les partenaires et les joueurs à des défauts connus.

## 3. Objectifs

- O1 : une checklist de publication exécutable, rejouable pour les 2.x suivantes.
- O2 : publier 2.0.0 avec des preuves tracées (E2E, qualité, validations manuelles).
- O3 : figer le contrat `v=1` au moment de la publication (ajouts optionnels seulement ensuite).
- O4 : clore ou transférer explicitement les reliquats 007, 025, 026, 030.

## 4. État actuel vérifié dans le code

- [vérifié] `docs/release/v2.0.0.md:8` « Non publiée » ; `:10` résultats GitHub Actions/SonarCloud/Snyk « à confirmer » ; `:97-102` scénario smartphone jamais exécuté et suite E2E complète Chromium/WebKit « reste à exécuter ».
- [vérifié] E2E : 7 fichiers `tests/e2e/*.spec.ts`, 7 projets Playwright (Chromium + 6 profils WebKit) ; le workflow `.github/workflows/e2e.yml:6-8` ne se déclenche que sur `pull_request`.
- [vérifié, artefact local] `test-results/.last-run.json` (20/11) : 64 échecs = WebKit non installé + origine partenaire de test absente du build (rapport 10, C9) ; prérequis non documentés.
- [vérifié] Livraison : `promote-preprod.yml` et `promote-production.yml` (déclenchement manuel, confirmations) poussent la branche `preprod`/`production` ; le build servi est fait par Cloudflare Pages avec les variables de `wrangler.jsonc` (`scripts/deployment-check.mjs:38-39`).
- [vérifié] `components/ui/ChangelogModal.tsx:28-29` affiche « Version v2.0.0 — 19/11/2026 » alors que la version n'est pas publiée.
- [vérifié] Règles X01 : bust Double-Out à 1 seulement (`src/application/scoring/matchLifecycle.ts:264`) ; `checkIn` jamais lu par le calcul (voir V2-GAMES-01/02).
- [vérifié] `sw.js` est absent de `dist/` ; son activation (031) changerait le cycle de mise à jour en production.
- [hypothèse] L'état réel des déploiements Cloudflare n'a pas été vérifié (seulement les branches git).

## 5. Comportement cible

La 2.0.0 n'est taguée et promue en production qu'après que tous les items de la checklist « Gate 2.0.0 » (FR-01) sont cochés avec preuve, sur un commit unique de `release/v2.0.0`. La checklist est versionnée et réutilisable.

## 6. Périmètre

### Inclus
- Checklist de publication (pré-release, preprod, production, post-release) et runbook de retour arrière.
- Exécution et archivage des preuves : E2E complet, couverture, SonarCloud, Snyk, validations manuelles de 025.
- Mise à jour des notes 2.0.0, coverage map, changelog in-app (date), README de `main` au moment de la promotion.
- Statuts finaux des specs 007, 025, 026, 030 (via V2-SDD-02).
- Décision de séquencement 031 (Q2).

### Exclu
- Implémentation des correctifs X01 (V2-GAMES-01, 045 ; V2-GAMES-02, 046).
- Durcissement de la CI (V2-QA-10, 043) — seulement consommé.
- Livraison PWA (V2-REL-02, 031) — seulement séquencée.
- Prise de contact partenaire sans autorisation (H.21).

## 7. User stories

- En tant que mainteneur, je veux une checklist unique, afin de publier sans oubli.
- En tant que partenaire (badarts.fr), je veux un contrat `v=1` publié et stable, afin d'organiser mes matchs.
- En tant que joueur, je veux que la nouvelle version n'introduise pas de régression de scoring.

## 8. Règles métier

- RM-01 : aucune publication sans preuve pour chaque item bloquant (lien de run CI, capture, rapport).
- RM-02 : le contrat `v=1` est figé au tag `v2.0.0` : toute évolution ultérieure est optionnelle et rétrocompatible (spec 030).
- RM-03 : `README.md` de `main` et le changelog in-app ne décrivent la 2.0.0 qu'à la promotion production (conventions §4 règle 4).
- RM-04 : un item non bloquant reporté est transféré nommément vers une spec V2 (jamais supprimé).

## 9. Parcours utilisateurs

Sans objet côté joueur (parcours inchangé). Parcours mainteneur : `feat/v2.0.0` → PR vers `release/v2.0.0` → gate → `main` → `preprod` (workflow « Deploy Preview ») → validations preprod → `production` (workflow de promotion) → tag + GitHub Release → post-release.

## 10. Exigences fonctionnelles

- FR-01 Créer la checklist « Gate 2.0.0 » (fichier proposé : `docs/release/checklist.md`, emplacement final selon V2-DOC-02) avec items bloquants : (a) V2-DOC-01 clos ; (b) V2-GAMES-01 livré ; (c) V2-GAMES-02 tranché et appliqué ; (d) V2-INT-01 clos (tâches 030 à jour, contrat `v=1` figé) ; (e) V2-QA-10 a minima C1/C2/C9 ; (f) E2E complet Chromium + WebKit vert ; (g) couverture ≥ planchers 90/80/90/90 et `governance:coverage` vert ; (h) SonarCloud Quality Gate et Snyk verts sur la PR de release ; (i) validations manuelles 025 tracées ; (j) décision 031 appliquée.
- FR-02 Exécuter la suite E2E complète (`npm run test:e2e`, 7 projets) sur le commit candidat, avec les prérequis (navigateurs Playwright installés, build servi avec `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example`), et archiver le rapport.
- FR-03 Exécuter et tracer les validations manuelles de 025 (`tasks.md:24-28`) : undo/revanche/retour setup, voix Deepgram (start/stop/navigation/timeout), installation/mise à jour PWA (si Q2 = inclus), Safari/iOS (selon décision 018, V2-DS-00), preview connectée.
- FR-04 Valider en preprod le parcours partenaire avec le simulateur (`docs/integration/partner-simulator/index.html`) et l'origine réelle (badarts.fr) en lecture seule [à confirmer : accord du partenaire pour un essai].
- FR-05 Corriger au moment de la promotion : date de `components/ui/ChangelogModal.tsx:29`, `docs/release/v2.0.0.md` (statut publié, date, preuves), coverage map, bandeaux v1.1.x (« version active »).
- FR-06 Taguer `v2.0.0` sur le commit promu et créer la GitHub Release (notes = `docs/release/v2.0.0.md`).
- FR-07 Rédiger le runbook post-release (reliquat 007) : surveillance J+1/J+7 (erreurs console signalées, retours testeurs, quotas Deepgram), critères de retour arrière, procédure de rollback.
- FR-08 Mettre à jour les statuts : 030 → `implementee` ; 025, 026 → `cloturee` ; 007 → remplacée par la checklist (via V2-SDD-02) ; items reportés transférés (RM-04).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : nul (minutes GitHub Actions du dépôt public, SonarCloud/Snyk existants).
- NFR-02 Durée de gel : la branche de release n'accepte que des correctifs de gate pendant la clôture.
- NFR-03 Traçabilité : chaque preuve est liée depuis la checklist (URL de run, rapport).

## 12. Cas nominaux et alternatifs

- Nominal : tous les items verts → promotion → tag.
- Alternatif : un item non bloquant échoue → transfert explicite (RM-04) et publication.
- Alternatif : un item bloquant échoue → correctif sur `release/v2.0.0`, gate rejouée depuis l'item concerné.

## 13. Cas limites

- WebKit instable en CI : rejouer une fois ; deux échecs = bloquant (pas de `retries` masquant, cf. V2-QA-10 C6).
- Production en 1.1.4 alors que `main` est en 1.1.5 : vérifier que la promotion 2.0.0 n'embarque pas de changement 1.1.5 non validé [à confirmer].
- Sessions persistées 1.1.x restaurées en 2.0.0 (`docs/release/v2.0.0.md:79`) et l'inverse en cas de rollback (champ `externalMatch` optionnel ignoré [à confirmer par test]).

## 14. Gestion des erreurs

Échec de déploiement Pages : `validate-pages-build-env.mjs` bloque le build ; rollback par re-promotion du commit précédent ou retour arrière de déploiement Cloudflare [à confirmer : procédure dashboard].

## 15. Impacts architecturaux

Aucun sur le code applicatif. Processus de release uniquement.

## 16. Impacts sur les données et les interfaces

Contrat partenaire `v=1` publié et figé ; aucun schéma persistant modifié par cette spec.

## 17. Compatibilité avec l'existant

Compatible 1.1.x (sessions restaurées telles quelles). Le contrat `v=1` n'a jamais été publié avant (PR #201) : il naît avec la 2.0.0.

## 18. Dépendances

Bloquantes : V2-INT-01 (030), V2-DOC-01 (034), V2-QA-10 (043), V2-GAMES-01 (045), V2-GAMES-02 (046). Liées : V2-REL-02 (031, séquencement), V2-DS-00 (018, périmètre Safari/iOS), V2-QA-08 (008, E2E autonomes), V2-SDD-02 (032, clôtures), V2-DOC-06 (038).

## 19. Critères d'acceptation

- AC-01 La checklist existe, chaque item bloquant porte une preuve (lien).
- AC-02 Rapport Playwright complet (7 projets) vert sur le commit tagué.
- AC-03 SonarCloud Quality Gate « Passed » et Snyk sans vulnérabilité haute ouverte sur la PR de release.
- AC-04 Les 5 validations manuelles de 025 sont tracées (appareil, navigateur, date, résultat).
- AC-05 Tag `v2.0.0` et GitHub Release présents ; `origin/production:package.json` = 2.0.0.
- AC-06 `docs/release/v2.0.0.md` ne contient plus « Non publiée » ni « à confirmer » ; changelog in-app daté du jour de publication.
- AC-07 Parcours partenaire validé en preprod (simulateur) avec preuve.
- AC-08 Specs 007, 025, 026, 030 au statut cible, reliquats transférés.

## 20. Scénarios de tests

E2E : suite complète (smoke app, navigation, gameplay, lien externe — 28 scénarios annoncés, 26 blocs `test(` statiques —, tablette, smartphone). Unitaires : `npm run test:unit:coverage`, `governance:coverage`. Manuels : matrice 025 + preprod partenaire. Terrain : au moins un téléphone Android Chrome et un iPhone Safari.

## 21. Exigences de non-régression

Parcours de base ouvrir → jeu → prénoms → jouer inchangé ; sans paramètre `game`/`return`, aucun écran du lien externe (`docs/release/v2.0.0.md:80`).

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Activer le SW (031) en même temps que le contrat public | Élevé | Moyenne | Q2 : 031 en 2.0.1 |
| Retarder la publication attendue par badarts.fr | Moyen | Moyenne | Lot 0 resserré ; items non bloquants transférés |
| Changement de `in=` après publication | Élevé (contrat) | Faible si Q3 suivie | Trancher V2-GAMES-02 avant le tag |
| WebKit indisponible en local | Faible | Élevée | Exécution en CI ou image Docker Playwright |

## 23. Décisions architecturales

Aucun ADR. Arbitrages rappelés : H.1 (périmètre V2), H.2 (Double/Master-In), H.3 (baseline navigateurs), H.20 (`v=1` figé), H.21 (contacts partenaires).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Périmètre « V2 » (H.1) | Publier 2.0.0 après lot 0 puis 2.x incrémentales / tout sous 2.0.0 | Publier 2.0.0 après lot 0 ; vision V2 en 2.x | — |
| Q2 | 031 dans 2.0.0 ou 2.0.1 | Inclure / 2.0.1 / manifeste seul | 2.0.1 après validation preprod (ne pas cumuler 1re activation du SW et contrat public) ; documenter le défaut connu | — |
| Q3 | Double/Master-In avant le tag | Implémenter / retirer l'option et `in=` / tolérer `in` sans effet documenté | Trancher avant le tag ; si l'implémentation est longue, retirer l'option UI et documenter `in` toléré | — |
| Q4 | Sort de la spec 007 | Remplacée par la checklist / enrichie | Remplacée (`remplacee_par` 033) via V2-SDD-02 | — |
| Q5 | Appareils pour les validations manuelles | Appareils personnels / testeurs WhatsApp | Appareils du mainteneur + 2 testeurs volontaires | — |
| Q6 | Prévenir badarts.fr de la date de publication | Oui après autorisation / non | Oui, après autorisation explicite (H.21) | — |

## 25. Traçabilité

Rapports : `01-specs-backlog.md` §3 (007, 008, 025, 026, 030, 031), §7 (A1, A7-A9), §12.2 (V2-BKL-02/03) ; `10-docs-quality.md` §3.4 (C1, C2, C9) ; compte rendu §B.2, §F.1, §G (lot 0), §H.1-H.3. Specs : 007, 025, 026, 030, 031.

## Révision DevSecOps (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue du chantier DevSecOps (audit `docs/v2/audit/11-devsecops.md`) ; aucune exigence ci-dessous n'est validée. Le contenu ci-dessus est conservé tel quel.

### Constats

- L'item (h) de FR-01 et AC-03 exigent « Snyk vert » ; le chantier DevSecOps propose de retirer Snyk au profit d'OSV-Scanner et de Dependency Review (V2-SEC-02, spec 117, Q1) après 4 semaines de comparaison.
- Le planifié `Security Review` a échoué trois lundis de suite (2, 9, 16 novembre) sur `undici@7.30.1` côté `main` ; la branche de travail utilise l'override `undici` 7.30.2 (`package.json:76`) [vérifié] : le gate doit être évalué sur le commit de release, pas sur `main`.
- Un auto-merge sur `main` ne déploie rien : les promotions restent manuelles (114 §17).

### Exigences proposées

- DSO-FR-01 Gel DevSecOps : aucune modification de ruleset, de liste de checks requis ou de réglage de sécurité pendant la gate 2.0.0 ; les phases 1 et suivantes du séquencement (spec 128 §5.3) démarrent après le tag.
- DSO-FR-02 Item (h) reformulé : « analyses de vulnérabilités de dépendances vertes (Snyk tant qu'il est actif ; sinon OSV-Scanner et Dependency Review) et CodeQL sans alerte haute ».
- DSO-FR-03 Le runbook post-release (FR-07) renvoie au runbook de rotation des secrets (118) et au tableau de bord hebdomadaire (127) dès qu'ils existent.
- DSO-FR-04 La mesure Lighthouse sur preprod (123 FR-06) devient un item informatif de la checklist des releases suivantes.

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| DSO-Q1 | Gel DevSecOps pendant la gate 2.0.0 | Oui / non | Oui, sauf phase 0 sans effet sur les checks (118, correctifs des promotions) | — |

### Dépendances

V2-SEC-02 (117), V2-SEC-03 (118), V2-CICD-04 (127), V2-CICD-05 (128).
