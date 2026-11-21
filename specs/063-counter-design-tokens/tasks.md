# Tâches — 063 Design tokens (socle unique Dark/Light/club/TV)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (`statut: validee`) et que V2-DS-00 (018) et V2-QA-05 (041) sont levées — décision du PO du 2026-11-20 : recommandations appliquées ; V2-DS-00 (018) et V2-QA-05 (041) non levées, écart assumé
- [x] T001 Reporter dans la spec la décision de format (Q1) et de normalisation (Q2)

## Implémentation
- [x] T002 Créer `src/styles/tokens/primitives.css` en hex/rgb (AC-06)
- [x] T003 Créer `src/styles/tokens/themes.css` avec les rôles Dark (AC-01) — rôles Dark et Light
- [ ] T004 Créer `src/styles/tokens/components.css` (bouton primaire, touche, carte de score) (AC-01) — non créé : composants sur les rôles, variantes dans `components/ui/buttonStyles.ts`
- [x] T005 Créer `src/styles/tokens/tailwind-bridge.css` (`@theme inline`, `@custom-variant`) (AC-01) — `src/styles/tokens/bridge.css` ; `@custom-variant` dans `tailwind.css`
- [x] T006 Importer les tokens dans `src/styles/tailwind.css`, tokeniser l.207, 266, 425 (AC-02)
- [x] T007 `index.html` : `data-theme="dark"`, supprimer le style inline du `body` (AC-01, AC-05)
- [x] T008 Ajouter le cliquet de classes brutes dans `scripts/guard-clean-codebase.sh` (AC-03) — `scripts/design-tokens/check.mjs`

## Tests
- [x] T009 Tests unitaires de structure des tokens (rôles présents, formats) (AC-01, AC-06)
- [x] T010 Tests du cliquet sur fixtures (AC-03)
- [ ] T011 Rejouer les captures V2-QA-05 et corriger jusqu'à tolérance (AC-02) — captures à produire par V2-QA-05 (spec 041)
- [x] T012 Recherche `dark:` = 0 dans le code (AC-04) — 0 occurrence

## Documentation et clôture
- [x] T013 Finaliser ADR 0006 et le guide des rôles ; règle « pas de couleur brute » dans `CONTRIBUTING.md` — ADR 0006 acceptée, `docs/design-system.md` publié, règle ajoutée
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue — spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer

## Suivi d'implémentation (2026-11-20)

Socle livré sur `feat/v2.0.0` (issue #227) ; vérifiée au commit `24dbbab`. Restent ouverts : levée des préalables 018/041 (T000) et captures (T011), fichier de tokens de composants non retenu (T004), validation par le product owner et clôture de l'issue (T014).
