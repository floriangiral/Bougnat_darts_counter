---
id: 105-counter-flash-night-study
v2_id: V2-GAMES-25
titre: Étude — « Soirée éclair » (mini-tournoi local)
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: innovation
priorite: P3
difficulte: L
recommandation: etude
lot: 5
poids: 5
depend_de: [V2-ARCH-04, V2-INT-07]
issue: '#296'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 105 — Étude : « Soirée éclair » (mini-tournoi local)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Une étude ne crée aucune exigence. Elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles et/ou un ADR.

## 1. Contexte et origine

- Rapport 09 : INNO-06 « Soirée éclair » (4 à 16 prénoms, un appareil organisateur, tableau tiré, matchs appelés, affichage TV), candidat signature n° 4 **conditionnel** à l'arbitrage de frontière ; §5.3 B « L'animateur de soirée » ; décision PO n° 3.
- Compte rendu : E (rang 8, « Conditionnelle (frontière BDT) »), F.6, G (lot 5), H.13 (« Soirée éclair vs frontière BDT ? »), H.22 (autorité en tournoi).
- Besoin terrain : animer une soirée de bar, d'association ou d'entreprise sans outil payant ni compte (rapport 09 §4).

## 2. Questions à trancher

- Q1 : un mini-tournoi local, éphémère, sans compte, est-il compatible avec la frontière entre le compteur et `Bougnat_Darts_Tournaments` (BDT) ? Sinon, où doit-il vivre ?
- Q2 : quels formats (élimination directe, poule unique, montante-descendante) et quelles bornes (≤ 16 joueurs) ?
- Q3 : où se jouent les matchs : sur l'appareil organisateur, sur d'autres cibles avec ressaisie, ou avec retour par QR (V2-INT-04, 107) ?
- Q4 : le contrat de lien 030 peut-il servir de contrat interne entre le tableau et le match ? Avec quelles limites (X01 seul en `v=1`) ?
- Q5 : persistance et reprise de la soirée (perte de l'appareil, rechargement) ?
- Q6 : affichage du tableau sur la TV (V2-TV-04, 085) ?
- Q7 : la valeur justifie-t-elle l'effort (L à XL) face aux alternatives gratuites existantes ?

## 3. État actuel vérifié dans le code

- [vérifié] Le compteur exclut « logique tournoi avancée » et « orchestration organisateur » (`docs/product-scope.md:24-25`) et désigne BDT comme futur système maître de « l'orchestration tournoi » (`docs/product-scope.md:54-65`).
- [vérifié] `CONTRIBUTING.md:28-33` interdit de réintroduire une « logique tournoi propriétaire » et toute « dépendance runtime obligatoire à `Bougnat_Darts_Tournaments` ».
- [vérifié, hors dépôt] Dépôt BDT au commit `0028fc4`, `docs/09-open-source-boundary.md:19` : « categories, phases, brackets et orchestration » appartiennent à la couche privée tournoi ; `:39` : « Si une règle appartient à l'orchestration tournoi, elle doit vivre dans ce repo [BDT] ».
- [vérifié, hors dépôt] BDT, `docs/02-functional-scope.md:12-15` : moteur de compétition (poules, élimination directe…) « en reconstruction ».
- [vérifié] Le lien de match externe (spec 030) ne couvre que X01 et exige une origine de retour `https` autorisée au build (`src/features/external-match/externalMatchLink.ts`, `App.tsx:91`).
- [vérifié] Seul X01 est repris après rechargement (compte rendu A, point 2 ; spec 010 / V2-ARCH-06).
- [vérifié] Aucune diffusion vers un second écran (rapport 09 P14).

## 4. Contraintes

- Gratuité, sans compte, sans publicité ; aucun serveur obligatoire pour jouer.
- Parcours de base inchangé : toute fonction « soirée » passe par une entrée distincte (rapport 09 §7, garde-fou).
- Clean Architecture : la logique de tableau (tirage, avancement, classement) ne doit pas se mêler aux règles de scoring.
- Frontière inter-dépôts (§3) : toute dérogation doit être décidée par ADR et acceptée côté BDT.
- Coût récurrent : 0 € en mono-appareil ; une synchronisation multi-appareils imposerait un serveur (contraire au périmètre du compteur).

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Ne rien faire | Orienter vers BDT (futur) et les outils existants | Frontière respectée, aucun effort | Besoin des bars non couvert à court terme | 0 € | — |
| B. Mini-tournoi dans le compteur | Mono-appareil, ≤ 16 joueurs, élimination directe ou poule unique, éphémère | Hors ligne, immédiat, cohérent avec l'identité « comptoir » | **Contredit la frontière BDT (§3)** ; risque de dérive (têtes de série, handicaps, ligues) | 0 € | L |
| C. Application « Soirée » séparée | Petite application open source distincte qui tient le tableau et ouvre chaque match dans le compteur via 030 (même appareil), résultat par l'URL de retour | Frontière respectée côté compteur ; réutilise 030 tel quel | Nouveau projet à maintenir ; X01 seul tant que `v=2` (V2-INT-05, 108) n'existe pas ; origine à autoriser | 0 € | L |
| D. Mode « soirée » dans BDT | BDT propose un format éclair (organisateur seul, joueurs sans compte) ; le compteur reste scoreur via le contrat V2-INT-07 (109) | Une seule vérité tournoi ; profite du live/wallboard BDT | Dépend de la reconstruction du moteur BDT ; hors ligne à confirmer ; compte organisateur probable | Selon BDT | L-XL (côté BDT) |
| E. Multi-appareils synchronisés | Plusieurs cibles remontent leurs résultats en direct | Expérience complète | Serveur et synchronisation : contraire au périmètre du compteur | Serveur | XL |

## 6. Critères d'évaluation et analyse

- Frontière (poids fort) : B est incompatible avec les textes actuels des deux dépôts (§3) ; C et D les respectent ; E est hors périmètre.
- Marché : tournois gratuits chez The Darts App, avec compte organisateur [confirmé — thedarts.app consulté le 20/11/2026, rapport 09] ; n01 gratuit jusqu'à 64 joueurs avec publicité [confirmé — n01darts.com/pricing, même date]. Une offre **sans compte, hors ligne, mono-appareil, aux couleurs du lieu** est [non documentée] parmi les applications consultées : cela ne prouve pas qu'elle n'existe pas.
- Valeur : moyenne-haute pour les lieux et l'association Bougnat Darts (terrain d'événements réel, rapport 09 §2.2) [hypothèse à valider par un pilote].
- Faisabilité : C et B demandent un modèle de tableau pur (tirage, avancement, gestion des forfaits) ; D dépend du calendrier BDT [contact interne nécessaire : responsable BDT].
- Réutilisation : 030 comme contrat interne (C) ; état sérialisable (V2-ARCH-04, 058) pour la reprise ; récap à emporter (102) pour le vainqueur ; TV locale (085) pour le tableau.

## 7. Recommandation (non validée)

1. **Ne pas implémenter de tableau de tournoi dans le compteur (option B) sans ADR de dérogation** explicitement accepté côté BDT : les deux dépôts placent aujourd'hui les « brackets » dans BDT.
2. **Instruire en priorité l'option D** avec le responsable de BDT, dans le cadrage du contrat V2-INT-07 (109) : un format « éclair » de BDT, organisateur seul, joueurs sans compte, le compteur restant le scoreur.
3. **Si BDT ne peut pas couvrir ce besoin à l'horizon V2.x**, préférer l'option C (application séparée consommant 030) à l'option B.
4. Dans tous les cas, le compteur n'ajoute qu'une **entrée distincte** et aucun état de tournoi.

## 8. Protocole de vérification (PoC, mesures, terrain)

1. Atelier de frontière (product owner + responsable BDT) : statuer sur Q1 ; consigner la décision dans un ADR.
2. Si C ou B : maquette papier d'une soirée 8 joueurs / 2 cibles ; mesurer le temps de mise en route (objectif ≤ 2 min [hypothèse]) avec un organisateur de l'association.
3. PoC technique C : tableau d'élimination directe de 8 joueurs, ouverture d'un match X01 via 030 sur le même appareil, retour du résultat, reprise après rechargement.
4. Pilote terrain lors d'un événement Bougnat Darts (sur autorisation).

## 9. Livrables attendus de l'étude

- ADR « Frontière mini-tournoi local » (dépôt compteur, `docs/adr/`), référencé côté BDT.
- Recommandation arbitrée (A à E) et, selon le cas : spec fonctionnelle côté BDT (D), spec d'une application séparée (C) ou spec compteur sous dérogation (B).
- Liste des besoins sur le contrat 030 (Cricket, retour même onglet) transmise à V2-INT-05 (108).

## 10. Risques

- Conflit de périmètre et double vérité des résultats (compteur vs BDT).
- Dérive fonctionnelle (têtes de série, handicaps, classements persistants).
- Perte de l'appareil organisateur en cours de soirée (persistance locale nécessaire).
- Effort L à XL pour une priorité P3.

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Frontière (H.13, décision PO n° 3 du rapport 09) | B dans le compteur / C application séparée / D dans BDT / A rien | D d'abord, sinon C ; B seulement par ADR de dérogation | — |
| Q2 | Formats et bornes | Élimination directe / poule unique / montante-descendante ; ≤ 8 / ≤ 16 | Élimination directe ≤ 16, puis poule unique si demandé | — |
| Q3 | Lieu des matchs | Appareil organisateur / ressaisie / QR (107) | Appareil organisateur + ressaisie du score final | — |
| Q4 | 030 comme contrat interne | Oui (X01) / Attendre `v=2` | Oui pour X01 ; Cricket après 108 | — |
| Q5 | Persistance de la soirée | Locale / Aucune | Locale, avec reprise (conventions 010) | — |
| Q6 | Autorité des résultats (H.22) | Compteur / BDT | BDT fait foi dès qu'il est impliqué ; sinon « résultat local non officiel » | — |
| Q7 | Poursuivre l'étude en V2.x ? | Oui / Reporter | Oui, limitée à l'atelier de frontière (Q1) tant que BDT reconstruit son moteur | — |

## 12. Traçabilité

- Rapports : `reports/09-innovation.md` (§2.2, §4, §5.3 B, INNO-06, §9 V2-INNO-07, §10 décision 3), `reports/08-integrations.md` (contrat BDT, 030), `reports/02-architecture.md` (frontière).
- Compte rendu : C.10, E (rang 8), F.6, F.7, G (lot 5), H.13, H.22.
- Documents : `docs/product-scope.md`, `CONTRIBUTING.md` ; dépôt BDT `docs/09-open-source-boundary.md`, `docs/02-functional-scope.md` (commit `0028fc4`).
- Specs liées : 030, 058, 109, 108, 107, 085, 102, 104, 010.
