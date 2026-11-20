---
id: 060-counter-game-registry
v2_id: V2-ARCH-09
titre: Registre de jeux
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P3
difficulte: M
recommandation: optionnel
lot: 5
poids: 3
depend_de: [V2-ARCH-04]
remplace: []
remplacee_par: []
issue: '#298'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 060 — Registre de jeux

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Audit V2 : rapport architecture §7 (T6), CA-6, ADR provisoire « registre de jeux (conditionnel) » ; compte rendu C.9 (« registre de jeux seulement si nouveaux jeux ») et F.2.
- Cette spec est **conditionnelle** : elle n'a de valeur que si de nouveaux jeux ou modes sont validés (ex. V2-GAMES-24 « Défi du comptoir », spec 104 ; V2-TRAIN-01 « atelier finitions », spec 103) ou si la TV multi-jeux (spec 089) multiplie les points d'aiguillage.
- ADR-0001 reporte explicitement le moteur générique (option 3) à cette spec.

## 2. Problématique
Ajouter un jeu impose aujourd'hui de modifier une quinzaine de fichiers dispersés (types, shell, persistance, setup, sélection, lien externe, changelog), ce qui rend chaque nouveau jeu, chaque projection TV et chaque mode de saisie coûteux et sujet aux oublis.

## 3. Objectifs
- O1 : un descripteur unique par jeu, consommé par tous les points d'aiguillage.
- O2 : ajouter un jeu = créer un module + l'enregistrer (cible : ≤ 3 fichiers hors contenu propre du jeu).
- O3 : aucun changement de comportement pour les six jeux existants.

## 4. État actuel vérifié dans le code
- [vérifié] Le type `GameType` et l'aiguillage écran sont dans `utils/arenaFlow.ts:1-13`.
- [vérifié] Fichiers mentionnant Gotcha hors de son domaine (proxy du coût d'ajout d'un jeu) : `App.tsx`, `types.ts`, `utils/arenaFlow.ts`, `src/app/appShell.ts`, `src/app/useGameLifecycle.ts`, `src/shared/session/persistedAppSession.ts`, `src/features/game-setup/setupModel.ts`, `setupPresentation.ts`, `setupViewModel.ts`, `src/features/external-match/externalMatchStartup.ts`, `views/SetupView.tsx`, `views/GameSelectionView.tsx`, `views/GotchaGameView.tsx`, `components/game-setup/SetupTargetScoreSection.tsx`, `components/ui/ChangelogModal.tsx` (15 fichiers + `src/domain/gotcha/`).
- [vérifié] `App.tsx:353-422` rend chaque vue par une condition `screen === '<JEU>_GAME'` ; `useGameLifecycle` a un gestionnaire de fin par jeu (`src/app/useGameLifecycle.ts:77-180`).
- [vérifié] `AppScreen` énumère 15 écrans (`src/app/appShell.ts:10-25`) dont 2 jamais rendus (`KILLER_STATS`, `GOTCHA_STATS`).
- [hypothèse] Sans état sérialisable par jeu (spec 058), le descripteur n'aurait rien de stable à référencer.

## 5. Comportement cible
Chaque jeu exporte un `GameModule` : `{ id, label, setup: { defaults, constraints, sections }, createSession, reducer, isFinished, getResult, View, StatsView, toHistoryEntry, projection? }`. Un registre unique (`src/app/gameRegistry.ts`) les liste ; `App`, `GameSelectionView`, `setupModel`, `appShell`, `useGameLifecycle`, la persistance (spec 010) et la TV (spec 089) le consomment au lieu d'énumérer les jeux.

## 6. Périmètre
### Inclus
- Type `GameModule` et registre ; enregistrement des six jeux existants.
- Remplacement des `switch`/conditions par jeu dans le shell, le setup, la sélection, la persistance et l'historique.
- Génération de `GameType` et des écrans de jeu depuis le registre.
### Exclu
- Création de nouveaux jeux (specs dédiées).
- Chargement dynamique de jeux tiers, plugins, DSL de règles.
- Le lien partenaire (spec 030 limité à X01) : son aiguillage reste explicite (ADR-0009).

## 7. User stories
- En tant que contributeur, je veux ajouter un jeu en créant un module et en l'enregistrant, sans chercher les endroits à modifier.
- En tant que mainteneur, je veux qu'un jeu oublié dans un écran provoque une erreur de typage plutôt qu'un écran blanc.

## 8. Règles métier
Sans objet : aucune règle de jeu n'est modifiée.

## 9. Parcours utilisateurs
Inchangés (ouvrir → jeu → prénoms → jouer). L'ordre des jeux dans la sélection est porté par le registre et reste identique.

## 10. Exigences fonctionnelles
- FR-01 : un module par jeu implémente `GameModule` ; le registre est la seule liste des jeux.
- FR-02 : `GameSelectionView` affiche les jeux dans l'ordre du registre.
- FR-03 : le setup lit valeurs par défaut, contraintes (nombre de joueurs, doublettes) et sections depuis le module.
- FR-04 : `App` rend la vue de jeu et la vue de statistiques via le module, sans condition par jeu.
- FR-05 : la fin de partie produit l'entrée d'historique via `toHistoryEntry` (un seul gestionnaire générique).
- FR-06 : le typage garantit l'exhaustivité (ajouter un jeu sans `View` ou `reducer` ne compile pas).
- FR-07 : le contenu du changelog n'est pas généré par le registre (texte éditorial).

## 11. Exigences non fonctionnelles
- NFR-01 : chargement paresseux des vues conservé (pas d'augmentation du bundle initial) [à mesurer avec la spec 044].
- NFR-02 : aucune dépendance npm ; coût récurrent 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : sélection de Killer → setup Killer → partie → fin → statistiques, identiques à aujourd'hui.
- Alternatif : restauration d'une session dont le `gameType` n'est plus enregistré → retour à l'accueil avec message (règle de la spec 010).

## 13. Cas limites
Triathlon (jeu composite qui réutilise trois modules) ; X01 avec lien partenaire ; écrans de statistiques absents pour Killer/Gotcha (spec 049).

## 14. Gestion des erreurs
Jeu inconnu (session ancienne, paramètre `game=` du lien) → retour à la sélection, sans plantage.

## 15. Impacts architecturaux
Nouvelle abstraction justifiée uniquement par la multiplication des jeux ; elle vit dans `src/app/` (composition) et référence les modules de domaine de la spec 058. Pas d'inversion de dépendance supplémentaire.

## 16. Impacts sur les données et les interfaces
`gameType` persisté inchangé (mêmes identifiants) ; aucun changement de contrat externe.

## 17. Compatibilité avec l'existant
Sessions et historiques existants restent lisibles (identifiants de jeux conservés).

## 18. Dépendances
- Prérequis : V2-ARCH-04 (058).
- Déclencheurs : validation d'au moins un nouveau jeu (specs 103, 104, 105) ou de la TV multi-jeux (spec 089).
- Liens : V2-GAMES-06 (049, écrans de fin communs), V2-ARCH-06 (010).

## 19. Critères d'acceptation
- AC-01 : ajouter un jeu factice de test (dans `tests/`) ne nécessite que la création de son module et une ligne d'enregistrement (test d'intégration qui rend sélection → setup → partie).
- AC-02 : `grep -rn "'GOTCHA'" src views components App.tsx` ne renvoie que le module Gotcha et le registre.
- AC-03 : E2E `gameplay-entry.smoke.spec.ts` et parcours complets (spec 040) inchangés pour les six jeux.
- AC-04 : poids du bundle initial inchangé à ±2 % (mesure de build, spec 044).

## 20. Scénarios de tests
Test d'intégration avec un jeu factice ; tests de typage (exhaustivité) ; E2E existants.

## 21. Exigences de non-régression
Parcours des six jeux, lien partenaire X01, restauration de session.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Abstraction prématurée sans nouveau jeu | Moyen | Élevée | Spec conditionnelle (Q1) |
| Jeux trop différents pour un descripteur commun (Triathlon) | Moyen | Moyenne | Champs optionnels, composition explicite |
| Régression de navigation | Moyen | Faible | E2E par jeu |

## 23. Décisions architecturales
- ADR-0001 (option 3 reportée ici).
- Pas d'ADR dédiée : à créer seulement si la spec est déclenchée (Q2).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Déclencher la spec | Dès la spec 058 / au premier nouveau jeu validé / jamais | Au premier nouveau jeu validé (compte rendu C.9) | — |
| Q2 | ADR dédiée | Oui / non | Oui si déclenchée (nouvelle abstraction structurante) | — |
| Q3 | Inclure la projection TV dans le descripteur | Oui / non | Oui si la spec 089 est validée | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` T6, CA-6, §9 ; compte rendu C.9, F.2, H.13.
- Specs liées : 010, 040, 044, 049, 058, 089, 103, 104, 105.
- Code vérifié au commit `508dfa6`.
