# Plan — 028 Affichage téléphone

> Fichier créé lors de la révision V2 du 2026-11-20 : la spec 028 historique n'avait pas de plan.

## Révision V2 — plan proposé

> Plan proposé pour V2-TAB-06. Il ne s'exécute qu'après validation de la Révision V2 et décision du PO sur l'option (A, B ou C).

> **Réalisation (2026-11-20)** : option B appliquée ; l'écran bloquant et `usePortraitLock` sont supprimés (pas d'étape intermédiaire « écran conservé » : la recette `phone-landscape` est livrée dans le même chantier) ; invite non bloquante propre au téléphone (la spec 073, invite et verrou tablette, est rejetée).

### 1. Lecture de l'existant
- `src/features/tablet/tabletLayout.ts:26`, `:53-54` (`requiresPortrait`, seuil 960 px).
- `src/features/smartphone/RotateToPortraitOverlay.tsx`, `usePortraitLock.ts`, `useVisualViewport.ts`.
- `App.tsx:220`, `:327` ; `src/styles/tailwind.css:26-110` (contrat téléphone).
- `tests/e2e/smartphone-layout.smoke.spec.ts:34-45`, `playwright.config.ts:39-51`, `tests/unit/components/portraitOrientation.test.tsx`.

### 2. Approche
Décision d'abord (Q1), puis mise en œuvre minimale selon l'option. Option B recommandée : recette `phone-landscape` via V2-TAB-01, puis écran de rotation rendu non bloquant.

### 3. Étapes
1. Mettre à jour 028 (scope, invariant 2, acceptance) selon la décision ; corriger le commentaire de `usePortraitLock` et la note `docs/release/v2.0.0.md:43`.
2. Option A : documenter la dérogation 1.3.4 ; conserver le test actuel.
3. Option B/C : implémenter la recette `phone-landscape` (score + saisie côte à côte) pour chaque jeu ; tests E2E 844×390 et 932×430 jouant une volée par jeu.
4. Option B : transformer `RotateToPortraitOverlay` en invite non bloquante (bouton « Continuer en paysage », mémorisation par partie, écrans de jeu seulement).
5. `usePortraitLock` : retirer ou corriger (après plein écran, `unlock`, classe téléphone).
6. Préparer la fusion avec 027 (Q5).

### 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/smartphone/RotateToPortraitOverlay.tsx` | Invite non bloquante (B) |
| `src/features/smartphone/usePortraitLock.ts`, `App.tsx` | Correction ou retrait |
| `src/styles/tailwind.css`, vues de jeu | Recette `phone-landscape` (B/C) |
| `tests/e2e/smartphone-layout.smoke.spec.ts` | Reflète la décision |
| `tests/unit/components/portraitOrientation.test.tsx` | Verrou après plein écran |
| `docs/release/v2.0.0.md` (ou notes suivantes) | Texte exact |

### 5. Stratégie de test
E2E téléphone portrait (inchangé) et paysage (selon option), unitaires du verrou, test manuel iPhone et Android.

### 6. Non-régression
Portrait téléphone (320×568, 390×844), clavier virtuel (`useVisualViewport`), safe areas, spec 021.

### 7. Rollback
Option B : constante réactivant l'écran bloquant ; revert simple, aucune donnée.

### 8. Documentation
Spec 028, notes de release, guide utilisateur téléphone, déclaration d'accessibilité si elle existe.
