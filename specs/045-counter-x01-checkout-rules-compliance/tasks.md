# Tâches — 045 X01 : conformité des sorties

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`), que Q1 à Q4 sont tranchées et que V2-QA-01 (spec 039) fournit les golden tests X01

## Implémentation
- [ ] T001 Créer la fonction pure de finissabilité et ses tables (Open/Double/Master) dans `src/domain/scoring/` (AC-05, AC-07)
- [ ] T002 Supprimer les listes de bogeys dupliquées et déléguer (`checkoutEligibility.ts`, `ScoringRules.ts`, `matchStats.ts`, `x01BotTurn.ts`) (AC-07)
- [ ] T003 `submitTurn` : trop à 1 en Master-Out (AC-03)
- [ ] T004 `buildScoreSubmissionResult` : trop si total = reste non finissable + retour « SORTIE IMPOSSIBLE » (AC-01, AC-08)
- [ ] T005 `MatchView` : RESTE cible 1 en Master, garde l. 429, filtre de confirmation (AC-02, AC-03)
- [ ] T006 Robot : bornes de placement et fléchettes finales (AC-04)
- [ ] T007 `getMinDartsForScore` exact (AC-02, AC-05)
- [ ] T008 Aide de sortie par règle + libellé FR (AC-06)
- [ ] T009 Migration de session restaurée si Q4 = a

## Tests
- [ ] T010 Tests unitaires paramétrés moteur/soumission (AC-01 à AC-03)
- [ ] T011 Tests robot à graine fixe, 10 000 tirages × 5 niveaux (AC-04)
- [ ] T012 Test exhaustif `getMinDartsForScore` (AC-05)
- [ ] T013 Test composant aide de sortie (AC-06)
- [ ] T014 E2E Double-Out tentative 180 + undo, et 501 Triathlon (AC-01, AC-08)

## Documentation et clôture
- [ ] T015 Mettre à jour les règles affichées et la référence (spec 050), `docs/specifications.md`, notes de version
- [ ] T016 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
