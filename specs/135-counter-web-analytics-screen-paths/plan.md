# Plan — 135 Mesure d'audience par jeu et par étape

> Proposition à exécuter uniquement après validation de la spec et de Q1 à Q5.

## 1. Lecture de l'existant
`src/app/useAppScreenHistory.ts`, `src/app/appScreens.ts`, sélection du jeu dans `App.tsx`, `index.tsx` (beacon), `public/sw.js` (repli de navigation), tests du hook d'historique et des liens partenaires.

## 2. Approche proposée
Une fonction pure (écran, jeu) → chemin dans une façade `src/features/*`, appelée par le hook d'historique. Aucune dépendance ni route serveur.

## 3. Étapes
1. Valider Q1 à Q5.
2. Écrire la fonction de dérivation et ses tests (AC-04).
3. Passer le chemin à `pushState` / `replaceState` ; normaliser le chemin au chargement (AC-01, AC-03).
4. Vérifier les liens partenaires, `?mode=`, le plein écran et la navigation arrière (AC-05).
5. Recette en préprod puis lecture de la dimension « Path » (AC-02).

## 4. Fichiers impactés
`src/app/useAppScreenHistory.ts`, nouvelle façade `src/features/…`, tests unitaires, un parcours E2E (CI), `docs/technical.md`.

## 5. Impacts UI / domaine / application / infrastructure
UI : URL visible. Domaine : aucun. Infrastructure : aucune.

## 6. Migration
Aucune donnée persistée.

## 7. Tests
Unitaires (dérivation, hook) ; E2E en CI uniquement ; recette du tableau de bord en préprod.

## 8. Non-régression
Restauration de session, navigation arrière, plein écran, mise à jour différée du service worker, liens partenaires.

## 9. Retour arrière
Revenir à `pushState` sans URL : le chemin redevient `/`, sans effet sur les parties.

## 10. Documentation
Lecture des tableaux de bord par jeu dans `docs/technical.md` ; notes de release et changelog in-app (URL visible).
