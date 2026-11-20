---
id: 045-counter-x01-checkout-rules-compliance
v2_id: V2-GAMES-01
titre: X01 — conformité des sorties (finishes impossibles, Master-Out, aide checkout)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 100
depend_de: [V2-QA-01]
remplace: []
remplacee_par: []
issue: '#204'
verifie_au_commit: 0c9ab98
derniere_revue: 2026-11-20
---

# 045 — X01 : conformité des sorties (finishes impossibles, Master-Out, aide checkout)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #204, branche `feat/v2-audit-specs-et-corrections`). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la validation terrain reste à faire (`validation: en-attente`).

## 1. Origine et contexte

Revue fonctionnelle des jeux (rapport `03-games.md` §3.1, compte rendu V2 §C.5) : trois règles de sortie du X01 ne sont pas respectées, alors que le X01 est le jeu le plus utilisé et le seul exposé aux partenaires (spec 030). Le défaut touche aussi le 501 embarqué du Triathlon et le robot (spec 016).

## 2. Problématique

Le compteur valide une victoire que les règles interdisent (ex. finir 180 en Double-Out), ne déclare pas « trop » un reste de 1 en Master-Out (le robot peut alors rester bloqué indéfiniment) et affiche une aide de sortie Double-Out quelle que soit la règle choisie.

## 3. Objectifs

- 0 victoire acceptée sur un total non finissable selon la règle de fermeture (Open / Double / Master).
- Reste de 1 traité comme « trop » en Double-Out **et** en Master-Out, dans le moteur, le bouton RESTE et le robot.
- Aide de sortie cohérente avec la règle de fermeture active.
- Nombre minimal de fléchettes de sortie exact pour les trois règles (boutons de confirmation et statistiques).

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Un total égal au reste ouvre la confirmation de sortie sans vérifier qu'il est finissable | `src/features/x01/scoring/matchSubmission.ts:59-61` | [vérifié] |
| C2 | Seuls les totaux impossibles en 3 fléchettes sont refusés ; en Double-Out, 159, 162, 165, 168, 171, 174, 177 et 180 sont donc acceptés comme sorties | `matchSubmission.ts:52` ; calcul exhaustif exécuté en mémoire (aucune écriture dans le repo) | [vérifié] |
| C3 | La fonction `isCheckoutPossible` existe mais ne sert qu'à l'appui long du keypad | `src/features/x01/scoring/checkoutEligibility.ts:5-15`, `views/MatchView.tsx:533`, `components/game/Keypad.tsx:59,111,123` | [vérifié] |
| C4 | La garde `if (!isCheckoutPossible) return;` teste la référence de fonction, toujours vraie | `views/MatchView.tsx:429` | [vérifié] |
| C5 | Le bust n'est calculé que pour `< 0` ou `= 1` en Double-Out ; le Master-Out laisse un reste de 1 | `src/application/scoring/matchLifecycle.ts:264` ; même règle dans `src/domain/scoring/services/ScoringRules.ts:16` (non branché à l'UI) | [vérifié] |
| C6 | Le bouton RESTE refuse un reste de 1 en Double-Out seulement | `views/MatchView.tsx:409-412` | [vérifié] |
| C7 | Le robot vise au plus `reste − 1` hors Double-Out, laisse 1 en Master-Out, puis joue 0 indéfiniment (`maxScore = 0`) | `src/application/x01Bot/x01BotTurn.ts:83-86,110-113` | [vérifié] ; 191/200 tirages à 4 pts laissent 1 (rapport 03, exécution en mémoire) |
| C8 | Le simple bull (25) est accepté comme fléchette finale en Master-Out | `x01BotTurn.ts:22-26`, `src/application/scoring/matchStats.ts:293-298` | [vérifié] |
| C9 | `getMinDartsForScore` : en Open, tout reste ≤ 60 vaut « 1 fléchette » (faux pour 23, 29, 31…59) ; en Master, 103-119 (9 valeurs) annoncés en 2 fléchettes au lieu de 3 | `matchStats.ts:282-300` ; écarts calculés en mémoire | [vérifié] |
| C10 | L'aide de sortie lit `CHECKOUT_GUIDE` (table Double-Out, 162 entrées) sans connaître la règle ; libellé anglais « Checkout Path » ; désactivée par défaut | `components/game/CheckoutHint.tsx:8-16`, `components/match/MatchStatusPill.tsx:47`, `views/MatchView.tsx:107` | [vérifié] |
| C11 | Les bogeys Double-Out sont dupliqués 4 fois | `checkoutEligibility.ts:3`, `ScoringRules.ts:4`, `matchStats.ts:4`, `x01BotTurn.ts:11` | [vérifié] |
| C12 | La voix passe par la même soumission que le keypad, mais son parseur rejette un score supérieur au reste (bust annoncé refusé) | `views/MatchView.tsx:383-385` ; `src/features/x01/voice/dartsSpeechParserShared.ts:131-133` | [vérifié] |

## 5. Comportement cible

- Quand le total saisi égale le reste : si le reste est finissable selon la règle de fermeture, la confirmation « Fléchettes utilisées » s'ouvre comme aujourd'hui ; sinon la visite est enregistrée comme **trop** (score 0, reste inchangé) avec un retour explicite « SORTIE IMPOSSIBLE ».
- En Master-Out, un reste de 1 après la visite est un trop, comme en Double-Out.
- Le robot ne laisse jamais un reste non finissable et ne joue jamais une sortie interdite.
- L'aide de sortie affiche un chemin valable pour la règle active, ou rien.

## 6. Périmètre

### Inclus
Moteur X01 (soumission, bust), bouton RESTE, appui long, confirmation de sortie, robot, `getMinDartsForScore`, aide de sortie, 501 du Triathlon (par héritage), tests associés.

### Exclu
Ouverture Double/Master-In (spec 046, V2-GAMES-02) ; touche « TROP » explicite et sémantique d'annulation (cadre commun, spec 049) ; normalisation du format Sets ; refonte du parseur vocal (spec 003, V2-VOICE-01) ; saisie fléchette par fléchette.

## 7. User stories

- En tant que joueur de club, je veux que le compteur refuse une victoire impossible en Double-Out, afin que le résultat transmis au tournoi soit valable.
- En tant que joueur contre le robot en Master-Out, je veux que la partie se termine toujours, afin de ne pas être bloqué.
- En tant que débutant, je veux une aide de sortie adaptée à la règle choisie, afin d'apprendre les bonnes combinaisons.

## 8. Règles métier

- RM-01 Double-Out : un reste est finissable s'il est dans [2 ; 170] hors {159, 162, 163, 165, 166, 168, 169} (source : Wikipedia DE « Darts », bogey numbers).
- RM-02 Master-Out : la dernière fléchette est un double, un triple ou le double bull ; un reste est finissable s'il est dans [2 ; 180] et réalisable en 3 fléchettes (exclut 163, 166, 169, 172, 173, 175, 176, 178, 179). Source : Wikipedia DE « Darts » (Master Out = Double Out + Triple).
- RM-03 Open : tout reste dans [1 ; 180] réalisable en 3 fléchettes est finissable.
- RM-04 Un reste de 1 après une visite est un trop en Double-Out et en Master-Out (sources : Wikipedia EN « Darts » §Bust ; Wikipedia DE « Darts »).
- RM-05 Un total égal au reste mais non finissable selon RM-01/02 est un trop (la dernière fléchette n'était pas une sortie valable).
- RM-06 Le nombre minimal de fléchettes proposé à la confirmation est le minimum réel pour la règle active.
- RM-07 Le simple bull (25) n'est pas une sortie Master-Out — **sous réserve de Q1**.

## 9. Parcours utilisateurs

1. Double-Out, reste 180 : le joueur saisit 180 puis OK → retour « SORTIE IMPOSSIBLE », visite enregistrée à 0, main au joueur suivant ; « Retour ↶ » annule la visite.
2. Master-Out, reste 4 : saisie 3 → trop, reste 4 conservé.
3. Master-Out, reste 40, aide activée : l'aide affiche une sortie Master (ex. « D20 »).

## 10. Exigences fonctionnelles

- FR-01 La soumission d'un total égal au reste vérifie la finissabilité (RM-01 à RM-03) avant d'ouvrir la confirmation ; sinon elle applique RM-05.
- FR-02 Le moteur applique RM-04 pour Double et Master ; l'implémentation domaine `ScoringRules` (si conservée par la spec 057) applique la même règle.
- FR-03 Le bouton RESTE refuse un reste cible de 1 en Double-Out et Master-Out.
- FR-04 L'appui long de sortie utilise la même fonction de finissabilité ; la garde de `MatchView.tsx:429` est corrigée.
- FR-05 Le robot borne ses visites de placement pour laisser un reste finissable (≥ 2 en Double et Master) et n'utilise que les fléchettes finales autorisées.
- FR-06 `getMinDartsForScore` est exact pour Open, Double et Master (tables calculées, pas d'heuristique par seuil).
- FR-07 L'aide de sortie reçoit la règle de fermeture ; en Double-Out elle réutilise `CHECKOUT_GUIDE` ; en Master-Out et Open elle affiche une route calculée ou rien (selon Q3) ; le libellé est en français (coordination spec 013).
- FR-08 Une seule fonction pure de finissabilité (bogeys compris) est utilisée par le moteur, le keypad, le robot et les statistiques.

## 11. Exigences non fonctionnelles

- NFR-01 Règles dans `src/domain` ou `src/application` (aucune règle dans une vue), sans dépendance React.
- NFR-02 Aucun coût récurrent, aucune dépendance nouvelle.
- NFR-03 Calcul des tables au chargement du module < 5 ms sur appareil d'entrée de gamme [à confirmer par mesure].

## 12. Cas nominaux et alternatifs

- Nominal : sortie valable → confirmation 1/2/3 fléchettes filtrée par le minimum réel.
- Alternatif : sortie impossible → trop + retour visuel ; voix : la proposition vocale suit la même règle une fois validée.

## 13. Cas limites

- Reste 170 en Double-Out (sortie maximale) : accepté. Reste 2 : accepté (D1).
- Open, reste 1 : finissable en 1 fléchette.
- Match restauré (session persistée avant correctif) avec une équipe à 1 en Master-Out : voir Q4.
- Triathlon : le 501 Double-Out hérite du correctif sans changement de configuration.

## 14. Gestion des erreurs

Retour « SORTIE IMPOSSIBLE » (type `bust`) distinct de « SCORE IMPOSSIBLE » (total irréalisable) ; aucun message technique.

## 15. Impacts architecturaux

Fonction de finissabilité unique côté domaine ; `features/x01/scoring` et `application/x01Bot` la consomment (corrige au passage l'import inverse `x01BotTurn.ts:4` si la spec 057 le prévoit). Pas de nouvelle abstraction.

## 16. Impacts sur les données et les interfaces

Aucun changement de schéma (`Turn.isBust` existe déjà). Contrat `v=1` (spec 030) inchangé : seuls des résultats conformes peuvent désormais être renvoyés.

## 17. Compatibilité avec l'existant

Changement de comportement volontaire : des victoires auparavant acceptées deviennent des trops. Les statistiques d'historique local ne sont pas recalculées.

## 18. Dépendances

- V2-QA-01 (spec 039) : golden tests validés métier avant modification.
- Coordination : V2-ARCH-03 (spec 057, source unique des règles), V2-VOICE-01 (spec 003, bust vocal), V2-GAMES-26 (spec 050, règles de référence), spec 016 (robot), spec 023 (opportunités de sortie).

## 19. Critères d'acceptation

- AC-01 Double-Out, reste 180, saisie 180 → visite trop, reste 180, aucune confirmation ; idem pour 159, 162, 165, 168, 171, 174, 177 (test paramétré).
- AC-02 Double-Out, reste 170, saisie 170 → confirmation proposant uniquement « 3 ».
- AC-03 Master-Out, reste 4, saisie 3 → trop ; RESTE avec cible 1 → « SCORE RESTANT IMPOSSIBLE ».
- AC-04 Robot Master-Out (5 niveaux, 10 000 tirages simulés, graine fixe) : aucun reste de 1, toute manche se termine.
- AC-05 `getMinDartsForScore` égale la valeur calculée exhaustivement pour les 3 règles et tous les restes 2-180.
- AC-06 Aide activée en Master-Out, reste 40 → route se terminant par un double ou un triple ; en Open, route valable ou aucune aide (selon Q3).
- AC-07 Un seul module définit les bogeys (recherche `159, 162` dans `src/` : 1 occurrence).
- AC-08 501 du Triathlon : AC-01 vérifié dans l'épreuve.

## 20. Scénarios de tests

Unitaires : moteur (`tests/unit/application/matchLifecycle.test.ts`), soumission (`tests/unit/x01/matchScoring.test.ts`), robot (`tests/unit/x01/x01BotTurn.test.ts`), stats (`tests/unit/application/matchStats.test.ts`). Composant : aide de sortie selon règle. E2E : partie Double-Out avec tentative 180 (`tests/e2e`).

## 21. Exigences de non-régression

Sorties valables inchangées ; undo d'un trop ; lien externe (spec 030) ; voix ; robot Double-Out (spec 016) ; statistiques de la spec 023.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Joueur ayant fini sur une faute de frappe (ex. 180 au lieu de 18) voit un trop | Faible | Moyenne | Retour explicite + undo |
| Divergence entre chemins (keypad, voix, robot) | Moyen | Moyenne | FR-08 + golden tests |
| Session restaurée bloquée à 1 | Faible | Faible | Q4 |

## 23. Décisions architecturales

Pas d'ADR propre ; s'inscrit dans l'ADR « règles X01 uniques » porté par la spec 057.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Le simple bull (25) termine-t-il en Master-Out ? | a) non (double/triple/double bull) ; b) oui (variante maison) | a) — conforme à la définition usuelle | — |
| Q2 | Sortie impossible : trop direct ou demande de confirmation ? | a) trop direct + undo ; b) dialogue « compter comme trop ? » ; c) refus de saisie | a) — une seule action, cohérente avec « TROP ! » | — |
| Q3 | Aide de sortie en Open/Master | a) routes calculées ; b) aucune aide hors Double-Out | a) si coût < 1 jour, sinon b) | — |
| Q4 | Session restaurée avec un reste de 1 en Master-Out | a) convertir la dernière visite en trop au chargement ; b) laisser undo/abandon | a) migration pure et testée | — |
| Q5 | Activer l'aide par défaut ? | a) non (inchangé) ; b) oui | a) — hors périmètre, à traiter avec 049 | — |

## 25. Traçabilité

Rapport `03-games.md` §3.1, §8 (V2-GAMES-01, V2-GAMES-17 fusionnée) ; `04-voice.md` P4 ; compte rendu §C.5 et §H ; specs 016, 023, 030, 039, 050, 057.

## Implémentation (2026-11-20)

- Issue #204 ; vérifiée au commit `0c9ab98` (branche `feat/v2-audit-specs-et-corrections`).
- Décisions appliquées : recommandations de la section « Questions ouvertes ».
- Test de reproduction écrit avant la correction (échec constaté), puis correction ; revue indépendante « OK avec réserves », réserves traitées.
- Vérifications : typecheck, lint, tests unitaires et couverture, gouvernance de couverture, `guard:clean` et build au vert ; `lint:type-aware` ne signale qu'une erreur préexistante (`tests/unit/components/keypads.test.tsx:47`).
- Reste à faire : recette sur appareils réels et tests E2E correspondants (spec 040).

