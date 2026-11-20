# Tâches — 037 Guides utilisateur V2 (voix, TV, thèmes, station)

> À exécuter uniquement après validation de la spec. Chaque tâche guide n'est lancée que lorsque la fonctionnalité correspondante est implémentée. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée, obtenir les décisions Q1 à Q4 et l'emplacement des guides (V2-DOC-02, 035)

## Implémentation
- [ ] T001 Créer le gabarit de guide (FR-01)
- [ ] T002 Scénario Playwright de captures, hors suite bloquante (AC-04)
- [ ] T003 Guide mode Light et thèmes — à la livraison de V2-THEME-01 (068) (AC-01)
- [ ] T004 Guide TV locale — à la livraison de V2-TV-04 (085) (AC-01, AC-03)
- [ ] T005 Guide voix mains libres — à la livraison de V2-VOICE-05 (076) (AC-01, AC-03)
- [ ] T006 Guide éditeur de thème et co-branding — à la livraison de V2-BRAND-02 (094) (AC-01)
- [ ] T007 Guide station de club — à la livraison de V2-STATION-01 (100) (AC-01, AC-03)
- [ ] T008 Si Q1 = oui : guide court de l'existant (voix X01, installation, tablette)
- [ ] T009 Section « Guides » du `README.md`, limitée aux guides publiés (AC-02)

## Tests
- [ ] T010 Test unitaire : formulations du guide voix reconnues par le parseur (AC-05)
- [ ] T011 Tests utilisateurs (3 personnes) par signature avant production (AC-03)

## Documentation et clôture
- [ ] T012 Passer la spec à `implementee` quand les cinq guides sont publiés, renseigner `verifie_au_commit`, fermer l'issue
