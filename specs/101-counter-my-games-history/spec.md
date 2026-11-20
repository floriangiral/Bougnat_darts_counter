---
id: 101-counter-my-games-history
v2_id: V2-HIST-01
titre: « Mes parties » — historique local
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: innovation
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [V2-ARCH-06]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 101 — « Mes parties » : historique local

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

- Audit V2 du 2026-11-20 : rapport 09 (constat P7, proposition INNO-03 « Carnet de parties local »), rapport 02 (§4.5 Persistance), compte rendu consolidé (B.1 « Enregistré mais jamais affiché », E rang 3, F.6, arbitrage H.12).
- `docs/product-scope.md:13` annonce déjà un « historique local enregistré sur l'appareil (pas encore consultable) » et renvoie à cette spec.
- Une fonctionnalité de parité : un historique existe chez la plupart des concurrents consultés. Le rapport 09 note seulement que, chez The Darts App, les parties jouées sans compte sont effacées après 30 jours [VÉRIFIÉ ext., 20/11/2026] et que DartCounter gratuit ne montre qu'une partie précédente [VÉRIFIÉ ext.]. **Aucune nouveauté n'est revendiquée** : la valeur est « mémoire sans compte, sur l'appareil ».

## 2. Problématique

Chaque fin de partie est écrite sur l'appareil, mais aucun écran ne permet de la consulter, de la supprimer ou de la rejouer. Les statistiques disparaissent de la vue après 2 minutes. Le stockage IndexedDB grossit sans limite et contient des prénoms de tiers sans que l'utilisateur le sache.

## 3. Objectifs

- O1 : consulter les parties terminées sur l'appareil, tous jeux confondus, en 2 interactions au plus depuis l'accueil.
- O2 : relancer une partie avec les mêmes joueurs et le même format en 1 interaction depuis le détail (le setup reste modifiable).
- O3 : borner le stockage (nombre d'entrées) et permettre la suppression unitaire et totale.
- O4 : informer clairement que les données restent sur l'appareil.
- O5 : ne rien ajouter au parcours de base (ouvrir → jeu → prénoms → jouer).

## 4. État actuel vérifié dans le code

- [vérifié] X01 : l'entrée d'historique est écrite au clic sur « Voir les Stats » (`views/MatchView.tsx:778` → `src/app/useGameLifecycle.ts:84-91` → `saveFinishedMatchLocally`). Le `MatchState` complet est stocké comme charge utile (`src/infrastructure/local/IndexedDBSessionRepository.ts:129-139`).
- [vérifié] Cricket, Triathlon, Capital, Killer, Gotcha : `saveLocalGameHistoryEntry` avec un identifiant `<jeu>:${Date.now()}`, les résultats, les joueurs et la configuration (`src/app/useGameLifecycle.ts:93-180`). Killer et Gotcha déclenchent `onFinish` dans un effet à la détection de fin (`views/KillerGameView.tsx:55-60`, `views/GotchaGameView.tsx:108-114`) ; Capital calcule le vainqueur par tri du score, sans gestion d'égalité (`useGameLifecycle.ts:138`).
- [vérifié] Type `LocalGameHistoryEntry` : `id`, `gameType`, `completedAt`, `winnerId`, `payload: Record<string, unknown>`, **sans version de schéma** (`src/shared/session/persistedAppSession.ts:56-62`).
- [vérifié] Repli localStorage `bougnat-match-history-v1` borné à 50 entrées (`IndexedDBSessionRepository.ts:142-144`) ; store IndexedDB `match_history` **non borné** (`:149-153`) ; erreurs d'écriture ignorées silencieusement (`:154-156`, `:233`).
- [vérifié] `listLocalGameHistory` lit IndexedDB puis, si vide, le repli localStorage (`IndexedDBSessionRepository.ts:159-166`), tri décroissant sur `completedAt` (`:207`). Seuls des tests l'appellent (`tests/unit/application/sessionPersistence.test.ts:52`, `tests/unit/application/indexedDbSessionRepository*.test.ts`).
- [vérifié] Aucune suppression d'entrée n'existe (ni unitaire ni totale) ; le port `SessionRepository` ne couvre ni la liste ni la suppression (`src/application/scoring/ports.ts:3-7`).
- [vérifié] Base `bougnat-counter-local` en version 1, stores créés sans index (`IndexedDBSessionRepository.ts:10-14`, `:244-267`).
- [vérifié] `StatsView` revient à l'accueil après 120 s, hors match lié (`views/StatsView.tsx:28-36`).
- [vérifié] Mécanisme de pré-remplissage du setup déjà présent (`App.tsx:108-109`, `:347-348` ; `views/SetupView.tsx:37-50`), non verrouillant hors lien externe (`views/SetupView.tsx:69`).
- [vérifié] L'accueil comporte un bouton principal « Lancer une partie » (`views/HomeView.tsx:117-127`) et des boutons secondaires en pied de page (QR, installation, nouveautés : `:132-160`).
- [hypothèse] Sur une tablette de club, quelques milliers de `MatchState` X01 peuvent peser plusieurs Mo ; volume réel non mesuré.

## 5. Comportement cible

Un bouton secondaire « Mes parties » en pied de l'accueil ouvre la liste des parties terminées sur cet appareil (la plus récente en haut). Chaque ligne résume la partie. Le détail affiche le récapitulatif en lecture seule (statistiques complètes pour X01) et propose « Rejouer avec ces joueurs », « Supprimer » et, si V2-SHARE-01 (102) est livrée, « Partager ». Un bouton « Tout effacer » (avec confirmation) et une mention « Enregistré uniquement sur cet appareil » sont visibles dans la liste. L'historique est plafonné ; au-delà, les plus anciennes entrées sont supprimées automatiquement.

## 6. Périmètre

### Inclus
- Écran liste, écran détail en lecture seule, entrée depuis l'accueil.
- Résumé par jeu calculé par une projection pure (6 jeux).
- Suppression unitaire, suppression totale, plafond de rétention.
- Version de schéma des nouvelles entrées et lecture tolérante des anciennes.
- « Rejouer avec ces joueurs » via le pré-remplissage existant.

### Exclu
- Tendances et statistiques agrégées par prénom (Q4) : un prénom n'est pas une identité.
- Synchronisation, sauvegarde distante, compte.
- Modification d'une partie passée (relève de V2-ARCH-05, 059).
- Purge de `current_matches` (relève de 010 / V2-ARCH-06).
- Export de fichier (Q5 ; l'export d'une partie relève de 102).

## 7. User stories

- En tant que joueur régulier, je veux retrouver la partie d'hier et ses statistiques, afin de comparer mes performances.
- En tant que club disposant d'une tablette partagée, je veux voir les dernières parties jouées, afin de vérifier un résultat contesté.
- En tant que joueur, je veux relancer une partie avec les mêmes joueurs sans les ressaisir.
- En tant que gérant de bar, je veux effacer l'historique en une action, afin de ne pas conserver les prénoms des clients.

## 8. Règles métier

- RM-01 : une partie entre dans l'historique uniquement lorsqu'elle est terminée (moment d'enregistrement actuel conservé ; il sera aligné sur V2-GAMES-06, 049, « résultat enregistré à la validation »).
- RM-02 : une partie abandonnée n'est pas enregistrée.
- RM-03 : l'historique ne contient jamais de données envoyées ou reçues d'un serveur.
- RM-04 : le résumé affiché est calculé à partir des données enregistrées, sans recalcul des règles de jeu.
- RM-05 : les joueurs robots restent identifiés comme tels dans l'historique.

## 9. Parcours utilisateurs

1. Accueil → « Mes parties » (pied de page).
2. Liste : date et heure, jeu et format (« 501 Double Out — 3 manches »), joueurs, vainqueur mis en évidence, score résumé (« 3-1 »).
3. Toucher une ligne → détail en lecture seule.
4. Détail → « Rejouer avec ces joueurs » → écran de setup du jeu, pré-rempli et modifiable → « Lancer ».
5. Détail → « Supprimer » → confirmation → retour à la liste.
6. Liste → « Tout effacer » → confirmation explicite → liste vide.
7. Retour à l'accueil depuis la liste par le bouton retour de l'application et le bouton système.

## 10. Exigences fonctionnelles

- FR-01 : l'accueil affiche un bouton secondaire « Mes parties » dans le pied de page, avec le même style que les autres boutons secondaires ; le bouton principal « Lancer une partie » n'est pas modifié.
- FR-02 : la liste affiche les entrées triées par `completedAt` décroissant, avec date et heure locales, jeu, format, joueurs (équipes en doublettes), vainqueur et score résumé.
- FR-03 : un état vide explicite est affiché lorsqu'il n'y a aucune partie (« Aucune partie terminée sur cet appareil »).
- FR-04 : le détail X01 affiche les statistiques de fin de partie existantes (`components/stats/StatsModal.tsx`) en lecture seule à partir du `MatchState` enregistré.
- FR-05 : le détail des autres jeux affiche le résumé produit par la projection (classement, scores, durée si connue) ; l'affichage complet des écrans de statistiques propres à chaque jeu est un incrément ultérieur (Q3).
- FR-06 : « Rejouer avec ces joueurs » ouvre le setup du jeu avec les prénoms et le format pré-remplis, modifiables, sans lancer la partie automatiquement.
- FR-07 : « Supprimer » retire l'entrée d'IndexedDB **et** du repli localStorage, après confirmation.
- FR-08 : « Tout effacer » retire toutes les entrées des deux stockages, après confirmation explicite.
- FR-09 : l'historique est plafonné à N entrées (N = 100 proposé, Q2) ; à chaque enregistrement, les entrées les plus anciennes au-delà de N sont supprimées dans les deux stockages.
- FR-10 : chaque nouvelle entrée porte `schemaVersion: 1` et un champ `summary` (jeu, format, joueurs, vainqueur(s), score résumé, durée) calculé à l'enregistrement.
- FR-11 : une entrée ancienne (sans `schemaVersion`) est lue de façon tolérante : le résumé est reconstitué depuis `payload` si sa structure est reconnue, sinon la ligne affiche « Partie illisible » et reste supprimable.
- FR-12 : la liste affiche la mention « Ces parties sont enregistrées uniquement sur cet appareil. »
- FR-13 : une partie jouée par lien de match externe (spec 030) est signalée par une mention « Match lié » si l'information est disponible à l'enregistrement.

## 11. Exigences non fonctionnelles

- NFR-01 (performance) : ouverture de la liste ≤ 500 ms pour 100 entrées sur la tablette de référence de V2-QA-09 (042) [à confirmer sur appareil] ; la liste ne désérialise pas les `MatchState` complets (elle lit `summary`).
- NFR-02 (accessibilité) : liste navigable au clavier, lignes sous forme de boutons ou liens nommés, cibles ≥ 48 px, confirmations dans un `<dialog>` avec focus géré.
- NFR-03 (confidentialité) : aucune donnée ne quitte l'appareil ; aucune collecte d'usage n'est ajoutée par cette spec.
- NFR-04 (coût) : 0 € récurrent.
- NFR-05 (compatibilité) : fonctionne avec le seul repli localStorage si IndexedDB est indisponible (navigation privée, anciens navigateurs de la baseline 018).
- NFR-06 (langue) : libellés en français accentué, conformes au lexique de V2-GAMES-10 (013).

## 12. Cas nominaux et alternatifs

- Nominal : partie X01 terminée → « Voir les Stats » → accueil → « Mes parties » → la partie est en tête.
- Alternatif : jeu non-X01 → résumé spécifique (Cricket : points et cibles fermées ; Capital : scores finaux ; Killer/Gotcha : survivant / score exact ; Triathlon : total /100 par joueur).
- Alternatif : « Rejouer » depuis une partie contre le robot → setup pré-rempli avec le niveau du robot si le pré-remplissage le permet, sinon prénoms humains seuls et message (Q6).

## 13. Cas limites

- Deux parties terminées dans la même milliseconde (identifiants `jeu:${Date.now()}`) : la seconde écrase la première ; les nouvelles entrées utilisent un identifiant unique (`createId`) [à vérifier en implémentation].
- Horloge de l'appareil modifiée : l'ordre suit `completedAt`, éventuellement incohérent ; accepté.
- Quota de stockage atteint : l'écriture échoue ; un message non bloquant est affiché à la prochaine ouverture de la liste (dépend du signalement d'erreur prévu par 010).
- Entrée IndexedDB présente mais repli localStorage différent (divergence actuelle) : la source affichée est IndexedDB ; si IndexedDB est vide ou indisponible, le repli.
- Égalité au Capital : le résumé affiche les ex æquo (le `winnerId` actuel n'en garde qu'un).

## 14. Gestion des erreurs

- Lecture impossible : message « Historique indisponible sur cet appareil » et bouton retour ; aucune exception non gérée.
- Suppression partielle (un stockage échoue) : nouvel essai à l'ouverture suivante ; l'entrée n'est plus affichée.
- Entrée corrompue : ligne « Partie illisible » supprimable (FR-11).

## 15. Impacts architecturaux

- Domaine : aucun changement de règles.
- Application : nouveau port `GameHistoryRepository` (`list`, `save`, `remove`, `clear`) et cas d'usage `listGameHistory`, `deleteGameHistoryEntry`, `clearGameHistory` ; projection pure `toHistorySummary(entry)` par jeu (préparée pour le descripteur de jeu de V2-ARCH-09, 060).
- Infrastructure : `IndexedDBSessionRepository` (ou un `IndexedDBGameHistoryRepository` séparé) implémente le port, le plafond et la suppression.
- Présentation : `views/HistoryView.tsx` (liste) et détail ; nouvel écran `HISTORY` dans `src/app/appShell.ts`.
- Dépendances : UI → application → port ; l'infrastructure implémente le port ; aucune importation d'infrastructure depuis la vue.

## 16. Impacts sur les données et les interfaces

- `LocalGameHistoryEntry` gagne `schemaVersion?: 1` et `summary?: GameHistorySummary` (champs optionnels : rétrocompatible).
- Pas de changement de version IndexedDB (pas d'index ajouté : tri en mémoire sur ≤ N entrées).
- Le repli localStorage reste borné (aligné sur N).
- Aucun contrat externe modifié (030 inchangé).

## 17. Compatibilité avec l'existant

- Les entrées existantes restent lisibles (FR-11) ; aucune migration destructive.
- Le moment d'enregistrement n'est pas modifié par cette spec (RM-01).
- Le retour automatique de `StatsView` n'est pas modifié ici (décision dans V2-GAMES-06, 049) ; l'historique en atténue l'effet.

## 18. Dépendances

- V2-ARCH-06 (010, reprise fiable) : conventions de version de schéma, validation et signalement des erreurs de stockage. Dépendance souple (Q1).
- V2-GAMES-06 (049) : moment d'enregistrement « à la validation » et fin de partie commune (non bloquant).
- V2-SHARE-01 (102) : action « Partager » depuis le détail (optionnelle).
- V2-GAMES-10 (013) : libellés.

## 19. Critères d'acceptation

- AC-01 : appareil sans historique ; ouvrir « Mes parties » → l'état vide est affiché. Preuve : test de composant.
- AC-02 : terminer un X01 501 en 3 manches, cliquer « Voir les Stats », revenir à l'accueil, ouvrir « Mes parties » → la partie est en tête avec date, « 501 », prénoms, vainqueur et « 3-x ». Preuve : E2E Chromium et WebKit.
- AC-03 : pour chacun des 5 autres jeux, une partie terminée apparaît avec un résumé conforme à §12. Preuve : tests unitaires de `toHistorySummary` (6 jeux) + 1 E2E Cricket.
- AC-04 : depuis le détail X01, les statistiques affichées sont identiques à celles de l'écran de fin de cette partie. Preuve : test de composant avec fixture.
- AC-05 : « Rejouer avec ces joueurs » ouvre le setup pré-rempli ; « Lancer » démarre une partie avec les mêmes prénoms et le même format. Preuve : E2E.
- AC-06 : avec N+5 parties enregistrées, la liste contient N entrées et les 5 plus anciennes ont disparu des deux stockages. Preuve : test unitaire du dépôt (IndexedDB simulé + localStorage).
- AC-07 : « Supprimer » puis rechargement → l'entrée n'existe plus ni dans IndexedDB ni dans localStorage. Preuve : test unitaire + E2E.
- AC-08 : « Tout effacer » → liste vide après rechargement. Preuve : E2E.
- AC-09 : une entrée au format actuel (sans `schemaVersion`) est affichée correctement ; une entrée corrompue affiche « Partie illisible » et reste supprimable. Preuve : tests unitaires avec fixtures.
- AC-10 : le parcours « Lancer une partie » → jeu → prénoms → jouer ne comporte aucune étape supplémentaire. Preuve : E2E existants inchangés.
- AC-11 : contrôle axe sans violation sérieuse sur la liste et le détail (si V2-QA-05, 041, est disponible).

## 20. Scénarios de tests

- Unitaires : projection `toHistorySummary` par jeu (fixtures réelles), lecture tolérante, plafond, suppression, identifiant unique.
- Composants : liste (vide, pleine, entrée illisible), détail X01, dialogues de confirmation.
- E2E : AC-02, AC-05, AC-07, AC-08 (Chromium + WebKit).
- Terrain : tablette de club avec 100 entrées (temps d'ouverture) [à confirmer].

## 21. Exigences de non-régression

- Tests existants `tests/unit/app/useGameLifecycle.test.ts`, `tests/unit/application/sessionPersistence.test.ts`, `tests/unit/application/indexedDbSessionRepository*.test.ts` verts.
- Reprise X01 et lien de match externe (030) inchangés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Prénoms de clients conservés sur une tablette de bar | Moyen (confidentialité) | Moyenne | Mention FR-12, « Tout effacer », plafond, option de rétention courte (Q2) |
| Historique illisible après évolution des états de jeu (V2-ARCH-04) | Moyen | Moyenne | `summary` figé à l'enregistrement, lecture tolérante |
| Liste lente avec gros `MatchState` | Faible | Faible | Lecture de `summary`, plafond |
| Confusion avec un historique « officiel » | Faible | Faible | Mention « sur cet appareil », aucune mention de validation |

## 23. Décisions architecturales

- Port dédié `GameHistoryRepository` plutôt qu'extension de `SessionRepository` (responsabilité distincte) — à confirmer en revue.
- Pas de montée de version IndexedDB tant qu'aucun index n'est nécessaire.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Afficher l'historique ou cesser de l'enregistrer (H.12) ? | Afficher / Cesser d'enregistrer et purger | Afficher (données déjà produites, attente utilisateur) | — |
| Q2 | Rétention | 50 / 100 / 200 entrées ; option « effacer après 30 jours » | 100 entrées, sans purge par âge par défaut ; option de purge par âge si demandée par des lieux | — |
| Q3 | Détail des jeux non-X01 | Résumé seul / réutiliser les écrans de stats existants en lecture seule | Résumé en V1, écrans complets avec V2-GAMES-06 | — |
| Q4 | Tendances par prénom (moyenne des 10 derniers X01) | Oui / Non | Non en V1 (prénom ≠ identité, risque de mélange) | — |
| Q5 | Export de tout l'historique (fichier JSON) | Oui / Non / Plus tard | Plus tard ; export unitaire via 102 | — |
| Q6 | « Rejouer » contre le robot | Conserver le niveau / Prénoms humains seuls | Conserver le niveau si le pré-remplissage le permet sans refonte | — |
| Q7 | Libellé de l'entrée | « Mes parties » / « Historique » | « Mes parties » | — |
| Q8 | Livrer avant 010 (V2-ARCH-06) ? | Attendre / Livrer avec lecture tolérante | Livrer avec lecture tolérante si 010 n'est pas prêt | — |

## 25. Traçabilité

- Rapports : `reports/09-innovation.md` (P6, P7, INNO-03, D1, D2), `reports/02-architecture.md` (§4.5), `reports/03-games.md` (§5.4, §5.5).
- Compte rendu : B.1, E (rang 3), F.6, G (lot 2), H.12.
- Issue historique #48 « Donner un identifiant unique à chaque partie » (fermée NOT_PLANNED le 24/04/2026) : retracée par le cas limite d'identifiant (§13).
- Specs liées : 010, 030, 049, 059, 060, 102, 013.
