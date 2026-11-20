# Tâches — 055 Mode Découverte : première partie guidée

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que V2-GAMES-06 (049) et V2-GAMES-01 (045) sont livrées et que Q1 à Q3 sont tranchées

## Implémentation
- [ ] T001 Ajouter `discovery?: boolean` à `GameConfig` et au modèle de setup ; interrupteur désactivé par défaut (AC-01, AC-06)
- [ ] T002 Ajouter le préréglage débutant X01 (301, Open, 1 manche) (AC-02)
- [ ] T003 Écrire `getDiscoveryTip` X01 en s'appuyant sur la source de fin de 045 (AC-02, AC-03)
- [ ] T004 Écrire `getDiscoveryTip` Cricket (AC-05)
- [ ] T005 Créer la présentation de la cible et le bandeau de conseil `aria-live` (AC-04, AC-07)
- [ ] T006 Intégrer le bandeau et le bouton « Règles » au cadre de jeu commun (049) (AC-04, AC-05)

## Tests
- [ ] T010 Tests unitaires par table et test exhaustif des restes 2-170 × Open/Double/Master (AC-02, AC-03)
- [ ] T011 Tests de composants : bandeau, masquage, explication du « Trop » (AC-04, AC-05)
- [ ] T012 Tests E2E : mode désactivé inchangé, reprise après rechargement (AC-01, AC-06)
- [ ] T013 Test lecteur d'écran consigné (AC-07)
- [ ] T014 Relecture des textes par un joueur confirmé (AC-08) et séance terrain avec 5 débutants (AC-09)

## Documentation et clôture
- [ ] T020 Mettre à jour le guide utilisateur, `README.md`, notes de release et changelog in-app
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
