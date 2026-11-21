# Plan — 102 « La partie à emporter » : récap partageable

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- Écran de fin X01 : `views/StatsView.tsx:22-80` (actions, minuterie `:28-36`).
- Statistiques : `src/application/scoring/matchStats.ts:13-31` ; volées `types.ts:28-34`.
- Modèle de validation stricte d'URL à imiter : `src/features/external-match/externalMatchLink.ts` ; nettoyage de la barre d'adresse : `src/features/external-match/externalMatchAddressBar.ts:15-17`.
- Analyse d'URL au démarrage : `App.tsx:91`.
- QR actuel (build uniquement) : `scripts/generate-app-qr.mjs`, `package.json:34`.
- CSP : `public/_headers:2`.

## 2. Approche retenue (et alternatives écartées)

- Retenue : modèle `MatchRecap` pur → trois sorties (canvas PNG, QR de fragment, texte/JSON) ; QR via V2-QR-01 chargé à la demande ; vue de lecture sans persistance.
- Écartée : capture d'écran du DOM (bibliothèque lourde, rendu dépendant du thème et de la taille d'écran).
- Écartée : compression `CompressionStream` (absente de la baseline iOS 12, spec 018) ; encodage positionnel compact à la place.
- Écartée : lien court stocké côté serveur (contraire à « sans serveur », coût et modération).

## 3. Étapes

1. `buildMatchRecap` (application) + tests sur fixtures (simple, doublettes, robot).
2. Contrat `recap v=1` : `encodeRecapPayload` / `decodeRecapPayload` + sélection des champs sous budget + tests de fuzz.
3. Formateur texte (FR-09) et export JSON (FR-10).
4. Rendu canvas (`recapImageRenderer`) et adaptateur de partage (`shareFile` + repli téléchargement).
5. Panneau « Emporter la partie » dans `StatsView` (suspension de la minuterie pendant l'ouverture).
6. Détection du fragment `#r=` dans `App.tsx`, écran `RECAP_VIEW`, nettoyage de l'URL.
7. Intégration du QR (V2-QR-01) chargé à la demande.
8. Point d'entrée depuis « Mes parties » (101) si livré.
9. Mesure du budget QR sur appareils, réglage de Q3.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/application/recap/buildMatchRecap.ts` (nouveau) | Modèle pur |
| `src/features/recap/recapPayload.ts` (nouveau) | Contrat de fragment `v=1` |
| `src/features/recap/recapText.ts` (nouveau) | Texte et JSON |
| `src/infrastructure/web/recapImageRenderer.ts` (nouveau) | Canvas → PNG |
| `src/infrastructure/web/shareFile.ts` (nouveau) | Web Share / téléchargement |
| `components/recap/RecapPanel.tsx`, `views/RecapView.tsx` (nouveaux) | Panneau et vue de lecture |
| `views/StatsView.tsx` | Bouton secondaire, suspension de la minuterie |
| `App.tsx`, `src/app/appShell.ts` | Détection du fragment, écran `RECAP_VIEW` |
| `docs/integration/` (nouvelle page) | Contrat public du fragment récap |
| `tests/unit/recap/*`, `tests/e2e/recap.spec.ts` (nouveaux) | Tests |

## 5. Impacts UI / domaine / application / infrastructure

- UI : 1 panneau, 1 vue. Domaine : aucun. Application : modèle de récap. Infrastructure : rendu image, partage, QR.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Aucune donnée migrée. Nouveau contrat d'URL `v=1` : toute évolution passe par `v=2` avec lecture de `v=1` conservée.
- `RECAP_VIEW` n'est pas restauré après rechargement (retour à l'accueil).

## 7. Stratégie de test

- Unitaires : modèle, contrat (aller-retour + fuzz 30 cas), formateur, sélection sous budget.
- Composants : panneau, vue de lecture, minuterie suspendue.
- E2E Chromium + WebKit : AC-01, AC-02 (repli), AC-04 (interception réseau), AC-06, AC-07, AC-09.
- Terrain : AC-02, AC-03 sur iPhone et Android.
- Build : AC-08 (chunks différés).

## 8. Non-régression

- E2E 030 et écran de fin X01 ; CSP inchangée ; poids du chunk initial inchangé (044).

## 9. Rollback / désactivation (feature flag le cas échéant)

- Drapeau de build `VITE_ENABLE_RECAP` (désactivé = bouton masqué). La lecture des fragments `#r=` reste active pour ne pas casser les QR déjà distribués.

## 10. Documentation à mettre à jour avec l'implémentation

- Guide utilisateur (V2-DOC-05, 037), `README.md`, page de contrat du fragment récap, notes de release, changelog in-app.
