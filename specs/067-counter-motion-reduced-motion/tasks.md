# Tâches — 067 Animations et prefers-reduced-motion

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-01 (063) est livrée
- [ ] T001 Reporter les décisions Q1 et Q3

## Implémentation
- [ ] T002 Tokens de durée et d'easing (AC-04)
- [ ] T003 Utilité native `animate-fade-in` et remplacement des 6 usages (AC-01)
- [ ] T004 Règle globale `prefers-reduced-motion: reduce` (AC-02)
- [ ] T005 Impulsion unique pour les 4 pulsations continues (AC-03)
- [ ] T006 Transitions ciblées à la place des `transition-all` triviaux (AC-04)

## Tests
- [ ] T007 E2E `reducedMotion: 'reduce'` sur X01 (conseil de finish, badge du lanceur) (AC-02)
- [ ] T008 E2E sans réduction : aucune animation en cours 5 s après apparition (AC-03)
- [ ] T009 Recherche `animate-in` = 0 (AC-01)

## Documentation et clôture
- [ ] T010 Mettre à jour le guide des rôles et les notes de release
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
