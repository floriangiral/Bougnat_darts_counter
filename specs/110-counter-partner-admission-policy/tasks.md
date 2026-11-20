# Tâches — 110 Politique d'admission, de compatibilité et de révocation des partenaires

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, que V2-INT-01 (030) est close et que Q1 à Q5 sont tranchées

## Rédaction
- [ ] T001 Rédiger la politique (critères, procédure, compatibilité, révocation) dans le guide partenaire (AC-01, AC-05)
- [ ] T002 Créer le registre `docs/integration/partners.md` avec badarts.fr (AC-02)
- [ ] T003 Créer le gabarit `.github/ISSUE_TEMPLATE/partner-request.yml` (AC-03)
- [ ] T004 Lier politique et registre depuis le README (AC-01)

## Vérification
- [ ] T005 Exercice de révocation en préprod avec une origine fictive, durée consignée (AC-04)
- [ ] T006 Optionnel (Q4) : contrôle de cohérence registre ↔ `wrangler.jsonc` et ses tests

## Clôture
- [ ] T007 Si Q1 = obligatoire : proposer à badarts.fr un délai de mise en conformité, via un contact autorisé par le product owner
- [ ] T008 Passer la spec à `cloturee` (règle appliquée) et fermer l'issue
