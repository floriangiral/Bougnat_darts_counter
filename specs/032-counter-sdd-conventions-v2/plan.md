# Plan — 032 Conventions SDD v2

## 1. Lecture de l'existant
`specs/README.md`, `.specify/templates/*`, en-têtes hétérogènes des specs 001-031, `scripts/validate-sonar-coverage.mjs` (seul lecteur automatique d'une spec).

## 2. Approche retenue
Conventions écrites dans `.specify/conventions.md`, gabarits enrichis, en-têtes ajoutés sans réécrire l'historique, index régénéré depuis le catalogue V2. Alternative écartée : migration complète du contenu des specs historiques (coût élevé, faible valeur).

## 3. Étapes
1. Conventions et gabarits (fait dans la PR `docs/v2-specs`, validé le 2026-11-23).
2. En-têtes des specs 001-031 avec statut réel et traitement proposé (fait, validé le 2026-11-23).
3. Fiches 012/024 (fait).
4. Index `specs/README.md` (fait).
5. Après validation : traitement des clôtures (V2-SDD-02, fait le 2026-11-23, spec §26-27) ; contrôle CI `governance:specs` reporté au lot 1 (Q2).

## 4. Fichiers impactés
`.specify/conventions.md`, `.specify/templates/*`, `.specify/memory/constitution.md`, `specs/*/spec.md` (en-têtes), `specs/README.md`.

## 7. Stratégie de test
`npm run governance:coverage` ; relecture de l'index.

## 9. Rollback
Retirer l'en-tête YAML des specs (aucun impact sur le code).
