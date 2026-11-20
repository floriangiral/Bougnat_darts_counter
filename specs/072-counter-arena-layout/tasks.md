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
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer

## Révision PO : arène portrait (2026-11-20)
- [ ] T015 Socle CSS tablette portrait tactile (`game-screen.css`, `:not([data-recipe='arena'])`) — en cours
- [ ] T016 Arène portrait des six jeux : joueur actif en haut, pavé ≈ 46 % de la hauteur, touches ≥ 64 px, Annuler à côté de Valider — en cours
- [ ] T017 E2E de mesure sur le profil `tablet-ipad-portrait` et recette sur tablette en portrait

## Suivi d'implémentation (2026-11-20)

Disposition à zones livrée sur `feat/v2.0.0` pour les six écrans de jeu (issue #244) ; commit de vérification à renseigner. Restent ouverts : prototype et lecture à 3 m sur appareil (T001, T012), mesures et exécution des E2E dans la CI de la PR (T010, T011), guide tablette (T013), validation par le product owner et clôture de l'issue (T014). Révision PO du 2026-11-20 : arène portrait en cours (T015 à T017).
