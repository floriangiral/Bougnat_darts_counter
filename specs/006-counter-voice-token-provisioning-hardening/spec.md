# Spec 006 - counter voice token provisioning hardening

## Meta

- ID: `006-counter-voice-token-provisioning-hardening`
- Statut: `active`
- Milestone cible: `M3: Voice Scoring Reliability`
- Issues GitHub: `#74`

## Objectif

Durcir le provisioning de token voice pour eviter les erreurs de configuration Deepgram et rendre les erreurs explicites avant l execution utilisateur.

## Decisions

- validation bloquante de `DEEPGRAM_API_KEY` et `DEEPGRAM_PROJECT_ID` en promotion
- verification de l acces au projet Deepgram avant grant token
- normalisation defensive des variables d environnement (quotes, espaces)
- fallback manuel de score conserve en toutes circonstances

## Invariants critiques

- pas d auto-validation de score voice
- pas d exposition de secret dans le frontend
- pas de blocage du scoring manuel quand voice indisponible

## Impacted Code

- `lib/deepgramToken.ts`
- `functions/api/deepgram/token.ts`
- `.github/workflows/promote-preprod.yml`
- `.github/workflows/promote-production.yml`

## Canonical Entry Points

- `grantDeepgramToken`
- `functions/api/deepgram/token`

## Key Tests

- `tests/unit/lib/deepgramToken.test.ts`
- `npm run test:unit`
- verification de workflow preprod/prod

## Validation

- scenario config valide: token genere
- scenario project id invalide: erreur explicite 502 cote token route
- scenario voice down: scoring manuel intact
