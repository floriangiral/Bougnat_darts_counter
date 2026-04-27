# Spec 018 - Counter iOS 12 Compatibility

## Contexte

Le compteur doit rester utilisable sur iPad Air sous iOS 12.x, sans ecran blanc ni interface degradee bloquante.

## Objectif

Fournir une compatibilite runtime + rendu + PWA minimale pour iOS 12.x, en gardant l'architecture claire entre bootstrap, infrastructure web et presentation CSS.

## Portee

- Build legacy JS pour Safari/iOS 12.
- Fallbacks CSS pour fonctions modernes non garanties:
  - `flex-gap`
  - `clamp()`
  - `backdrop-filter`
- Renforcement du bootstrap SW/PWA pour limiter les cas de cache stale.

## Exigences

### E1 - Runtime legacy

- Le build produit une variante compatible iOS 12 via pipeline legacy.
- Le chargement principal ne doit pas dependre uniquement de modules modernes non transpiles.

### E2 - Fallback CSS

- Si `flex-gap` est absent, l'espacement en layout flex reste lisible via fallback.
- Si `clamp()` est absent, les tailles critiques du branding restent proportionnees.
- Si `backdrop-filter` est absent, les surfaces lisibles conservent un fond opaque/semi-opaque.

### E3 - PWA bootstrap

- L'enregistrement SW en production force une verification d'update non bloquee par cache intermediaire.
- Les metas iOS principales restent presentes pour le mode standalone.

## Invariants

1. La detection de compatibilite web legacy est isolee dans une couche infrastructure.
2. Le bootstrap app n'embarque que l'orchestration, sans logique CSS embarquee.
3. Les fallbacks CSS s'activent via classes de capacites (`no-*`) appliquees au root document.
4. Les modifications ne cassent pas le comportement moderne existant.

## Traceabilite

- Infra web: `src/infrastructure/web/legacySupport.ts`
- Bootstrap: `index.tsx`
- Presentation fallback: `src/styles/tailwind.css`
- Build: `vite.config.ts`, `package.json`
- Tests: `tests/unit/infrastructure/legacySupport.test.ts`
