# Counter Access Modes (archive v1.0.0)

## Modes supportes

Ce document conserve la trace de la direction v1.0.0. La logique actuelle vit dans `src/app/appShell.ts` (modes `local`, `dedicated_tablet`, `personal_phone`) ; l'état réel et la révision proposée sont décrits dans la « Révision V2 » de la spec [001](../../specs/001-counter-scoring-access-modes/spec.md) (à valider). `docs/specifications.md` ne traite pas les modes d'accès.

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
