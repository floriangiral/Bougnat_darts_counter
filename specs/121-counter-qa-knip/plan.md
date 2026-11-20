# Plan — 121 Knip

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `package.json:31-65`, `postcss.config.mjs`, `scripts/guard-clean-codebase.sh`, `App.tsx:54-65`, `functions/api/`, `public/pcmCaptureWorklet.js`, `sw.js`.

## 2. Approche retenue (et alternatives écartées)

Retenue : Knip en dépendance de développement, rapport hebdomadaire, nettoyage par PR dédiées.
Écartées : `depcheck`, `ts-prune` (périmètres partiels) ; suppression automatique (interdite par la demande).

## 3. Étapes

1. Installer Knip (dépendance de développement) ; scripts `knip` et `knip:production`.
2. Rédiger `knip.json` et itérer localement jusqu'à un rapport sans faux positif connu.
3. Job hebdomadaire et issue « Dette Knip » (113 gabarit).
4. PR dédiées pour les candidats confirmés (`autoprefixer`, `qrcode`, autres).
5. Après 4 semaines (Q2) : job PR « nouvelles dépendances inutilisées ».

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `package.json`, `package-lock.json` | Dépendance Knip, scripts |
| `knip.json` (nouveau) | Configuration |
| `.github/workflows/weekly-maintenance.yml` (113) | Job Knip |
| `AGENTS.md`, documentation CI | Procédure de nettoyage |

## 5. Impacts UI / domaine / application / infrastructure

Aucun (le nettoyage éventuel est porté par des PR distinctes).

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Branche jetable avec dépendance inutilisée ; revue du rapport initial.

## 8. Non-régression

Chaque PR de nettoyage passe la CI complète (dont E2E).

## 9. Rollback / désactivation

Désactiver le job ; revert d'une PR de nettoyage.

## 10. Documentation à mettre à jour avec l'implémentation

`AGENTS.md` (commande et règles RM-01 à RM-03), `CONTRIBUTING.md`, documentation CI (128).
