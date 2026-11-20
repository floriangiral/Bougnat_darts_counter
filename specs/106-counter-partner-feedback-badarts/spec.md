---
id: 106-counter-partner-feedback-badarts
v2_id: V2-INT-02
titre: Étude — retour d'expérience du partenaire badarts.fr / DartsHub
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: integrations
priorite: P1
difficulte: S
recommandation: etude
lot: 2
poids: 45
depend_de: [V2-INT-01]
issue: '#238'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 106 — Étude : retour d'expérience du partenaire badarts.fr / DartsHub

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
> Une étude ne crée aucune exigence. **Aucune prise de contact n'a lieu sans autorisation explicite du product owner.**

## 1. Contexte et origine

Le contrat de lien `v=1` (spec 030, `V2-INT-01`) est activé pour `https://badarts.fr` (`wrangler.jsonc:17`, `:29`, commit `f9ac4c2`). L'audit du 2026-11-20 a constaté, par lecture du bundle JavaScript public du site, que badarts.fr — site du club Montpellier Hérault Darts Club, bâti sur la plateforme DartsHub (`api.dartshub.fr`, `auth.dartshub.fr`) — **consomme déjà** `v=1` (rapport 08 §2.7). Les évolutions envisagées (retour par QR `V2-INT-04` / 107, contrat `v=2` `V2-INT-05` / 108) doivent être décidées sur des faits d'usage, pas sur des hypothèses. Compte rendu V2 : §C.10, §D.4, questions H.20 et H.21.

## 2. Questions à trancher

- **Q1** — Usage réel : combien de matchs liés par soirée ou tournoi, sur quels appareils (tablette de cible, téléphone, PC de la table de marque) ? La tablette de cible est-elle le même appareil que celui de l'organisateur ?
- **Q2** — Le relais `BroadcastChannel` entre `/bougnat-retour` et l'onglet de gestion suffit-il ? Combien de résultats retombent en « Saisissez ce score à la main » ?
- **Q3** — Besoins non couverts par `v=1` : sets (le partenaire ignore `sets1`/`sets2` et n'envoie jamais `sets`), Cricket, détail des volées, retour vers l'onglet ouvreur, libellé d'événement.
- **Q4** — Sécurité : le partenaire accepte-t-il d'ajouter un jeton à usage unique et à durée courte dans l'URL de retour (recommandation n° 1 du guide, absente aujourd'hui) ? Comprend-il que ce jeton corrèle le retour au match mais ne certifie pas le score ?
- **Q5** — Stabilité : l'origine `https://badarts.fr` restera-t-elle la seule (pas de bascule vers `www.badarts.fr`) ?
- **Q6** — DartsHub : la page `/bougnat-retour` est-elle propre au club ou fournie par la plateforme à plusieurs clubs ? Une intégration au niveau DartsHub est-elle envisageable ?
- **Q7** — Un essai de bout en bout avant la publication 2.0.0 est-il possible (environnement de test du partenaire, préprod du compteur) ?

## 3. État actuel vérifié dans le code

| Point | Constat | Référence |
|---|---|---|
| Activation | Origine `https://badarts.fr` en préprod et production | `wrangler.jsonc:17`, `:29` |
| Retour | Navigation de premier niveau, même onglet, après sauvegarde de la session | `App.tsx:202-209` |
| Sets | `sets1`/`sets2` envoyés en format sets seulement | `src/features/external-match/externalMatchLink.ts:456-459` |
| Durées | TTL de 12 h sur le contexte restauré, pas sur l'URL entrante | `externalMatchLink.ts:302-307`, `:341-350` |
| Essai réel | Non réalisé | `docs/release/v2.0.0-coverage-map.md:32` |
| Partenaire | Lien ouvert par `window.open(…, "_blank")`, retour sans jeton, relais `BroadcastChannel`, validation humaine | [vérifié sur source externe le 2026-11-20, rapport 08 §2.7 ; susceptible d'évoluer] |

## 4. Contraintes

- Aucun contact (courriel, formulaire, réseau social, ticket) sans autorisation explicite et écrite du product owner, qui choisit aussi le canal et l'interlocuteur.
- Aucune requête vers une API non documentée du partenaire ou de DartsHub, aucun compte, aucun jeton. Les observations du bundle public restent limitées à la compréhension du contrat.
- Aucune donnée personnelle de joueurs n'est demandée ni conservée : seuls des volumes agrégés et des retours qualitatifs.
- Gratuité, sans publicité, sans compte : aucune contrepartie commerciale n'est négociée dans cette étude.
- Le contrat `v=1` n'est pas modifié par l'étude.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Entretien guidé | Questionnaire de 10 à 15 questions (§9), 30 min, compte rendu | Faits directs, relation de confiance | Exige l'autorisation ; disponibilité d'un bénévole | 0 € | S |
| B. Observation passive | Relecture périodique du bundle public du partenaire | Aucun contact | Ne répond ni à Q1, Q2, Q6, Q7 ; fragile ; à la limite de l'acceptable si répété | 0 € | S |
| C. Instrumentation côté compteur | Compter les ouvertures de lien et les envois | Mesure objective | Contraire à la sobriété (pas d'appel réseau) ; RGPD ; hors périmètre | 0 € mais nouvelle collecte | M |
| D. Ne rien faire | Attendre les retours spontanés | Aucun effort | Décisions 107/108 prises à l'aveugle | 0 € | — |

## 6. Critères d'évaluation et analyse

- Capacité à trancher V2-INT-04 (107) et V2-INT-05 (108) : A répond à Q1 à Q7 ; B à Q3 et Q5 partiellement ; C à Q1 seulement.
- Respect des valeurs : A et B conformes ; C introduit une collecte, écartée.
- Informations externes : toutes les observations sur badarts.fr et DartsHub sont **[confirmé]** au 2026-11-20 par lecture du bundle public, sauf le lien commercial ou technique entre badarts.fr et DartsHub **[contact nécessaire]**, l'équipement d'autres clubs par DartsHub **[non documenté]** et la résolution DNS de `www.badarts.fr` **[à confirmer]**.

## 7. Recommandation (non validée)

Option **A**, déclenchée seulement après autorisation du product owner (question H.21), précédée d'une relecture ponctuelle (B) le jour même pour vérifier que le constat du 2026-11-20 est toujours vrai. Si l'autorisation n'est pas donnée, consigner que 107 et 108 restent en attente, et publier 2.0.0 avec la limite « pas d'essai réel » documentée (V2-INT-01, V2-AC-07).

## 8. Protocole de vérification

1. Autorisation écrite du product owner (canal, interlocuteur, périmètre des questions).
2. Relecture du bundle public le jour de l'entretien (paramètres construits, page de retour, contrôles).
3. Entretien avec le questionnaire §9 ; compte rendu relu par le partenaire avant diffusion.
4. Si Q7 est positif : essai de bout en bout sur la préprod du compteur avec l'environnement de test du partenaire, sur une tablette et un téléphone [à confirmer : appareils].
5. Synthèse : décision proposée pour 107, 108, et pour la politique d'admission 110.

## 9. Livrables attendus de l'étude

- Questionnaire (Q1 à Q7 détaillés, en français, sans jargon).
- Compte rendu daté, validé par le partenaire, sans donnée personnelle.
- Tableau « besoin → spec » : 107 (QR), 108 (`v=2` : sets côté partenaire, Cricket, ouvreur, volées), 110 (jeton, origine), 030 (guide).
- Le cas échéant, procès-verbal de l'essai de bout en bout pour V2-INT-01 (V2-AC-07).

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Contact sans autorisation | Élevé (confiance, gouvernance) | Faible | T000 bloquant ; aucune action avant accord écrit |
| Le partenaire change son implémentation sans prévenir | Moyen | Moyenne | Proposer une liste de diffusion des changements du contrat (110) |
| Sur-interprétation d'un seul partenaire | Moyen | Élevée | Un seul REX ne suffit pas à lancer `v=2` : exiger un second besoin (règle des deux usages, 111) |
| Demande de fonctionnalités payantes ou exclusives | Moyen | Faible | Rappeler gratuité et neutralité (110) |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Autoriser le contact avec badarts.fr (H.21) | oui / non / plus tard | Oui, partenaire déjà actif | — |
| D2 | Contacter aussi DartsHub | oui, via badarts.fr / oui, directement / non | Via badarts.fr seulement, après D1 | — |
| D3 | Essai réel avant ou après publication 2.0.0 | avant / après | Avant si D1 = oui | — |
| D4 | Proposer au partenaire d'ajouter un jeton | oui / non | Oui (recommandation n° 1 du guide) | — |

## 12. Traçabilité

- Rapport d'audit 08 §2.7, §2.9 (D3, D6, D7), §7 ; compte rendu V2 §C.10, §D.4, §H (20, 21).
- Spec 030 (Révision V2), guide `docs/integration/external-match-link.md`.
- Suites : V2-INT-04 (107), V2-INT-05 (108), V2-INT-08 (110), V2-INT-09 (112).
