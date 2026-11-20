# Tâches — 098 Thème transmis à l'écran TV

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 084 et 093 sont livrées et que Q1 à Q4 sont tranchées
- [ ] T001 Aligner les noms `branding` / `brandingHash` avec le contrat de 084

## Implémentation
- [ ] T002 Profil de logo `tv` dans `normalizeLogo` (095) (AC-02)
- [ ] T003 Module pur `brandingMessage.ts` : construction canonique, empreinte, bornes, validation (AC-02, AC-03)
- [ ] T004 Émission côté contrôleur : ouverture, reconnexion, changement de thème (AC-01, AC-05)
- [ ] T005 Réception côté TV : validation, dérivation en mode TV, application, cache, écran d'attente (AC-01, AC-04, AC-07)

## Tests
- [ ] T006 Tests unitaires : bornes, falsification, contraste 7:1 (AC-02, AC-03, AC-04)
- [ ] T007 E2E deux fenêtres : un seul message par partie, changement de thème en cours (AC-01, AC-05, AC-07)
- [ ] T008 Qualification sur Chromium 85 / TV réelle avec 090 (AC-06)

## Documentation et clôture
- [ ] T009 Mettre à jour le contrat TV et le guide « TV aux couleurs du lieu »
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
