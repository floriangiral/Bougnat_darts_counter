---
id: 062-counter-score-input-agnostic-study
v2_id: V2-ARCH-15
titre: Étude — point d'entrée de score agnostique (caméras type Scolia)
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: archi
priorite: P3
difficulte: M
recommandation: etude
lot: 5
poids: 5
depend_de: [V2-ARCH-03]
issue: '#292'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 062 — Étude : point d'entrée de score agnostique (caméras type Scolia)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Une étude ne crée aucune exigence : si elle est retenue, elle produit une spec fonctionnelle et/ou un ADR.

## 1. Contexte et origine
- Rapport intégrations (`reports/08-integrations.md` §3.5) : Scolia publie une API d'événements de lancer ; « pour Bougnat, ce serait une source d'entrée de score au même titre que la voix ».
- Rapport innovation (`reports/09-innovation.md` §3.1, §8) : la tendance « mains libres » passe par la caméra (Autodarts, Dartsmind, Scolia) ; l'auto-scoring maison est XL et non retenu ; garder une entrée de score agnostique.
- Compte rendu : « Non retenu en V2 : caméras d'auto-scoring (étude P3 d'un point d'entrée agnostique uniquement) » (section E) ; catalogue F.7.
- Prérequis : la spec 057 (V2-ARCH-03) crée la commande X01 unique avec un champ `source`.

## 2. Questions à trancher
- Q1 : un système de comptage automatique externe peut-il alimenter Bougnat Darts **sans serveur Bougnat**, sans compte et sans coût pour l'utilisateur ?
- Q2 : la commande métier de la spec 057 suffit-elle comme point d'entrée, ou faut-il un port dédié ?
- Q3 : quelle granularité exige une source automatique (fléchette avec segment) et quel impact sur le modèle (spec 059, spec 046) ?
- Q4 : quelles conditions juridiques et commerciales (contact, licence d'API, marque) ?
- Q5 : la valeur justifie-t-elle un développement en V2.x, compte tenu des publics (clubs équipés) ?

## 3. État actuel vérifié dans le code
- [vérifié] Seules deux sources d'entrée humaines (keypad, voix) et une source automatique interne (robot) existent ; toutes aboutissent à `submitTurn` par des chemins différents (`views/MatchView.tsx:347-375`, `src/application/x01Bot/x01BotTurn.ts:144`).
- [vérifié] La saisie est par volée (total + nombre de fléchettes, `types.ts:27-33`) ; aucune entrée par fléchette n'existe en X01.
- [vérifié] CSP `connect-src` limitée à `'self'`, Deepgram et Cloudflare Insights (`public/_headers:2`) : toute connexion directe à un service tiers ou à un appareil local exigerait une modification de CSP.
- [vérifié] Aucun code ne référence Scolia, Autodarts ou un protocole d'auto-scoring.

## 4. Contraintes
Gratuité, sans compte obligatoire, sans publicité ; parcours de base inchangé ; navigateur uniquement (pas d'application native) ; règles de jeu indépendantes de la source (Clean Architecture, ADR-0002) ; pas de port générique avant un second canal réel (ADR-0009) ; contenu mixte HTTPS → HTTP local bloqué par les navigateurs [à confirmer selon l'API] ; coûts récurrents à zéro côté projet.

## 5. Options étudiées
| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Ne rien faire | Laisser la commande de la spec 057 comme seul point d'extension | Zéro coût | Aucune réponse aux clubs équipés | 0 € | — |
| B. Adaptateur navigateur direct | Le navigateur se connecte à l'API locale/cloud du système (WebSocket) et traduit les événements de lancer en commandes `source: 'camera'` | Pas de serveur Bougnat | CSP, contenu mixte, authentification fournisseur, une intégration par fabricant | 0 € projet [à confirmer] | M |
| C. Relais serveur | Un Worker reçoit les événements du fournisseur et les relaie | Contourne CSP/contenu mixte | Touche la frontière « pas de backend métier » (arbitrage H.4), secret côté serveur | Faible à modéré | L |
| D. Auto-scoring maison | Vision par caméra dans le navigateur | Indépendance | XL, concurrence forte, calibration | 0 € | XL |

## 6. Critères d'évaluation et analyse
- Scolia API — https://scoliadarts.com/api/ — consulté le 2026-11-20 : la page annonce la réception des événements détectés par les systèmes Scolia, dont « Takeout started and finished events » et « Throw events (including scores, X-Y coordinates, 3D inclined angles) », et invite à contacter Scolia pour l'intégration. Transport, authentification, licence et coût : [non documenté] ; accès : [contact nécessaire].
- Scolia — https://scoliadarts.com/ — consulté le 2026-11-20 via `reports/09-innovation.md` : matériel Home/Pro, application navigateur avec connexion obligatoire [confirmé par le rapport, non revérifié].
- Autodarts — https://autodarts.io/ — consulté le 2026-11-20 via `reports/09-innovation.md` : auto-scoring caméra (Lens, matériel), offre gratuite limitée ; existence d'une API publique pour tiers : [non documenté].
- Analyse provisoire : l'option B est la seule compatible avec les valeurs sans serveur, mais sa faisabilité dépend d'informations non publiques (transport, authentification, CORS/CSP, contenu mixte). L'événement « fléchette » impose une commande `SubmitDart` absente aujourd'hui (Q3).

## 7. Recommandation (non validée)
Ne rien développer en V2. Garantir seulement que la commande de la spec 057 accepte une `source` extensible (déjà prévu) et ne crée pas de port générique (ADR-0009). Mener, **après autorisation de prise de contact** (H.21, spec 112), un échange avec Scolia pour lever les inconnues de l'option B ; décider ensuite d'un PoC.

## 8. Protocole de vérification (PoC, mesures, terrain)
1. Obtenir la documentation d'API (contact autorisé).
2. PoC hors application (page de test locale) : connexion, réception d'un événement de lancer, conversion en `SubmitDart` simulé.
3. Mesurer : latence événement → affichage, taux d'événements corrigés (« takeout »), comportement hors ligne.
4. Vérifier : CSP nécessaire, contenu mixte, compatibilité navigateurs tablette.
5. Terrain : une soirée dans un club équipé [à confirmer : club disponible].

## 9. Livrables attendus de l'étude
Note de faisabilité (réponses Q1 à Q5), compte rendu de contact, résultat du PoC, et, si retenue : spec fonctionnelle « adaptateur de score externe » + ADR (nouveau canal d'entrée).

## 10. Risques
Dépendance à un fournisseur propriétaire ; conditions d'API incompatibles avec la gratuité ; ouverture de la CSP ; besoin de saisie par fléchette qui impacte le journal (spec 059) ; faible nombre d'utilisateurs équipés [hypothèse].

## 11. Questions ouvertes et décisions à prendre
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| D1 | Autoriser la prise de contact Scolia | Oui / non / plus tard | Plus tard, dans le programme de contacts (spec 112) | — |
| D2 | Ouvrir la CSP à un fournisseur tiers | Oui au cas par cas / jamais | Au cas par cas, documenté par ADR | — |
| D3 | Saisie par fléchette en X01 | Oui / non | Décision portée par la spec 046 (H.11) | — |
| D4 | Garder cette étude au lot 5 | Lot 5 / retrait | Lot 5 | — |

## 12. Traçabilité
- Rapports : `reports/08-integrations.md` §3.5 et V2-INT-11 ; `reports/09-innovation.md` §3.1, V2-INNO-12 ; compte rendu E, F.7, H.11, H.21.
- Specs liées : 046, 057, 059, 075, 111, 112. ADR : 0002, 0009.
- Code vérifié au commit `508dfa6`.
