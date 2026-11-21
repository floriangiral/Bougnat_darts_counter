# Tâches — 101 « Mes parties » : historique local

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que les questions Q1, Q2 et Q8 sont tranchées et que l'état de 010 (V2-ARCH-06) est connu

## Implémentation
- [ ] T001 Ajouter `GameHistorySummary` et `schemaVersion` optionnels à `LocalGameHistoryEntry` (AC-09)
- [ ] T002 Écrire la projection pure `toHistorySummary` pour X01, Cricket, Capital, Triathlon, Killer, Gotcha, avec lecture tolérante (AC-03, AC-09)
- [ ] T003 Créer le port `GameHistoryRepository` et les cas d'usage `listGameHistory`, `deleteGameHistoryEntry`, `clearGameHistory` (AC-06, AC-07, AC-08)
- [ ] T004 Implémenter `remove`, `clear` et le plafond N dans IndexedDB et le repli localStorage (AC-06, AC-07, AC-08)
- [ ] T005 Enrichir l'écriture dans `src/app/useGameLifecycle.ts` (summary, schemaVersion, identifiant unique, mention match lié) (AC-02, AC-03)
- [ ] T006 Créer `views/HistoryView.tsx` (liste, état vide, détail, dialogues) et l'écran `HISTORY` (AC-01, AC-02, AC-04)
- [ ] T007 Ajouter le bouton « Mes parties » au pied de `views/HomeView.tsx` (AC-01, AC-10)
- [ ] T008 Brancher « Rejouer avec ces joueurs » sur le pré-remplissage du setup (AC-05)

## Tests
- [ ] T010 Tests unitaires : projection (6 jeux), lecture tolérante, plafond, suppression, identifiant unique (AC-03, AC-06, AC-07, AC-09)
- [ ] T011 Tests de composants `HistoryView` (AC-01, AC-04)
- [ ] T012 Tests E2E Chromium + WebKit : AC-02, AC-05, AC-07, AC-08 ; parcours de base inchangé (AC-10)
- [ ] T013 Contrôle d'accessibilité (axe si V2-QA-05 disponible) (AC-11)
- [ ] T014 Mesure terrain : ouverture de la liste avec 100 entrées sur tablette de référence (NFR-01)

## Documentation et clôture
- [ ] T020 Mettre à jour `docs/product-scope.md`, `README.md`, changelog in-app et notes de release (mention du plafond)
- [ ] T021 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
