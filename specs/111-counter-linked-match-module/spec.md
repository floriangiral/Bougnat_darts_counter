---
id: 111-counter-linked-match-module
v2_id: V2-INT-03
titre: Module neutre « match lié » (extraction au deuxième canal)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: integrations
priorite: P3
difficulte: M
recommandation: optionnel
lot: 5
poids: 3
depend_de: [V2-INT-05]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 111 — Module neutre « match lié » (extraction au deuxième canal)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
> **Déclencheur :** cette spec ne s'implémente que lorsqu'un deuxième canal partenaire est **accepté** par le product owner (107, `v=2` issu de 108, ou adaptateur BDT issu de 109). Sans deuxième canal, elle reste en attente.

## 1. Origine et contexte
Recommandation architecturale (rapport 08 §5.1 option B, §5.2 point 3 ; rapport 02 §6.3 ; compte rendu V2 §C.9 « pas de port d'intégration générique avant un 2ᵉ canal », §C.10). Le module `externalMatchLink.ts` est un adaptateur entrant et sortant propre et pur, mais il mélange plusieurs responsabilités et son contexte persistant est propre au X01.

## 2. Problématique
Ajouter un deuxième canal (QR, ouvreur, BDT) ou un deuxième jeu sans extraction obligerait à dupliquer les gardes (`matchFollowsExternalLink`, TTL, politique d'origines) ou à grossir encore le module et `App.tsx`.

## 3. Objectifs
- Séparer modèle neutre, adaptateurs de contrat et orchestration, **sans aucun changement de comportement**.
- Rendre le contexte persistant extensible par jeu, en restant lisible pour les sessions existantes.
- Réduire l'état du match lié porté par `App.tsx`.

## 4. État actuel vérifié dans le code
- [vérifié] `src/features/external-match/externalMatchLink.ts` (478 l.) regroupe : entrée URL (l. 142-290), politique d'origines (l. 88-140), contexte et TTL (l. 299-350), garde d'appartenance (l. 379-400), sortie URL et statistiques (l. 402-478).
- [vérifié] `ExternalMatchConfig` est un `Pick<GameConfig>` X01 (`src/shared/session/persistedAppSession.ts:12-16`) ; le contexte n'a pas de champ `game` (l. 22-31).
- [vérifié] `App.tsx` porte 7 états dédiés au match lié (`App.tsx:91-104`) et les fonctions `leaveForPartner`, `guardExternalExit`, `getExternalLeaveNotify` (l. 279-305).
- [vérifié] La sortie dépend de `calculateDetailedStatsForTeam` (`externalMatchLink.ts:8`, `:420-428`) et de `setsWon`, muté par `finishLeg` (`src/application/scoring/matchLifecycle.ts:215-220`).

## 5. Comportement cible
Comportement observable strictement identique à `v=1`. Structure interne cible :
- `src/features/external-match/linkedMatch.ts` : modèle neutre `LinkedMatchRequest` (union discriminée par `game`), `LinkedMatchContext`, gardes d'appartenance, TTL ;
- `src/features/external-match/linkedMatchResult.ts` : `LinkedMatchResult` (statut, score, statistiques, détail optionnel) et projection depuis l'état de partie ;
- `src/features/external-match/contract/v1/inbound.ts` et `outbound.ts` : parsing et construction d'URL `v=1` ;
- `src/features/external-match/returnPolicy.ts` : politique d'origines ;
- `src/app/useLinkedMatch.ts` : orchestration extraite d'`App.tsx`.

## 6. Périmètre
### Inclus
Extraction, union discriminée du contexte avec lecture rétrocompatible, hook d'orchestration, tests.
### Exclu
Tout nouveau canal ou paramètre (portés par 107, 108, 109) ; toute règle de jeu ; toute nouvelle dépendance.

## 7. User stories
- En tant que mainteneur, je veux ajouter un canal de sortie en écrivant seulement un adaptateur, afin de ne pas dupliquer les gardes de sécurité.
- En tant que partenaire `v=1`, je veux que rien ne change, afin de ne pas modifier mon intégration.

## 8. Règles métier
- RM-01 Le résultat dérive toujours de l'état produit par le moteur ; aucun adaptateur ne recalcule une règle de jeu.
- RM-02 Les gardes (origine autorisée, appartenance du match, TTL à la restauration) s'appliquent à tous les canaux.
- RM-03 Un contexte persisté sans champ `game` est lu comme `game: 'x01'`.

## 9. Parcours utilisateurs
Identiques à la spec 030 (aucun parcours nouveau).

## 10. Exigences fonctionnelles
- FR-01 Extraire les modules du §5 sans changer les signatures publiques utilisées par les vues, ou en les réexportant le temps de la migration.
- FR-02 Introduire `LinkedMatchContext = { game: 'x01'; … }` (union ouverte) et une lecture rétrocompatible des contextes existants (RM-03).
- FR-03 Extraire `useLinkedMatch` regroupant les 7 états et les gestionnaires d'`App.tsx`.
- FR-04 Brancher la projection de résultat sur la projection spectateur (V2-TV-02 / 084) ou l'état sérialisable (V2-ARCH-04 / 058) si disponibles, sinon sur `MatchState`.

## 11. Exigences non fonctionnelles
- NFR-01 Zéro changement de comportement : tests golden V2-INT-01, tests `tests/unit/externalMatch/*`, 28 scénarios E2E verts sans modification d'attendus.
- NFR-02 Couverture des modules purs maintenue à 100 % lignes et branches (spec 029).
- NFR-03 Frontières : aucun import React ou DOM dans `linkedMatch*.ts`, `contract/**`, `returnPolicy.ts` (règle ESLint de V2-ARCH-01 / 056 si disponible).
- NFR-04 Aucune nouvelle dépendance ; coût récurrent 0 €.

## 12. Cas nominaux et alternatifs
Lien valide, lien invalide expliqué, conflit au démarrage, sortie gardée, envoi, abandon : identiques à 030.

## 13. Cas limites
- Session persistée par une version antérieure (sans `game`) : restaurée (RM-03).
- Session persistée par la nouvelle version puis lue par une ancienne (retour arrière) : le champ `game` supplémentaire est ignoré par `isExternalMatchContext` actuel [à vérifier par test].

## 14. Gestion des erreurs
Inchangée : contexte invalide ou expiré abandonné ; lien invalide expliqué.

## 15. Impacts architecturaux
Découpage en modèle neutre + adaptateurs + orchestration, conforme à [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée). Dépendances dirigées vers le modèle neutre ; le modèle neutre ne dépend que des types de jeu et des statistiques applicatives.

## 16. Impacts sur les données et les interfaces
`PersistedAppSession.externalMatch` gagne un champ `game` optionnel en lecture, écrit systématiquement. Contrat `v=1` inchangé.

## 17. Compatibilité avec l'existant
Totale pour les partenaires et les sessions existantes (RM-03, §13).

## 18. Dépendances
- V2-INT-05 (108) : décision sur `v=2` (déclencheur possible).
- Déclencheurs alternatifs : V2-INT-04 (107), V2-INT-07 (109).
- V2-INT-01 (030) : tests golden préalables.
- Liens : V2-ARCH-01 (056), V2-ARCH-04 (058), V2-TV-02 (084).

## 19. Critères d'acceptation
- AC-01 Tous les tests `tests/unit/externalMatch/*` et les tests golden passent sans modification d'attendus.
- AC-02 Les 28 scénarios E2E du lien passent sur Chromium sans modification d'attendus.
- AC-03 Une session persistée à `508dfa6` avec un contexte valide est restaurée et permet l'envoi du résultat (test unitaire de restauration).
- AC-04 `App.tsx` ne contient plus d'état propre au match lié (vérification par recherche de `useState` liés à `external`).
- AC-05 Aucun import `react` ni accès `window` dans les modules purs (lint).

## 20. Scénarios de tests
Unitaires : modules extraits, restauration rétrocompatible ; hook : tests de `useLinkedMatch` avec horloge et politique injectées ; E2E : suite existante.

## 21. Exigences de non-régression
Spec 030 intégralement (invariants 1 à 8).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Abstraction prématurée | Moyen | Élevée sans déclencheur | Déclencheur explicite |
| Régression silencieuse du résultat | Élevé | Faible | Tests golden obligatoires |
| Conflit avec le découpage d'`App.tsx` (V2-ARCH) | Moyen | Moyenne | Coordination avec 056 et 058 |

## 23. Décisions architecturales
[ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée). Aucune autre décision.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Déclencheur | 107 accepté / `v=2` accepté / adaptateur BDT accepté | Le premier des trois accepté | — |
| Q2 | Source du résultat | `MatchState` / état sérialisable 058 / projection 084 | Projection 084 si livrée, sinon `MatchState` | — |
| Q3 | Réexports transitoires | conserver / supprimer | Supprimer dans le même lot | — |

## 25. Traçabilité
Rapport 08 §2.1, §5.1 (B), §5.2, §6 (P5, P6) ; rapport 02 §6.3 ; compte rendu V2 §C.9, §C.10 ; specs 030, 107, 108, 109, 056, 058, 084.
