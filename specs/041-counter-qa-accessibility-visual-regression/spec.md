---
id: 041-counter-qa-accessibility-visual-regression
v2_id: V2-QA-05
titre: Accessibilité automatisée et régression visuelle
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: qualite
priorite: P1
difficulte: M
recommandation: recommande
lot: 1
poids: 23
depend_de: []
remplace: []
remplacee_par: []
issue: '#233'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 041 — Accessibilité automatisée et régression visuelle

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La V2 prévoit la migration de toute l'interface vers des design tokens (V2-DS-01/03, specs 063/065), un mode Light (V2-THEME-01, 068), une disposition « arène » tablette (V2-TAB-03, 072) et des thèmes de club (V2-BRAND-01, 093). Le rapport 05 (§2.9, §4) exige de **capturer l'existant avant** la migration pour garantir un Dark « identique », et d'automatiser les contrôles de contraste. Le rapport 10 (§5.4) propose `@axe-core/playwright` et `toHaveScreenshot` dans l'image Docker Playwright. Cette spec regroupe les propositions V2-QA-05, V2-QA-06 et V2-THEME-03 des rapports ; la spec 063 en dépend.

## 2. Problématique

Aucun test ne détecte une régression visuelle ou d'accessibilité : la migration des ~1 465 classes de couleur codées en dur (rapport 05) peut dégrader l'affichage ou le contraste sans qu'aucun contrôle ne le signale.

## 3. Objectifs

- O1 : des captures de référence de l'existant (thème sombre) sur les écrans clés, produites dans un environnement de rendu figé, **avant** le début de 063.
- O2 : un contrôle d'accessibilité automatisé (règles WCAG 2.x A/AA dont `color-contrast`) sur ces écrans, avec une dette existante listée et bornée.
- O3 : une procédure simple et revue de mise à jour des captures.

## 4. État actuel vérifié dans le code

- [vérifié] Aucune occurrence de `toHaveScreenshot`, `toMatchSnapshot` ni `axe` dans `tests/`.
- [vérifié] Playwright 1.65.1 (`package.json`, `@playwright/test`) ; image `mcr.microsoft.com/playwright:v1.65.1-noble` dans `docker/playwright.Dockerfile:1`, dont la commande par défaut ne lance que les projets tablette (l.7) ; profil Compose `e2e` pointant sur le serveur de développement `http://app:3000` (`compose.yml:18-32`).
- [vérifié] Captures seulement en cas d'échec (`playwright.config.ts:13`).
- [vérifié] Focus clavier supprimé sur le bouton de base : `focus:outline-none` sans remplacement (`components/ui/Button.tsx:15`).
- [vérifié] Score du joueur inactif en `text-gray-700` sur fond sombre (`components/game/PlayerScore.tsx:125`) ; ratio calculé 2,04:1 par le rapport 05 (§2.5) [calcul, non mesuré en navigateur].
- [vérifié] Aucune règle `prefers-reduced-motion` ; classes `animate-in` sans plugin dans `views/MatchView.tsx`, `CricketGameView.tsx`, `CapitalGameView.tsx`, `components/ui/ChangelogModal.tsx`.
- [vérifié] `index.html:3` déclare `lang="fr"` ; `index.html:7` `theme-color` statique `#1a1a1a`.
- [vérifié] `helpers.ts:67-74` permet d'injecter une session pour atteindre un écran de jeu sans saisie.

## 5. Comportement cible

Un projet Playwright `visual` (fichiers `tests/visual/*.visual.spec.ts`) produit et compare des captures d'écrans clés, uniquement dans le conteneur Playwright (local via Docker, CI via `container:`). Un projet `a11y` (`tests/a11y/*.a11y.spec.ts`) exécute axe sur les mêmes écrans et compare les violations à un fichier de dette (`tests/a11y/known-violations.json`) : toute **nouvelle** violation `serious` ou `critical` échoue ; toute violation listée porte une spec de correction et disparaît du fichier quand elle est corrigée. Les captures sont stabilisées : horloge figée (`page.clock`), animations désactivées, zones dynamiques masquées (heure, chrono), sessions injectées.

## 6. Périmètre

### Inclus
- Environ 20 écrans × 3 viewports (téléphone portrait, tablette paysage, bureau) = ~60 captures au lot 1, thème sombre.
- Écrans : accueil, sélection du jeu, setup de chaque jeu (6), écran de jeu de chaque jeu en cours (6), checkout X01, fin de partie, statistiques (4 variantes), modale de réglages, overlay de rotation.
- axe-core sur les mêmes écrans ; contrôle de focus visible sur l'accueil et le setup X01 (navigation au clavier).
- Procédure de mise à jour des captures et de la dette a11y.

### Exclu
- Thème Light et thèmes de club : ajoutés par 068 et 093 (paramétrage par thème prévu dès maintenant).
- Correction des défauts relevés (focus : V2-DS-02, 064 ; contraste : 063/065 ; mouvement : V2-DS-05, 067).
- Matrice d'appareils complète (042) et TV (090).
- Audit manuel par lecteur d'écran (recommandé, hors automatisation).

## 7. User stories

- En tant que mainteneur, je veux qu'une PR de migration de tokens montre les écrans modifiés, afin de vérifier que le Dark reste identique.
- En tant que joueur malvoyant, je veux que les nouveaux écrans ne dégradent pas le contraste, afin de lire le score de loin.

## 8. Règles métier

- RM-01 Une capture de référence ne change que dans une PR qui l'annonce et la justifie (diff d'image revu).
- RM-02 La dette a11y ne peut que décroître, sauf dérogation PO documentée.
- RM-03 Le score (actif comme inactif) est l'élément le plus prioritaire en contraste (rapport 05, principe 4).

## 9. Parcours utilisateurs

Contributeur : modifie un écran → `docker compose --profile visual run --rm playwright-visual` (nom indicatif) → diff en cas d'écart → si voulu, mise à jour des captures dans le conteneur → PR avec les PNG modifiés.

## 10. Exigences fonctionnelles

- FR-01 Projet `visual` avec `expect(page).toHaveScreenshot()` sur la liste d'écrans du §6, exécuté uniquement dans l'image Playwright épinglée.
- FR-02 Stabilisation : horloge figée, `animations: 'disabled'`, masques sur heure/chrono/QR, polices chargées avant capture.
- FR-03 Projet `a11y` avec `@axe-core/playwright` (balises `wcag2a`, `wcag2aa`, `wcag21aa`) sur les mêmes écrans.
- FR-04 Fichier de dette a11y : par écran, règle, cible, spec de correction ; échec sur toute violation `serious`/`critical` absente du fichier, et sur toute entrée devenue inutile.
- FR-05 Test de focus visible : la navigation au `Tab` sur l'accueil et le setup X01 rend chaque élément focalisé visuellement distinct (contour ou ombre non nuls) ; en `test.fails` référencé 064 tant que `Button.tsx:15` n'est pas corrigé.
- FR-06 Paramétrage par thème (`data-theme` à venir) prévu dans les tests, actif sur `dark` seul au lot 1.
- FR-07 Commandes npm dédiées (`test:visual`, `test:visual:update`, `test:a11y`) n'utilisant que le conteneur pour `visual`.
- FR-08 Job CI dédié (conteneur Playwright) ; artefact des diffs en cas d'échec.

## 11. Exigences non fonctionnelles

- NFR-01 Déterminisme : 5 exécutions consécutives sans diff dans le conteneur.
- NFR-02 Poids des captures ≤ 10 Mo au lot 1 [estimation rapport 05 : 3-6 Mo pour ~30 captures].
- NFR-03 Durée du job CI ≤ 6 min [à mesurer].
- NFR-04 Coût récurrent : 0 € (minutes Actions d'un dépôt public) ; une devDependency (`@axe-core/playwright`, licence MPL-2.0 [à confirmer]).

## 12. Cas nominaux et alternatifs

- Nominal : PR de 063 sans changement visuel → job vert.
- Alternatif : changement voulu → captures mises à jour dans la même PR, revue visuelle.
- Alternatif : correction d'un contraste → l'entrée de dette disparaît, sinon le test « entrée inutile » échoue.

## 13. Cas limites

- Rendu des polices différent hors conteneur : les captures ne sont jamais générées ni comparées hors conteneur (test ignoré avec message explicite).
- Écrans plein écran / overlay de rotation ; modales ; écran de victoire temporisé.

## 14. Gestion des erreurs

Diff publié en artefact (`test-results/`), message indiquant la commande de mise à jour. Violation axe : rapport JSON lisible (règle, cible, aide).

## 15. Impacts architecturaux

Aucun impact sur le code applicatif. Nouveaux projets Playwright et nouveau service Compose.

## 16. Impacts sur les données et les interfaces

Fichiers PNG versionnés sous `tests/visual/__screenshots__/` ; fichier `tests/a11y/known-violations.json`.

## 17. Compatibilité avec l'existant

Les projets existants (`chromium`, tablettes, smartphones) ne changent pas ; `visual` et `a11y` sont exclus de `npm run test:e2e` par défaut (`testIgnore`).

## 18. Dépendances

- Aucune dépendance bloquante.
- Doit précéder : V2-DS-01 (063), V2-DS-03 (065) — 063 et 065 dépendent de 041 dans le catalogue.
- Liées : 042 (viewports réalistes), 068 (Light), 064 (focus), 067 (mouvement réduit).

## 19. Critères d'acceptation

- AC-01 Avant le premier commit de 063, les captures de référence sombres des écrans du §6 sont versionnées ; preuve : PR fusionnée et job vert.
- AC-02 Une modification volontaire d'une couleur de `PlayerScore.tsx` fait échouer le job `visual` avec un diff publié (essai sur branche jetable).
- AC-03 Le job `a11y` est vert avec la dette listée ; l'ajout d'un bouton sans nom accessible fait échouer le job (essai sur branche jetable).
- AC-04 Le contraste du score inactif apparaît dans la dette avec la référence 063/065 [si axe le détecte ; sinon test de contraste dédié].
- AC-05 5 exécutions consécutives sans diff dans le conteneur (NFR-01).
- AC-06 Les commandes de mise à jour sont documentées dans le guide de test.

## 20. Scénarios de tests

E2E visuels et a11y (livrable). Un test unitaire de la matrice de contraste des tokens sera ajouté par 063 (hors présente spec).

## 21. Exigences de non-régression

Aucun test existant modifié ; durée de `npm run test:e2e` inchangée.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Captures instables (polices, animations) | Élevé | Moyenne | Conteneur unique, animations désactivées, masques |
| Mise à jour de captures « à l'aveugle » | Moyen | Moyenne | RM-01, revue du diff d'image dans la PR |
| Faux sentiment de conformité (axe ≠ audit) | Moyen | Élevée | Audit manuel ponctuel recommandé ; mention explicite dans la doc |
| Poids du dépôt | Faible | Moyenne | ~60 captures, PNG compressés, revue au lot 2 |

## 23. Décisions architecturales

Aucun ADR ; ajout d'une devDependency soumis à la décision H.25 du compte rendu.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Ajouter `@axe-core/playwright` (H.25) ? | Oui / non (contrôles maison) | Oui : standard, gratuit, seul moyen fiable de mesurer le contraste rendu | — |
| Q2 | Versionner les captures dans le dépôt (H.25) ? | Dépôt / artefact CI / service payant | Dépôt (simple, revu en PR ; services payants contraires à la gratuité) | — |
| Q3 | Job visuel bloquant dès le départ ? | Bloquant / informatif 2 semaines | Informatif 2 semaines, puis bloquant avant 063 | — |
| Q4 | Niveau exigé | WCAG 2.1 AA / 2.2 AA | 2.1 AA au lot 1, 2.2 AA quand 064 est livré | — |
| Q5 | Viewports des captures | 3 nus / 3 réalistes de 042 | Réalistes de 042 dès qu'ils existent | — |

## 25. Traçabilité

Rapports `docs/v2/audit/05-design-system.md` (§2.5, §2.9, §4, V2-THEME-03), `docs/v2/audit/10-docs-quality.md` (§5.4, V2-QA-05/06), `docs/v2/audit/06-tablet.md` (§2.2) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §C.2, §F.1, §H.25 ; specs 063, 064, 065, 067, 068, 093.

## Révision DevSecOps (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue du chantier DevSecOps (audit `docs/v2/audit/11-devsecops.md`) ; aucune exigence ci-dessous n'est validée. Le contenu ci-dessus est conservé tel quel.

### Articulation avec Lighthouse CI (V2-QA-15, spec 123)

Lighthouse calcule un score d'accessibilité global au chargement de `/` (sous-ensemble de règles axe) ; cette spec reste **l'autorité d'accessibilité par écran** (axe-core sur ~20 écrans, fichier de dette). Pour éviter un double blocage contradictoire :

- DSO-FR-01 Le seuil Lighthouse d'accessibilité (123 §8) ne s'applique qu'aux URL mesurées par Lighthouse ; toute violation axe connue de ces écrans est d'abord inscrite dans le fichier de dette de 041.
- DSO-FR-02 Les jobs visuels et a11y de 041 s'insèrent dans le catalogue de 113 (workflow `e2e` ou `performance`) avec un agrégateur (114) ; la mise à jour des captures de référence n'est jamais faite par Renovate ni par un agent sans revue (126 RM-04).

### Dépendances

V2-QA-15 (123), V2-CICD-01 (113), V2-CICD-02 (114).


## Reliquats reçus à la clôture des recettes (2026-11-27)

Sources : [063](../063-counter-design-tokens/spec.md#clôture-2026-11-27), [065](../065-counter-screen-migration-to-tokens/spec.md#clôture-2026-11-27), [066](../066-counter-reserved-game-colors/spec.md#clôture-2026-11-27), [068](../068-counter-light-mode/spec.md#clôture-2026-11-27), [070](../070-counter-size-class-resolver/spec.md#clôture-2026-11-27), [071](../071-counter-tablet-landscape-fixes/spec.md#clôture-2026-11-27), [072](../072-counter-arena-layout/spec.md#clôture-2026-11-27). Les tâches non livrées décrites dans leurs clôtures sont désormais suivies ici, sans les déclarer exécutées. La recette du produit en production a été confirmée par le product owner ; elle ne valide ni cette proposition ni ses nouveaux outils. Le statut reste `a-valider`.
