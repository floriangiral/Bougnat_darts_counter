# Plan — 091 Étude : multi-écrans, Google Cast, Presentation API

> Plan d'exécution de l'étude proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` et livraison du relais 087. Les PoC vivent dans une branche jetable.

## 1. Lecture de l'existant

- `public/_headers:2` (CSP : aucun domaine Google).
- Relais et appairage : specs 087 (plafond 20 spectateurs), 088 (3 TV).
- Fenêtre secondaire et Window Management API : spec 085.
- `../.specify-workspace/constitution.transverse.md:59,134` (supervision/live côté backend).

## 2. Approche retenue (et alternatives écartées)

Trois PoC courts (A multi-écrans, B Presentation API, C Cast seulement sur demande) avec critères de sortie chiffrés. Écarté : spécifier directement Cast ou le mur multi-cibles sans preuve de valeur.

## 3. Étapes

1. Confirmer avec le PO les questions 1, 3 et 5.
2. PoC-A sur la préproduction de 087 : 20 spectateurs simulés, 2 h, renouvellement du lien.
3. PoC-B : adaptateur `PresentationPublisher` jetable, écran HDMI et Chromecast.
4. PoC-C uniquement si un lieu équipé en fait la demande.
5. Rédiger la recommandation arbitrée et, selon décision, les specs fonctionnelles et la note BDT.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `specs/091-*/spec.md` | Recommandation arbitrée |
| Nouvelles specs (numéros attribués par le coordinateur) | Création si retenues |
| Branche PoC jetable | Adaptateurs d'essai (non fusionnés) |

## 5. Impacts UI / domaine / application / infrastructure

Aucun dans la branche principale pendant l'étude.

## 6. Stratégie de migration

Sans objet.

## 7. Stratégie de test

Mesures PoC : requêtes facturées, latence p95, stabilité 30 min à 2 h, compatibilité par navigateur.

## 8. Non-régression

Aucune modification de la branche principale.

## 9. Rollback / désactivation

Suppression des branches et appareils de test enregistrés (Cast).

## 10. Documentation à mettre à jour avec l'implémentation

Replis (« Caster l'onglet », AirPlay, HDMI miroir) dans le guide TV (037) ; note au backlog BDT si le mur multi-cibles lui est confié.
