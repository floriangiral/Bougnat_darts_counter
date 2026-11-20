# Plan — 040 Parcours E2E complets par jeu (partie, annulation, rechargement)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `tests/e2e/helpers.ts:4-74` (`gotoGameSelection`, `openSetup`, `startConfiguredGame`, `pickDefaultStarterIfNeeded`, `seedAppSession`).
- Modèle de parcours complet : `tests/e2e/external-match-link.smoke.spec.ts:20-29` (`startLinkedMatch`), `:172-186` (partie jouée), `:372-380` (rechargement).
- Tests à réorganiser : `tests/e2e/completion.smoke.spec.ts`, `tests/e2e/navigation.smoke.spec.ts`.
- Montage des vues : `App.tsx:354-420` ; claviers inline : `views/KillerGameView.tsx`, `views/GotchaGameView.tsx`.
- Configuration : `playwright.config.ts:16-22` (projet `chromium`), `.github/actions/run-local-smoke/action.yml`.

## 2. Approche retenue (et alternatives écartées)

Retenue : objets de page par jeu + un fichier de parcours par jeu ; rechargement en `test.fixme` conditionné à 010.
Écartées : sessions injectées uniquement (ne teste pas la saisie réelle) ; tests de composants seuls (ne testent ni le routage d'écrans, ni le plein écran, ni la persistance réelle) — ils sont couverts par 039.

## 3. Étapes

1. Ajouter les `data-testid` aux claviers Killer et Gotcha (préfixes `killer-keypad-*`, `gotcha-keypad-*`) ; vérifier l'absence de changement visuel.
2. Créer `tests/e2e/pages/{x01,cricket,capital,killer,gotcha,triathlon}.ts` (actions : `play(…)`, `undo()`, `expectScore(…)`, `expectWinner(…)`).
3. Créer `tests/e2e/journeys/<jeu>.journey.spec.ts` : parcours complet + rechargement (`fixme` hors X01).
4. Renommer `completion.smoke.spec.ts` → `game-setup-navigation.smoke.spec.ts`, y fusionner `navigation.smoke.spec.ts`, corriger l'en-tête `// Spec:`.
5. Exécuter 10 fois en local (`--repeat-each=10`, projet `chromium`) ; corriger toute instabilité.
6. À chaque livraison de 010 pour un jeu : retirer le `fixme` correspondant.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `views/KillerGameView.tsx`, `views/GotchaGameView.tsx` | Ajout d'attributs `data-testid` (aucune logique) |
| `tests/e2e/pages/*.ts` | Création |
| `tests/e2e/journeys/*.journey.spec.ts` | Création |
| `tests/e2e/completion.smoke.spec.ts`, `navigation.smoke.spec.ts` | Renommage / fusion |
| `tests/e2e/smartphone-layout.smoke.spec.ts:8` | Remplacer `'main button'` par un `data-testid` |

## 5. Impacts UI / domaine / application / infrastructure

UI : attributs de test seulement. Domaine, application, infrastructure : aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet. Les tests de rechargement suivront le schéma de session versionné de 010.

## 7. Stratégie de test

Les tests sont le livrable. Durée mesurée et consignée ; 10 exécutions vertes avant de rendre le job bloquant. Les parcours servent de preuve « acceptation E2E » exigée par l'invariant 5 de 029 pour chaque vue exclue.

## 8. Non-régression

Toutes les vérifications des fichiers renommés sont conservées ; `npm run test:unit` inchangé ; les tests tablette/smartphone utilisant les nouveaux `data-testid` restent verts.

## 9. Rollback / désactivation

Retirer le dossier `tests/e2e/journeys/` ou le marquer `test.describe.skip` ; les `data-testid` sont inoffensifs et peuvent rester.

## 10. Documentation à mettre à jour avec l'implémentation

- Guide de test (spec 035 ou `docs/technical.md`) : objets de page, convention `// Spec:`.
- Spec 029 : référencer 040 comme preuve E2E des vues exclues (révision V2 de 029).
