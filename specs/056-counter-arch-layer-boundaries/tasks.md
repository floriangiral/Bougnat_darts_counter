# Tâches — 056 Frontières de couches et sort du domaine X01 inutilisé

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que Q1 à Q5 sont tranchées et que la spec 039 couvre les moteurs déplacés

## Implémentation
- [ ] T001 Ajouter les règles `no-restricted-imports` par couche en `error` et la liste d'exceptions V1-V7 (AC-01, AC-02)
- [ ] T002 Créer `src/domain/shared/` et transformer `types.ts` en ré-export sans `import(` (AC-03)
- [ ] T003 Déplacer `utils/cricketLogic.ts`, `utils/capitalLogic.ts`, `utils/triathlonScoring.ts` vers `src/domain/<jeu>/` (AC-05)
- [ ] T004 Déplacer `formatDuration` et la rotation hors de `matchLifecycle.ts` (AC-02)
- [ ] T005 Résorber V3 et V5 (type `AppAccessMode`, clé de stockage) (AC-02)
- [ ] T006 Après la spec 057 : supprimer `src/domain/scoring` et les use cases non branchés, porter les tests utiles (AC-04)
- [ ] T007 Supprimer `useSharedX01Session`, `SyncRepository` et les écrans morts selon Q3 (AC-04)
- [ ] T008 Compléter `scripts/guard-clean-codebase.sh` (AC-05)
- [ ] T009 Supprimer les ré-exports transitoires et vider la liste d'exceptions (AC-02)

## Tests
- [ ] T010 Test d'outillage : une violation volontaire échoue au lint (AC-01)
- [ ] T011 Rejouer `typecheck`, `test:unit`, `build`, E2E smoke à chaque étape (AC-06)

## Documentation et clôture
- [ ] T012 Mettre à jour `docs/architecture.md` (arborescence réelle, règle outillée, convention `features/`) (AC-07)
- [ ] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
