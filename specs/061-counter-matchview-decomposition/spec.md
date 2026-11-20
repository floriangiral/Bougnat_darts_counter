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
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 061 — Découpage de MatchView (reliquat 022)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Backlog existant : la spec 022 (découpage par responsabilité unique) revendiquait `App.tsx` à 347 lignes et `MatchView.tsx` à 848 ; la réalité au commit `508dfa6` est 479 et 869 lignes (rapport backlog, ligne 022). Le traitement proposé est de clôturer 022 en distribuant son reliquat ici (compte rendu B.2).
- Audit V2 : rapport architecture §2.3, T4, CA-7 ; constitution locale règle 2 (« les vues ne doivent pas concentrer durablement orchestration, persistance et domaine »).
- `MatchView` est sur le chemin de trois chantiers V2 : voix mains libres (spec 076), disposition arène (spec 072), TV X01 (spec 086).

## 2. Problématique
`MatchView` cumule une dizaine de responsabilités (règles, annulation, robot, transitions, voix, détection d'appareil, chrono, persistance, rendu de modales) et `App.tsx` mélange navigation, restauration, persistance et lien partenaire ; toute évolution V2 sur ces fichiers est risquée et non testée (vues exclues de la couverture).

## 3. Objectifs
- O1 : `MatchView` réduit à la composition (cible indicative ≤ 350 lignes, Q1).
- O2 : chaque responsabilité extraite est testable unitairement (hook ou fonction pure).
- O3 : `App.tsx` réduit à la composition d'écrans (cible indicative ≤ 250 lignes).
- O4 : aucun changement de comportement visible.

## 4. État actuel vérifié dans le code
- [vérifié] `views/MatchView.tsx` : 869 lignes, 18 `useState` + `useMatchTimer`, 6 `useRef`, 7 `useEffect`.
- [vérifié] Responsabilités observées :
  - hydratation et réinitialisation (`views/MatchView.tsx:133-165`) ;
  - glue voix ↔ tampon de saisie (`187-209`, `509-527`, `534-543`) ;
  - remontée d'état au shell à chaque seconde (`211-217`) ;
  - détection « navigateur mobile compact » par `matchMedia` (`246-266`), en doublon avec `src/features/tablet/tabletLayout.ts` ;
  - stub de session partagée et retours « WAIT » / « SYNC KO » (`273-295`) ;
  - pile d'annulation (`297-345`) ;
  - soumission, RESTE, raccourci et confirmation de checkout (`347-500`) ;
  - compte à rebours de transition de manche (`437-472`) ;
  - tour du robot et aperçu de victoire (`552-646`) ;
  - rendu, modales et écran de victoire (`648-869`).
- [vérifié] `App.tsx` : 479 lignes, 20 `useState`, 7 `useEffect` dont un effet de persistance à 13 dépendances (`App.tsx:170-199`) ; restauration (`138-168`) ; orchestration du lien partenaire (spec 030).
- [vérifié] `MatchView.tsx`, `App.tsx` et les vues de jeu sont exclues de la couverture (`sonar-project.properties:9`) ; aucun test ne rend `MatchView`.
- [vérifié] Extractions déjà faites par la spec 022 : `useMatchTimer`, `useMatchShortcuts`, `matchSubmission`, `matchPreview`, `botVictoryPreview`, `matchPresentation`.

## 5. Comportement cible
`MatchView` assemble : l'état et les commandes X01 (spec 057, puis `useGameSession` de la spec 058), un hook `useX01VoiceAssist` (voix ↔ proposition ↔ commande), un hook `useX01BotTurn` (planification du robot), un hook `useLegTransition` (compte à rebours), la classe de taille fournie par le résolveur unique (spec 070) et des composants de présentation (zone joueurs, contrôle, modales, victoire). `App.tsx` délègue la restauration et la persistance à un hook de session (spec 010) et l'orchestration partenaire à un hook dédié.

## 6. Périmètre
### Inclus
- Extraction des hooks et composants listés en §5 ; suppression de la détection `matchMedia` locale au profit de la spec 070.
- Découpage d'`App.tsx` : hook de restauration/persistance, hook « lien partenaire », table de rendu des écrans.
- Tests de composant de `MatchView` et retrait de `MatchView.tsx` des exclusions de couverture.
### Exclu
- Unification des règles (spec 057) et extraction de l'état (spec 058) : prérequis, non refaits ici.
- `useDeepgramStreaming.ts` (650 lignes) : découpe seulement si un second moteur vocal est retenu (ADR-0008, spec 075) ; sinon ne pas y toucher.
- Découpe des autres vues de jeu (traitée par la migration de la spec 058).
- Modifications visuelles (specs 065, 072).

## 7. User stories
- En tant que contributeur, je veux modifier la voix sans relire la gestion du robot ni du chrono.
- En tant que mainteneur, je veux un test de composant qui protège le parcours X01 avant les refontes visuelles V2.

## 8. Règles métier
Sans objet : aucune règle de jeu n'est modifiée ; elles sont portées par la spec 057.

## 9. Parcours utilisateurs
Inchangés (X01 simple, doublettes, robot, voix, lien partenaire, Triathlon embarquant `MatchView`).

## 10. Exigences fonctionnelles
- FR-01 : `MatchView` ne contient plus de règle X01 ni de gestion de minuterie hors hooks dédiés.
- FR-02 : `useX01VoiceAssist` encapsule `useDeepgramStreaming`, la proposition vocale et la conversion en commande (spec 057).
- FR-03 : `useX01BotTurn` planifie le tour du robot (délai 700 ms, `views/MatchView.tsx:582-624`) et l'aperçu de victoire (2 s) ; il ne se replanifie pas à chaque tic du chrono (dépendance `elapsedSeconds` actuelle, `views/MatchView.tsx:632-646`).
- FR-04 : `useLegTransition` gère le compte à rebours de 3 s et son nettoyage.
- FR-05 : la classe de taille provient du résolveur de la spec 070 ; la détection locale (`246-266`) est supprimée.
- FR-06 : les retours « WAIT » et « SYNC KO » disparaissent avec le stub (spec 056).
- FR-07 : `App.tsx` délègue restauration/persistance et lien partenaire à des hooks testés ; le rendu des écrans est une table.
- FR-08 : `MatchView.tsx` et `App.tsx` sortent de `sonar.coverage.exclusions` (coordination spec 029).

## 11. Exigences non fonctionnelles
- NFR-01 : aucune nouvelle dépendance ; coût récurrent 0 €.
- NFR-02 : pas de dégradation INP (spec 020) ; réduction attendue des rendus liés au chrono [à mesurer].
- NFR-03 : chaque hook extrait a des tests unitaires (Testing Library déjà présente).

## 12. Cas nominaux et alternatifs
- Nominal : partie X01 complète au keypad, identique.
- Alternatif : partie contre le robot, transition de manche, victoire du robot.
- Alternatif : X01 embarqué dans Triathlon (`views/TriathlonGameView.tsx:302-320`).

## 13. Cas limites
Démontage pendant un tour de robot ou une transition (minuteries nettoyées) ; restauration en pleine transition ; voix active au changement de joueur.

## 14. Gestion des erreurs
Comportement actuel conservé (retours visuels, voix en échec signalée par `VoiceScoringControl`).

## 15. Impacts architecturaux
Hooks dans `src/features/x01/hooks/` ; composants dans `components/match/` ; aucune nouvelle couche ; respect des frontières de la spec 056.

## 16. Impacts sur les données et les interfaces
Aucun : props publiques de `MatchView` (`initialMatch`, `restoredState`, `onStateChange`, `onFinish`, `onFinishWithState`, `onExit`, `skipStartingPlayerPrompt`) conservées sauf suppression des props mortes `sharedSessionId`/`currentUserId`.

## 17. Compatibilité avec l'existant
Comportement identique ; sessions persistées inchangées.

## 18. Dépendances
- Prérequis : V2-ARCH-03 (057).
- Fortement recommandé avant : V2-ARCH-04 (058, étape X01), V2-TAB-01 (070), V2-ARCH-01 (056, suppression du stub).
- À faire avant : V2-TAB-03 (072), V2-VOICE-05 (076), V2-TV-06 (086).
- Clôt le reliquat de la spec 022.

## 19. Critères d'acceptation
- AC-01 : `views/MatchView.tsx` ≤ 350 lignes et `App.tsx` ≤ 250 lignes (`wc -l`, seuils selon Q1).
- AC-02 : un test de composant rend `MatchView` et joue une manche 101 complète (keypad, bust, checkout confirmé) en vert.
- AC-03 : test unitaire de `useX01BotTurn` : un seul tour planifié par tour du robot, même si le chrono avance.
- AC-04 : `MatchView.tsx` et `App.tsx` absents de `sonar.coverage.exclusions`, seuils de la spec 029 respectés.
- AC-05 : E2E smoke X01, partenaire (`external-match-link.smoke.spec.ts`) et Triathlon inchangés.
- AC-06 : aucun `window.matchMedia` dans `views/MatchView.tsx` (grep).

## 20. Scénarios de tests
Unitaires des hooks extraits ; composant `MatchView` (keypad, voix simulée, robot avec `random` et minuteries simulées) ; E2E existants.

## 21. Exigences de non-régression
Golden tests X01 (039), `tests/unit/x01/*`, E2E X01, partenaire, tablette, smartphone.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Régression subtile (minuteries, robot) | Moyen | Moyenne | Tests de composant avant extraction |
| Conflits avec 057/058/070 | Moyen | Élevée | Séquencer après 057 et 070, PR courtes |
| Découpage cosmétique sans gain | Faible | Moyenne | Objectifs mesurables AC-01 à AC-04 |

## 23. Décisions architecturales
- ADR-0002 (commandes X01) et ADR-0001 (état hors vue) : prérequis.
- ADR-0007 (classes de taille) : suppression de la détection locale.
- ADR-0008 (port vocal) : conditionne toute découpe de `useDeepgramStreaming`.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Seuils de taille | Seuils fixes / aucune cible chiffrée | Cibles indicatives (350 / 250) vérifiées à la clôture, sans bloquer la CI | — |
| Q2 | Découper `useDeepgramStreaming` | Oui / seulement si 2ᵉ moteur | Seulement si 2ᵉ moteur (ADR-0008) | — |
| Q3 | Statut de la spec 022 | Clôturer en renvoyant ici / garder ouverte | Clôturer après validation de cette spec | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` §2.3, T4, CA-7 ; `reports/01-specs-backlog.md` (ligne 022) ; compte rendu B.2, B.3.
- Specs liées : 020, 022, 029, 056, 057, 058, 070, 072, 075, 076, 086.
- Code vérifié au commit `508dfa6`.
