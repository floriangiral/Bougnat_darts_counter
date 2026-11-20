# Plan — 099 Étude : stockage serveur des thèmes (code court)

> Plan d'étude proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. Recommandation actuelle : déconseillé en V2 ; aucune implémentation n'est planifiée.

## 1. Lecture de l'existant
- `functions/api/deepgram/` et `public/_routes.json:3` : seul code serveur.
- `CONTRIBUTING.md:9` : principe « pas de backend métier ».
- `public/_headers:2` : CSP `connect-src`.
- Spec 096 : partage sans serveur (prérequis).

## 2. Approche retenue (et alternatives écartées)
Étude différée, conditionnée par des retours terrain après 096. Si réouverture : PoC de l'option C (éphémère) avant toute option B (stockage durable). Écartées : option D (ouverture CSP à des origines arbitraires) et option E (sous-traitant, compte tiers).

## 3. Étapes
1. Après livraison de 096 : collecter les retours des lieux pilotes (questionnaire, échanges directs).
2. Comparer au seuil de réouverture (Q2).
3. Si seuil atteint et 087 livrée : PoC option C (branche d'essai, sans déploiement en production).
4. Rédiger l'ADR de frontière serveur (avec 083) et, si retenue, une spec fonctionnelle.
5. Sinon : clôturer l'étude (statut `cloturee`, recommandation maintenue).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| Aucun fichier applicatif | Étude seulement |
| `docs/adr/NNNN-frontiere-serveur-partage.md` | Nouveau, si réouverture |
| `specs/NNN-…` | Nouvelle spec, si option retenue |

## 5. Impacts UI / domaine / application / infrastructure
Aucun pendant l'étude.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Sans objet pendant l'étude ; une éventuelle option C n'introduit aucune donnée persistée.

## 7. Stratégie de test
PoC : mesures de requêtes, taux d'échec, temps de transfert ; aucun test ajouté au repo principal.

## 8. Non-régression
Sans objet (aucun changement applicatif).

## 9. Rollback / désactivation (feature flag le cas échéant)
Sans objet ; une éventuelle fonctionnalité serait optionnelle et désactivable sans effet sur le jeu.

## 10. Documentation à mettre à jour avec l'implémentation
Compte rendu de l'étude dans la spec (section décisions) ; ADR si réouverture.
