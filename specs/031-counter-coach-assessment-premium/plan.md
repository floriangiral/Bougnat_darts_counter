# Plan - counter coach assessment premium (spec 031)

Statut: `draft` (design only). Aucune implementation avant validation.
La sequence detaille l ordre d execution une fois la spec approuvee.

## Phase 0 - Spec (ce livrable)

- [x] `spec.md` (fonctionnel, domaine, use cases, sequence, test strategy)
- [x] `adr.md` (ADR-031-001..008)
- [x] `data-model.md` (nouvelles tables data-driven + cycle de vie)
- [x] `api-contracts.md` (endpoints du cycle de vie)
- [x] `domain-events.md`
- [x] `use-cases.md` (UC1..UC10)
- [x] `acceptance-tests.md` (Gherkin)
- [x] `plan.md` + `tasks.md`
- [x] spec backend companion `045-bdt-coach-assessment-engine`
- [ ] validation utilisateur avant code

## Phase 1 - Config data-driven (backend)

- [ ] migration nouvelles tables (`data-model.md`)
- [ ] seed referentiel 14 competences + 10 epreuves (input_schema/scoring_config) + mapping
- [ ] endpoint `GET /assessment/definition`

## Phase 2 - Moteur metier (backend)

- [ ] scoring modulaire par epreuve (interpretation `scoring_config`)
- [ ] agregation score global + priorites + potentiel + tendances
- [ ] calibration profil (reutilise derivation niveau/objectif)

## Phase 3 - Cycle de vie session (backend)

- [ ] start/resume (idempotent) + `GET current`
- [ ] autosave epreuve (`PUT .../exercises/{code}`)
- [ ] pause/resume
- [ ] submit (compute -> calibrate -> program -> report) idempotent
- [ ] history

## Phase 4 - Rapport IA + programme (backend)

- [ ] generation rapport IA interpret-only + validation schema + fallback
- [ ] generation programme personnalise (cycle 1 + seance 1)
- [ ] domain events (`domain-events.md`)

## Phase 5 - Frontend premium

- [ ] chargement definition data-driven (aucun bareme code en dur)
- [ ] parcours session: intro, progression, temps restant, autosave, pause/reprise
- [ ] saisie brute par epreuve (steppers/comptages)
- [ ] bilan final: radar, details, evolution, analyse IA, potentiel, programme pret

## Phase 6 - Qualite

- [ ] unit domaine backend (moteur, agregation, calibration, validation rapport)
- [ ] integration backend (cycle de vie, idempotency) + SQL migrations
- [ ] unit + integration frontend (rendu radar, parcours, reprise)
- [ ] tests d acceptation (`acceptance-tests.md`)
- [ ] non-regression scoring existant + compat contrat evaluations
