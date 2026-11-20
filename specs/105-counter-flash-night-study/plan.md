# Plan — 105 Étude : « Soirée éclair » (mini-tournoi local)

> Plan de conduite de l'étude. Il ne s'exécute qu'après passage de la spec au statut `validee`. L'étude ne modifie pas le code du compteur.

## 1. Lecture de l'existant

- Frontière compteur : `docs/product-scope.md:17-26`, `:54-65` ; `CONTRIBUTING.md:26-33`.
- Frontière BDT (commit `0028fc4`) : `docs/09-open-source-boundary.md:19`, `:39` ; `docs/02-functional-scope.md:12-15`.
- Contrat de lien : `specs/030-counter-external-match-link/spec.md`, `src/features/external-match/externalMatchLink.ts`, `App.tsx:91`.
- Cadrage inter-dépôts : V2-INT-07 (109).

## 2. Approche retenue (et alternatives écartées)

- Retenue : trancher la frontière d'abord (atelier + ADR), puis seulement prototyper l'option choisie.
- Écartée : prototyper un tableau dans le compteur avant décision (créerait un fait accompli contraire aux textes de frontière).

## 3. Étapes

1. Préparer un dossier de décision : textes de frontière, options A à E, besoins des lieux (rapport 09).
2. Atelier product owner + responsable BDT ; décision sur Q1 et Q6.
3. Rédiger l'ADR « Frontière mini-tournoi local » (`docs/adr/`) et le faire référencer côté BDT.
4. Selon la décision :
   - D : transmettre le besoin à BDT (spec côté BDT) et à V2-INT-07 (109) ;
   - C : PoC application séparée (tableau 8 joueurs, match X01 via 030, reprise) hors dépôt compteur ;
   - B (dérogation) : rédiger la spec compteur avec bornes strictes.
5. Maquette et pilote terrain (sur autorisation).
6. Synthèse et clôture de l'étude.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `specs/105-counter-flash-night-study/spec.md` | Résultats, décision |
| `docs/adr/` (nouvel ADR) | Frontière mini-tournoi local |
| Dépôt BDT (hors périmètre de ce plan) | Référence à l'ADR, éventuelle spec « format éclair » |
| `docs/product-scope.md` (après décision) | Précision de la frontière |

## 5. Impacts UI / domaine / application / infrastructure

- Aucun pendant l'étude. Cible B ou C : domaine pur de tableau (tirage, avancement, forfaits) isolé des règles de scoring ; D : aucun impact compteur hors contrat 109.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Sans objet pendant l'étude. Besoins éventuels sur 030 (`v=2`) transmis à V2-INT-05 (108).

## 7. Stratégie de test

- PoC C : test de bout en bout manuel (8 joueurs, 7 matchs, rechargement à mi-soirée).
- Maquette : temps de mise en route mesuré avec un organisateur.

## 8. Non-régression

- Sans objet (aucun changement du compteur pendant l'étude).

## 9. Rollback / désactivation (feature flag le cas échéant)

- Sans objet ; le PoC reste hors dépôt principal.

## 10. Documentation à mettre à jour avec l'implémentation

- ADR, `docs/product-scope.md`, feuille de route V2, statut de l'étude (`cloturee` après arbitrage et création des suites).
