# Plan — 092 Générateur de QR côté client partagé

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `package.json:34` : `qrcode` ^1.5.4 en dépendance de production.
- `scripts/generate-app-qr.mjs:3,35-38` : seul usage, au build (SVG, niveau M, marge 1).
- `views/HomeView.tsx:44,191` : QR statique `/app-qr.svg` affiché par `<img>`.
- `App.tsx:54-62` : modèle de chargement différé par `lazy(() => import(...))`.
- `public/_headers:2` : CSP `img-src 'self' data: blob: https:`.

## 2. Approche retenue (et alternatives écartées)
Port applicatif `QrEncoder` + adaptateur `qrcode` chargé par `import()` + composant `QrCode` affichant le SVG en `<img>`.
Écartées : service QR tiers (fuite du payload, réseau) ; encodeur maison (maintenance, risques de conformité ISO) ; injection du SVG dans le DOM (surface XSS inutile).

## 3. Étapes
1. Créer `src/application/qr/qrEncoder.ts` : types `QrPayloadKind`, `QrPayload`, plafonds, erreurs typées, port.
2. Créer `src/infrastructure/web/qrcodeEncoder.ts` : `import('qrcode')` mémorisé, `toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } })`.
3. Créer `src/presentation/qr/QrCode.tsx` : états, `<img>` via `URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))`, révocation au démontage, lien copiable.
4. Ajouter une vérification de chunks (script lecture seule de `dist/.vite/manifest.json` ou du rapport de build) dans la CI, coordonnée avec 044.
5. Documenter l'API pour les consommateurs (088, 096, 100, 102, 107).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/application/qr/qrEncoder.ts` | Nouveau (pur) |
| `src/infrastructure/web/qrcodeEncoder.ts` | Nouveau (adaptateur) |
| `src/presentation/qr/QrCode.tsx` | Nouveau (composant) |
| `scripts/check-initial-chunks.mjs` (nom indicatif) | Nouveau, contrôle CI |
| `.github/workflows/*` | Ajout de l'étape de contrôle |
| `tests/unit/qr/*.test.ts(x)` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI : nouveau composant réutilisable, aucune modification d'écran existant. Domaine : aucun. Application : port. Infrastructure : adaptateur.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Aucune donnée persistée ni contrat public modifié.

## 7. Stratégie de test
- Unitaires : plafonds, erreurs, mémorisation du module (mock d'`import()`), options d'encodage (marge 4, niveau M).
- Composants : états, révocation `blob:`, `alt`, focus du bouton.
- CI : contrôle d'absence de `qrcode` dans les chunks initiaux.
- Terrain : lecture iOS/Android, écran et papier.

## 8. Non-régression
Taille des chunks initiaux comparée à la référence ; QR statique de l'accueil inchangé ; tests E2E existants verts.

## 9. Rollback / désactivation (feature flag le cas échéant)
Aucun consommateur n'est obligatoire : retirer l'appel au composant suffit. Le module non référencé est éliminé par le bundler.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture/` (port QR et règle « un QR = un payload »), guide contributeur (ajout d'un type de payload).
