# Tâches — 073 Orientation tablette (verrou Android plein écran, invite non bloquante)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-TAB-01 (070) est livrée
- [ ] T001 Reporter les décisions Q1 à Q4 et la décision V2-TAB-06 (portée de `usePortraitLock`)

## Implémentation
- [ ] T002 Port d'orientation et adaptateur web (AC-O5, AC-O6)
- [ ] T003 `enterFullScreen` renvoie une promesse ; verrou paysage au lancement (AC-O5)
- [ ] T004 `unlock()` à la sortie des écrans de jeu (AC-O5)
- [ ] T005 Décision pure d'invite + composant `LandscapePrompt` (AC-O1 à AC-O3, AC-O7)
- [ ] T006 Mémorisation « Continuer en portrait » par partie (AC-O4)
- [ ] T007 Corriger `usePortraitLock` (portée, moment, `unlock`) et son commentaire (AC-O6)

## Tests
- [ ] T008 Tests unitaires : table de vérité d'invite, séquence de verrou simulée (AC-O5, AC-O6)
- [ ] T009 E2E : invite portrait/paysage, écrans hors jeu, mémorisation, rechargement (AC-O1 à AC-O4, AC-O8)
- [ ] T010 Tests terrain Chrome Android, Samsung Internet, iPad Safari, multitâche iPad (AC-O5, AC-O7)

## Documentation et clôture
- [ ] T011 Notes de release (limites), guide tablette, correction de la note v2.0.0
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
