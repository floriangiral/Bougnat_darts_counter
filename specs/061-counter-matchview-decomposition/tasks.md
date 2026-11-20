# Tâches — 061 Découpage de MatchView (reliquat 022)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que la spec 057 est livrée et que les specs 058 (étape X01) et 070 sont livrées ou planifiées

## Implémentation
- [ ] T001 Écrire le test de composant `MatchView` (manche 101 complète, robot, voix simulée) (AC-02)
- [ ] T002 Extraire `useLegTransition` (AC-01)
- [ ] T003 Extraire `useX01BotTurn` sans dépendance au chrono (AC-03)
- [ ] T004 Extraire `useX01VoiceAssist` (AC-01)
- [ ] T005 Remplacer la détection `matchMedia` par le résolveur de la spec 070 (AC-06)
- [ ] T006 Extraire écran de victoire et modales en composants (AC-01)
- [ ] T007 Découper `App.tsx` : hook de session, hook partenaire, table de rendu (AC-01)
- [ ] T008 Retirer `MatchView.tsx` et `App.tsx` des exclusions de couverture (AC-04)

## Tests
- [ ] T009 Tests unitaires des hooks extraits (AC-03)
- [ ] T010 Rejouer les E2E X01, partenaire, Triathlon, tablette, smartphone (AC-05)

## Documentation et clôture
- [ ] T011 Mettre à jour `docs/architecture.md` et clôturer la spec 022
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
