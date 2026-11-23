# Tâches — 036 Onboarding des agents IA (AGENTS.md)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée, que V2-SDD-01 (032) est clos, et obtenir les décisions Q1 à Q3 — spec et 032 validées le 2026-11-23 (« Go »), décisions Q1 à Q3 reportées au §24 ; 032 livrée dans la même PR

## Déjà réalisé dans la PR `docs/v2-specs` (à vérifier)
- [x] T001 Relire `AGENTS.md` : exactitude des versions, commandes, pièges et liens (AC-02, AC-03) — versions conformes à `package.json` et `.nvmrc` ; corrigés : statut de la release (`v2.1.0` publiée, pas de tag `v2.0.0`), emplacement de `isLegVisitLimitReached` / `resolveLegByBullOff` (`matchLifecycle.ts`), imports historiques de `src/domain` depuis les vues, jeux 180 Around the Clock et Réglages

## Implémentation
- [x] T002 Ajouter les prérequis E2E locaux (FR-02) (AC-01)
- [x] T003 Ajouter la liste d'interdits (FR-03, DSO-FR-02) et la définition de « terminé » (FR-04) (AC-01)
- [x] T004 Ajouter les règles de maintenance M-01 à M-06 dans `AGENTS.md` et `CONTRIBUTING.md` (FR-05)
- [x] T005 Corriger ou créer la cible du lien `docs/roadmap-v2.md` (AC-03) — la cible existe ; lien vérifié
- [x] T006 Ajouter la case FR-07 au modèle de PR (AC-05)
- [x] T007 Selon Q1, créer `.github/copilot-instructions.md` (renvoi)
- [x] T007b Ajouter la section « CI/CD et sécurité » (DSO-FR-01, ≤ 30 lignes) et appliquer M-01 aux nouvelles commandes (DSO-FR-03) (DSO-AC-01 : `AGENTS.md` = 130 lignes)

## Tests
- [ ] T008 Étendre `scripts/check-docs.mjs` (035) à la vérification des scripts cités + test unitaire (AC-02, DSO-AC-02) — **reportée** : `scripts/check-docs.mjs` n'existe pas encore (spec 035, V2-DOC-02, non livrée) ; à faire avec 035. Vérification manuelle du 2026-11-23 : toutes les commandes `npm run …` citées par `AGENTS.md` existent dans `package.json` et tous ses liens relatifs résolvent
- [ ] T009 Essai à blanc avec un agent sans contexte sur une spec `a-valider` (AC-04) — **non réalisé** : à mener par le product owner après fusion (consigne explicite ajoutée en §4 d'`AGENTS.md` : refuser et citer la règle)

## Documentation et clôture
- [x] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — fermeture de #217 laissée au product owner après fusion de la PR
