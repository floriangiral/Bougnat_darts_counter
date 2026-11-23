# Plan — 102 Partage texte du résultat X01

> Périmètre validé par le product owner le 2026-11-23.

1. Ajouter le formateur français du résumé X01 en réutilisant les statistiques existantes.
2. Ajouter l'adaptateur Web Share avec repli presse-papiers et gestion explicite des erreurs/annulations.
3. Afficher directement les stats X01 classiques après la partie, avec « Revanche », « Partager » et « Sortie ».
4. Conserver l'écran de vainqueur partenaire avec son unique action d'envoi ; ouvrir le retour partenaire dans un nouvel onglet puis les stats dans le compteur.
5. Couvrir le formatage, les APIs de partage, les vues de fin et le cycle de vie par des tests ciblés.
6. Vérifier manuellement la feuille native sur Safari iOS et en PWA iOS.

## Fichiers

- `views/MatchView.tsx` : action Revanche sur l'écran vainqueur.
- `views/StatsView.tsx` : action Partager et état de confirmation.
- `App.tsx`, `src/app/useGameLifecycle.ts` : câblage et sauvegarde avant revanche.
- `src/presentation/stats/` : résumé texte.
- `src/infrastructure/web/` : partage natif / presse-papiers.
- `tests/unit/` : tests de formatage, partage, rendu et cycle de vie.
- `specs/102-counter-take-away-recap/` : cette spec et son statut d'implémentation.
