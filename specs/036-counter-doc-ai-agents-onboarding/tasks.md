# Tâches — 036 Onboarding des agents IA (AGENTS.md)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que V2-SDD-01 (032) est clos, et obtenir les décisions Q1 à Q3

## Déjà réalisé dans la PR `docs/v2-specs` (à vérifier)
- [ ] T001 Relire `AGENTS.md` : exactitude des versions, commandes, pièges et liens (AC-02, AC-03)

## Implémentation
- [ ] T002 Ajouter les prérequis E2E locaux (FR-02) (AC-01)
- [ ] T003 Ajouter la liste d'interdits (FR-03) et la définition de « terminé » (FR-04) (AC-01)
- [ ] T004 Ajouter les règles de maintenance M-01 à M-06 dans `AGENTS.md` et `CONTRIBUTING.md` (FR-05)
- [ ] T005 Corriger ou créer la cible du lien `docs/roadmap-v2.md` (AC-03)
- [ ] T006 Ajouter la case FR-07 au modèle de PR (AC-05)
- [ ] T007 Selon Q1, créer `.github/copilot-instructions.md` (renvoi)

## Tests
- [ ] T008 Étendre `scripts/check-docs.mjs` (035) à la vérification des scripts cités + test unitaire (AC-02)
- [ ] T009 Essai à blanc avec un agent sans contexte sur une spec `a-valider` (AC-04)

## Documentation et clôture
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
