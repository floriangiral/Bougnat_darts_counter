# Tâches — 087 Relais TV distant (Worker + Durable Object)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que l'étude 083 autorise le relais et que 084 est livrée
- [ ] T001 Obtenir les décisions : plan Free/Paid, dépendance Miniflare, mention « provisoire » en tournoi

## Implémentation
- [ ] T002 Worker `workers/broadcast` + DO `BroadcastRoom` (SQLite, hibernation)
- [ ] T003 Rôles, rejet des messages spectateur autres que `hello`/`ping` (AC-01)
- [ ] T004 Génération mono-écrivain attribuée par le relais, fermeture 4001 (AC-02)
- [ ] T005 Dernier snapshot dans les attachements émetteur et spectateurs (AC-03, AC-04)
- [ ] T006 Quotas taille/débit/spectateurs (AC-05)
- [ ] T007 Function `functions/api/tv/[[path]].ts` : origine, kill switch (AC-06, AC-08)
- [ ] T008 Binding DO dans `wrangler.jsonc` + `validate-wrangler-config.mjs`
- [ ] T009 Adaptateurs clients émetteur/spectateur avec reconnexion
- [ ] T010 Jetons en IndexedDB sans repli localStorage (AC-09)
- [ ] T011 CSP `wss://` par environnement
- [ ] T012 Déploiement CI du Worker et runbook

## Tests
- [ ] T013 Tests Miniflare du DO (AC-01 à AC-05)
- [ ] T014 E2E contre `wrangler dev` : diffusion, reconnexion, kill switch (AC-03, AC-08)
- [ ] T015 Simulateur de charge 2 h : requêtes facturées et écritures de stockage (AC-07)

## Documentation et clôture
- [ ] T016 Amender `CONTRIBUTING.md`, `docs/product-scope.md`, `docs/architecture.md` ; mention de confidentialité ; guide V2-DOC-05
- [ ] T017 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
