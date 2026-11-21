# Tâches — 027 Affichage tablette

> Fichier créé lors de la révision V2 du 2026-11-20 : la spec 027 historique n'avait pas de liste de tâches.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Chaque tâche référence les critères d'acceptation V2-AC.

- [x] T000 Vérifier que la spec est validée (Révision V2 acceptée par le PO) et que V2-TAB-01 (070) est validée — décision du PO du 2026-11-20 : recommandations appliquées
- [ ] T001 Suivre la livraison de 071 et vérifier ses AC-01 à AC-07 (V2-AC-01) — 070, 071 et 072 livrées (073 rejetée) ; E2E de 071 écrits, à exécuter dans la CI de la PR
- [x] T002 Vérifier la table de vérité de 070 pour 1280×800 et 1080×750 (V2-AC-02)
- [x] T003 Vérifier qu'aucun test E2E tablette n'utilise `?mode=dedicated_tablet` pour la présentation (V2-AC-03)
- [x] T004 Reporter les invariants 2, 4, 6, 7 et l'isolation téléphone/bureau dans 070 et 072 (V2-FR-02) — §21 de 070 et de 072
- [x] T005 Arbitrer la fusion 027 + 028 (Q2) — fusion portée par 070 (Q2)
- [x] T006 Faire statuer le PO sur le statut final et `remplacee_par` (V2-AC-04) — `retiree`, `remplacee_par: [070, 071, 072]`
- [x] T007 Demander l'ajout de 027 à l'index des specs (gouvernance) — 027 figure dans le tableau des specs historiques
- [x] T008 Lever les points connus tablette de `docs/release/v2.0.0.md:74-75` quand 071 est livrée — notes v2.0.0 mises à jour
- [x] T009 Vérifier que les seuils transitoires de 071 sont retirés à la livraison de 070 — aucun seuil transitoire écrit (071, Q1)
- [ ] T010 Renseigner `verifie_au_commit`, fermer l'issue — `verifie_au_commit` à renseigner, issue à fermer

## Suivi d'implémentation (2026-11-20)

Révision appliquée : 027 est retirée et remplacée par 070, 071 et 072 (073 rejetée par le PO), livrées sur `feat/v2.0.0` (issue #232). Restent ouverts : vérification des AC de 071 par l'exécution des E2E dans la CI de la PR (T001), commit de vérification et clôture de l'issue (T010), recette terrain des successeurs et validation par le product owner.
