# Tâches — 080 Voix — confidentialité (UE, mip_opt_out, information)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que le texte de la fiche est approuvé par le PO et que Q1-Q4 sont tranchées

## Implémentation
- [ ] T001 [lot 0] Ajouter `mip_opt_out` à la configuration d'écoute (AC-03)
- [ ] T002 [lot 0] Test « aucun prénom dans la configuration d'écoute » (AC-05)
- [ ] T003 Composant de fiche, mémorisation versionnée, garde avant `getUserMedia` (AC-01, AC-02)
- [ ] T004 Lien « En savoir plus » dans les réglages du match
- [ ] T005 Vérifier en preview la compatibilité jeton/endpoint UE et l'impact tarifaire
- [ ] T006 (si Q1 = UE) Environnement SDK UE, CSP, route locale et route de jeton (AC-04)

## Tests
- [ ] T007 Tests composants de la fiche (acceptation, refus, nouvelle version)
- [ ] T008 E2E simulé : refus → aucun appel au jeton (AC-02)

## Documentation et clôture
- [ ] T009 `README.md`, `SECURITY.md`, page « Voix et confidentialité » (AC-06)
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
