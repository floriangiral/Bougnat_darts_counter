---
id: 124-counter-qa-typescript-eslint-strictness
v2_id: V2-QA-16
titre: TypeScript strict et règles ESLint — verrouillage et trajectoire progressive
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P1
difficulte: S
recommandation: recommande
lot: 1
poids: 45
depend_de: [V2-QA-10]
remplace: []
remplacee_par: []
issue: '#304'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 124 — TypeScript strict et règles ESLint : verrouillage et trajectoire progressive

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§11) demande d'harmoniser ESLint et TypeScript, de choisir une sévérité adaptée à l'existant et d'interdire les contournements (désactivations globales, `any`, `@ts-ignore`). L'audit montre un code **déjà conforme** au mode strict alors que la configuration ne l'exige pas : le risque est une régression silencieuse, pas une dette à rattraper.

## 2. Problématique

`tsconfig.json` n'active aucune option stricte : un nouveau code non typé ou nullable non contrôlé passerait le `typecheck`. Trois règles React Hooks sont désactivées globalement et le lint type-aware ne bloque pas les avertissements.

## 3. Objectifs

- O1 : verrouiller immédiatement le niveau de rigueur déjà atteint (coût quasi nul).
- O2 : définir une trajectoire mesurée pour les options plus exigeantes.
- O3 : rendre visible et non croissant le nombre de contournements.

## 4. État actuel vérifié dans le code

- [vérifié] `tsconfig.json:1-32` : ni `strict` ni option stricte individuelle ; `allowJs: true`, `skipLibCheck: true`, `experimentalDecorators: true`, `useDefineForClassFields: false` ; aucun `include` (tout le projet).
- [vérifié] Mesures en lecture seule (`tsc --noEmit -p tsconfig.json`, 2026-11-20) : `--strict` → **0 erreur** ; `+ noUnusedLocals noUnusedParameters` → 0 ; `+ noImplicitReturns noFallthroughCasesInSwitch noImplicitOverride` → 0 ; `+ exactOptionalPropertyTypes` → **33** erreurs ; `+ noUncheckedIndexedAccess` → **323** erreurs.
- [vérifié] ESLint : `typescript-eslint` recommandé (`eslint.config.js:46`), `no-explicit-any: error` (`:62`), `no-unused-vars: error` (`:63`) ; règles `react-hooks/purity`, `react-hooks/set-state-in-effect`, `react-hooks/refs` désactivées (`:67, 69, 70`), `exhaustive-deps` en avertissement (`:68`) rendu bloquant par `--max-warnings 0` (`package.json:15`).
- [vérifié] Réactivation mesurée (configuration de sonde hors dépôt, 2026-11-20) : `purity` 0 violation, `set-state-in-effect` 9, `refs` 6.
- [vérifié] Contournements présents : 2 `eslint-disable-next-line react-hooks/exhaustive-deps` (`views/MatchView.tsx:164, 228`) ; 0 `@ts-ignore` / `@ts-expect-error` ; 0 `any` explicite.
- [vérifié] Lint type-aware (`eslint.type-aware.config.js`, `recommendedTypeChecked`) absent de la CI et sans `--max-warnings 0` (`package.json:16`) — correction CI portée par 043.
- [vérifié] `ecmaVersion: 2020` pour les fichiers TS (`eslint.config.js:49`) contre `target: ES2022` (`tsconfig.json:3`).

## 5. Comportement cible

1. `strict: true` et les options à 0 erreur activées immédiatement.
2. `exactOptionalPropertyTypes` corrigé en un lot (33 erreurs) puis activé.
3. `noUncheckedIndexedAccess` activé d'abord sur `src/domain/` et `src/application/` via une configuration dédiée vérifiée en CI, puis étendu dossier par dossier.
4. `react-hooks/purity` réactivée ; `set-state-in-effect` et `refs` traitées (15 cas) puis réactivées, ou justifiées (Q2).
5. Un « cliquet » CI empêche l'augmentation du nombre de directives de désactivation et d'options relâchées.

## 6. Périmètre

### Inclus
- `tsconfig.json`, configurations ESLint, cliquet de contournements, corrections des 33 + 15 cas, trajectoire de `noUncheckedIndexedAccess`.

### Exclu
- Intégration du lint type-aware en CI (043) ; règles de couches (056) ; refactorings de vues au-delà des corrections ciblées.

## 7. User stories

- En tant que mainteneur, je veux qu'un code nullable non contrôlé échoue au `typecheck`, afin d'éviter des plantages en partie.
- En tant qu'agent IA, je veux des règles explicites et un compteur de contournements, afin de ne pas « verdir » la CI en désactivant une règle.

## 8. Règles métier

- RM-01 Aucune option stricte ne peut être désactivée sans décision du product owner.
- RM-02 Toute directive de désactivation porte une justification sur la même ligne (`-- raison`) ; leur nombre total ne peut pas augmenter sans justification acceptée en revue.
- RM-03 `any` explicite, `@ts-ignore` et `@ts-nocheck` interdits ; `@ts-expect-error` autorisé avec justification dans les tests seulement.

## 9. Parcours utilisateurs

Contributeur : `npm run typecheck` et `npm run lint` localement, mêmes résultats en CI.

## 10. Exigences fonctionnelles

- FR-01 `tsconfig.json` : `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride` ; retrait d'`experimentalDecorators`/`useDefineForClassFields` si aucun décorateur n'est utilisé [à confirmer].
- FR-02 Lot de correction des 33 erreurs `exactOptionalPropertyTypes`, puis activation.
- FR-03 `tsconfig.strict-core.json` (extends + `noUncheckedIndexedAccess`, `include` domaine/application) ; script `typecheck:core` ; exécution CI ; extension progressive (Q1).
- FR-04 ESLint : `ecmaVersion` aligné sur `ES2022` ; `react-hooks/purity: error` ; correction ou justification des 9 + 6 cas puis réactivation ; `@typescript-eslint/ban-ts-comment` avec description obligatoire.
- FR-05 Script `scripts/ci/count-suppressions.mjs` : compte les directives `eslint-disable`, `@ts-expect-error`, options relâchées ; compare à `quality-ratchet.json` ; échec si hausse non justifiée.
- FR-06 Documentation de la règle de contournement dans `CONTRIBUTING.md` et `AGENTS.md`.

## 11. Exigences non fonctionnelles

- NFR-01 Durée du `typecheck` en CI augmentée de ≤ 30 s [à mesurer].
- NFR-02 Coût : 0 € ; aucune dépendance nouvelle.

## 12. Cas nominaux et alternatifs

- Nominal : FR-01 sans aucune modification de code (0 erreur mesurée).
- Alternatif : une montée de dépendance introduit une erreur stricte → corrigée dans la PR Renovate (revue humaine).

## 13. Cas limites

- Fichiers JavaScript (`allowJs`) : soumis au contrôle de type selon `checkJs` (non activé) — hors trajectoire.
- Tests : `noUncheckedIndexedAccess` peut alourdir les assertions ; périmètre core d'abord.

## 14. Gestion des erreurs

Le cliquet affiche fichier, ligne et type de contournement ajouté.

## 15. Impacts architecturaux

Aucun changement de comportement ; renforcement des types aux frontières (stockage, réseau).

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Build Vite non affecté (`tsc --noEmit` séparé) ; `lint:type-aware` inchangé hors 043.

## 18. Dépendances

- Bloquante : V2-QA-10 (043, lint type-aware en CI).
- Liées : V2-ARCH-01 (056), V2-ARCH-04 (058, nouveaux moteurs écrits en mode le plus strict), V2-CICD-03 (126).

## 19. Critères d'acceptation

- AC-01 `tsconfig.json` active FR-01 ; `npm run typecheck` reste vert sans modification de code applicatif.
- AC-02 Une PR jetable introduisant un paramètre implicitement `any` échoue au `typecheck`.
- AC-03 `exactOptionalPropertyTypes` activé, 0 erreur.
- AC-04 `typecheck:core` avec `noUncheckedIndexedAccess` vert sur `src/domain/` et `src/application/`.
- AC-05 Une PR jetable ajoutant une directive `eslint-disable` sans justification échoue (cliquet).
- AC-06 `react-hooks/purity` réactivée ; décision consignée pour `set-state-in-effect` et `refs`.

## 20. Scénarios de tests

PR jetables (AC-02, AC-05) ; tests unitaires du script de cliquet (fixtures).

## 21. Exigences de non-régression

Tests unitaires, E2E et build verts ; aucun changement de comportement des jeux.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Corrections `refs`/`set-state-in-effect` modifiant le comportement des vues | Moyen | Moyenne | Tests E2E, revue, report possible après 061 |
| Cliquet contourné par modification de la référence | Faible | Faible | Revue obligatoire des modifications de `quality-ratchet.json` |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Extension de `noUncheckedIndexedAccess` | Core seul / tout le projet par lots | Core d'abord, puis `src/features`, `utils` ; vues après 061 | — |
| Q2 | `set-state-in-effect` et `refs` | Corriger maintenant / après découpage de MatchView (061) | Corriger les cas hors `views/MatchView.tsx` maintenant ; le reste avec 061 | — |
| Q3 | `lint:type-aware` bloquant sur avertissement | Oui / non | Oui (déjà proposé par 043 Q1) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` ; demande DevSecOps §11 ; specs 043, 056, 058, 061, 126.
