# Plan — 101 « Mes parties » : historique local

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Écriture : `src/app/useGameLifecycle.ts:84-180` (6 jeux), `src/infrastructure/local/sessionPersistence.ts:22-32`.
- Dépôt : `src/infrastructure/local/IndexedDBSessionRepository.ts:129-166` (écriture, liste), `:198-211` (lecture IndexedDB), `:244-267` (ouverture v1).
- Type : `src/shared/session/persistedAppSession.ts:56-62`.
- Port : `src/application/scoring/ports.ts:3-7`.
- Écrans : `src/app/appShell.ts` (énumération `AppScreen`), `App.tsx:329-440` (rendu par écran), `views/HomeView.tsx:132-160` (pied de page).
- Pré-remplissage : `App.tsx:108-109`, `views/SetupView.tsx:37-50`.
- Statistiques X01 : `components/stats/StatsModal.tsx`, `src/application/scoring/matchStats.ts`.

## 2. Approche retenue (et alternatives écartées)

- Retenue : port `GameHistoryRepository` + cas d'usage + projection pure `toHistorySummary` ; `summary` calculé à l'enregistrement ; lecture tolérante des anciennes entrées ; plafond appliqué à l'écriture.
- Écartée : lire directement `listLocalGameHistory` depuis la vue (viole les couches, désérialise tout).
- Écartée : index IndexedDB sur `completedAt` (migration v2 inutile pour ≤ 100 entrées).
- Écartée : écran de stats complet par jeu dès la V1 (dépend de V2-GAMES-06).

## 3. Étapes

1. Définir `GameHistorySummary` et `schemaVersion` dans `src/shared/session/persistedAppSession.ts` (champs optionnels).
2. Écrire `toHistorySummary(entry)` pure (application) avec fixtures des 6 jeux, y compris anciennes entrées.
3. Ajouter le port `GameHistoryRepository` et les cas d'usage `list/delete/clear`.
4. Implémenter `remove`, `clear` et le plafond dans le dépôt IndexedDB + repli localStorage ; identifiant unique pour les nouvelles entrées non-X01.
5. Enrichir l'écriture dans `useGameLifecycle.ts` (summary, schemaVersion, mention match lié).
6. Créer `views/HistoryView.tsx` (liste + détail + dialogues) et l'écran `HISTORY` dans `appShell.ts` / `App.tsx`.
7. Ajouter le bouton « Mes parties » au pied de `HomeView.tsx`.
8. Brancher « Rejouer avec ces joueurs » sur `setArenaPrefillPlayers` / `setArenaPrefillConfig` + `setSelectedGameType` + écran `SETUP`.
9. Tests, puis documentation.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/shared/session/persistedAppSession.ts` | Types `GameHistorySummary`, `schemaVersion` |
| `src/application/history/*` (nouveau) | Port, cas d'usage, projection `toHistorySummary` |
| `src/infrastructure/local/IndexedDBSessionRepository.ts` | `remove`, `clear`, plafond, implémentation du port |
| `src/infrastructure/local/sessionPersistence.ts` | Exposition des nouvelles fonctions |
| `src/app/useGameLifecycle.ts` | Entrées enrichies, identifiant unique |
| `src/app/appShell.ts`, `App.tsx` | Écran `HISTORY`, navigation, « Rejouer » |
| `views/HistoryView.tsx` (nouveau) | Liste, détail, confirmations |
| `views/HomeView.tsx` | Bouton secondaire « Mes parties » |
| `tests/unit/application/history/*` (nouveau), `tests/unit/application/indexedDbSessionRepository.test.ts`, `tests/unit/app/useGameLifecycle.test.ts`, `tests/e2e/history.spec.ts` (nouveau) | Tests |

## 5. Impacts UI / domaine / application / infrastructure

- UI : 1 écran, 1 bouton d'accueil. Domaine : aucun. Application : port + 3 cas d'usage + projection. Infrastructure : dépôt enrichi.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Aucune migration de base : champs optionnels, lecture tolérante.
- Premier enregistrement après mise à jour : application du plafond (suppression éventuelle des entrées les plus anciennes au-delà de N) — à annoncer dans les notes de version.
- `PersistedAppSession` : ajout éventuel de l'écran `HISTORY` restaurable ; un écran inconnu restauré renvoie à l'accueil (comportement à vérifier).

## 7. Stratégie de test

- Unitaires (Vitest) : projection 6 jeux, lecture tolérante, plafond, suppression, identifiant unique.
- Composants : `HistoryView` (vide, liste, illisible, confirmations).
- E2E (Playwright, Chromium + WebKit) : AC-02, AC-05, AC-07, AC-08.
- Couverture : modules purs ≥ seuil de la spec 029.

## 8. Non-régression

- Suites existantes de persistance et de cycle de vie vertes ; parcours de base E2E inchangé ; lien 030 inchangé.

## 9. Rollback / désactivation (feature flag le cas échéant)

- Retrait du bouton d'accueil suffit à masquer la fonctionnalité ; les champs ajoutés sont optionnels et ignorés par l'ancienne version. Le plafond, s'il a supprimé des entrées, n'est pas réversible (accepté, à annoncer).

## 10. Documentation à mettre à jour avec l'implémentation

- `docs/product-scope.md:13` (historique consultable), `README.md` (fonctionnalités), changelog in-app, notes de release.
