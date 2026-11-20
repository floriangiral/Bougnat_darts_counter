# Plan — 123 Lighthouse CI

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `.github/actions/run-local-smoke/action.yml:25-53` (environnement de build CI et `vite preview`), `public/_headers`, spec 044 (budgets), spec 041 (axe).

## 2. Approche retenue (et alternatives écartées)

Retenue : `@lhci/cli` épinglé, rapports en artefact, seuils relatifs à une baseline versionnée.
Écartées : serveur LHCI (hébergement à maintenir) ; application GitHub LHCI (permissions tierces) ; PageSpeed Insights API (dépend d'une URL publique et d'une clé).

## 3. Étapes

1. Ajouter `@lhci/cli` (dépendance de développement, justification ici).
2. `lighthouserc.json` (FR-01) ; source unique des budgets de poids partagée avec 044.
3. `performance.yml` : téléchargement de `dist/`, `vite preview`, `lhci autorun`, résumé, artefacts.
4. Mode informatif ; 10 exécutions de baseline sur `main` ; calibrage.
5. Passage en bloquant (agrégateur `performance / requis`, 114).
6. Procédure de mesure preprod dans la checklist de release (033).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `package.json`, `package-lock.json` | `@lhci/cli` |
| `lighthouserc.json` (nouveau) | Configuration |
| Baseline (fichier versionné, emplacement 128) | Médianes de référence |
| `.github/workflows/performance.yml` (nouveau) | Job |
| `perf-budgets.json` (044) | Source commune |

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

PR jetables (ressource lourde, CLS) ; série de baseline.

## 8. Non-régression

Contrôles 041 et 044 conservés ; durée de PR surveillée.

## 9. Rollback / désactivation

Repasser les assertions en avertissement ; retirer le job de l'agrégateur.

## 10. Documentation à mettre à jour avec l'implémentation

Documentation CI (128), `CONTRIBUTING.md` (relèvement de budget), checklist de release (033).
