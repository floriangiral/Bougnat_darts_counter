---
id: 039-counter-qa-golden-rules-characterization
v2_id: V2-QA-01
titre: Golden tests de règles et tests de caractérisation par jeu
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: qualite
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 40
depend_de: []
remplace: []
remplacee_par: []
issue: '#218'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-26
---

# 039 — Golden tests de règles et tests de caractérisation par jeu

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

L'audit V2 proposait d'extraire la logique de jeu des vues React vers des moteurs purs (V2-ARCH-03, spec 057 ; V2-ARCH-04, spec 058) et de protéger ces changements par un **filet de non-régression avant extraction**, sans « figer » les bugs de règles connus (compte rendu V2, §C.5). Depuis l'audit, la reprise 010 et les corrections 045/046/047/048/054 sont livrées ; le septième jeu, 180 Around the Clock, a également été ajouté. Le périmètre et les exemples de cette proposition doivent donc être réévalués avant validation.

## 2. Problématique

Des tests de règles, de vues et de reprise existent déjà, ainsi que des scénarios de référence pour certains usages. Ils ne constituent pas nécessairement le corpus commun proposé ici : il faut d'abord cartographier leur couverture et les réutiliser, afin de protéger les extractions sans transformer un comportement incorrect en règle métier.

## 3. Objectifs

- O1 : disposer, pour les jeux retenus au périmètre, de **scénarios de référence (fixtures)** rejouables contre le moteur actuel puis contre le futur moteur, sans réécriture.
- O2 : distinguer explicitement le **comportement validé métier** du **comportement actuel connu comme faux**, pour ne jamais transformer un bug en règle.
- O3 : détecter automatiquement toute **mutation d'état d'entrée** par un moteur (prérequis de la TV, de l'undo et du rejeu).
- O4 : caractériser le comportement des **vues de jeu** (saisie, annulation, fin de partie) avant leur découpage.

## 4. État actuel vérifié dans le code

Relevé partiel au commit `7b454d3` ; le reste de la couverture est à inventorier avant validation.

- Le chemin X01 joué passe par `src/features/x01/scoring/matchSubmission.ts` et `src/application/scoring/matchLifecycle.ts`. Les modules `src/domain/scoring/x01CheckoutRules.ts` et `x01OpeningRules.ts` sont utilisés en production ; les anciens services `ScoringRules` et `ScoreValidator` servent les use cases historiques et leurs tests, dont le sort relève de 056/057.
- Les corrections 045 et 046 traitent les sorties impossibles, Master-Out et les ouvertures Double/Master-In. Les tests `tests/unit/x01/matchScoring.test.ts`, `matchViewCheckoutRules.test.tsx` et `matchViewOpening.test.tsx` en couvrent déjà des cas. Ces défauts historiques ne doivent plus être présentés comme des bugs ouverts.
- `finishLeg` copie les compteurs `legsWon` et `setsWon` avant de les modifier (`src/application/scoring/matchLifecycle.ts`). Une vérification d'immuabilité plus systématique reste une proposition, et non la preuve qu'une mutation est encore présente.
- Les vues Killer et Gotcha ont des tests dans `tests/unit/components/` ; 180 Around the Clock a des tests de domaine, de vue et de reprise dans `tests/unit/atc180/`. Les instantanés de reprise multi-jeux sont livrés par 010.
- `tests/unit/triathlonScoringGolden.test.ts` contient déjà des scénarios de référence. Aucun dossier commun `tests/unit/golden/` n'est présent à cette révision ; l'inventaire devra éviter les doublons.
- Le robot accepte une source d'aléa injectable (`src/application/x01Bot/x01BotTurn.ts`), permettant des scénarios déterministes.

## 5. Comportement cible

Un dossier de scénarios par jeu, versionné avec le code. Chaque scénario décrit une configuration, une suite d'entrées joueur et les états attendus. Un exécuteur Vitest par jeu rejoue chaque scénario à travers un **adaptateur** branché sur le moteur actuel ; après V2-ARCH-04, seul l'adaptateur change. Chaque scénario porte un **verdict** :

- `valide-metier` : règle confirmée par le product owner ; le test doit passer ;
- `bug-connu` : l'attendu décrit la **règle correcte** ; tant que le correctif n'est pas livré, le test est déclaré « doit échouer » (`test.fails` de Vitest) avec la référence de la spec corrective ; si le moteur est corrigé, le test signale qu'il faut retirer le marqueur ;
- `a-decider` : règle en attente d'arbitrage ; le scénario est listé mais ignoré (`test.todo`) jusqu'à la décision.

En complément, des **tests de caractérisation de vues** (Testing Library, jsdom) jouent une courte partie par jeu via le clavier rendu et vérifient ce que voit le joueur.

## 6. Périmètre

### Inclus
- Scénarios de règles pour X01 (y compris robot à aléa fixé), Cricket, Capital, Killer, Gotcha, Triathlon ; l'ajout de 180 Around the Clock reste à arbitrer en Q6.
- Tests d'immuabilité (gel profond des entrées) et de déterminisme (même entrée → même sortie) des moteurs.
- Tests de caractérisation des vues des jeux retenus, en réutilisant les tests existants.
- Format de scénario, conventions de nommage, processus de validation métier.

### Exclu
- Correction des bugs eux-mêmes (specs 045, 046, 047, 048, 054, 057).
- Parcours de bout en bout navigateur (V2-QA-04, spec 040).
- Corpus vocal (V2-VOICE-03, spec 074) et contrat de projection TV (V2-TV-02, spec 084), qui pourront réutiliser les scénarios.
- Rédaction des règles de référence (V2-GAMES-26, spec 050) : cette spec fournit l'outil, 050 fournit le texte.

## 7. User stories

- En tant que contributeur, je veux rejouer les mêmes scénarios avant et après une extraction de moteur, afin de prouver que le comportement n'a pas changé.
- En tant que product owner, je veux relire des scénarios lisibles (noms français, règles citées), afin de valider ou refuser une règle sans lire le code.
- En tant que joueur, je veux qu'une mise à jour ne change jamais silencieusement le résultat d'une partie.

## 8. Règles métier

- RM-01 Un scénario `valide-metier` ne peut être modifié qu'avec l'accord explicite du product owner (mention dans la PR).
- RM-02 Un comportement connu comme faux n'est jamais enregistré comme attendu ; il est enregistré comme `bug-connu` avec l'attendu correct.
- RM-03 Toute règle « maison » (Capital 17 objectifs, barème Triathlon…) indique sa source (`maison`, `référence`, `décision PO du AAAA-MM-JJ`).
- RM-04 Les scénarios sont indépendants de l'interface : ils ne contiennent ni libellé d'écran ni sélecteur.

## 9. Parcours utilisateurs

Parcours contributeur : (1) lire le scénario du jeu concerné ; (2) modifier le moteur ; (3) lancer `npm run test:unit` ; (4) si un scénario `valide-metier` casse, corriger le code ou ouvrir une demande de changement de règle ; (5) si un `bug-connu` passe, retirer le marqueur et passer le verdict à `valide-metier` dans la même PR.

## 10. Exigences fonctionnelles

- FR-01 Un format de scénario typé commun (identifiant stable `JEU-RÈGLE-NNN`, titre français, règle citée, source, verdict, spec corrective éventuelle, configuration, entrées, attendus intermédiaires et finaux).
- FR-02 Un exécuteur par jeu dans `tests/unit/golden/`, exécuté par `npm run test:unit` sans configuration supplémentaire.
- FR-03 Un adaptateur par jeu isolant l'appel au moteur ; pour X01, il passe par `buildScoreSubmissionResult`/`buildCheckoutConfirmResult` (chemin réel), et non par les anciens use cases non branchés. Ce chemin utilise les règles actives de `src/domain/scoring`.
- FR-04 Couverture minimale proposée (à valider) : X01 ≥ 25 scénarios (Open/Double/Master Out, bust, finitions impossibles, legs, sets, doublettes, alternance du premier joueur, annulation), Cricket ≥ 12, Capital ≥ 10, Killer ≥ 8, Gotcha ≥ 8, Triathlon ≥ 8, robot ≥ 4 (aléa fixé).
- FR-05 Les cas Master-Out à 1 et finitions impossibles sont des régressions attendues **passantes**. Tout défaut encore ouvert doit être vérifié et relié à sa spec avant un éventuel classement `bug-connu` (Q3).
- FR-06 Un test d'immuabilité gèle récursivement l'état d'entrée de chaque fonction de moteur exportée et échoue sur toute écriture.
- FR-07 Un test de déterminisme rejoue chaque scénario deux fois et compare les états (aucune horloge, aucun aléa non injecté).
- FR-08 Un contrôle de cohérence échoue si un scénario n'a pas de verdict, de source ou d'identifiant unique, ou si un `bug-connu` ne cite pas de spec.
- FR-09 Pour chaque vue retenue, des tests de caractérisation jouent une partie courte via les boutons rendus, incluent au moins une annulation et vérifient l'appel de fin de partie. Le nombre de jeux dépend de Q6.

## 11. Exigences non fonctionnelles

- NFR-01 Performance : l'ensemble des scénarios s'exécute en moins de 10 s sur un runner `ubuntu-latest` [à mesurer].
- NFR-02 Aucune nouvelle dépendance npm (Vitest, Testing Library et jsdom sont déjà présents).
- NFR-03 Lisibilité : identifiants et titres en français accentué ; un scénario tient sur un écran.
- NFR-04 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs

- Nominal : extraction du moteur Gotcha (058) → mêmes scénarios verts avec le nouvel adaptateur.
- Alternatif : un futur correctif fait passer un `bug-connu` → l'exécuteur signale « test attendu en échec mais réussi » → le contributeur bascule le verdict.
- Alternatif : décision sur une règle encore ouverte → les scénarios `a-decider` deviennent `valide-metier` ou sont adaptés à la décision.

## 13. Cas limites

- Scénarios multi-legs/sets avec doublettes (rotation `buildNextDoublesLegState`).
- Annulation à travers une fin de leg ou après la fin de match : comportement actuel à caractériser.
- Limite de l'historique d'annulation Gotcha : comportement actuel à caractériser.
- Égalité Cricket à la limite de tours ; égalité Triathlon.

## 14. Gestion des erreurs

Un scénario mal formé fait échouer la suite avec un message citant son identifiant. Un adaptateur qui ne sait pas jouer une entrée lève une erreur explicite (pas de scénario silencieusement ignoré).

## 15. Impacts architecturaux

Aucun code applicatif modifié. Les adaptateurs dépendent du moteur, jamais l'inverse. Le format de scénario pourra être réutilisé par 084 (projection TV) et 074 (corpus vocal).

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée ni contrat public. Nouveaux fichiers de test uniquement.

## 17. Compatibilité avec l'existant

Les tests unitaires existants restent en place ; les doublons pourront être retirés après validation, jamais avant que le scénario équivalent soit `valide-metier`.

## 18. Dépendances

- Aucune dépendance bloquante déclarée.
- Préalable déclaré pour les propositions V2-ARCH-01 (056), V2-ARCH-03 (057) et V2-ARCH-04 (058).
- Liée : V2-GAMES-26 (050) pour le texte des règles validées ; les corrections 045, 046 et 048 sont déjà livrées.

## 19. Critères d'acceptation

- AC-01 Au commit de livraison, les scénarios et les exécuteurs couvrent les jeux et volumes arbitrés en Q5/Q6 ; `npm run test:unit` est vert. Preuve : sortie Vitest.
- AC-02 Les scénarios « Master-Out, reste 1 » et « finition impossible » passent comme régressions ; un éventuel défaut ouvert est référencé et traité selon la décision Q3.
- AC-03 Un test d'immuabilité de `submitTurn` sur une volée gagnante vérifie que l'état d'entrée, notamment les compteurs de manches et de sets, reste inchangé.
- AC-04 Un scénario sans verdict ou avec un identifiant dupliqué fait échouer la suite. Preuve : test du contrôle de cohérence.
- AC-05 Les vues du périmètre arbitré ont des tests de caractérisation qui jouent au moins une volée, une annulation et une fin de partie (ou l'état « dernier joueur » pour Killer).
- AC-06 Le product owner a relu et accepté la liste des scénarios `valide-metier` (trace dans l'issue).
- AC-07 `package.json` et le lockfile sont inchangés.

## 20. Scénarios de tests

Unitaires (scénarios, immuabilité, déterminisme, cohérence) et composants (caractérisation des vues). Pas d'E2E dans cette spec (040).

## 21. Exigences de non-régression

Aucun test existant supprimé ; seuils de couverture (`vitest.config.ts:28-33`) inchangés ; durée totale de `npm run test:unit` augmentée de moins de 15 % [à mesurer].

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Figer un bug comme règle | Élevé | Moyenne | Verdicts, RM-02, revue PO |
| Scénarios trop couplés au moteur actuel | Moyen | Moyenne | Adaptateurs, attendus partiels (scores, joueur courant, vainqueur) |
| Validation métier lente | Moyen | Élevée | Lots par jeu ; `a-decider` n'empêche pas le reste |
| Tests de vues fragiles (libellés) | Moyen | Moyenne | Réutiliser les tests existants et privilégier les rôles accessibles |

## 23. Décisions architecturales

Aucun ADR requis à ce stade. Le format TypeScript typé est proposé, sans décision anticipée sur Q1.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Format des scénarios | TypeScript typé / JSON / YAML | TypeScript typé (vérification à la compilation, aucune dépendance) | — |
| Q2 | Qui valide les règles « maison » (Capital, Killer, Gotcha, barème Triathlon) ? | PO seul / PO + joueurs de club | PO, avec relecture d'un joueur de club pour Capital et Triathlon | — |
| Q3 | Bugs connus : `test.fails` ou attendu actuel annoté ? | `test.fails` avec attendu correct / attendu actuel + commentaire | `test.fails` (ne fige pas le bug, détecte le correctif) | — |
| Q4 | Les anciens services et use cases X01 non branchés à l'interface doivent-ils être couverts par les scénarios ? | Oui / Non, décision de 056 | Couvrir d'abord le chemin réellement joué ; ne pas assimiler les modules de règles actifs à l'ancien domaine | — |
| Q5 | Volumes minimaux de FR-04 | Tels quels / réduits pour le lot 1 | Tels quels pour X01 et Cricket, réduits de moitié pour les autres au lot 1 | — |
| Q6 | Inclure 180 Around the Clock, ajouté depuis l'audit initial ? | Dans le périmètre / lot ultérieur | Inventorier et réutiliser ses tests existants avant de fixer le volume | — |

## 25. Traçabilité

Rapports `docs/v2/audit/02-architecture.md` (§T9, CA-1), `docs/v2/audit/03-games.md` (§5, V2-GAMES-21), `docs/v2/audit/10-docs-quality.md` (§5.4, V2-QA-01) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §C.5, §F.2, §G (lot 1) ; specs 029, 045, 047, 048, 050, 054, 057, 058.
