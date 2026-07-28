# Plan - counter coach full assessment

## Phase 1 - Spec

- [x] creer la spec locale `030`
- [x] referencer la spec dans `specs/README.md`

## Phase 2 - Domaine frontend

- [x] taxonomie mesurable (7 skill_code) + labels
- [x] batterie d evaluation (6 tests) et draft
- [x] normalisation brut->0..100 (interpolation par paliers)
- [x] derivation `consistency` par variance des volees
- [x] derivations niveau/priorite + payload evaluation

## Phase 3 - Application + infrastructure frontend

- [x] use case `RunFullAssessment`
- [x] port `CoachAssessmentPort`
- [x] adapter `HttpCoachAssessmentClient` (POST /v1/coach/me/evaluations)

## Phase 4 - UI

- [x] `AssessmentView` (parcours guide, steppers, resultats)
- [x] ecran `COACH_ASSESSMENT` + routage depuis Coach Home

## Phase 5 - Backend calibration

- [x] `DeriveLevel` / `DerivePrimaryObjective` / `CalibrateFromAssessment` (domaine)
- [x] repo `CalibrateFromAssessment` (upsert skills + evolution + progress, tx)
- [x] service `CompleteAssessment` declenche la calibration + event `coach.progress.recomputed`

## Phase 6 - Qualite

- [x] tests unitaires frontend (domaine, application, infrastructure)
- [x] tests unitaires backend (domaine calibration)
- [x] typecheck frontend + go build/vet/test backend
