# Tasks - counter coach full assessment

## Documentation

- [x] ajouter `specs/030-counter-coach-full-assessment/spec.md`
- [x] ajouter `specs/030-counter-coach-full-assessment/plan.md`
- [x] ajouter `specs/030-counter-coach-full-assessment/tasks.md`
- [x] referencer la spec dans `specs/README.md`

## Frontend (ce repo)

- [x] `src/domain/coach/assessment.ts` (taxonomie, batterie, normalisation)
- [x] `src/application/coach/RunFullAssessment.ts` + port `CoachAssessmentPort`
- [x] `HttpCoachAssessmentClient` dans `coachApi.ts`
- [x] `views/AssessmentView.tsx` (parcours + resultats)
- [x] ecran `COACH_ASSESSMENT` + routage `full_assessment`
- [x] tests unitaires (`assessment`, `runFullAssessment`)

## Backend (repo Tournament)

- [x] domaine `DeriveLevel` / `DerivePrimaryObjective` / `CalibrateFromAssessment`
- [x] repository `CalibrateFromAssessment` (tx skills + evolution + progress)
- [x] service `CompleteAssessment` -> calibration + event `coach.progress.recomputed`
- [x] tests unitaires domaine calibration
