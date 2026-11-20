# Tâches — 038 Changelog in-app généré depuis les notes de release

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée et obtenir les décisions Q1 à Q4 (recommandation : après publication 2.0.0)

## Implémentation
- [ ] T001 Extraire les 9 versions vers `src/presentation/changelog/releaseNotes.fr.ts`, texte identique (AC-01)
- [ ] T002 Rendre `ChangelogModal` depuis la source, catégories et couleurs conservées (AC-01, AC-05)
- [ ] T003 Exclure les versions sans date de publication (AC-04)
- [ ] T004 Script `render-release-highlights.mjs` (`render`, `--check`) + script npm `changelog:check` (AC-02, AC-03)
- [ ] T005 Brancher `changelog:check` en CI (avec V2-QA-10) et l'item de datation dans la checklist 033
- [ ] T006 Optionnel (Q3) : chargement à la demande de la modale

## Tests
- [ ] T007 Test unitaire « version sans date non rendue » (AC-04)
- [ ] T008 Test du script sur fixtures (AC-02, AC-03)
- [ ] T009 Contrôle visuel avant/après de la modale (AC-05)

## Documentation et clôture
- [ ] T010 Mettre à jour `CONTRIBUTING.md` et `AGENTS.md` (où saisir les nouveautés)
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
