# Plan — 067 Animations et prefers-reduced-motion

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `animate-in fade-in` : `components/ui/ChangelogModal.tsx:11`, `views/CapitalGameView.tsx:144`, `views/MatchView.tsx:664`, `:679`, `:772`, `views/CricketGameView.tsx:247`.
- `animate-pulse` : `components/game/CheckoutHint.tsx:14`, `components/game/PlayerScore.tsx:110`, `views/CapitalGameView.tsx:233`, `src/features/x01/voice/VoiceScoringControl.tsx:61`.
- `src/styles/tailwind.css` : aucune règle de mouvement.

## 2. Approche retenue (et alternatives écartées)
CSS natif (`@keyframes`, `@theme --animate-*`, media query globale). Écartée : `tailwindcss-animate`/`tw-animate-css` (dépendance pour un seul fondu).

## 3. Étapes
1. Ajouter les tokens de durée/easing (fichier de tokens V2-DS-01).
2. Déclarer `--animate-fade-in` et `@keyframes` dans la feuille ; remplacer les 6 usages.
3. Ajouter la règle globale `@media (prefers-reduced-motion: reduce)`.
4. Remplacer les 4 `animate-pulse` continus par une impulsion à l'apparition (utilité `animate-pulse-once`).
5. Remplacer les `transition-all` triviaux par des transitions ciblées.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/styles/tokens/primitives.css` | Tokens de mouvement |
| `src/styles/tailwind.css` | `@keyframes`, utilités, règle globale |
| 6 fichiers `animate-in` | Utilité native |
| `CheckoutHint.tsx`, `PlayerScore.tsx`, `CapitalGameView.tsx`, `VoiceScoringControl.tsx` | Impulsion unique |
| `tests/e2e/` (nouveau test `motion.spec.ts`) | `reducedMotion` |

## 5. Impacts UI / domaine / application / infrastructure
UI uniquement.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Sans objet.

## 7. Stratégie de test
E2E Playwright avec `reducedMotion: 'reduce'` et sans ; test unitaire de présence de la règle.

## 8. Non-régression
Spec 020 (INP), tests de présentation X01/Capital.

## 9. Rollback / désactivation
Revert de la PR ; la règle globale peut être retirée seule.

## 10. Documentation à mettre à jour avec l'implémentation
Guide des rôles (tokens de mouvement), notes de release (accessibilité).
