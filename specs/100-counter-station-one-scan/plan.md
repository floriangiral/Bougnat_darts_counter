# Plan — 100 « Station en un scan »

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `views/GameSelectionView.tsx:21-28` : `GAME_DISPLAY_ORDER` codé en dur.
- `src/features/game-setup/setupModel.ts:68-80` : `createInitialSetupState` (501, manches, 3, Double, Open).
- `App.tsx:91` : lecture du lien de match externe au démarrage.
- `src/features/external-match/externalMatchAddressBar.ts:17` : nettoyage de l'adresse.
- `public/Affiche_Bougnat_Darts_scorer.png`, `README.md:86` : affiche statique existante.
- `specs/030-counter-external-match-link/spec.md:107` : stockage iOS séparé.

## 2. Approche retenue (et alternatives écartées)
Contrat de lien pur + préférences locales injectées (ordre des jeux, valeurs par défaut) + écran de préparation + page d'affiche imprimable. Écartées : logo distant par URL (CSP, fuite d'IP, sécurité) ; stockage serveur (099) ; PDF généré par bibliothèque (poids ; l'impression navigateur suffit) ; mode kiosque applicatif (relève du système).

## 3. Étapes
1. `stationLink.ts` : contrat v1, liste blanche, bornes, construction et parsing.
2. `stationPreferences.ts` : application aux valeurs par défaut du setup et à l'ordre des jeux (fonctions pures).
3. Injection : `createInitialSetupState(defaults?)` et ordre des jeux passé à `GameSelectionView` (sans lecture de stockage dans ces modules).
4. Lecture du fragment au démarrage (après 030), carte de confirmation, nettoyage.
5. Écran « Préparer une station » (réutilise 094 pour le thème), fiche de configuration (QR via 092).
6. Page d'affiche imprimable (`@media print`), QR « Jouez ici » (payload `theme`).
7. `wakeLock.ts` : demande/relâche sur écrans de jeu, gestion de `visibilitychange`.
8. Retrait de la configuration.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/station/stationLink.ts`, `stationPreferences.ts` | Nouveaux (purs) |
| `src/features/game-setup/setupModel.ts` | Paramètre optionnel de valeurs par défaut |
| `views/GameSelectionView.tsx` | Ordre des jeux fourni en prop |
| `App.tsx` / `src/app/*` | Lecture du fragment, injection des préférences, Wake Lock |
| `src/infrastructure/web/wakeLock.ts`, `src/infrastructure/local/stationStorage.ts` | Nouveaux |
| `src/presentation/station/*` | Écran de préparation, carte, affiche, indicateur |
| `src/styles/tailwind.css` | Règles `@media print` de l'affiche |
| `views/HomeView.tsx` | Entrée secondaire, carte de confirmation |
| `tests/unit/station/*`, `tests/e2e/station.spec.ts` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI : entrée secondaire, écran, carte, affiche. Domaine de jeu : aucun. Application : injection de valeurs par défaut. Infrastructure : stockage, Wake Lock, impression.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Nouvelles clés et nouveau contrat v1 ; sessions existantes non touchées (une session restaurée garde ses propres réglages).

## 7. Stratégie de test
Unitaires (contrat, injection), E2E (préparation, réception, retrait, parcours de base comparatif, coexistence 030), manuels (impression, scan, Wake Lock sur iPad et Android).

## 8. Non-régression
E2E du parcours de base et du lien de match externe ; setup sans station identique ; chunks initiaux.

## 9. Rollback / désactivation (feature flag le cas échéant)
Drapeau `VITE_FEATURE_STATION` [nom à confirmer] : fragment ignoré (mais nettoyé), préférences non appliquées, entrée masquée. « Retirer la configuration » reste disponible pour les appareils déjà configurés.

## 10. Documentation à mettre à jour avec l'implémentation
Guide « Station » pour les lieux (037), contrat public `#station=1.`, mise à jour du README (affiche personnalisable) au moment de la livraison seulement.
