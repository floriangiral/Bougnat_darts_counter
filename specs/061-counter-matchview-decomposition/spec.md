---
id: 061-counter-matchview-decomposition
v2_id: V2-ARCH-11
titre: Découpage de MatchView (reliquat 022)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: archi
priorite: P2
difficulte: M
recommandation: recommande
lot: 2
poids: 5
depend_de: [V2-ARCH-03]
remplace: []
remplacee_par: []
issue: '#253'
verifie_au_commit: 7b454d3
derniere_revue: 2026-11-26
---

# 061 — Découpage de MatchView (reliquat 022)

> **Statut : À VALIDER.** Cadrage actualisé le 2026-11-26 sur le code `7b454d3` ; les extractions et critères restent proposés, sans décision ni autorisation d'implémenter.

## 1. Origine et contexte

- La spec 022 est déjà `cloturee` depuis le 2026-11-23 : son reliquat `MatchView` a été transféré ici et celui de `SetupView` à 056 (`specs/022-counter-arch-single-responsibility-split/spec.md`). Il ne faut donc pas reclôturer 022.
- Le découpage historique a extrait plusieurs modèles, hooks et composants, mais les écrans ont évolué depuis l'audit du 2026-11-20. Les règles X01 uniques restent proposées en 057 ; l'unification des sessions est le reliquat de 058.
- Les specs 070 et 072 sont implémentées (validation terrain en attente) : préserver leur résolveur unique et les recettes adaptatives, sans refaire leur livraison.

## 2. Problématique

`MatchView` reste un point de convergence entre état X01, saisie, voix, robot, temporisations, reprise, transitions et présentation. `App` orchestre encore navigation, session et partenaire, tout en déléguant déjà des traitements à des modules ; `SetupView` compose et valide la préparation avec son propre reducer. Il faut isoler les responsabilités qui se gênent réellement, sans défaire les extractions existantes ni transformer un seuil de lignes en preuve de qualité.

## 3. Objectifs proposés

- O1 : clarifier et réduire les responsabilités résiduelles de `MatchView` sans modifier les règles ni les parcours.
- O2 : tester les effets et coordinations difficiles à isoler, en s'appuyant sur les tests de composants déjà présents.
- O3 : examiner seulement les orchestrations d'`App` directement couplées à la session X01 et au partenaire ; le périmètre exact reste à arbitrer.
- O4 : identifier les sources de rendu et mesurer les améliorations éventuelles, sans annoncer un gain non mesuré.
- O5 : préserver reprise, chronos, robot, voix, Triathlon et lien partenaire ; ne pas confondre état métier et état d'interface.

## 4. État actuel vérifié — 2026-11-26, commit `7b454d3`

### Responsabilités réelles

- `views/MatchView.tsx` compte **1 331 lignes** (`wc -l`). `MatchView` remonte `MatchViewSession` avec une clé d'identifiant ; la session héberge `match`, `undoStack`, le démarrage et le chrono restaurés, mais aussi saisie, prévisualisation, confirmations d'ouverture/checkout, modales, réglages et voix. Elle orchestre soumission, bust, RESTE, raccourcis, bull à la limite de volées, ordre de passage et places jouées, transitions de manche, robot et finition. `matchSubmission.ts`, `matchLifecycle.ts` et les modules `src/features/x01/scoring/` portent déjà une partie des calculs.
- `MatchView` utilise déjà `useMatchTimer`, `useMatchShortcuts`, `useViewport`, `useCounterSettings` et `useDeepgramStreaming`. `MatchInputBar`, `MatchPlayersBoard`, `MatchSettingsModal`, `PlacementPromptDialog` et `MatchFeedbackOverlay` sont extraits dans `components/match/` ; `MatchEndOverlay` et les confirmations restent dans le fichier. L'écran normal passe directement aux statistiques via `skipWinnerScreen`, tandis que le `MatchView` intégré au Triathlon utilise aussi le parcours de fin local (`App.tsx`, `views/TriathlonGameView.tsx`, `views/StatsView.tsx`).
- La voix construit une proposition pouvant préremplir la saisie ; sa validation reste explicite. La fiche de confidentialité précède l'écoute si elle n'a pas été acceptée. La vue remet à zéro proposition et session vocale lors du changement de tour ; les états audio/transcription ne figurent pas dans l'instantané (`views/MatchView.tsx`, `src/features/x01/voice/voiceProposalModel.ts`).
- `useSharedX01Session` reste un **stub no-op** : `persistSharedState` résout sans synchroniser et `ensureCurrentPlayerCanAct` retourne vrai ; les branches « WAIT »/« SYNC KO » et les props associées existent encore. Ce stub n'est pas le lien partenaire `v=1` (`src/features/x01/session/useSharedX01Session.ts`).
- `App.tsx` compte **685 lignes**. Il initialise et orchestre la restauration synchrone puis, si nécessaire, asynchrone, l'avis de session invalide, les écritures et événements de page, le contexte de viewport, l'orientation, les mises à jour et les écrans chargés paresseusement. Les traitements de validation, codec, persistance et durée sont déjà dans `src/app/sessionRecovery.ts`, `src/app/appShell.ts`, `src/features/game-session/` et `src/infrastructure/local/` ; `useGameLifecycle` gère démarrage, fins, historique local, sortie et revanche.
- `App` analyse le lien partenaire, arbitre un conflit avec une session existante, préremplit le setup, reconstruit/vérifie les URL, protège les sorties et gère le retour de résultat. Au résultat, il ouvre un nouvel onglet et conserve les états envoyé/échec et les actions de secours ; il ne reçoit pas des volées du partenaire (`App.tsx`, `src/features/external-match/`).
- `views/SetupView.tsx` compte **712 lignes**. Il utilise déjà `setupReducer`, les validateurs/helpers `src/features/game-setup/` et des sections `components/game-setup/` ; il orchestre joueurs, formats, limites, modales, lancement, mode rapide et dernier format mémorisé. Le lien partenaire préremplit et verrouille sa composition ; le format simple/doublettes est explicite (`setupModel.ts`, `src/app/x01QuickFormatController.ts`). Son reliquat est affecté à 056 par 022, pas à refaire implicitement ici.

### Sources de rendu X01 et chrono

- `useMatchTimer` met à jour son état toutes les secondes pendant la partie ; comme il est appelé dans `MatchViewSession`, cela relance le rendu de cette session et de ses sous-arbres non mémoïsés. Les chiffres saisis, propositions/transcriptions vocales, réglages, modales, feedback, compte à rebours, robot, changements de match, props et viewport sont d'autres causes possibles (`views/MatchView.tsx`, `src/features/x01/hooks/useMatchTimer.ts`, `components/game/controls/GameHeader.tsx`).
- Un tic seul **ne publie pas** l'instantané X01 : l'effet lit le chrono dans une référence et dépend du match, du démarrage, de l'annulation et du callback. `App` reçoit `setMatchRuntime` sur publication, pas à chaque seconde ; les écritures sont regroupées par `appShell.ts`. Les tests `tests/unit/session/gameReload.test.tsx` et `appSessionRecovery.test.tsx` vérifient respectivement l'absence de publication et d'écriture sur un tic seul.
- Dans Triathlon, le chrono du parent et celui de l'épreuve X01 sont distincts : le rendu du parent peut aussi entraîner celui du `MatchView` embarqué (`views/TriathlonGameView.tsx`). Un rendu React ne prouve pas une mutation du DOM ni une dégradation perceptible : aucune mesure de fréquence, durée ou INP n'est fournie ici.
- L'effet du robot planifie une action après **700 ms** et un aperçu de victoire de **2 s** ; il dépend notamment de `elapsedSeconds`. `persistSharedState`, autre dépendance, est recréée par le stub à chaque rendu ; d'autres callbacks dépendent de props qui peuvent également changer. Le nettoyage annule le délai précédent : retirer uniquement `elapsedSeconds` ne suffit donc pas à garantir une planification stable. Vérifier annulation, absence de report indéfini et une seule action par tour avant toute optimisation.
- Le compte à rebours de manche dure **3 s**, avec nettoyage des délais/intervalles à la destruction. La restauration réinitialise notamment transition et aperçu du robot ; ils ne sont pas eux-mêmes persistés (`views/MatchView.tsx`).

### Tests et couverture

- Des tests montent **déjà** `MatchView` : `tests/unit/x01/matchViewArena.test.tsx`, `matchViewCheckoutRules.test.tsx`, `matchViewDoublesRotation.test.tsx`, `matchViewOpening.test.tsx`, `matchViewOrderAndPlacements.test.tsx`, `matchViewSettings.test.tsx` et `matchViewVoicePrivacy.test.tsx`. Ils couvrent notamment saisie/annulation, rotation, reprise, checkout, bull, ordre/places, réglages et confidentialité ; `x01BotTurn.test.ts` teste le calcul du robot avec aléa injectable.
- `tests/unit/session/gameReload.test.tsx` couvre les reprises X01 et Triathlon ; `appSessionRecovery.test.tsx` et `externalLinkRecovery.test.tsx` rendent `App` ; `tests/unit/components/setupViewExternalMatch.test.tsx` et `setupViewQuickFormat.test.tsx` rendent `SetupView`. Le contrat partenaire a des golden tests dans `tests/unit/externalMatch/externalMatchContract.golden.test.ts`.
- `sonar-project.properties` exclut actuellement `App.tsx`, `SetupView.tsx` et six vues de jeu, dont `MatchView.tsx`, de la couverture Sonar ; `Atc180GameView.tsx` n'est pas dans cette liste. Être exclu n'implique pas l'absence de tests. Leur retrait éventuel relève de la gouvernance 029 et d'une PR dédiée, pas d'une modification automatique de politique.

## 5. Comportement cible proposé

Conserver une vue qui assemble les éléments existants et déléguer, si cela réduit un couplage démontré, les effets de transition, de robot et de voix à des fonctions ou hooks testables. Garder les transitions métier X01 dans la solution retenue en 057 et les contrats de session coordonnés avec 058 ; ne pas imposer à ce stade des noms de hooks ou une réécriture. Pour `App`, extraire uniquement les coordinations dont le bénéfice et les frontières sont établis.

## 6. Périmètre résiduel proposé

### Inclus, sous réserve d'arbitrage

- Caractériser puis isoler les temporisations robot/manche, l'orchestration voix/saisie et les parties de présentation encore imbriquées si nécessaire.
- Examiner l'orchestration session/partenaire d'`App` en réutilisant `appShell`, `sessionRecovery`, `useGameLifecycle` et les modules de lien existants ; le choix d'une table de rendu ou d'un hook supplémentaire n'est pas arrêté.
- Mesurer les rendus X01 et Triathlon avant/après, puis ne traiter que les causes retenues ; préserver l'absence d'écriture sur les tics.
- Ajouter des tests ciblés sur les frontières et effets réellement déplacés, sans remplacer ni affaiblir les tests existants.

### Exclu

- Définir de nouvelles règles ou commandes X01 (057), unifier tous les états/annulations (058), refaire la reprise livrée (010), ou modifier le contrat partenaire.
- Redévelopper les specs 070/072, déjà implémentées ; enlever le stub est coordonné avec 056 et non réputé acquis.
- Découper `SetupView` au-delà des points de contact nécessaires aux tests : son reliquat est transféré à 056. Découper `useDeepgramStreaming` ou introduire un port vocal reste une question distincte (Q2).
- Toute modification de configuration Sonar/CI sans PR dédiée et revue du mainteneur.

## 7. User stories

- En tant que contributeur, je peux faire évoluer le robot ou la voix sans modifier la logique de session ou les autres entrées.
- En tant que joueur, je retrouve le même match après reprise, y compris dans un Triathlon ou depuis un lien partenaire.

## 8. Règles métier

Aucune règle de score ne change ici. Les choix de 057, les règles livrées d'ouverture/sortie, rotation, limite de volées et places, ainsi que les décisions de reprise de 010, restent les références.

## 9. Parcours utilisateurs

Préserver X01 simple et doublettes, 3/4 joueurs et places, robot, voix, préparation rapide ou personnalisée, match partenaire et Triathlon embarqué, y compris le départage 501.

## 10. Exigences fonctionnelles proposées

- FR-01 : distinguer les transitions métier, l'état restaurable et les états éphémères de présentation ; réutiliser les interfaces existantes jusqu'aux choix de 057/058.
- FR-02 : tout découpage vocal préserve consentement avant micro/jeton, proposition, confirmation tactile, arrêt/nettoyage et changement de joueur.
- FR-03 : toute extraction du robot préserve le délai et l'aperçu actuels ; des rerendus et tics ne provoquent ni plusieurs tours ni report indéfini, et les temporisations sont annulées au changement de contexte/démontage.
- FR-04 : préserver compte à rebours de manche et nettoyage ; caractériser une reprise pendant la transition au lieu de supposer qu'elle est persistée.
- FR-05 : continuer à lire le viewport par `useViewport` et préserver les recettes 070/072 ; `MatchView` n'a déjà plus de `window.matchMedia` local.
- FR-06 : si le stub partagé est traité, coordonner 056, ses tests et ses props ; ne pas supprimer ou modifier le lien partenaire local, indépendant du stub.
- FR-07 : conserver l'ordonnancement de restauration/écriture d'`App`, la gestion des conflits et du retour partenaire, y compris l'ouverture synchrone du nouvel onglet depuis l'action de fin lorsqu'elle existe et les possibilités de secours.
- FR-08 : préserver les appels de fin et les snapshots du `MatchView` embarqué dans les deux phases X01 du Triathlon, et éviter un résultat en double après reprise.

## 11. Exigences non fonctionnelles proposées

- NFR-01 : aucune nouvelle dépendance runtime, aucun backend et aucun changement visuel ou de règle non arbitré.
- NFR-02 : mesures reproductibles des rendus et, si pertinent, de l'INP ; distinguer fréquence de rendu, mutations DOM et écritures de stockage.
- NFR-03 : tests unitaires/composants des responsabilités déplacées ; respecter 029 sans conclure que la suppression d'une exclusion Sonar est automatiquement nécessaire.

## 12. Cas nominaux et alternatifs

Partie au clavier avec bust et checkout ; robot pendant que le chrono avance ; voix acceptée puis proposition confirmée ; résultat partenaire envoyé ou en échec ; 501 puis départage dans un Triathlon.

## 13. Cas limites

Rerendus répétés pendant le délai robot ; démontage ou reprise en transition ; validation vocale et changement de joueur ; reprise sur ordre ou places ; limite de volées et bull ; lien entrant alors qu'une session est restaurée depuis IndexedDB ; retour partenaire bloqué ; reprise d'un résultat déjà signalé.

## 14. Gestion des erreurs

Préserver les messages non bloquants de session et de voix, le repli manuel et les actions de retour partenaire. Ne pas exposer de transcription ou d'audio dans la session ; ne pas considérer le stub no-op comme une synchronisation réelle.

## 15. Impacts architecturaux envisagés

Déplacements ciblés vers les features X01 et les composants de présentation existants, sans nouvelle couche imposée. L'orchestration d'`App` peut être clarifiée par des modules testés ; les choix précis dépendent de Q4 et des interfaces 057/058/056.

## 16. Impacts sur les données et les interfaces

Le format persisté ne doit pas changer par accident. Préserver `initialMatch`, `restoredState`, `onStateChange`, `onFinish`, `onFinishWithState`, `onRematch`, `externalResultReturn`, `onExit`, `skipStartingPlayerPrompt` et `skipWinnerScreen`, ou fournir une migration/adaptation explicite pour `App` et Triathlon. Le sort de `sharedSessionId`/`currentUserId` est coordonné avec 056 ; ils ne sont pas des paramètres du lien partenaire.

## 17. Compatibilité avec l'existant

Préserver schéma et codec de 010, dernière action enregistrée et piles d'annulation, chrono sans période application fermée, sécurité du lien partenaire `v=1`, résultat et classement, confidentialité vocale, préférence de préparation rapide, orientations et recettes. Toute évolution observable ou du format demande une décision et des tests dédiés.

## 18. Dépendances et séquencement

- **057 / V2-ARCH-03** est la dépendance déclarée et reste `a-valider` : elle porte les commandes/règles X01 ; ne pas créer un moteur parallèle dans 061.
- **058 / V2-ARCH-04** reste `a-valider` : coordonner son étape X01 et les contrats d'état avec le découpage. Elle n'est pas déclarée prérequis global de 061 ; décider l'ordre des travaux communs sans bloquer les autres jeux de 058.
- **010** est implémentée, validation terrain en attente ; préserver l'existant, ne pas attendre une future implémentation de la reprise. **070/072** sont implémentées, validation terrain en attente ; ne pas les planifier comme travaux à refaire.
- **056** reste `a-valider` et porte notamment le sort du stub et le reliquat Setup transféré par 022. **039** reste `a-valider` : compléter la caractérisation utile sans prétendre que ses fixtures couvrent déjà tous les jeux.
- La spec **022 est déjà clôturée** avec transfert vers 061 et 056 ; aucune clôture supplémentaire n'est un préalable ou un livrable.

## 19. Critères d'acceptation proposés

- AC-01 : les responsabilités extraites et les limites entre état métier, interface et effets sont documentées et testées ; des seuils éventuels de lignes ou de rendu sont définis après Q1/Q5, pas imposés sans mesure.
- AC-02 : les tests existants de `MatchView` restent verts et des cas ciblés protègent au besoin clavier, bust, confirmations, rotation, places et reprise ; ne pas refaire un test de composant au motif erroné qu'aucun n'existe.
- AC-03 : avec horloges simulées, un tour robot éligible s'exécute une seule fois malgré les tics/rerendus ; changement de joueur ou démontage annule le délai approprié, sans report indéfini.
- AC-04 : les essais couvrent consentement et proposition vocale, deux phases X01 de Triathlon, sessions restaurées, conflit de lien, fin partenaire réussie/échouée et absence de doublon.
- AC-05 : un tic seul n'émet ni snapshot ni écriture de session ; si une optimisation de rendu est retenue, comparer les mesures avant/après sur X01 et Triathlon.
- AC-06 : conserver l'absence de `window.matchMedia` dans `MatchView` et les tests de recettes adaptatives ; les E2E/smoke X01, partenaire et Triathlon sont exécutés uniquement en CI.
- AC-07 : tout changement de contrat persisté ou de props est accompagné des adaptateurs, validateurs et tests de compatibilité appropriés ; aucune modification d'exclusion Sonar implicite.

## 20. Scénarios de tests

Réutiliser les suites du §4 ; compléter par tests de temporisation avec rerendus, nettoyage, horloges et aléa simulés, voix simulée et restauration sur frontières de phase. Rejouer les suites E2E/smoke concernées **en CI seulement** ; ne pas lancer de serveur ou navigateur en local pour cette recette.

## 21. Exigences de non-régression

Tests `tests/unit/x01/`, `tests/unit/session/`, `tests/unit/components/setupViewExternalMatch.test.tsx`, `setupViewQuickFormat.test.tsx`, `triathlonPresentation.test.tsx` et `tests/unit/externalMatch/`. Conserver le parcours d'ouverture simple et le lien partenaire verrouillé.

## 22. Risques

| Risque | Impact | Mitigation proposée |
|---|---|---|
| Robot replanifié par des dépendances instables ou des tics | Tours retardés ou dupliqués | Caractériser les identités de dépendances, tester rerendus répétés et nettoyage |
| Perte de la dernière action ou désynchronisation chrono/snapshot | Reprise incorrecte | Conserver codec et horodatages ; tests 010 et Triathlon à chaque frontière |
| Perte du geste utilisateur ouvrant le retour partenaire | Nouvel onglet bloqué ou résultat non transmis | Test des parcours réussi/échec/reprise ; garder validation des URL et actions de secours |
| Découpe simultanée de 057/058/061 | Trois sources de vérité | Contrats et ordre de migration coordonnés, sans imposer la migration de tous les jeux |
| Réduction cosmétique des lignes ou « optimisation » non mesurée | Complexité déplacée | Responsabilités et tests prioritaires ; profils comparables avant/après si Q5 le retient |

## 23. Décisions architecturales

ADR-0002 (commandes X01), 0001 (état par jeu) et 0008 (port vocal) sont proposées, pas acceptées par cette mise à jour. ADR-0007 est acceptée et ses implémentations 070/072 existent déjà.

## 24. Questions ouvertes au product owner

| # | Question | Options / recommandation non validée | Décision |
|---|---|---|---|
| Q1 | Objectifs de taille des fichiers ? | Seuils fixes / cibles indicatives / aucun seuil ; préférer des frontières et tests utiles aux seuls nombres | — |
| Q2 | Découper `useDeepgramStreaming` ? | Maintenant / seulement si un second moteur ou un besoin démontré le justifie ; coordonner 075/ADR-0008 | — |
| Q4 | Quelle portée pour le découpage d'`App` ? | Session et partenaire liés à X01 / chantier shell distinct ; réutiliser les extractions déjà faites | — |
| Q5 | Faut-il fixer un objectif de réduction des rendus ou seulement mesurer ? | Mesure puis budget ciblé / simple non-régression ; comparer X01 seul et dans Triathlon | — |
| Q6 | Comment coordonner 058 et 061 une fois 057 livrée ? | Étape X01 de 058 d'abord / 061 d'abord / étapes coordonnées en parallèle ; les autres jeux de 058 peuvent avancer indépendamment de 057 | — |

Q3 historique (« clôturer 022 ? ») n'est plus ouverte : 022 est déjà clôturée et ses reliquats sont transférés ; cela ne valide pas 061.

## 25. Traçabilité

- Audit historique : `docs/v2/audit/02-architecture.md` §2.3, T4, CA-7 ; `docs/v2/audit/01-specs-backlog.md` (022) ; compte rendu B.2/B.3. Les nombres et constats de 2026-11-20 sont remplacés par §4.
- Specs liées : 010, 020, 022, 029, 039, 056, 057, 058, 070, 072, 075, 076, 086, 129, 132, 133.
- Vérification documentaire du code au commit `7b454d3`, le 2026-11-26 ; aucune implémentation de 061 n'est déclarée.
