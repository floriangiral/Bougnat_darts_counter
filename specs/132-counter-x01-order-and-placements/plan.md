# Plan

1. Moteur (`src/application/scoring/matchLifecycle.ts`, `x01Rotation.ts`) : `resolveMatchOrder` (ordre validé avant toute volée), départ des sets à 3 ou 4 camps par la règle de la manche suivante, état optionnel `MatchState.placement` (`finishedTeamIds`), `canPlayForNextPlace`, `startPlacementRound` et volées de place qui sautent les camps classés.
2. Statistiques (`matchStats.ts`) : le checkout réussi est la volée qui amène le camp à 0, et non plus la dernière volée de la manche.
3. Classement (`x01Ranking.ts`, présentateur, texte partagé) : places jouées d'abord, puis le calcul de la spec 052.
4. Présentation : `ThrowOrderOverlay` (ordre obligatoire), numéro d'ordre sur les cartes, fenêtre de place dans `MatchView` avant l'écran de fin et le retour partenaire.
5. Session : validation de `placement`, clonage dans les instantanés d'annulation.
6. Lien partenaire : `p3`/`p4` optionnels et paramètres de retour additifs (`legsN`, `setsN`, `avgN`, `n180_N`, `hcoN`, `rankN`, `places`).
7. Documentation, notes de version, changelog, tests unitaires.

Retour arrière : annuler les changements de cette spec ; les parties sauvegardées sans `placement` restent valides dans les deux sens (le champ est optionnel).
