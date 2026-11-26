# Plan

> Plan prêt à exécuter au passage de la spec à `en-cours`.

1. **Modèle pur** (`src/features/game-setup/`) : type `X01QuickFormat` (score, score personnalisé, mode manches / sets, nombre, ouverture, sortie, limite de volées), fonctions `extractX01QuickFormat(setupState)`, `isX01QuickFormatEligible(setupState)` (simple, 2 joueurs, sans robot), `parseX01QuickFormat(raw)` (validation stricte, `null` si invalide) et `applyX01QuickFormat(state, format)`.
2. **Stockage** (`src/infrastructure/local/x01QuickFormatStore.ts`) : lecture et écriture sous une clé dédiée, sur le modèle de `voicePrivacyNoticeStore.ts` ; aucune exception remontée.
3. **Écran** (`views/SetupView.tsx`, `setupModel.ts`) : à l'ouverture en partie rapide, appliquer le format mémorisé ou le standard ; « ← Partie rapide » garde le format en cours s'il est éligible, sinon applique le format mémorisé ; au lancement depuis l'écran complet, enregistrer le format s'il est éligible ; au lancement rapide, enregistrer le format effectivement joué s'il est différent du standard, sinon effacer la mémorisation. Exclure lien partenaire et configuration pré-remplie.
4. **Carte** (`components/game-setup/SetupQuickX01Section.tsx`) : afficher manches ou sets et la limite de volées éventuelle, sans changer les libellés existants ; bouton « Revenir au standard » sous la carte, visible si le format diffère du standard, qui applique `apply_x01_quick_defaults` et efface le format mémorisé.
5. **Tests** : unitaires (modèle, validation, stockage, écran : AC-01 à AC-07, AC-10 et AC-11) ; E2E X01 rapide mis à jour pour les formats mémorisés et leur mise à jour au lancement.
6. **Documentation** : notes de version, `docs/specifications.md`, index des specs.

Retour arrière : retirer la lecture du format mémorisé ; la clé locale devient inerte.
