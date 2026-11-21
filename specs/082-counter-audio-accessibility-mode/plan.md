# Plan — 082 Mode accessibilité audio

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
`components/game/Keypad.tsx`, `components/match/MatchInputBar.tsx`, `components/match/MatchStatusPill.tsx:47`, `components/game/CheckoutHint.tsx`, `src/features/smartphone/RotateToPortraitOverlay.tsx`, service audio et caller (spec 077), contrôleur vocal (spec 075), mode mains libres (spec 076).

## 2. Approche retenue (et alternatives écartées)
Profil qui combine des briques existantes + corrections ARIA. Écartés : interface séparée « accessible » (double maintenance) ; information exclusivement sonore.

## 3. Étapes
1. Audit lecteur d'écran du parcours X01 (VoiceOver, TalkBack) et liste des corrections.
2. Corrections ARIA (noms, ordre de focus, régions live) du pavé et de la barre d'entrée.
3. Réglage « Accessibilité audio » (préférence locale) qui active 076 et 077 en profil complet.
4. Intentions d'information (spec 075) et réponses formatées (spec 077).
5. Relecture vocale de la proposition avant confirmation.
6. Tests utilisateurs concernés, itération, puis seulement communication.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `components/game/Keypad.tsx`, `components/match/MatchInputBar.tsx` | ARIA, focus |
| `components/game/CheckoutHint.tsx` | libellé FR, exposition |
| `src/application/caller/frenchAnnouncer.ts` (spec 077) | profil complet, réponses |
| `src/features/x01/voice/x01VoiceGrammar.ts` (spec 075) | intentions d'information |
| Réglages (accueil et match) | réglage dédié |

## 5. Impacts UI / domaine / application / infrastructure
UI : ARIA, réglage. Application : intentions et réponses. Domaine : aucun.

## 6. Stratégie de migration
Préférence nouvelle, clé versionnée.

## 7. Stratégie de test
Unitaires, composants (régions live), axe (spec 041), protocole manuel lecteur d'écran, tests utilisateurs.

## 8. Non-régression
Pavé, raccourcis, voix et caller standards.

## 9. Rollback / désactivation
Réglage masquable par constante ; corrections ARIA conservées (bénéfice général).

## 10. Documentation à mettre à jour avec l'implémentation
Guide utilisateur « Jouer sans voir l'écran » (spec 037), déclaration d'accessibilité.
