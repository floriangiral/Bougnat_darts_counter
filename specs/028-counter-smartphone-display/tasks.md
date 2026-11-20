# Tâches — 028 Affichage téléphone

> Fichier créé lors de la révision V2 du 2026-11-20 : la spec 028 historique n'avait pas de liste de tâches.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Chaque tâche référence les critères d'acceptation V2-AC.

### Préalables
- [ ] T000 Vérifier que la spec est validée (Révision V2 acceptée par le PO) et que la décision Q1 (A, B ou C) est prise
- [ ] T001 Reporter la décision dans 028 et dans les notes de release (V2-AC-01)

### Mise en œuvre
- [ ] T002 Corriger le commentaire de `usePortraitLock` et `docs/release/v2.0.0.md:43` (V2-AC-05)
- [ ] T003 Retirer ou corriger `usePortraitLock` (plein écran, `unlock`, classe téléphone) (V2-AC-04)
- [ ] T004 (B/C) Recette `phone-landscape` opérable pour chaque jeu (V2-AC-02)
- [ ] T005 (B) Écran de rotation → invite non bloquante, mémorisée par partie, écrans de jeu seulement (V2-AC-03)
- [ ] T006 (A) Rédiger la justification de dérogation WCAG 1.3.4 (V2-NFR-01)

### Tests
- [ ] T007 Adapter `smartphone-layout.smoke.spec.ts` à la décision (V2-AC-02, V2-AC-03)
- [ ] T008 Test unitaire du verrou (jamais hors plein écran ni sur tablette) (V2-AC-04)
- [ ] T009 Test manuel iPhone Safari et Android Chrome en paysage

### Clôture
- [ ] T010 Préparer la fusion avec 027 (Q5) et demander l'ajout de 028 à l'index des specs
- [ ] T011 Renseigner `verifie_au_commit`, fermer l'issue
