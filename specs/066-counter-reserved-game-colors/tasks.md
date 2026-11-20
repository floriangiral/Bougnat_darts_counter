# Tâches — 066 Couleurs métier réservées (multiplicateurs, bust, fermé, joueur actif)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée
- [ ] T001 Reporter les décisions Q1 (Capital) et Q3 (contraste)

## Implémentation
- [ ] T002 Rôles `game-*` Dark dans les tokens (AC-05)
- [ ] T003 `matchFeedback.ts` → fonction de ton pure (AC-02)
- [ ] T004 Supprimer le style inline `#d90416` de `CricketKeypad.tsx` (AC-02)
- [ ] T005 Aligner `CapitalKeypad.tsx` sur la convention (si Q1) (AC-01)
- [ ] T006 Attributs `data-tone`/`data-multiplier`/`data-state` (AC-01)
- [ ] T007 Contraste score et nom inactifs `PlayerScore.tsx` (AC-03)
- [ ] T008 Indices de forme vérifiés pour chaque état (AC-04)

## Tests
- [ ] T009 Tests unitaires de tons par jeu (AC-01)
- [ ] T010 Test unitaire de la fonction de ton du feedback (AC-02)
- [ ] T011 E2E axe-core contraste X01 2 joueurs (AC-03)
- [ ] T012 Revue des captures en niveaux de gris (AC-04)

## Documentation et clôture
- [ ] T013 Publier la convention (AC-05) ; notes de release
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
