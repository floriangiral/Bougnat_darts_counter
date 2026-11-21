# Constitution Locale - Bougnat_darts_counter

Reference transverse:
- constitution transverse du workspace multi-repos (`.specify-workspace/constitution.transverse.md`, hors de ce depot). Principes repris ici : source de verite tournoi dans `Bougnat_Darts_Tournaments`, scoring critique par commandes/evenements explicites, offline-first pragmatique, contrats explicites entre repos.
- conventions SDD : [`.specify/conventions.md`](../conventions.md)

Principes produit non negociables : gratuite, absence de publicite, aucun compte obligatoire, parcours de base simple (ouvrir, choisir un jeu, saisir les prenoms, jouer), acces navigateur.

Version: 1.0.0
Statut: active

## Mission locale

Ce repo porte:

- le moteur de jeu pur reutilisable;
- l'UX de scoring;
- les experiences joueur/social si maintenues;
- les adapters client.

Il ne doit pas devenir la source de verite metier du tournoi.

## Regles locales

1. La logique de jeu pure doit rester separable de React et de tout adapter externe.
2. Les vues ne doivent pas concentrer durablement orchestration, persistence et domaine.
3. Les adapters backend/tiers doivent etre explicites et bornes par use case.
4. Le mode scoring critique ne doit pas reposer sur une sync libre de document mutable.
5. Toute evolution vers offline-first doit expliciter:
   - store local;
   - queue d'operations;
   - mapping contrat backend;
   - mode degrade.

## Quand specifier ici

Spec locale requise pour:

- refactor structurel `App.tsx` / vues majeures / adapters;
- extraction du domaine de scoring;
- introduction de store offline/sync;
- separation des modes client.
