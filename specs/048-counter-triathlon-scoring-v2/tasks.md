# Tâches — 048 Triathlon : barème v2 versionné

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que le barème v2 (Q1, Q2) est arbitré et que les specs 039, 045 et 047 sont livrées ou planifiées

## Implémentation
- [ ] T001 Golden tests de caractérisation du barème v1 (C1 à C7)
- [ ] T002 Table `TRIATHLON_SCORING_RULES_V2` avec `version: 2` (AC-05)
- [ ] T003 Défaite serrée par position de sortie (AC-01)
- [ ] T004 Bonus 501 de remplacement, indépendants de l'ordre de jeu (AC-02)
- [ ] T005 Rang Cricket sur le vainqueur réel, égalité 17/17 (AC-03)
- [ ] T006 Bonus Cricket et Capital de remplacement ; RM-02 (AC-04)
- [ ] T007 `scoringVersion` dans le résultat, l'historique et l'écran de statistiques (AC-06)
- [ ] T008 Barème détaillé dans les règles affichées

## Tests
- [ ] T010 Golden tests v2 validés métier (AC-01 à AC-05)
- [ ] T011 Test de symétrie (vainqueur premier ou second lanceur) (AC-02)
- [ ] T012 Test d'affichage « Barème v1 » pour une entrée sans version (AC-06)

## Documentation et clôture
- [ ] T020 Mettre à jour la référence des règles (spec 050), `docs/specifications.md`, notes de version
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
