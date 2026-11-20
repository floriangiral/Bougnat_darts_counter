# Tâches — 092 Générateur de QR côté client partagé

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que les questions Q1 à Q5 sont tranchées
- [ ] T001 Mesurer la taille gzip du chunk `qrcode` minifié sur une branche d'essai (sans commit sur la branche principale) (AC-01)

## Implémentation
- [ ] T002 Créer le port `QrEncoder`, `QrPayloadKind`, plafonds et erreurs typées dans `src/application/qr/qrEncoder.ts` (AC-03)
- [ ] T003 Créer l'adaptateur `src/infrastructure/web/qrcodeEncoder.ts` avec `import('qrcode')` mémorisé, niveau M, marge 4, noir sur blanc (AC-02, AC-05)
- [ ] T004 Créer le composant `src/presentation/qr/QrCode.tsx` : états, `<img>` `blob:`, lien copiable, `alt` d'usage (AC-04, AC-06)
- [ ] T005 Ajouter le contrôle CI d'absence de `qrcode` dans les chunks initiaux (AC-01)

## Tests
- [ ] T006 Tests unitaires : plafonds, erreurs typées, mémorisation du module (AC-03)
- [ ] T007 Tests de composant : chargement, erreur hors ligne, révocation `blob:`, accessibilité (AC-04, AC-06)
- [ ] T008 Test de rendu : marge et couleurs indépendantes du thème (AC-05)
- [ ] T009 Test terrain : lecture iPhone et Android, écran et A4 (AC-02)

## Documentation et clôture
- [ ] T010 Documenter l'API et la règle « un QR = un payload » dans `docs/architecture/`
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
