---
id: 103-counter-training-checkout-study
v2_id: V2-TRAIN-01
titre: Étude — atelier finitions (entraînement)
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: innovation
priorite: P3
difficulte: M
recommandation: etude
lot: 5
poids: 8
depend_de: [V2-VOICE-05]
issue: '#289'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 103 — Étude : atelier finitions (entraînement)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Une étude ne crée aucune exigence. Elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles et/ou un ADR.

## 1. Contexte et origine

- Rapport 09 : constat P16 (aucun mode d'entraînement, « principal manque fonctionnel face à tous les concurrents consultés »), proposition INNO-08 « Atelier finitions mains libres », décision PO n° 9 (« inclure en V2 ou reporter ? »).
- Rapport 03 : étude provisoire V2-GAMES-22 « Jeux d'entraînement » (Round the Clock, Bob's 27, 121, Shanghai), **absente du catalogue et absorbée par la présente étude**.
- Compte rendu : E (rang 7), F.6, G (lot 5).
- La dépendance à V2-VOICE-05 (076, mains libres) tient à l'angle « jouable à la voix » ; une version au clavier n'en dépend pas (Q3).

## 2. Questions à trancher

- Q1 : faut-il un entraînement dans Bougnat Darts, ou le laisser aux applications spécialisées ?
- Q2 : quels exercices (1 à 3) et selon quelles règles de référence ?
- Q3 : quel mode de saisie : « réussi / raté », total de volée, ou fléchette par fléchette ? Clavier d'abord ou voix d'abord ?
- Q4 : quelle grammaire vocale minimale (« réussi », « raté », nombres) et quelle fiabilité en conditions réelles ?
- Q5 : quelles statistiques locales (taux de réussite par double, par reste) et où les conserver (historique 101) ?
- Q6 : quel coût voix récurrent pour un usage solo prolongé, et quel plafond ?
- Q7 : quelle place dans l'architecture : nouveau jeu dans le registre (V2-ARCH-09, 060) ou module séparé ?

## 3. État actuel vérifié dans le code

- [vérifié] Six jeux, aucun exercice d'entraînement (`utils/arenaFlow.ts:1`).
- [vérifié] Robot X01 : niveaux de moyenne (`src/domain/x01Bot/x01Bot.ts:11-17`) et probabilité de fin par niveau (`src/application/x01Bot/x01BotTurn.ts:36`) ; réutilisables pour proposer des restes réalistes [hypothèse].
- [vérifié] Possibilité de finir selon la règle : `src/features/x01/scoring/checkoutEligibility.ts:5-15` ; table de chemins Double Out `constants.ts:3`.
- [vérifié] Parseur vocal : trois intentions seulement (`turn_score`, `remaining_score`, `darts_sequence`, `src/features/x01/voice/dartsSpeechTypes.ts:8`) ; aucune commande « réussi / raté ».
- [vérifié] Écoute limitée à 6,5 s par appui (`src/features/x01/voice/voiceConfig.ts:1`) ; voix désactivée par défaut au build (`src/lib/env.ts:47`).
- [vérifié] Totaux de volée valides : `isPossibleThreeDartTurnScore` (`src/domain/scoring/valueObjects/ScoreInput.ts:49`).

## 4. Contraintes

- Gratuité, sans compte, sans publicité ; données locales uniquement.
- Parcours de base inchangé : l'entraînement est une entrée distincte (sélection de jeu ou menu secondaire), jamais une étape ajoutée.
- Clean Architecture : règles d'exercice dans le domaine, indépendantes de l'UI et de la voix ; la voix passe par le port de V2-VOICE-04 (075).
- Coût : la voix cloud (Deepgram) est la seule dépense récurrente ; le clavier coûte 0 €.
- Navigateurs : baseline de la spec 018.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Statu quo | Pas d'entraînement | Aucun effort | Manque visible face à tous les concurrents consultés | 0 € | — |
| B. Un exercice au clavier | « Checkout aléatoire » : l'app tire un reste, le joueur saisit réussi/raté et le nombre de fléchettes | Rapide, réutilise la logique de fin | Valeur limitée | 0 € | S-M |
| C. Trois exercices au clavier | B + « 121 » + « Tour des doubles » | Parité minimale | Trois règles à spécifier et tester | 0 € | M |
| D. C + voix mains libres | Commandes « réussi », « raté », nombres via VOICE-04/05 | Angle différenciant modeste (français, gratuit) | Dépend de 075/076 ; coût voix | ≈ 0,09 $ par séance de 15 min (voir §6) | M-L |
| E. Suite complète | Round the Clock, Bob's 27, Shanghai, Halve-It… | Couverture large | Dispersion, maintenance | 0 € (+ voix) | L |
| F. Orientation vers un partenaire | Lien vers une application d'entraînement française (La Bomabull) | Aucun développement | Contact nécessaire (V2-INT-09, 112), compte obligatoire chez le partenaire | 0 € | S |

## 6. Critères d'évaluation et analyse

- Couverture du marché : exercices de finition présents chez DartCounter, My Dart Training, The Darts App, Dartsmind [confirmé — pages publiques consultées le 20/11/2026, rapport 09 §3]. MyDarts combine voix et entraînement, en anglais et en offre payante [confirmé, même source]. **La différenciation d'un atelier Bougnat est modeste** (français, gratuit, sans compte, voix) ; aucune nouveauté n'est revendiquée.
- La Bomabull : application française d'entraînement, compte obligatoire, aucune API ni import/export documentés [confirmé, rapport 08] ; complémentarité [contact nécessaire].
- Coût voix (Deepgram nova-3 + keyterms, 0,0048 + 0,0013 $/min en promotion, 0,0077 + 0,0013 $/min hors promotion, deepgram.com/pricing consulté le 20/11/2026 [confirmé]) : séance de 15 min en écoute continue ≈ 0,09 $ (promotion) à 0,14 $ (hors promotion) ; 100 séances par mois ≈ 9 à 14 $ [envisageable — hypothèse de facturation au temps de connexion, à vérifier avec V2-VOICE-03, 074].
- Fiabilité vocale : mots courts (« raté ») en environnement domestique [non documenté — à mesurer avec le corpus de 074].
- Critères proposés : valeur perçue (test terrain), effort, coût récurrent, risque de dispersion, réutilisation (DartKeypad commun du rapport 03 §5.7, historique 101).

## 7. Recommandation (non validée)

Option **C, livrée en deux temps** : d'abord **B** (« Checkout aléatoire » au clavier, 0 €), puis « 121 » et « Tour des doubles » si l'usage le justifie ; **la voix (D) seulement après** la livraison et la mesure de V2-VOICE-05 (076), avec un plafond de budget commun. Les règles d'exercice vivent dans `src/domain/training/` et passent par le registre de jeux si V2-ARCH-09 (060) est retenu. L'option F reste complémentaire (contact uniquement sur autorisation, compte rendu H.21).

## 8. Protocole de vérification (PoC, mesures, terrain)

1. Maquette papier ou prototype cliquable du « Checkout aléatoire » ; 5 joueurs de club, 15 min chacun ; mesurer : volées par minute, abandons, intérêt déclaré (échelle 1-5).
2. Si D est envisagée : enregistrer « réussi », « raté », « cent vingt et un » et les restes courants dans le corpus 074 (calme et bruit domestique) ; mesurer taux de reconnaissance, latence p95 et coût réel par séance.
3. Vérifier la capacité de l'historique (101) à stocker des séances (volume, résumé).

## 9. Livrables attendus de l'étude

- Recommandation arbitrée (A à F).
- Si retenue : spec fonctionnelle « Atelier finitions — exercice 1 » (règles sourcées, saisie, statistiques, AC) et, si nécessaire, ADR sur la place des exercices dans le registre de jeux.
- Mise à jour du chiffrage voix dans 074/076 si D est retenue.

## 10. Risques

- Dispersion (multiplication des modes) : limiter à 3 exercices.
- Promesse « mains libres » non tenue : ne communiquer qu'après mesure.
- Coût voix d'usages solo longs : plafond et repli clavier.
- Règles d'exercice divergentes selon les sources : rétro-spec et sources citées (V2-GAMES-26, 050).

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Entraînement dans Bougnat Darts ? | Oui V2.x / Non / Partenaire | Oui en V2.x, périmètre réduit | — |
| Q2 | Exercices retenus | Checkout aléatoire, 121, Tour des doubles, autres | Checkout aléatoire d'abord | — |
| Q3 | Saisie | Réussi/raté / Total / Fléchette par fléchette | Réussi/raté + nombre de fléchettes | — |
| Q4 | Voix | Dès la V1 / Après 076 | Après 076 et mesure | — |
| Q5 | Stockage des statistiques | Historique 101 / Store dédié | Historique 101 (type d'entrée « entraînement ») | — |
| Q6 | Budget voix | Plafond mensuel commun / Pas de voix en entraînement | Plafond commun décidé en H.5 | — |
| Q7 | Contact La Bomabull | Oui / Non | Seulement sur autorisation (H.21) | — |

## 12. Traçabilité

- Rapports : `reports/09-innovation.md` (P4, P16, §3, §4, INNO-08, §10 décision 9), `reports/03-games.md` (§2 variantes absentes, §5.7, V2-GAMES-22 provisoire), `reports/08-integrations.md` (La Bomabull), `reports/04-voice.md` (coûts).
- Compte rendu : D.1, D.4, E (rang 7), F.6, G (lot 5), H.5, H.21.
- Specs liées : 074, 075, 076, 060, 101, 050, 112.
