# Tâches — 102 Partage texte du résultat X01

> Périmètre réduit par la décision du product owner du 2026-11-23 : partage texte natif uniquement (carte image, QR, fragment de récap, JSON et vue de lecture hors périmètre). Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Implémentation
- [x] T001 Formateur français du résumé X01 (`src/presentation/stats/x01ShareText.fr.ts`) (AC-03)
- [x] T002 Adaptateur Web Share avec repli presse-papiers (`src/infrastructure/web/shareText.ts`) (AC-04, AC-05)
- [x] T003 Statistiques directes en fin de X01 classique, actions Revanche / Partager / Sortie (AC-01, AC-02)
- [x] T004 Match partenaire : ouverture automatique du retour, message de 2 s, Réessayer / Prévenir l'organisation, statut persistant (AC-06, AC-07, AC-08 ; spec 030 R8)
- [x] T005 Écran de statistiques compact : bandeau de score (`x01ResultHeader.fr.ts`), titre interne masqué, actions sur une rangée, messages en surimpression (AC-10, AC-11)

## Tests
- [x] T010 Tests unitaires : formateur, adaptateur de partage, bandeau de score (AC-03, AC-04, AC-05, AC-10)
- [x] T011 Tests de composants et de reprise : vues de fin, messages, actions partenaire, restauration du statut (AC-01, AC-06 à AC-08, AC-11)
- [ ] T012 E2E du lien partenaire adaptés ; à exécuter en CI (AC-09)
- [ ] T013 Test terrain iPhone (Safari et PWA) et Android : feuille de partage, bloqueur de fenêtres en match partenaire

## Documentation et clôture
- [x] T020 Spec, plan, guide partenaire, notes de release (section « Après le tag `v2.1.0` »), coverage map, checklist
- [ ] T021 Changelog in-app (« Nouveautés ») au moment de la publication
- [x] T022 Spec à `implementee`, `verifie_au_commit` renseigné, issue #273 fermée
