---
id: 035-counter-doc-organisation-and-adr
v2_id: V2-DOC-02
titre: Organisation documentaire, statuts de page et ADR
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: doc
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 15
depend_de: [V2-SDD-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 035 — Organisation documentaire, statuts de page et ADR

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le rapport `10-docs-quality.md` (§2.1, §5.1, D4) constate que la documentation ne distingue pas ce qui est implémenté, spécifié, futur, décidé ou historique ; que `docs/technical.md` (422 lignes) est un document fourre-tout ; que les archives v1.0.0 sont rangées au même niveau que la référence ; et qu'aucun ADR n'existait. Le compte rendu (§C.8) recommande une organisation par public avec un statut en tête de chaque page. La PR `docs/v2-specs` a initialisé `docs/adr/` (index + ADR-0001 à 0009 au statut `proposee`) et `docs/v2/` (audit historique) ; cette spec définit la règle durable et la réorganisation restante.

## 2. Problématique

Un lecteur ne peut pas savoir, page par page, si ce qu'il lit est livré, seulement spécifié, envisagé ou périmé ; les décisions d'architecture sont mêlées aux notes de version dans `docs/architecture.md`.

## 3. Objectifs

- O1 : 100 % des pages de `docs/` portent un bandeau de statut normalisé.
- O2 : un index unique (`docs/README.md`) liste chaque page avec son public et son statut.
- O3 : toute décision structurante a un ADR dans `docs/adr/`, relié aux specs.
- O4 : un contrôle automatique empêche la dérive (page sans statut, lien cassé, page absente de l'index).

## 4. État actuel vérifié dans le code

- [vérifié] `docs/` au commit `508dfa6` : `architecture.md`, `technical.md`, `specifications.md`, `product-scope.md`, `audit-security-hosting-performance-2026-04-24.md`, `architecture/` (3 archives titrées « archive v1.0.0 »), `integration/`, `release/` (19 fichiers). Aucun `docs/README.md`.
- [vérifié] L'index documentaire est une liste dans `docs/technical.md:393-412`, qui mélange référence, archives et notes de version.
- [vérifié] `docs/architecture.md` empile les « Decision v2.0 / v1.1 / v1.0.1 » (contenu de type ADR) au milieu de la référence (`docs/architecture.md:160-212` au commit `508dfa6`, suivies de « Release Controls » l.213-225).
- [vérifié] `docs/architecture/scoring-access-modes.md:5` renvoie à `docs/specifications.md` comme référence courante, qui ne traite pas les modes d'accès (sujet orphelin).
- [vérifié] Langues mélangées : specs 001-026 en français sans accents, 027-031 en anglais ; documentation majoritairement en français sans accents.
- [vérifié, arbre de travail de la PR] `docs/adr/README.md` + `0001…0009` (statut `proposee`), `docs/v2/` (audit), `AGENTS.md`, `.specify/templates/adr-template.md`.
- [vérifié] Aucun contrôle de liens ni de « doc drift » en CI (rapport 10, C10-C11).

## 5. Comportement cible

Chaque page commence par un bandeau `> **Statut : <valeur>** — <précision>` où `<valeur>` ∈ {Implémenté (vX.Y.Z), Spécifié (spec NNN, non livré), Futur (non spécifié), Décision (ADR-NNNN), Historique}. Les pages sont rangées par public ; l'index `docs/README.md` est la seule porte d'entrée ; les ADR suivent le gabarit `.specify/templates/adr-template.md` et un cycle `proposee → acceptee | rejetee | remplacee`.

## 6. Périmètre

### Inclus
- Règle de bandeau de statut et sa légende.
- `docs/README.md` (index) et organisation cible (option B du rapport 10 §5.1, après décision Q1).
- Conversion des « Decision vX » de `docs/architecture.md` en ADR historiques (statut `acceptee`, datés).
- ADR complémentaires identifiés (§23).
- Contrôle automatique de cohérence documentaire.

### Exclu
- Corrections de contenu immédiates (V2-DOC-01, spec 034).
- Contenu d'`AGENTS.md` (V2-DOC-03, spec 036).
- Guides utilisateur V2 (V2-DOC-05, spec 037).
- Index et statuts de `specs/` (V2-SDD-01, spec 032).
- Site de documentation généré (Docusaurus/VitePress) — écarté (rapport 10 §5.1 option C).

## 7. User stories

- En tant que joueur ou club, je veux savoir si une fonctionnalité décrite est disponible aujourd'hui.
- En tant que contributeur ou agent IA, je veux trouver la référence courante en un clic et distinguer une archive.
- En tant que mainteneur, je veux qu'une décision d'architecture soit retrouvable, datée et reliée à ses specs.

## 8. Règles métier

- RM-01 : une page `Implémenté` ne décrit que du code livré dans la version citée.
- RM-02 : une page `Historique` n'est jamais modifiée sur le fond (seulement bandeau et liens).
- RM-03 : un ADR `acceptee` n'est jamais réécrit ; il est `remplacee` par un nouvel ADR.
- RM-04 : un ADR `proposee` ne crée aucune obligation d'implémentation.

## 9. Parcours utilisateurs

Lecteur : `README.md` → `docs/README.md` → page par public → bandeau de statut → specs/ADR liés.

## 10. Exigences fonctionnelles

- FR-01 Légende des statuts et règle du bandeau dans `docs/README.md` et `.specify/conventions.md` (lien depuis V2-SDD-01).
- FR-02 Bandeau sur chaque page existante de `docs/` (y compris `release/`, `architecture/`, `integration/`, `adr/`, `v2/`).
- FR-03 Index `docs/README.md` : tableau page / public / statut / dernière revue.
- FR-04 Selon Q1, déplacer les pages vers `product/`, `user/`, `architecture/` (+ `adr/`), `dev/`, `integration/`, `operations/`, `history/` ; laisser un renvoi depuis chaque ancien chemin pendant au moins une version.
- FR-05 Scinder `docs/technical.md` en `dev/setup.md`, `dev/testing.md`, `dev/ci-cd.md`, `dev/dependencies.md`, `operations/deployment.md` (si Q1 = B).
- FR-06 Convertir « Decision v1.0.1 / v1.1 / v2.0 » de `docs/architecture.md` en ADR historiques `acceptee`.
- FR-07 Créer une page `architecture/access-modes.md` qui reprend le sujet orphelin (en lien avec V2-ARCH-12, spec 001).
- FR-08 Créer une page « État livré » (`product/status.md`) : version en production, en preprod, en préparation, mise à jour à chaque promotion (étape de la checklist V2-REL-01).
- FR-09 Contrôle `npm run docs:check` (script Node sans dépendance) : bandeau présent, page indexée, aucun lien relatif cassé, aucun lien `/home/`, chaque ADR a un statut valide ; exécuté en CI (via V2-QA-10).

## 11. Exigences non fonctionnelles

- NFR-01 Aucune dépendance ajoutée ; coût nul (GitHub rend le Markdown).
- NFR-02 Français accentué pour toute page nouvelle ou réécrite (H.8) ; pages historiques non traduites.
- NFR-03 Le contrôle FR-09 s'exécute en moins de 5 s.

## 12. Cas nominaux et alternatifs

- Nominal (Q1 = B) : réorganisation en un lot unique, renvois depuis les anciens chemins.
- Alternatif (Q1 = A) : corrections sur place ; seuls bandeaux, index, ADR et contrôle sont livrés.

## 13. Cas limites

- Liens externes vers `docs/release/*.md` (partenaires, issues) : conserver les chemins des notes de version ou laisser une page de renvoi.
- `components/ui/ChangelogModal.tsx` ou tests citant des chemins de doc : à vérifier avant déplacement (`grep`).
- `docs/integration/partner-simulator/index.html` testé par `tests/unit/tooling/partnerSimulator.test.ts` : ne pas déplacer sans adapter le test.

## 14. Gestion des erreurs

Le contrôle FR-09 échoue avec la liste des pages fautives ; aucune page n'est silencieusement ignorée.

## 15. Impacts architecturaux

Aucun sur le code. Les ADR documentent les règles de couches (ADR-0001 à 0009) sans les imposer : l'outillage relève de V2-ARCH-01 (056).

## 16. Impacts sur les données et les interfaces

Sans objet (aucune donnée applicative). Chemins de documentation publics modifiés si Q1 = B.

## 17. Compatibilité avec l'existant

Renvois depuis les anciens chemins ; `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, specs et tests mis à jour dans la même PR.

## 18. Dépendances

Bloquante : V2-SDD-01 (032, conventions et gabarit ADR). Liens : V2-DOC-01 (034), V2-DOC-03 (036), V2-QA-10 (043, exécution CI du contrôle), V2-ARCH-12 (001), V2-REL-01 (033, page d'état livré).

## 19. Critères d'acceptation

- AC-01 `npm run docs:check` passe ; il échoue si l'on retire un bandeau ou introduit un lien cassé.
- AC-02 `docs/README.md` liste 100 % des pages Markdown de `docs/`.
- AC-03 `docs/architecture.md` (ou `architecture/overview.md`) ne contient plus de section « Decision vX » ; chaque décision a son ADR.
- AC-04 Chaque ADR a un statut parmi `proposee`, `acceptee`, `rejetee`, `remplacee` et au moins une spec liée.
- AC-05 Un lecteur trouve la version en production depuis l'index en un clic (page d'état livré).

## 20. Scénarios de tests

Test unitaire du script de contrôle (`tests/unit/tooling/docsCheck.test.ts`) sur un petit arbre de fixtures ; exécution sur le dépôt réel en CI.

## 21. Exigences de non-régression

`tests/unit/tooling/partnerSimulator.test.ts` vert ; aucun lien du `README.md` cassé.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Liens externes cassés par les déplacements | Moyen | Moyenne | Renvois ; notes de version non déplacées (Q2) |
| Contenu corrigé par 034 perdu lors du déplacement | Moyen | Faible | 035 après 034 ; déplacement par `git mv` |
| Bandeaux non maintenus | Moyen | Élevée sans contrôle | FR-09 en CI |

## 23. Décisions architecturales

ADR existants (proposés) : 0001 à 0009 (`docs/adr/README.md`). ADR complémentaires proposés : résultat partenaire non signé (décision 2026-11-19, spec 030) ; frontière « pas de backend métier » vs relais optionnel (à trancher par V2-TV-01, 083, H.4) ; portrait imposé sur téléphone (V2-TAB-06, 028, H.7) ; baseline navigateurs (V2-DS-00, 018, H.3) ; Node 26 / npm 12 ; React 19 (025).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Réorganisation physique de `docs/` (H.26) | A : corrections sur place / B : réorganisation par public | B, en un seul lot après 034 | — |
| Q2 | Déplacer `docs/release/*` vers `history/` | Déplacer / garder | Garder `docs/release/` (liens externes), bandeau Historique | — |
| Q3 | Langue unique (H.8) | Français accentué / mixte | Français accentué pour tout nouveau texte | — |
| Q4 | ADR historiques v1.x | Convertir / laisser dans `architecture.md` | Convertir (statut `acceptee`, daté) | — |
| Q5 | Numérotation ADR | Séquentielle / par domaine | Séquentielle `NNNN` (déjà utilisée) | — |

## 25. Traçabilité

Rapports : `10-docs-quality.md` §2.1, §5.1, §7.2, D4-D6, C10-C11 ; `02-architecture.md` §9 (ADR-0001 à 0009) ; compte rendu §C.8, §H.8, §H.26. Specs : 032, 034, 036, 001, 083.
