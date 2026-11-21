# Plan — 076 Voix — mode partie mains libres

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Pipeline et contrôleur issus des specs 003 et 075 (`src/application/voice/`, `src/infrastructure/voice/DeepgramRecognizer.ts`).
- `components/match/MatchSettingsModal.tsx:86-103` (réglage voix), `views/MatchView.tsx:108,162` (état non persisté), `:219-223` (reset par volée).
- `src/features/x01/voice/audioContextManager.ts` (capture), `public/pcmCaptureWorklet.js`.

## 2. Approche retenue (et alternatives écartées)
Mode « continu » du même contrôleur : un état `armed` (micro ouvert, VAD actif, pas de flux) qui passe en `listening` sur détection de parole. Écartés : streaming permanent (coût ×10), mot d'activation (faux positifs, licences), écoute du fournisseur seule sans VAD local (coût).

## 3. Étapes
1. Port `VoiceActivityPort` + adaptateur VAD (Q2) ; mesure CPU sur la tablette de référence.
2. États `armed`/`paused` dans le contrôleur ; micro conservé ; pré-roll alimenté par le VAD.
3. Réglage par match (et persistance Q4) dans `MatchSettingsModal` ; écran d'information (spec 080).
4. Modes de confirmation A et B ; garde de configuration pour C.
5. Pause automatique, Wake Lock, indicateur micro permanent.
6. Plafond par match ; réaction aux refus `budget`/`disabled` (spec 006).
7. Semi-duplex avec le service audio de la spec 077 (si livrée).
8. Compteurs locaux ; campagne terrain (spec 074).
9. (Si Q1 = C validée) compte à rebours annulable + amendement de la spec 003.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/application/voice/VoiceSessionController.ts` | états `armed`, `paused`, plafond |
| `src/application/voice/ports.ts` | `VoiceActivityPort` |
| `src/infrastructure/voice/{SileroVad,EnergyVad}.ts` | nouveaux (selon Q2) |
| `src/infrastructure/device/screenWakeLock.ts` | nouveau |
| `components/match/MatchSettingsModal.tsx`, `views/MatchView.tsx`, `components/match/MatchInputBar.tsx` | réglage, indicateur, anneau |
| `package.json` | dépendance VAD si Q2 = Silero (taille à mesurer) |

## 5. Impacts UI / domaine / application / infrastructure
UI : réglage, indicateur, bannière. Domaine : aucun. Application : états du contrôleur. Infrastructure : VAD, Wake Lock.

## 6. Stratégie de migration
Préférence nouvelle (clé locale versionnée) si Q4 ; aucune autre donnée.

## 7. Stratégie de test
Unitaires (contrôleur continu, plafond, garde du mode C), E2E simulé (VAD et moteur factices), terrain (salon, club, bar ; matrice spec 042), mesure du coût sur 5 parties.

## 8. Non-régression
Mode annonce par défaut inchangé ; suites voix, keypad, robot, Triathlon.

## 9. Rollback / désactivation
Option masquée par constante de configuration ; plafond à 0 = mode désactivé ; coupure serveur (spec 006).

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur voix (spec 037), `docs/specifications.md`, page confidentialité (spec 080), notes de release ; jamais avant la livraison.
