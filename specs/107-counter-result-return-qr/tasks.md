# Tâches — 107 Retour du résultat d'un match lié par QR code

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que V2-QR-01 (092) est livrée, que V2-INT-01 (030) est close et que Q1 à Q4 sont tranchées

## Implémentation
- [ ] T001 Étendre le type de la prop `externalReturn` de `views/StatsView.tsx` (AC-01, AC-02)
- [ ] T002 Créer `components/external-match/ExternalResultQrPanel.tsx` avec `QrCode` (`partner-result`), domaine, lien copiable, avertissement (AC-01)
- [ ] T003 Ajouter `confirmResultTransmitted` dans `App.tsx` (AC-05)
- [ ] T004 Conserver le dialogue « Résultat non envoyé » tant que la transmission n'est pas confirmée (AC-04)
- [ ] T005 Ajouter les libellés dans `externalMatchLabels.fr.ts`

## Tests
- [ ] T006 Tests de composants `externalResultQrPanel.test.tsx` et `statsViews.test.tsx` (AC-01 à AC-04)
- [ ] T007 Scénarios E2E dans `external-match-link.smoke.spec.ts` (AC-05, AC-06)
- [ ] T008 Essai terrain : scan iPhone et Android avec le simulateur partenaire (AC-07)

## Documentation et clôture
- [ ] T009 Mettre à jour le guide partenaire et le README
- [ ] T010 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
