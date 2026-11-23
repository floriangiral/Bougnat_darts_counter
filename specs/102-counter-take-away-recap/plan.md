# Plan — 102 Partage texte du résultat X01

> Périmètre validé par le product owner le 2026-11-23, puis précisé le même jour (stats directes, envoi partenaire automatique, écran de statistiques compact). Implémenté de `0d3c0b0` à `bc0eb86`, après le tag `v2.1.0` (non publié).

1. Ajouter le formateur français du résumé X01 en réutilisant les statistiques existantes.
2. Ajouter l'adaptateur Web Share avec repli presse-papiers et gestion explicite des erreurs/annulations.
3. Supprimer l'écran de vainqueur intermédiaire : afficher directement les stats X01 après la partie, avec « Revanche », « Partager » et « Sortie ».
4. En match partenaire, ouvrir automatiquement le retour dans un nouvel onglet depuis l'action de fin, puis afficher les stats sans « Revanche » ; en cas d'échec, proposer « Réessayer » et « Prévenir l'organisation » (spec 030, révision R8).
5. Rendre l'écran de statistiques compact : bandeau de score, titre interne masqué, actions sur une rangée, messages en surimpression.
6. Couvrir le formatage, les APIs de partage, les vues de fin, la reprise et le cycle de vie par des tests ciblés.
7. Vérifier manuellement la feuille native sur Safari iOS et en PWA iOS (à faire).

## Fichiers

- `views/MatchView.tsx` : fin de match sans écran intermédiaire (`skipWinnerScreen`), appel synchrone de l'envoi partenaire.
- `views/StatsView.tsx` : bandeau de score, actions Revanche / Partager / Sortie, messages, actions de secours partenaire.
- `components/stats/StatsModal.tsx` : option `showHeader` pour l'intégration dans l'écran de fin.
- `App.tsx`, `src/app/useGameLifecycle.ts` : câblage, sauvegarde avant revanche, ouverture du retour partenaire et statut d'envoi.
- `src/shared/session/persistedAppSession.ts`, `src/app/sessionRecovery.ts` : statut d'envoi partenaire persistant et validé.
- `src/presentation/stats/` : résumé texte (`x01ShareText.fr.ts`), bandeau de score (`x01ResultHeader.fr.ts`), libellés.
- `src/infrastructure/web/` : partage natif / presse-papiers.
- `src/styles/screens/tablet-pages.css` : proportions tablette de l'écran compact.
- `tests/unit/` : tests de formatage, partage, rendu, reprise et cycle de vie.
- `specs/102-counter-take-away-recap/` : cette spec et son statut d'implémentation.
