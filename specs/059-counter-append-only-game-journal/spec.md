---
id: 059-counter-append-only-game-journal
v2_id: V2-ARCH-05
titre: Journal de partie append-only (undo persistant, correction)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P2
difficulte: M
recommandation: optionnel
lot: 5
poids: 15
depend_de: [V2-ARCH-04]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 059 — Journal de partie append-only (undo persistant, correction)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Audit V2 : rapport architecture §4.3, §6.5, CA-2, ADR provisoire « journal append-only » ; rapport TV §3 (P11) ; rapport jeux §3.1 (« pas d'annulation depuis l'écran VAINQUEUR », « pile d'undo non persistée ») ; compte rendu C.9 (« journal append-only (P2, granularité à décider) ») et arbitrage I (« journal événementiel prérequis de la TV → non »).
- Constitution transverse §2 : le scoring critique repose sur des commandes et événements explicites, des identifiants stables et l'idempotence.
- ADR liée : ADR-0004.

## 2. Problématique
L'annulation est une pile d'états en mémoire, perdue au rechargement, et aucune volée passée ne peut être corrigée sans annuler et ressaisir toutes les suivantes ; le compteur ne produit aucun événement identifiable exploitable par un futur contrat avec `Bougnat_Darts_Tournaments`.

## 3. Objectifs
- O1 : annulation qui survit au rechargement et traverse les fins de manche, de set et de match.
- O2 : correction d'une volée passée sans ressaisie des suivantes, avec recalcul cohérent.
- O3 : identifiants stables et séquence monotone par partie, compatibles avec un futur `ScoreEvent` côté BDT.
- O4 : aucune régression de performance perceptible.

## 4. État actuel vérifié dans le code
- [vérifié] X01 : pile `undoStack` de snapshots en mémoire (`views/MatchView.tsx:123`, `pushUndoSnapshot` l.297-307, `handleUndoAction` l.309-345) vidée à la restauration (l.147).
- [vérifié] Killer et Gotcha : piles d'états bornées à 20 et 30 (`views/KillerGameView.tsx:63`, `views/GotchaGameView.tsx:117`) ; Capital : action `undo` du reducer (`src/features/capital/capitalGameModel.ts:147-170`) ; Cricket : `CricketHistorySnapshot[]` (`views/CricketGameView.tsx:60`).
- [vérifié] `undoTurn` (`src/application/scoring/matchLifecycle.ts:293-316`) ne franchit pas une fin de manche ; il n'est utilisé que par `UndoThrow` (tests).
- [vérifié] `Turn` n'a ni identifiant ni numéro de séquence (`types.ts:27-33`) ; aucune volée n'est identifiable de façon stable.
- [vérifié] Aucune correction de volée passée n'existe dans l'interface.
- [hypothèse] `submitTurn` est déterministe (ni horloge ni aléa) : le rejeu reproduirait l'état ; le robot tire au hasard mais son résultat est figé dans la volée.

## 5. Comportement cible
Chaque partie possède un journal ordonné d'entrées immuables `{ gameId, seq, entryId, type, payload, source, at }`. L'état courant est le repli du journal par le reducer du jeu (spec 058) ; un instantané mis en cache évite de rejouer à chaque rendu. L'annulation ajoute une entrée `Undone{targetSeq}` ; la correction ajoute `VisitCorrected{supersedesSeq, payload}` ; l'état est recalculé par rejeu. Le journal est persisté avec la session (spec 010).

## 6. Périmètre
### Inclus
- Format du journal, identifiants, séquence, repli et rejeu.
- Annulation persistante (X01 d'abord, puis les jeux migrés par la spec 058).
- Correction d'une volée passée en X01 (interface minimale : liste des volées de la manche en cours, sélection, ressaisie).
- Annulation depuis l'écran de victoire X01 tant que les statistiques ne sont pas validées.
### Exclu
- Synchronisation, file d'opérations, envoi vers un serveur (constitution transverse §3 ; spec 109).
- Projection spectateur (spec 084) : elle reste fondée sur l'état courant ; le journal n'en est pas un prérequis (ADR-0005).
- Saisie fléchette par fléchette (dépend de Q1 et de la spec 046).
- Statistiques par source d'entrée (évolution ultérieure).

## 7. User stories
- En tant que joueur, je veux annuler la dernière volée même après un rechargement de la page.
- En tant que marqueur, je veux corriger un score saisi trois volées plus tôt sans ressaisir les suivantes.
- En tant qu'organisateur (futur), je veux que chaque volée ait un identifiant stable pour la rapprocher d'un résultat de tournoi.

## 8. Règles métier
- RM-01 : une entrée du journal n'est jamais modifiée ni supprimée pendant la partie.
- RM-02 : une correction remplace logiquement une volée ; si elle change l'issue d'une manche, les volées postérieures de cette manche sont invalidées et l'utilisateur en est averti avant confirmation (Q3).
- RM-03 : l'annulation après la fin du match rouvre le match tant que le résultat n'a pas été validé (envoi partenaire ou historique local).
- RM-04 : le résultat envoyé au partenaire (spec 030) est calculé depuis l'état final ; une fois envoyé, la partie n'est plus modifiable.

## 9. Parcours utilisateurs
1. Annulation : bouton « Retour » inchangé ; fonctionne aussi après rechargement.
2. Correction : depuis les statistiques de la manche en cours (ou un appui long sur l'historique), choisir la volée, saisir le bon score, confirmer ; retour visuel « Correction appliquée ».

## 10. Exigences fonctionnelles
- FR-01 : chaque commande validée produit une entrée de journal avec `seq` strictement croissant et `entryId` unique (`createId`, `src/shared/ids/createId.ts`).
- FR-02 : l'horodatage `at` et l'aléa éventuel sont fournis par la couche application, jamais lus dans le reducer.
- FR-03 : `replay(journal)` reconstruit l'état courant ; un instantané en cache (tous les N entrées, Q4) borne le coût.
- FR-04 : `Undone{targetSeq}` annule la dernière entrée active, y compris à travers une fin de manche, de set ou de match.
- FR-05 : `VisitCorrected{supersedesSeq}` remplace une volée passée ; l'état est recalculé par rejeu.
- FR-06 : le journal et l'instantané sont persistés dans l'enveloppe de session de la spec 010 et restaurés avec elle.
- FR-07 : chaque entrée porte la `source` de la commande (spec 057 : `keypad`, `voice`, `bot`, …).
- FR-08 : X01 en premier ; les autres jeux adoptent le journal une fois migrés par la spec 058.

## 11. Exigences non fonctionnelles
- NFR-01 : rejeu d'une partie de 500 entrées en moins de 16 ms sur tablette d'entrée de gamme [à mesurer].
- NFR-02 : taille persistée bornée (Q4) ; pas d'impact sur le quota de stockage au-delà de la partie en cours.
- NFR-03 : aucune dépendance npm ; coût récurrent 0 €.
- NFR-04 : aucune donnée envoyée hors de l'appareil.

## 12. Cas nominaux et alternatifs
- Nominal : 501, 5 volées, rechargement, « Retour » → la 5ᵉ volée est annulée.
- Alternatif : correction de la 2ᵉ volée de 60 à 45 → restes recalculés, joueur courant inchangé.
- Alternatif : annulation de la volée gagnante d'une manche → la manche est rouverte.

## 13. Cas limites
Correction qui rend une volée ultérieure bust ou gagnante ; correction pendant la transition de manche ; journal restauré incohérent (version inconnue) → règle de la spec 010 ; robot dans la partie (le score du robot est rejoué tel quel, pas retiré au sort).

## 14. Gestion des erreurs
Rejeu impossible (entrée invalide) : l'état reste sur le dernier instantané valide, un message propose de continuer depuis ce point ; erreur journalisée en développement.

## 15. Impacts architecturaux
Domaine : types d'entrées et fonction de repli par jeu (sur le reducer de la spec 058). Application : `useGameSession` ajoute les entrées, gère l'instantané et l'annulation. Pas de bus d'événements, pas de store dédié (ADR-0004 option 2).

## 16. Impacts sur les données et les interfaces
- Nouveau champ `journal` (et `snapshot`) dans l'enveloppe persistée (spec 010, nouvelle `schemaVersion`).
- Format candidat à l'alignement avec le `ScoreEvent` de BDT (spec 109) ; non public tant que la spec 109 n'est pas validée.

## 17. Compatibilité avec l'existant
Sessions sans journal : l'instantané existant sert de point de départ, l'annulation n'est possible qu'à partir des nouvelles entrées. Contrat `v=1` inchangé.

## 18. Dépendances
- Prérequis : V2-ARCH-04 (058) ; enveloppe persistée de V2-ARCH-06 (010).
- Liens : V2-ARCH-03 (057, `source`), V2-INT-07 (109, contrat BDT), V2-TV-02 (084, badge « Correction »), V2-GAMES-06 (049, sémantique d'annulation commune), V2-GAMES-04 (047, annulation fin Cricket).

## 19. Critères d'acceptation
- AC-01 : X01 501, 5 volées, rechargement de la page, « Retour » → l'état est celui après 4 volées (E2E).
- AC-02 : pour toutes les fixtures X01 de la spec 039, `replay(journal)` est égal à l'état obtenu commande par commande (test de propriété).
- AC-03 : annuler la volée gagnante d'une manche rouvre la manche avec les scores d'avant (test unitaire).
- AC-04 : corriger la volée n-3 recalcule les restes des volées suivantes et conserve le joueur courant (test unitaire + composant).
- AC-05 : depuis l'écran de victoire X01, « Retour » rouvre le match tant que les statistiques n'ont pas été validées (test de composant).
- AC-06 : rejeu de 500 entrées mesuré sous 16 ms sur l'appareil de référence de la spec 042 [à confirmer sur appareil].

## 20. Scénarios de tests
Unitaires (repli, annulation, correction, frontières de manche/set/match) ; propriété « rejeu = état » ; composant (correction, victoire) ; E2E reload + annulation ; mesure de performance.

## 21. Exigences de non-régression
Golden tests 039 ; E2E X01 et partenaire ; comportement de « Retour » sur la saisie en cours (effacement de chiffre, annulation de confirmation) inchangé.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Sur-ingénierie (event sourcing complet) | Moyen | Moyenne | Tableau typé + rejeu, pas de bus ni de projections multiples |
| Format figé trop tôt (volée vs fléchette) | Élevé | Moyenne | Décider Q1 avant implémentation ; `schemaVersion` |
| Correction qui change l'issue d'une manche | Moyen | Faible | RM-02 : avertissement et confirmation |

## 23. Décisions architecturales
- ADR-0004 (journal append-only) — décision principale.
- ADR-0001 (reducers rejouables), ADR-0003 (persistance versionnée), ADR-0005 (la projection spectateur ne dépend pas du journal).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Granularité (H.11) | Volée / fléchette | Volée en V2 ; fléchette seulement si la spec 046 retient la saisie par fléchette | — |
| Q2 | Faire cette spec en V2 | Lot 5 / avancer au lot 2 / rejeter | Lot 5 ; en repli, persistance d'une pile bornée via 010 (spec 058 Q3) | — |
| Q3 | Correction changeant l'issue d'une manche | Interdire / invalider les volées postérieures avec confirmation | Invalider avec confirmation explicite | — |
| Q4 | Fréquence d'instantané et borne | Tous les 50 / par manche | Par manche (simple, aligné sur l'affichage) | — |
| Q5 | Exposer la correction en Cricket/Killer/Gotcha | Oui en V2 / plus tard | Plus tard ; annulation persistante seulement | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` §4.3, §6.5, CA-2 ; `reports/07-tv-mode.md` §3 P11 ; `reports/03-games.md` §3.1 ; compte rendu C.9, H.11, I.
- Specs liées : 010, 030, 039, 042, 046, 047, 049, 057, 058, 084, 109.
- Code vérifié au commit `508dfa6`.
