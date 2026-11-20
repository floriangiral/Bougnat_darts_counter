# Plan — 095 Import du logo du club

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `public/_headers:2` : CSP (`img-src … data: blob:` ; `connect-src` restreint).
- `src/infrastructure/local/IndexedDBSessionRepository.ts:10-14` : base existante, non modifiée (base dédiée de 093).
- `vite.config.ts:29-30` : cibles legacy (`ios >= 12`).
- `components/match/MatchTopBar.tsx:26` : emplacement de l'en-tête de jeu.

## 2. Approche retenue (et alternatives écartées)
Parseur d'en-tête pur + traitement canvas en infrastructure + stockage local. Écartées : SVG accepté tel quel (XSS) ; DOMPurify (dépendance et surface inutiles si le SVG est refusé) ; bibliothèque de redimensionnement (canvas suffisant) ; logo distant par URL (`connect-src`, fuite d'adresse IP de la tablette vers un tiers).

## 3. Étapes
1. `imageHeader.ts` : signatures PNG/JPEG/WebP, dimensions, bornes (pur, testé sur fixtures).
2. `logoProcessor.ts` : lecture bornée du fichier, décodage, canvas, réencodage itératif, SHA-256 (`crypto.subtle.digest`), suppression des métadonnées par construction.
3. Stockage dans la base de 093 (store `logos`, clé = empreinte), repli `ArrayBuffer`.
4. Composant `ClubLogo` (URL `blob:` mise en cache, révocation, pastille automatique).
5. Intégration dans l'éditeur (094) : bouton, erreurs, fond de pastille, retrait.
6. Exposer `normalizeLogo(bytes, profile)` pour 096 et 098.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/theming/logo/imageHeader.ts` | Nouveau (pur) |
| `src/infrastructure/web/logoProcessor.ts` | Nouveau |
| `src/infrastructure/local/themeStorage.ts` | Store `logos` (créé par 093) |
| `src/presentation/theme/ClubLogo.tsx` | Nouveau |
| `src/presentation/theme/ThemeEditorView.tsx` | Section logo |
| `tests/unit/theming/imageHeader.test.ts` + `tests/fixtures/logos/*` | Nouveaux tests et fixtures |
| `tests/e2e/logo-import.spec.ts` | Nouveau |

## 5. Impacts UI / domaine / application / infrastructure
UI : section logo de l'éditeur, composant d'affichage. Domaine de jeu : aucun. Infrastructure : traitement d'image et stockage.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune migration ; nouveau store dans la base dédiée. Logos orphelins (thème supprimé) nettoyés à l'enregistrement de la bibliothèque.

## 7. Stratégie de test
Fixtures binaires minimales (PNG/JPEG/WebP valides, tronqués, falsifiés, SVG renommé, en-tête 20 000 px, JPEG EXIF GPS). Tests en navigateur via Playwright pour le canvas. Couverture du parseur ≥ 95 %.

## 8. Non-régression
En-têtes de jeu sans logo ; aucune requête réseau supplémentaire (vérification Playwright des requêtes).

## 9. Rollback / désactivation (feature flag le cas échéant)
Drapeau de 093 ; la section logo peut être masquée indépendamment. Les logos stockés sont ignorés si la fonctionnalité est désactivée.

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur (formats, bornes, conseils d'export PNG) ; page d'architecture sur le pipeline d'import.
