---
id: 091-counter-tv-multi-screen-cast-study
v2_id: V2-TV-10
titre: Étude — multi-écrans, Google Cast, Presentation API
type: etude
statut: a-valider
validation: en-attente
origine: Étude exploratoire
famille: tv
priorite: P3
difficulte: M
recommandation: etude
lot: 5
poids: 5
depend_de: [V2-TV-05]
issue: '#293'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 091 — Étude : multi-écrans, Google Cast, Presentation API

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Une étude ne crée aucune exigence. Elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles.

## 1. Contexte et origine

La mission (§5.6) demande d'étudier « la possibilité de diffuser une même partie sur plusieurs écrans simultanément, sans en faire une exigence obligatoire avant validation », ainsi que Google Cast et les capacités web d'écrans secondaires. Le rapport `07-tv-mode.md` (§4.3, §5.1, §6.6) classe ces sujets en compléments ultérieurs (P3) : multi-écrans et spectateurs mobiles, Presentation API, Google Cast Custom Receiver, écran « mur » multi-cibles. Le compte rendu (D.2, F.5, H.19, H.22) les reporte et laisse le mur multi-cibles au backend Tournois (BDT).

## 2. Questions à trancher

- **Q1 — Multi-écrans.** Plusieurs TV et des téléphones de spectateurs peuvent-ils suivre une même partie (lien public lecture seule) ? Avec quel plafond, quelle minimisation des prénoms, quel coût ?
- **Q2 — Presentation API.** Apporte-t-elle un gain réel par rapport à la fenêtre secondaire (085) pour un écran attaché ou un Chromecast depuis Chrome ?
- **Q3 — Google Cast Custom Receiver.** Le gain pour les lieux équipés de Chromecast justifie-t-il un compte développeur, une dépendance Google et l'exclusion d'iOS ?
- **Q4 — Mur multi-cibles.** Un écran agrégeant plusieurs cibles relève-t-il du compteur ou de BDT ?
- **Q5 — Compléments sans développement.** « Caster l'onglet » (Chrome desktop) et recopie native (AirPlay, Cast d'écran) suffisent-ils comme replis documentés ?

## 3. État actuel vérifié dans le code

- [vérifié] Aucun usage de `navigator.presentation`, du SDK Cast ni de `getScreenDetails` dans `src`, `views`, `components`, `App.tsx`.
- [vérifié] CSP restrictive : `script-src 'self' 'unsafe-inline' data: https://static.cloudflareinsights.com`, `connect-src` sans domaine Google, `frame-ancestors 'none'` (`public/_headers:2`) : le SDK Cast exigerait d'ouvrir la CSP à `gstatic`.
- [vérifié] Aucune notion de session multi-écrans ; le relais proposé (087) plafonne à 20 spectateurs par salle et l'appairage (088) propose 3 TV par session.
- [vérifié] Le backend BDT (dépôt voisin) n'expose ni WebSocket ni SSE (`07-tv-mode.md` §2.3) ; la constitution transverse place « supervision/live » et « écrans live / lecture seule » côté backend (`../.specify-workspace/constitution.transverse.md:59,134`).

## 4. Contraintes

Gratuité, sans publicité, **sans compte** pour l'utilisateur final ; aucune dépendance obligatoire à Google ou Apple ; Clean Architecture (chaque technologie = un adaptateur du port de 084) ; coût récurrent nul ou chiffré ; minimisation des prénoms avant envoi ; saisie jamais bloquée.

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A. Multi-écrans via relais | N spectateurs par salle (087), lien public lecture seule, QR « Suivre sur mon téléphone » | Aucun SDK, levier d'adoption en bar | Exposition des prénoms, abus, connexions facturées | Connexions DO (messages sortants gratuits) [EXT] | Faible (sur 087) |
| B. Presentation API | `PresentationRequest` vers écran attaché ou Cast « 1-UA » | 2 étapes, sans serveur pour un écran attaché | Chrome/Edge seulement, expérimental ; receveur à stockage isolé (`PresentationConnection` obligatoire) | 0 € | Moyenne |
| C. Google Cast Custom Receiver | Web Sender + receveur = page TV connectée au relais | Bouton Cast natif, bars équipés | Compte développeur 5 $, receveur enregistré, CSP `gstatic`, **pas d'iOS Chrome**, Safari/Firefox non listés, relais toujours requis | 0 € + 5 $ unique | Élevée |
| D. Mur multi-cibles | Projection agrégée de plusieurs sessions | Événements associatifs | Agrégation multi-sessions = supervision live ; relève de BDT | Variable | Élevée |
| E. Replis documentés | « Caster l'onglet », AirPlay, Cast d'écran, HDMI miroir | Aucun développement | Recopie (sauf onglet TV casté), qualité variable | 0 € | Nulle |

## 6. Critères d'évaluation et analyse

Sources consultées le 2026-11-20 (reprises du rapport 07) :
- Presentation API : BCD MDN — Chrome/Edge, Android Chrome, Samsung Internet ; pas Firefox, Safari, iOS [confirmé] ; écrans secondaires attachés Chrome 66+ sur ChromeOS, Linux, Windows [confirmé, blog Chrome] ; Cast « 1-UA » depuis desktop [envisageable, PoC nécessaire].
- Google Cast Web Sender : « Casting is not supported on the iOS Chrome browser » [confirmé, developers.google.com/cast/docs/web_sender] ; enregistrement 5 $ non remboursables [confirmé, /cast/docs/registration] ; Safari/Firefox [non documenté].
- Window Management API : Chrome/Edge 100+ desktop [confirmé] — traitée en amélioration progressive par 085.
- Durable Objects : messages WebSocket sortants non facturés, entrants comptés 1 pour 20 [confirmé] ; coût d'un spectateur ≈ ses (re)connexions et battements [envisageable, à mesurer].
- AirPlay : recopie de l'écran seulement pour une page web [confirmé, support.apple.com/102661].

Analyse :
- **A** apporte la plus forte valeur (bar, événement) au coût le plus bas, mais pose la question des prénoms : initiales par défaut sur un lien public, renouvellement du lien, plafond.
- **B** n'apporte qu'un confort sur Chrome desktop, déjà couvert à 80 % par la fenêtre secondaire et la Window Management API.
- **C** réintroduit un compte (développeur) et une dépendance Google ; utile seulement pour des lieux équipés de Chromecast sans navigateur.
- **D** contredit la frontière transverse : à laisser à BDT ; le compteur peut fournir sa projection (084) à BDT via le cadrage 109 (V2-INT-07).

## 7. Recommandation (non validée)

1. Retenir **A** comme prochaine spec fonctionnelle (« Spectateurs mobiles et multi-écrans ») après 087/088 : lien public lecture seule, initiales par défaut, plafond 20, renouvellement.
2. **B** : PoC court ; spec seulement si le PoC montre un gain net sur Chromecast depuis Chrome desktop.
3. **C** : reporter (P3+) ; ré-examiner sur demande de lieux équipés.
4. **D** : hors compteur ; renvoyer à BDT et à 109.
5. **E** : documenter dans le guide (037) comme replis.

## 8. Protocole de vérification (PoC, mesures, terrain)

- PoC-A : 20 spectateurs simulés sur une salle 087 pendant 2 h ; mesurer requêtes facturées, latence p95, comportement au renouvellement du lien.
- PoC-B : `PresentationRequest('/tv?presentation=1')` vers un écran HDMI (Windows, ChromeOS) et vers un Chromecast ; vérifier le canal `PresentationConnection`, la latence et la stabilité 30 min.
- PoC-C (si demandé) : receveur de développement enregistré sur un appareil de test, mesure de la charge CSP et du parcours.

## 9. Livrables attendus de l'étude

Rapport de PoC chiffré ; recommandation arbitrée ; selon décision : spec fonctionnelle « Spectateurs mobiles et multi-écrans », éventuelle spec « Adaptateur Presentation API », note au backlog BDT pour le mur multi-cibles ; contenu de repli pour le guide (037).

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Lien public largement partagé | Moyen | Moyenne | Initiales, plafond, renouvellement, TTL |
| Dépendance Google (Cast) | Moyen | — | Report, adaptateur isolé |
| Dispersion de l'effort | Moyen | Moyenne | P3, PoC courts, critères de sortie |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Spectateurs publics par lien (H.18) | Autoriser / refuser | Autoriser, initiales par défaut | — |
| 2 | Plafond d'écrans par session | 3 / 20 / illimité | 20 (relais), 3 TV appairées | — |
| 3 | Google Cast (H.19) | Reporter / PoC / spec | Reporter | — |
| 4 | Presentation API | PoC / abandon | PoC court | — |
| 5 | Mur multi-cibles (H.22) | Compteur / BDT | BDT | — |

## 12. Traçabilité

Rapports : `07-tv-mode.md` §4.3, §4.5, §5.1, §6.6, §8 (V2-TV-10, 13, 14, 16 du rapport) ; compte rendu C.6, D.2, F.5, H.18, H.19, H.22. Specs : 087, 088, 085, 084, 109, 037.
