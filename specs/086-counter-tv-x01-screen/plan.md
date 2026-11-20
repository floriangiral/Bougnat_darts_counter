# Plan — 086 Interface TV X01

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `components/match/MatchTopBar.tsx`, `components/game/PlayerScore.tsx`, `components/game/CheckoutHint.tsx:9`, `views/MatchView.tsx:438-452` : équivalents côté contrôleur (non réutilisés, référence fonctionnelle).
- `src/styles/tailwind.css`, `index.tsx:3`, `package.json:41-42,58` : chaîne CSS actuelle.
- `utils/uiUtils.ts:17-30` : plein écran.
- Contrat : `src/shared/broadcast/contract.ts` (084).

## 2. Approche retenue (et alternatives écartées)

Composants React dédiés dans `src/tv/x01/` + feuille `src/tv/tv.css` écrite à la main sur variables CSS générées depuis les tokens de 063 (valeurs hex). Écartés : réutiliser `PlayerScore` et Tailwind (classes 4.x non rendues sur Chromium < 111) ; canvas/WebGL (accessibilité, coût).

## 3. Étapes

1. Générer `src/tv/tokens.tv.css` (variables hex) depuis les tokens de 063 par un script de build.
2. Écrire `src/tv/tv.css` : grille 16:9, zone sûre 5 %, tailles en `vh`, chiffres tabulaires.
3. Ajouter un lint de la feuille TV (stylelint ou script maison sans dépendance) refusant `oklch`, `color-mix`, `@layer`, `@property`, `:has`, `@container`, imbrication, `dvh`.
4. Composants : `TvX01Screen`, `TvTeamPanel`, `TvHeader`, `TvCheckout`, `TvHighlightQueue`, `TvLegInterstitial`, `TvVictory`, `TvConnectionBanner`, `TvBrandMark` (emplacement 097).
5. File d'animations pilotée par `highlights[].id` (ensemble des identifiants vus, borné à 200).
6. Chrono local : `clock.running` → incrément par `requestAnimationFrame`/minuterie d'affichage, sans émission.
7. Plein écran, curseur masqué, Wake Lock détecté.
8. Fixtures de snapshots (084) et captures de référence.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/tv/x01/*.tsx` | Création |
| `src/tv/tv.css`, `src/tv/tokens.tv.css` | Création |
| `scripts/generate-tv-tokens.mjs`, `scripts/lint-tv-css.mjs` | Création |
| `package.json` | Scripts `tv:tokens`, `tv:lint-css` (ajout dans `ci:check`) |
| `tests/unit/tv/*.test.tsx`, `tests/e2e/tv-x01-visual.spec.ts` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : nouvelle surface TV uniquement. Domaine, application, infrastructure : aucun.

## 6. Stratégie de migration

Sans objet (aucune donnée persistée).

## 7. Stratégie de test

Composants sur fixtures (simple, doublette, sets, bot, Open, noms longs) ; file d'animations ; captures 720p/1080p/2160p ; lint CSS ; axe ; émulation CPU lente. Terrain : 090.

## 8. Non-régression

Bundle contrôleur inchangé (vérification de taille) ; E2E X01 ; aucun import de `src/tv` depuis le contrôleur hors chargement à la demande.

## 9. Rollback / désactivation

Écran servi uniquement par l'entrée TV (085) ; désactivation via le drapeau de 085 ou de 087.

## 10. Documentation à mettre à jour avec l'implémentation

Guide « Diffuser sur un grand écran » (V2-DOC-05, 037) avec captures ; `docs/architecture.md` (surface TV, CSS conservatrice) ; décision de baseline dans 018.
