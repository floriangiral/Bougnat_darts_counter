# Tâches — 070 Résolveur unique classes de taille et orientation

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que l'ADR 0007 est acceptée
- [ ] T001 Reporter les décisions Q1 à Q4

## Implémentation
- [ ] T002 Écrire la table de vérité en test (AC-01)
- [ ] T003 Implémenter `resolveViewportClass` (pur) (AC-01)
- [ ] T004 Hook `useViewportClass` avec stabilisation clavier virtuel (AC-04)
- [ ] T005 `App.tsx` : attributs racine + `data-layout` dérivé (AC-03, AC-05)
- [ ] T006 Supprimer `isCompactBrowserMobile` de `MatchView` (AC-02)
- [ ] T007 Redéfinir `dedicated_tablet` (Q1) avec V2-ARCH-12
- [ ] T008 Supprimer `TABLET_BREAKPOINTS`, déprécier `tabletLayout.ts`

## Tests
- [ ] T009 Table de vérité unitaire complète (AC-01)
- [ ] T010 E2E 1080×750 tactile sans forçage → `arena` (AC-03)
- [ ] T011 E2E rotation en partie avec saisie en cours (AC-04)
- [ ] T012 Captures de non-régression téléphone/bureau (AC-05)

## Documentation et clôture
- [ ] T013 ADR 0007 finalisé, documentation d'architecture, notes de release
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
