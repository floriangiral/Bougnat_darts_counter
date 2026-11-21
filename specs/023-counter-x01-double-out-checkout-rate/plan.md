1. Formaliser la nouvelle definition du checkout rate Double Out
2. Ecrire des tests unitaires qui couvrent finish, bust et placement volontaire
3. Adapter `matchStats` pour compter des tentatives reelles a partir de l historique
4. Verifier la compatibilite du presenter et relancer le typecheck

## Révision V2 — plan proposé

> À exécuter uniquement après validation de la révision V2 (V2-GAMES-11) et livraison de la spec 045.

1. Arbitrer Q1-Q3.
2. `src/application/scoring/matchStats.ts:63-80` : `isCheckoutOpportunity` délègue à la fonction de finissabilité de la spec 045 (Open/Double/Master).
3. Libellé et infobulle : `src/presentation/stats/statsLabels.fr.ts:15`, `components/stats/StatsModal.tsx:115-125`, `views/StatsView.tsx`.
4. Tests : nouveaux cas Open/Master dans `tests/unit/application/matchStats.test.ts` ; test de composant de l'infobulle.
5. Migration : aucune (statistiques recalculées à l'affichage depuis l'historique du match).
6. Rollback : revert.
7. Documentation : définition dans la référence des règles (spec 050) et dans cette spec.
