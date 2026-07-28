# Spec 010 - counter offline session recovery guarantees

## Meta

- ID: `010-counter-offline-session-recovery-guarantees`
- Statut: `active`
- Milestone cible: `M4: Local Session Persistence`
- Issues GitHub: `#71`

## Objectif

Formaliser les garanties de reprise de session locale pour proteger la promesse offline-first durant les interruptions (reload, fermeture, reprise partielle).

## Decisions

- la session locale est la source de verite en mode local
- la reprise doit restaurer un etat jouable coherent
- les donnees invalides doivent etre ignorees proprement sans crash
- les flux de reprise doivent rester independants d un backend metier

## Invariants critiques

- pas de perte silencieuse d etat critique pendant une partie en cours
- pas de blocage au lancement en presence de donnees corrompues
- retour a un etat initial sain si restauration impossible

## Impacted Code

- `src/infrastructure/local/IndexedDBSessionRepository.ts`
- `src/infrastructure/local/sessionPersistence.ts`
- `src/shared/session/persistedAppSession.ts`
- `src/app/appShell.ts`

## Canonical Entry Points

- `saveSession` / `loadSession`
- bootstrap de session dans `appShell`

## Key Tests

- `tests/unit/application/indexedDbSessionRepository.test.ts`
- `tests/unit/app/appShell.test.ts`
- `tests/e2e/completion.smoke.spec.ts`

## Validation

- reprise valide apres reload
- tolerance aux donnees partielles/corrompues
- continuity de gameplay sans backend
