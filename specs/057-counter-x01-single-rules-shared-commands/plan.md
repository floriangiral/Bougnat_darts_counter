# Plan — 057 Règles X01 uniques et commandes partagées

> **Cadrage uniquement, plan non validé.** Aucune étape d'implémentation ne commence avant validation explicite de 057, arbitrage des questions et traitement du prérequis 039.

## 1. Lecture et preuves de l'existant
- Le détail des parcours et les références sont dans `spec.md` §4 : `MatchView` / `matchSubmission` / `matchLifecycle`, règles d'ouverture/sortie et de totaux, TROP explicite, voix, robot, bull, places et retour partenaire.
- Les correctifs d'origine sont déjà présents : copie des compteurs dans `finishLeg` (`029048b`), finissabilité, Master-Out, garde de l'appui long, partage des totaux et import domaine du robot. Ne pas écrire de test censé échouer aujourd'hui sur ces anciens défauts.
- Au `7b454d3`, 039 est `a-valider` : les tests ci-dessous existent, mais ne constituent pas les fixtures X01 métier proposées par 039. Les tests dorés du partenaire couvrent des URL, pas toutes les règles.

Rejeu documentaire du 2026-11-26 : **15 fichiers, 223 tests réussis**.

```bash
TMPDIR="$PWD" CI=1 npm exec -- vitest run tests/unit/x01/matchScoring.test.ts tests/unit/x01/matchViewCheckoutRules.test.tsx tests/unit/x01/matchViewOpening.test.tsx tests/unit/x01/matchViewOrderAndPlacements.test.tsx tests/unit/x01/x01BotTurn.test.ts tests/unit/x01/x01DeclaredBust.test.ts tests/unit/x01/voiceProposalModel.test.ts tests/unit/dartsSpeechParser.test.ts tests/unit/application/matchLifecycle.test.ts tests/unit/application/x01OrderAndPlacements.test.ts tests/unit/externalMatch/externalMatchContract.golden.test.ts tests/unit/components/setupViewExternalMatch.test.tsx tests/unit/components/keypads.test.tsx tests/unit/session/sessionRecovery.test.ts tests/unit/app/restoredX01Session.test.ts --reporter=dot
```

Complément : **5 fichiers, 121 tests réussis**.

```bash
NODE_DISABLE_COMPILE_CACHE=1 TMPDIR="$PWD" CI=1 npm exec -- vitest run tests/unit/x01/doublesRotation.test.ts tests/unit/reachableTotals.test.ts tests/unit/application/matchStats.test.ts tests/unit/session/appSessionRecovery.test.tsx tests/unit/session/gameRuntimeValidation.test.ts --reporter=dot --silent
```

Node local `26.13.0`, npm `11.20.0` ; références du dépôt : Node `26.13.1` (`.nvmrc`), npm `12.2.3` (`package.json`). Aucun E2E/smoke, serveur ou navigateur local. Sondages ponctuels en mémoire : trois fins sur état gelé inchangé ; divergences de voix/RESTE, confiance et priorité d'ouverture décrites en `spec.md` §4.3. Ce ne sont pas des tests pérennes.

## 2. Approches à arbitrer
- Réutiliser les règles effectivement actives et choisir si la commande vit dans le domaine, l'application ou un découpage mixte (Q1/Q3). Ne pas considérer tout `src/domain/scoring` comme mort.
- Définir les intentions et les informations nécessaires aux confirmations et aux gardes, ainsi que la place des transitions TROP, bull et classement (Q6). La piste `applyX01Command` est illustrative, pas une API arrêtée.
- Le traitement du total vocal supérieur au reste, de RESTE vocal et de la source partenaire reste soumis à Q2/Q5/Q8 ; une éventuelle évolution du parseur se coordonne avec 003.
- Les ADR-0001/0002/0008/0009 restent proposées : ne pas présenter leurs options comme acceptées.

## 3. Étapes conditionnelles, après validation
1. Relever les décisions Q1 à Q8 ; convenir avec 039 du jeu de scénarios validés, sans figer comme règle un comportement seulement observé.
2. Étendre la caractérisation : ouverture et sortie combinées, RESTE manuel/vocal, TROP déclaré, temps, undo, bull, places, classement, doublettes, robot, Triathlon et lien partenaire. Geler les entrées sur les fins déjà corrigées.
3. Selon Q1/Q3/Q6, définir contrat de commande, contexte, résultats et stratégie pour les confirmations ; conserver les règles déjà partagées et leurs consommateurs non X01.
4. Basculer progressivement les entrées humaines et le robot ; préserver les gardes propres au TROP, aux confirmations, à l'interface et aux transitions. Adapter la voix seulement selon les décisions PO.
5. Comparer les résultats métier, les retours visibles, les instantanés et les URL partenaire avant/après ; vérifier en particulier l'appel synchrone depuis une action humaine de fin.
6. Coordonner avec 056 la seule suppression de code historique devenu inutile, avec 058 le modèle d'état et avec 061 le découpage de la vue ; ne pas supprimer un module actif ou un consommateur partagé.

## 4. Fichiers à examiner lors d'une éventuelle implémentation
| Périmètre | Points d'attention |
|---|---|
| `src/domain/scoring/{reachableTotals,x01CheckoutRules,x01OpeningRules,x01DeclaredBust}.ts` | Modules actifs ; totaux aussi utilisés par Gotcha/Capital ; conservation des règles 045/046/054. |
| `src/application/scoring/{matchLifecycle,x01Rotation,matchStats}.ts` | Transitions, rotation, bull, places et statistiques ; immutabilité déjà corrigée. |
| `src/features/x01/scoring/matchSubmission.ts`, `views/MatchView.tsx`, `components/game/Keypad.tsx` | Validation, confirmations, TROP, RESTE, appui long, pile, verrous et effets. |
| `src/application/x01Bot/x01BotTurn.ts`, `src/features/x01/voice/*` | Candidat borné / aléa injectable ; parseur et proposition selon Q2/Q5. |
| `src/shared/session/persistedAppSession.ts`, `src/features/game-session/storedSessionCodec.ts`, `src/features/x01/session/x01RuntimeValidation.ts`, `src/app/sessionRecovery.ts` | Instantané versionné, 20 pas persistés, validation et compatibilité. |
| `views/TriathlonGameView.tsx`, `src/features/external-match/externalMatchLink.ts`, `App.tsx` | Sous-parties X01, contrat et retour partenaire synchrone. |

## 5. Impacts UI / domaine / application
La proposition vise des transitions testables sans React et une interface de commande interne. Les confirmations, raccourcis et retours existants restent visibles ; seuls les écarts vocaux acceptés par le PO pourraient les modifier. Le périmètre exact dépend des arbitrages, pas d'un déplacement mécanique de fichiers.

## 6. Données, sessions et contrat
La compatibilité de `MatchState`, `MatchRuntimeSnapshot`, des 20 pas d'undo persistés, de la normalisation à la reprise et de `v=1` est l'objectif à prouver. Une modification de schéma exigerait un arbitrage préalable, une migration/validation coordonnée avec 010/058 et un plan de retour arrière spécifique ; « aucune migration » n'est pas supposé par avance.

## 7. Stratégie de test proposée
Tests de règles et de transitions sur entrées gelées, tests de composant jsdom, candidats robot déterministes, codec/reprise, Triathlon et contrats partenaire. Ajouter les scénarios nécessaires à la décision Q2/Q5 et ceux validés par 039. Maintenir les seuils existants de 029 ; E2E/smoke **en CI uniquement**.

## 8. Non-régression
Rejouer les suites ciblées ci-dessus et les scénarios métier de 039 quand ils seront disponibles et validés, avant/après chaque étape. Les éventuels écarts acceptés par le PO doivent être nommés, testés et documentés ; ne pas les masquer sous « refactorisation sans changement ».

## 9. Retour arrière proposé
Étapes réversibles après revue, sans présumer que le retour arrière est sûr si un format persisté a changé. Si une migration est autorisée, vérifier aussi la lecture des sessions créées après bascule ; préserver le contrat partenaire.

## 10. Documentation en cas d'implémentation ultérieure
Mettre à jour la documentation et les ADR concernées selon les décisions et le comportement réellement livré, puis les suivis de spec/release applicables. La synthèse transversale de `docs/architecture.md` est déjà mise à jour par ce cadrage, sans anticiper d'implémentation.
