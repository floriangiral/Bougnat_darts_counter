# Tâches — 094 Éditeur visuel de thème

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que 093 est livrée ; trancher Q1 à Q5
- [ ] T001 Vérifier l'état de 065 (écrans migrés), 068 (clair) et 086 (TV) pour fixer le contenu des aperçus

## Implémentation
- [ ] T002 Ajouter l'écran éditeur chargé à la demande et son entrée secondaire en pied de page de l'accueil (AC-01, AC-07)
- [ ] T003 Formulaire : presets, couleur principale (sélecteur + hex), section avancée (AC-02, AC-03)
- [ ] T004 Aperçus à composants réels et badges de contraste (AC-04, AC-08)
- [ ] T005 Bibliothèque locale : enregistrer, activer, renommer, dupliquer, supprimer, plafond 10 (AC-06)
- [ ] T006 « Restaurer les couleurs Bougnat » et confirmation de sortie (AC-05)

## Tests
- [ ] T007 Tests de composant du formulaire et des badges (AC-03, AC-04, AC-08)
- [ ] T008 E2E : création et activation depuis un preset en ≤ 6 interactions (AC-02)
- [ ] T009 E2E : parcours de base inchangé avec et sans thème club, sur les projets Playwright (AC-01, AC-07)
- [ ] T010 Test manuel sur iPad, tablette Android et téléphone

## Documentation et clôture
- [ ] T011 Rédiger la section « Personnaliser » du guide utilisateur (037)
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
