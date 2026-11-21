# Plan — 083 Étude : diffusion TV et frontière serveur

> Plan d'exécution de l'étude proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. Aucune ligne de code applicatif n'est livrée par cette étude : les PoC vivent dans une branche jetable.

## 1. Lecture de l'existant

- Shell et état X01 : `App.tsx:110,171-199,355-360`, `views/MatchView.tsx:81,92-96,211-217`.
- Mutation du moteur : `src/application/scoring/matchLifecycle.ts:215-231,259-290`, appels `src/features/x01/scoring/matchSubmission.ts:63,96`.
- Chrono : `src/features/x01/hooks/useMatchTimer.ts:25-34`.
- Infrastructure : `wrangler.jsonc`, `public/_headers:2`, `public/_routes.json`, `functions/api/deepgram/token.ts:15-17,97`, `scripts/validate-wrangler-config.mjs`.
- Gouvernance : `CONTRIBUTING.md:9,28`, `docs/product-scope.md:19,26`, `docs/architecture.md:165`, `specs/030-counter-external-match-link/spec.md:110-114`.

## 2. Approche retenue (et alternatives écartées)

Étude documentaire déjà menée (rapport 07) + trois PoC ciblés qui lèvent les seules incertitudes coûteuses : coût réel du relais, rendu TV ancien, mono-écrivain. Écartés : SaaS tiers (coût, sous-traitant), WebRTC (signalisation = serveur), PartyKit (fermé).

## 3. Étapes

1. Confirmer avec le PO les questions 1, 3, 4 et 5 de la spec (atelier court, compte rendu dans l'issue).
2. PoC-1 : Worker `bougnat-darts-broadcast` + DO `BroadcastRoom` (hibernation, attachement), binding depuis un projet Pages de préproduction ; simulateur de partie de 2 h (émission au changement) ; relevé du tableau de bord Cloudflare.
3. PoC-2 : page TV statique en CSS conservatrice ; rendu sur Chromium 85/87/94/108 (émulation, puis spec 090 si appareils disponibles).
4. PoC-3 : deux émetteurs, génération attribuée par le DO, rejet de l'ancienne génération ; perte d'attachement à la fermeture de la socket émettrice.
5. Rédiger l'ADR 0005 (projection spectateur et transport, frontière serveur) au format défini par V2-DOC-02 (035).
6. Rédiger la proposition d'amendement de la frontière (texte seulement, appliqué avec 087).
7. Mettre à jour 087, 088, 090 selon la décision ; clôturer l'étude.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `docs/adr/0005-*.md` | Création (après validation, via V2-DOC-02) |
| `specs/083-*/spec.md` | Recommandation arbitrée, décisions renseignées |
| `specs/087-*`, `088-*`, `090-*` | Statut et hypothèses mis à jour |
| Branche PoC jetable | Worker, DO, page TV statique (non fusionnée) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun impact dans `main` pendant l'étude. Les PoC n'importent aucun module de `src/domain` ni `src/application`.

## 6. Stratégie de migration

Sans objet : aucune donnée persistée ni contrat publié.

## 7. Stratégie de test

Mesures PoC documentées (requêtes/j, GB-s/j, latence p95, reconnexion après redéploiement) ; captures de rendu par version de Chromium.

## 8. Non-régression

Aucune modification de la branche principale ; `npm run ci:check` inchangé.

## 9. Rollback / désactivation

Suppression du Worker de PoC et de son binding de préproduction ; aucun effet sur la production.

## 10. Documentation à mettre à jour avec l'implémentation

ADR 0005 ; amendement de `CONTRIBUTING.md`, `docs/product-scope.md`, `docs/architecture.md` (porté par 087 si le relais est retenu).
