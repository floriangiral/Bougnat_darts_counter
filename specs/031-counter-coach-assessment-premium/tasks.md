# Tasks - counter coach assessment premium (spec 031)

Backlog ordonne. `[B]` = repo Bougnat_Darts_Tournaments, `[F]` = repo Bougnat_darts_counter.
Aucune tache demarree (design only).

## Config data-driven

- [ ] [B] T001 migration `coach_assessment_*` (definitions + cycle de vie) (`data-model.md`)
- [ ] [B] T002 seed 14 competences (`coach_assessment_skill_defs`)
- [ ] [B] T003 seed 10 epreuves + `input_schema` + `scoring_config` (`coach_assessment_exercise_defs`)
- [ ] [B] T004 seed mapping epreuve->competence (`coach_assessment_exercise_skill`)
- [ ] [B] T005 endpoint + service `GET /assessment/definition`

## Moteur metier

- [ ] [B] T010 domaine: scoring modulaire par epreuve (interprete `scoring_config`)
- [ ] [B] T011 domaine: indicateurs (distribution, 100+/140+/180, best/worst, plages checkout, endurance debut/milieu/fin, repetabilite)
- [ ] [B] T012 domaine: agregation score global pondere + priorites + potentiel
- [ ] [B] T013 domaine: tendances vs historique
- [ ] [B] T014 domaine: calibration (reutilise `DeriveLevel`/`DerivePrimaryObjective`)
- [ ] [B] T015 tests unitaires domaine (moteur, agregation, calibration)

## Cycle de vie session

- [ ] [B] T020 repo + service start/resume (idempotent)
- [ ] [B] T021 endpoints `POST sessions`, `GET sessions/current`, `GET sessions/{id}`
- [ ] [B] T022 autosave `PUT sessions/{id}/exercises/{code}` + validation `input_schema`
- [ ] [B] T023 `POST sessions/{id}/pause`
- [ ] [B] T024 `POST sessions/{id}:submit` (compute->calibrate->program->report), idempotent
- [ ] [B] T025 `GET assessment/history`
- [ ] [B] T026 tests integration cycle de vie + idempotency

## Rapport IA + programme

- [ ] [B] T030 rapport IA interpret-only (system prompt anti-invention) + schema strict
- [ ] [B] T031 fallback deterministe + cache TTL (reutilise existant)
- [ ] [B] T032 `GET sessions/{id}/report` (pending/ready/failed)
- [ ] [B] T033 generation programme (cycle 1 + seance 1) depuis catalogue
- [ ] [B] T034 domain events (`domain-events.md`)

## Frontend

- [ ] [F] T040 domaine: types definition/session/resultats (data-driven, zero bareme code en dur)
- [ ] [F] T041 application: use cases (LoadDefinition, StartOrResume, RecordExercise, SubmitAssessment, LoadReport)
- [ ] [F] T042 infrastructure: adapters HTTP du cycle de vie
- [ ] [F] T043 UI intro + parcours (progression, temps restant, autosave, pause/reprise)
- [ ] [F] T044 UI saisie brute par epreuve (steppers/comptages)
- [ ] [F] T045 UI bilan final (radar, details, evolution, analyse IA, potentiel, programme pret)
- [ ] [F] T046 tests unit + integration frontend

## Qualite / migration

- [ ] [B][F] T050 tests d acceptation (`acceptance-tests.md`)
- [ ] [B][F] T051 non-regression scoring existant
- [ ] [B] T052 depreciation documentee de `POST /v1/coach/me/evaluations` (ADR-031-006)
- [ ] [B][F] T053 mise a jour docs specs + traceabilite
