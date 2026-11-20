# Plan — 062 Étude : point d'entrée de score agnostique

> Plan d'étude proposé. Il ne s'exécute qu'après passage de l'étude au statut `validee` et autorisation de prise de contact.

## 1. Lecture de l'existant
- Chemins de saisie : `views/MatchView.tsx:347-500` (keypad, RESTE, checkout), `src/application/x01Bot/x01BotTurn.ts:128-155` (robot), voix `views/MatchView.tsx:187-209`.
- Modèle par volée : `types.ts:27-33`.
- CSP : `public/_headers:2`.
- Commande unique à venir : spec 057.

## 2. Approche retenue (et alternatives écartées)
- Retenue : étude documentaire puis PoC isolé hors application, sans modifier le code produit.
- Écartées : développement direct d'un adaptateur (inconnues non levées) ; auto-scoring maison (XL).

## 3. Étapes
1. Vérifier que la spec 057 expose une `source` extensible (relecture, pas de code).
2. Préparer le questionnaire fournisseur (transport, authentification, licence, coût, CORS, hors ligne).
3. Contact Scolia (après autorisation, via le programme de la spec 112).
4. PoC sur une page locale isolée (hors `src/`), avec événements simulés puis réels si accès.
5. Rédiger la note de faisabilité et la recommandation finale.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `specs/062-counter-score-input-agnostic-study/` | Note de faisabilité, résultats |
| Aucun fichier applicatif | Le PoC reste hors du code livré |

## 5. Impacts UI / domaine / application / infrastructure
Aucun pendant l'étude.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Sans objet.

## 7. Stratégie de test
Mesures du PoC (latence, corrections, hors ligne) consignées dans la note.

## 8. Non-régression
Sans objet (aucun code livré).

## 9. Rollback / désactivation
Sans objet.

## 10. Documentation à mettre à jour avec l'implémentation
Si retenue : nouvelle spec fonctionnelle, ADR « nouveau canal d'entrée », mise à jour d'ADR-0009 si un port devient justifié.
