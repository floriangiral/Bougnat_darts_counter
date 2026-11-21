# Tasks - Counter iOS 12 Compatibility

- [x] Ecrire la spec compatibilite iOS 12.
- [x] Ajouter pipeline build legacy.
- [x] Ajouter detection infrastructure des capacites CSS.
- [x] Brancher la detection au bootstrap.
- [x] Ajouter fallbacks CSS (`gap`, `clamp`, `backdrop-filter`).
- [x] Renforcer bootstrap SW/PWA.
- [x] Ajouter tests unitaires de la detection legacy.

## Révision V2 — tâches proposées

> À exécuter uniquement après validation de la Révision V2. Chaque tâche référence les critères d'acceptation V2-AC.

- [ ] T000 Vérifier que la spec est validée (Révision V2 acceptée par le PO) et que l'iPad Air iOS 12 ou un moyen de test équivalent est disponible
- [ ] T001 PoC iOS 12 avec la CSS actuelle : captures accueil, setup, X01 (V2-AC-01)
- [ ] T002 PoC repli CSS (option A) sur branche jetable : captures, taille, effort (V2-AC-01)
- [ ] T003 PoC rendu Chromium 85/87 (CSS actuelle + page TV conservatrice) (V2-AC-02)
- [ ] T004 Chiffrer le budget de test (appareils ou service) (Q5)
- [ ] T005 Rédiger la note de décision et la soumettre au PO ; ADR si retenu (V2-AC-03)
- [ ] T006 Publier la baseline navigateurs dans la documentation (V2-FR-01)
- [ ] T007 Aligner `vite.config.ts` et la chaîne CSS sur la baseline (V2-AC-04)
- [ ] T008 Message de non-support si abandon iOS 12 (V2-AC-05)
- [ ] T009 Mettre à jour la matrice de validation (ligne legacy) (V2-FR-05)
- [ ] T010 Informer 063 (format des tokens), 086 et 090 (cible TV) de la décision
- [ ] T011 Passer 018 au statut correspondant, renseigner `verifie_au_commit`, fermer l'issue
