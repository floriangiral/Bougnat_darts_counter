# Plan — 038 Changelog in-app généré depuis les notes de release

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` (recommandation : après la publication 2.0.0). Le plan suit l'option A de Q1 ; l'option B est décrite en §2.

## 1. Lecture de l'existant
- `components/ui/ChangelogModal.tsx:1-305` (9 versions en JSX, date v2.0.0 l.29) ; `views/HomeView.tsx:5,17,150,170` ; `tests/unit/components/changelogModal.test.tsx` ; `docs/release/*.md`.

## 2. Approche retenue (et alternatives écartées)
- **Retenue (A)** : données typées `src/presentation/changelog/releaseNotes.fr.ts` ; `ChangelogModal` devient un rendu générique ; `scripts/render-release-highlights.mjs` écrit/vérifie la section joueurs des notes pour les versions postérieures à l'adoption.
- Alternative (B) : section Markdown balisée dans chaque note, extraite au build en JSON — impose un format Markdown strict et la reprise des notes historiques.
- Écartée : parseur Markdown en dépendance (contraire à NFR-01).

## 3. Étapes
1. Extraire le contenu des 9 versions de `ChangelogModal.tsx` vers `releaseNotes.fr.ts` (texte identique, RM-03).
2. Réécrire `ChangelogModal` pour itérer sur les données (catégories, couleurs conservées).
3. Ajouter le filtre « version sans date non rendue » (RM-01).
4. Écrire `scripts/render-release-highlights.mjs` (`render` et `--check`) et le script `changelog:check` dans `package.json`.
5. Ajouter `changelog:check` à la CI (via V2-QA-10) et l'item « dater la version » à la checklist V2-REL-01.
6. Optionnel (Q3) : `lazy()` de la modale.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/presentation/changelog/releaseNotes.fr.ts` (nouveau) | Source unique |
| `components/ui/ChangelogModal.tsx` | Rendu générique |
| `scripts/render-release-highlights.mjs` (nouveau), `package.json` | Génération / contrôle |
| `tests/unit/components/changelogModal.test.tsx` | Inchangé sur le texte ; cas « sans date » ajouté |
| `tests/unit/tooling/releaseHighlights.test.ts` (nouveau) | Test du script |
| `docs/release/vX.Y.Z.md` (versions futures) | Section générée entre marqueurs |

## 5. Impacts UI / domaine / application / infrastructure
UI : rendu identique. Présentation : nouveau fichier de données. Aucun impact domaine.

## 6. Stratégie de migration
Migration unique du contenu existant ; aucune donnée utilisateur.

## 7. Stratégie de test
Test existant conservé (AC-01) ; tests du filtre de date et du script ; contrôle visuel avant/après.

## 8. Non-régression
Accès depuis l'accueil et contenu affiché inchangés.

## 9. Rollback / désactivation
`git revert` (le composant JSX d'origine est restauré).

## 10. Documentation à mettre à jour avec l'implémentation
Checklist de release (033), `AGENTS.md` (définition de « terminé »), `CONTRIBUTING.md`.
