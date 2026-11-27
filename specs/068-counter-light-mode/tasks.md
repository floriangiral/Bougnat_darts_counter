# Tâches — 068 Mode Light

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [x] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-03 (065) et V2-THEME-02 (069) sont livrées — décision du PO du 2026-11-20 : recommandations appliquées ; 065 et 069 livrées dans le même chantier
- [x] T001 Reporter les décisions Q1 à Q3

## Implémentation
- [ ] T002 Prototype de palette sur 4 écrans et validation PO (AC-03) — maquette non produite ; validation sur les captures de la PR (Q3)
- [x] T003 Valeurs `light` de tous les rôles et `game-*` (AC-01)
- [x] T004 Fonction pure de contraste (AC-01) — calcul de contraste dans `themeContrast.test.ts`
- [x] T005 Remplacer les lueurs résiduelles servant d'indice d'état (AC-05) — lueurs → anneaux en clair
- [x] T006 Barre d'état iOS et `theme-color` en clair (AC-03) — spec 069
- [x] T007 Activer le drapeau Light quand le registre DS-03 est à 100 % (AC-04) — `LIGHT_THEME_ENABLED = true`

## Tests
- [x] T008 Test de matrice de contraste Dark + Light (AC-01)
- [ ] T009 axe-core en `colorScheme: 'light'` sur tous les écrans (AC-02) — dépend de V2-QA-05 (spec 041)
- [ ] T010 Captures Light de référence ; captures Dark inchangées (AC-03, AC-06) — captures à produire par V2-QA-05 et à valider par le PO
- [x] T011 Test terrain tablette en salle éclairée — validée le 27/11/2026 ; preuve et limites dans [spec.md](spec.md#clôture-2026-11-27).

## Documentation et clôture
- [x] T012 Guide utilisateur, notes de release, README — README, notes v2.0.0, `docs/design-system.md` ; pas de guide utilisateur dédié
- [x] T013 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — commit `24dbbab`, issue #242 fermée

## Suivi d'implémentation (2026-11-20)

Mode Light livré et activé sur `feat/v2.0.0`, vérifié au commit `24dbbab` ; #242 est fermée. Restent la validation visuelle par le PO (T002, T010), axe-core (T009) et le test terrain (T011), suivis dans #354.


## Bilan de clôture (2026-11-27)

Recette du périmètre livré validée par le product owner ; preuves et transferts détaillés dans [spec.md](spec.md#clôture-2026-11-27). Les tâches non cochées ci-dessus sont conservées pour la traçabilité et ne sont pas déclarées exécutées.
Reliquats suivis par [V2-QA-05](../041-counter-qa-accessibility-visual-regression/spec.md) ; leurs propositions restent à arbitrer avant implémentation.
