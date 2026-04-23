# Counter Access Modes

## Modes supportes

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

## Regle d architecture

Un mode d acces peut modifier la surface UI disponible.

Il ne doit jamais :

- redefinir les regles de scoring
- injecter de logique backend dans le domaine
- transformer un besoin produit hors perimetre en dependance runtime

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
