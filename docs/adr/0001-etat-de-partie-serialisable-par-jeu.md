---
id: ADR-0001
titre: État de partie sérialisable et reducer pur par jeu
statut: proposee
date: 2026-11-20
specs_liees: [058, 010, 089, 079]
---

# ADR-0001 — État de partie sérialisable et reducer pur par jeu

## Statut
Proposée — à valider par le product owner.

## Contexte
- Seul X01 expose un état JSON remonté au shell et restauré au rechargement (`App.tsx:353-361`). Cricket (7 `useState`), Killer, Gotcha, Capital et Triathlon gardent leur état dans la vue (`App.tsx:364-422`) : la partie est perdue au rechargement, contrairement à la spec 010.
- Cinq variantes d'annulation coexistent, toutes en mémoire.
- La TV multi-jeux, la voix multi-jeux et le futur contrat avec `Bougnat_Darts_Tournaments` exigent un état extractible sans React.

## Options envisagées
1. Statu quo + persistance ad hoc par vue (copie de `useState` dans le storage).
2. **Un état sérialisable par jeu et un reducer pur `(état, commande) → état`**, hébergés dans `src/domain/<jeu>`, orchestrés par un hook générique mince.
3. Moteur générique unique pour tous les jeux (registre, DSL de règles).

## Décision proposée
Option 2, migrée jeu par jeu (Gotcha → Killer → Capital → Cricket → X01 → Triathlon) après des tests de caractérisation validés métier (spec 039). L'option 3 est reportée (spec 060) tant qu'aucun nouveau jeu n'est validé.

## Conséquences
- Bénéfices : reprise de tous les jeux, tests unitaires des règles, projection TV, voix multi-jeux, contrat BDT.
- Risques : régressions pendant l'extraction ; mutation existante de `finishLeg` (`src/application/scoring/matchLifecycle.ts:217-220`) à corriger ; schéma persisté à versionner (ADR-0003).

## Stratégie de migration
Un jeu par PR ; le comportement visible reste identique ; l'ancien état en vue est supprimé dans la même PR.

## Non-régression
Golden tests par jeu (spec 039), tests d'immutabilité, E2E « partie complète + reload » (spec 040).
