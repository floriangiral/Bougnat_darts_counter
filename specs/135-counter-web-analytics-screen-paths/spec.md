---
id: 135-counter-web-analytics-screen-paths
v2_id: V2-OBS-02
titre: Mesure d'audience par jeu et par étape du parcours (Cloudflare Web Analytics)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande V2
famille: innovation
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: []
remplace: []
remplacee_par: []
issue: '#357'
verifie_au_commit: 7ffc6d9
derniere_revue: 2026-11-27
---

# 135 — Mesure d'audience par jeu et par étape du parcours

> **Statut : IMPLÉMENTÉE, validation terrain en attente (AC-02).** Validée le 2026-11-27 par le product owner (« faut implémenter cela »), avec les recommandations du §24. Elle revient sur le retrait de la [spec 024](../024-counter-spa-pageviews-retired/spec.md).

## 1. Origine et contexte

Demande du product owner du 2026-11-27 : savoir à quoi jouent les joueurs, connaître le parcours utilisateur, la rapidité du site et la provenance (pays, source), bref « tout ce que Cloudflare met à disposition ». La configuration de Cloudflare Web Analytics par environnement a été corrigée le même jour ([docs/technical.md](../../docs/technical.md#observabilité-web-cloudflare-web-analytics)). Les questions « quel jeu » et « quel parcours » restent sans réponse : c'est l'objet de cette spec.

Le sujet a déjà été traité : la spec 024 (pages vues d'une application monopage) a été retirée en v1.1 « pour éviter des événements analytics métier dans le runtime open source ». La question H.27 du compte rendu d'audit V2 (`docs/v2/compte-rendu-audit-2026-11-20.md:440`) et la piste P17 (`docs/v2/audit/09-innovation.md:64`) restent ouvertes.

## 2. Problématique

Cloudflare Web Analytics ne connaît de la page que son chemin d'URL. Or l'application n'en change jamais : toutes les pages vues sont attribuées à `/`. On ne voit donc ni le jeu choisi, ni l'étape du parcours.

## 3. Objectifs

- O1 Connaître la répartition des parties par jeu (X01, Cricket, Capital, Triathlon, Killer, Gotcha, 180 Around the Clock), par environnement.
- O2 Estimer l'entonnoir accueil → choix du jeu → préparation → partie → fin de partie, jeu par jeu.
- O3 Attribuer les Core Web Vitals (LCP, INP, CLS) à l'écran concerné plutôt qu'à `/` [à confirmer, §4].
- O4 Sans cookie, sans donnée personnelle, sans dépendance ni backend ajoutés, coût 0 €.

## 4. État actuel vérifié dans le code

- [vérifié] `index.tsx:24-50` injecte `https://static.cloudflareinsights.com/beacon.min.js` avec `VITE_CF_WEB_ANALYTICS_TOKEN`. Il ne le fait pas si un beacon est déjà présent ou si la page s'ouvre sur un lien partenaire (spec 030).
- [vérifié] `src/app/useAppScreenHistory.ts:20-80` appelle `history.pushState` / `replaceState` **sans URL** : le chemin reste `/`. Par défaut, le beacon suit les navigations d'application monopage ([documentation](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)). Il compte donc chaque changement d'écran comme une page vue (type « Routing APIs »), mais toujours sur `/`.
- [vérifié] Écrans possibles : `src/app/appScreens.ts:1-18` (`HOME`, `SETTINGS`, `GAME_SELECTION`, `SETUP`, `MATCH`, `STATS`, `<JEU>_GAME`, `<JEU>_STATS`, `ATC180_GAME`).
- [vérifié] Hors ligne, le service worker renvoie la coquille `/` pour toute navigation (`public/sw.js:7,38-47`). `public/_routes.json` ne dirige que `/api/*` vers les Functions. Aucun `404.html` n'est publié : Cloudflare Pages sert donc `index.html` pour un chemin inconnu, comme pour toute application monopage.
- [vérifié] `public/manifest.json:7-8` : `start_url` `/?source=pwa`, `scope` `/`. Le beacon ne transmet pas la chaîne de requête : le 2026-11-27, son champ `location` ne contenait que l'origine et le chemin. On ne peut donc pas distinguer les lancements depuis l'application installée.
- [vérifié] Tableau de bord du 12 au 26 novembre 2026 (production et préprod confondues, avant correction) : 1 010 pages vues, 870 visites, chemin unique `/`, 140 navigations « Routing APIs ».
- [à confirmer] Attribution des Core Web Vitals au chemin courant après une navigation d'application monopage : la documentation Cloudflare ne le précise pas.

## 5. Comportement cible

Option recommandée (A) : chaque écran reflète un **chemin virtuel** stable, sans donnée personnelle, que le beacon relève de lui-même.

| Écran | Chemin |
|---|---|
| `HOME` | `/` |
| `SETTINGS` | `/reglages` |
| `GAME_SELECTION` | `/jeux` |
| `SETUP` | `/<jeu>/preparation` |
| `MATCH`, `<JEU>_GAME` | `/<jeu>/partie` |
| `STATS`, `<JEU>_STATS` | `/<jeu>/fin` |

`<jeu>` ∈ `x01`, `cricket`, `capital`, `triathlon`, `killer`, `gotcha`, `180-around-the-clock`.

Le chemin est un **reflet**, jamais une entrée. Au chargement, l'application ignore le chemin reçu et restaure l'écran comme aujourd'hui (session sauvegardée ou accueil). Elle réécrit ensuite le chemin de l'écran affiché.

Options écartées (voir Q1) :

- B — compteurs exacts via Workers Analytics Engine et une Pages Function. Les chiffres seraient précis (formats, nombre de joueurs, robot, voix), mais il faudrait une nouvelle route serveur, une liaison dans `wrangler.jsonc` et un stockage d'événements. C'est contraire à la frontière « pas de stats cloud » tant qu'aucune décision dédiée ne la lève.
- C — Cloudflare Zaraz : script tiers supplémentaire et ouverture de la CSP, sans tableau de bord d'analyse propre.

## 6. Périmètre

### Inclus

- Chemins virtuels par écran (tableau §5), en production et en préprod.
- Normalisation du chemin au chargement et lors de la navigation arrière.
- Documentation de lecture des tableaux de bord.

### Exclu

- Événements métier, identifiants de partie, prénoms, scores, durée de partie.
- Liens partenaires (spec 030) : l'application ne charge toujours pas le beacon.
- Lien profond : ouvrir `/cricket/partie` ne lance pas de partie.
- Options B et C (§5), sauf décision contraire.

## 7. User stories

- En tant que product owner, je veux voir le nombre de pages vues par jeu et par étape, afin de prioriser les jeux et de repérer les abandons.
- En tant que joueur, je veux que l'URL ne contienne aucune donnée me concernant, afin de pouvoir la partager sans risque.

## 8. Règles métier

- RM-01 Un chemin ne contient que le jeu et l'étape, jamais de prénom, de score ni d'identifiant.
- RM-02 Le chemin n'influence ni l'écran restauré ni la partie.
- RM-03 Le chemin ne change pas pendant une partie, sauf au passage à l'écran de fin.

## 9. Parcours utilisateurs

Accueil `/` → « Jouer » `/jeux` → Cricket `/cricket/preparation` → « Lancer » `/cricket/partie` → victoire `/cricket/fin` → « Revanche » `/cricket/partie` → « Sortie » `/`.

## 10. Exigences fonctionnelles

- FR-01 `useAppScreenHistory` (ou une façade `src/features/*`) dérive le chemin de l'écran et du jeu sélectionné, puis le transmet à `pushState` / `replaceState`.
- FR-02 La dérivation est une fonction pure testée : (écran, jeu) → chemin.
- FR-03 Au chargement, un chemin inconnu ou incohérent est remplacé (`replaceState`) par celui de l'écran affiché.
- FR-04 La chaîne de requête et le fragment existants sont conservés lors de la réécriture (compatibilité avec la spec 030 et `?mode=`).
- FR-05 `index.tsx` n'est pas modifié sans nécessité : le beacon suit seul les navigations.

## 11. Exigences non fonctionnelles

- NFR-01 Confidentialité : aucune donnée personnelle dans le chemin, aucun cookie ; liens partenaires non mesurés.
- NFR-02 Coût 0 €, aucune dépendance ni route serveur ajoutée.
- NFR-03 Hors ligne : la navigation vers un chemin virtuel sert la coquille en cache.
- NFR-04 Compatibilité iOS 12 (spec 018) : `pushState` avec une URL relative est pris en charge.

## 12. Cas nominaux et alternatifs

- Rechargement sur `/x01/partie` avec une session active : la partie est restaurée et le chemin reste `/x01/partie`.
- Rechargement sur `/x01/partie` sans session : accueil, chemin réécrit en `/`.
- Navigation arrière : l'écran précédent et son chemin sont rétablis.

## 13. Cas limites

- Application installée lancée sur `start_url` : chemin `/`, puis écran restauré.
- Ancien service worker sans repli pour un chemin virtuel : Pages renvoie `index.html` par le réseau.
- Partage du lien de l'application (QR, Web Share) : il utilise `VITE_APP_URL`, pas `location` (à vérifier pendant l'implémentation).

## 14. Gestion des erreurs

Un écran sans correspondance garde le chemin `/` ; aucune erreur n'est affichée.

## 15. Impacts architecturaux

Couche `src/app` (historique d'écran) ou nouvelle façade `src/features/analytics-paths`. Aucune dépendance vers `src/domain`.

## 16. Impacts sur les données et les interfaces

Aucun schéma persisté modifié. L'URL visible dans la barre d'adresse change selon l'écran.

## 17. Compatibilité avec l'existant

Les liens existants `/?v=1&game=…` (spec 030) et `/?mode=…` sont inchangés : chemin `/`, chaîne de requête conservée.

## 18. Dépendances

Configuration Web Analytics corrigée par environnement (2026-11-27, `docs/technical.md`) ; spec 030 (exclusion des liens) ; spec 044 Q1 (mesure terrain de l'INP).

## 19. Critères d'acceptation

- AC-01 Depuis l'accueil, choisir Cricket puis lancer une partie fait passer l'URL par `/jeux`, `/cricket/preparation` puis `/cricket/partie` (test unitaire du hook).
- AC-02 Dans Web Analytics (préprod), la dimension « Path » affiche au moins `/jeux` et `/cricket/partie` après une recette manuelle.
- AC-03 Rechargement sur un chemin virtuel sans session : accueil et chemin `/` (test unitaire).
- AC-04 Aucun prénom ni score dans un chemin (test de la fonction de dérivation sur tous les écrans).
- AC-05 Lien partenaire : l'application n'installe pas de beacon et conserve la chaîne de requête (tests existants verts).

## 20. Scénarios de tests

Unitaires : dérivation écran → chemin ; hook d'historique (push, replace, popstate, chemin inconnu). E2E (CI) : parcours Cricket avec vérification de `location.pathname`. Terrain : lecture du tableau de bord préprod.

## 21. Exigences de non-régression

Navigation arrière, plein écran, mise à jour différée du service worker, restauration de session, liens partenaires.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Un utilisateur partage `/x01/partie` | Faible | Moyenne | Le chemin n'ouvre rien : accueil ou session locale |
| Pages vues gonflées par les allers-retours entre écrans | Faible | Certaine | Lire les visites et les ratios, pas les volumes bruts |
| Web Vitals attribués au mauvais écran | Moyen | Inconnue | Vérifier en préprod avant de les exploiter (§4) |

## 23. Décisions architecturales

Aucun ADR : le choix reste local à l'historique d'écran. L'option B exigerait un ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mode de mesure | A chemins virtuels / B Analytics Engine / C Zaraz / renoncer | A, sans dépendance ni backend | Retenu : A (PO, 2026-11-27) |
| Q2 | Granularité du chemin | jeu + étape / + format X01 (`/x01-501/…`) / + nombre de joueurs, robot, 2v2 | Jeu + étape d'abord : chaque dimension ajoutée multiplie les chemins | Retenu : jeu + étape (PO, 2026-11-27) |
| Q3 | URL visible qui change selon l'écran | accepter / refuser (alors pas de mesure par écran avec Cloudflare) | Accepter | Retenu : accepter (PO, 2026-11-27) |
| Q4 | Lancements de l'application installée | `start_url` `/app` / inchangé | Inchangé dans cette spec (identité d'installation à étudier) | Retenu : inchangé (PO, 2026-11-27) |
| Q5 | Spec 024 | reste `retiree` et renvoie à 135 / rouvrir 024 | Reste `retiree` ; 135 la remplace sur le fond | Retenu : 024 reste `retiree` (PO, 2026-11-27) |

## 25. Traçabilité

Spec 024 (retirée), spec 030 (Q4, C14), spec 044 (Q1), `docs/v2/audit/09-innovation.md` (P17), `docs/v2/compte-rendu-audit-2026-11-20.md` (H.27), [documentation Web Analytics](https://developers.cloudflare.com/web-analytics/).

## Implémentation (2026-11-27)

Décisions : le product owner a demandé l'implémentation le 2026-11-27 (« faut implémenter cela ») ; les recommandations de Q1 à Q5 sont retenues et restent modifiables en revue de PR.

Livré au commit `7ffc6d9` :

- `src/app/appScreenPath.ts` : dérivation pure (écran, jeu) → chemin (FR-02). Elle vit dans `src/app`, à côté de `appScreens.ts`, pour ne pas faire dépendre `src/features` de `src/app`.
- `src/app/useAppScreenHistory.ts` : chaque `replaceState` / `pushState` reçoit le chemin de l'écran, avec la chaîne de requête et le fragment courants (FR-01, FR-03, FR-04) ; `App.tsx` lui transmet le jeu sélectionné. `index.tsx` est inchangé (FR-05).

Preuves :

| Critère | Preuve |
|---|---|
| AC-01 | `tests/unit/app/useAppScreenHistory.test.ts` (« mirrors the game and the step… ») ; `tests/e2e/navigation.smoke.spec.ts` et `tests/e2e/gameplay-entry.smoke.spec.ts` (CI) |
| AC-02 | À faire après déploiement en préprod et neutralisation gratuite de l'injection de zone (voir `docs/technical.md`) : `validation` reste `en-attente` |
| AC-03 | `tests/unit/app/useAppScreenHistory.test.ts` (« rewrites an unknown or stale path… ») ; vérifié à la main sur le build (`/x01/partie` sans partie → `/`) |
| AC-04 | `tests/unit/app/appScreenPath.test.ts` (tous les écrans × tous les jeux) |
| AC-05 | `tests/unit/app/useAppScreenHistory.test.ts` (« keeps the query string… ») ; suites `externalMatch*` vertes |

Constats faits pendant l'implémentation :

- Comptage du beacon, mesuré le 2026-11-27 en préprod avec des envois interceptés et bloqués : une page vue pour `pushState` et pour `replaceState` vers une **autre** URL ; aucune pour `replaceState` ou un retour arrière vers la même URL. Le hook ne produit donc qu'une page vue par changement d'écran.
- Défaut antérieur conservé, hors périmètre : à chaque changement d'écran, l'entrée courante reçoit le nouvel écran avant l'ajout de la suivante. Le premier retour arrière revient donc sur une entrée du même écran et ne change rien ; il en faut un second pour revenir à l'écran précédent. En partie, ce comportement évite aussi une sortie de partie au premier geste de retour sur Android. Le corriger change l'expérience en partie : à traiter dans une spec dédiée. Chaque entrée porte désormais le chemin de l'écran qu'elle restaure (test « keeps every history entry on the path… »).
- Vérification manuelle sur le build (`vite preview`) : `/` → `/jeux` → `/cricket/preparation` → `/cricket/partie` ; rechargement sur `/cricket/partie` avec la partie restaurée ; Cloudflare Pages sert `index.html` (200) sur ces chemins (vérifié en préprod).

