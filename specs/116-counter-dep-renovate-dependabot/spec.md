---
id: 116-counter-dep-renovate-dependabot
v2_id: V2-DEP-01
titre: Renovate, unique générateur des mises à jour, et Dependabot limité à la veille de sécurité
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 30
depend_de: [V2-SEC-01, V2-CICD-02]
remplace: []
remplacee_par: []
issue: '#305'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 116 — Renovate, unique générateur des mises à jour, et Dependabot limité à la veille de sécurité

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§5, §6) fait de Renovate le seul créateur de PR de mise à jour et réduit Dependabot à la détection des vulnérabilités. Aujourd'hui Dependabot crée à la fois des PR de version (vers `develop`) et des PR de sécurité (vers `main`), que le mainteneur ferme sans les fusionner.

## 2. Problématique

Deux mécanismes concurrents produisent des PR non groupées, sur deux branches différentes, sans politique de maturité ni d'auto-merge ; les montées critiques (Node, TypeScript, Playwright et son image Docker, Wrangler) exigent des contraintes que la configuration actuelle n'exprime pas.

## 3. Objectifs

- O1 : une seule source de PR de mise à jour (Renovate), groupées, hebdomadaires, lisibles.
- O2 : correctifs de sécurité traités hors fenêtre hebdomadaire, sans doublon.
- O3 : les montées courantes validées fusionnent seules (114) ; les montées risquées attendent une revue.

## 4. État actuel vérifié dans le code

- [vérifié] `.github/dependabot.yml:1-28` : mises à jour de version npm (lundi 07:15 Europe/Paris, 5 PR max) et GitHub Actions (07:30, 3 PR max), **cible `develop`** (`:6`, `:19`), étiquettes `dependencies`.
- [vérifié] Réglages : alertes Dependabot et **mises à jour de sécurité Dependabot** actives (`/automated-security-fixes` → `enabled: true`) ; une branche `dependabot/npm_and_yarn/joi-18.2.9` existe vers `main` [vérifié `gh api …/branches`].
- [vérifié] PR Dependabot #191 à #198 (9/11, vers `develop`) toutes fermées sans fusion ; #186 fusionnée le 20/10 [vérifié `gh pr list`].
- [vérifié] Gestionnaires de dépendances présents : npm (`package.json`, `package-lock.json` 305 Ko, `overrides` `package.json:66-90`, `allowScripts` `:91-95`, `engines` `:6-8`, `packageManager: npm@12.2.3` `:5`) ; GitHub Actions (10 workflows + 2 actions composites, épinglées par SHA) ; Dockerfiles (`docker/app.Dockerfile:1` `node:26.13.1-alpine`, `docker/playwright.Dockerfile:1` `mcr.microsoft.com/playwright:v1.65.1-noble`) ; `.nvmrc` (`26.13.1`). `compose.yml` ne référence aucune image.
- [vérifié] Contraintes volontaires documentées : TypeScript `~6.0.3` (compatibilité typescript-eslint, `docs/technical.md:108`), `@types/node` aligné sur Node 26 (`:120`), Undici 7 sauf jsdom (`:84-85`), React exact `19.3.1` (`package.json:35-36`).
- [vérifié] `allowScripts` fige des versions exactes (`esbuild@0.28.2`, `workerd@1.20261118.1`) : une montée transitive de ces paquets (via Vite ou Wrangler) peut exiger une mise à jour manuelle de cette liste [comportement exact de npm 12 à confirmer].
- [vérifié] `docs/technical.md:149-150` demande de « conserver l'épinglage par SHA lors des mises à jour Dependabot ».
- [non lu] `.npmrc` : lecture refusée par la politique d'exclusion de contenu ; son effet éventuel (registre, scripts) est [à confirmer].
- [vérifié, source externe] Mend Renovate Community Cloud : gratuit, dépôts publics et privés illimités, 1 tâche concurrente, planification toutes les 4 heures, délai 30 min ; l'offre Community (OSS) est accordée sur demande aux projets sous licence OSI — docs.renovatebot.com « Mend Renovate Cloud-hosted », consulté le 2026-11-20.
- [vérifié, source externe] `schedule` ne déclenche pas Renovate ; fenêtre recommandée d'au moins 3-4 heures ; syntaxe cron sans minutes ; `vulnerabilityAlerts` lit les alertes GitHub (graphe de dépendances, alertes Dependabot, permission de lecture de l'application) et **ignore** `schedule` et `prConcurrentLimit` ; `osvVulnerabilityAlerts` ne couvre que les dépendances directes ; `minimumReleaseAge` ajoute un statut « pending » — docs.renovatebot.com « Configuration options », consulté le 2026-11-20.

## 5. Comportement cible

- Application Mend Renovate installée sur ce seul dépôt ; fichier `renovate.json` versionné, validé en CI.
- Vague hebdomadaire le lundi matin (Europe/Paris), maturité de 7 jours, groupes cohérents, PR dédiées pour les composants critiques, 5 PR simultanées au plus, Dependency Dashboard, étiquettes explicites, notes de version intégrées.
- Correctifs de sécurité : dès détection, hors fenêtre, sans maturité.
- `.github/dependabot.yml` supprimé ; mises à jour de sécurité Dependabot désactivées ; alertes et graphe conservés comme source de veille.

## 6. Périmètre

### Inclus
- npm (production, développement, `overrides`, lockfile), GitHub Actions (y compris actions composites), Dockerfiles, `.nvmrc`/`engines`/`packageManager`.
- Politique de groupement, de maturité, d'étiquetage, de limites, de sécurité.
- Retrait de Dependabot version updates et security updates (ordre imposé).

### Exclu
- Vérification de l'éligibilité à l'auto-merge (114) ; scans de vulnérabilités (117).
- `compatibility_date` de `wrangler.jsonc` (montée manuelle, hors gestionnaire) [à confirmer : gestionnaire personnalisé possible].

## 7. User stories

- En tant que mainteneur, je veux une poignée de PR groupées le lundi, afin de traiter la maintenance en une fois.
- En tant que mainteneur, je veux qu'un correctif de sécurité arrive le jour même, afin de ne pas attendre une semaine.

## 8. Règles métier

- RM-01 Renovate est le seul générateur de PR de dépendances ; `npm audit fix --force` est interdit.
- RM-02 Maturité de 7 jours pour toute version ordinaire ; 0 jour pour un correctif de sécurité.
- RM-03 Playwright npm et l'image `mcr.microsoft.com/playwright` évoluent dans la **même** PR.
- RM-04 `.nvmrc`, `engines.node`, l'image `node` et `@types/node` évoluent ensemble ; une majeure de Node exige une revue et une spec.
- RM-05 TypeScript reste sur la branche compatible avec typescript-eslint (`allowedVersions`) jusqu'à décision humaine.
- RM-06 Une PR en échec reste ouverte ; Renovate ne la ferme pas tant qu'une version plus récente ne la remplace pas.

## 9. Parcours utilisateurs

Lundi 05:00-11:00 (Paris) → Renovate crée ou rebase les PR → CI (113) → auto-merge si éligible (114) → sinon revue. Alerte de sécurité → PR Renovate immédiate (étiquette `security`) → CI → fusion selon 114/117.

## 10. Exigences fonctionnelles

- FR-01 `renovate.json` : `extends` `config:recommended`, `:dependencyDashboard`, `helpers:pinGitHubActionDigests` ; `timezone: Europe/Paris` ; `schedule: ["* 5-10 * * 1"]` ; `lockFileMaintenance` (même fenêtre) ; `minimumReleaseAge: "7 days"` ; `prConcurrentLimit: 5` ; `prHourlyLimit: 0` ; `baseBranches` selon 113 Q1.
- FR-02 `vulnerabilityAlerts` : étiquettes `security`, `minimumReleaseAge: null`, limite propre de 5 PR ; `osvVulnerabilityAlerts: true` en complément.
- FR-03 Groupes : lint (ESLint, typescript-eslint, plugins, `globals`), tests unitaires (Vitest, `@vitest/*`, jsdom, fake-indexeddb, Testing Library), Playwright (npm + image Docker), Tailwind/PostCSS, Vite (`vite`, `@vitejs/*`), types (`@types/*` hors `@types/node`), React (`react`, `react-dom`, `@types/react*`), runtime Node (`.nvmrc`, image `node`, `engines`, `@types/node`), actions non critiques.
- FR-04 PR dédiées : `@deepgram/sdk`, `wrangler`, `typescript`, `lucide-react`, `qrcode`, `vite` (majeure), actions de sécurité/déploiement.
- FR-05 Séparation par type : étiquettes `deps:production`, `deps:developpement`, `deps:ci`, `deps:runtime` ; `update:patch|minor|major|security`.
- FR-06 Politique d'auto-merge **proposée** par Renovate (`automerge: true`, `platformAutomerge: true`, `automergeType: pr`) uniquement pour les catégories autorisées en 114 ; activée après 2 semaines de stabilité des agrégateurs.
- FR-07 Majeures et 0.x : `automerge: false` ; option Q2 (approbation par le Dependency Dashboard avant création).
- FR-08 Validation : job CI exécuté quand `renovate.json` change (`renovate-config-validator --strict`, version épinglée) ; migration de configuration acceptée par revue humaine.
- FR-09 Suppression de `.github/dependabot.yml` dans la PR d'activation ; désactivation des mises à jour de sécurité Dependabot après la première PR de sécurité Renovate réussie (115 FR-08).
- FR-10 Contraintes : `allowedVersions` pour TypeScript (`<6.1` tant que typescript-eslint ne supporte pas la suivante), `@types/node` (`<27`), Undici (overrides) ; React exact conservé (`rangeStrategy: pin` pour les dépendances d'exécution, Q3).
- FR-11 Gestion d'`allowScripts` : règle ou PR dédiée pour `wrangler`/`vite` signalant la mise à jour nécessaire de la liste (Q4).
- FR-12 Dependency Dashboard : issue unique, lien depuis le rapport hebdomadaire (127) ; `dependency-watch.yml` retiré (113).

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € (Mend Renovate Community Cloud) ; aucun secret à stocker dans le dépôt.
- NFR-02 Volume cible : ≤ 6 PR par semaine hors sécurité (5 dépendances d'exécution, 28 de développement, ≈ 10 actions, 2 images) [à mesurer sur 4 semaines].
- NFR-03 Sécurité : application limitée à ce dépôt (« Only select repositories ») ; permissions revues à l'installation (contenu, PR, issues, workflows, statuts, lecture des alertes Dependabot).

## 12. Cas nominaux et alternatifs

- Nominal : lundi, 3 PR groupées patch/minor → auto-merge ; 1 PR majeure → revue.
- Alternatif : vulnérabilité sur une dépendance directe → PR immédiate.
- Alternatif : vulnérabilité transitive sans montée directe possible → pas de PR Renovate ; détection OSV (117) → issue de triage → `overrides` ou maintenance de lockfile par PR humaine/agent.

## 13. Cas limites

- Service Mend indisponible : aucune PR, alerte visible par l'absence de mise à jour du Dashboard (rapport 127) ; alternative auto-hébergée possible (Q1).
- Paquet republié ou retiré (`unpublish`) : la maturité de 7 jours réduit l'exposition.
- Conflits : Renovate rebase automatiquement les PR en retard ou en conflit (`rebaseWhen: auto`).

## 14. Gestion des erreurs

PR en échec : étiquette `maintenance:echec` (114), commentaire de Renovate, ligne dans le Dashboard ; aucun `--force`.

## 15. Impacts architecturaux

Aucun sur l'application. Nouveau fichier de configuration racine.

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Épinglage SHA des actions conservé (`helpers:pinGitHubActionDigests`), conformément à `docs/technical.md:149-150` (à reformuler « Renovate »).

## 18. Dépendances

- Bloquantes : V2-SEC-01 (115, auto-merge autorisé, ruleset), V2-CICD-02 (114, éligibilité vérifiée) pour l'auto-merge ; l'installation et les PR sans auto-merge peuvent précéder.
- Liées : V2-CICD-01 (113 Q1, branche cible), V2-SEC-02 (117), V2-CICD-04 (127).

## 19. Critères d'acceptation

- AC-01 L'onboarding Renovate crée la PR de configuration puis le Dependency Dashboard.
- AC-02 Une mise à jour patch compatible est détectée et une PR est créée dans la fenêtre du lundi, après 7 jours de maturité.
- AC-03 Playwright npm et l'image Docker Playwright sont mis à jour dans la même PR.
- AC-04 Une majeure ne déclenche pas d'auto-merge.
- AC-05 Une alerte de sécurité sur une dépendance directe produit une PR hors fenêtre, sans doublon Dependabot.
- AC-06 Après bascule, `.github/dependabot.yml` est absent, les mises à jour de sécurité Dependabot sont désactivées, les alertes restent actives.
- AC-07 Le validateur Renovate échoue sur une configuration invalide (PR jetable).
- AC-08 Aucun doublon de PR pour une même dépendance sur 4 semaines.

## 20. Scénarios de tests

Observation de 4 vagues hebdomadaires ; PR jetable de configuration invalide ; simulation de vulnérabilité sur un dépôt bac à sable [à confirmer : pas d'introduction volontaire de vulnérabilité dans `main`].

## 21. Exigences de non-régression

Lockfile toujours cohérent (`npm ci` vert) ; contraintes de versions documentées respectées ; build legacy et E2E verts.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Application tierce avec droits d'écriture | Moyen | Faible | Dépôt unique, permissions revues, ruleset sans contournement |
| `allowScripts` désynchronisé après montée transitive | Moyen | Moyenne | PR dédiée Wrangler/Vite, contrôle CI explicite (Q4) |
| Bruit initial (rattrapage) | Faible | Élevée | Dashboard, limites, groupement |
| Fenêtre manquée (planification toutes les 4 h) | Faible | Faible | Fenêtre de 6 h |

## 23. Décisions architecturales

ADR proposé : « Renovate unique générateur de PR de dépendances » (choix Mend hébergé vs auto-hébergé).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mend hébergé ou Renovate auto-hébergé (Action) | Mend Community Cloud / Action + jeton d'application | Mend hébergé (aucun secret, aucun jeton longue durée) | — |
| Q2 | Majeures : PR directe ou approbation préalable par le Dashboard | PR directe / approbation | Approbation par le Dashboard (moins de PR ouvertes inutilement) | — |
| Q3 | Stratégie de version des dépendances d'exécution | Épinglage exact / plages `^` | Épinglage exact (reproductibilité, React déjà exact) | — |
| Q4 | `allowScripts` | Mise à jour manuelle en PR dédiée / gestionnaire regex | PR dédiée et contrôle CI explicite, puis gestionnaire regex si stable | — |
| Q5 | Demander l'offre Community (OSS) | Oui / non | Oui après correction de la détection de licence (115 FR-10) | — |
| Q6 | Épingler les images Docker par digest | Oui / non | Oui (image Playwright reproductible) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (§3, §6) ; demande DevSecOps §5, §6 ; specs 113, 114, 115, 117, 127.
