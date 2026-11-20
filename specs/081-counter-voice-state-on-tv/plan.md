# Plan — 081 Voix — état vocal affiché sur la TV

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
`views/MatchView.tsx:124,178-207` (état vocal local), `App.tsx:353-361` (remontée du snapshot), contrat et publisher de la spec 084, TV locale 085, zone réservée de la spec 086 (FR-11), contrôleur vocal de la spec 075.

## 2. Approche retenue (et alternatives écartées)
Message `voice` séparé, publié par le même port de transport, non rejoué par le relais. Écartés : intégrer l'état vocal au snapshot de partie (mélange vérité/éphémère, rejouerait une proposition périmée) ; capter la voix sur la TV (interdit par l'ADR 0005/0008).

## 3. Étapes
1. Définir le type `VoiceStateMessage` v1 dans le module de contrat de la spec 084 et son validateur.
2. Exposer l'état vocal du contrôleur (spec 075) au shell ; publication coalescée.
3. Relais (si livré) : ne pas conserver `voice` comme dernier état.
4. Composant TV `VoiceStateBadge` dans la zone réservée de la spec 086 ; expiration.
5. Réglage côté contrôleur.
6. Tests et mesure de latence en local.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/shared/broadcast/*` (module de contrat de la spec 084) | type et validateur `voice` |
| Hook de publication du shell (spec 084/085) | publication de l'état vocal |
| Composants TV (spec 086) | `VoiceStateBadge` |
| Worker de relais (spec 087) | exclusion du rejeu |
| `components/match/MatchSettingsModal.tsx` | réglage |

## 5. Impacts UI / domaine / application / infrastructure
UI contrôleur : réglage. UI TV : badge. Application : publication. Domaine : aucun.

## 6. Stratégie de migration
Contrat additif versionné ; TV anciennes tolérantes.

## 7. Stratégie de test
Unitaires (contrat, expiration, ordre), composants TV, E2E fenêtre secondaire + faux moteur, terrain (lisibilité).

## 8. Non-régression
Tests 084-087 ; voix sur le contrôleur.

## 9. Rollback / désactivation
Réglage désactivé par défaut via constante ; la TV ignore les messages inconnus.

## 10. Documentation à mettre à jour avec l'implémentation
Guide « Diffuser sur un grand écran » et guide voix (spec 037).
