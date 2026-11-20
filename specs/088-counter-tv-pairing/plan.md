# Plan — 088 Appairage TV par code court ou QR

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison de 087 et 092.

## 1. Lecture de l'existant

- `package.json:34` (`qrcode`), `scripts/generate-app-qr.mjs`, `views/HomeView.tsx:44` : QR au build uniquement.
- `src/shared/ids/createId.ts:15` ; `src/features/external-match/externalMatchLink.ts:61` (TTL 12 h).
- `specs/030-counter-external-match-link/spec.md:107` (iOS : stockage séparé).
- Relais et jetons : spec 087 (`workers/broadcast/`, `functions/api/tv/`).

## 2. Approche retenue (et alternatives écartées)

DO `PairingSlot` adressé par le code (`idFromName(code)`), socket TV en hibernation, réclamation unique par le contrôleur. Écartés : registre global de codes (point chaud, stockage) ; QR affiché par la tablette et scanné par la TV (impossible) ; code saisi sur la TV (télécommande).

## 3. Étapes

1. Ajouter `PairingSlot` au Worker de 087 (attente, réclamation, expiration 10 min, usage unique).
2. Function `/api/tv/pairing` (WebSocket TV) et `/api/tv/pairing/claim` (contrôleur) avec contrôle d'origine et limitation de tentatives [à confirmer : binding de limitation Cloudflare].
3. Écran d'attente TV (`src/tv/TvPairingScreen.tsx`) : code, renouvellement, états de connexion ; stockage local des identifiants ; reconnexion.
4. Contrôleur : feuille « Diffuser » (choix local / code / autre appareil), saisie du code, liste des écrans, « Oublier », « Changer le lien », « Arrêter ».
5. QR et lien via le module de 092 (import dynamique), fragment `#r=…&v=…`.
6. Messages d'indisponibilité si le relais est coupé.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `workers/broadcast/src/PairingSlot.ts`, `wrangler.jsonc` du Worker | Création, migration de classe |
| `functions/api/tv/[[path]].ts` | Routes d'appairage |
| `src/tv/TvPairingScreen.tsx`, `src/tv/pairingStorage.ts` | Création |
| `src/features/broadcast/BroadcastSheet.tsx`, `PairingCodeInput.tsx`, `pairingCode.ts` | Création |
| `src/infrastructure/broadcast/` | Session de diffusion, écrans appairés |
| `tests/unit/broadcast/pairingCode.test.ts`, `workers/broadcast/test/pairing.test.ts`, `tests/e2e/tv-pairing.spec.ts` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : feuille « Diffuser » enrichie, écran d'attente TV. Domaine/application : aucun. Infrastructure : DO d'appairage, stockage.

## 6. Stratégie de migration

Ajout de `pairedScreens` à l'enregistrement de session de diffusion (087), champ optionnel ; aucune migration de données existantes.

## 7. Stratégie de test

Miniflare (usage unique, expiration, concurrence de réclamation) ; unitaires (alphabet, normalisation) ; E2E deux contextes ; test utilisateur novice chronométré ; terrain 090.

## 8. Non-régression

Mode local 085, QR d'accueil, parcours de base, E2E X01.

## 9. Rollback / désactivation

Kill switch du relais (087) ; masquage de l'option « Sur un écran (code) » par `VITE_ENABLE_TV_REMOTE=false`.

## 10. Documentation à mettre à jour avec l'implémentation

Guide « Diffuser sur un grand écran » (037) : favori `/tv`, code, revanches, dépannage ; `docs/architecture.md` ; ADR 0005 (jetons).
