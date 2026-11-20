---
id: 038-counter-in-app-changelog-source
v2_id: V2-DOC-06
titre: Changelog in-app généré depuis les notes de release
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: doc
priorite: P3
difficulte: S
recommandation: optionnel
lot: 5
poids: 5
depend_de: []
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 038 — Changelog in-app généré depuis les notes de release

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le rapport `10-docs-quality.md` (§2.1, ligne « docs/release », D10) relève un doublon fonctionnel : les nouveautés de chaque version sont saisies deux fois, dans `docs/release/vX.Y.Z.md` et en dur dans `components/ui/ChangelogModal.tsx` (305 lignes de JSX). Le compte rendu (§C.8, §H.26) demande au product owner s'il faut conserver ce changelog manuel. Aucune spec ne couvre aujourd'hui le changelog in-app (rapport `01-specs-backlog.md` §10).

## 2. Problématique

La double saisie crée des divergences (dates, contenus) et alourdit chaque release ; le changelog in-app peut annoncer une version non publiée.

## 3. Objectifs

- O1 : une seule saisie des nouveautés destinées aux joueurs par version.
- O2 : le changelog in-app n'affiche que des versions publiées, datées du jour de publication.
- O3 : aucun changement visible pour le joueur (même contenu, même accès depuis l'accueil).

## 4. État actuel vérifié dans le code

- [vérifié] `components/ui/ChangelogModal.tsx` (305 lignes) contient 9 versions codées en JSX (v2.0.0 l.24-65, v1.1.5 l.67, v1.1.4 l.92, v1.1.3 l.118, v1.1.2 l.145, v1.1.1 l.173, v1.1 l.204, v1.0.2 l.241, v1.0.1 l.270), avec catégories colorées (« Nouveautés », « Sur téléphone », « Sécurité et fiabilité », « Compatibilité »).
- [vérifié] L'entrée v2.0.0 est datée « 19/11/2026 » (`ChangelogModal.tsx:29`) alors que la version n'est pas publiée (`docs/release/v2.0.0.md:8`).
- [vérifié] Ouverture depuis l'accueil (`views/HomeView.tsx:17,150,170`) ; le composant est importé statiquement (`views/HomeView.tsx:5`).
- [vérifié] `tests/unit/components/changelogModal.test.tsx` vérifie la présence et l'ordre des versions et des libellés v2.0.0.
- [vérifié] Les notes `docs/release/*.md` visent un public technique (vérifications, couverture, branches) et sont majoritairement en français sans accents ; le changelog in-app vise les joueurs, en français accentué. Les deux contenus **ne sont pas identiques** : une génération directe depuis les notes actuelles n'est pas possible sans section dédiée aux joueurs.
- [constat] Le bouton de fermeture « × » (`ChangelogModal.tsx:18`) n'a pas de nom accessible (un second bouton « Fermer » existe) — hors périmètre, signalé à V2-QA-05 (041).

## 5. Comportement cible

Les nouveautés « joueurs » de chaque version sont saisies une seule fois dans une source structurée ; le changelog in-app et la section correspondante des notes de release en dérivent automatiquement ; un contrôle empêche toute divergence.

## 6. Périmètre

### Inclus
- Source unique des nouveautés joueurs (format selon Q1).
- Rendu de `ChangelogModal` à partir de cette source, sans changement visuel.
- Génération ou vérification de la section joueurs des notes de release.
- Règle de datation à la publication.

### Exclu
- Contenu technique des notes de release (vérifications, couverture) : reste rédigé à la main.
- Refonte visuelle du changelog (tokens : V2-DS-03, 065).
- Réécriture des notes historiques.

## 7. User stories

- En tant que mainteneur, je veux saisir les nouveautés une seule fois, afin de ne pas oublier l'une des deux copies.
- En tant que joueur, je veux voir les nouveautés de la version que j'utilise, datées correctement.

## 8. Règles métier

- RM-01 : une version n'apparaît dans le changelog in-app qu'avec une date de publication (pas de « à venir »).
- RM-02 : l'ordre d'affichage est antichronologique.
- RM-03 : les entrées historiques existantes sont reprises telles quelles (texte identique).

## 9. Parcours utilisateurs

Accueil → bouton notes de version → liste des versions (inchangé).

## 10. Exigences fonctionnelles

- FR-01 Source unique typée des nouveautés joueurs (proposition : `src/presentation/changelog/releaseNotes.fr.ts`, tableau de versions → catégories → éléments `{ titre, texte }`), validée par TypeScript.
- FR-02 `ChangelogModal` rend la source sans changement visuel (mêmes catégories, couleurs, ordre).
- FR-03 Script `scripts/render-release-highlights.mjs` qui écrit (ou vérifie) la section « Nouveautés pour les joueurs » de `docs/release/vX.Y.Z.md` entre deux marqueurs, pour les versions postérieures à l'adoption ; mode `--check` en CI.
- FR-04 Contrôle : chaque version de la source a un fichier `docs/release/vX.Y.Z.md`, et la version la plus récente correspond à `package.json` une fois publiée.
- FR-05 La date de la dernière version est renseignée à la publication (item de la checklist V2-REL-01, 033).
- FR-06 Chargement à la demande du composant et de ses données à l'ouverture (optionnel, Q3).

## 11. Exigences non fonctionnelles

- NFR-01 Aucune dépendance ajoutée (pas de parseur Markdown).
- NFR-02 Coût nul ; poids du bundle initial inchangé ou réduit.
- NFR-03 Textes en français accentué.

## 12. Cas nominaux et alternatifs

- Nominal (Q1 = A) : saisie dans la source TS → rendu in-app → section générée dans la note.
- Alternatif (Q1 = B) : saisie dans la note Markdown (section balisée) → extraction au build en JSON → rendu in-app.

## 13. Cas limites

- Version corrective sans nouveauté joueur : entrée absente du changelog, autorisée.
- Version retirée avant publication : supprimée de la source, aucune trace in-app.

## 14. Gestion des erreurs

Le mode `--check` échoue en CI si la section générée diffère de la source ou si une version n'a pas de note.

## 15. Impacts architecturaux

Données de présentation dans `src/presentation/` (couche existante, cf. `src/presentation/externalMatch/externalMatchLabels.fr.ts`) ; aucune dépendance du domaine.

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée. Nouveau fichier de données de présentation.

## 17. Compatibilité avec l'existant

Contenu affiché identique (RM-03) ; test existant adapté sans changer ses assertions de texte.

## 18. Dépendances

Aucune bloquante. Liens : V2-REL-01 (033, datation), V2-DOC-02 (035, emplacement des notes), V2-PERF-01 (044, chargement à la demande), V2-QA-05 (041, bouton « × »).

## 19. Critères d'acceptation

- AC-01 `tests/unit/components/changelogModal.test.tsx` passe sans modification de ses assertions de texte après migration.
- AC-02 Ajouter une version dans la source suffit à la faire apparaître in-app et dans la note (après `render`), sans autre saisie.
- AC-03 `--check` échoue si la section de la note est modifiée à la main.
- AC-04 Aucune version sans date n'est rendue (test unitaire).
- AC-05 Capture avant/après identique de la modale (contrôle visuel manuel ou V2-QA-05).

## 20. Scénarios de tests

Unitaires : rendu de la source, ordre, version sans date exclue ; outillage : script `render`/`--check` sur fixtures.

## 21. Exigences de non-régression

Accès au changelog depuis l'accueil inchangé ; affichage identique.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Effort supérieur au bénéfice (P3) | Faible | Moyenne | Recommandation `optionnel`, lot 5 |
| Écart visuel lors de la migration | Faible | Faible | AC-01, AC-05 |
| Notes historiques réécrites | Moyen | Faible | Section générée seulement après adoption |

## 23. Décisions architecturales

Aucun ADR. Arbitrage rappelé : H.26 (changelog in-app manuel ?).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Format de la source unique | A : données TS typées → section Markdown générée / B : section Markdown balisée → JSON au build / C : statu quo + contrôle de cohérence / D : statu quo | A (typé, sans parseur, notes historiques intactes) | — |
| Q2 | Titre de la spec si A | Garder / « Source unique des nouveautés joueurs » | Renommer en cas de choix A | — |
| Q3 | Chargement à la demande de la modale | Oui / non | Oui si V2-PERF-01 montre un gain mesurable | — |
| Q4 | Faire la spec en V2 | Oui / reporter | Reporter après la publication 2.0.0 ; corriger seulement la date (033) | — |

## 25. Traçabilité

Rapports : `10-docs-quality.md` §2.1 (« docs/release »), D10, §9 Q9 ; `01-specs-backlog.md` §10 ; compte rendu §C.8, §H.26. Specs : 033, 035.
