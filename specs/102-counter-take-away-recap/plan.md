# Plan — 102 Partage texte du résultat X01

> Plan historique V2-SHARE-01, issue #273 ; pour l'évolution en cours, voir la Révision V2 ci-dessous.

> Périmètre validé par le product owner le 2026-11-23, puis précisé le même jour (stats directes, envoi partenaire automatique, écran de statistiques compact). Implémenté de `0d3c0b0` à `bc0eb86`, puis intégré au tag `v2.1.0` déplacé le 2026-11-24 sur `a84ce14`.

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

## Révision V2 — V2-SHARE-02, issue #362

Révision validée puis en cours d'implémentation ; validation terrain en attente.

### Étapes et fichiers pressentis

1. Construire un modèle de récapitulatif à partir du `MatchState` terminé, en réutilisant les présentateurs de classement, résultat et statistiques de `src/presentation/stats/` et les calculs de `src/application/scoring/matchStats.ts`. Représenter les deux onglets et leurs détails, toutes les places et tous les camps. Vérifier les cas solo, sets, robot, départage au bull et places jouées.
2. Pour les doublettes, séparer explicitement données d'équipe et données individuelles par `playerId`. Adapter les calculs nécessaires : le meilleur checkout existant est filtré par équipe, donc ne suffit pas pour attribuer une finition individuelle ; les statistiques de manches gagnantes sont exclusivement d'équipe. Conserver les conventions de calcul affichées, sans attribuer au joueur les volées de son partenaire.
3. Créer une présentation PNG portrait locale adaptative et lisible, avec rendu complet des noms et mesures, logo local et QR local de destination fixe officielle `https://play.bougnatdarts.fr`, même en préproduction. `public/app-qr.svg` dépend de `VITE_APP_URL` lors de sa génération : ne pas supposer que cet actif encode toujours l'URL exigée ; prévoir un actif local vérifié ou une génération au build avec l'outillage existant, sans dépendance runtime supplémentaire. L'aperçu utilise une source compatible avec la CSP actuelle (par exemple `data:`), sans autoriser `blob:` dans `img-src` ni affaiblir la politique. Maîtriser les limites de dimensions/mémoire et signaler un échec plutôt que tronquer.
4. Ajouter dans `views/StatsView.tsx` l'aperçu accessible et ses actions de partage de fichier compatible, enregistrement, copie et partage texte ; isoler les accès aux API web dans `src/infrastructure/web/`. Conserver `src/presentation/stats/x01ShareText.fr.ts`, la feuille native texte et son repli, ainsi que le parcours texte partenaire. Tester les possibilités effectives de partage de fichier, les erreurs, les annulations et les retours à l'écran.
5. Suspendre le délai d'expiration tant que l'aperçu ou la feuille native est ouvert ; conserver l'absence d'expiration des matchs partenaires et leur retour, leurs actions et leur statut après restauration. Vérifier `App.tsx`, `src/app/useGameLifecycle.ts`, `src/app/sessionRecovery.ts` et les tests associés ; ne modifier le schéma de session que si nécessaire, avec son validateur et sa migration.
6. Ajouter les tests unitaires ciblés de modèle, rendu, QR, erreurs, interface et sessions dans `tests/unit/` ; préparer les scénarios E2E/smoke pour la CI uniquement. Exécuter localement les contrôles adaptés autorisés (typecheck, lint, unitaires, build), jamais E2E/smoke ni serveur local pour ceux-ci.
7. Après implémentation, actualiser la documentation produit concernée, les notes de release et le changelog in-app, sans anticiper la livraison ; renseigner le commit de vérification et le statut selon les conventions. Réaliser séparément la recette physique Safari iOS, PWA iOS et Android, dont le scan après compression par une application de partage.

### Migration et retour arrière

Aucune migration de données n'est prévue : le PNG est dérivé à la demande du match local. Si un état persistant s'avère nécessaire, versionner et valider sa migration sans perdre les sessions ou le statut partenaire. Un retour arrière retire l'aperçu et le partage PNG et rétablit l'action de partage texte existante, sans changer les résultats enregistrés ni le contrat partenaire.
