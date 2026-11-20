---
id: 010-counter-offline-session-recovery-guarantees
v2_id: V2-ARCH-06
type: fonctionnel
statut: a-revoir
validation: en-attente
statut_reel: "Non respectée hors X01 ; cite des fonctions inexistantes."
traitement_propose: "Enrichir — reprise multi-jeux P0 (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 010 - counter offline session recovery guarantees

## Meta

- ID: `010-counter-offline-session-recovery-guarantees`
- Statut: `active`
- Milestone cible: `M4: Local Session Persistence`
- Issues GitHub: `#71`

## Objectif

Formaliser les garanties de reprise de session locale pour proteger la promesse offline-first durant les interruptions (reload, fermeture, reprise partielle).

## Decisions

- la session locale est la source de verite en mode local
- la reprise doit restaurer un etat jouable coherent
- les donnees invalides doivent etre ignorees proprement sans crash
- les flux de reprise doivent rester independants d un backend metier

## Invariants critiques

- pas de perte silencieuse d etat critique pendant une partie en cours
- pas de blocage au lancement en presence de donnees corrompues
- retour a un etat initial sain si restauration impossible

## Impacted Code

- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/infrastructure/local/sessionPersistence.ts`
- `src/shared/session/persistedAppSession.ts`
- `src/app/appShell.ts`

## Canonical Entry Points

- `saveSession` / `loadSession`
- bootstrap de session dans `appShell`

## Key Tests

- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/app/appShell.test.ts`
- `tests/e2e/completion.smoke.spec.ts`

## Validation

- reprise valide apres reload
- tolerance aux donnees partielles/corrompues
- continuity de gameplay sans backend

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Le contenu historique ci-dessus est conservé tel quel. Alias V2 : `V2-ARCH-06` (P0, difficulté L, lot 1, poids 33). Le backlog workspace `005-counter-offline-scoring-session-store` est proposé à la fusion dans cette spec (partie store/instantané ; la file d'opérations est reportée faute de backend).

### Constats vérifiés (code, commit `508dfa6`)
- [vérifié] **Seul X01 est repris.** `MatchView` remonte son état (`views/MatchView.tsx:211-217` → `App.tsx:360`) ; Cricket, Capital, Killer, Gotcha et Triathlon ne reçoivent que `players`, `config`, `onExit`, `onFinish` (`App.tsx:364-422`) : après rechargement, l'écran de jeu est restauré mais la vue repart de son état initial, **sans message**.
- [vérifié] Triathlon embarque deux `MatchView` sans `onStateChange` (`views/TriathlonGameView.tsx:302-320`) : même l'étape 501 n'est pas reprise.
- [vérifié] Restauration par simple cast : `readLocalStorageJson` fait `JSON.parse(raw) as T` (`utils/appPersistence.ts:5-16`) ; `App.tsx:105` et `App.tsx:150` castent `screen as AppScreen` alors que `isAppScreen` existe (`src/app/appShell.ts:82-83`). Seul `externalMatch` est revalidé (`App.tsx:101`, `App.tsx:162`).
- [vérifié] Aucune version de schéma : `PersistedAppSession` (`src/shared/session/persistedAppSession.ts:39-54`) n'a pas de `schemaVersion` ; IndexedDB `DB_VERSION = 1` (`src/infrastructure/local/IndexedDBSessionRepository.ts:11`).
- [vérifié] **Écriture complète chaque seconde pendant un X01** : `useMatchTimer` incrémente `elapsedSeconds` toutes les secondes (`src/features/x01/hooks/useMatchTimer.ts:27-32`), `MatchView` remonte l'instantané (`views/MatchView.tsx:211-217`), l'effet de persistance d'`App` se redéclenche (`App.tsx:170-199`) ; l'anti-rebond de 300 ms (`src/app/appShell.ts:130-149`) est plus court que l'intervalle d'une seconde, donc chaque tic aboutit à une écriture : `localStorage.setItem` synchrone de toute la session (`IndexedDBSessionRepository.ts:56`), `put` IndexedDB (l.61-68) puis relecture/réécriture de la table `bougnat-current-match-v1` (`sessionPersistence.ts:13-15` → `IndexedDBSessionRepository.ts:107-127`). Coût non mesuré [à confirmer sur tablette].
- [vérifié] **Croissance non bornée** : `saveCurrentMatch` ajoute chaque `match.id` à `current_matches` et à la table localStorage (`IndexedDBSessionRepository.ts:107-127`) sans jamais purger, y compris pour le `MatchState` « porteur » créé pour tous les jeux (`src/app/useGameLifecycle.ts:69-75`). `getCurrentMatch` n'est appelé par aucun code applicatif.
- [vérifié] **Échecs silencieux** : `catch {}` vides (`IndexedDBSessionRepository.ts:69-71`, `124-126`, `232-234`) et `persistAppSessionAsync(session).catch(() => undefined)` (`src/app/appShell.ts:137`) : un quota localStorage saturé arrête la sauvegarde sans aucun signal [hypothèse sur l'échéance].
- [vérifié] Historique local borné à 50 en localStorage (`IndexedDBSessionRepository.ts:143`), non borné en IndexedDB ; `listLocalGameHistory` n'a aucun consommateur d'interface (sujet de la spec 101, V2-HIST-01).
- [vérifié] Chrono des jeux non-X01 : `setInterval` local à chaque vue (`views/CricketGameView.tsx:232`, `views/CapitalGameView.tsx:81`, `views/KillerGameView.tsx:45`, `views/GotchaGameView.tsx:98`, `views/TriathlonGameView.tsx:55`), jamais persisté.
- [vérifié] Pile d'annulation X01 vidée à la restauration (`views/MatchView.tsx:147`).
- [hypothèse] Une session structurellement incohérente (ex. `currentPlayerIndex` hors bornes) ferait planter `MatchView` à l'accès `match.players[match.currentPlayerIndex]` (`views/MatchView.tsx:167-169`) ; non reproduit.
- [hypothèse] Deux onglets ouverts sur une partie écrivent la même entrée `current` (`IndexedDBSessionRepository.ts:15`) : le dernier écrivain gagne.

### Écarts avec la spec
| Élément de la spec 010 | Réalité |
|---|---|
| Invariant « pas de perte silencieuse d'état critique pendant une partie en cours » | Non tenu pour 5 jeux sur 6 |
| « Les données invalides doivent être ignorées proprement sans crash » | Aucune validation structurelle ; seul un JSON illisible est ignoré |
| Canonical entry points `saveSession` / `loadSession` | Inexistants ; réels : `loadAppSession` / `saveAppSession` (`IndexedDBSessionRepository.ts:43-52`) |
| Tâches « grille de corruption », « tests de restauration dégradée », « E2E reload en partie active » | Non réalisées ; seul le lien partenaire a un E2E de rechargement (`tests/e2e/external-match-link.smoke.spec.ts`) |
| Statut `active` | Statut réel : partiel (`statut: a-revoir`) |

### Exigences proposées
- V2-FR-01 : toute partie en cours, quel que soit le jeu (X01, Cricket, Capital, Killer, Gotcha, Triathlon y compris ses sous-étapes), est restaurée après rechargement, fermeture d'onglet ou mise en veille, dans l'état de la dernière action validée.
- V2-FR-02 : la partie en cours est persistée dans une enveloppe versionnée `{ schemaVersion, gameType, savedAt, setup, state, timing }` (ADR-0003), où `state` est l'instantané fourni par la spec 058.
- V2-FR-03 : à la lecture, l'enveloppe est validée par un validateur écrit à la main (type, champs obligatoires, bornes d'index, cohérence joueurs/équipes) ; une version antérieure connue est migrée, une version inconnue ou invalide est écartée.
- V2-FR-04 : une restauration écartée n'est jamais silencieuse : l'application revient à l'accueil et affiche un message non bloquant (« La partie précédente n'a pas pu être reprise ») ; la donnée écartée est supprimée.
- V2-FR-05 : l'écriture n'a lieu que sur changement métier (commande validée, changement d'écran, fin de partie) et lors du passage en arrière-plan (`visibilitychange`/`pagehide`) ; le chrono n'en déclenche aucune.
- V2-FR-06 : le chrono est représenté par des horodatages (`timing.accumulatedMs` + début de la période active) et dérivé à l'affichage ; le temps passé application fermée n'est pas compté (comportement actuel conservé, sauf décision contraire Q4).
- V2-FR-07 : `current_matches` (IndexedDB et localStorage) ne contient que la partie en cours ; il est purgé à la fin, à l'abandon et au démarrage d'une nouvelle partie ; les entrées orphelines existantes sont supprimées à la migration.
- V2-FR-08 : un échec d'écriture (quota, IndexedDB indisponible) affiche une alerte non bloquante une fois par session et n'empêche jamais de jouer.
- V2-FR-09 : l'écran restauré est validé par `isAppScreen` ; un écran de jeu sans partie valide renvoie à la sélection des jeux.
- V2-FR-10 : le `MatchState` porteur n'est plus persisté pour les jeux non-X01 (remplacé par `setup`, spec 058).
- V2-FR-11 : la partie X01 est traitée en premier et livrable indépendamment des autres jeux (elle ne dépend que de V2-FR-02 à V2-FR-09).
- V2-NFR-01 : aucune écriture de stockage pendant 60 s d'inactivité en partie (mesure par espion de `Storage.setItem` et d'IndexedDB).
- V2-NFR-02 : restauration de la partie en moins de 500 ms après le premier rendu sur l'appareil de référence de la spec 042 [à confirmer sur appareil].
- V2-NFR-03 : aucune dépendance npm ajoutée ; coût récurrent 0 € ; aucune donnée ne quitte l'appareil.
- V2-NFR-04 : comportement hors ligne identique au comportement en ligne (la reprise ne dépend d'aucun réseau).

### Critères d'acceptation proposés
- V2-AC-01 : pour chacun des six jeux, partie démarrée, 3 actions validées, rechargement de la page → même joueur courant, mêmes scores, même manche, chrono repris à ±2 s (E2E par jeu, spec 040).
- V2-AC-02 : Triathlon en étape 501 (puis au départage) → rechargement → reprise dans l'étape 501 avec les résultats Capital et Cricket intacts (E2E).
- V2-AC-03 : une session au format actuel (sans `schemaVersion`) contenant un X01 en cours est reprise après mise à jour (migration X01) **ou** écartée avec message, selon Q1 (test unitaire avec fixture réelle).
- V2-AC-04 : grille de corruption (JSON illisible, champ manquant, index hors bornes, `gameType` inconnu, `screen` inconnu, version future) → aucune exception, retour à l'accueil, message affiché, donnée supprimée (tests unitaires paramétrés).
- V2-AC-05 : pendant 60 s sans action en X01, aucune écriture de stockage n'est observée (test avec horloge simulée et espions).
- V2-AC-06 : après 10 parties X01 terminées, `current_matches` et `bougnat-current-match-v1` contiennent au plus une entrée (test IndexedDB avec `fake-indexeddb`).
- V2-AC-07 : stockage saturé simulé → alerte non bloquante affichée une fois, la partie continue (test de composant).
- V2-AC-08 : la documentation (`README.md`, `docs/architecture.md`) ne promet la reprise que pour les jeux effectivement couverts à la date de livraison.

### Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Sessions v1 existantes à la mise à jour (H.7) | Migration au mieux de X01 / purge annoncée | Migration au mieux de X01, purge annoncée pour les autres (qui n'étaient pas reprises) | — |
| Q2 | Reprise multi-jeux en P0 (H.9) | P0 / P1 | P0 : invariant historique non tenu, perte silencieuse | — |
| Q3 | Reprise automatique ou proposée | Automatique (actuel) / écran « Reprendre la partie ? » | Automatique pour la dernière partie, sans étape ajoutée au parcours de base ; bouton « Quitter » existant pour abandonner | — |
| Q4 | Temps application fermée | Non compté (actuel) / compté | Non compté | — |
| Q5 | Plusieurs onglets | Dernier écrivain gagne / un seul onglet écrivain (verrou) | Un seul onglet écrivain, l'autre en lecture avec message ; coordonné avec le mono-écrivain TV (ADR-0005) | — |
| Q6 | Durée de validité d'une partie en cours | Illimitée / 12 h / 7 jours | 7 jours, puis purge silencieuse documentée | — |
| Q7 | Écriture systématique du repli localStorage | Conserver (restauration synchrone au démarrage) / IndexedDB seul | Conserver tant que la restauration synchrone est nécessaire, mais seulement sur changement métier | — |
| Q8 | Fusion du workspace `005-counter-offline-scoring-session-store` | Fusionner / garder séparé | Fusionner (store/instantané ici, file d'opérations reportée) | — |

### Dépendances
- Prérequis pour les jeux non-X01 : V2-ARCH-04 (spec 058). La partie X01 (V2-FR-11) n'en dépend pas.
- Prérequis de test : V2-QA-01 (spec 039) pour les fixtures.
- Débloque : V2-QA-04 (spec 040, E2E reload par jeu), V2-HIST-01 (spec 101), V2-ARCH-05 (spec 059, journal persisté).
- Liens : V2-ARCH-11 (spec 061, hook de session d'`App`), V2-TV-02 (spec 084, chrono dérivé), spec 020 (INP), spec 030 (contexte partenaire, TTL 12 h conservé).
- Décisions architecturales : ADR-0003 (persistance versionnée), ADR-0001 (état sérialisable par jeu), ADR-0004 (journal, optionnel), ADR-0005 (mono-écrivain).
