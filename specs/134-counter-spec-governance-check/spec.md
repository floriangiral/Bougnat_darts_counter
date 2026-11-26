---
id: 134-counter-spec-governance-check
v2_id: V2-SDD-03
titre: Contrôle de cohérence des specs et de leur index
type: gouvernance
statut: a-valider
validation: en-attente
origine: Documentation
famille: gouvernance
priorite: P1
difficulte: S
recommandation: recommande
lot: 1
poids: 45
depend_de: [V2-SDD-01]
remplace: []
remplacee_par: []
issue: '#355'
verifie_au_commit: 288f6b4
derniere_revue: 2026-11-26
---

# 134 — Contrôle de cohérence des specs et de leur index

> **Statut : À VALIDER.** Le principe d'un contrôle en lot 1 est accepté depuis la spec 032 Q2 ; ce contrat technique est une proposition distincte. Ne pas l'implémenter avant validation explicite.

## 1. Origine et contexte
Reprise de T008 de la [spec 032](../032-counter-sdd-conventions-v2/spec.md) et de #214 dans une cible dédiée au lot 1 (#355).

## 2. Problématique
L'index et les en-têtes peuvent diverger sans diagnostic automatique. Une correction de suivi ne doit pas nécessiter de comparer manuellement toutes les lignes.

## 3. Objectifs
Détecter les écarts locaux avec une commande déterministe, en lecture seule et sans accès réseau.

## 4. État actuel vérifié dans le code
- `.specify/conventions.md`, §4 règle 6 : contrôle décidé en principe, non livré.
- `package.json`, scripts : aucune commande `governance:specs`.
- `specs/README.md` : une spec historique peut aussi figurer dans une famille V2 ; 032 porte deux suivis, V2-SDD-01 et V2-SDD-02. Ces références multiples ne sont pas des doublons d'identifiant de dossier.

## 5. Comportement cible
`npm run governance:specs` valide les specs locales et leur index ; il affiche chaque erreur avec son fichier et sa règle, puis échoue si une erreur existe. Le dépôt n'est jamais réécrit.

## 6. Périmètre
### Inclus
Identifiants de dossiers et en-têtes, valeurs des métadonnées, fichiers obligatoires, liens Markdown locaux et correspondance des statuts dans l'index.
### Exclu
GitHub, statuts de CI, validation métier, liens distants, vérification des fragments d'URL, génération automatique et migration silencieuse des specs.

## 7. User stories
- En tant que contributeur, je veux un diagnostic local avant de pousser un statut incohérent.
- En tant que mainteneur, je veux contrôler les conventions sans attribuer de décision au product owner.

## 8. Règles métier
- RM-01 Un seul dossier porte un numéro ; son `id` correspond au nom du dossier.
- RM-02 Les valeurs autorisées viennent des conventions adoptées ; aucun état d'implémentation ne vaut validation d'une révision V2.
- RM-03 L'index peut référencer plusieurs fois une même spec, mais chaque statut affiché doit correspondre à l'en-tête.
- RM-04 Aucun contrôle ne valide, ne clôture ni ne corrige automatiquement une spec.

## 9. Parcours utilisateurs
Modifier une spec → lancer la commande → corriger les diagnostics → relancer → soumettre la PR.

## 10. Exigences fonctionnelles
- FR-01 Vérifier unicité des numéros, correspondance `id`/dossier et présence dans l'index.
- FR-02 Vérifier les métadonnées selon le périmètre historique/V2 décidé en Q1, ainsi que `spec.md`, `plan.md` et `tasks.md` lorsque requis.
- FR-03 Vérifier chaque statut de l'index et les cibles des liens Markdown relatifs vers fichiers ou dossiers ; ignorer les URL distantes et les fragments.
- FR-04 Fournir un résultat stable, trié par fichier et règle, et un code de sortie non nul sur erreur de lecture ou de conformité.

## 11. Exigences non fonctionnelles
Pas de dépendance runtime, de réseau ni d'écriture. Toute dépendance de développement éventuelle doit être justifiée dans le plan avant ajout.

## 12. Cas nominaux et alternatifs
Dépôt conforme : succès. Plusieurs erreurs : diagnostics regroupés, sans arrêt au premier écart de conformité.

## 13. Cas limites
Specs retirées conservées, références multiples dans l'index, alias V2 supplémentaires, liens relatifs avec fragments, historique sans les champs propres à la V2.

## 14. Gestion des erreurs
En-tête absent ou illisible, lien local cassé, statut inconnu ou divergence d'index : erreur explicite. Aucun fichier illisible n'est silencieusement ignoré.

## 15. Impacts architecturaux
Outillage de contribution uniquement, sans import dans l'application. L'intégration CI fera l'objet d'une PR dédiée avec justification et revue du mainteneur.

## 16. Impacts sur les données et les interfaces
Nouvelle commande uniquement après livraison ; aucune migration de session ni modification de contrat partenaire.

## 17. Compatibilité avec l'existant
Le contrôle conserve les conventions historiques adoptées et les références multiples légitimes. Tout écart existant sera corrigé ou soumis au product owner, jamais couvert par une exception implicite.

## 18. Dépendances
Conventions adoptées dans 032 ; aucun prérequis fonctionnel dans l'application.

## 19. Critères d'acceptation
- AC-01 Un ensemble conforme, incluant une spec référencée deux fois, réussit sans écriture.
- AC-02 Numéro dupliqué, `id` incohérent, champ requis absent et statut inconnu produisent chacun un diagnostic précis et un échec.
- AC-03 Une spec absente de l'index, un statut divergent et un lien local cassé sont détectés ; une URL distante n'est pas interrogée.
- AC-04 Un fichier illisible échoue explicitement ; plusieurs écarts sont affichés dans un ordre stable.
- AC-05 La commande, ses limites et sa place en CI sont documentées ; les seuils et protections existants ne sont pas affaiblis.

## 20. Scénarios de tests
Tests unitaires sur fixtures locales conformes et invalides, puis exécution sur le dépôt. Aucun E2E navigateur nécessaire.

## 21. Exigences de non-régression
`governance:coverage` reste indépendant et doit toujours réussir. Aucun fichier contrôlé n'est modifié.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Faux positifs sur l'historique | Moyen | Moyenne | Distinguer les champs historiques et V2, tester les références multiples |
| Écarts anciens masqués | Moyen | Moyenne | Pas d'exception automatique ; correction ou arbitrage documenté |

## 23. Décisions architecturales
Pas d'ADR nécessaire pour ce contrôle local. Pas de nouvelle bibliothèque de parsing choisie à ce stade.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Métadonnées de l'historique 001–031 ? | Schéma historique adopté / conversion intégrale | Respecter le schéma historique ; schéma commun complet pour la V2 | À valider |
| Q2 | Intégration CI initiale ? | Commande seule / commande et contrôle bloquant | Après recette locale, contrôle bloquant dans une PR CI dédiée ; pas de dérogation implicite | À valider |

## 25. Traçabilité
#355 reprend T008 de 032 et #214 ; décision de principe du 23 novembre 2026, cadrage technique proposé le 26 novembre. La clôture de #214 ne valide pas cette proposition.
