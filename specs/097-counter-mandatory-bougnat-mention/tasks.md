# Tâches — 097 Mention Bougnat Darts obligatoire

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 093 est livrée et que Q1 à Q4 sont tranchées (formule, tailles)
- [ ] T001 Capturer les en-têtes actuels comme référence visuelle (AC-04)

## Implémentation
- [ ] T002 Créer `BrandMark` et remplacer les en-têtes X01, Cricket, Capital, Triathlon (AC-01, AC-04)
- [ ] T003 Ajouter la mention à Killer et Gotcha (AC-01)
- [ ] T004 Créer `CoBrandHeader` (logo, nom du lieu, troncature prioritaire du nom) (AC-05)
- [ ] T005 Couleurs non personnalisables et contraste via 093 (AC-03)
- [ ] T006 Publier la zone TV fixe pour 086/089/098 (AC-06)

## Tests
- [ ] T007 E2E de présence pour les 6 jeux, avec et sans thème, sur les projets Playwright (AC-01)
- [ ] T008 Test de schéma : champs de masquage ignorés (AC-02)
- [ ] T009 Matrice de contraste presets + graines aléatoires (AC-03)
- [ ] T010 Régression visuelle des en-têtes et test 360 px (AC-04, AC-05)

## Documentation et clôture
- [ ] T011 Rédiger la charte de co-branding
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
