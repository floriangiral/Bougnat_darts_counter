# Plan — 097 Mention Bougnat Darts obligatoire

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
Duplications du mot-symbole : `components/match/MatchTopBar.tsx:26`, `views/CricketGameView.tsx:285`, `views/CapitalGameView.tsx:171`, `components/triathlon/TriathlonGameHeader.tsx:21`, `views/GameSelectionView.tsx:119`, `views/HomeView.tsx:98`. Absence sur `views/KillerGameView.tsx` et `views/GotchaGameView.tsx`.

## 2. Approche retenue (et alternatives écartées)
Composants `BrandMark` et `CoBrandHeader` hors thème. Écartées : champ de thème « afficher la mention » (contraire à l'exigence) ; image de marque superposée (fragile, accessibilité).

## 3. Étapes
1. Créer `BrandMark` à rendu identique à l'existant (captures de référence avant/après).
2. Remplacer les 4 en-têtes de jeu, puis accueil et sélection (rendu spécifique conservé via une taille dédiée).
3. Ajouter la mention à Killer et Gotcha (emplacement en en-tête, sans perte de hauteur utile).
4. Créer `CoBrandHeader` branché sur le thème actif (093) et le logo (095).
5. Publier la zone TV fixe pour 086/089/098.
6. Ajouter les tests de présence et de contraste.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/presentation/brand/BrandMark.tsx` | Nouveau |
| `src/presentation/brand/CoBrandHeader.tsx` | Nouveau |
| `components/match/MatchTopBar.tsx` | Remplacement |
| `views/CricketGameView.tsx`, `views/CapitalGameView.tsx`, `components/triathlon/TriathlonGameHeader.tsx` | Remplacement |
| `views/KillerGameView.tsx`, `views/GotchaGameView.tsx` | Ajout |
| `views/HomeView.tsx`, `views/GameSelectionView.tsx` | Factorisation (facultative) |
| `tests/e2e/brand-mention.spec.ts`, `tests/unit/brand/*.test.tsx` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement. Domaine, application, infrastructure : aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée. Les schémas 093/096/100 sont vérifiés sans champ de masquage.

## 7. Stratégie de test
E2E par jeu et par projet Playwright ; régression visuelle des en-têtes (041) ; matrice de contraste.

## 8. Non-régression
Captures des en-têtes sans thème ; hauteur des zones de score (027, 028, 021).

## 9. Rollback / désactivation (feature flag le cas échéant)
Pas de drapeau pour la mention (non désactivable par principe) ; `CoBrandHeader` suit le drapeau de 093 (sans thème club, `BrandMark` seul).

## 10. Documentation à mettre à jour avec l'implémentation
Charte de co-branding (formule, tailles, emplacements) dans `docs/product/` [selon 035] ; guide utilisateur des lieux.
