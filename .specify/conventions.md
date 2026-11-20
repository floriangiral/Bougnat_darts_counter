# Conventions SDD — Bougnat_darts_counter

Version : 2.0.0 (proposée le 2026-11-20, spec [032](../specs/032-counter-sdd-conventions-v2/spec.md), statut **à valider**)

Ces conventions complètent la [constitution locale](memory/constitution.md) et la constitution transverse du workspace.

## 1. Emplacement et nommage

- Une spec = un dossier `specs/NNN-counter-sujet/` (numérotation continue, jamais réutilisée).
- Les identifiants V2 (`V2-<DOMAINE>-NN`) sont des **alias** portés dans l'en-tête YAML (`v2_id`) et dans le titre de l'issue GitHub.
- Une spec existante enrichie garde son numéro ; l'enrichissement est ajouté dans une section `## Révision V2`.
- Une spec retirée garde une fiche de traçabilité (`retiree`), elle ne disparaît jamais.

## 2. Contenu minimal d'un dossier

| Fichier | Rôle |
|---|---|
| `spec.md` | Quoi et pourquoi (gabarit fonctionnel, étude ou gouvernance) |
| `plan.md` | Comment : étapes, fichiers impactés, migration, tests, rollback |
| `tasks.md` | Checklist exécutable `T001…` reliée aux critères d'acceptation |

Gabarits : [`templates/spec-template.md`](templates/spec-template.md) (fonctionnel, 25 rubriques), [`templates/study-template.md`](templates/study-template.md) (étude), [`templates/adr-template.md`](templates/adr-template.md) (décision d'architecture, stockée dans `docs/adr/`).

Une étude ne crée aucune exigence : si elle est retenue, elle produit une spec fonctionnelle et/ou un ADR.

## 3. En-tête YAML commun

```yaml
---
id: NNN-counter-sujet
v2_id: V2-XXX-NN
titre: …
type: fonctionnel | etude | gouvernance | doc
statut: a-valider
validation: en-attente
origine: Backlog existant | Demande V2 | Recommandation architecturale | Recommandation UX/UI | Innovation produit | Documentation | Étude exploratoire
famille: gouvernance | doc | qualite | jeux | archi | design-system | tablette | voix | tv | perso | innovation | integrations
priorite: P0 | P1 | P2 | P3
difficulte: S | M | L | XL
recommandation: recommande | optionnel | deconseille | etude
lot: 0..5
poids: 1..100
depend_de: [V2-…]
issue: '#NNN'
verifie_au_commit: <sha court>
derniere_revue: AAAA-MM-JJ
---
```

## 4. Cycle de vie (`statut`)

| Statut | Sens |
|---|---|
| `a-valider` | Proposition rédigée, en attente de décision du product owner |
| `en-discussion` | Décision en cours d'instruction |
| `a-revoir` | Le product owner a demandé une révision |
| `validee` | Exigences validées, prête à implémenter |
| `rejetee` | Refusée (justification obligatoire) |
| `reportee` | Reportée à une version ultérieure |
| `en-cours` | Implémentation en cours |
| `implementee` | Code livré ; voir `validation` |
| `cloturee` | Implémentée, validée et vérifiée dans le code au commit indiqué |
| `retiree` | Retirée du périmètre (fiche conservée) |

`validation: en-attente | validee` distingue « implémentée » de « validée » (tests terrain, recette).

Règles :

1. Une absence de réponse n'est pas une validation ; une validation de la vision ne vaut pas validation individuelle.
2. Seul le product owner fait passer une spec à `validee`, `rejetee` ou `reportee`.
3. Clôture : fonctionnel → critères d'acceptation vérifiés + commit de vérification ; étude → recommandation arbitrée et suites créées ; gouvernance → règle appliquée.
4. Une fonctionnalité non implémentée n'est jamais présentée comme disponible dans la documentation.

## 5. Priorité, difficulté, recommandation, poids

- **Priorité** : P0 indispensable (bloquant ou fondation), P1 important, P2 souhaitable, P3 ultérieur.
- **Difficulté** : S (≤ 1 jour), M (quelques jours), L (1 à 3 semaines), XL (plus).
- **Recommandation** : `recommande`, `optionnel`, `deconseille`, `etude` (décision après étude).
- **Poids** = `round(valeur(1-5) × priorité(P0=4, P1=3, P2=2, P3=1) × 5 ÷ difficulté(S=1, M=2, L=3, XL=4))`, borné à 1-100. Plus le poids est élevé, meilleur est le rapport valeur / effort.

## 6. Issues GitHub

Chaque spec (ou enrichissement) a une issue : titre `[V2-XXX-NN] Titre`, labels `famille:*`, `priorite:*`, `difficulte:*`, `reco:*`, `type:*`, `decision:*`, milestone = lot, et une entrée dans le projet GitHub « Bougnat Darts V2 » (champs Poids, Priorité, Difficulté, Recommandation, Lot, Famille, Décision).

## 7. Langue

Les nouvelles specs et la documentation sont rédigées en français accentué. Les specs historiques en anglais ne sont pas traduites.
