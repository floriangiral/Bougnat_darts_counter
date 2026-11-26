# Tâches — 072 Disposition « arène » tablette paysage

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-TAB-01 (070) et V2-DS-01 (063) sont livrées — décision du PO du 2026-11-20 : recommandations appliquées ; 070 et 063 livrées dans le même chantier
- [ ] T001 Prototype X01/Cricket sur appareil ; reporter Q1 à Q5 — décisions Q1 à Q5 reportées ; prototype sur appareil non réalisé

## Implémentation
- [x] T002 `GameScreenLayout` (zones, recettes, slots optionnels) (AC-07)
- [x] T003 Lot X01 avec V2-DS-03 : cartes, finish inline, contrôles (AC-01, AC-04, AC-05)
- [x] T004 Lot Cricket (AC-02)
- [x] T005 Lot Capital (AC-04)
- [x] T006 Lot Killer et Gotcha (AC-03)
- [x] T007 Lot Triathlon (bandeau de phase) (AC-04)
- [x] T008 Suppression des crochets `.tablet-<jeu>-*` migrés (AC-07) — vues migrées ; `src/styles/layout/legacy-tablet-grid.css` supprimé

## Tests
- [x] T009 Tests unitaires du composant (AC-07)
- [ ] T010 E2E de mesure par jeu/profil (AC-01 à AC-05) — cibles ≥ 48 px et rangée Annuler/Valider écrites, tailles AC-01 à AC-03 non mesurées ; écrit, à exécuter dans la CI de la PR
- [ ] T011 E2E rotation en cours de saisie (AC-06) — écrit, à exécuter dans la CI de la PR
- [ ] T012 Test terrain de lisibilité à 3 m (AC-08) — recette terrain à faire

## Documentation et clôture
- [ ] T013 Guide utilisateur tablette, notes de release, architecture — notes de release et architecture mises à jour ; guide utilisateur tablette non créé
- [x] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — commit `24dbbab`, issue #244 fermée

## Révision PO : arène portrait (2026-11-20)
- [x] T015 Socle CSS tablette portrait tactile (`game-screen.css`, `:not([data-recipe='arena'])`) — livré
- [ ] T016 Arène portrait des six jeux : code livré ; mesures des touches ≥ 64 px et disposition des commandes à confirmer sur tous les jeux
- [ ] T017 E2E de mesure sur le profil `tablet-ipad-portrait` et recette sur tablette en portrait

## Suivi d'implémentation (2026-11-20)

Disposition à zones et arène portrait livrées sur `feat/v2.0.0` pour les six écrans de jeu, vérifiées au commit `24dbbab` ; #244 est fermée. Restent les mesures et E2E en CI (T010, T011, T016, T017), le prototype et la lecture à 3 m sur appareil (T001, T012), ainsi que le guide tablette (T013) ; suivi dans #354.
