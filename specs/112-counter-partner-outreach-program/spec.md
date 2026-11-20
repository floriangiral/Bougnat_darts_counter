---
id: 112-counter-partner-outreach-program
v2_id: V2-INT-09
titre: Étude — programme de prises de contact avec l'écosystème fléchettes
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: integrations
priorite: P3
difficulte: S
recommandation: etude
lot: 5
poids: 10
depend_de: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 112 — Étude : programme de prises de contact avec l'écosystème fléchettes

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
> **Aucune prise de contact, aucune demande de clé d'API, aucune inscription à un service n'a lieu sans autorisation explicite et écrite du product owner, plateforme par plateforme.** Une étude ne crée aucune exigence.

## 1. Contexte et origine

L'audit des intégrations (rapport 08 §3, compte rendu V2 §C.10 et §D.4) a examiné quatre plateformes à partir de leurs pages publiques : aucune ne permet aujourd'hui d'**envoyer** un score de façon documentée et autorisée. Les points classés « nécessite prise de contact » ne peuvent être levés que par un échange avec les éditeurs. Le compte rendu (question H.21) soumet ces contacts à l'autorisation du product owner. Le partenaire déjà actif (badarts.fr / DartsHub) relève de V2-INT-02 (106).

## 2. Questions à trancher

- **Q1** — Quelles plateformes contacter, dans quel ordre, avec quel objectif précis ?
- **Q2** — Quel questionnaire commun (API, conditions d'utilisation, coûts, données personnelles, intérêt) ?
- **Q3** — Qui contacte, par quel canal, avec quel message de présentation validé ?
- **Q4** — Quelles limites non négociables (gratuité, sans publicité, sans compte joueur obligatoire, open source, pas d'exclusivité) ?
- **Q5** — Comment consigner les réponses et mettre à jour les fiches plateformes ?

## 3. État actuel vérifié dans le code

| Point | Constat | Référence |
|---|---|---|
| Intégration existante | Contrat `v=1` sans réseau, origines autorisées au build | `src/features/external-match/externalMatchLink.ts:135-140`, `wrangler.jsonc:17` |
| Réseau | Aucun appel vers une plateforme tierce ; CSP `connect-src` limitée | `public/_headers:2` |
| Iframes | `frame-ancestors 'none'`, `frame-src 'none'` | `public/_headers:2` |
| Secrets | Aucun secret de plateforme dans le dépôt ni dans le bundle | `wrangler.jsonc` (variables publiques `VITE_*`) |

## 4. Contraintes

- Autorisation écrite du product owner **avant chaque contact**, y compris une demande de clé d'API (DartConnect), qui est une prise de contact.
- Pas d'usage d'endpoints internes ou non documentés (DfW `score_proxy.php`, données de page Inertia de La Bomabull), pas de scraping (interdit par les CGU DartConnect).
- Une clé d'API est un secret : elle ne peut pas être placée dans le bundle public du compteur ; elle ne pourrait être détenue que côté serveur (par exemple BDT, cf. 109). En revanche, une API authentifiée côté serveur **n'impose pas** de compte aux joueurs du compteur : conclure « API authentifiée ⇒ compte obligatoire » serait une généralisation abusive.
- Aucun engagement commercial, aucune publicité, aucune exclusivité.
- Coût récurrent : 0 € pour l'étude ; tout coût d'accès (licence, frais par joueur) est signalé et soumis au product owner.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Programme séquencé | Une plateforme à la fois, questionnaire commun, compte rendu | Maîtrisé, réversible | Lent | 0 € | S |
| B. Contacts simultanés | Message identique à toutes les plateformes | Rapide | Image moins soignée ; charge de suivi | 0 € | S |
| C. Aucun contact | S'appuyer sur la ressaisie manuelle et la carte de résultat (V2-SHARE-01 / 102) | Aucun risque | Laisse les « contact nécessaire » ouverts | 0 € | — |

## 6. Critères d'évaluation et analyse

Ordre proposé, du plus au moins prometteur (rapport 08 §3.6) :

| Rang | Plateforme | Objectif du contact | Ce qui est établi | Niveau |
|---|---|---|---|---|
| 1 | La Bomabull Darts (Labo MaBULL) | Liens croisés ; intérêt pour un lien de type `v=1` (Skillomètre 501) | Application française d'entraînement, compte obligatoire, aucune API publique (https://app.labomabull-darts.fr/, consulté le 2026-11-20) | [confirmé] positionnement ; [contact nécessaire] intérêt, CGU |
| 2 | DartConnect | Conditions d'attribution d'une clé, feuille de route d'endpoints de résultat | API REST à accès restreint (clé sur demande), aucun endpoint de soumission de score, CGU interdisant l'automatisation (https://public-api.dartconnect.com/, https://www.dartconnect.com/members/terms-of-use/, consultés le 2026-11-20) | [confirmé] ; contact utile **seulement si BDT porte le besoin** (109) |
| 3 | 3K Darts | Ouverture éventuelle à un scorer tiers | Refus public d'API ; ressaisie manuelle d'un score issu d'une autre application admise ; transmission automatique réservée à son scorer, facturée (portail d'aide 3K, consulté le 2026-11-20) | [confirmé] ; probabilité d'accord faible [hypothèse] |
| 4 | Darts for Windows | Format d'import de résultats, réutilisation du live | Logiciel Windows payant (27,99 GBP par poste), import CSV de joueurs documenté, formats de tableaux non documentés (https://www.dartsforwindows.com/, consulté le 2026-11-20) | [confirmé] ; [non documenté] import de résultats |

Les prix et conditions sont ceux publiés au 2026-11-20 et peuvent changer. Scolia (caméras) relève de V2-ARCH-15 (062), pas de ce programme.

## 7. Recommandation (non validée)

Option **A**, après V2-INT-02 (106) : La Bomabull d'abord, si le product owner l'autorise ; DartConnect seulement si 109 confirme un besoin côté BDT ; 3K et Darts for Windows en dernier, avec un objectif limité à l'information. En l'absence d'autorisation, option **C** : la ressaisie manuelle, admise par 3K et possible partout, est facilitée par la carte de résultat V2-SHARE-01 (102).

## 8. Protocole de vérification

1. Autorisation écrite par plateforme (objectif, canal, interlocuteur, message).
2. Relecture des pages publiques le jour du contact (prix, CGU, documentation).
3. Envoi du message validé ; relance unique à 15 jours [proposé] ; clôture sans réponse à 30 jours.
4. Compte rendu par plateforme ; mise à jour de la fiche (rapport 08 §3) dans le dossier de la spec.

## 9. Livrables attendus de l'étude

- Message de présentation type (valeurs du projet, contrat `v=1`, guide partenaire, absence de contrepartie commerciale).
- Questionnaire commun (API et authentification, conditions d'utilisation, coûts, données personnelles et RGPD, intérêt, contact technique).
- Un compte rendu par plateforme contactée, sans donnée personnelle.
- Tableau de synthèse « faisable / à spécifier / abandonné » et propositions de specs éventuelles.

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Contact non autorisé | Élevé | Faible | T000 bloquant par plateforme |
| Demande de contrepartie (exclusivité, publicité) | Moyen | Moyenne | Limites §4 rappelées dans le message |
| Dépendance à un projet individuel (La Bomabull) | Moyen | Moyenne | Pas d'investissement technique avant engagement écrit |
| Violation de CGU par un essai technique | Élevé | Faible | Aucun essai sans accord écrit de l'éditeur |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Autoriser le contact La Bomabull (H.21) | oui / non / plus tard | Oui, après 106 | — |
| D2 | Autoriser une demande de clé DartConnect | oui / non / si 109 le justifie | Seulement si 109 le justifie | — |
| D3 | Contacter 3K et Darts for Windows | oui / non | Plus tard, objectif d'information | — |
| D4 | Canal et signataire | product owner / mainteneur | Product owner | — |

## 12. Traçabilité

Rapport 08 §3.1 à §3.6, §4, §8 (D2, D8), §9 (R3, R5), §10 ; compte rendu V2 §C.10, §D.4, §H.21 ; specs 106, 109, 102, 062.
