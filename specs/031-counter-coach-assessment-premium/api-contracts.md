# API Contracts - Spec 031 coach assessment premium

Base path: `/v1/coach`. Auth: bearer (utilisateur courant `me`).
En-tetes: `Authorization`, `Idempotency-Key` (POST critiques), `Content-Type: application/json`.
Serialisation: JSON, `DisallowUnknownFields` cote backend.
Toutes les valeurs numeriques de score sont calculees par le backend.

## GET /v1/coach/assessment/definition

Retourne la definition data-driven courante (epreuves + competences).

Reponse `200`:

```json
{
  "version": 1,
  "title": "Evaluation complete",
  "description": "Bilan de competences en 10 epreuves.",
  "estimatedSeconds": 1500,
  "skills": [
    { "code": "scoring", "name": "Scoring", "category": "offense" }
  ],
  "exercises": [
    {
      "code": "scoring_501",
      "order": 1,
      "name": "Scoring 501",
      "description": "...",
      "instructions": "...",
      "estimatedSeconds": 180,
      "inputSchema": { "fields": [ { "key": "volley", "type": "int", "min": 0, "max": 180, "repeat": 6 } ] },
      "skills": [ { "code": "scoring", "weight": 1.0, "primary": true } ]
    }
  ]
}
```

## POST /v1/coach/me/assessment/sessions

Demarre une session (ou renvoie la session en cours si presente). Idempotent.

Requete:

```json
{ "definitionVersion": 1 }
```

Reponse `201` (nouvelle) ou `200` (reprise):

```json
{
  "id": "uuid",
  "status": "in_progress",
  "definitionVersion": 1,
  "currentExerciseOrder": 1,
  "estimatedRemainingSeconds": 1500,
  "recordedExercises": []
}
```

## GET /v1/coach/me/assessment/sessions/current

Retourne la session `in_progress`/`paused` du joueur, ou `404` si aucune.

## GET /v1/coach/me/assessment/sessions/{id}

Retourne l etat complet d une session (statut, epreuve courante, resultats saisis).

## PUT /v1/coach/me/assessment/sessions/{id}/exercises/{code}

Autosave des entrees brutes d une epreuve. Idempotent (remplace l epreuve).

Requete:

```json
{ "rawInputs": { "volley": [60, 45, 100, 26, 41, 85] } }
```

Reponse `200`:

```json
{
  "sessionId": "uuid",
  "exerciseCode": "scoring_501",
  "recordedAt": "2026-01-01T10:00:00Z",
  "currentExerciseOrder": 2,
  "estimatedRemainingSeconds": 1320
}
```

Note: `computed_indicators` peut etre calcule a l autosave (apercu) ou uniquement
au submit; le contrat expose des indicateurs uniquement s ils sont calcules backend.

## POST /v1/coach/me/assessment/sessions/{id}/pause

Passe la session en `paused`. Reponse `200` avec statut.

## POST /v1/coach/me/assessment/sessions/{id}:submit

Finalise. Idempotent. Declenche: calcul moteur -> calibration -> programme -> rapport IA.

Reponse `200`:

```json
{
  "sessionId": "uuid",
  "status": "completed",
  "overallScore": 62.4,
  "level": "intermediate",
  "skillScores": [
    { "code": "scoring", "score": 68.0, "confidence": 85, "indicators": { "avg": 58.2, "count180": 1 } }
  ],
  "priorities": ["doubles", "checkout"],
  "potential": { "doubles": 22.5 },
  "recommendedObjective": "finition_doubles",
  "program": { "id": "uuid", "status": "draft", "firstSession": { "id": "uuid" } },
  "report": { "status": "pending" }
}
```

## GET /v1/coach/me/assessment/sessions/{id}/report

Retourne le rapport IA. Peut etre asynchrone.

Reponse `200`:

```json
{
  "status": "ready",
  "source": "openai_gpt_5_5",
  "summary": "...",
  "strengths": ["scoring", "first_nine"],
  "weaknesses": ["doubles", "checkout"],
  "priorities": ["doubles"],
  "potential": "Marge importante en finition.",
  "explanation": "..."
}
```

Statuts possibles: `pending`, `ready`, `failed` (avec fallback deterministe).

## GET /v1/coach/me/assessment/history

Liste des bilans termines (sessions `completed`) avec score global, niveau, date.

## Compatibilite (deprecie)

`POST /v1/coach/me/evaluations` (spec 030) reste disponible mais deprecie
(ADR-031-006). Reponse enrichie d un en-tete/marqueur de depreciation.

## Codes d erreur

- `400` payload invalide / champ inconnu / entrees hors schema
- `401` non authentifie
- `404` session inexistante
- `409` conflit d etat (ex: submit d une session deja completee sans idempotency)
- `422` entrees incompletes au submit (epreuves manquantes)
