# Tâches — 111 Module neutre « match lié »

> À exécuter uniquement après validation de la spec et acceptation d'un deuxième canal. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, qu'un deuxième canal (107, `v=2` ou BDT) est accepté et que les tests golden de V2-INT-01 existent

## Implémentation
- [ ] T001 Extraire `returnPolicy.ts` avec réexports (AC-01)
- [ ] T002 Extraire `contract/v1/inbound.ts` et `contract/v1/outbound.ts` (AC-01)
- [ ] T003 Extraire `linkedMatch.ts` et ajouter `game` au contexte avec lecture rétrocompatible (AC-03)
- [ ] T004 Extraire `linkedMatchResult.ts` (AC-01)
- [ ] T005 Extraire `src/app/useLinkedMatch.ts` et alléger `App.tsx` (AC-04)
- [ ] T006 Supprimer les réexports et mettre à jour les en-têtes `// Spec:` (AC-05)

## Tests
- [ ] T007 Test de restauration d'un contexte persisté à `508dfa6` (AC-03)
- [ ] T008 Tests du hook `useLinkedMatch` (horloge et politique injectées)
- [ ] T009 Suite `tests/unit/externalMatch/*`, tests golden et E2E du lien sans modification d'attendus (AC-01, AC-02)
- [ ] T010 Lint des frontières sur les modules purs (AC-05)

## Documentation et clôture
- [ ] T011 Mettre à jour la documentation d'architecture et ADR-0009
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
