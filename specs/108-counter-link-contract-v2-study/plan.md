# Plan — 108 Étude : contrat de lien partenaire v=2

> Plan proposé. Il ne s'exécute qu'après validation de la spec et confirmation d'un besoin par V2-INT-02 (106).

## 1. Lecture de l'existant
- `src/features/external-match/externalMatchLink.ts` (entrée l. 188-290, sortie l. 404-478).
- `src/shared/session/persistedAppSession.ts:12-31` (contexte X01).
- `types.ts:28-55` (`Turn`, `LegState`, `MatchState`).
- `docs/integration/partner-simulator/index.html` (simulateur, base du PoC).

## 2. Approche retenue (et alternatives écartées)
Étude documentaire puis PoC jetable. Écartés : implémentation directe d'un `v=2` sans besoin confirmé ; signature côté client (impossible).

## 3. Étapes
1. Relire le compte rendu de 106 et lister les besoins confirmés.
2. PoC `opener` : page de test qui ouvre le compteur local avec et sans `noopener` ; mesurer la disponibilité d'`opener` par navigateur.
3. Mesurer la taille d'un détail de volées encodé (3, 5, 7 manches ; simple et double).
4. Rédiger le projet de contrat `v=2` et le tableau de décision.
5. Soumettre au product owner ; si retenu, créer la spec fonctionnelle et l'ADR complémentaire.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `specs/108-counter-link-contract-v2-study/decision.md` (nouveau) | Tableau de décision et projet de contrat |
| Branche jetable de PoC | Non fusionnée |

Aucun code applicatif fusionné.

## 5. Impacts UI / domaine / application / infrastructure
Aucun pendant l'étude.

## 6. Stratégie de migration
Sans objet ; la future spec devra décrire la coexistence `v=1`/`v=2` et l'évolution de `ExternalMatchContext` (union discriminée par `game`).

## 7. Stratégie de test
PoC manuel ; la future spec héritera des tests golden V2-INT-01.

## 8. Non-régression
Aucun changement de `v=1`.

## 9. Rollback / désactivation
Sans objet.

## 10. Documentation à mettre à jour
Aucune pendant l'étude ; le guide partenaire ne mentionne `v=2` qu'une fois livré.
