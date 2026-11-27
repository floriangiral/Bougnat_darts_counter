# Tâches — 070 Résolveur unique classes de taille et orientation

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que l'ADR 0007 est acceptée — décision du PO du 2026-11-20 : recommandations appliquées ; ADR 0007 acceptée
- [x] T001 Reporter les décisions Q1 à Q4 — décisions reportées dans la spec

## Implémentation
- [x] T002 Écrire la table de vérité en test (AC-01)
- [x] T003 Implémenter `resolveViewportClass` (pur) (AC-01)
- [x] T004 Hook `useViewportClass` avec stabilisation clavier virtuel (AC-04) — stabilisation par la hauteur de fenêtre (Q4)
- [x] T005 `App.tsx` : attributs racine + `data-layout` dérivé (AC-03, AC-05)
- [x] T006 Supprimer `isCompactBrowserMobile` de `MatchView` (AC-02)
- [x] T007 Redéfinir `dedicated_tablet` (Q1) avec V2-ARCH-12 — forçage tactile seulement ; spec 001 non modifiée
- [x] T008 Supprimer `TABLET_BREAKPOINTS`, déprécier `tabletLayout.ts` — `src/features/tablet/` supprimé

## Tests
- [x] T009 Table de vérité unitaire complète (AC-01)
- [x] T010 E2E 1080×750 tactile sans forçage → `arena` (AC-03) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).
- [x] T011 E2E rotation en partie avec saisie en cours (AC-04) — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).
- [ ] T012 Captures de non-régression téléphone/bureau (AC-05) — captures à produire par V2-QA-05 (spec 041)

## Documentation et clôture
- [x] T013 ADR 0007 finalisé, documentation d'architecture, notes de release — ADR 0007 acceptée, `docs/architecture.md`, notes v2.0.0
- [x] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — commit `24dbbab`, issue #221 fermée

## Suivi d'implémentation (2026-11-20)

Code et tests unitaires livrés sur `feat/v2.0.0` et vérifiés au commit `24dbbab` ; #221 est fermée. Restent les E2E en CI (T010, T011), captures de non-régression (T012, spec 041) et recette terrain, suivis dans #354.


## Bilan de clôture (2026-11-27)

Recette du périmètre livré validée par le product owner ; preuves et transferts détaillés dans [spec.md](spec.md#clôture-2026-11-27). Les tâches non cochées ci-dessus sont conservées pour la traçabilité et ne sont pas déclarées exécutées.
Reliquats suivis par [V2-QA-05](../041-counter-qa-accessibility-visual-regression/spec.md) ; leurs propositions restent à arbitrer avant implémentation.
