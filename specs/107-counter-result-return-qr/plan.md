# Plan — 107 Retour du résultat d'un match lié par QR code

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison de V2-QR-01 (092).

## 1. Lecture de l'existant
- `src/features/external-match/externalMatchLink.ts:438-462` (`buildExternalReturnUrl`), inchangé.
- `App.tsx:270-288` (URL revalidées, `leaveForPartner`, `statsExternalReturn`), `App.tsx:202-209` (navigation).
- `views/StatsView.tsx` (prop `externalReturn`).
- `src/presentation/externalMatch/externalMatchLabels.fr.ts`.
- Composant `QrCode` et port `QrEncoder` de la spec 092.

## 2. Approche retenue (et alternatives écartées)
Panneau de présentation affichant la même URL. Écartés : nouveau paramètre de contrat (inutile), relais serveur (contraire à la frontière), lecture caméra (hors périmètre).

## 3. Étapes
1. Étendre le type de `externalReturn` (`{ host, onReturn, qrText, onConfirmTransmitted }`).
2. Créer `components/external-match/ExternalResultQrPanel.tsx` (QR via `QrCode`, domaine, lien copiable, avertissement, « Résultat transmis », « Fermer »).
3. Ajouter dans `App.tsx` `confirmResultTransmitted` : `setExternalMatch(null)`, `setExternalLeaveRequest(null)`, `flushAppSessionPersistence()`, retour à la sélection de jeu.
4. Ajouter les libellés dans `externalMatchLabels.fr.ts`.
5. Tests composants, puis E2E.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `views/StatsView.tsx` | Action secondaire, ouverture du panneau |
| `components/external-match/ExternalResultQrPanel.tsx` (nouveau) | Présentation |
| `App.tsx` | Gestionnaire `confirmResultTransmitted` |
| `src/presentation/externalMatch/externalMatchLabels.fr.ts` | Libellés |
| `tests/unit/components/externalResultQrPanel.test.tsx` (nouveau), `tests/unit/components/statsViews.test.tsx` | Tests |
| `tests/e2e/external-match-link.smoke.spec.ts` | Scénarios AC-05, AC-06 |
| `docs/integration/external-match-link.md` | Section « Retour par QR code » |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement ; domaine et application inchangés ; infrastructure : consommation du port QR de 092.

## 6. Stratégie de migration
Aucune : pas de nouveau champ persistant, contrat `v=1` inchangé.

## 7. Stratégie de test
- Composants avec encodeur simulé (égalité stricte du texte encodé avec l'URL du bouton).
- E2E Chromium : panneau, confirmation, absence de navigation et de requêtes externes.
- Terrain : scan sur deux téléphones avec le simulateur partenaire servi en local.
- Couverture : nouveaux composants couverts selon la spec 029.

## 8. Non-régression
Tests `tests/unit/externalMatch/*`, tests golden V2-INT-01, E2E du lien existants.

## 9. Rollback / désactivation
Revert du commit ; aucune donnée à migrer. Option : masquer l'action par une constante de présentation si un partenaire signale un problème.

## 10. Documentation à mettre à jour
Guide partenaire (retour par QR, page de retour utilisable sur un autre appareil), README « Intégrations partenaires », note de version de la version qui livre la fonctionnalité.
