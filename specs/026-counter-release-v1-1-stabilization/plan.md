# Plan - Spec 026

## Phase 1 - Realigner la base develop

1. Integrer sur `develop` tous les commits valides de `release/1.0.2`
2. Supprimer les faux contrats d integration hors scope open source
3. Verifier qu aucun couplage runtime obligatoire au systeme tournoi ne subsiste

## Phase 2 - Aligner version, docs et traçabilite

1. Passer la version package en `1.1.0`
2. Mettre a jour README, architecture, scope produit, guide technique et contributing
3. Publier `docs/release/v1.1.md` et `docs/release/v1.1-coverage-map.md`
4. Actualiser l accueil public et le changelog utilisateur sur `v1.1`
5. Realigner milestone et issue de pilotage release

## Phase 3 - Gouverner la release

1. Executer `npm run ci:check` sur `develop`
2. Creer et pousser `release/1.1`
3. Rejouer les validations release sur `release/1.1`
4. Poser le tag `v1.1`
5. Ouvrir la PR `release/1.1 -> main`
6. Realigner `develop` apres la stabilisation release