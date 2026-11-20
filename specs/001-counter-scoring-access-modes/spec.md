---
id: 001-counter-scoring-access-modes
v2_id: V2-ARCH-12
type: fonctionnel
statut: a-revoir
validation: en-attente
statut_reel: "Contredite par le code : mode `social` inexistant, garde `isScreenAllowedForAccessMode` non branché."
traitement_propose: "Revoir intégralement (absorbe workspace 007)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 001 - counter scoring access modes

## Meta

- ID: `001-counter-scoring-access-modes`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#70`

## Objectif

Rendre explicites les modes applicatifs :

- `social`
- `dedicated_tablet`
- `personal_phone`

Cette spec couvre uniquement les frontieres de mode et les contrats frontend. Elle ne reintroduit aucune dependance runtime obligatoire a un backend et ne modifie pas les regles de scoring.

## Decisions

- l app shell expose une resolution de mode (query param > env > fallback)
- en mode `dedicated_tablet` / `personal_phone`, seules les surfaces de scorage restent accessibles
- la resolution du mode reste locale, explicite et testable
- le mode ne change pas les regles de score, seulement les surfaces visibles

## Impacted Code

- `src/app/appShell.ts`
- `src/lib/env.ts`
- `views/HomeView.tsx`
- `views/MatchView.tsx`

## Canonical Entry Points

- `getAppAccessMode`
- `isScreenAllowedForAccessMode`
- `resolveAppAccessMode`

## Key Tests

- `tests/unit/app/appShell.test.ts`

## Validation

- tests unitaires app shell (resolution + garde-fous)

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée. Le contenu historique ci-dessus est conservé tel quel. Alias V2 : `V2-ARCH-12` (P2, difficulté M, lot 2, poids 10). Traitement proposé : révision intégrale ; absorbe le backlog workspace `007-xrepo-smartphone-vs-tablet-access-bounds`.

### Constats vérifiés (code, commit `508dfa6`)
- [vérifié] Les modes réels sont `local`, `dedicated_tablet`, `personal_phone` (`src/app/appShell.ts:8`, `63`) ; le mode `social` décrit par la spec n'existe pas.
- [vérifié] Résolution : paramètre `?mode=` prioritaire, puis `VITE_APP_ACCESS_MODE` (défaut `local`, `src/lib/env.ts:45`), puis `local` ; valeur inconnue → `local` (`src/app/appShell.ts:88-107`).
- [vérifié] Le garde-fou `isScreenAllowedForAccessMode` ignore son paramètre `_mode`, refuse `HOME` pour tous les modes, y compris `local` (`src/app/appShell.ts:65-80`, `109-112`), et n'est appelé que par les tests (`tests/unit/app/appShell.test.ts:33-37`) : il est **inopérant**.
- [vérifié] Le seul effet du mode à l'exécution : `dedicated_tablet` force la mise en page tablette dès 768 px de large (`src/features/tablet/tabletLayout.ts:36`, via `src/features/tablet/useTabletLayout.ts:14`). `personal_phone` n'a **aucun effet**.
- [vérifié] L'E2E tablette force `?mode=dedicated_tablet` et passe par l'écran d'accueil (« Lancer une partie ») (`tests/e2e/tablet-layout.smoke.spec.ts:17-18`) : il contourne la détection réelle et démontre que `HOME` reste accessible dans ce mode.
- [vérifié] `views/HomeView.tsx` et `views/MatchView.tsx`, cités par la spec, n'utilisent pas le mode.
- [vérifié] Le paramètre `mode` est conservé lors du nettoyage de l'URL du lien partenaire (`tests/unit/externalMatch/externalMatchLink.test.ts:302`).
- [vérifié] Dépendance inversée : `src/features/tablet/tabletLayout.ts:1` importe le type `AppAccessMode` depuis `src/app/` (violation V3 traitée par la spec 056).
- [vérifié] Aucun mode « lecture seule » n'existe ; la diffusion TV n'existe pas (`src/features/x01/session/useSharedX01Session.ts:11-21` est un no-op).
- Constitution transverse §9 : distinguer à terme tablette dédiée administrée, smartphone personnel à périmètre borné, écrans live en lecture seule et backoffice, sans partager aveuglément droits et flux.

### Écarts avec la spec
| Élément de la spec 001 | Réalité |
|---|---|
| Modes `social`, `dedicated_tablet`, `personal_phone` | `local`, `dedicated_tablet`, `personal_phone` |
| « Seules les surfaces de scorage restent accessibles » en tablette/téléphone | Garde jamais appelé ; toutes les surfaces accessibles |
| « Le mode ne change pas les règles de score, seulement les surfaces visibles » | Il ne change aucune surface ; il ne change que la mise en page (tablette forcée) |
| Code impacté `HomeView.tsx`, `MatchView.tsx` | Non concernés |
| Tâches toutes cochées | Garde non branché ; tests unitaires seulement |

### Exigences proposées
- V2-FR-01 : le **mode d'usage** (rôle de l'appareil) est distinct de la **classe de taille** (mise en page, spec 070, ADR-0007) ; la mise en page ne lit plus le mode.
- V2-FR-02 : modes proposés (liste soumise à Q1) : `local` (défaut, parcours ouvrir → jeu → prénoms → jouer inchangé) ; `dedicated_tablet` (station de club ou de bar) ; `spectator` (écran de diffusion en lecture seule). L'état « contrôleur TV » est un état dynamique d'un appareil `local` ou `dedicated_tablet` qui diffuse (Q2).
- V2-FR-03 : chaque mode déclare explicitement ses écrans autorisés, son écran d'entrée, ses capacités (saisie, micro, persistance de la partie, diffusion) dans une table unique et testée.
- V2-FR-04 : le garde est appliqué à l'exécution à chaque navigation et à la restauration de session ; un écran non autorisé redirige vers l'écran d'entrée du mode.
- V2-FR-05 : `spectator` n'embarque aucun moyen d'émettre une commande de jeu (lecture seule par construction, ADR-0005), ne demande jamais le micro, n'écrit ni ne restaure la session de contrôle et ne charge pas les modules de saisie ni de voix ; il est détecté avant la restauration de session.
- V2-FR-06 : `dedicated_tablet` démarre sur la sélection des jeux, masque l'accueil, demande confirmation avant de quitter une partie et reprend automatiquement la partie en cours (spec 010) ; il n'ajoute aucune étape au parcours de base.
- V2-FR-07 : la résolution reste locale, sans réseau : paramètre d'URL > variable d'environnement > `local` ; valeur inconnue → `local`.
- V2-FR-08 : `personal_phone` est retiré ou redéfini selon Q3 ; une URL contenant `?mode=personal_phone` continue de fonctionner (alias vers `local` si retrait).
- V2-FR-09 : le type du mode est déplacé dans `src/shared/` (supprime la dépendance `features → app`, spec 056).
- V2-NFR-01 : aucune dépendance npm ; coût récurrent 0 € ; aucune donnée transmise pour résoudre le mode.
- V2-NFR-02 : en mode `spectator`, le bundle chargé exclut les chunks de saisie et de voix [à mesurer avec la spec 044].

### Critères d'acceptation proposés
- V2-AC-01 : en mode `local`, le parcours E2E ouvrir → jeu → prénoms → jouer est identique à aujourd'hui (`tests/e2e/navigation.smoke.spec.ts`).
- V2-AC-02 : en mode `dedicated_tablet`, l'accueil n'est pas atteignable (ni au démarrage, ni par le bouton retour, ni par une session restaurée sur `HOME`) ; l'application ouvre la sélection des jeux (E2E).
- V2-AC-03 : en mode `spectator`, aucun clavier de saisie n'est rendu, aucune demande micro n'est faite, aucune écriture de session n'a lieu (espions), et l'écran d'attente de diffusion s'affiche (E2E, une fois la spec 085 disponible ; avant, test de composant).
- V2-AC-04 : sur un même viewport, la mise en page est identique avec et sans `?mode=dedicated_tablet` (test unitaire du résolveur de la spec 070).
- V2-AC-05 : `?mode=inconnu` et `?mode=personal_phone` se comportent comme `local` (si Q3 = retrait) (test unitaire).
- V2-AC-06 : un test d'intégration prouve que le garde est appelé à la navigation (écran non autorisé → redirection).

### Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Liste des modes V2 | `local` + `dedicated_tablet` + `spectator` / ajouter `controller` / ajouter `personal_phone` | `local`, `dedicated_tablet`, `spectator` | — |
| Q2 | « Contrôleur TV » : mode d'URL ou état | Mode d'URL / état dynamique (diffusion active) | État dynamique : n'importe quel appareil de saisie peut diffuser sans changer de mode | — |
| Q3 | `personal_phone` | Retirer (alias `local`) / redéfinir (périmètre borné, constitution §9) | Retirer en V2 ; redéfinir seulement avec le contrat BDT (spec 109) | — |
| Q4 | Niveau de verrouillage de la station | Léger (accueil masqué, confirmation de sortie) / kiosque (plein écran forcé, code de sortie) | Léger ; le kiosque relève des réglages de l'appareil | — |
| Q5 | Activation de la station | URL / variable d'environnement / QR « station en un scan » (spec 100) | URL + QR de la spec 100 | — |
| Q6 | Fusion du workspace `007-xrepo-smartphone-vs-tablet-access-bounds` | Fusionner / garder | Fusionner : la partie « présentation » va à la spec 070, la partie « droits » ici | — |
| Q7 | Abandon du workspace `003-counter-split-…-social-shell` (H.23) | Abandonner / conserver | Abandonner (shell social inexistant) — validation humaine | — |
| Q8 | E2E tablette | Garder `?mode=dedicated_tablet` / viewports réalistes | Viewports réalistes (spec 042), le mode n'étant plus une bascule de mise en page | — |

### Dépendances
- Prérequis : V2-TAB-01 (spec 070, résolveur de classes de taille) pour V2-FR-01.
- Liens : V2-TV-02 (spec 084) et V2-TV-04 (spec 085) pour `spectator` ; V2-STATION-01 (spec 100) ; V2-ARCH-06 (spec 010, reprise en station) ; V2-ARCH-01 (spec 056, type déplacé) ; V2-QA-09 (spec 042) ; V2-INT-07 (spec 109) pour un futur périmètre « smartphone personnel ».
- Décisions architecturales : ADR-0005 (spectateur lecture seule, mono-écrivain), ADR-0007 (mise en page par classes de taille, pas par mode).
