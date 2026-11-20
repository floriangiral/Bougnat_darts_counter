---
id: 032-counter-sdd-conventions-v2
v2_id: V2-SDD-01
titre: Conventions SDD v2 (statuts, en-tête YAML, gabarits, index)
type: gouvernance
statut: a-valider
validation: en-attente
origine: Documentation
famille: gouvernance
priorite: P0
difficulte: M
recommandation: recommande
lot: 0
poids: 30
depend_de: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 032 — Conventions SDD v2

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20. Les conventions ont été appliquées à titre de proposition dans la PR `docs/v2-specs` (en-têtes, gabarits, index) ; elles deviennent la règle seulement après validation.

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
| Q1 | Adopter ces conventions avant de rédiger/valider les specs V2 ? | Oui / adapter / non | Oui | — |
| Q2 | Ajouter un contrôle CI `governance:specs` (unicité, statuts, liens, index) ? | Oui / plus tard | Oui, en lot 1 | — |
| Q3 | Langue unique des nouvelles specs ? | Français accentué / anglais | Français accentué | — |
| Q4 | Clôturer en lot les specs 002, 004, 014, 016, 020, 022, 025, 026 après vérification (V2-SDD-02) ? | Oui / au cas par cas | Au cas par cas dans une seule issue | — |
| Q5 | Abandonner l'item workspace `003-counter-split-scoring-client-from-player-social-shell` ? | Abandonner / reporter | Abandonner (shell social inexistant) | — |

## 25. Traçabilité
Compte rendu [docs/v2/compte-rendu-audit-2026-11-20.md](../../docs/v2/compte-rendu-audit-2026-11-20.md) (sections B et I) ; issues V2-SDD-01 et V2-SDD-02.
