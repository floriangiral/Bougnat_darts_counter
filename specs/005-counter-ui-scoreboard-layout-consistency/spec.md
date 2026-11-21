---
id: 005-counter-ui-scoreboard-layout-consistency
v2_id: null
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Partielle."
traitement_propose: "Fusionner comme invariants dans V2-TAB-02/V2-TAB-03 et V2-QA-09."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 005 - counter ui scoreboard layout consistency

## Meta

- ID: `005-counter-ui-scoreboard-layout-consistency`
- Statut: `active`
- Milestone cible: `M2: Game Modes Stability`
- Issues GitHub: `#to-create`

## Objectif

Garantir un alignement stable des zones score, nom et statistiques dans le scoreboard X01, independamment de la longueur des noms, du mode simple/doublette et de la taille d ecran.

## Decisions

- la zone score doit conserver le meme point de depart vertical entre colonnes
- la zone nom conserve une empreinte verticale fixe
- les variations de longueur de nom ne doivent pas deformer la zone score
- les adaptations responsive ne doivent pas casser l alignement relatif entre joueurs

## Invariants critiques

- aucune regression de lisibilite sur mobile
- aucune dependance a un backend pour ce rendu
- conservation de l experience gameplay existante

## Impacted Code

- `components/game/PlayerScore.tsx`
- `views/MatchView.tsx`
- `src/styles/tailwind.css`

## Canonical Entry Points

- `PlayerScore`
- `MatchView.renderPlayerArea`

## Key Tests

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`

## Validation

- verifier l alignement avec noms courts et longs
- verifier sur mobile, tablette et desktop
