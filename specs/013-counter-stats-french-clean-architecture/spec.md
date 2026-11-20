---
id: 013-counter-stats-french-clean-architecture
v2_id: V2-GAMES-10
type: fonctionnel
statut: en-cours
validation: en-attente
statut_reel: "Partielle : libellés anglais résiduels."
traitement_propose: "Finaliser (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 013 - counter stats french clean architecture

## Meta

- ID: `013-counter-stats-french-clean-architecture`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Traduire les ecrans de statistiques en francais en respectant une approche spec-driven et clean architecture.

## Decisions

- `matchStats` retourne uniquement des structures numeriques et factuelles
- aucun texte de presentation dans la couche application
- les libelles FR sont centralises dans un module unique de presentation
- le formatage (pourcentages, resumes checkout, details) est realise dans un presenter FR cote UI

## Invariants critiques

- la logique metier de calcul stats reste identique
- aucun label stats en dur dans les composants stats
- les ecrans stats affichent du francais coherent
- CHECKOUT `matchStats` testables sans dependance UI

## Impacted Code

- `src/application/scoring/matchStats.ts`
- `components/stats/StatsModal.tsx`
- `views/StatsView.tsx`
- `views/CricketStatsView.tsx`
- `views/CapitalStatsView.tsx`
- `views/TriathlonStatsView.tsx`
- `components/triathlon/TriathlonStatsModal.tsx`
- `src/presentation/stats/statsLabels.fr.ts`
- `src/presentation/stats/statsPresenter.fr.ts`

## Canonical Entry Points

- `calculateDetailedStats*`
- `presentX01DetailedStats`
- `STATS_LABELS_FR`

## Key Tests

- `tests/unit/application/matchStats.test.ts`
- `tests/unit/presentation/stats/statsPresenter.fr.test.ts`
- `tests/unit/presentation/stats/statsLabels.fr.test.ts`
- `npm run typecheck`
- `npm run lint`

## Validation

- `matchStats` ne contient plus de chaines localisees
- labels centralises et reutilises sur les ecrans stats
- presenter FR convertit correctement les structures numeriques en texte UI

## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 (identifiant V2-GAMES-10) ; aucune exigence n'est validée. Le contenu historique ci-dessus n'est pas modifié.

### Constats vérifiés (code au commit 508dfa6)

Les écrans de statistiques passent bien par `STATS_LABELS_FR` et le presenter, mais des libellés anglais, des libellés en dur et des fautes subsistent, dans les statistiques **et** dans les écrans de jeu :

| # | Libellé actuel | Référence | Nature |
|---|---|---|---|
| C1 | « 180s / 171s », « 160+ / 152+ » … « 60+ / 57+ » (7 libellés en dur) | `components/stats/StatsModal.tsx:154-179` | Anglais + contraire à l'invariant « aucun label stats en dur » |
| C2 | « Marks par tour (MPR) », « Marks totaux » | `src/presentation/stats/statsLabels.fr.ts:43-44` | Franglais |
| C3 | « Vainqueur: » (sans espace avant les deux-points) | `statsLabels.fr.ts:29,39` | Typographie |
| C4 | « Leg Avg », « Match Avg », « Darts », « Last » | `components/game/PlayerScore.tsx:138,144,150,156` | Anglais (écran de jeu) |
| C5 | « darts to finish » | `components/game/Keypad.tsx:117` | Anglais |
| C6 | « Bust », « Turn » (bandeau de retour) | `src/features/x01/scoring/matchFeedback.ts:6,17` | Anglais |
| C7 | « WAIT », « SYNC KO » | `views/MatchView.tsx:287,293` | Anglais |
| C8 | « Premier à N Legs », « (N Legs/Set) » | `src/features/x01/scoring/matchPresentation.ts:5-6` | Anglais (la version compacte dit « Manches ») |
| C9 | « Checkout Path » | `components/game/CheckoutHint.tsx:15` | Anglais |
| C10 | « Check-in actuel », « Check-out actuel » alors que le setup dit « Ouverture / Fermeture » | `src/features/game-setup/setupPresentation.ts:109-110` | Incohérence de vocabulaire |
| C11 | Pastilles « Most Played », « Endgame » (code présent, affichage à confirmer) | `views/GameSelectionView.tsx:40,49` | Anglais |
| C12 | « Match remporte », « Rate », « Numero » | `views/CricketGameView.tsx:255`, `views/KillerGameView.tsx:221,241` | Accents manquants |
| C13 | Casse aléatoire : « Lancer La Partie », « Début De Partie », « Ordre Des Jeux », « Manches Par Set » | `components/game-setup/SetupSummarySection.tsx:34`, `components/game/StartingPlayerOverlay.tsx:31`, `src/features/game-setup/setupViewModel.ts:63,79` | Typographie |

### Écarts avec la spec

- Invariant « aucun label stats en dur dans les composants stats » : non tenu (C1).
- Invariant « les écrans stats affichent du français cohérent » : partiellement tenu (C1-C3).
- Le périmètre historique ne couvrait que les statistiques ; les écrans de jeu (C4-C13) n'ont jamais été inclus.

### Exigences proposées

- V2-FR-01 Tous les libellés des écrans de statistiques proviennent de `STATS_LABELS_FR` (C1).
- V2-FR-02 Un lexique unique des jeux (manche, set, visite, fléchette, « trop » pour bust, sortie/checkout, ouverture/fermeture, marques) est défini et appliqué ; les termes techniques usuels conservés (ex. « MPR », « checkout ») sont listés explicitement.
- V2-FR-03 Les libellés des écrans de jeu X01, Cricket, Killer et du setup (C4-C13) sont traduits ou corrigés selon ce lexique, et centralisés dans un module de libellés de présentation (extension de `src/presentation/` ; nom à fixer).
- V2-FR-04 Typographie française : espace insécable avant « : », « ? », « ! » ; casse de phrase pour les boutons et titres (hors sigles).
- V2-NFR-01 Aucune chaîne de présentation dans `src/domain` ni `src/application` (invariant historique étendu).
- V2-NFR-02 Les identifiants `data-testid` ne changent pas (stabilité des E2E).

### Critères d'acceptation

- V2-AC-01 Une recherche des chaînes « Leg Avg », « Match Avg », « darts to finish », « Checkout Path », « SYNC KO », « Legs » (libellé affiché) dans `components/`, `views/`, `src/` ne renvoie plus de libellé affiché.
- V2-AC-02 `StatsModal` n'a plus de libellé en dur (test : chaque `StatRow` reçoit une clé de `STATS_LABELS_FR`).
- V2-AC-03 Le lexique est publié (référence des règles, spec 050) et un test vérifie que les libellés du module respectent la casse de phrase.
- V2-AC-04 Les E2E existants passent sans modification de sélecteurs.

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Traduire « bust » | a) « Trop » ; b) « Bust » (jargon) ; c) « Cassé » | a) — déjà utilisé (« TROP ! ») | — |
| Q2 | Garder « checkout » et « MPR » | a) oui (jargon des joueurs) avec infobulle ; b) « sortie », « marques par tour » | a) pour « MPR », b) « sortie » pour l'aide et les règles | — |
| Q3 | Supprimer les pastilles mortes de `GameSelectionView` | a) supprimer ; b) traduire | a) si l'affichage est confirmé inactif | — |
| Q4 | Périmètre : statistiques seules ou tous les écrans de jeu | a) tous ; b) statistiques seules | a) — sinon le mélange FR/EN persiste | — |

### Dépendances

Aucune bloquante. Coordination : V2-GAMES-26 (spec 050, lexique), V2-GAMES-06 (spec 049, libellés de fin), V2-GAMES-01 (spec 045, « Checkout Path »), V2-GAMES-02 (spec 046, « Ouverture »), V2-GAMES-04 (spec 047, « Match remporté »), V2-GAMES-13 (spec 053). Arbitrages du compte rendu : §C.5 (textes EN résiduels), §H.8 (langue unique : français accentué).
