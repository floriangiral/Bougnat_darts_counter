# Constitution Locale - Bougnat_darts_counter

Reference transverse:
- `/home/e103350/projects/perso/.specify-workspace/constitution.transverse.md`

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

1. La logique de jeu pure doit rester separable de React et de Supabase.
2. Les vues ne doivent pas concentrer durablement orchestration, persistence et domaine.
3. Les adapters Supabase/backend doivent etre explicites et bornes par use case.
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
