---
id: ADR-0004
titre: Journal de partie append-only
statut: proposee
date: 2026-11-20
specs_liees: [059, 058, 109]
---

# ADR-0004 — Journal de partie append-only

## Statut
Proposée (priorité P2, après ADR-0001).

## Contexte
L'annulation restaure un état complet en mémoire ; elle est perdue au rechargement et ne traverse pas proprement les fins de manche. La constitution transverse demande des commandes/événements explicites pour le scoring critique.

## Options
1. Pile d'états complets (actuel).
2. **Journal de commandes numérotées (séquence monotone) rejouable par le reducer de l'ADR-0001**, avec snapshot périodique.
3. Event sourcing complet avec projections multiples.

## Décision proposée
Option 2, sans en faire un prérequis de la TV (ADR-0005) : le journal sert l'annulation persistante, la correction d'une volée passée et l'alignement futur avec BDT. Granularité (volée ou fléchette) à trancher avant de figer le format.
