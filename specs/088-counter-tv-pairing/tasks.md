# Tâches — 088 Appairage TV par code court ou QR

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que 087 (relais) et 092 (QR) sont livrées
- [ ] T001 Trancher les questions ouvertes (mode principal, durées, nombre de TV, nom d'écran, URL)

## Implémentation
- [ ] T002 Génération et normalisation du code (alphabet de 31 symboles, `XXX-XXX`)
- [ ] T003 DO `PairingSlot` : attente, réclamation unique, expiration 10 min (AC-02, AC-03)
- [ ] T004 Routes `/api/tv/pairing` et `/api/tv/pairing/claim`, limitation des tentatives
- [ ] T005 Écran d'attente TV, stockage local, reconnexion automatique (AC-05)
- [ ] T006 Feuille « Diffuser » : saisie du code, écrans appairés, « Oublier » (AC-01)
- [ ] T007 Session de diffusion indépendante du match : revanches sans ré-appairage (AC-04)
- [ ] T008 « Changer le lien » et « Arrêter la diffusion » (AC-06)
- [ ] T009 QR et lien lecture seule via 092, fragment uniquement (AC-07)
- [ ] T010 Message « Diffusion distante indisponible » (AC-08)

## Tests
- [ ] T011 Tests Miniflare de `PairingSlot` (usage unique, expiration, concurrence)
- [ ] T012 Tests unitaires du code et du stockage
- [ ] T013 E2E deux contextes : appairage, revanche, rechargement TV, changement de lien (AC-01 à AC-06)
- [ ] T014 Test utilisateur novice chronométré (NFR-01)

## Documentation et clôture
- [ ] T015 Fournir le parcours et le dépannage au guide V2-DOC-05 (037)
- [ ] T016 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
