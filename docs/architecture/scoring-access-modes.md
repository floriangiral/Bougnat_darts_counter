# Counter Access Modes (archive v1.0.0)

## Modes supportes

Ce document conserve la trace de la direction v1.0.0. La logique actuelle vit dans `src/app/appShell.ts` et la référence courante est `docs/specifications.md`.

Note M10: le mode connecte auth/tournoi est specifie dans `spec:counter/hub-auth-tournament-scoring`.

- `local`
  - mode nominal de `v1.0.0`
  - aucun backend requis
  - session et historique sur le device
- `dedicated_tablet`
  - variante de surface scoring
  - toujours centree sur le scoring uniquement
- `personal_phone`
  - variante compacte de surface scoring
  - toujours centree sur le scoring uniquement
- `connected`
  - mode M10 pour inscription / connexion et scoring tournoi
  - backend configure par `VITE_TOURNAMENT_API_BASE_URL`
  - le coeur de scoring reste independant du transport HTTP

## Regle d architecture

Un mode d acces peut modifier la surface UI disponible.

Il ne doit jamais :

- redefinir les regles de scoring
- injecter de logique backend dans le domaine
- transformer un besoin produit hors perimetre en dependance runtime
- rendre le mode local dependant du reseau

## Guardrails

Les ecrans supportes dans les modes de scoring sont :

- `GAME_SELECTION`
- `SETUP`
- `MATCH`
- `STATS`
- `CRICKET_GAME`
- `CRICKET_STATS`
- `CAPITAL_GAME`
- `CAPITAL_STATS`
- `TRIATHLON_GAME`
- `TRIATHLON_STATS`
