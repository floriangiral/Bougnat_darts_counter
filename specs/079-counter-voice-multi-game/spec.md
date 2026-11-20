---
id: 079-counter-voice-multi-game
v2_id: V2-VOICE-08
titre: Voix — extension aux autres jeux (Cricket d'abord)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: voix
priorite: P2
difficulte: L
recommandation: optionnel
lot: 5
poids: 13
depend_de: [V2-ARCH-04, V2-VOICE-04]
remplace: []
remplacee_par: []
issue: '#284'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 079 — Voix — extension aux autres jeux (Cricket d'abord)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (chantier 5.1 : la voix au-delà de X01) ; rapport 04 §6.7 et §8 (V2-VOICE-08 Cricket, V2-VOICE-13 autres jeux) ; compte rendu §F.4 et §G (lot 5). L'ADR 0008 prévoit des **grammaires par jeu** produisant des intentions converties en commandes métier ; l'ADR 0001 prévoit un état de partie sérialisable et un reducer pur par jeu (spec 058).

## 2. Problématique
La voix n'existe qu'en X01 (et dans le 501 du Triathlon). Le Cricket, deuxième jeu le plus joué, se saisit fléchette par fléchette sur un pavé dédié : c'est précisément là qu'annoncer « triple vingt, double dix-neuf, raté » ferait gagner le plus de contacts.

## 3. Objectifs
- O1 — Saisie vocale du Cricket avec les mêmes commandes que le pavé (`onHit`, `onMiss`, `onTripleMiss`, undo).
- O2 — Aucune règle Cricket dans la grammaire : le reducer qualifie fermeture, points, fin.
- O3 — Cadre réutilisable : ajouter un jeu = écrire une grammaire, pas un pipeline.

## 4. État actuel vérifié dans le code
- [vérifié] Aucun jeu hors X01 n'importe le module voix (recherche `voice` dans `views/CricketGameView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `CapitalGameView.tsx` : 0) ; le Triathlon réutilise `MatchView` pour sa phase 501 (`views/TriathlonGameView.tsx:302,315`).
- [vérifié] `CricketKeypad` expose `onHit(target, multiplier)`, `onMiss`, `onTripleMiss`, `onUndo` (`components/game/CricketKeypad.tsx:5-11`) ; cibles `CricketTarget = 20 | 19 | 18 | 17 | 16 | 15 | 25` (`types.ts:59`).
- [vérifié] L'état du Cricket vit dans la vue (`views/CricketGameView.tsx:47-63`, dont `turnDartsThrown`, `history`) : pas de reducer pur exploitable par un contrôleur vocal (spec 058 prérequise).
- [vérifié] Le parseur X01 sait déjà reconnaître multiplicateurs, bull et ratés (`src/features/x01/voice/dartsSpeechParserScoring.ts`), réutilisables comme lexique partagé.

## 5. Comportement cible
Pendant une partie de Cricket, le joueur appuie sur le micro (mode annonce) ou parle (mode mains libres, spec 076) : « triple vingt, double dix-neuf, raté ». La bannière montre trois fléchettes proposées (T20, D19, raté) ; après confirmation explicite (« valide » ou tap), trois commandes `Hit/Hit/Miss` sont envoyées au reducer Cricket, qui met à jour marques et points. Une annonce partielle (« triple vingt ») ne propose qu'une fléchette.

## 6. Périmètre
### Inclus
Lexique FR partagé ; grammaire Cricket ; branchement du contrôleur vocal (spec 075) sur `CricketGameView` ; commandes undo et « trois ratées » ; tests.
### Exclu
Capital, Killer, Gotcha (P3, après mesure d'usage — Q1) ; variantes Cricket (spec 051) au-delà du lexique ; TV (081).

## 7. User stories
- En tant que joueur de Cricket, je veux annoncer ma volée en une phrase afin d'éviter trois appuis.
- En tant que joueur, je veux dire « annule » pour retirer la dernière fléchette proposée.

## 8. Règles métier
- RM-01 — La grammaire ne connaît que le **vocabulaire d'entrée** du pavé (cibles 15-20, bull, multiplicateurs, raté) ; elle ne qualifie ni fermeture ni points (reducer).
- RM-02 — Une cible hors 15-20/bull annoncée (« double quatorze ») : traitement selon Q2.
- RM-03 — Au plus 3 fléchettes par volée moins les fléchettes déjà saisies au pavé ; l'excédent est refusé avec message.
- RM-04 — Précision : l'ordre des fléchettes annoncé est l'ordre saisi ; une annonce isolée n'indique pas la position (première, deuxième, troisième) au-delà de l'ordre de saisie.
- RM-05 — Confirmation explicite obligatoire (invariant de la spec 003 étendu ; mode C de la spec 076 seulement si décidé).

## 9. Parcours utilisateurs
1. Cricket à 2 joueurs, Paul annonce « triple vingt, triple vingt, double dix-neuf » → bannière 3 fléchettes → « valide » → marques mises à jour, joueur suivant.
2. Léa saisit une fléchette au pavé puis annonce « raté, raté » → 2 fléchettes proposées.
3. « trois ratées » → `onTripleMiss`.

## 10. Exigences fonctionnelles
- FR-01 — Lexique FR partagé extrait (`src/shared/voice/lexiconFr.ts`) : nombres, multiplicateurs, bull/demi-bulle, ratés, commandes.
- FR-02 — Grammaire Cricket : transcript → intentions `Hit(target, multiplier)`, `Miss`, `TripleMiss`, commandes de la spec 075.
- FR-03 — Les intentions sont converties en commandes du reducer Cricket (spec 058), exactement celles du pavé.
- FR-04 — Le contrôleur vocal est branché sur `CricketGameView` via le même `useVoiceSession` (spec 075), avec une clé de session (joueur, fléchettes déjà saisies, historique).
- FR-05 — Indices de vocabulaire du moteur spécifiques au jeu (cibles 15-20, bull).
- FR-06 — Réglage « Assistance vocale » présent dans les réglages de la partie Cricket, comme en X01.

## 11. Exigences non fonctionnelles
- NFR-01 Exactitude ≥ 97 % au calme sur un sous-corpus Cricket (spec 074) [cible proposée].
- NFR-02 Coût par partie ≤ celui d'un 501 à deux joueurs (mêmes durées d'écoute).
- NFR-03 Aucune règle Cricket dupliquée hors du reducer.

## 12. Cas nominaux et alternatifs
Nominal : parcours 1. Alternatifs : mélange pavé + voix (parcours 2) ; mode mains libres.

## 13. Cas limites
« bull » vs « demi-bulle » (simple 25 vs double) ; « vingt » seul (S20) vs « vingt » comme nombre total ; cible déjà fermée par tous ; doublette (2v2) ; fin de partie atteinte avant la 3ᵉ fléchette proposée.

## 14. Gestion des erreurs
Annonce non reconnue → message, aucune fléchette ; erreur moteur → retour au pavé.

## 15. Impacts architecturaux
Réutilise le port, le contrôleur et le lexique (ADR 0008) ; nécessite le reducer pur Cricket (ADR 0001, spec 058). Aucune dépendance de la grammaire vers le moteur Cricket.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée nouvelle ; corpus Cricket ajouté au corpus versionné de la spec 074.

## 17. Compatibilité avec l'existant
Pavé Cricket inchangé ; X01 inchangé (le lexique partagé est extrait sans changer le comportement).

## 18. Dépendances
**V2-ARCH-04 / spec 058** (reducer pur par jeu) et **V2-VOICE-04 / spec 075** (port, contrôleur) — bloquantes. Liens : 074 (corpus Cricket), 076 (mains libres), V2-GAMES-04 / 047 (fin de partie Cricket), 051 (variantes).

## 19. Critères d'acceptation
- AC-01 — « triple vingt, double dix-neuf, raté » → 3 fléchettes proposées ; après « valide », marques identiques à la saisie équivalente au pavé (test de parité).
- AC-02 — « trois ratées » → effet identique à `onTripleMiss`.
- AC-03 — Une fléchette déjà saisie au pavé limite la proposition à 2 fléchettes.
- AC-04 — La grammaire ne référence aucun module de règles Cricket (test d'architecture / garde ESLint de la spec 056).
- AC-05 — Sous-corpus Cricket : exactitude mesurée et rapportée.

## 20. Scénarios de tests
Unitaires : grammaire (table-driven), conversion en commandes. Composants : bannière Cricket. E2E simulé : volée complète. Terrain : 3 parties Cricket.

## 21. Exigences de non-régression
Suite Cricket existante, pavé, voix X01.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Spec 058 retardée | Blocage | Moyenne | Ne pas brancher sur l'état de vue actuel |
| Confusions « vingt » / « vingt et un » | Erreur de saisie | Moyenne | Lexique dédié, confirmation |
| Usage faible | Effort perdu | Moyenne | Mesure d'usage X01 avant (Q1) |

## 23. Décisions architecturales
ADR 0008 (grammaires par jeu) ; ADR 0001 (reducer par jeu).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Jeux suivants | Capital, Killer, Gotcha en V2 ; après mesure | Après mesure d'usage de X01 et Cricket (P3) | — |
| Q2 | Cible hors Cricket annoncée | Proposée comme raté ; refusée | Proposée comme « raté (14) » avec mention, confirmée par le joueur | — |
| Q3 | Livrer en V2 ou V2.x | Lot 5 ; plus tard | Lot 5 si 058 et 075 sont livrées | — |

## 25. Traçabilité
Rapport 04 (§6.7, §8) ; compte rendu §F.4, §G ; specs 047, 051, 056, 058, 074, 075, 076 ; ADR 0001, 0008.
