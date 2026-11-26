# Tâches proposées — 056 Frontières de couches

> Aucune tâche d'implémentation n'est engagée. À exécuter uniquement après validation de [la spec](spec.md), avec les arbitrages et dépendances indiqués dans le [plan](plan.md).

## Préalables

- [ ] T000 Obtenir la validation de 056 et les décisions Q1 à Q10 ; vérifier le statut de 039 et les caractérisations disponibles avant tout déplacement de moteur (AC-06).
- [ ] T001 Convenir avec 057 et 058, elles-mêmes à valider avant leur implémentation, du socle, de la propriété des moteurs et du jalon de bascule X01 ; éviter toute dépendance de clôture circulaire (AC-04, AC-06).

## Matrice et contrôle

- [ ] T002 Inventorier les arêtes actuelles de production, notamment `shared → features/domain/utils/lib`, `features → app`, `infrastructure → features/utils`, UI → domaine et les imports des moteurs legacy ; rédiger la matrice selon Q2/Q6 (AC-01).
- [ ] T003 Prototyper puis mettre en place le contrôle choisi, avec résolution des chemins et politique pour les syntaxes non résolubles ; démontrer ses limites plutôt que supposer que `no-restricted-imports` couvre tout (AC-01, AC-02).
- [ ] T004 Recenser les exceptions par arête avec motif et responsable/spec ; tester le cliquet sur ajout, substitution et autre cible du même fichier, et tracer séparément la revue de la référence (AC-03).

## Migration conditionnelle

- [ ] T005 Selon Q5, séparer primitives, contrat de session et réexports ; résoudre les cycles de types connus et conserver la compatibilité des exports et de la reprise (AC-05, AC-07).
- [ ] T006 Traiter les imports `features → app` de valeurs et de types, ainsi que les dépendances des adaptateurs aux modèles de features ; préserver modes d'accès, thème, réglages, format rapide et consentement vocal (AC-01, AC-07).
- [ ] T007 Selon Q8 et après les caractérisations 039, traiter Cricket, Capital et Triathlon par responsabilité ; ne pas déplacer le calculateur Triathlon tel quel dans `domain` (AC-06).
- [ ] T008 Étudier et, si retenu, déplacer les helpers partagés `formatDuration` et `getOrderedPlayersAndStarter` sans confondre leur usage multi-jeux avec la rotation X01 de manches/sets (AC-06, AC-08).
- [ ] T009 Après décision Q1 et la bascule 057 le cas échéant, retirer ou rebrancher uniquement le modèle et les use cases historiques ; transférer les vérifications utiles et préserver checkout, ouverture, trop et totaux réalisables actifs (AC-04).
- [ ] T010 Selon Q9 et en coordination avec 084, traiter le stub `useSharedX01Session` et `SyncRepository` sans supprimer le port actif `SessionRepository` ; vérifier les appels et leur chronologie (AC-07, AC-08).
- [ ] T011 Selon Q3, conserver ou retirer les écrans non rendus en préservant la reconnaissance et la normalisation des valeurs historiques de session (AC-07).
- [ ] T012 Retirer les seuls réexports devenus inutiles, vérifier les exceptions restantes et ajuster la garde des anciens chemins uniquement si nécessaire (AC-03, AC-06).

## Vérification

- [ ] T013 Tester les imports/export de valeurs et types, requêtes de type `import(...)`, imports dynamiques, alias, profondeurs relatives, réexports indirects, `require` et cibles calculées ; exercer les règles sur un chemin de production (AC-01, AC-02).
- [ ] T014 Rejouer les tests de règles et de reprise concernés, notamment les tests mixtes de `scoringDomain`, X01/robot, rotation et places, Cricket, Capital, golden Triathlon, undo et partenaire, sans retirer ni affaiblir leurs invariants (AC-04, AC-06, AC-07).
- [ ] T015 Exécuter les contrôles locaux listés en AC-08 et mesurer le coût du lint ; obtenir les résultats E2E/smoke **uniquement en CI**, jamais sur un serveur ou navigateur local (AC-08).

## Documentation et clôture futures

- [ ] T016 Après livraison, actualiser la carte réelle et les décisions dans `docs/architecture.md` et `AGENTS.md` ; décider si une ADR dédiée est nécessaire (AC-09).
- [ ] T017 Une fois tous les critères retenus vérifiés et les dépendances résolues, documenter les preuves et renseigner le commit de vérification avant toute transition de statut autorisée (AC-01 à AC-09).
