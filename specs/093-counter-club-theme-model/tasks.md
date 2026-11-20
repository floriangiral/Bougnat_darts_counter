# Tâches — 093 Modèle de thème club

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que 063 (V2-DS-01) et 066 (V2-DS-04) sont livrées
- [ ] T001 Trancher Q1 à Q5 et figer la liste des tokens surchargeables avec 063/066

## Implémentation
- [ ] T002 `colorMath.ts` : contraste WCAG, OKLab, ΔE, clamp (AC-01, AC-04)
- [ ] T003 `themeDescriptor.ts` : schéma v1, liste blanche, nettoyage des textes, couleurs `#rrggbb` (AC-02, AC-03, AC-05)
- [ ] T004 `deriveThemeTokens.ts` : dérivations, `ensureContrast`, règle `game-active` (AC-01, AC-04)
- [ ] T005 `presets.ts` : presets officiels (AC-07)
- [ ] T006 `themeDom.ts` et `themeStorage.ts` : application, `theme-color`, persistance, repli (AC-06)

## Tests
- [ ] T007 Tests unitaires de validation et d'injection (AC-02, AC-03, AC-05)
- [ ] T008 Tests de matrice de contraste sombre/clair et tests à graines aléatoires (AC-01, AC-07)
- [ ] T009 Test E2E : descripteur corrompu → démarrage et partie possibles (AC-06)

## Documentation et clôture
- [ ] T010 Rédiger l'ADR « thème = surcharge de tokens dérivés » et la page d'architecture
- [ ] T011 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
