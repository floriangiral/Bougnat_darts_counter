---
id: 056-counter-arch-layer-boundaries
v2_id: V2-ARCH-01
titre: Frontières de couches et sort du modèle X01 historique non branché
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 15
depend_de: [V2-QA-01]
remplace: []
remplacee_par: []
issue: '#235'
verifie_au_commit: à renseigner
derniere_revue: 2026-11-26
---

# 056 — Frontières de couches et sort du modèle X01 historique non branché

> **Statut : À VALIDER.** Le cadrage ci-dessous est une proposition, pas une autorisation d'implémenter. Les recommandations et critères cibles restent soumis aux arbitrages de la section 24.

## 1. Origine et contexte

- [Audit architecture V2](../../docs/v2/audit/02-architecture.md) §3, §5 et §7 ; [compte rendu](../../docs/v2/compte-rendu-audit-2026-11-20.md) B.3, C.9 et H.24. Ces documents décrivent l'état du 20 novembre, non le code actuel.
- La [règle de dépendance](../../docs/architecture.md#clean-architecture-layers) est documentée mais non contrôlée comme telle. Le chantier croise les propositions [057](../057-counter-x01-single-rules-shared-commands/spec.md) et [058](../058-counter-serializable-game-state/spec.md), ainsi que la reprise déjà livrée par [010](../010-counter-offline-session-recovery-guarantees/spec.md).
- Cette fiche regroupe les propositions provisoires « carte des couches » et « noyau de types / moteurs legacy » (V2-ARCH-01 et V2-ARCH-02), et le reliquat des specs 002 et 022.

## 2. Problématique

Des modules internes dépendent de la racine legacy ou de couches externes ; les responsabilités entre `features`, UI et infrastructure ne sont pas toutes explicitées. Le modèle X01 historique et ses use cases, exportés mais non appelés par le parcours de jeu, côtoient dans le même dossier des règles **effectivement utilisées**. Une suppression ou un déplacement global ferait courir un risque de régression.

## 3. Objectifs

- O1 : proposer une carte de dépendances contrôlable par l'outillage déjà présent, avec échecs explicites sur les nouvelles arêtes interdites.
- O2 : rendre les écarts existants visibles et maîtriser leur résorption, sans exemption globale de fichier.
- O3 : supprimer les cycles de types entre noyau, domaine et racine, sans confondre cycle de types et cycle à l'exécution.
- O4 : décider du modèle historique X01 et des stubs **au cas par cas**, sans supprimer les règles exécutées.
- O5 : préserver règles, flux de jeu, sessions, préférences et contrat partenaire.

## 4. État actuel vérifié dans le code

Inventaire statique du **2026-11-26 sur `7b454d3`** ; les exemples ne constituent pas une liste exhaustive. Le commit `508dfa6` reste la référence historique de l'audit, pas une preuve d'implémentation de cette spec.

### Frontières et évolutions depuis l'audit

| Constat | Preuve actuelle et interprétation |
|---|---|
| V1 — domaine → racine | [`killer.ts`](../../src/domain/killer/killer.ts), [`gotcha.ts`](../../src/domain/gotcha/gotcha.ts) et [`x01Bot.ts`](../../src/domain/x01Bot/x01Bot.ts) importent des types de [`types.ts`](../../types.ts) ; les règles X01 y prennent aussi leurs types. Ce sont des dépendances de types vers une racine hors couches. |
| V2 — ancien exemple résorbé | [`x01BotTurn.ts`](../../src/application/x01Bot/x01BotTurn.ts) importe désormais `reachableTotals` et `x01CheckoutRules` du domaine et n'importe plus `features/x01/scoring/possibleTurnScores`. Cela ne prouve pas l'absence de tout autre écart. |
| V3 — features → app | Les anciens `src/features/tablet/*` n'existent plus. [`viewportClass.ts`](../../src/features/layout/viewportClass.ts) importe le type `AppAccessMode` et [`useViewportClass.ts`](../../src/features/layout/useViewportClass.ts) appelle `getAppAccessMode` de `appShell`. [`useShortcutDrafts.ts`](../../src/features/settings/useShortcutDrafts.ts) et [`useMatchShortcuts.ts`](../../src/features/x01/hooks/useMatchShortcuts.ts) importent le hook applicatif de réglages. Déplacer seulement le type ne résout donc pas les imports de valeurs. |
| V4 — shared → extérieur | [`persistedAppSession.ts`](../../src/shared/session/persistedAppSession.ts) importe des types de `types.ts`, `utils/arenaFlow`, `domain` **et** des modèles `features`. [`shared/config/env.ts`](../../src/shared/config/env.ts) réexporte [`src/lib/env.ts`](../../src/lib/env.ts). Il faut distinguer primitives et contrat de session, pas simplement tout déplacer dans un noyau supposé pur. |
| V5 — infrastructure → extérieur | [`IndexedDBSessionRepository.ts`](../../src/infrastructure/local/IndexedDBSessionRepository.ts) importe `utils/appPersistence`. Les adaptateurs de [thème](../../src/infrastructure/local/themePreferenceStore.ts), [réglages](../../src/infrastructure/local/counterSettingsStore.ts), [format rapide](../../src/infrastructure/local/x01QuickFormatStore.ts), [information vocale](../../src/infrastructure/local/voicePrivacyNoticeStore.ts) et le [document de thème](../../src/infrastructure/web/themeDocument.ts) importent des modèles `features`. Ces derniers exemples n'existaient pas tous dans la liste V1-V7 de l'audit. |
| V6 — moteur legacy → couches externes | [`utils/triathlonScoring.ts`](../../utils/triathlonScoring.ts) dépend de `application/scoring/matchStats`, d'une façade de checkout `features`, de `domain/triathlon` et de `utils/cricketLogic`. Le déplacer tel quel dans `domain` créerait des dépendances inversées. |
| V7 — UI dans features, à arbitrer | [`VoiceScoringControl.tsx`](../../src/features/x01/voice/VoiceScoringControl.tsx) et [`VoicePrivacyNotice.tsx`](../../src/features/x01/voice/VoicePrivacyNotice.tsx) sont des composants React de feature utilisant [`components/ui/Button.tsx`](../../components/ui/Button.tsx). Ce n'est pas automatiquement une violation si les tranches verticales et ce sens de dépendance sont retenus (Q2). |
| V8 — vues/composants → domaine | Imports directs historiques dans [`MatchView.tsx`](../../views/MatchView.tsx), [`KillerGameView.tsx`](../../views/KillerGameView.tsx), [`GotchaGameView.tsx`](../../views/GotchaGameView.tsx), [`Atc180GameView.tsx`](../../views/Atc180GameView.tsx) et [`SetupPlayersSection.tsx`](../../components/game-setup/SetupPlayersSection.tsx). Pour le **nouveau** code, [AGENTS.md](../../AGENTS.md) demande déjà de passer par une façade `features/*`. Exemple existant : [`x01Rules.ts`](../../src/features/x01/scoring/x01Rules.ts). |

- [Vérifié] [`types.ts`](../../types.ts) utilise des requêtes de type `import(...)` vers Killer et Gotcha, qui importent eux-mêmes `Player` de la racine : ce sont des cycles statiques **de types**. Il référence aussi `TriathlonScorecard` via `utils/triathlonScoring`. L'absence de cycle à l'exécution constatée par l'audit n'a pas été recalculée pour tout le graphe actuel.
- [Vérifié] [`eslint.config.js`](../../eslint.config.js) ne définit pas de règle de frontières ; [`eslint.type-aware.config.js`](../../eslint.type-aware.config.js) reprend cette configuration. [`guard-clean-codebase.sh`](../../scripts/guard-clean-codebase.sh) contrôle notamment des anciens chemins et le cliquet de couleurs, pas une matrice générale de couches. [`npm run lint`](../../package.json) utilise `--max-warnings 0` et le [quality gate](../../.github/workflows/quality-gate.yml) exécute les deux lints.
- [Vérifié par sonde en mémoire] Avec Node `26.13.0`, ESLint `10.15.0`, le parseur TypeScript existant et `no-restricted-imports` limité au motif `../../views/*`, `ESLint.lintText` appliqué à un fichier virtuel `src/domain/__probe__.ts` signale un `import type` statique et un `export … from` vers `../../views/MatchView`, mais pas `typeof import('../../views/MatchView')` ni l'import dynamique correspondant. L'alias `@/views/MatchView` n'est pas non plus couvert par ce seul motif : `@/*` est configuré dans [`tsconfig.json`](../../tsconfig.json) et [`vite.config.ts`](../../vite.config.ts). Il peut être interdit par un motif explicite, mais la règle ne résout pas à elle seule tous les chemins équivalents ni les réexports transitifs. Choix et preuves à instruire en Q6 ; aucun fichier de test n'a été créé.

### X01 historique, règles actives et stubs

- [Vérifié] Le chemin X01 réel passe notamment par [`matchSubmission.ts`](../../src/features/x01/scoring/matchSubmission.ts), [`matchLifecycle.ts`](../../src/application/scoring/matchLifecycle.ts), [`x01Rotation.ts`](../../src/application/scoring/x01Rotation.ts) et [`MatchView.tsx`](../../views/MatchView.tsx). Sont **actifs** dans `src/domain/scoring` : [`x01CheckoutRules.ts`](../../src/domain/scoring/x01CheckoutRules.ts), [`x01OpeningRules.ts`](../../src/domain/scoring/x01OpeningRules.ts), [`x01DeclaredBust.ts`](../../src/domain/scoring/x01DeclaredBust.ts) et [`reachableTotals.ts`](../../src/domain/scoring/reachableTotals.ts). Ce dernier sert aussi à [Gotcha](../../src/domain/gotcha/gotcha.ts), [Capital](../../src/features/capital/capitalGameModel.ts) et au [robot](../../src/application/x01Bot/x01BotTurn.ts). Il est interdit de conclure que tout `src/domain/scoring/**` est mort.
- [Vérifié] Les classes historiques [`RecordThrow`](../../src/application/scoring/RecordThrow.ts), `UndoThrow`, `StartGame`, `EndLeg` et `EndGame` sont réexportées par [`application/scoring/index.ts`](../../src/application/scoring/index.ts), mais leurs appels trouvés sont dans [`scoringUseCases.test.ts`](../../tests/unit/application/scoringUseCases.test.ts), pas dans le parcours de jeu. Le modèle `entities/*` est réexporté par [`domain/scoring/index.ts`](../../src/domain/scoring/index.ts) ; ses services `ScoreValidator` et `ScoringRules` sont appelés par `RecordThrow` et par des tests. Ils délèguent maintenant certaines règles à des modules actifs : la frontière n'est donc pas le dossier entier.
- [Vérifié] [`scoringDomain.test.ts`](../../tests/unit/x01/scoringDomain.test.ts) teste à la fois les services historiques **et** des règles d'ouverture et le cycle de vie actifs. Le supprimer en bloc ferait perdre des tests utiles. [`matchScoring.test.ts`](../../tests/unit/x01/matchScoring.test.ts) et [`matchLifecycle.test.ts`](../../tests/unit/application/matchLifecycle.test.ts) ciblent aussi le chemin réel.
- [Vérifié] [`useSharedX01Session.ts`](../../src/features/x01/session/useSharedX01Session.ts) autorise toujours l'action et sa persistance distante résout sans effet ; il est néanmoins appelé, parfois avec `await`, par [`MatchView.tsx`](../../views/MatchView.tsx). Dans [`ports.ts`](../../src/application/scoring/ports.ts), seul `SyncRepository` est un placeholder vide : `SessionRepository` est implémenté par l'IndexedDB et doit être conservé.
- [Vérifié] `KILLER_STATS` et `GOTCHA_STATS` ne sont pas rendus par `App`, mais sont reconnus par [`appScreens.ts`](../../src/app/appScreens.ts), présents dans des ensembles d'[`appShell.ts`](../../src/app/appShell.ts) et normalisés vers la sélection par [`sessionRecovery.ts`](../../src/app/sessionRecovery.ts) **après validation**. [`sessionRecovery.test.ts`](../../tests/unit/session/sessionRecovery.test.ts) couvre ce retour : retirer simplement ces valeurs ferait rejeter des sessions historiques.

### Moteurs et état depuis l'audit

- [Vérifié] [`cricketLogic.ts`](../../utils/cricketLogic.ts), [`capitalLogic.ts`](../../utils/capitalLogic.ts) et [`triathlonScoring.ts`](../../utils/triathlonScoring.ts) sont du **code de production** consommé par les vues et les modèles [Cricket](../../src/features/cricket/cricketGameModel.ts), [Capital](../../src/features/capital/capitalGameModel.ts) et [Triathlon](../../src/features/triathlon/triathlonFlow.ts). Les types et le barème Triathlon v2 sont déjà partiellement dans [`src/domain/triathlon/`](../../src/domain/triathlon/). Les [golden tests Triathlon](../../tests/unit/triathlonScoringGolden.test.ts) sont des tests, pas un moteur de production.
- [Vérifié] `formatDuration`, `buildDoublesRotation` et `getOrderedPlayersAndStarter` sont encore dans [`matchLifecycle.ts`](../../src/application/scoring/matchLifecycle.ts) et servent plusieurs jeux, par exemple [Cricket](../../views/CricketGameView.tsx) et [180 Around the Clock](../../views/Atc180GameView.tsx). La rotation X01 par manche/set existe séparément dans `x01Rotation.ts` : ne pas la confondre avec ce seul helper partagé.
- [Vérifié] Depuis l'audit, [010](../010-counter-offline-session-recovery-guarantees/spec.md) est `implementee` : les jeux publient et restaurent des instantanés, y compris les sous-jeux du [Triathlon](../../views/TriathlonGameView.tsx). La validation et le format versionné sont dans [`sessionRecovery.ts`](../../src/app/sessionRecovery.ts) et [`gameRuntime.ts`](../../src/features/game-session/gameRuntime.ts). Les règles de sortie/ouverture et le barème ont aussi évolué ([045](../045-counter-x01-checkout-rules-compliance/spec.md), [046](../046-counter-x01-double-master-in/spec.md), [048](../048-counter-triathlon-scoring-v2/spec.md), [054](../054-counter-impossible-totals-validation/spec.md)). Les constats de l'audit et des versions initiales de 057/058 au commit `508dfa6` ne décrivent donc plus tous le code.
- [Vérifié] [039](../039-counter-qa-golden-rules-characterization/spec.md), [057](../057-counter-x01-single-rules-shared-commands/spec.md) et [058](../058-counter-serializable-game-state/spec.md) sont `a-valider`. Des tests ciblés existent déjà, notamment le golden Triathlon et [`gameReload.test.tsx`](../../tests/unit/session/gameReload.test.tsx), mais cela ne démontre pas la livraison complète des scénarios métier demandés par 039.

## 5. Comportement cible proposé

Une matrice explicite décrit les dépendances autorisées, les exceptions et les façades ; un contrôle bloque les nouvelles arêtes interdites. Proposition de sens : `domain` → `domain`/primitives `shared`, `application` → `application`/`domain`/primitives `shared`, les couches de présentation et les features consomment les couches internes ; l'assemblage est à la racine/`app`. Le traitement de `features` → `components/ui` et `infrastructure` → modèles `features` dépend de Q2 et Q6.

Le noyau ne dépend pas du contrat de session ni d'un moteur legacy. Les règles actives restent accessibles par le chemin choisi avec 057 ; le sort des seules parties historiques et des moteurs racine dépend de Q1 et Q8. Les réexports éventuels sont temporaires et ne doivent pas masquer une dépendance interdite.

## 6. Périmètre

### Inclus, sous réserve d'arbitrage
- Matrice des couches, contrôle automatique et exceptions ciblées ; clarification de la convention UI/features.
- Noyau de types, cycles et contrat de session ; extraction éventuelle des helpers transverses.
- Sort des use cases historiques, des stubs et des écrans non rendus ; préservation des usages réellement actifs.
- Traitement par étapes des moteurs racine, en coordination avec 058 et sans déplacer aveuglément le calcul Triathlon.

### Exclu
- Mise en œuvre, validation de la spec ou arbitrage PO lors du présent cadrage.
- Changement des règles X01/commandes (057), des règles de jeu, du schéma de session (010) ou du contrat partenaire `v=1` (030).
- Déplacement physique global de `views/` ou `components/` ; changement de produit, infrastructure TV, règles de protection ou workflows.

## 7. User stories

- Contributeur : détecter une nouvelle dépendance interdite avant fusion et comprendre comment la résorber.
- Mainteneur : distinguer code historique et source des règles effectivement jouées avant de déplacer ou retirer quoi que ce soit.

## 8. Règles métier

Aucune règle de jeu nouvelle : à comportement constant, même score, ordre, résultat et reprise.

## 9. Parcours utilisateurs

Aucun changement visible. Parcours contributeur proposé : une dépendance interdite produit une erreur exploitable dans le lint ou le contrôle choisi.

## 10. Exigences fonctionnelles proposées

- FR-01 : définir les zones et la matrice, y compris racine legacy, `shared`, `src/lib`, `app`, `views`, `components`, tests et réexports ; préserver la convention de façade pour les nouveaux imports UI → domaine.
- FR-02 : contrôler au minimum les imports/exports statiques de valeurs et de types, les requêtes de type `import(...)`, imports dynamiques littéraux, chemins relatifs, alias `@/` et réexports. Un import calculé non résoluble est traité explicitement, pas silencieusement accepté (Q6).
- FR-03 : interdire les dépendances du domaine et de l'application vers les couches plus externes selon la matrice retenue ; traiter `shared` → modèles/`utils`/`lib`, `features` → `app` et infrastructure → `features`/`utils` selon celle-ci, sans présenter les écarts actuels comme déjà corrigés.
- FR-04 : une exception temporaire identifie au minimum **source, cible, motif et responsable ou spec de résorption** ; elle ne dispense pas tout un fichier. Le contrôle détecte une nouvelle arête, y compris le remplacement d'une exception par une autre (Q7).
- FR-05 : séparer les types élémentaires et le contrat de session ; résorber les cycles de types connus et conserver les exports nécessaires pendant la migration (Q5).
- FR-06 : si Q8 retient une migration des moteurs, préserver les calculs, consommateurs, barèmes et validateurs ; découper les dépendances Triathlon avant tout placement dans une couche qui ne peut les importer.
- FR-07 : après décision conjointe avec 057, ne retirer ou rebrancher que les classes/modèles historiques identifiés. Conserver les règles de sortie, d'ouverture, de trop et de totaux réalisables ainsi que leurs usages multi-jeux, où qu'elles résident.
- FR-08 : si le stub de session partagée est retiré, traiter ses appels et leur chronologie, sans retirer le port actif `SessionRepository` ; coordonner avec 084 (Q9).
- FR-09 : si les noms d'écrans non rendus sont retirés des écrans navigables, conserver la lecture et la normalisation des valeurs historiques avant leur rejet éventuel ; coordonner avec 049/053 (Q3).
- FR-10 : mettre à jour les documents d'architecture et, si nécessaire, la garde des anciens chemins **lors de l'implémentation**, sans affaiblir une règle ni un test pour passer la CI.

## 11. Exigences non fonctionnelles proposées

- NFR-01 : privilégier les outils déjà installés, sans nouvelle dépendance runtime ; justifier toute abstraction ou dépendance d'outillage proposée (Q6).
- NFR-02 : viser une augmentation médiane du lint inférieure à 10 %, mesurée avant/après sur le même environnement et au moins trois exécutions comparables ; signaler tout dépassement sans désactiver le contrôle.
- NFR-03 : pas de modification des formats persistés ni des contrats publics ; tests et seuils de couverture existants préservés.

## 12. Cas nominaux et alternatifs

- Un import de `views` depuis `domain`, par chemin relatif ou alias, est refusé avec une indication de couche.
- Une arête historique précise est temporairement admise ; une autre cible dans le même fichier reste refusée.
- Si un moteur reste partiellement hors domaine après Q8, sa position et ses dépendances autorisées sont explicites, pas maquillées par un réexport.

## 13. Cas limites

`import type`, `export type … from`, `type T = import('…').T`, `import()` et `require` ; alias, extensions et chemins relatifs équivalents ; réexport indirect ; import calculé non résoluble ; fichiers de test pouvant importer les modules à tester ; sessions anciennes ; règles partagées entre plusieurs jeux.

## 14. Gestion des erreurs

Le contrôle indique source, cible et règle ; les imports non résolubles et les exceptions mal formées ne passent pas silencieusement. La preuve d'une revue humaine relève de la PR, pas d'une affirmation que le lint saurait l'attester.

## 15. Impacts architecturaux

Les limites précises, l'emplacement des contrats et la portée des adaptateurs sont à arbitrer. Une implémentation peut nécessiter un contrôle syntaxique ou de graphe complémentaire au lint natif : son coût est justifié par les angles morts constatés, sous réserve de Q6. Les ADR [0001](../../docs/adr/0001-etat-de-partie-serialisable-par-jeu.md), [0002](../../docs/adr/0002-regles-x01-uniques-et-commandes-partagees.md) et [0005](../../docs/adr/0005-projection-spectateur-et-transport.md) sont **proposées**, non des décisions déjà acceptées.

## 16. Impacts sur les données et les interfaces

Pas de migration voulue : mêmes noms/champs et sémantique de session versionnée, réglages locaux, barème Triathlon et lien partenaire `v=1`. Les anciens noms d'écran doivent rester lisibles si Q3 les retire de la navigation.

## 17. Compatibilité avec l'existant

Réexports de transition seulement si leur direction est autorisée ou couverte par une exception précise. Aucun retrait de test sans transfert des vérifications utiles et sans affaiblissement des invariants métier.

## 18. Dépendances et ordre à arbitrer

- [039 / V2-QA-01](../039-counter-qa-golden-rules-characterization/spec.md) est le préalable déclaré, encore `a-valider`. Les tests existants sont utiles mais ne remplacent pas automatiquement ses scénarios validés métier ; caractériser les chemins concernés avant tout déplacement de moteur.
- [057 / V2-ARCH-03](../057-counter-x01-single-rules-shared-commands/spec.md) est aussi `a-valider` et dépend formellement de 039, pas de 056. Sa NFR-02 vise des règles sans dépendances externes et évoque un contrôle associé à 056, qui n'est pas encore acquis ; la 056 initiale attendait sa bascule pour le nettoyage X01. Conditionner la **clôture complète** de chacune à l'autre créerait un blocage de fait.
- Séquencement **proposé**, non décidé : après validation respective, socle 056 (matrice et contrôle, avec exceptions contrôlées) → bascule des règles/commandes 057 après caractérisation 039 → décision et éventuel nettoyage des seules classes historiques dans 056. Une étape de 056 peut donc précéder 057 sans prétendre que 056 est terminée (Q1, Q10).
- [058](../058-counter-serializable-game-state/spec.md), également `a-valider`, concerne les modèles et reducers des mêmes jeux ; sa version initiale envisageait le déplacement des mêmes moteurs. Répartir explicitement propriété des fichiers et ordre des PR, en partant de la reprise 010 déjà implémentée. [084](../084-counter-spectator-projection/spec.md) prévoit aussi le retrait éventuel des stubs ; [085](../085-counter-tv-local-window/spec.md) concerne le transport local futur.
- [049](../049-counter-common-game-frame/spec.md) et [053](../053-counter-killer-gotcha-variants/spec.md) sont des propositions liées aux fins/statistiques ; elles ne rendent pas les noms d'écrans restaurés jetables. [043](../043-counter-qa-ci-hardening/spec.md) porte la garde existante ; [029](../029-counter-sonar-coverage-governance/spec.md) gouverne la couverture.

## 19. Critères d'acceptation proposés

- AC-01 : la matrice et la portée des dossiers sont documentées ; les imports autorisés et interdits sont testés par zone, y compris les façades UI et le choix Q2/Q6. Le contrôle est bloquant dans la commande de lint retenue et donc dans le quality gate existant.
- AC-02 : tests de contrôle positifs et négatifs avec `import type`, import/export statique, `import()` dynamique et de type, alias, profondeur relative et réexport indirect ; l'import calculé et `require` suivent une politique explicite. Les tests simulent un chemin de **production** même si les fichiers de tests sont exemptés de la matrice.
- AC-03 : une exception n'autorise qu'une arête précise ; ajouter une autre cible dans le même fichier ou remplacer une exception par une autre fait échouer le contrôle du différentiel. La liste résiduelle est vide ou approuvée avec motif et propriétaire ; la revue d'une éventuelle modification de référence est tracée séparément.
- AC-04 : aucune suppression de règles actives : un éventuel retrait de `src/domain/scoring` n'intervient qu'après migration vérifiée de ses fonctionnalités et consommateurs. Selon Q1, les classes historiques sont soit sans références résiduelles après transfert des tests, soit branchées et testées sur le parcours réel. Les règles actives X01 et `reachableTotals` restent couvertes pour X01, robot, Capital et Gotcha.
- AC-05 : le graphe retenu ne présente plus les cycles de types racine ↔ Killer/Gotcha ; les dépendances du noyau et de `types.ts` sont vérifiées avec les formes TypeScript et réexports, à distinguer d'un éventuel contrôle des cycles runtime.
- AC-06 : si Q8 retient un déplacement, les caractérisations concernées avant/après, dont Cricket, Capital et le golden Triathlon v2, donnent les mêmes résultats ; les imports de production et les validateurs restent cohérents. Aucun test de règle active n'est supprimé ou affaibli.
- AC-07 : une session valide et non expirée, de version 1 ou 2, comportant `KILLER_STATS` ou `GOTCHA_STATS` reste récupérable et revient à la sélection ; une session invalide reste rejetée. Les tests de reprise X01 et multi-jeux, sous-jeux Triathlon, undo et partenaire restent verts.
- AC-08 : preuves des commandes `npm run lint`, `npm run lint:type-aware`, `npm run typecheck`, `npm run test:unit`, `npm run test:unit:coverage`, `npm run governance:coverage` et `npm run build` ; `npm run guard:clean` si concerné. Les E2E et smoke sont exécutés **uniquement en CI**, avec lien aux résultats, jamais localement.
- AC-09 : `docs/architecture.md` et `AGENTS.md` reflètent les décisions et l'arborescence effectivement livrée ; aucune fonctionnalité non livrée n'est annoncée.

## 20. Scénarios de tests

Tests d'outillage couvrant AC-01 à AC-03, cas de comportement sur les chemins réellement utilisés et compatibilité des sessions. Rejouer notamment les tests existants [X01](../../tests/unit/x01/matchScoring.test.ts), [rotation et places](../../tests/unit/application/x01OrderAndPlacements.test.ts), [totaux](../../tests/unit/reachableTotals.test.ts), [Triathlon](../../tests/unit/triathlonScoringGolden.test.ts), [reprise](../../tests/unit/session/gameReload.test.tsx) et [partenaire](../../tests/unit/session/externalLinkRecovery.test.tsx). Les E2E/smoke existants restent réservés à la CI.

## 21. Exigences de non-régression

Préserver les tests de règles actives même lorsqu'ils partagent un fichier avec des tests du modèle historique. Vérifier ouverture/sortie, robot, voix, doublettes, ordre et places à 3–4 joueurs, limite de volées et bull, résultat partenaire, reprise et undo. Ne pas diminuer les seuils de couverture ou désactiver le lint.

## 22. Risques

| Risque | Impact | Mitigation proposée |
|---|---|---|
| Suppression de règles actives ou tests mixtes avec le modèle historique | Élevé | Inventaire par symbole et tests des chemins de production avant/après. |
| Déplacement Triathlon vers un domaine dépendant de features/application | Élevé | Séparer calcul, règles et composition avant de choisir leur couche ; coordonner 058. |
| Perte de session ou de préférences en déplaçant contrats et écrans | Élevé | Garder les champs et clés ; tester les anciens écrans, versions de session et rechargements. |
| Contrôle contourné par alias, type import ou réexport ; exception trop large | Élevé | Tests de chaque syntaxe, référence d'exceptions par arête et contrôle des remplacements. |
| Blocage circulaire 056/057 ou conflits avec 058 | Moyen | Socle et nettoyage séparés, décision préalable de propriété et d'ordre (Q10). |
| Règle de lint supposée prouver l'approbation d'une exception | Moyen | Différencier contrôle automatique du différentiel et revue humaine ; aucune modification de protection implicite. |

## 23. Décisions architecturales

Aucune décision nouvelle n'est prise par ce cadrage. L'ADR-0002 propose une source X01 unique et conditionne le sort des use cases historiques ; les ADR-0001 et 0005 portent respectivement l'état de jeu et la projection. Toutes trois restent `proposee`. Une ADR dédiée aux frontières est ouverte en Q4.

## 24. Questions ouvertes

| # | Question | Options | Recommandation justifiée, non décidée | Décision |
|---|---|---|---|---|
| Q1 | Sort du modèle et des use cases historiques X01 ? | Rebrancher après caractérisation / retirer après bascule 057 / conserver temporairement | Partir du chemin réellement joué, puis retirer uniquement les éléments historiques dont les tests utiles ont été repris ; les modules actifs restent. Coordonner la Q1 de 057. | — |
| Q2 | `features/` peut-il contenir de l'UI et dépendre de `components/ui` ? | Tranche verticale avec UI / déplacer les composants / autre limite | Admettre les composants et primitives UI réutilisables, sans cycle et avec façades pour les vues ; c'est l'usage vocal actuel. | — |
| Q3 | Que faire des écrans `KILLER_STATS` / `GOTCHA_STATS` ? | Garder / retirer de la navigation en conservant la compatibilité / réutiliser via 049 ou 053 | Retirer seulement si la normalisation des sessions historiques est préservée et testée ; coordonner les futures statistiques. | — |
| Q4 | Faut-il une ADR dédiée aux frontières ? | Section d'architecture / nouvelle ADR | Section d'architecture si la matrice ne tranche pas une décision structurante nouvelle ; sinon ADR soumise au mainteneur et au PO. | — |
| Q5 | Où placer types du noyau et contrats de session ? | `src/domain/shared` / primitives dans `src/shared` et session hors noyau / autre découpage | Séparer primitives métier pures et contrat de reprise, puis conserver des réexports transitoires ; ne pas déplacer la dépendance circulaire telle quelle. | — |
| Q6 | Quelle matrice et quel contrôle effectif, notamment pour l'infrastructure et les syntaxes non couvertes ? | Lint natif limité / lint complété par contrôle AST ou graphe avec outils présents / autre outil justifié | Prototyper avec l'outillage existant et retenir la solution qui passe AC-01/02 ; expliciter les modèles de features consommés par les adaptateurs, sans masquer les limites du lint natif. | — |
| Q7 | Comment limiter et approuver les exceptions ? | Aucune / arêtes précisément documentées avec cliquet / autre processus | Référence par arête comparée à une base de confiance, sans augmentation ou substitution silencieuse ; approbation humaine séparée pour toute évolution de référence. | — |
| Q8 | Quelle portée pour les moteurs legacy ? | Déplacer tous vers `domain` / découper selon responsabilités / conserver certains emplacements | Déplacer par responsabilité et jeu après caractérisation ; Triathlon dépend aujourd'hui de stats applicatives et d'une façade feature. Coordonner 058. | — |
| Q9 | Retirer les stubs de partage maintenant ou avec 084 ? | Retrait autonome / reprise par 084 / maintien temporaire | Retrait ciblé après tests des appels et de leur chronologie, sans toucher à `SessionRepository`, si 084 ne l'a pas déjà traité. | — |
| Q10 | Quel séquencement 056/057/058 ? | Socle 056 puis 057 puis nettoyage / autre découpage explicitement validé | Socle 056 avant la bascule 057, nettoyage historique après, moteurs coordonnés avec 058 ; évite d'exiger la clôture mutuelle préalable. | — |

## 25. Traçabilité

- [Rapport architecture de l'audit](../../docs/v2/audit/02-architecture.md) et [compte rendu](../../docs/v2/compte-rendu-audit-2026-11-20.md) : photographie `508dfa6`.
- Inventaire actuel : `7b454d3`, le 2026-11-26, références en §4. Il ne valide ni les critères cibles ni l'implémentation : `verifie_au_commit` reste à renseigner après livraison.
- Suivi : [issue #235](https://github.com/floriangiral/Bougnat_darts_counter/issues/235) ; specs liées : 002, 010, 022, 029, 039, 043, 045, 046, 048, 049, 053, 054, 057, 058, 084, 085.
