# Plan — 112 Étude : programme de prises de contact avec l'écosystème fléchettes

> Plan proposé. Il ne s'exécute qu'après validation de la spec ; chaque contact exige en plus une autorisation écrite du product owner.

## 1. Lecture de l'existant
- Fiches plateformes : rapport d'audit 08 §3 (sources publiques consultées le 2026-11-20).
- Contrat et guide : spec 030, `docs/integration/external-match-link.md`.
- Valeurs : gratuité, sans publicité, sans compte obligatoire (`README.md`, compte rendu V2 §A).

## 2. Approche retenue (et alternatives écartées)
Programme séquencé (option A), après 106. Écartés : contacts simultanés ; tout essai technique sans accord de l'éditeur.

## 3. Étapes
1. Rédiger le message de présentation et le questionnaire ; validation par le product owner.
2. Pour chaque plateforme, dans l'ordre : demander l'autorisation (D1 à D3) ; relire les pages publiques le jour même ; envoyer ; relancer une fois ; clore.
3. Rédiger un compte rendu par plateforme et mettre à jour la fiche.
4. Produire la synthèse et proposer d'éventuelles specs.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `specs/112-counter-partner-outreach-program/message-type.md` (nouveau) | Message et questionnaire |
| `specs/112-counter-partner-outreach-program/cr-<plateforme>.md` (nouveaux) | Comptes rendus |
| `specs/112-counter-partner-outreach-program/synthese.md` (nouveau) | Synthèse |

Aucun code applicatif.

## 5. Impacts UI / domaine / application / infrastructure
Aucun.

## 6. Stratégie de migration
Sans objet.

## 7. Stratégie de test
Sans objet ; aucune requête vers une API tierce sans accord écrit de l'éditeur.

## 8. Non-régression
Sans objet.

## 9. Rollback / désactivation
Arrêt du programme à tout moment sur décision du product owner.

## 10. Documentation à mettre à jour
Aucune documentation publique tant qu'aucun accord n'existe ; un accord éventuel passe par la politique d'admission (110).
