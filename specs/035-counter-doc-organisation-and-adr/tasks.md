# Tâches — 035 Organisation documentaire, statuts de page et ADR

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que V2-SDD-01 (032) et V2-DOC-01 (034) sont clos, et obtenir les décisions Q1 à Q5

## Déjà réalisé dans la PR `docs/v2-specs` (à vérifier)
- [ ] T001 Contrôler `docs/adr/README.md` et ADR-0001 à 0009 (statut `proposee`, specs liées) (AC-04)
- [ ] T002 Contrôler le bandeau « Document historique » de `docs/v2/README.md`

## Implémentation
- [ ] T003 Créer `docs/README.md` (index + légende des statuts) (AC-02)
- [ ] T004 Poser le bandeau de statut sur chaque page de `docs/` (AC-01)
- [ ] T005 Convertir les « Decision v1.0.1 / v1.1 / v2.0 » en ADR `acceptee` et les retirer de `docs/architecture.md` (AC-03)
- [ ] T006 Rédiger les ADR complémentaires proposés (§23) (AC-04)
- [ ] T007 Créer `product/status.md` (état livré) et `architecture/access-modes.md` (AC-05)
- [ ] T008 Si Q1 = B : réorganiser par `git mv`, poser les renvois, mettre à jour les liens entrants

## Tests
- [ ] T009 Écrire `scripts/check-docs.mjs` et `tests/unit/tooling/docsCheck.test.ts` (AC-01)
- [ ] T010 Brancher `npm run docs:check` en CI avec V2-QA-10 (AC-01)

## Documentation et clôture
- [ ] T011 Mettre à jour `AGENTS.md`, `CONTRIBUTING.md`, `.specify/conventions.md`
- [ ] T012 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
