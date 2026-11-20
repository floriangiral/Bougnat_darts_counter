---
id: 046-counter-x01-double-master-in
v2_id: V2-GAMES-02
titre: X01 — ouverture Double/Master-In (implémenter ou retirer)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Backlog existant
famille: jeux
priorite: P0
difficulte: M
recommandation: recommande
lot: 0
poids: 40
depend_de: [V2-INT-01]
remplace: []
remplacee_par: []
issue: '#213'
verifie_au_commit: 0c9ab98
derniere_revue: 2026-11-20
---

# 046 — X01 : ouverture Double/Master-In (implémenter ou retirer)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue #213, branche `feat/v2-audit-specs-et-corrections`). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du product owner ; la validation terrain reste à faire (`validation: en-attente`).

## 1. Origine et contexte

Le setup X01 propose « Ouverture : Open / Double / Master » et le contrat public `v=1` (spec 030) accepte `in=open|double|master`, mais aucune règle d'ouverture n'est appliquée au calcul (rapport `03-games.md` §3.1 et §6.2, compte rendu §C.5, arbitrage **H.2**). La documentation partenaire signale déjà cette limite (`docs/integration/external-match-link.md:54-57`).

## 2. Problématique

Le compteur promet une règle qu'il n'applique pas : en Double-In, une première visite de 60 sans double est comptée (score 441 au lieu de 501, rejoué en mémoire par le rapport 03). Un match officiel transmis par lien peut donc être faux.

## 3. Objectifs

- Supprimer la promesse fausse dès le lot 0 (implémentation **ou** retrait).
- Si implémentation : appliquer l'ouverture sans saisie fléchette par fléchette, sans changer le contrat `v=1`.
- Si retrait : rester compatible avec la politique « `v=1` figé, ajouts additifs » (V2-INT-01, spec 030).

## 4. État actuel vérifié dans le code

| # | Constat | Référence | Niveau |
|---|---|---|---|
| C1 | `checkIn` n'est lu que par le setup, le résumé, les règles affichées et le lien externe ; jamais par le moteur | `src/features/game-setup/setupModel.ts:17,80,250,333,444`, `setupViewModel.ts:86`, `setupPresentation.ts:100-109`, `components/game-setup/SetupX01RulesSection.tsx:8-38` ; aucun usage dans `src/application/scoring/` | [vérifié] |
| C2 | Le moteur soustrait toute visite dès la première | `src/application/scoring/matchLifecycle.ts:259-291` | [vérifié] |
| C3 | Les règles affichées annoncent « le score ne commence qu'après une ouverture valide » | `src/features/game-setup/setupPresentation.ts:109` ; descriptions `:23-30` | [vérifié] |
| C4 | Le lien `v=1` lit `in` (défaut `Open`), le stocke et le compare pour autoriser l'envoi du résultat | `src/features/external-match/externalMatchLink.ts:225-226,245,317,383` ; type `src/shared/session/persistedAppSession.ts:13-16` | [vérifié] |
| C5 | Le partenaire en production (badarts.fr) n'envoie pas `in` (donc Open) | rapport `08-integrations.md` §2.7 (bundle public lu le 2026-11-20) | [vérifié source externe, peut évoluer] |
| C6 | Le Triathlon force `checkIn: 'Open'` | `views/TriathlonGameView.tsx:78,95` | [vérifié] |
| C7 | Le robot ignore `checkIn` | `src/application/x01Bot/x01BotTurn.ts:88-126` | [vérifié] |
| C8 | La saisie est un total de visite ; aucun moyen de savoir quelle fléchette a ouvert | `components/game/Keypad.tsx`, `matchSubmission.ts:39-88` | [vérifié] |

## 5. Comportement cible

Deux options mutuellement exclusives, à trancher (Q1).

**Option B — implémenter avec attestation d'ouverture (recommandée).** Tant qu'une équipe n'est pas ouverte dans la manche, son bandeau affiche « Ouverture : double requis » (ou « double ou triple »). Le joueur saisit les points **comptés à partir de la fléchette d'ouverture incluse** (0 si pas d'ouverture). Le premier total non nul d'une équipe dans la manche déclenche une confirmation unique : « Ouverture réussie sur un double : 40 points comptés ? » (Oui / Non = 0). Ensuite le jeu se déroule normalement.

**Option A — retirer.** La ligne « Ouverture » disparaît du setup, du résumé et des règles ; `checkIn` vaut toujours `Open` ; le contrat `v=1` reste lisible (voir Q3).

## 6. Périmètre

### Inclus
Setup X01, règles affichées, moteur (option B), voix (même flux), lien externe, robot (Q4), documentation partenaire et utilisateur.

### Exclu
Saisie fléchette par fléchette (option C du rapport 03, écartée) ; Triathlon (reste Open) ; règles de sortie (spec 045).

## 7. User stories

- En tant que joueur de ligue en Double-In, je veux que mes points ne comptent qu'à partir de mon double d'ouverture, afin de jouer selon le règlement.
- En tant que partenaire `v=1`, je veux que `in=double` soit soit appliqué, soit refusé clairement, afin de ne pas recevoir un résultat faux.

## 8. Règles métier

- RM-01 Double-In : les points ne comptent qu'à partir de la première fléchette dans un double (double bull compris), fléchette incluse (sources : Wikipedia EN « Darts » §Doubling in ; Wikipedia DE « Darts », Double In).
- RM-02 Master-In : ouverture sur un double ou un triple [à confirmer : pas de source publique vérifiée ; convention symétrique du Master-Out].
- RM-03 L'état « ouvert » est propre à chaque équipe et à chaque manche ; il est **dérivé** de l'historique : une équipe est ouverte dès qu'elle a une visite non « trop » de score > 0 dans la manche.
- RM-04 Total d'ouverture possible : Double-In ∈ [2 ; 170] et réalisable avec un double en première fléchette comptée ; Master-In ∈ [2 ; 180] avec un double ou un triple en première fléchette comptée.
- RM-05 Les fléchettes lancées avant l'ouverture comptent comme fléchettes jouées (3 par visite) avec 0 point.
- RM-06 Une visite qui ouvre et dépasse le reste est un trop ; l'équipe reste non ouverte [à confirmer, ne concerne que les scores de départ personnalisés faibles].

## 9. Parcours utilisateurs

Option B, Double-In 501 : visite 1 = « 0 » (aucun double) → 501 ; visite 2 = « 46 » → confirmation « Ouverture réussie… 46 points comptés ? » → Oui → 455 ; visites suivantes sans confirmation.

## 10. Exigences fonctionnelles

- FR-01 (B) Le moteur ne déduit aucun point tant que l'équipe n'est pas ouverte, sauf visite d'ouverture confirmée.
- FR-02 (B) Le premier total non nul d'une équipe non ouverte déclenche la confirmation ; « Non » enregistre 0.
- FR-03 (B) Un total d'ouverture impossible (RM-04) est refusé avec « OUVERTURE IMPOSSIBLE ».
- FR-04 (B) Le bouton RESTE est refusé tant que l'équipe n'est pas ouverte.
- FR-05 (B) La voix suit le même flux (la proposition validée passe par FR-02).
- FR-06 (B) Le bandeau joueur indique l'état d'ouverture.
- FR-07 (A) Option retirée du setup, du résumé, des règles et du simulateur partenaire ; `checkIn` forcé à `Open`.
- FR-08 (A et B) Les règles affichées décrivent exactement le comportement livré.

## 11. Exigences non fonctionnelles

- NFR-01 Règle d'ouverture pure dans le domaine/application, sans React.
- NFR-02 Aucun coût récurrent ; aucune dépendance.
- NFR-03 Une seule confirmation par équipe et par manche (charge cognitive limitée).

## 12. Cas nominaux et alternatifs

Nominal B : ouverture confirmée. Alternatif : « Non » à la confirmation → visite 0. Undo de la visite d'ouverture → équipe redevient non ouverte (dérivation RM-03).

## 13. Cas limites

Ouverture et sortie dans la même visite (score de départ ≤ 170) : la sortie suit la spec 045 après confirmation d'ouverture ; doublettes : l'ouverture est par équipe ; match restauré : état dérivé, aucune migration ; robot en Double-In (Q4).

## 14. Gestion des erreurs

Messages « OUVERTURE IMPOSSIBLE » et « OUVERTURE REQUISE » (RESTE) ; aucun message technique. Lien externe : voir Q3.

## 15. Impacts architecturaux

B : fonction pure `isTeamOpened(leg, teamId)` et validation d'ouverture dans le domaine ; `submitTurn` accepte la règle d'ouverture. A : suppression de code UI. Pas de nouvelle abstraction.

## 16. Impacts sur les données et les interfaces

Aucun nouveau champ persisté (RM-03 dérive l'état). Contrat `v=1` : inchangé en B ; en A, voir Q3 (politique de compatibilité de V2-INT-01).

## 17. Compatibilité avec l'existant

B : les matchs en cours restaurés avec `checkIn ≠ Open` voient la règle s'appliquer aux visites suivantes uniquement (les visites passées ne sont pas recalculées) — documenter. A : `arenaPrefillConfig` contenant `checkIn` est normalisé à `Open`.

## 18. Dépendances

- V2-INT-01 (spec 030, finalisation du contrat `v=1`) : la décision doit être prise avant publication 2.0.0.
- Liées : V2-GAMES-01 (spec 045), V2-ARCH-03 (spec 057), V2-VOICE-01 (spec 003), V2-GAMES-26 (spec 050), spec 016 (robot).

## 19. Critères d'acceptation

- AC-01 (B) Double-In 501, visite « 60 » puis « Non » → 501 ; visite « 60 » puis « Oui » → 441.
- AC-02 (B) Double-In, saisie 171 avant ouverture → « OUVERTURE IMPOSSIBLE », score inchangé.
- AC-03 (B) Après ouverture, aucune confirmation supplémentaire dans la manche ; nouvelle manche → nouvelle ouverture requise.
- AC-04 (B) Undo de la visite d'ouverture → équipe non ouverte.
- AC-05 (B) Lien `in=double` → match joué en Double-In, résultat envoyable (`matchFollowsExternalLink` vrai).
- AC-06 (A) Le setup n'affiche plus « Ouverture » ; `getRulesContent('X01')` ne mentionne plus le check-in.
- AC-07 (A et B) `docs/integration/external-match-link.md` ne contient plus la « limite connue » ou décrit le comportement retenu.

## 20. Scénarios de tests

Unitaires moteur (ouverture dérivée, undo, doublettes), validation d'ouverture (table exhaustive), soumission ; composant bandeau ; E2E Double-In local et via lien (`tests/e2e/external-match-link.smoke.spec.ts`).

## 21. Exigences de non-régression

Open inchangé (cas par défaut, partenaire actuel) ; sorties (spec 045) ; voix ; robot Open ; Triathlon.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Joueur saisissant le total brut au lieu du total compté | Moyen | Moyenne | Texte de confirmation explicite, règles affichées |
| Retrait (A) cassant un partenaire qui envoie `in=double` | Élevé | Faible (badarts.fr n'envoie pas `in`) | Q3, politique de compatibilité |
| Master-In sans source vérifiée | Faible | Moyenne | RM-02 marquée à confirmer |

## 23. Décisions architecturales

Décision produit (Q1) à tracer dans la spec 030 (révision V2) et dans la référence des règles (spec 050). Pas d'ADR technique nécessaire.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Implémenter ou retirer ? (arbitrage H.2) | A retirer ; B attestation d'ouverture ; C saisie par fléchette | B — règle respectée, contrat `v=1` inchangé, coût limité aux premières visites | — |
| Q2 | Mesure transitoire si B n'est pas prête pour 2.0.0 | a) masquer l'option dans le setup local et afficher dans le bandeau de match lié « ouverture non appliquée » ; b) statu quo documenté | a) — supprime la promesse locale, informe les joueurs d'un match lié | — |
| Q3 | Si A : traitement de `in=double` et `in=master` dans `v=1` | a) accepter et ignorer avec avertissement ; b) refuser (`invalid-in`) = changement incompatible → `v=2` | a) seulement si B est définitivement abandonnée | — |
| Q4 | Robot en Double/Master-In | a) robot interdit avec ouverture ; b) modèle probabiliste d'ouverture par niveau | a) en V2, b) plus tard | — |
| Q5 | Master-In : accepter sans source officielle ? | a) oui (convention symétrique) ; b) retirer Master-In, garder Double-In | a) avec mention dans la référence des règles | — |

## 25. Traçabilité

Rapports `03-games.md` §3.1, §6.2, §9.1 ; `08-integrations.md` §2.2, §2.7 ; compte rendu §C.5, §H.2 ; specs 030, 045, 050, 057.

## Implémentation (2026-11-20)

- Issue #213 ; vérifiée au commit `0c9ab98` (branche `feat/v2-audit-specs-et-corrections`).
- Décisions appliquées : recommandations de la section « Questions ouvertes ».
- Test de reproduction écrit avant la correction (échec constaté), puis correction ; revue indépendante « OK avec réserves », réserves traitées.
- Vérifications : typecheck, lint, tests unitaires et couverture, gouvernance de couverture, `guard:clean` et build au vert ; `lint:type-aware` ne signale qu'une erreur préexistante (`tests/unit/components/keypads.test.tsx:47`).
- Reste à faire : recette sur appareils réels et tests E2E correspondants (spec 040).

