---
id: 040-counter-qa-e2e-full-game-journeys
v2_id: V2-QA-04
titre: Parcours E2E complets par jeu (partie, annulation, rechargement)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: qualite
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 23
depend_de: [V2-ARCH-06]
remplace: []
remplacee_par: []
issue: '#245'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 040 — Parcours E2E complets par jeu (partie, annulation, rechargement)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La spec 029 autorise l'exclusion des vues de jeu de la couverture « parce que leur comportement est validé par Playwright » (`sonar-project.properties:8`). Les rapports 02 (D9), 03 et 10 (§3.3) constatent que les E2E ne vont pas au-delà de l'**entrée** dans chaque jeu. Le compte rendu V2 (§B.3) range ce manque parmi les dettes principales. Cette spec rend vraie la promesse de 029 et prépare la reprise multi-jeux (010).

## 2. Problématique

Aucun jeu n'est joué jusqu'à la victoire dans un navigateur, sauf X01 via le lien partenaire ; l'annulation et le rechargement ne sont jamais vérifiés de bout en bout pour Cricket, Capital, Killer, Gotcha et Triathlon.

## 3. Objectifs

- O1 : un parcours complet par jeu (6) : configuration → premier joueur → saisies → annulation → fin de partie → statistiques → revanche ou retour.
- O2 : un parcours de rechargement en cours de partie par jeu, actif dès que 010 le permet.
- O3 : une suite E2E lisible (noms honnêtes, pas de doublon) et rapide.

## 4. État actuel vérifié dans le code

- [vérifié] 7 fichiers E2E (`tests/e2e/*.spec.ts`) + `helpers.ts`. Aucun ne termine une partie hors lien externe.
- [vérifié] `tests/e2e/completion.smoke.spec.ts:1-31` : malgré son nom, fait accueil → setup → retour, et cite un slug inexistant `spec:counter/smoke-e2e-per-game-navigation`.
- [vérifié] `tests/e2e/gameplay-entry.smoke.spec.ts` démarre X01, Cricket, Capital, Triathlon ; Killer et Gotcha absents.
- [vérifié] `tests/e2e/navigation.smoke.spec.ts` (1 test) recoupe `completion.smoke`.
- [vérifié] `tests/e2e/external-match-link.smoke.spec.ts:172-186` joue un X01 lié jusqu'au bout (départ à 2) et `:146-149`, `:372-378` vérifient un rechargement : c'est le modèle à généraliser.
- [vérifié] Seul X01 reçoit `restoredState`/`onStateChange` (`App.tsx:354-360`) ; les autres vues sont montées sans état restauré (`App.tsx:365-420`) : un rechargement relance la partie à zéro (rapport 02, §4.6 ; spec 010 non respectée).
- [vérifié] Les claviers Killer et Gotcha sont intégrés aux vues (aucun composant dédié dans `components/game/`) et n'ont aucun `data-testid` (recensement des `data-testid` dans `components/` et `views/`), ce qui oblige à des sélecteurs fragiles (`'main button'` dans `tests/e2e/smartphone-layout.smoke.spec.ts:8`).
- [vérifié] `helpers.ts:67-74` (`seedAppSession`) permet d'injecter une session ; `APP_SESSION_STORAGE_KEY` vient de `utils/appPersistence.ts`.
- [vérifié] CI : projet `chromium` seul pour ces fichiers (`playwright.config.ts:17-22`), `retries: 1` en CI (l.7).

## 5. Comportement cible

Un dossier `tests/e2e/journeys/` contient un fichier par jeu. Chaque fichier joue une partie courte (configuration minimale : X01 départ personnalisé bas, Cricket 10 tours, Gotcha score cible bas, etc.) avec des **objets de page** (`tests/e2e/pages/<jeu>.ts`) qui encapsulent les saisies. Chaque parcours vérifie les scores affichés après des saisies choisies, l'effet d'une annulation, l'écran de fin, les statistiques et la revanche. Un second test par jeu recharge la page en cours de partie et vérifie que l'état affiché est identique ; tant que 010 n'est pas livrée pour ce jeu, il est marqué `test.fixme` avec la référence 010.

## 6. Périmètre

### Inclus
- 6 parcours complets + 6 parcours de rechargement, projet `chromium`.
- Objets de page par jeu ; ajout de `data-testid` stables aux claviers Killer et Gotcha (seul changement de code applicatif, sans effet visible).
- Renommage de `completion.smoke.spec.ts` en `game-setup-navigation.smoke.spec.ts` et fusion avec `navigation.smoke.spec.ts`.

### Exclu
- Matrice d'appareils (V2-QA-09, spec 042) : elle réutilisera les objets de page.
- Voix bout en bout (V2-VOICE-03, spec 074), TV (084/085), régression visuelle (041).
- Correction de la reprise multi-jeux (010) et des règles (045, 047…).

## 7. User stories

- En tant que joueur de Killer, je veux qu'une mise à jour ne casse pas la fin de partie, afin de pouvoir désigner le gagnant.
- En tant que contributeur, je veux un test qui joue toute la partie, afin de refactorer une vue en confiance.

## 8. Règles métier

- RM-01 Les valeurs attendues proviennent des scénarios `valide-metier` de 039 quand ils existent ; un parcours ne doit pas affirmer une règle `bug-connu`.
- RM-02 Les parcours n'utilisent ni réseau externe ni service Deepgram (`VITE_ENABLE_VOICE_SCORING=false` déjà posé par `.github/actions/run-local-smoke/action.yml:35`).

## 9. Parcours utilisateurs

Parcours type (Gotcha) : accueil → « Lancer une partie » → carte Gotcha → 2 joueurs, score cible bas → « Lancer la partie » → premier joueur → saisies → « Annuler » → nouvelle saisie → victoire → statistiques → revanche → nouvelle partie au score initial.

## 10. Exigences fonctionnelles

- FR-01 Un parcours complet par jeu, de la configuration à la revanche ou au retour au menu.
- FR-02 Chaque parcours inclut au moins une annulation et vérifie l'état affiché avant/après.
- FR-03 Chaque parcours vérifie au moins un score intermédiaire et le gagnant.
- FR-04 Un parcours de rechargement par jeu, en `test.fixme` (« attend 010 ») tant que la reprise n'est pas livrée pour ce jeu ; X01 actif dès maintenant.
- FR-05 Objets de page par jeu ; aucun sélecteur CSS de mise en forme dans les tests de parcours.
- FR-06 `data-testid` stables sur les claviers Killer (cibles, touches) et Gotcha (chiffres, valider, annuler), sans changement visuel.
- FR-07 Suppression du slug fantôme et du doublon `navigation`/`completion` sans perte de scénario.
- FR-08 Chaque fichier E2E cite la spec qu'il vérifie en tête (`// Spec: 040-…`).

## 11. Exigences non fonctionnelles

- NFR-01 Durée : ≤ 30 s par parcours, ≤ 4 min pour l'ensemble en CI (2 workers) [à mesurer].
- NFR-02 Stabilité : 0 test « flaky » sur 10 exécutions consécutives avant activation bloquante.
- NFR-03 Aucune nouvelle dépendance ; coût récurrent : minutes GitHub Actions (dépôt public : gratuites sur runners standard [à confirmer]).

## 12. Cas nominaux et alternatifs

- Nominal : partie jouée jusqu'à la victoire, revanche.
- Alternatif : retour au menu depuis l'écran de statistiques ; quitter en cours de partie (confirmation si elle existe, sinon constat documenté pour V2-GAMES-06, spec 049).

## 13. Cas limites

- Annulation de la volée gagnante (X01 : retour depuis la confirmation de checkout ; Cricket : rapport 03).
- Retour automatique de l'écran de statistiques après 2 min : utiliser l'horloge Playwright (`page.clock`) plutôt qu'une attente réelle.
- Triathlon : passage Capital → Cricket → 501 dans un seul parcours (le plus long ; éventuellement découpé par phase via session injectée).

## 14. Gestion des erreurs

En échec, la trace, la vidéo et la capture sont conservées (`playwright.config.ts:12-14`) et publiées en artefact (`reusable-integration-smoke.yml:33-40`).

## 15. Impacts architecturaux

Ajout de `data-testid` dans les claviers intégrés à `views/KillerGameView.tsx` et `views/GotchaGameView.tsx` uniquement (ces vues n'ont pas de composant de clavier séparé). Pas d'impact sur les couches.

## 16. Impacts sur les données et les interfaces

Aucun schéma modifié. Les tests de rechargement s'appuient sur le schéma de session défini par 010.

## 17. Compatibilité avec l'existant

Les tests existants restent verts ; le renommage conserve les mêmes vérifications.

## 18. Dépendances

- V2-ARCH-06 (010) pour activer les tests de rechargement non-X01.
- Recommandé avant : V2-QA-01 (039) pour les valeurs attendues ; V2-QA-08 (008) pour des E2E locaux autonomes.
- Utilisé par : V2-QA-11 (029, retrait d'exclusions), V2-QA-09 (042), V2-ARCH-04 (058).

## 19. Critères d'acceptation

- AC-01 Les 6 parcours complets passent sur `chromium` en CI ; preuve : rapport Playwright du job « Local Integration Smoke ».
- AC-02 Chaque parcours contient une annulation vérifiée (assertion avant/après) ; preuve : revue du code de test.
- AC-03 Le parcours de rechargement X01 passe ; les 5 autres sont `fixme` avec la mention « attend 010 » ; à la livraison de 010 pour un jeu, le `fixme` correspondant est retiré dans la même PR.
- AC-04 `rg "smoke-e2e-per-game-navigation" tests` ne renvoie rien ; le nombre total de scénarios de navigation par jeu est inchangé (6).
- AC-05 10 exécutions consécutives sans échec ni test « flaky » (rapport `--repeat-each=10` en local ou nightly).
- AC-06 Aucun changement visuel des claviers Killer/Gotcha (revue de capture ou 041).

## 20. Scénarios de tests

E2E uniquement (le livrable). Pour chaque jeu : `<jeu> — partie complète avec annulation et revanche`, `<jeu> — rechargement en cours de partie`.

## 21. Exigences de non-régression

Les 87 instances E2E actuelles [comptage statique, rapport 10] restent présentes ou sont remplacées par un équivalent identifié.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Parcours longs et instables | Moyen | Moyenne | Configurations minimales, objets de page, `page.clock` |
| Figer un bug de règle en E2E | Élevé | Moyenne | RM-01, valeurs issues de 039 |
| 010 tardive → `fixme` durables | Moyen | Moyenne | Suivi dans l'issue 010 ; échéance au lot 2 |

## 23. Décisions architecturales

Aucune.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Parcours exécutés à chaque PR ou en nightly ? | PR (chromium) / nightly seulement | PR sur `chromium` (durée maîtrisée), matrice complète en nightly (042/043) | — |
| Q2 | Triathlon complet dans un seul test ? | Un test / trois tests par phase avec session injectée | Trois tests par phase + un test complet en nightly | — |
| Q3 | Renommer `completion.smoke` maintenant ou avec 042 ? | Maintenant / plus tard | Maintenant (coût nul, supprime une confusion) | — |

## 25. Traçabilité

Rapports `docs/v2/audit/02-architecture.md` (D9, V2-ARCH-10), `docs/v2/audit/03-games.md` (V2-GAMES-21), `docs/v2/audit/10-docs-quality.md` (§3.3, V2-QA-04) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.3, §F.1 ; specs 008, 010, 029, 039, 042, 049.
