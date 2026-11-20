# Plan — 055 Mode Découverte : première partie guidée

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Setup et règles : `views/SetupView.tsx:185`, `:390-393` ; `src/features/game-setup/setupPresentation.ts:97-144` ; `components/game-setup/SetupRulesModal.tsx`.
- Aide de fin : `components/game/CheckoutHint.tsx:8-17`, `constants.ts:3`, `src/features/x01/scoring/checkoutEligibility.ts:5-15`.
- Configuration : `types.ts:14-26` (`GameConfig`), `src/features/game-setup/setupModel.ts`.
- Vues de jeu : `views/MatchView.tsx`, `views/CricketGameView.tsx` (à travers le cadre commun de V2-GAMES-06, 049).

## 2. Approche retenue (et alternatives écartées)

- Retenue : drapeau `discovery` dans la configuration, fonctions pures `getDiscoveryTip` par jeu dans la couche application, bandeau unique dans le cadre de jeu commun.
- Écartée : conseils codés dans chaque vue (duplication, règles dans l'UI).
- Écartée : variante de règles « simplifiée » inventée (créerait une nouvelle règle maison) ; le préréglage réutilise des options existantes.
- Écartée : tutoriel modal bloquant en plusieurs pages (alourdit le parcours).

## 3. Étapes

1. Vérifier la livraison de 049 (barre de partie, bouton Règles) et 045 (aide de fin contextuelle).
2. Ajouter `discovery?: boolean` à `GameConfig` et au modèle de setup ; préréglage débutant X01.
3. Écrire `getDiscoveryTip` X01 (tables) puis Cricket, avec tests par table et test exhaustif des restes.
4. Créer le composant de présentation de la cible (texte + SVG inline accessible).
5. Créer le bandeau de conseil (`aria-live`) et l'intégrer au cadre de jeu commun.
6. Faire relire les textes ; test terrain avec des débutants.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `types.ts` | `GameConfig.discovery?` |
| `src/features/game-setup/setupModel.ts`, `setupPresentation.ts` | Interrupteur, préréglage, textes |
| `views/SetupView.tsx` | Interrupteur et préréglage |
| `src/application/discovery/x01Tips.ts`, `cricketTips.ts` (nouveaux) | Conseils purs |
| `components/discovery/DiscoveryTipBanner.tsx`, `DartboardIntro.tsx` (nouveaux) | Présentation |
| Cadre de jeu commun (049) | Point d'insertion du bandeau |
| `tests/unit/discovery/*`, `tests/e2e/discovery.spec.ts` (nouveaux) | Tests |

## 5. Impacts UI / domaine / application / infrastructure

- UI : interrupteur, bandeau, présentation de la cible. Domaine : aucun. Application : conseils purs. Infrastructure : aucune.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Champ optionnel : une session restaurée sans `discovery` est traitée comme désactivée. Contrat 030 inchangé.

## 7. Stratégie de test

- Unitaires par table (≥ 30 restes par règle) + test exhaustif 2-170 × 3 règles (AC-02, AC-03).
- Composants : bandeau, masquage, présentation (AC-04, AC-05).
- E2E : mode désactivé inchangé (AC-01), reprise (AC-06).
- Terrain : lecteur d'écran (AC-07), 5 débutants (AC-09).

## 8. Non-régression

- E2E existants X01 et Cricket ; INP (020) ; lien 030.

## 9. Rollback / désactivation (feature flag le cas échéant)

- Masquer l'interrupteur (drapeau de build) ; le champ `discovery` éventuellement restauré est ignoré.

## 10. Documentation à mettre à jour avec l'implémentation

- Guide utilisateur (V2-DOC-05, 037), `README.md`, notes de release, changelog in-app.
