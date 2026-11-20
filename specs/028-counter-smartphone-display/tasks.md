# Tâches — 028 Affichage téléphone

> Fichier créé lors de la révision V2 du 2026-11-20 : la spec 028 historique n'avait pas de liste de tâches.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Chaque tâche référence les critères d'acceptation V2-AC.

### Préalables
- [x] T000 Vérifier que la spec est validée (Révision V2 acceptée par le PO) et que la décision Q1 (A, B ou C) est prise — décision du PO du 2026-11-20 : option B
- [x] T001 Reporter la décision dans 028 et dans les notes de release (V2-AC-01) — spec 028 et notes v2.0.0

### Mise en œuvre
- [x] T002 Corriger le commentaire de `usePortraitLock` et `docs/release/v2.0.0.md:43` (V2-AC-05) — fichier supprimé ; note v2.0.0 corrigée
- [x] T003 Retirer ou corriger `usePortraitLock` (plein écran, `unlock`, classe téléphone) (V2-AC-04) — retiré (Q4)
- [x] T004 (B/C) Recette `phone-landscape` opérable pour chaque jeu (V2-AC-02)
- [x] T005 (B) Écran de rotation → invite non bloquante, mémorisée par partie, écrans de jeu seulement (V2-AC-03)
- [x] T006 (A) Rédiger la justification de dérogation WCAG 1.3.4 (V2-NFR-01) — sans objet : option B retenue

### Tests
- [ ] T007 Adapter `smartphone-layout.smoke.spec.ts` à la décision (V2-AC-02, V2-AC-03) — adapté à l'option B ; à exécuter dans la CI de la PR
- [x] T008 Test unitaire du verrou (jamais hors plein écran ni sur tablette) (V2-AC-04) — aucun verrou ne subsiste dans le code ; `tests/unit/layout/orientation.test.tsx` couvre l'invite
- [ ] T009 Test manuel iPhone Safari et Android Chrome en paysage — recette terrain à faire

### Clôture
- [x] T010 Préparer la fusion avec 027 (Q5) et demander l'ajout de 028 à l'index des specs — classification fusionnée dans 070 ; 028 figure dans l'index
- [ ] T011 Renseigner `verifie_au_commit`, fermer l'issue — `verifie_au_commit` à renseigner, issue à fermer

## Suivi d'implémentation (2026-11-20)

Option B livrée sur `feat/v2.0.0` (issue #229) ; commit de vérification à renseigner. Restent ouverts : exécution de `smartphone-layout.smoke.spec.ts` dans la CI de la PR (T007), test manuel iPhone et Android (T009), validation par le product owner et clôture de l'issue (T011).
