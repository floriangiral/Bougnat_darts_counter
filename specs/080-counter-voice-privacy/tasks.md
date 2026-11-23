# Tâches — 080 Voix — confidentialité (UE, mip_opt_out, information)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée, que le texte de la fiche est approuvé par le PO et que Q1-Q4 sont tranchées

## Implémentation
- [x] T001 [lot 0] Ajouter `mip_opt_out` à la configuration d'écoute (AC-03)
- [x] T002 [lot 0] Test « aucun prénom dans la configuration d'écoute » (AC-05)
- [x] T003 Composant de fiche, mémorisation versionnée, garde avant `getUserMedia` (AC-01, AC-02)
- [x] T004 Lien « En savoir plus » dans les réglages du match
- [ ] T005 Vérifier en preview la compatibilité jeton/endpoint UE et l'impact tarifaire — *ouverte : nécessite une clé Deepgram et une préversion (impossible dans l'environnement d'implémentation du 2026-11-23) ; préparation documentée dans `docs/voix-et-confidentialite.md`*
- [ ] T006 (si Q1 = UE) Environnement SDK UE, CSP, route locale et route de jeton (AC-04) — *ouverte : dépend de T005 ; région US conservée d'ici là (décision PO Q1)*

## Tests
- [x] T007 Tests composants de la fiche (acceptation, refus, nouvelle version)
- [x] T008 E2E simulé : refus → aucun appel au jeton (AC-02)

## Documentation et clôture
- [x] T009 `README.md`, `SECURITY.md`, page « Voix et confidentialité » (AC-06)
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — *spec `en-cours` (`verifie_au_commit` : `013e775`) tant que T005/T006 restent ouvertes ; issue #208 non fermée*
