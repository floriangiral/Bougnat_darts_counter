# Tâches — 100 « Station en un scan »

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 092 et 096 sont livrées et que Q1 à Q6 sont tranchées
- [ ] T001 Vérifier l'état de 046 (ouverture) pour exclure ou inclure `checkIn` des réglages

## Implémentation
- [ ] T002 Contrat pur `stationLink.ts` : liste blanche, bornes, ≤ 600 octets (AC-04)
- [ ] T003 `stationPreferences.ts` et injection dans `createInitialSetupState` et `GameSelectionView` (AC-01, AC-02)
- [ ] T004 Lecture du fragment après 030, carte de confirmation, nettoyage de l'adresse (AC-03, AC-08)
- [ ] T005 Écran « Préparer une station » et fiche de configuration (QR `station` via 092) (AC-01)
- [ ] T006 Page d'affiche imprimable avec QR « Jouez ici » (payload `theme`) et mention Bougnat (AC-05)
- [ ] T007 Wake Lock sur écrans de jeu selon la préférence (AC-06)
- [ ] T008 « Retirer la configuration de station » (AC-07)

## Tests
- [ ] T009 Tests unitaires du contrat et de l'injection (AC-04)
- [ ] T010 E2E : préparation, réception, ignorer, retrait, coexistence `v=1` (AC-01, AC-03, AC-07, AC-08)
- [ ] T011 E2E comparatif du parcours de base avec et sans station (AC-02)
- [ ] T012 Tests manuels : impression A4 iPad/Android, scan, Wake Lock 10 min (AC-05, AC-06)

## Documentation et clôture
- [ ] T013 Guide « Station » pour les lieux et contrat `#station=1.`
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
