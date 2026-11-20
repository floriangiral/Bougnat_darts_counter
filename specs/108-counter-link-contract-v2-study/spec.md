---
id: 108-counter-link-contract-v2-study
v2_id: V2-INT-05
titre: Étude — contrat de lien partenaire v=2
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: integrations
priorite: P3
difficulte: M
recommandation: etude
lot: 5
poids: 5
depend_de: [V2-INT-02]
issue: '#297'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 108 — Étude : contrat de lien partenaire v=2

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
> Une étude ne crée aucune exigence. Elle ne se lance que si V2-INT-02 (106) ou un autre partenaire exprime un besoin que `v=1` ne couvre pas.

## 1. Contexte et origine

Le contrat `v=1` (spec 030) est figé pour 2.0.0 avec ajouts optionnels seulement (V2-INT-01, V2-FR-01). L'audit (rapport 08 §2.5, §5.1 option C) a listé ses limites : X01 seul (L1), résultat non signé (L2), retour sur le même appareil (L4), résultat agrégé sans volées (L5), pas d'identifiant de joueur (L6), libellé « Match de tournoi » (L8). Le compte rendu V2 (§C.10, H.20) recommande de garder `v=2` en réserve jusqu'à une demande partenaire réelle.

## 2. Questions à trancher

- **Q1 Jeux** — Faut-il ouvrir Cricket (puis d'autres jeux) au lien ? À quelles conditions d'architecture ?
- **Q2 Retour vers l'onglet ouvreur** — Un canal `window.opener.postMessage` (avec repli en navigation) est-il souhaitable et sûr ?
- **Q3 Détail des volées** — Faut-il transmettre le détail par volée ? Sous quelle forme, avec quelles limites de taille ?
- **Q4 Libellé** — Faut-il un libellé fourni par le partenaire (nom d'événement, de cible) ?
- **Q5 Intégrité** — Que peut-on garantir sans secret dans le client ?
- **Q6 Identifiants** — Faut-il des identifiants opaques de joueurs fournis par le partenaire ?
- **Q7 Coexistence** — Comment `v=1` et `v=2` cohabitent-ils, et combien de temps ?
- **Q8 Transport** — Résultat en chaîne de requête (`?`) ou en fragment (`#`, non transmis au serveur) ?

## 3. État actuel vérifié dans le code

| Point | Constat | Référence |
|---|---|---|
| Version | Toute valeur de `v` autre que `1` rejette le lien | `src/features/external-match/externalMatchLink.ts:196` |
| Jeu | `game` doit valoir `x01` | `externalMatchLink.ts:197` |
| Contexte | `ExternalMatchConfig` est un `Pick<GameConfig>` propre au X01 | `src/shared/session/persistedAppSession.ts:12-16` |
| Volées | `Turn` porte `score`, `isBust`, `remainingAfter`, `dartsThrown` ; pas de détail par fléchette | `types.ts:28-34` |
| Sortie | Navigation de premier niveau, aucun `postMessage` | `App.tsx:202-209` ; spec 030 « Out of scope » |
| Sets | `sets1/2` lus dans `setsWon`, muté par `finishLeg` | `externalMatchLink.ts:456-459`, `src/application/scoring/matchLifecycle.ts:215-220` |
| Cricket | État de partie local à la vue, non sérialisé pour la reprise | compte rendu V2 §A (faiblesse 2), V2-ARCH-04 (058) |
| CSP | `frame-ancestors 'none'`, `frame-src 'none'` | `public/_headers:2` |

## 4. Contraintes

- Gratuité, sans compte, sans publicité ; aucun coût récurrent côté compteur.
- **Aucun secret ne peut être protégé dans le client** : toute signature HMAC ou clé embarquée dans le bundle est publique.
- Signature serveur rejetée le 2026-11-19 (spec 030 « Result integrity ») ; toute remise en cause passe par [ADR-0009](../../docs/adr/0009-integrations-pas-de-port-generique-premature.md) (« pas de port générique avant un deuxième canal », proposée).
- Clean Architecture : le résultat dérive de l'état produit par le moteur ; aucune règle de jeu dans l'adaptateur de contrat.
- `v=1` reste supporté sans changement (partenaire en production).
- Parcours de base inchangé : sans paramètre, rien ne change.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Statu quo `v=1` + ajouts optionnels | Pas de `v=2` | Zéro risque | Ne lève ni L1 ni L5 | 0 € | — |
| B. `v=2` minimal multi-jeux | `game=cricket` + résultat propre au jeu | Lève L1 | Dépend de V2-ARCH-04 (058) | 0 € | M |
| C. Canal `ret=opener` | `window.opener.postMessage(result, origineAutorisée)`, repli en navigation si `opener` absent | Supprime le relais `BroadcastChannel` des partenaires « nouvel onglet » | `opener` nul si `noopener` ou en-têtes COOP ; écoute d'accusé de réception à sécuriser ; amende l'exclusion `postMessage` de 030 | 0 € | M |
| D. `detail=visits` | Volées compactes (JSON → base64url) dans le retour | Lève L5 ; projection directe `Turn` → volée | Longueur d'URL ; données plus personnelles ; incompatible avec un QR (107) au-delà de quelques centaines d'octets | 0 € | M |
| E. Libellé partenaire `label` | Texte court affiché sur le setup | Lève L8 | Usurpation : le domaine doit rester affiché | 0 € | S |
| F. Signature côté compteur | HMAC ou JWT signé dans le client | — | **Impossible** : secret public | — | — |
| G. Jeton du partenaire transporté | Jeton opaque émis et vérifié par le partenaire, renvoyé tel quel | Corrélation et anti-rejeu, déjà possible en `v=1` | **Corrèle mais ne certifie pas** le score saisi | 0 € | S |

## 6. Critères d'évaluation et analyse

- **Q1** : Cricket n'est raisonnable qu'après état sérialisable et reducer pur (058), et une projection de résultat Cricket côté application ; sinon les règles seraient dupliquées dans l'adaptateur.
- **Q2** : la sécurité repose sur `targetOrigin` = origine exacte autorisée et sur la vérification de `event.origin` de tout message reçu ; `opener` est souvent nul par défaut sur les liens `target="_blank"` modernes [à confirmer par navigateur]. Repli obligatoire.
- **Q3** : `Turn` se projette en `{ joueur, manche, n° de volée, points, bust, reste, fléchettes }` sans toucher au moteur ; un match de 5 manches compte de l'ordre de 100 volées, soit quelques Ko encodés [à mesurer] ; certains serveurs limitent les URL autour de 8 Ko [à confirmer chez le partenaire]. Le fragment (`#`) évite la transmission au serveur et aux journaux.
- **Q5** : sans secret, le compteur ne peut certifier ni l'origine ni la véracité. Le jeton du partenaire (G) corrèle un retour à un match et empêche le rejeu ; la véracité ne relève que de la validation humaine (ou d'un flux d'événements en direct vers BDT, cf. V2-INT-07 / 109, qui ne certifie pas non plus les fléchettes réellement lancées).
- **Q7** : `v` absent = `1` (comportement actuel) ; `v=2` explicite ; durée de support de `v=1` à fixer par la politique d'admission (110).
- Informations externes : comportement d'`opener` et de COOP **[à confirmer]** par test navigateur ; limites d'URL des partenaires **[contact nécessaire]**.

## 7. Recommandation (non validée)

Rester en **A** tant qu'aucun besoin n'est confirmé par 106. Si un besoin est confirmé : ordre E (libellé, additif possible en `v=1`) → C (ouvreur) → D (volées, en fragment) → B (Cricket, après 058). F est écartée ; G est promue dans le guide via V2-INT-01. Toute implémentation passe par l'extraction préalable du module neutre V2-INT-03 (111).

## 8. Protocole de vérification

1. PoC hors dépôt principal (branche jetable) : ouverture par `window.open` avec et sans `noopener`, Chromium, WebKit, Firefox, réception `postMessage` sur le simulateur partenaire.
2. Mesure de la longueur d'un retour `detail=visits` pour des matchs 501 en 3, 5 et 7 manches, simple et double.
3. Vérification de la taille maximale d'URL acceptée par la page de retour du partenaire [contact nécessaire, après autorisation].

## 9. Livrables attendus de l'étude

- Tableau de décision Q1 à Q8.
- Projet de contrat `v=2` (paramètres, résultat, erreurs, coexistence).
- Projet d'ADR complémentaire à ADR-0009 si `postMessage` est retenu.
- Spec fonctionnelle `v=2` si la recommandation est retenue.

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Casser `v=1` | Élevé | Faible | Tests golden V2-INT-01 |
| Abstraction prématurée | Moyen | Moyenne | Règle des deux usages (111) |
| Fuite de données via URL longues | Moyen | Moyenne | Fragment, minimisation |
| Usurpation par `label` | Moyen | Moyenne | Domaine toujours affiché |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Cricket partenaire en V2 (H.20) | V2 / V2.x / jamais | V2.x sur demande partenaire | — |
| D2 | Autoriser `postMessage` vers l'ouvreur | oui / non | Oui après PoC, avec repli | — |
| D3 | Détail des volées | non / en fragment / en requête | En fragment, si demandé | — |
| D4 | `label` en `v=1` additif ou en `v=2` | v1 additif / v2 | v1 additif (domaine affiché) | — |
| D5 | Durée de support de `v=1` | 12 mois / illimitée | ≥ 12 mois après `v=2` | — |

## 12. Traçabilité

Rapport 08 §2.5, §2.7, §5.1 (C, D, E, G), §5.2, §7 ; rapport 02 §6.3 ; compte rendu V2 §C.10, §H.20 ; specs 030, 106, 109, 110, 111 ; V2-ARCH-04 (058).
