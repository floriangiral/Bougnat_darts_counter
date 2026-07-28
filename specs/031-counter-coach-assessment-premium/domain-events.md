# Domain Events - Spec 031 coach assessment premium

Emis via le mecanisme existant (`AppendDomainEvent`) et persistes dans
`coach_domain_events`. Nommage: `coach.assessment.*`.

| Evenement | Declencheur | Charge utile (extrait) |
|---|---|---|
| `coach.assessment.session.started` | Creation d une session | sessionId, playerProfileId, definitionVersion |
| `coach.assessment.exercise.recorded` | Autosave d une epreuve | sessionId, exerciseCode, recordedAt |
| `coach.assessment.session.paused` | Mise en pause | sessionId, currentExerciseOrder |
| `coach.assessment.session.resumed` | Reprise d une session | sessionId, currentExerciseOrder |
| `coach.assessment.session.submitted` | Soumission finale | sessionId |
| `coach.assessment.results.computed` | Calcul moteur termine | sessionId, overallScore, level, priorities |
| `coach.assessment.report.generated` | Rapport IA produit | sessionId, source (openai/fallback) |
| `coach.assessment.completed` | Bilan finalise (conserve) | sessionId, playerProfileId |
| `coach.assessment.abandoned` | Session abandonnee/expiree | sessionId, reason |
| `coach.progress.recomputed` | Calibration du profil (conserve) | playerProfileId, level, primaryObjective |
| `coach.program.generated` | Programme personnalise genere | playerProfileId, programId |

## Regles

- Idempotency: un rejeu de start/submit/report ne doit pas dupliquer d evenement.
- Ordre logique attendu:
  `session.started` -> (`exercise.recorded`)* -> (`session.paused`/`session.resumed`)*
  -> `session.submitted` -> `results.computed` -> `progress.recomputed`
  -> `program.generated` -> `report.generated` -> `completed`.
- Chaque evenement porte un horodatage et le `playerProfileId` resolu.
- Aucun evenement ne transporte de donnee calculee par l IA en amont du moteur.
