# Plan — 078 Étude : moteurs vocaux sur l'appareil

> Plan de l'étude. Il ne s'exécute qu'après passage de la spec au statut `validee`. Aucun code de PoC n'est fusionné dans `main`.

## 1. Lecture de l'existant
`src/features/x01/voice/audioContextManager.ts`, `voicePcm.ts`, `voiceConfig.ts` ; port de reconnaissance de la spec 075 ; banc et corpus de la spec 074 ; `public/_headers:2` (CSP).

## 2. Approche retenue (et alternatives écartées)
PoC mesurés derrière le port, sur le même corpus que Deepgram. Écarté : choix sur documentation seule (non mesurable) ; intégration directe en production.

## 3. Étapes
1. Re-vérifier les sources (versions navigateur, tailles, licences) et dater les relevés.
2. Adaptateur PoC O1 (Web Speech sur l'appareil) ; adaptateur PoC O3 (Moonshine-tiny-fr via transformers.js).
3. Passage du banc 074 sur O0, O1, O3 ; mesures CPU/mémoire/batterie sur 3 appareils.
4. Mesure de chargement et de mise en cache des modèles.
5. Rédaction du rapport et de la recommandation ; amendement proposé de l'ADR 0008.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| Branche `poc/voice-on-device` (hors `main`) | adaptateurs PoC |
| `docs/v2/` ou dossier de spec | rapport d'étude |
| `docs/adr/0008-port-de-reconnaissance-vocale.md` | amendement proposé (après décision) |

## 5. Impacts UI / domaine / application / infrastructure
Aucun en production pendant l'étude.

## 6. Stratégie de migration
Sans objet (étude).

## 7. Stratégie de test
Mesures reproductibles via le banc 074 ; rapports horodatés avec commit et versions de navigateur.

## 8. Non-régression
Aucun changement en production.

## 9. Rollback / désactivation
Suppression de la branche de PoC.

## 10. Documentation à mettre à jour avec l'implémentation
Rapport d'étude ; si retenu, nouvelle spec et ADR 0008 amendée.
