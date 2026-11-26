# Plan proposé — 056 Frontières de couches

> Document préparatoire : aucune étape d'implémentation avant validation de [la spec](spec.md) et arbitrage de ses questions. Les choix ci-dessous sont des pistes, pas des décisions prises.

## 1. Point de départ

- Inventaire au commit `7b454d3` : [spec §4](spec.md#4-état-actuel-vérifié-dans-le-code). L'ancien exemple `application → features` du robot est résorbé ; d'autres écarts, notamment `shared → features` et `infrastructure → features`, sont apparus ou ont été omis de l'audit.
- Distinguer les [règles X01 actives](../../src/domain/scoring/) des [classes applicatives historiques](../../src/application/scoring/) : ne pas supprimer le dossier `domain/scoring` en bloc sans avoir préalablement migré et vérifié ses fonctionnalités actives et leurs consommateurs.
- Les trois moteurs de [`utils/`](../../utils/) sont utilisés en production. Le [calculateur Triathlon](../../utils/triathlonScoring.ts) dépend notamment des stats applicatives et d'une façade de feature ; les [types et le barème](../../src/domain/triathlon/) sont déjà partiellement dans le domaine.
- La [reprise versionnée](../../src/app/sessionRecovery.ts) et les [instantanés multi-jeux](../../src/shared/session/persistedAppSession.ts) existent déjà. `KILLER_STATS` et `GOTCHA_STATS` sont normalisés à la restauration ; le port `SessionRepository` est actif.

## 2. Approches à arbitrer

1. **Contrôle des frontières (Q2, Q6, Q7).** Tester d'abord l'outillage en place. `no-restricted-imports` natif couvre des imports/exports statiques, mais pas à lui seul les requêtes de type `import(...)` ni les imports dynamiques ; les alias et chemins équivalents exigent une configuration adaptée. Étudier un contrôle AST ou de graphe complémentaire avec les outils déjà disponibles, en justifiant son coût. Une autre dépendance d'outillage n'est qu'une option à justifier et valider ; aucune dépendance runtime nouvelle.
2. **Exceptions.** Préférer une référence par arête source → cible, avec motif et responsable/spec de résorption, plutôt qu'une exemption de fichier. Comparer à une référence de confiance : ni ajout ni substitution silencieuse à nombre égal. Le contrôle automatisé ne peut pas prouver à lui seul qu'une modification de sa propre référence a été approuvée ; cette revue reste à tracer séparément, sans changement implicite de protection.
3. **Modèles et moteurs (Q1, Q5, Q8, Q9).** Isoler les primitives sans y entraîner les contrats de session ou des dépendances inversées. Retenir ou supprimer les seules classes historiques après décision conjointe avec 057 ; préserver les modules de règles actifs. Découper les moteurs par responsabilité plutôt que déplacer directement Triathlon avec ses imports externes.
4. **UI et adaptateurs (Q2, Q6).** Définir explicitement l'usage des composants partagés dans une feature et le traitement des adaptateurs qui consomment les modèles de préférences. La convention actuelle demande déjà une façade feature pour les nouveaux imports UI → domaine.

## 3. Séquencement proposé

1. **Préconditions** : validation de 056 et décisions Q1 à Q10 ; identifier les résultats disponibles de [039](../039-counter-qa-golden-rules-characterization/spec.md), son statut et les scénarios nécessaires. N'exécuter aucune spec `a-valider`. Convenir avec les responsables de 057/058 de la propriété des fichiers et des PR.
2. **Socle 056** : inventorier les arêtes de production, formes d'import et exceptions réelles ; proposer une matrice. Prototyper puis tester le contrôle retenu, notamment les imports interdits par alias ou réexport, avant de le brancher à la commande existante. Les règles historiques non résorbées restent des exceptions ciblées et mesurées.
3. **Contrats et cycles** : selon Q5, séparer types élémentaires et contrat de reprise ; résoudre les cycles de types connus et les imports vers l'extérieur dans `shared`. Traiter le type **et** les appels de valeurs `features → app`, puis les dépendances des adaptateurs `infrastructure`. Ne pas changer les structures JSON ni les clés de stockage.
4. **Moteurs et helpers** : après caractérisation 039 des chemins concernés et selon Q8, migrer par jeu avec des réexports de transition bornés ; découper d'abord les dépendances applicatives/feature du Triathlon. Étudier séparément `formatDuration`, `getOrderedPlayersAndStarter` et la rotation X01 déjà extraite dans `x01Rotation.ts`.
5. **Bascule 057, puis nettoyage 056** : si 057 est validée, elle peut utiliser le socle de 056 sans attendre sa clôture ; elle traite les règles/commandes. Après sa bascule et la décision Q1, retirer ou rebrancher **seulement** les éléments historiques, transférer les tests utiles et garder les modules de règles actifs et leurs autres consommateurs.
6. **Stubs et écrans** : selon Q3/Q9 et la coordination 084, traiter les appels du no-op en conservant la chronologie observable ; garder `SessionRepository`. Si les noms d'écrans sont retirés, assurer la normalisation des valeurs historiques avant leur validation comme écran navigable.
7. **Finalisation** : supprimer les seuls réexports devenus inutiles, vérifier le différentiel des exceptions et documenter les exceptions restantes. Mettre à jour la documentation commune et, seulement si le choix validé le justifie, les chemins interdits par `guard:clean`.

Cette séquence évite une dépendance circulaire de clôture : 057 évoque le contrôle 056 tandis que le nettoyage X01 de 056 pourrait attendre 057. L'en-tête de 057 ne fait pas de 056 un préalable formel. Si les arbitrages changent cet ordre, consigner le nouveau jalon et son propriétaire ; ne pas supposer que 057 ou 058 sont déjà validées.

## 4. Fichiers potentiellement concernés après validation

| Zone | Effet envisagé, conditionnel |
|---|---|
| [`eslint.config.js`](../../eslint.config.js), contrôle AST/graphe éventuel | Matrice et traitement des syntaxes/alias retenus ; pas de désactivation de lint. |
| `tests/unit/tooling/` | Tests ciblés du contrôle, y compris réexports et exceptions ; emplacement à confirmer. |
| [`types.ts`](../../types.ts), [`src/shared/`](../../src/shared/) et noyau à décider | Séparation des primitives et contrats, exports transitoires ; compatibilité de session. |
| [`src/features/layout/`](../../src/features/layout/), [`src/features/settings/`](../../src/features/settings/), [`src/infrastructure/`](../../src/infrastructure/) | Résorption ou exceptions documentées des arêtes actuelles, en conservant les préférences et la reprise. |
| [`utils/`](../../utils/), [`src/domain/triathlon/`](../../src/domain/triathlon/), features des jeux et vues | Découpage/migration éventuels, non un déplacement aveugle ; coordination 058. |
| [`src/domain/scoring/`](../../src/domain/scoring/), [`src/application/scoring/`](../../src/application/scoring/) | Seuls les éléments historiques décidés sont candidats au retrait/rebranchement ; règles actives préservées. |
| [`useSharedX01Session.ts`](../../src/features/x01/session/useSharedX01Session.ts), [`appScreens.ts`](../../src/app/appScreens.ts), [`sessionRecovery.ts`](../../src/app/sessionRecovery.ts) | Changements conditionnels, compatibilité des sessions anciennes obligatoire. |
| [`scripts/guard-clean-codebase.sh`](../../scripts/guard-clean-codebase.sh), [`docs/architecture.md`](../../docs/architecture.md), [`AGENTS.md`](../../AGENTS.md) | Ajustements après décision et livraison uniquement ; aucun changement de workflow ou protection déduit automatiquement. |

## 5. Impacts UI / domaine / application / infrastructure

Aucun changement visible visé. Les vues continuent d'orchestrer le parcours ; la place des composants de feature et des modèles consommés par les adaptateurs reste à arbitrer. Le découpage retenu doit éviter de dupliquer les règles jouées et les garder indépendantes de React et du stockage.

## 6. Migration et compatibilité

Pas de nouveau format de données prévu : conserver champs, valeurs et clés des préférences, l'historique et le contrat partenaire. Si Q3 retire les écrans non rendus, les sessions valides anciennes portant leurs noms doivent toujours être reconnues puis redirigées, sans purge. Les changements de chemin ne sont pas une preuve suffisante : rejouer la validation, la reprise et les sous-états Triathlon.

## 7. Stratégie de test proposée

- Contrôle : exemples autorisés/interdits de chaque zone ; import/export statique et de type, `import()` dynamique et de type, alias, réexport indirect, `require` et cible calculée ; tests du différentiel d'exceptions avec ajout et remplacement à nombre égal.
- Fonctionnel : caractérisation des chemins réellement exécutés, tests X01 (sortie/ouverture, robot, voix, doublettes, places et bull), Cricket, Capital et Triathlon, y compris le golden Triathlon déjà présent.
- Compatibilité : tests de reprise multi-jeux, d'undo, de sessions historiques et du partenaire. Préserver les tests actifs mêlés aux tests du modèle historique ; ne supprimer ou affaiblir aucun invariant pour obtenir un passage vert.
- Validation locale autorisée lors de l'implémentation : `npm run lint`, `npm run lint:type-aware`, `npm run typecheck`, `npm run test:unit`, `npm run test:unit:coverage`, `npm run governance:coverage`, `npm run build` et, si concerné, `npm run guard:clean`. Mesurer le coût du lint avant/après selon NFR-02.
- E2E et smoke : **CI uniquement**, via les workflows/actions existants ; ne jamais lancer localement de serveur, navigateur, E2E ou smoke pour ce chantier.

## 8. Non-régression

Conserver les versions de session, les clés de stockage, les règles du barème Triathlon, les nouvelles rotations X01, les volées limitées et le bull, ainsi que les parcours vocaux, robot et partenaire. Les tests existants ne dispensent pas des scénarios métier à obtenir par 039.

## 9. Rollback

Découper le futur chantier en étapes réversibles ; revenir sur la PR problématique si nécessaire. Ne pas désactiver une règle ESLint, une protection ou un test pour contourner un échec.

## 10. Documentation future

Après livraison uniquement : actualiser [`docs/architecture.md`](../../docs/architecture.md), [`AGENTS.md`](../../AGENTS.md) et, selon Q4 et les conventions, une éventuelle ADR ; documenter toute nouvelle commande si elle est effectivement introduite. La synthèse transversale de `docs/architecture.md` est déjà mise à jour par ce cadrage, sans anticiper d'implémentation.
