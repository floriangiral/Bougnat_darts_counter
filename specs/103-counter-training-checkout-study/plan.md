# Plan — 103 Étude : atelier finitions (entraînement)

> Plan de conduite de l'étude. Il ne s'exécute qu'après passage de la spec au statut `validee`. Aucun code applicatif n'est produit par l'étude, hormis un prototype jetable hors branche principale si le protocole l'exige.

## 1. Lecture de l'existant

- Jeux : `utils/arenaFlow.ts:1`. Fin X01 : `src/features/x01/scoring/checkoutEligibility.ts:5-15`, `constants.ts:3`.
- Robot : `src/domain/x01Bot/x01Bot.ts:11-17`, `src/application/x01Bot/x01BotTurn.ts:36`.
- Voix : `src/features/x01/voice/dartsSpeechTypes.ts:8`, `voiceConfig.ts:1`, `src/lib/env.ts:47`.
- Totaux : `src/domain/scoring/valueObjects/ScoreInput.ts:49`.

## 2. Approche retenue (et alternatives écartées)

- Retenue : étude courte en trois volets (marché déjà couvert par le rapport 09, prototype d'usage, mesure vocale conditionnelle).
- Écartée : implémenter directement plusieurs exercices sans mesure d'intérêt.

## 3. Étapes

1. Rédiger les règles de référence des exercices candidats, sources citées (avec V2-GAMES-26, 050).
2. Prototype cliquable du « Checkout aléatoire » (clavier) ; séance avec 5 joueurs de club.
3. Si la voix est envisagée et 074/076 disponibles : enregistrements du vocabulaire d'entraînement dans le corpus, mesure de fiabilité et de coût.
4. Synthèse : option recommandée, chiffrage, risques ; présentation au product owner.
5. Si retenue : rédaction de la spec fonctionnelle et, si besoin, d'un ADR (place dans le registre de jeux).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `specs/103-counter-training-checkout-study/spec.md` | Résultats et recommandation arbitrée |
| `specs/NNN-counter-training-checkout-drill/` (si retenue) | Nouvelle spec fonctionnelle |
| `docs/adr/` (si nécessaire) | ADR « exercices dans le registre de jeux » |

## 5. Impacts UI / domaine / application / infrastructure

- Aucun pendant l'étude. Cible si retenue : domaine `src/domain/training/`, saisie par le clavier commun, voix via le port de 075.

## 6. Stratégie de migration (données, sessions persistées, contrats)

- Sans objet pendant l'étude ; la spec suivante traitera le type d'entrée « entraînement » dans l'historique (101).

## 7. Stratégie de test

- Protocole terrain (§8 de la spec) ; mesures vocales via le banc de 074.

## 8. Non-régression

- Sans objet (aucun changement du produit).

## 9. Rollback / désactivation (feature flag le cas échéant)

- Sans objet ; le prototype est jetable.

## 10. Documentation à mettre à jour avec l'implémentation

- Feuille de route V2 (décision), spec 103 (statut `cloturee` après arbitrage et création des suites).
