# Tâches — 063 Design tokens (socle unique Dark/Light/club/TV)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-00 (018) et V2-QA-05 (041) sont levées
- [ ] T001 Reporter dans la spec la décision de format (Q1) et de normalisation (Q2)

## Implémentation
- [ ] T002 Créer `src/styles/tokens/primitives.css` en hex/rgb (AC-06)
- [ ] T003 Créer `src/styles/tokens/themes.css` avec les rôles Dark (AC-01)
- [ ] T004 Créer `src/styles/tokens/components.css` (bouton primaire, touche, carte de score) (AC-01)
- [ ] T005 Créer `src/styles/tokens/tailwind-bridge.css` (`@theme inline`, `@custom-variant`) (AC-01)
- [ ] T006 Importer les tokens dans `src/styles/tailwind.css`, tokeniser l.207, 266, 425 (AC-02)
- [ ] T007 `index.html` : `data-theme="dark"`, supprimer le style inline du `body` (AC-01, AC-05)
- [ ] T008 Ajouter le cliquet de classes brutes dans `scripts/guard-clean-codebase.sh` (AC-03)

## Tests
- [ ] T009 Tests unitaires de structure des tokens (rôles présents, formats) (AC-01, AC-06)
- [ ] T010 Tests du cliquet sur fixtures (AC-03)
- [ ] T011 Rejouer les captures V2-QA-05 et corriger jusqu'à tolérance (AC-02)
- [ ] T012 Recherche `dark:` = 0 dans le code (AC-04)

## Documentation et clôture
- [ ] T013 Finaliser ADR 0006 et le guide des rôles ; règle « pas de couleur brute » dans `CONTRIBUTING.md`
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
