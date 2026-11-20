---
id: 054-counter-impossible-totals-validation
v2_id: V2-GAMES-30
titre: Refus des totaux impossibles (Gotcha, Capital)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P1
difficulte: S
recommandation: recommande
lot: 2
poids: 45
depend_de: [V2-ARCH-03]
remplace: []
remplacee_par: []
issue: '#236'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 054 — Refus des totaux impossibles (Gotcha, Capital)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Rapport `03-games.md` §3.3 et §3.6, compte rendu §C.5 : le X01 refuse les totaux de visite irréalisables en 3 fléchettes, mais le Gotcha et l'objectif « Capital » du jeu Capital acceptent 179, 178, etc. Dans le même keypad Capital, les doubles et triples changent de couleur d'un objectif à l'autre.

## 2. Problématique

Une faute de frappe (179 au lieu de 79) est enregistrée sans alerte, alors que la règle existe déjà dans le code X01 ; les couleurs incohérentes des multiplicateurs augmentent le risque d'erreur de saisie.

## 3. Objectifs

- Une seule règle « total de visite réalisable » utilisée par X01, Gotcha et Capital.
- Retour explicite « SCORE IMPOSSIBLE » dans les trois jeux.
- Une convention de couleur unique pour simple / double / triple / bull / double bull dans les keypads Capital, alignée sur le Cricket en attendant les couleurs métier du design system.

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | Gotcha : seule la plage 0-180 est contrôlée | `src/domain/gotcha/gotcha.ts:63-68` ; saisie bornée à 180 `views/GotchaGameView.tsx:122-128` | [vérifié] ; 179 accepté (rapport 03, exécution en mémoire) |
| C2 | Capital : objectif « Capital » accepte 0-180 | `components/game/CapitalKeypad.tsx:66-75` (l. 72), `views/CapitalGameView.tsx:97` | [vérifié] |
| C3 | Totaux irréalisables en 3 fléchettes : 163, 166, 169, 172, 173, 175, 176, 178, 179 | calcul exhaustif en mémoire | [vérifié] |
| C4 | La règle existe deux fois : domaine `isPossibleThreeDartTurnScore` (non branché à l'UI X01) et `POSSIBLE_TURN_SCORES` (features X01) | `src/domain/scoring/valueObjects/ScoreInput.ts:49-51`, `src/features/x01/scoring/possibleTurnScores.ts:1-20` | [vérifié] |
| C5 | Capital, mode cible complète : double vert (emerald), triple rouge, simple bleu | `components/game/CapitalKeypad.tsx:82-86` | [vérifié] |
| C6 | Capital, objectif « Double » : boutons emerald ; objectif « Triple » : orange ; objectif numéroté : D cyan, T orange | `CapitalKeypad.tsx:307,335,424-426` | [vérifié] |
| C7 | Cricket : D cyan, T orange, bull vert, double bull rouge `#d90416` | `components/game/CricketKeypad.tsx:54,70,84,91-93` | [vérifié] |
| C8 | Rouge/vert sont aussi les couleurs réelles des anneaux de la cible, utilisées par l'objectif « Couleur » | `utils/capitalLogic.ts:55-67` | [vérifié] |

## 5. Comportement cible

Un total irréalisable est refusé avant enregistrement, avec le message « SCORE IMPOSSIBLE », dans le Gotcha et pour l'objectif Capital ; la saisie reste modifiable. Les boutons D et T ont la même couleur dans tous les keypads Capital (et Cricket).

## 6. Périmètre

### Inclus
Domaine Gotcha, keypad et vue Capital (objectif Capital), keypad Gotcha (aperçu), convention de couleurs des keypads Capital.

### Exclu
X01 (déjà conforme, unification de la source traitée par la spec 057) ; refonte des tokens (V2-DS-01/04, specs 063/066) ; Killer (saisie par double, sans total).

## 7. User stories

- En tant que marqueur, je veux être alerté si je tape 179, afin de corriger avant que le score soit faussé.
- En tant que joueur, je veux que le bouton « double » ait toujours la même couleur, afin de ne pas me tromper de touche.

## 8. Règles métier

- RM-01 Un total de visite est valable s'il vaut 0 ou s'il est réalisable avec 3 fléchettes au plus (simples 1-20, doubles, triples, 25, 50).
- RM-02 La règle est définie une seule fois, dans le domaine (`src/domain/scoring`), et réutilisée par tous les jeux à saisie de total.
- RM-03 Convention de couleur (proposée, provisoire jusqu'à la spec 066) : simple neutre, double cyan, triple orange, bull vert, double bull rouge — identique au Cricket.

## 9. Parcours utilisateurs

Gotcha : saisie « 179 » → l'aperçu affiche « Score impossible » et « Valider » est inactif (ou refus au clic, Q1) ; correction → validation normale. Capital : idem sur l'objectif Capital.

## 10. Exigences fonctionnelles

- FR-01 `recordGotchaTurn` refuse un total irréalisable (journal « Visite refusée… ») sans changer l'état.
- FR-02 L'aperçu Gotcha signale un total irréalisable avant validation.
- FR-03 Le keypad Capital refuse un total irréalisable pour l'objectif Capital et affiche le message.
- FR-04 Les trois jeux utilisent la même fonction de domaine (RM-02).
- FR-05 Les keypads Capital appliquent RM-03 dans tous les modes.

## 11. Exigences non fonctionnelles

- NFR-01 Le domaine Gotcha n'importe rien de `src/features/` (sens des dépendances).
- NFR-02 Contraste des couleurs ≥ 4,5:1 pour le texte des boutons (WCAG AA) [à mesurer].
- NFR-03 Aucun coût récurrent.

## 12. Cas nominaux et alternatifs

Total valable → inchangé. Total irréalisable → refus + correction. Total 0 → valable (visite ratée).

## 13. Cas limites

180 (valable) ; 163 ; saisie partielle « 17 » avant « 9 » (pas de message tant que la saisie n'est pas complète — Q1) ; score cible Gotcha atteint avec un total irréalisable (refusé).

## 14. Gestion des erreurs

Message unique « SCORE IMPOSSIBLE », identique au X01 (`src/features/x01/scoring/matchSubmission.ts:52-54`).

## 15. Impacts architecturaux

Réutilisation de `isPossibleThreeDartTurnScore` (domaine) ; suppression de la duplication côté features par la spec 057. Aucune nouvelle abstraction.

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée modifiée.

## 17. Compatibilité avec l'existant

Changement de comportement limité aux saisies erronées ; parcours de base inchangé.

## 18. Dépendances

- V2-ARCH-03 (spec 057) : source unique de la règle des totaux (peut être livrée dans la même PR si la spec 057 n'est pas prête : utiliser directement la fonction de domaine existante).
- Liées : V2-DS-04 (spec 066, couleurs métier), V2-GAMES-13 (spec 053), V2-GAMES-26 (spec 050).

## 19. Critères d'acceptation

- AC-01 Gotcha : 179 refusé, score et joueur courant inchangés ; 180 accepté.
- AC-02 Capital, objectif Capital : 179 refusé avec message ; 60 accepté.
- AC-03 Les 9 totaux irréalisables sont refusés dans les deux jeux (test paramétré).
- AC-04 Une seule implémentation de la règle dans `src/` (recherche du calcul des totaux : 1 module).
- AC-05 Dans tous les modes du keypad Capital, D et T ont les couleurs de RM-03 (test de composant sur les classes ou tokens).

## 20. Scénarios de tests

Unitaires `tests/unit/gotchaLogic.test.ts`, `tests/unit/capitalGameModel.test.ts` ; composant keypad Capital (refus, couleurs) ; E2E Gotcha saisie 179.

## 21. Exigences de non-régression

Saisies valables Gotcha/Capital/X01 ; objectif « Couleur » (logique inchangée).

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Couleurs provisoires remplacées par la spec 066 | Faible | Élevée | RM-03 explicitement provisoire |
| Import inverse domaine → features | Moyen | Faible | NFR-01, garde ESLint (spec 056) |

## 23. Décisions architecturales

Aucune ADR ; s'inscrit dans la spec 057.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Moment du refus | a) au clic « Valider » avec message ; b) dès la frappe (bouton inactif) | b) pour Gotcha (aperçu existant), a) pour Capital | — |
| Q2 | Convention de couleur provisoire | a) alignée Cricket (cyan/orange) ; b) attendre la spec 066 | a) — corrige l'incohérence immédiatement | — |

## 25. Traçabilité

Rapport `03-games.md` §3.3, §3.6, §5.7 ; compte rendu §C.5 ; specs 050, 053, 056, 057, 066.
