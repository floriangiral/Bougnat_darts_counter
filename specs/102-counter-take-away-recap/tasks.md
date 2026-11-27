# Tâches — 102 Partage texte du résultat X01

> Checklist historique V2-SHARE-01 (#273). La checklist de la révision V2-SHARE-02 (#362) figure plus bas ; sa recette reste à faire.

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
- [x] T020 Spec, plan, guide partenaire, notes de release (section « Évolutions X01 et ergonomiques intégrées au tag »), coverage map, checklist
- [x] T021 Changelog in-app (« Nouveautés ») mis à jour avec les compléments v2.1.0 du 2026-11-24
- [x] T022 Spec à `implementee`, `verifie_au_commit` renseigné, issue #273 fermée

## Révision V2 — V2-SHARE-02 (#362)

### Formalisation avant code

- [x] T030 Documenter la décision explicite du PO, le statut `validee`, la validation terrain en attente et les critères de la révision dans la spec 102 (AC-R01 à AC-R06).

### Implémentation

- [x] T031 Construire le modèle complet du résultat, format, classement et statistiques des deux onglets pour solo, 2–4 joueurs, robot et doublettes (AC-R02, AC-R03).
- [x] T032 Calculer les statistiques attribuables par `playerId` en doublettes, notamment le meilleur checkout individuel ; garder manches gagnantes et résultat au niveau équipe (AC-R03).
- [x] T033 Générer localement un PNG portrait avec logo et QR vers l'URL officielle ; gérer la CSP et les limites de rendu. Lisibilité et scan sur appareils restent à vérifier en T039 (AC-R01, AC-R02, AC-R04).
- [x] T034 Ajouter aperçu accessible, partage natif de fichier compatible, enregistrement PNG, copie et partage du résumé texte, annulations silencieuses et erreurs explicites (AC-R01, AC-R04, AC-R05).
- [x] T035 Suspendre l'expiration pendant aperçu et partage ; préserver actions classiques, retour et secours partenaire et reprise de session (AC-R05).

### Vérification et livraison

- [x] T036 Ajouter les tests unitaires ciblés de données, rendu et QR, dont source d'aperçu compatible CSP, URL officielle en préproduction, noms longs, égalités, places jouées, sets, bull, robot et doublettes avec finishers différents (AC-R01 à AC-R03, AC-R06).
- [x] T037 Tester erreurs et annulations des API, interface, expiration, actions et restauration des sessions classiques et partenaires (AC-R04 à AC-R06).
- [ ] T038 Préparer et faire exécuter les E2E/smoke exclusivement en CI ; relever les résultats CI (AC-R05, AC-R06). Scénarios accueil, partage à quatre sur téléphone et reprise partenaire préparés ; exécution en CI en attente.
- [ ] T039 Réaliser et consigner la recette physique sur Safari iOS, PWA iOS et Android, y compris le QR scannable après compression par une application de partage (AC-R01, AC-R04, AC-R06).
- [ ] T040 Mettre à jour la documentation concernée, les notes de release et le changelog in-app lors de la livraison ; renseigner statut et commit de vérification de la révision (AC-R01 à AC-R06). Documentation et notes préparées ; statut et commit de vérification attendent la CI et la recette.
