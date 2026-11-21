---
id: 056-counter-arch-layer-boundaries
v2_id: V2-ARCH-01
titre: Frontières de couches et sort du domaine X01 inutilisé
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
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 056 — Frontières de couches et sort du domaine X01 inutilisé

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
- Audit V2 : rapport architecture §3 (direction des dépendances, cycles), §5 (D1-D3), §7 (T2, T10), CA-5 ; compte rendu B.3, C.9 et H.24.
- La règle de dépendance documentée (`docs/architecture.md:105-109`) n'est outillée nulle part ; les gros chantiers V2 (specs 057, 058, 063, 084) vont déplacer beaucoup de code et risquent d'aggraver la dérive.
- Le catalogue fusionne ici les propositions « carte des couches » et « noyau de types / moteurs legacy » du rapport architecture (V2-ARCH-01 et V2-ARCH-02 provisoires).
- Reliquat de la spec 002 (frontière OSS) et de la spec 022 (découpage).

## 2. Problématique
Les couches `domain` / `application` / `features` / `infrastructure` existent mais ne sont pas respectées ni contrôlées ; un domaine X01 « officiel » non utilisé et des stubs hérités induisent en erreur contributeurs et agents.

## 3. Objectifs
- O1 : une règle de dépendance outillée, bloquante en CI, sans nouvelle dépendance.
- O2 : zéro violation non justifiée à la clôture (liste d'exceptions vide ou motivée).
- O3 : suppression du cycle conceptuel de types.
- O4 : décision tracée et exécutée sur `src/domain/scoring`, les use cases non branchés et les stubs.
- O5 : aucun changement de comportement.

## 4. État actuel vérifié dans le code
- [vérifié] Règle documentée : `docs/architecture.md:105-109` ; aucune règle `no-restricted-imports` ni plugin de frontières dans `eslint.config.js` / `eslint.type-aware.config.js` ; `scripts/guard-clean-codebase.sh` ne vérifie que l'absence de fichiers legacy.
- [vérifié] `npm run lint` s'exécute avec `--max-warnings 0` (`package.json:15`) : une règle en `warn` ferait échouer la CI.
- [vérifié] Violations :
  - V1 `domain` → racine `types.ts` : `src/domain/killer/killer.ts:1`, `src/domain/gotcha/gotcha.ts:1`, `src/domain/x01Bot/x01Bot.ts:1` ;
  - V2 `application` → `features` : `src/application/x01Bot/x01BotTurn.ts:4` (traitée par la spec 057) ;
  - V3 `features` → `app` : `src/features/tablet/tabletLayout.ts:1`, `src/features/tablet/useTabletLayout.ts:2` ;
  - V4 `shared` → `utils` : `src/shared/session/persistedAppSession.ts:10` (`GameType`) ;
  - V5 `infrastructure` → `utils` : `src/infrastructure/local/IndexedDBSessionRepository.ts:4` ;
  - V6 `utils` → `application` : `utils/triathlonScoring.ts:2` ;
  - V7 `features` → `components` : `src/features/x01/voice/VoiceScoringControl.tsx:4`.
- [vérifié] Cycle de types : `types.ts:112-113,123` importe `src/domain/killer` et `src/domain/gotcha`, `types.ts:149` importe `utils/triathlonScoring` ; ces modules importent `types.ts`. Aucun cycle d'exécution (imports de types) [rapport 02, vérifié outil].
- [vérifié] Domaine non branché : `src/domain/scoring/**` (`ScoringRules`, `ScoreValidator`, `ScoreInput`, `Checkout`, entités `Game/Leg/Turn/Throw/Score`) n'est importé que par `src/application/scoring/RecordThrow.ts:3` et `tests/unit/x01/scoringDomain.test.ts:3` ; `RecordThrow`, `UndoThrow`, `StartGame`, `EndLeg`, `EndGame` ne sont utilisés que par les tests.
- [vérifié] Stubs et code mort : `useSharedX01Session` no-op (`src/features/x01/session/useSharedX01Session.ts:11-21`) appelé par `views/MatchView.tsx:273` ; `SyncRepository = Record<string, never>` (`src/application/scoring/ports.ts:10`) ; écrans `KILLER_STATS`/`GOTCHA_STATS` déclarés (`src/app/appShell.ts:21,23`) mais jamais rendus par `App.tsx`.
- [vérifié] Helpers transverses logés dans le moteur X01 : `formatDuration` et `getOrderedPlayersAndStarter` (`src/application/scoring/matchLifecycle.ts:8,87`) importés par toutes les vues de jeu.
- [vérifié] Moteurs legacy à la racine : `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `utils/triathlonScoring.ts` (452 lignes).

## 5. Comportement cible
Une configuration ESLint par dossier interdit les imports vers une couche plus externe ; les violations existantes sont listées dans une liste d'exceptions explicite qui ne peut que diminuer. Le noyau de types partagé vit dans le domaine ; `types.ts` devient un ré-export transitoire. Le domaine X01 non branché, les use cases morts et les stubs sont supprimés (ou rebranchés selon Q1). `docs/architecture.md` décrit l'arborescence réelle.

## 6. Périmètre
### Inclus
- Règles `no-restricted-imports` par couche ; liste d'exceptions ; test de la configuration.
- Déplacement de `Player`, `GameConfig`, `InOutRule`, `MatchMode`, `GameType` vers `src/domain/shared/` avec ré-export transitoire.
- Déplacement des moteurs `utils/*Logic.ts` et `utils/triathlonScoring.ts` vers `src/domain/<jeu>/` avec ré-exports transitoires.
- Déplacement de `formatDuration` (présentation) et de la rotation (`src/domain/match/rotation.ts`).
- Suppression (ou rebranchement) de `src/domain/scoring`, des use cases non branchés, de `useSharedX01Session`, `SyncRepository`, des écrans morts.
- Convention écrite : `features/` = tranche verticale pouvant contenir hooks et composants.
### Exclu
- Unification des règles X01 (spec 057) ; extraction des états de jeu (spec 058) ; purge de `current_matches` et `getCurrentMatch` (spec 010).
- Déplacement physique de `views/` et `components/` sous `src/` (gain métier non démontré, constitution transverse §6).

## 7. User stories
- En tant que contributeur ou agent IA, je veux qu'un import interdit soit refusé par le lint, afin de ne pas réintroduire de dépendance inversée.
- En tant que mainteneur, je veux ne trouver qu'une seule implémentation des règles réellement exécutées, afin de ne pas corriger un code mort.

## 8. Règles métier
Sans objet : aucune règle de jeu n'est modifiée ; la spec porte sur la structure du code.

## 9. Parcours utilisateurs
Sans objet pour l'utilisateur final (aucun changement visible). Parcours contributeur : `npm run lint` signale toute nouvelle violation.

## 10. Exigences fonctionnelles
- FR-01 : `src/domain/**` ne peut importer que `src/domain/**` et `src/shared/**` (règle documentée actuelle), `src/shared/**` ne pouvant lui-même importer ni `utils/` ni une couche externe.
- FR-02 : `src/application/**` ne peut importer que `src/domain/**`, `src/shared/**`, `src/application/**`.
- FR-03 : `src/infrastructure/**` ne peut pas importer `views/`, `components/`, `src/features/`, `src/app/`.
- FR-04 : `src/features/**` ne peut pas importer `src/app/**` ni `views/**`.
- FR-05 : les règles sont déclarées en `error` ; les violations existantes sont listées fichier par fichier dans une liste d'exceptions commentée (motif + spec de résorption) ; la CI échoue si un fichier est ajouté à la liste sans revue.
- FR-06 : le noyau de types est déplacé ; `types.ts` ne fait que ré-exporter et ne dépend plus d'aucun module de domaine ni de `utils/`.
- FR-07 : `utils/` ne contient plus de moteur de jeu à la clôture (ré-exports transitoires supprimés une fois les imports migrés).
- FR-08 : `src/domain/scoring` et les use cases non branchés sont supprimés, sauf décision Q1 contraire ; les tests qui les ciblent sont supprimés ou portés sur le module de la spec 057.
- FR-09 : `useSharedX01Session` et `SyncRepository` sont supprimés ; la diffusion future passera par le port défini dans la spec 084/085 (ADR-0005).
- FR-10 : les valeurs `KILLER_STATS` et `GOTCHA_STATS` sont supprimées de `AppScreen` sauf si la spec 049 les utilise (Q3).
- FR-11 : `scripts/guard-clean-codebase.sh` ajoute les fichiers supprimés à sa liste `must_not_exist`.

## 11. Exigences non fonctionnelles
- NFR-01 : aucune nouvelle dépendance (règle native ESLint) ; coût récurrent 0 €.
- NFR-02 : durée du lint augmentée de moins de 10 % [à mesurer].
- NFR-03 : `npm run typecheck`, `npm run test:unit` et `npm run build` verts à chaque étape.

## 12. Cas nominaux et alternatifs
- Nominal : un import `src/domain/x → views/y` est ajouté → `npm run lint` échoue avec un message citant la règle et la spec 056.
- Alternatif : un déplacement transitoire nécessite un ré-export → l'import passe par le ré-export autorisé.

## 13. Cas limites
Imports de types (`import type`) ; alias `@/` ; imports dynamiques (`import()` dans `types.ts`) ; fichiers de tests (non soumis aux règles de couche).

## 14. Gestion des erreurs
Message d'erreur ESLint explicite (« Le domaine ne doit pas dépendre de … — voir docs/architecture.md »).

## 15. Impacts architecturaux
Carte cible : `domain` (règles pures, types du noyau) ← `application` (cas d'usage, ports) ← `features` (tranches verticales) ← `views`/`components`/`App` ; `infrastructure` dépend de `application`/`domain`/`shared`. `utils/` racine est vidé de ses moteurs. Aucune nouvelle abstraction.

## 16. Impacts sur les données et les interfaces
Aucun : formats persistés et contrat `v=1` inchangés.

## 17. Compatibilité avec l'existant
Déplacements purs avec ré-exports transitoires ; aucun changement de comportement.

## 18. Dépendances
- Prérequis : V2-QA-01 (039) pour sécuriser les déplacements de moteurs.
- Ordonnancement : la suppression de `src/domain/scoring` (FR-08) intervient après la bascule de la spec 057 (V2-ARCH-03) ; la suppression de `useSharedX01Session` est indépendante de la TV (le stub n'émet rien).
- Liens : spec 002 (frontière OSS), spec 022 (reliquat), V2-QA-10 (043, `guard:clean` en CI), V2-DOC-03 (036, `AGENTS.md`).

## 19. Critères d'acceptation
- AC-01 : un fichier de test d'outillage (`tests/unit/tooling/`) vérifie qu'un import `src/domain → views` produit une erreur ESLint.
- AC-02 : à la clôture, la liste d'exceptions est vide ou chaque entrée cite un motif et une spec ouverte.
- AC-03 : `types.ts` ne contient plus aucun `import(` vers `src/domain` ni `utils/` (grep).
- AC-04 : `grep -rn "domain/scoring\|RecordThrow\|useSharedX01Session\|SyncRepository" src views components App.tsx` ne renvoie rien (sauf décision Q1 = rebrancher).
- AC-05 : `utils/` ne contient plus `cricketLogic.ts`, `capitalLogic.ts`, `triathlonScoring.ts` ; `guard:clean` les interdit.
- AC-06 : suites `typecheck`, `test:unit`, `build` et E2E smoke identiques avant/après.
- AC-07 : `docs/architecture.md` décrit l'arborescence réelle (racine `views/`, `components/`, `utils/` comprises) et la règle outillée.

## 20. Scénarios de tests
Test d'outillage ESLint (violation volontaire dans un fichier fixture) ; suites unitaires et E2E existantes rejouées ; pas de nouveau test fonctionnel.

## 21. Exigences de non-régression
Tous les tests unitaires et E2E existants ; couverture inchangée ou supérieure (spec 029).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Conflits de fusion avec 057/058 | Moyen | Élevée | Déplacements en PR courtes, avant ou entre les extractions |
| Liste d'exceptions qui devient permanente | Moyen | Moyenne | Chaque entrée cite une spec ; revue à chaque release |
| Supprimer un code qu'un futur besoin aurait réutilisé | Faible | Faible | Historique git ; ADR-0002 documente la décision |

## 23. Décisions architecturales
- ADR-0002 : les use cases existants ne sont rebranchés que s'ils passent les tests du chemin réel, sinon supprimés (cette spec).
- ADR-0001 : les reducers vivent dans `src/domain/<jeu>`.
- Aucune ADR dédiée aux frontières de couches n'est prévue dans `docs/adr/` : à décider (Q4).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Domaine X01 inutilisé (H.24) | Rebrancher après tests / supprimer | Supprimer après avoir repris dans la spec 057 ce qui passe les golden tests | — |
| Q2 | `features/` peut contenir de l'UI | Régulariser / déplacer les composants | Régulariser (convention écrite), moins coûteux | — |
| Q3 | Écrans `KILLER_STATS` / `GOTCHA_STATS` | Supprimer / garder pour la spec 049 | Supprimer ; la spec 049 les recréera si besoin | — |
| Q4 | ADR dédiée aux frontières | Nouvelle ADR / section de `docs/architecture.md` | Section de `docs/architecture.md` (règle outillée = documentation vivante) | — |
| Q5 | Emplacement du noyau de types | `src/domain/shared/` / `src/domain/match/` | `src/domain/shared/` | — |

## 25. Traçabilité
- Rapports : `reports/02-architecture.md` §3, §5, §7, CA-5, §9 ; compte rendu B.3, C.9, H.24.
- Specs liées : 002, 022, 029, 036, 039, 043, 049, 057, 058, 084, 085.
- Code vérifié au commit `508dfa6`.
