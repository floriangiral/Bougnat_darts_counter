# Décisions d'architecture (ADR)

Gabarit : [`.specify/templates/adr-template.md`](../../.specify/templates/adr-template.md). Statuts : `proposee`, `acceptee`, `rejetee`, `remplacee`.

Les ADR ci-dessous sont issues de l'audit V2 du 2026-11-20 et sont **toutes proposées** : aucune n'est acceptée tant que le product owner ne l'a pas validée.

| ADR | Titre | Statut | Specs liées |
|---|---|---|---|
| [0001](0001-etat-de-partie-serialisable-par-jeu.md) | État de partie sérialisable et reducer pur par jeu | proposée | 058, 010 |
| [0002](0002-regles-x01-uniques-et-commandes-partagees.md) | Règles X01 uniques et commandes partagées | proposée | 057, 045, 003 |
| [0003](0003-persistance-versionnee.md) | Persistance de session versionnée, validée et purgée | proposée | 010 |
| [0004](0004-journal-de-partie-append-only.md) | Journal de partie append-only | proposée | 059 |
| [0005](0005-projection-spectateur-et-transport.md) | Projection spectateur et transports de diffusion | proposée | 083, 084, 085, 087 |
| [0006](0006-design-tokens-systeme-de-themes-unique.md) | Design tokens et système de thèmes unique | proposée | 063, 068, 093 |
| [0007](0007-classes-de-taille-et-orientation.md) | Classes de taille et orientation | proposée | 070, 072, 073 |
| [0008](0008-port-de-reconnaissance-vocale.md) | Port de reconnaissance vocale | proposée | 003, 075 |
| [0009](0009-integrations-pas-de-port-generique-premature.md) | Intégrations : pas de port générique avant un deuxième canal | proposée | 030, 111 |

Les décisions historiques v1.0.1, v1.1 et v2.0 restent consignées dans [architecture.md](../architecture.md).
