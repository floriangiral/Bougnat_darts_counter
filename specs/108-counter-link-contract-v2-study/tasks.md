# Tâches — 108 Étude : contrat de lien partenaire v=2

> À exécuter uniquement après validation de la spec et confirmation d'un besoin par 106.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que V2-INT-02 (106) est close et qu'un besoin non couvert par `v=1` est confirmé

## Étude
- [ ] T001 Lister les besoins confirmés (jeux, ouvreur, volées, libellé, identifiants)
- [ ] T002 PoC `window.opener.postMessage` sur une branche jetable (Chromium, WebKit, Firefox, avec et sans `noopener`)
- [ ] T003 Mesurer la taille d'un détail de volées encodé pour 3, 5 et 7 manches
- [ ] T004 Évaluer la dépendance de Cricket à V2-ARCH-04 (058)
- [ ] T005 Rédiger `decision.md` (tableau Q1 à Q8, projet de contrat, coexistence avec `v=1`)
- [ ] T006 Vérifier avec 110 la durée de support de `v=1` et la communication aux partenaires
- [ ] T007 Supprimer la branche jetable du PoC

## Clôture
- [ ] T008 Soumettre les décisions D1 à D5 au product owner
- [ ] T009 Si retenu : créer la spec fonctionnelle `v=2` et le projet d'ADR complémentaire à ADR-0009
- [ ] T010 Passer l'étude à `cloturee` et fermer l'issue
