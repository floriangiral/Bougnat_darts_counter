# Tâches — 129 Page Réglages

> Exécutées le 2026-11-20 à la demande directe du product owner. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Demande explicite du product owner (2026-11-20) ; dépendance 069 livrée

## Implémentation
- [x] T001 Module pur des réglages : défauts, validation, version, raccourcis (AC-04, AC-06)
- [x] T002 Stockage local non bloquant, contrôleur unique et hook (AC-04, AC-05)
- [x] T003 Raccourcis X01 et barre téléphone branchés sur la préférence (AC-04, AC-05)
- [x] T004 `MatchView` : aide de finish et voix lues au démarrage, menu de partie écrivant la préférence (AC-04, AC-05)
- [x] T005 Écran `SETTINGS` et câblage `App.tsx` / historique (AC-02, AC-03)
- [x] T006 Accueil : roue crantée, sélecteur retiré (AC-01)

## Tests
- [x] T010 Tests unitaires du module pur, du stockage et du contrôleur (AC-06)
- [x] T011 Tests de l'écran Réglages, de l'accueil, du hook et de `MatchView` (AC-01 à AC-05)
- [x] T012 E2E `theme.smoke.spec.ts` adapté (exécution en CI de la PR)
- [ ] T013 Recette terrain Dark/Light, téléphone, tablette portrait/paysage, bureau (AC-07)

## Documentation et clôture
- [x] T020 Spec 069 (Q1 révisée, Implémentation), `docs/design-system.md` §6, `specs/README.md`
- [ ] T021 Créer l'issue `[V2-SET-01]`, renseigner `verifie_au_commit`, passer `validation` à `validee` après recette
