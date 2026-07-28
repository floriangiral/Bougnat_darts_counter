# Tasks - counter ai coach progression

## Documentation

- [x] ajouter `specs/029-counter-ai-coach-progression/spec.md`
- [x] ajouter `specs/029-counter-ai-coach-progression/plan.md`
- [x] ajouter `specs/029-counter-ai-coach-progression/tasks.md`
- [x] referencer la spec dans `specs/README.md`
- [x] referencer la spec dans `docs/specifications.md`

## Frontend foundation (ce repo)

- [x] ajouter les types domaine Coach (`skill model`, `exercise catalog`)
- [x] ajouter les ports applicatifs Coach
- [x] ajouter `CoachAIService` (orchestration + validation)
- [x] ajouter un adapter HTTP Coach (backend contracts)
- [x] ajouter l ecran Coach Home et son routage
- [x] brancher Coach Home vers `GenerateCoachSession` (appel backend + rendu plan)
- [x] ajouter tests unitaires Coach

## Backend (repo Tournament)

- [x] creer les entites SQL Coach et migrations
- [x] creer les endpoints REST Coach versionnes
- [x] implementer persistance programme/seances/evaluations
- [x] implementer events metier Coach

## IA (repo Tournament)

- [x] integrer OpenAI GPT-5.5 cote backend
- [x] ajouter cache des decisions
- [x] limiter appels IA aux moments cibles
- [x] monitorer cout/latence/erreurs
