# Plan — 073 Orientation tablette (verrou Android plein écran, invite non bloquante)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

> **Décision (2026-11-20)** : spec **rejetée** par le product owner ; plan abandonné. Le code un temps livré (port d'orientation, adaptateur web, invite et verrou tablette) a été retiré ; seule l'invite téléphone de la spec 028 subsiste.

## 1. Lecture de l'existant
- `src/features/smartphone/usePortraitLock.ts:12-19`, `RotateToPortraitOverlay.tsx`.
- `App.tsx:220` (appel au montage), `App.tsx:327` (overlay téléphone).
- `src/app/useGameLifecycle.ts:69-75` (`enterFullScreen` au lancement), `src/app/useAppScreenHistory.ts:38-44`, `src/app/appShell.ts:27` (`FULLSCREEN_SCREENS`).
- `utils/uiUtils.ts:17-58` (`enterFullScreen` / `exitFullScreen`).
- `tests/unit/components/portraitOrientation.test.tsx` (modèle de simulation).

## 2. Approche retenue (et alternatives écartées)
Verrou best effort après plein écran sur Android + invite non bloquante ailleurs. Écartées : blocage strict (WCAG 1.3.4, impossible sur iPad) ; manifeste `orientation: landscape` (imposerait le paysage aux téléphones).

## 3. Étapes
1. `src/application/display/ports.ts` (`OrientationPort`, sur le modèle de `src/application/scoring/ports.ts`) + adaptateur `src/infrastructure/web/screenOrientation.ts`.
2. Faire renvoyer une promesse à `enterFullScreen` (ou un rappel) pour enchaîner le verrou après résolution.
3. Dans `handleStartSetup` : verrou paysage si classe tablette tactile ; dans la sortie des écrans de jeu : `unlock()`.
4. Fonction pure `shouldShowLandscapePrompt(screen, viewportClass, dismissedForMatchId)` + composant `LandscapePrompt`.
5. Mémorisation `sessionStorage` par identifiant de partie.
6. Corriger `usePortraitLock` selon V2-TAB-06 (portée téléphone, après plein écran, `unlock`) ; corriger le commentaire et la note de version.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/application/display/ports.ts` (`OrientationPort`, sur le modèle de `src/application/scoring/ports.ts`), `src/infrastructure/web/screenOrientation.ts` | Création |
| `utils/uiUtils.ts` | `enterFullScreen` renvoie une promesse |
| `src/app/useGameLifecycle.ts`, `src/app/useAppScreenHistory.ts` | Verrou / déverrouillage |
| `src/features/layout/landscapePrompt.ts`, `components/layout/LandscapePrompt.tsx` | Création |
| `src/features/smartphone/usePortraitLock.ts`, `App.tsx` | Correction |
| `tests/unit/**`, `tests/e2e/tablet-orientation.spec.ts` | Tests |
| `docs/release/v2.0.0.md` (ou notes suivantes) | Texte exact |

## 5. Impacts UI / domaine / application / infrastructure
Application (port), infrastructure web (adaptateur), présentation (invite). Domaine inchangé.

## 6. Stratégie de migration (données, sessions persistées, contrats)
`sessionStorage` uniquement ; aucune migration.

## 7. Stratégie de test
Unitaires (décision, séquence de verrou simulée), E2E (invite, mémorisation, rechargement), terrain Android/iPad.

## 8. Non-régression
Plein écran existant, reprise X01 (010), comportement téléphone (selon V2-TAB-06).

## 9. Rollback / désactivation
Constante de configuration désactivant verrou et invite ; revert simple (pas de données).

## 10. Documentation à mettre à jour avec l'implémentation
Notes de release (limites iPad, plein écran), guide utilisateur tablette, correction de `docs/release/v2.0.0.md:43` si encore publiée.
