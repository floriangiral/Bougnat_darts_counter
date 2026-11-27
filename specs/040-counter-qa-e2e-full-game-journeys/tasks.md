# Tâches — 040 Parcours E2E complets par jeu (partie, annulation, rechargement)

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) ; noter l'état de 010 (V2-ARCH-06) par jeu
- [ ] T001 Vérifier que les E2E locaux sont autonomes (008) ou documenter le contournement temporaire

## Implémentation
- [ ] T002 Ajouter les `data-testid` aux claviers Killer et Gotcha sans changement visuel (AC-06)
- [ ] T003 Créer les objets de page des 6 jeux (AC-01)
- [ ] T004 Parcours complet X01 avec annulation, victoire, statistiques, revanche (AC-01, AC-02)
- [ ] T005 Parcours complets Cricket, Capital, Killer, Gotcha (AC-01, AC-02)
- [ ] T006 Parcours Triathlon (par phase + complet) (AC-01, AC-02)
- [ ] T007 Parcours de rechargement : X01 actif, 5 autres en `fixme` « attend 010 » (AC-03)
- [ ] T008 Renommer `completion.smoke`, fusionner `navigation.smoke`, retirer le slug fantôme (AC-04)
- [ ] T009 Remplacer le sélecteur `'main button'` de `smartphone-layout.smoke.spec.ts` (AC-06)

## Tests
- [ ] T010 10 exécutions consécutives sans échec ni « flaky » sur `chromium` (AC-05)
- [ ] T011 Mesurer et consigner la durée par parcours et totale (NFR-01)

## Documentation et clôture
- [ ] T012 Documenter objets de page et convention `// Spec:` dans le guide de test
- [ ] T013 Signaler à 029 la preuve E2E disponible par vue exclue
- [ ] T014 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue ; rouvrir une tâche par `fixme` restant


## Reliquats reçus à la clôture des recettes (2026-11-27)

Sources : [031](../031-counter-pwa-static-delivery/spec.md#clôture-2026-11-27), [133](../133-counter-x01-quick-last-format/spec.md#clôture-2026-11-27). Les tâches non livrées décrites dans leurs clôtures sont désormais suivies ici, sans les déclarer exécutées. La recette du produit en production a été confirmée par le product owner ; elle ne valide ni cette proposition ni ses nouveaux outils. Le statut reste `a-valider`.
