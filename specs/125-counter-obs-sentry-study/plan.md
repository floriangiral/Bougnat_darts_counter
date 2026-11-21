# Plan — 125 Étude Sentry

> Plan d'étude proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. Aucune donnée réelle d'utilisateur n'est envoyée pendant l'étude.

## 1. Lecture de l'existant

- `index.tsx:24-31` (beacon Cloudflare), `public/_headers:2` (CSP), `App.tsx` (absence d'`ErrorBoundary`), `docs/integration/external-match-link.md:36` (prénoms dans l'URL), `src/features/x01/voice/deepgramClient.ts` (jeton éphémère).

## 2. Approche retenue (et alternatives écartées)

Retenue : PoC Sentry (option B) sur branche d'étude et projet de test UE, en parallèle d'une spec courte pour l'`ErrorBoundary` (étape 1).
Écartées pour l'étude : options D et E (coût de maintenance) ; option C seulement si le PoC B échoue sur les bloqueurs.

## 3. Étapes

1. Opération manuelle (128) : organisation Sentry de test, région UE, stockage des IP désactivé.
2. Branche `study/sentry` : SDK chargé après le premier rendu, `beforeSend`/`beforeBreadcrumb`, version = SHA.
3. Tests de nettoyage automatisés (événement simulé contenant prénoms et URL partenaire).
4. Mesures : poids, comportement hors ligne et domaine bloqué, CSP en preprod.
5. Demande d'avis de confidentialité ; rédaction du texte d'information.
6. Rapport et décision.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| Branche d'étude : `src/infrastructure/observability/` (nouveau), `index.tsx`, `public/_headers` | PoC |
| Rapport d'étude (emplacement 128) | Nouveau document |

## 5. Impacts UI / domaine / application / infrastructure

Infrastructure seule (adaptateur d'observabilité) ; aucun import depuis le domaine.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Tests unitaires du nettoyage ; essais manuels hors ligne ; vérification visuelle des événements dans le projet de test.

## 8. Non-régression

Aucun changement sur `main` pendant l'étude.

## 9. Rollback / désactivation

Supprimer la branche et le projet de test.

## 10. Documentation à mettre à jour avec l'implémentation

Si retenue : spec fonctionnelle, information de confidentialité, `SECURITY.md`, documentation d'observabilité (128), CSP documentée dans `docs/technical.md`.
