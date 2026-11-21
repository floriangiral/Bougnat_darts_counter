# Plan — 072 Disposition « arène » tablette paysage

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

> **Réalisation (2026-11-20)** : étape 1 (prototype sur appareil) non réalisée ; étapes 2 à 5 réalisées (composant à zones, lots X01, Cricket, Capital, Killer/Gotcha, Triathlon) ; étape 6 réalisée (vues migrées, feuille `legacy-tablet-grid.css` supprimée) ; étape 7 (arène sur PC) reportée (Q1). Révision PO du 2026-11-20 : arène portrait sur tablette (présentation de référence), en cours. Détail : section « Implémentation (2026-11-20) » de la spec.

## 1. Lecture de l'existant
- `src/styles/tailwind.css:112-259` (contrats `data-layout='tablet'`, crochets par jeu).
- Vues : `views/MatchView.tsx` (869 lignes), `CricketGameView.tsx`, `CapitalGameView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `TriathlonGameView.tsx`.
- Composants : `components/game/PlayerScore.tsx`, `MatchPlayerArea.tsx`, `CricketScoreboard.tsx`, `components/match/MatchTopBar.tsx`, `MatchInputBar.tsx:56-60`, `MatchStatusPill.tsx`.
- Modale de finish : `views/MatchView.tsx:835-857`.

## 2. Approche retenue (et alternatives écartées)
Un composant à zones + recettes CSS. Écartée : « correctifs seuls » sur les crochets par jeu (dette croissante avec les variantes voix/TV) ; un composant par appareil (duplication).

## 3. Étapes
1. Prototype X01 et Cricket sur iPad/Galaxy Tab ; décisions Q2, Q3.
2. Créer `GameScreenLayout` (zones, recettes, slots `voiceStatus`/`broadcastStatus`).
3. Lot X01 (avec V2-DS-03) : cartes, finish inline, Annuler/Valider adjacents.
4. Lot Cricket : tableau lisible, 7 lignes garanties.
5. Lot Capital ; lot Killer/Gotcha ; lot Triathlon (bandeau de phase).
6. Supprimer les crochets `.tablet-<jeu>-*` migrés.
7. Recette `arena` sur PC si Q1 validée.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `components/layout/GameScreenLayout.tsx` | Création |
| `src/styles/tailwind.css` | Recettes, suppression des crochets par jeu |
| `views/*GameView.tsx`, `views/MatchView.tsx` | Remplissage des zones |
| `components/game/*`, `components/match/*` | Échelle typographique, contrôles |
| `tests/unit/components/gameScreenLayout.test.tsx` | Création |
| `tests/e2e/tablet-layout.smoke.spec.ts` (ou `arena.spec.ts`) | Mesures |

## 5. Impacts UI / domaine / application / infrastructure
Présentation uniquement ; aucune règle de jeu déplacée par cette spec.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée (hors préférence de main si Q3). Parties restaurées affichées dans la nouvelle disposition.

## 7. Stratégie de test
Unitaires du composant, E2E de mesure par jeu et par profil, captures, terrain à 3 m.

## 8. Non-régression
Specs 005, 014, 021 ; E2E téléphone ; tests de présentation existants (`matchPresentation.test.tsx`, `triathlonPresentation.test.tsx`).

## 9. Rollback / désactivation
Par écran : revert du lot. Option : drapeau de recette (`arena` → ancienne grille) pendant la période de transition.

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur tablette, notes de release, documentation d'architecture (composant à zones), captures de la doc.
