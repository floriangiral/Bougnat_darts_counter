# Plan — 059 Journal de partie append-only

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- Annulation X01 : `views/MatchView.tsx:123,297-345` ; autres jeux : piles de vue (spec §4).
- `undoTurn` incomplet : `src/application/scoring/matchLifecycle.ts:293-316`.
- Types : `types.ts:27-33` (`Turn` sans identifiant) ; `src/shared/ids/createId.ts`.
- Persistance : enveloppe définie par la spec 010.

## 2. Approche retenue (et alternatives écartées)
- Retenue : journal typé + rejeu par le reducer du jeu + instantané par manche (ADR-0004 option 2).
- Écartées : persister la pile d'états (pas de correction, taille élevée) ; event sourcing complet (disproportionné).

## 3. Étapes
1. Mesurer le coût de rejeu sur fixtures (outil de bench en test) pour fixer Q4.
2. Définir les types d'entrées X01 et la fonction `replay` (domaine).
3. Étendre `useGameSession` (spec 058) : ajout d'entrées, instantané, `Undone`.
4. Persister journal + instantané dans l'enveloppe de la spec 010 (nouvelle `schemaVersion`, migration sans journal).
5. Interface de correction X01 (liste des volées de la manche, ressaisie, confirmation RM-02).
6. Annulation depuis l'écran de victoire X01 (`views/MatchView.tsx:771-786`).
7. Étendre l'annulation persistante aux autres jeux migrés.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/domain/x01/journal.ts` (puis un fichier par jeu) | Création |
| `src/app/useGameSession.ts` | Journal, instantané, annulation |
| `src/shared/session/persistedAppSession.ts` | Champ `journal` dans l'enveloppe (spec 010) |
| `views/MatchView.tsx`, `components/match/*` | Correction, annulation depuis la victoire |
| `src/features/external-match/*` | Résultat calculé depuis l'état final validé (vérification) |

## 5. Impacts UI / domaine / application / infrastructure
UI : écran de correction X01 et bouton « Retour » sur la victoire. Domaine : types d'entrées et rejeu. Application : hook. Infrastructure : taille d'enveloppe accrue (bornée).

## 6. Stratégie de migration (données, sessions persistées, contrats)
Nouvelle `schemaVersion` (spec 010) ; une session sans journal est reprise avec un journal vide (annulation limitée aux nouvelles volées). Contrat `v=1` inchangé.

## 7. Stratégie de test
Propriété « rejeu = état » sur fixtures 039 ; unitaires d'annulation/correction ; composant ; E2E reload + annulation ; bench de rejeu.

## 8. Non-régression
Golden tests 039 ; E2E X01 et partenaire ; comportement de « Retour » sur la saisie en cours.

## 9. Rollback / désactivation
Feature flag `VITE_ENABLE_GAME_JOURNAL` (proposition) : désactivé, l'annulation revient à la pile en mémoire ; le champ `journal` persisté est ignoré.

## 10. Documentation à mettre à jour avec l'implémentation
`docs/architecture.md` (journal), guide utilisateur (correction d'une volée, spec 037), ADR-0004 (statut).
