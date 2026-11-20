# Plan — 106 Étude : retour d'expérience badarts.fr / DartsHub

> Plan proposé. Il ne s'exécute qu'après passage de la spec au statut `validee` **et** autorisation écrite de contact par le product owner.

## 1. Lecture de l'existant

- Contrat `v=1` : `src/features/external-match/externalMatchLink.ts` (entrée l. 264-290, sortie l. 438-478).
- Activation : `wrangler.jsonc:17`, `:29`.
- Guide partenaire : `docs/integration/external-match-link.md` (sections « Sécurité » et « Dépannage »).
- Observation externe du 2026-11-20 : rapport 08 §2.7.

## 2. Approche retenue (et alternatives écartées)

Entretien guidé (option A) précédé d'une relecture du bundle public (option B ponctuelle). Écartés : instrumentation côté compteur (collecte contraire à la sobriété), observation répétée sans contact (fragile).

## 3. Étapes

1. Obtenir l'autorisation écrite (canal, interlocuteur, périmètre).
2. Rédiger le questionnaire à partir de Q1 à Q7 ; le faire relire par le product owner.
3. Relire le bundle public le jour J ; noter les écarts avec le constat du 2026-11-20.
4. Mener l'entretien ; rédiger le compte rendu ; le faire valider par le partenaire.
5. Si un essai réel est accepté : préprod du compteur + environnement de test partenaire ; consigner appareils, navigateur, résultat.
6. Produire le tableau « besoin → spec » et proposer les décisions pour 107, 108, 110.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `specs/106-counter-partner-feedback-badarts/rex-badarts.md` (nouveau) | Compte rendu sans donnée personnelle |
| `specs/030-counter-external-match-link/tasks.md` | Cocher l'essai réel si réalisé |
| `docs/integration/external-match-link.md` | Retours terrain (variante nouvel onglet), via V2-INT-01 |

Aucun code applicatif.

## 5. Impacts UI / domaine / application / infrastructure

Aucun.

## 6. Stratégie de migration

Sans objet (aucune donnée, aucun contrat modifié).

## 7. Stratégie de test

Sans objet pour le code ; l'essai réel suit le protocole §8 de la spec.

## 8. Non-régression

Le contrat `v=1` n'est pas modifié ; l'essai réel ne se fait que sur la préprod.

## 9. Rollback / désactivation

Sans objet. En cas de refus du partenaire ou d'absence d'autorisation, l'étude est close avec la mention « contact refusé ou non autorisé ».

## 10. Documentation à mettre à jour

Compte rendu dans le dossier de la spec ; guide partenaire via V2-INT-01 ; statut des specs 107 et 108.
