# Tâches — 085 TV locale (fenêtre secondaire, HDMI, hors ligne)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que 084 (V2-TV-02) est livrée ; aucune dépendance à 083
- [ ] T001 Vérifier en préproduction que Pages sert `/tv` → `tv.html` (sinon réécriture `_redirects`)

## Implémentation
- [ ] T002 Entrée Vite `tv.html` + `src/tv/main.tsx` sans import du contrôleur (AC-06)
- [ ] T003 `LocalChannelPublisher` : génération, `snapshot`, `presence` 10 s, `end`, réponse à `hello` (AC-01, AC-03, AC-08)
- [ ] T004 `LocalChannelSubscriber` : rejet des générations inférieures, états attente / absent / terminé (AC-04, AC-05)
- [ ] T005 Mono-écrivain : arrêt et message sur l'ancien contrôleur (AC-04)
- [ ] T006 Icône « Diffuser », feuille de choix, indicateur « TV ●/○ », « Arrêter la diffusion » (AC-01, AC-08)
- [ ] T007 Masquage si `BroadcastChannel` absent (AC-07)
- [ ] T008 Placement progressif via `getScreenDetails` ; consigne manuelle sinon
- [ ] T009 Drapeau `VITE_ENABLE_TV_LOCAL` (contrat d'environnement, validation)

## Tests
- [ ] T010 Tests unitaires des adaptateurs (canal simulé)
- [ ] T011 E2E Playwright deux pages : saisie, 180, rechargement, deux contrôleurs, hors ligne (AC-01 à AC-05)
- [ ] T012 E2E : modules chargés par `/tv?local=1` (AC-06) et navigateur sans `BroadcastChannel` (AC-07)
- [ ] T013 Mesure INP avant/après sur le contrôleur

## Documentation et clôture
- [ ] T014 Mettre à jour `docs/architecture.md` et fournir la matière du guide V2-DOC-05 (037)
- [ ] T015 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
