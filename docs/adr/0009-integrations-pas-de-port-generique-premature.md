---
id: ADR-0009
titre: Intégrations partenaires — pas de port générique avant un deuxième canal
statut: proposee
date: 2026-11-20
specs_liees: [030, 108, 110, 111]
---

# ADR-0009 — Pas de port d'intégration générique prématuré

## Statut
Proposée.

## Contexte
Le module `src/features/external-match/externalMatchLink.ts` (contrat d'URL `v=1`) est pur, testé et consommé par badarts.fr. Aucune autre plateforme étudiée (Darts for Windows, 3K Darts, DartConnect, La Bomabull) n'offre aujourd'hui d'API d'envoi de score documentée et autorisée.

## Décision proposée
- Figer la sémantique de `v=1` ; n'y ajouter que des paramètres optionnels compatibles.
- Ne pas créer de port d'intégration générique tant qu'un deuxième canal n'est pas accepté (spec 111).
- Aucun secret ne peut être protégé côté client. Un jeton émis et vérifié par le partenaire permet de **corréler** un résultat au match attendu (et d'en refuser les rejeux), mais il **ne certifie pas** le score saisi : la confiance dans le score reste celle accordée au scoreur.
- Les intégrations authentifiées et le suivi live en tournoi relèvent du contrat avec `Bougnat_Darts_Tournaments` (spec 109).
