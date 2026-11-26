---
id: 032-counter-sdd-conventions-v2
v2_id: V2-SDD-01
titre: Conventions SDD v2 (statuts, en-tête YAML, gabarits, index)
type: gouvernance
statut: implementee
validation: en-attente
origine: Documentation
famille: gouvernance
priorite: P0
difficulte: M
recommandation: recommande
lot: 0
poids: 30
depend_de: []
issue: '#214'
verifie_au_commit: 2f368b0
derniere_revue: 2026-11-26
---

# 032 — Conventions SDD v2

> **Statut : IMPLÉMENTÉE le 2026-11-23** (validée le même jour par le product owner ; « Go », recommandations retenues, voir §24). Contrôle `governance:specs` reporté au lot 1 (T008). Les conventions appliquées à titre de proposition dans la PR `docs/v2-specs` (en-têtes, gabarits, index) sont désormais la règle.

## 1. Origine et contexte
L'audit V2 (rapports [01](../../docs/v2/audit/01-specs-backlog.md) et [10](../../docs/v2/audit/10-docs-quality.md)) a constaté que les statuts des specs ne veulent plus rien dire : 27 des 29 specs indexées sont « active », y compris des releases taguées (004, 026). Quatre formats d'en-tête et trois vocabulaires de statut coexistent ; 027 et 028 manquaient à l'index ; 020, 021, 027 et 028 n'avaient que `spec.md` ; les gabarits couvraient environ 10 des 26 rubriques attendues.

## 2. Problématique
Sans cycle de vie fiable ni métadonnées communes, on ne peut ni savoir ce qui est réellement implémenté, ni piloter une V2 de plus de 80 propositions, ni éviter qu'une hypothèse devienne silencieusement une exigence.

## 3. Objectifs
- Un cycle de vie unique, compris par les humains et les agents IA.
- Des métadonnées exploitables (priorité, difficulté, recommandation, lot, poids, dépendances, issue).
- Des gabarits couvrant les 25 rubriques exigées pour une spec fonctionnelle, plus une étude et un ADR.
- Un index exhaustif et des règles de clôture par type.

## 4. État actuel vérifié dans le code
- `specs/README.md` (avant revue) : statuts `active`, `accepted`, `planned`, absence de 027/028, référence à `release-v1.1.3-sonar-debt` sans dossier.
- `.specify/templates/spec-template.md` (avant revue) : 12 rubriques, statut `draft` jamais utilisé.
- Seul `scripts/validate-sonar-coverage.mjs` lit une spec (029) : aucune autre automatisation ne dépend du format des specs.

## 5. Comportement cible
Voir [`.specify/conventions.md`](../../.specify/conventions.md) : emplacement, contenu minimal (`spec.md`, `plan.md`, `tasks.md`), en-tête YAML, statuts (`a-valider`, `en-discussion`, `a-revoir`, `validee`, `rejetee`, `reportee`, `en-cours`, `implementee`, `cloturee`, `retiree`) et champ `validation`, poids, issues, langue.

## 6. Périmètre
### Inclus
Conventions, gabarits, en-têtes des specs existantes (statut réel + traitement proposé), fiches 012/024, index `specs/README.md`, liaison specs ↔ issues ↔ projet GitHub.
### Exclu
Contrôle automatique en CI (`governance:specs`) : proposé en question ouverte, non implémenté ici. Traduction des specs historiques en anglais.

## 7. User stories
- En tant que product owner, je veux voir d'un coup d'œil le statut réel et la décision attendue de chaque spec, afin d'arbitrer une par une.
- En tant qu'agent IA, je veux savoir si une spec est validée avant de coder, afin de ne jamais implémenter une hypothèse.

## 8. Règles métier
- RM-01 : seul le product owner fait passer une spec à `validee`, `rejetee` ou `reportee`.
- RM-02 : une absence de réponse n'est pas une validation.
- RM-03 : un numéro de spec n'est jamais réutilisé ; une spec retirée garde une fiche.
- RM-04 : une fonctionnalité non implémentée n'est jamais présentée comme disponible.

## 9. Parcours utilisateurs
Création : copier le gabarit → remplir l'en-tête → statut `a-valider` → issue créée → arbitrage → `validee` → implémentation (`en-cours`) → `implementee` + `verifie_au_commit` → `cloturee` après validation terrain.

## 10. Exigences fonctionnelles
- FR-01 : toute spec possède l'en-tête YAML défini dans les conventions.
- FR-02 : toute spec de la V2 possède `spec.md`, `plan.md`, `tasks.md`.
- FR-03 : `specs/README.md` liste toutes les specs (y compris retirées) avec statut, priorité, difficulté, recommandation, lot, poids et issue.
- FR-04 : chaque spec V2 est liée à une issue `[V2-XXX-NN]` et au projet GitHub.

## 11. Exigences non fonctionnelles
- NFR-01 : aucune dépendance nouvelle ; YAML lisible sans outil.
- NFR-02 : compatibilité avec `scripts/validate-sonar-coverage.mjs` (la spec 029 conserve la liste des exclusions entre backticks).

## 12. Cas nominaux et alternatifs
Spec fonctionnelle, étude (ne crée aucune exigence), gouvernance, enrichissement d'une spec existante (section `Révision V2`).

## 13. Cas limites
Spec historique sans en-tête (ajout en tête de fichier) ; spec partiellement implémentée (`en-cours`) ; spec remplacée (`remplacee_par`).

## 14. Gestion des erreurs
Incohérence d'en-tête détectée en revue → correction avant validation.

## 15. Impacts architecturaux
Aucun sur le code applicatif.

## 16. Impacts sur les données et les interfaces
Ajout d'un en-tête YAML en tête des `spec.md` existants (le rendu GitHub l'affiche comme tableau de métadonnées).

## 17. Compatibilité avec l'existant
Le contenu historique des specs n'est pas modifié ; seuls l'en-tête et, le cas échéant, une section `Révision V2` sont ajoutés.

## 18. Dépendances
Aucune.

## 19. Critères d'acceptation
- AC-01 : les 31 dossiers historiques (001-031, dont 012/024 retirées) ont un en-tête avec `statut`, `statut_reel` et `traitement_propose`.
- AC-02 : les specs 032 à 112 respectent le gabarit et ont leurs trois fichiers.
- AC-03 : `specs/README.md` est exhaustif et cohérent avec les en-têtes.
- AC-04 : `npm run governance:coverage` passe toujours.

## 20. Scénarios de tests
Vérification manuelle de l'index ; exécution de `npm run governance:coverage`.

## 21. Exigences de non-régression
La spec 029 garde toutes ses exclusions listées.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Index désynchronisé des en-têtes | Moyen | Moyenne | Contrôle `governance:specs` (Q2) |
| Lourdeur pour de petites tâches | Faible | Moyenne | Une tâche locale sans changement d'architecture n'exige pas de spec complète (constitution transverse §7) |

## 23. Décisions architecturales
Aucune ADR ; les ADR sont stockées dans `docs/adr/`.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Adopter ces conventions avant de rédiger/valider les specs V2 ? | Oui / adapter / non | Oui | **Oui** (PO, 2026-11-23) : conventions adoptées. |
| Q2 | Ajouter un contrôle CI `governance:specs` (unicité, statuts, liens, index) ? | Oui / plus tard | Oui, en lot 1 | **Oui, en lot 1** (PO, 2026-11-23) : T008 reportée au lot 1, hors de cette spec. |
| Q3 | Langue unique des nouvelles specs ? | Français accentué / anglais | Français accentué | **Français accentué** (PO, 2026-11-23). |
| Q4 | Clôturer en lot les specs 002, 004, 014, 016, 020, 022, 025, 026 après vérification (V2-SDD-02) ? | Oui / au cas par cas | Au cas par cas dans une seule issue | **Au cas par cas dans #215** (PO, 2026-11-23) : voir §26. |
| Q5 | Abandonner l'item workspace `003-counter-split-scoring-client-from-player-social-shell` ? | Abandonner / reporter | Abandonner (shell social inexistant) | **Abandonner** (PO, 2026-11-23) : voir §27. |

## 25. Traçabilité
Compte rendu [docs/v2/compte-rendu-audit-2026-11-20.md](../../docs/v2/compte-rendu-audit-2026-11-20.md) (sections B et I) ; issues V2-SDD-01 et V2-SDD-02.

## 26. Clôtures vérifiées des specs historiques (V2-SDD-02, #215, T006)

Vérification au commit `863b4bd` (`origin/develop`, 2026-11-23) par lecture du code et des tests, et exécution ciblée de 13 fichiers de tests unitaires (154 tests verts : cycle de vie et statistiques X01, persistance de session, `appShell`, robot X01, `setupModel`, claviers, `useGameLifecycle`, modèles Capital et Cricket). Chaque spec porte une section « Clôture » qui détaille les preuves.

| Spec | Décision | Preuves principales | Reliquat transféré |
|---|---|---|---|
| [002](../002-counter-setup-clean-architecture/spec.md) | `cloturee` | Points d'entrée `createMatch`, `submitTurn`, `undoTurn` (et non `undoLastThrow`) dans `src/application/scoring/matchLifecycle.ts` ; `IndexedDBSessionRepository.saveAppSession` / `getCurrentMatch` ; `SyncRepository` vide (`src/application/scoring/ports.ts:10`) ; aucun appel réseau hors voix optionnelle | Découpe de `SetupView` → V2-ARCH-01 ([056](../056-counter-arch-layer-boundaries/spec.md)) |
| [004](../004-counter-release-v1-0-1-stabilization/spec.md) | `cloturee` | Tag et GitHub Release `v1.0.1` (2026-04-24), `docs/release/v1.0.1*.md` | — |
| [014](../014-counter-x01-keypad-digit-scale/spec.md) | `cloturee` | `components/game/Keypad.tsx:102` : chiffres `0-9` seuls agrandis ; touches textuelles inchangées | — (évolutions tablette portées par 072) |
| [016](../016-counter-x01-simple-bot-opponent/spec.md) | `cloturee` | `src/domain/x01Bot/x01Bot.ts:11-17`, `views/MatchView.tsx:642-679`, `components/game-setup/SetupPlayersSection.tsx` ; plage Pro alignée sur le code (86-120, affichée « + de 85 ») par décision PO du 2026-11-23 | — |
| [020](../020-counter-inp-phase1-quick-wins/spec.md) | `cloturee` (`validation: en-attente`) | `onPointerDown` + `isPrimary` + `longPressTriggeredRef` (`Keypad.tsx:105-161`), écriture unique (`IndexedDBSessionRepository.ts:58-66`), debounce 300 ms (`src/app/appShell.ts:184`) | Mesure INP P75 terrain → V2-PERF-01 ([044](../044-counter-perf-budgets/spec.md)) |
| [022](../022-counter-arch-single-responsibility-split/spec.md) | `cloturee` | Tous les modules extraits cités (périmètre, décisions v1.0.3, v1.0.4, v1.1.5) existent ; métriques de lignes périmées (App 678, MatchView 1 096) | Découpe de `MatchView` → V2-ARCH-11 ([061](../061-counter-matchview-decomposition/spec.md)) |
| [025](../025-counter-react-19-migration/spec.md) | `cloturee` (`validation: en-attente`) | `react` 19.3.1, `@types/react` ^19.3.0 ; CI et E2E Playwright des six jeux | Validations manuelles → V2-REL-01 ([033](../033-counter-release-v2-0-0-publication/spec.md), gate 2.1.0 item (i) de `docs/release/checklist.md`) ; Safari/iOS ancien → V2-DS-00 ([018](../018-counter-ios12-compatibility/spec.md)) ; appareils réels → V2-QA-09 ([042](../042-counter-qa-real-device-matrix/spec.md)) |
| [026](../026-counter-release-v1-1-stabilization/spec.md) | `cloturee` | Tag et GitHub Release `v1.1` (2026-05-19), branche `release/1.1`, PR #114 à #116, #144, #145 vers `main` | — |

Aucune spec n'est maintenue ouverte : aucun critère non tenu n'est apparu qui ne soit transférable à une spec V2 existante.

## 27. Backlog du workspace (V2-SDD-02, #215, T007)

Le fichier `.specify-workspace/backlog/next-specs.md` vit hors de ce dépôt (aucun dossier `.specify-workspace/` ici). L'arbitrage ci-dessous a été reporté dans ce fichier le 26 novembre 2026, à la demande du product owner (#215). Ce workspace n'étant pas un dépôt Git, la trace versionnée reste ici. Décision du 2026-11-23 : recommandations de l'audit ([rapport 01 §5](../../docs/v2/audit/01-specs-backlog.md)) retenues.

| Item | Décision (2026-11-23) | Suite |
|---|---|---|
| `001-xrepo-scoring-contract-v1` | Reporté | Cadrage dans V2-INT-07 ([109](../109-counter-bdt-contract-framing/spec.md)) |
| `002-bdt-extract-organizer-…` | Hors dépôt | Suivi côté `Bougnat_Darts_Tournaments` |
| `003-counter-split-scoring-client-from-player-social-shell` | **Abandonné** (Q5) | Shell social inexistant depuis la v1.0.1 ; aucune suite |
| `004-xrepo-device-board-session-model` | Reporté | Rouvert si l'appairage TV ([088](../088-counter-tv-pairing/spec.md)) l'exige |
| `005-counter-offline-scoring-session-store` | Fusionné | Partie stockage/instantané dans [010](../010-counter-offline-session-recovery-guarantees/spec.md) ; file d'opérations reportée (sans objet sans backend) |
| `006-bdt-live-sync-projections-hardening` | Hors dépôt | Suivi côté `Bougnat_Darts_Tournaments` |
| `007-xrepo-smartphone-vs-tablet-access-bounds` | Fusionné | Dans la révision de [001](../001-counter-scoring-access-modes/spec.md) (V2-ARCH-12) |

## 28. Transfert du contrôle automatique (2026-11-26)

T008 est reprise par la [spec 134 / V2-SDD-03](../134-counter-spec-governance-check/spec.md), #355, lot 1. Le principe reste celui adopté en Q2 ; le contrat technique et l'intégration CI sont `a-valider`. Aucun contrôle n'est encore livré.
