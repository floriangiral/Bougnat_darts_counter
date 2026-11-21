# Tâches — 096 Partage de thème sans compte

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 092 et 093 sont livrées et que Q1 à Q5 sont tranchées

## Implémentation
- [ ] T001 Contrat fichier v1 `themeFile.ts` : bornes avant lecture, liste blanche, logo renormalisé via 095 (AC-01, AC-04, AC-05)
- [ ] T002 Contrat lien v1 `themeLink.ts` : fragment, base64url compact, ≤ 400 octets, sans logo (AC-02, AC-08)
- [ ] T003 Lecture du fragment au démarrage après le lien de match externe, nettoyage de l'adresse (AC-02, AC-07)
- [ ] T004 Carte de confirmation, différée si une partie est restaurée (AC-02, AC-03)
- [ ] T005 Feuille de partage : fichier, lien, QR via 092 (AC-06)
- [ ] T006 Import de fichier dans l'éditeur, gestion des doublons de nom

## Tests
- [ ] T007 Tests unitaires des contrats (aller-retour, injections, versions, bornes) (AC-04, AC-05, AC-08)
- [ ] T008 E2E : export/import, lien, partie restaurée, coexistence `v=1` (AC-01, AC-02, AC-03, AC-07)
- [ ] T009 Tests manuels : WhatsApp, mail, AirDrop, scan iOS et Android (AC-06)

## Documentation et clôture
- [ ] T010 Documenter les contrats fichier et lien, et le guide utilisateur de partage
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
