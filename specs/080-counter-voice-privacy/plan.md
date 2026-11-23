# Plan — 080 Voix — confidentialité (UE, mip_opt_out, information)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.
> Spec validée le 2026-11-23 ; étapes 1-3 et 6 livrées (commit `013e775`), étapes 4-5 (UE) en attente de T005.

## 1. Lecture de l'existant
`src/features/x01/voice/voiceConfig.ts:19-35`, `deepgramConnectionManager.ts:27-43` (client SDK), `lib/deepgramToken.ts:6,19`, `vite.config.ts` (route locale), `public/_headers:2` (CSP), `components/match/MatchSettingsModal.tsx:86-103`, `src/features/x01/voice/VoiceScoringControl.tsx`, `README.md:24`, `SECURITY.md`.

## 2. Approche retenue (et alternatives écartées)
Fiche au premier appui (pas au setup) + options de confidentialité du fournisseur. Écartés : bandeau permanent (bruit visuel) ; consentement à l'ouverture de l'app (étape ajoutée au parcours de base).

## 3. Étapes
1. **Lot 0** : ajouter `mip_opt_out` (test de configuration) et le test « aucun prénom ».
2. Fiche d'information (composant), mémorisation versionnée, branchement avant `getUserMedia`.
3. Lien « En savoir plus » dans les réglages du match.
4. Vérification en preview : jeton + endpoint UE ; question tarifaire au fournisseur.
5. (Si Q1 = UE) environnement SDK personnalisé, CSP, route locale et route de jeton alignées.
6. Documentation (README, `SECURITY.md`, page dédiée).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/x01/voice/voiceConfig.ts` | `mip_opt_out`, hôte UE |
| `src/features/x01/voice/deepgramConnectionManager.ts` | environnement personnalisé |
| `lib/deepgramToken.ts`, `vite.config.ts` | hôte du grant (si nécessaire) |
| `public/_headers` | CSP `connect-src` UE |
| `src/features/x01/voice/VoicePrivacyNotice.tsx` (nouveau), `VoiceScoringControl.tsx` | fiche, garde |
| `components/match/MatchSettingsModal.tsx` | lien |
| `README.md`, `SECURITY.md`, `docs/` (page voix) | documentation |

## 5. Impacts UI / domaine / application / infrastructure
UI : fiche et lien. Infrastructure : options de connexion. Domaine : aucun.

## 6. Stratégie de migration
Clé locale nouvelle ; utilisateurs existants voient la fiche une fois.

## 7. Stratégie de test
Unitaires (configuration, absence de prénom), composants (fiche, mémorisation, refus), E2E simulé, contrôle manuel en preview de l'endpoint UE.

## 8. Non-régression
Parcours vocal, keypad, CSP, tests de route de jeton.

## 9. Rollback / désactivation
Retour à l'endpoint US par constante (si l'UE échoue) ; `mip_opt_out` sans rollback prévu.

## 10. Documentation à mettre à jour avec l'implémentation
`README.md`, `SECURITY.md`, page « Voix et confidentialité », `docs/specifications.md` (§ Voice Architecture).
