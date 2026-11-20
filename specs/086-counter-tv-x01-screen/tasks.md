# Tâches — 086 Interface TV X01

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`), que 084 est livrée et que les tokens de 063 sont disponibles
- [ ] T001 Obtenir la décision de baseline TV (018) et du thème TV par défaut (H.17)

## Implémentation
- [ ] T002 Script de génération des tokens TV en hex (AC-08)
- [ ] T003 Feuille `tv.css` 16:9, zone sûre, tailles en `vh` (AC-01)
- [ ] T004 Lint de la feuille TV (propriétés interdites) branché dans `ci:check` (AC-06)
- [ ] T005 Panneaux de camp, en-tête, chrono local, joueur actif couleur + flèche + texte (AC-01, AC-02)
- [ ] T006 Checkout conditionné à `checkoutHint` (AC-05)
- [ ] T007 File de temps forts par identifiant, badge « Correction » (AC-03, AC-04)
- [ ] T008 Interstitiels de leg/set, écran de victoire
- [ ] T009 Bannières de connexion et écran « Mettez à jour cet écran »
- [ ] T010 Mouvement réduit (AC-07) ; plein écran, curseur masqué, Wake Lock détecté
- [ ] T011 Emplacement de la mention Bougnat (AC-09)

## Tests
- [ ] T012 Tests de composants sur fixtures (simple, doublette, sets, bot, Open, noms longs)
- [ ] T013 Captures de référence 720p/1080p/2160p et émulation Chromium ancien (AC-06)
- [ ] T014 Contrastes et axe (AC-08)
- [ ] T015 Mesures DOM des tailles (AC-01) et capture désaturée (AC-02)

## Documentation et clôture
- [ ] T016 Fournir captures et textes au guide V2-DOC-05 (037) ; mettre à jour `docs/architecture.md`
- [ ] T017 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
