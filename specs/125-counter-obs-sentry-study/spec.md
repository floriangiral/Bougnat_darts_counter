---
id: 125-counter-obs-sentry-study
v2_id: V2-OBS-01
titre: Étude — observabilité des erreurs en production (Sentry) compatible RGPD, CSP et gratuité
type: etude
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P2
difficulte: M
recommandation: etude
lot: 2
poids: 10
depend_de: []
issue: '#313'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 125 — Étude : observabilité des erreurs en production (Sentry) compatible RGPD, CSP et gratuité

> **Statut : À VALIDER.** Une étude ne crée aucune exigence. Elle produit une recommandation et, si elle est retenue, une ou plusieurs specs fonctionnelles et/ou un ADR.

## 1. Contexte et origine

La demande DevSecOps (§18) impose Sentry (offre gratuite) pour suivre les erreurs JavaScript en production, les versions déployées et les régressions, **sans** collecter de données personnelles (noms de joueurs, contenus de parties, audio, jetons, stockage local), sans Session Replay par défaut, et sans que Sentry devienne une dépendance critique. Le produit est « sans compte, sans backend métier » (`AGENTS.md` §1) et n'a aujourd'hui **aucune** information de confidentialité dans l'application. Ces tensions justifient une étude avant toute exigence.

## 2. Questions à trancher

- Q1 Faut-il un suivi d'erreurs tiers, et lequel ?
- Q2 Quelles données sont envoyées, et comment garantir l'absence de données personnelles ?
- Q3 Base légale, information et éventuel consentement (RGPD, ePrivacy) ?
- Q4 Impact CSP, poids du bundle, fonctionnement hors ligne et en cas d'indisponibilité ?
- Q5 Source maps et identification des versions avec un déploiement Cloudflare Pages déclenché par branche miroir ?

## 3. État actuel vérifié dans le code

- [vérifié] Aucune gestion globale d'erreur : pas d'`ErrorBoundary` React, pas d'écouteur `error`/`unhandledrejection` (`git grep`) ; une erreur de rendu produit un écran blanc sans trace.
- [vérifié] Seul service tiers côté client : beacon Cloudflare Web Analytics, injecté si un jeton est fourni (`index.tsx:24-31`) ; CSP `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://cloudflareinsights.com` (`public/_headers:2`).
- [vérifié] Données sensibles possibles dans le contexte d'erreur : prénoms dans l'URL du lien partenaire (`?p1=Alice&p2=Bob`, `docs/integration/external-match-link.md:36`), adresse de retour partenaire, état de partie en IndexedDB (`src/infrastructure/local/IndexedDBSessionRepository.ts`), jeton Deepgram éphémère côté client (`src/features/x01/voice/deepgramClient.ts`).
- [vérifié] Version de build exposée : `VITE_APP_VERSION` = SHA de commit dans les workflows (`promote-preprod.yml:38`), mais le bundle publié est construit par Cloudflare Pages depuis `preprod`/`production` (`docs/technical.md`, section « Flux GitHub Actions ») [valeur de version côté Cloudflare à confirmer].
- [vérifié] Aucune page ni mention de confidentialité dans l'application ; l'information vocale est traitée par V2-VOICE-09 (spec 080).

## 4. Contraintes

Gratuité (0 €), aucun compte utilisateur, aucune donnée personnelle, aucun Session Replay, aucune dégradation hors ligne, scoring indépendant du service, CSP stricte, budgets de bundle (044), Clean Architecture (aucune dépendance du domaine vers l'observabilité).

## 5. Options étudiées

| Option | Description | Avantages | Inconvénients | Coût récurrent | Complexité |
|---|---|---|---|---|---|
| A — Statu quo + ErrorBoundary | Écran d'erreur récupérable, aucune remontée | Aucune donnée envoyée | Erreurs terrain invisibles | 0 € | Faible |
| B — Sentry Developer, erreurs seules | SDK chargé en différé, `sendDefaultPii: false`, URL et breadcrumbs nettoyés, région UE | Diagnostic réel, versions, alertes e-mail | Compte tiers (1 utilisateur), 5 000 erreurs/mois, rétention 30 jours, mise à jour de la politique de confidentialité | 0 € dans le quota | Moyenne |
| C — Sentry via tunnel (Pages Function) | Envoi vers `/api/…` relayé à Sentry | Pas d'ajout CSP, contourne les bloqueurs | Ajoute un relais serveur (frontière « pas de backend métier » à arbitrer, ADR) | 0 € (quota Functions) [à confirmer] | Élevée |
| D — Remontée maison minimale | `navigator.sendBeacon` vers une Function + stockage | Contrôle total | Backend et stockage à maintenir | ≈ 0 € mais maintenance | Élevée |
| E — GlitchTip ou Sentry auto-hébergé | Compatible SDK Sentry | Données maîtrisées | Hébergement payant ou à maintenir | > 0 € | Élevée |

## 6. Critères d'évaluation et analyse

- [confirmé] Offre Sentry « Developer » : 0 $, un utilisateur, suivi d'erreurs et traces, alertes par e-mail, 5 000 erreurs, rétention de 30 jours, 50 replays — sentry.io/pricing, consulté le 2026-11-20.
- [confirmé] Stockage des données au choix États-Unis ou **Union européenne (Francfort)**, choisi à la création de l'organisation — docs.sentry.io « Data Storage Location », consulté le 2026-11-20.
- [confirmé] La collecte des données utilisateur (IP, en-têtes) dépend de `sendDefaultPii` ; chaînes de requête, breadcrumbs et noms de transaction peuvent contenir des données sensibles et doivent être nettoyés (`beforeSend`, `beforeBreadcrumb`) — docs.sentry.io « Scrubbing Sensitive Data (React) », consulté le 2026-11-20.
- [envisageable] Programme Sentry pour l'open source (compte offert sur candidature) — sentry.io/for/open-source, consulté le 2026-11-20 [conditions à confirmer].
- [à confirmer] Poids du SDK navigateur minimal (erreurs seules) au regard du budget 044 ; chargement différé après le premier rendu.
- [contact nécessaire] Qualification juridique : un suivi d'erreurs strictement technique, sans identifiant ni cookie, peut relever de l'intérêt légitime avec information ; l'adresse IP transmise au transport reste une donnée personnelle côté Sentry (option « ne pas stocker les IP » côté projet) — avis à obtenir, aucune affirmation ici.
- [vérifié] CSP : l'option B exige d'ajouter le domaine d'ingestion de la région choisie à `connect-src` (`public/_headers:2`) [domaine exact à confirmer à la création du projet].
- [à confirmer] Source maps : téléversement par jeton d'API depuis le build Cloudflare Pages ou depuis un workflow ; sinon piles minifiées (lisibles partiellement).

## 7. Recommandation (non validée)

Étape 1 (indépendante de Sentry, recommandée quelle que soit la décision) : `ErrorBoundary` racine et écran « Une erreur est survenue — reprendre la partie » qui préserve la session X01 persistée.
Étape 2 : option B en **opt-in projet** limité à la production : erreurs seules (pas de traces, pas de replay, pas de profilage), échantillonnage 100 % des erreurs plafonné par filtres d'ingestion, `sendDefaultPii: false`, stockage des IP désactivé, région UE, `beforeSend` qui supprime chaînes de requête, fragments, breadcrumbs de console et d'interface, et toute valeur provenant du stockage local ; version = SHA ; alertes e-mail sur nouvelle erreur et régression. Mise à jour de la documentation de confidentialité avant activation. L'option C n'est envisagée que si les bloqueurs rendent B inutile, avec ADR.

## 8. Protocole de vérification (PoC, mesures, terrain)

1. Projet Sentry de test (organisation UE) ; SDK en différé sur une branche d'étude ; mesure du poids ajouté (044).
2. Erreur provoquée sur une URL contenant `p1=Alice&p2=Bob` : vérifier dans Sentry l'absence des prénoms, de l'adresse de retour, de l'IP et de tout contenu de partie.
3. Hors ligne et domaine Sentry bloqué : l'application et le scoring fonctionnent, aucune erreur visible.
4. Vérifier la CSP en preprod (rapport de violation absent).
5. Estimer le volume mensuel d'erreurs (quelques semaines en preprod) face au quota de 5 000.

## 9. Livrables attendus de l'étude

Rapport (mesures, captures d'événements nettoyés), avis de confidentialité à intégrer, décision PO, puis spec fonctionnelle « Observabilité des erreurs » et éventuel ADR (option C).

## 10. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Fuite de prénoms ou d'URL partenaire | Élevé | Moyenne sans nettoyage | `beforeSend` testé, test automatisé du nettoyage |
| Quota dépassé (boucle d'erreurs) | Faible | Moyenne | Filtres d'ingestion, limitation côté SDK ; perte d'événements sans coût |
| Dépendance perçue au service | Moyen | Faible | Chargement différé, aucun appel bloquant |
| Atteinte à la promesse « sans pistage » | Moyen | Moyenne | Information claire, opt-out documenté, A ou B selon arbitrage |

## 11. Questions ouvertes et décisions à prendre

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Adopter un suivi d'erreurs tiers | A / B / C / D / E | Étape 1 (A) immédiatement ; B après étude et information | — |
| Q2 | Périmètre de collecte | Erreurs seules / + traces | Erreurs seules | — |
| Q3 | Consentement utilisateur | Information seule / opt-in | Information seule si l'avis juridique le permet ; sinon opt-in dans les réglages | — |
| Q4 | Source maps | Aucune / téléversées | Téléversées si possible sans jeton exposé au build public ; sinon aucune | — |
| Q5 | Environnements | Production seule / + preprod | Production + preprod (projets séparés ou environnements) | — |
| Q6 | Candidater au programme open source Sentry | Oui / non | Non au départ (le quota Developer suffit) | — |

## 12. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (§7 Sentry) ; demande DevSecOps §18 ; specs 006, 030, 044, 080, 113, 127 ; compte rendu V2 §H.4 (relais serveur optionnel) et §H.27 (mesure d'adoption).
