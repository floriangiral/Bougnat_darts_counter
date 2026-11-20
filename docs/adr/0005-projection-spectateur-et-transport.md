---
id: ADR-0005
titre: Projection spectateur versionnée et transports de diffusion
statut: proposee
date: 2026-11-20
specs_liees: [083, 084, 085, 087, 088]
---

# ADR-0005 — Projection spectateur et transports

## Statut
Proposée. La partie « relais distant » dépend d'un arbitrage du product owner (spec 083).

## Contexte
- Rien n'existe pour la diffusion (`src/features/x01/session/useSharedX01Session.ts:11-20` est un no-op, port `SyncRepository` vide).
- CSP : `connect-src 'self'` + Deepgram + Cloudflare Insights (`public/_headers:2`).
- Cloudflare Pages ne peut pas héberger de Durable Object mais peut consommer celui d'un Worker séparé.

## Décision proposée
- Le contrôleur (tablette/téléphone/PC) est l'**unique source de vérité et l'unique écrivain**. Il calcule une **projection spectateur** par jeu (aucune règle côté TV) et l'envoie **complète**, avec `schemaVersion`, `sessionGeneration` et `seq` monotone. Correction = nouvel envoi ; reconnexion = dernier état. Le chrono est dérivé à l'affichage et ne déclenche pas d'envoi.
- Transport 1 (MVP, sans serveur) : fenêtre secondaire même appareil via `BroadcastChannel` (HDMI, hors ligne).
- Transport 2 (si autorisé) : relais Worker + Durable Object (hibernation WebSocket), lien spectateur en lecture seule distinct du droit de contrôle, TTL, minimisation des prénoms **avant** envoi, aucun stockage durable.
- Compléments ultérieurs : Presentation API, Google Cast ; repli : recopie d'écran.

## Conséquences
Pas de duplication des règles ; TV locale gratuite ; relais ≈ 0 € (quota gratuit) à ~5,3 $/mois (plan payant) selon la charge, à mesurer. Risques : navigateurs TV anciens (Chromium 85-108) vs Tailwind 4 (ADR-0006/spec 018), mono-écrivain, RGPD.
