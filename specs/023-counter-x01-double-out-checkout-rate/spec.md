---
id: 023-counter-x01-double-out-checkout-rate
v2_id: V2-GAMES-11
type: fonctionnel
statut: implementee
validation: en-attente
statut_reel: "Implémentée."
traitement_propose: "Conserver, enrichir la définition (Révision V2)."
decision_traitement: a-valider
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---
# Spec 023 - counter x01 double out checkout rate

## Meta

- ID: `023-counter-x01-double-out-checkout-rate`
- Statut: `active`
- Milestone cible: `M6: Architecture & Technical Cleanup`
- Issues GitHub: `#to-create`

## Objectif

Redefinir le taux de checkout X01 en `Double Out` pour mesurer des tentatives reelles de finish, sans penaliser les tours de placement joues depuis une plage de checkout.

## Decisions

- le calcul reste dans la couche application, sans dependance React ni UI
- une opportunite de checkout reste un score de depart de tour finissable en 3 flechettes ou moins
- une tentative de checkout est comptee uniquement si le tour depuis cette opportunite se termine par un finish reussi ou par un bust
- un tour de placement depuis une opportunite de checkout ne compte pas comme tentative
- le detail `1 fleche / 2 fleches / 3 fleches` repose sur les flechettes reellement lancees sur la tentative comptee

## Invariants critiques

- aucune chaine de presentation n est ajoutee dans `matchStats`
- le taux de checkout reste derive uniquement de l historique de match et des regles X01
- en `Double Out`, un placement volontaire ne degrade plus le taux de checkout
- un finish valide continue a compter comme tentative et comme reussite
- un bust depuis une opportunite de checkout compte comme tentative ratee

## Impacted Code

- `src/application/scoring/matchStats.ts`
- `tests/unit/application/matchStats.test.ts`
- `src/presentation/stats/statsPresenter.fr.ts`

## Canonical Entry Points

- `calculateDetailedStats*`
- `getMinDartsForScore`

## Key Tests

- `tests/unit/application/matchStats.test.ts`
- `npm run test:unit -- tests/unit/application/matchStats.test.ts`
- `npm run typecheck`

## Validation

- un checkout reussi en 1, 2 ou 3 flechettes alimente le bon bucket
- un bust depuis une opportunite de checkout augmente les tentatives sans augmenter les reussites
- un score de placement depuis une opportunite de checkout ne modifie pas les tentatives
## Révision V2 (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 (identifiant V2-GAMES-11) ; aucune exigence n'est validée. Le contenu historique ci-dessus n'est pas modifié.

### Constats vérifiés (code au commit 508dfa6)

- C1 Opportunité de sortie : reste de début de visite > 1 et ≤ 180 (Open, Master) ou ≤ 170 hors bogeys (Double) — `src/application/scoring/matchStats.ts:63-80`. La règle « finissable en 3 fléchettes ou moins » de la spec est respectée en Double ; en Master, les restes irréalisables (163, 166…) sont comptés comme opportunités.
- C2 Tentative = visite depuis une opportunité qui se termine par une sortie réussie **ou** un trop ; un placement ne compte pas — `matchStats.ts:119-148`. Conforme à la spec.
- C3 Le seau 1/2/3 fléchettes repose sur `Turn.dartsThrown`, qui vaut 3 pour toute visite non gagnante (`src/features/x01/scoring/matchSubmission.ts:63`) : un trop compte toujours comme tentative « 3 fléchettes » — `matchStats.ts:82-86,141-143`.
- C4 Le minimum de fléchettes proposé à la confirmation vient de `getMinDartsForScore`, inexact en Open (≤ 60 = 1) et Master (25, 103-119) — `matchStats.ts:282-315` ; il conditionne le seau des sorties réussies (correction : spec 045).
- C5 Le libellé affiché est « Taux de checkout » — `src/presentation/stats/statsLabels.fr.ts:15` ; aucune explication de la définition dans l'interface.
- C6 La saisie se fait par **total de visite** : le nombre de fléchettes lancées « au double » n'est pas connu ; la définition usuelle du taux de checkout des diffuseurs (réussites / fléchettes lancées au double) n'est pas calculable [définition usuelle à confirmer, source non consultée].

### Écarts avec la spec

- La spec parle de « tentatives réelles de finish » : la mesure est en réalité « taux de visites de sortie conclues », plus généreuse que la définition par fléchette (un placement manqué depuis 32 n'est jamais une tentative).
- Le titre et le périmètre visent le Double-Out, mais le calcul s'applique aussi en Open et Master sans que la spec le dise.

### Exigences proposées

- V2-FR-01 La définition est documentée selon le mode de saisie : **saisie par total** (actuelle) = « visites de sortie conclues / visites de sortie conclues + trops depuis une opportunité » ; **saisie par fléchette** (si elle est un jour validée) = « sorties réussies / fléchettes lancées sur un double de sortie ».
- V2-FR-02 Le libellé affiché devient explicite (ex. « Sorties réussies (visites) ») ou est accompagné d'une infobulle donnant la définition V2-FR-01 (Q1).
- V2-FR-03 L'opportunité de sortie utilise la fonction unique de finissabilité de la spec 045 pour les trois règles (corrige C1 en Master).
- V2-FR-04 Le périmètre Open / Double / Master est explicite dans la spec et dans la référence des règles (spec 050).
- V2-NFR-01 Le calcul reste dans `src/application`, sans chaîne de présentation (invariant historique).

### Critères d'acceptation

- V2-AC-01 Master-Out : un reste de 163 en début de visite n'est pas une opportunité.
- V2-AC-02 L'écran de statistiques présente le libellé retenu (Q1) et la définition est consultable.
- V2-AC-03 Les tests existants de `tests/unit/application/matchStats.test.ts` passent ; nouveaux cas Open et Master ajoutés.

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Libellé | a) renommer « Sorties réussies (visites) » ; b) garder « Taux de checkout » + infobulle | b) — terme connu des joueurs, définition visible | — |
| Q2 | Viser la définition par fléchette ? (H.11, saisie par fléchette) | a) non en V2 ; b) oui avec saisie par fléchette optionnelle | a) | — |
| Q3 | Compter un placement manqué (reste non finissable après la visite) comme tentative ? | a) non (inchangé) ; b) oui | a) | — |

### Dépendances

V2-GAMES-01 (spec 045, finissabilité et minimum de fléchettes), V2-GAMES-26 (spec 050), V2-GAMES-10 (spec 013, libellés). Arbitrages du compte rendu : §C.5, §H.11 (saisie par fléchette) ; rapport `03-games.md` §3.1 « Statistiques », §9.10.
