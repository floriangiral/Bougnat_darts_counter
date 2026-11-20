---
id: 063-counter-design-tokens
v2_id: V2-DS-01
titre: Design tokens (socle unique Dark/Light/club/TV)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: design-system
priorite: P0
difficulte: L
recommandation: recommande
lot: 1
poids: 20
depend_de: [V2-DS-00, V2-QA-05]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 063 — Design tokens (socle unique Dark/Light/club/TV)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (chantier 5.2 « mode Light », 5.7 « personnalisation clubs », 5.6 « mode TV ») et rapport d'audit 05 (design system), repris au compte rendu consolidé §C.2 et §F.3. Le compte rendu fixe la règle « un seul système de couleurs » : Dark, Light, thème club et écran TV doivent consommer les mêmes rôles. La décision d'architecture associée est portée par l'**ADR 0006 — design tokens** (à rédiger dans `docs/adr/`).

## 2. Problématique
Il n'existe aucune couche de tokens : les couleurs sont codées en dur dans le JSX. Sans socle commun, le mode Light, les thèmes club et la TV imposeraient trois systèmes parallèles et une double migration.

## 3. Objectifs
- O1. Introduire des tokens à trois niveaux (primitives → rôles sémantiques → composants) exposés à Tailwind 4.
- O2. Livrer un **thème Dark officiel visuellement identique** à l'existant (aucune régression perceptible, prouvée par captures V2-QA-05).
- O3. Empêcher toute augmentation du nombre de classes de palette brute (cliquet CI).
- O4. Rendre les valeurs de tokens compatibles avec la baseline navigateurs décidée par V2-DS-00 (spec 018).

## 4. État actuel vérifié dans le code
- [vérifié] `src/styles/tailwind.css:1` importe `tailwindcss` sans `@theme` ni `@custom-variant` ; les variables CSS existantes ne concernent que la mise en page (`tailwind.css:15-20`, `--tablet-safe-*` l.113-118, `--x01-score-fs` l.520-527).
- [vérifié] 0 utilisation de `dark:` dans `components/`, `views/`, `src/`, `App.tsx`.
- [vérifié] 1 465 occurrences de classes de palette brute (bg/text/border/from/to/via/ring/shadow… × palettes Tailwind) dans les `.ts/.tsx` hors tests (regex élargie du rapport 05, recomptée au commit 508dfa6).
- [vérifié] Fond du `body` déclaré deux fois : `index.html:21-28` (style inline) et `src/styles/tailwind.css:9-13`.
- [vérifié] Couleurs en dur dans la feuille : `tailwind.css:207` (`rgb(31 41 55 / 1)`), `:266` (`rgb(6 8 13 / 0.94)`), `:425` (`rgba(12, 16, 26, 0.94)`).
- [vérifié] `index.html:7` `theme-color #1a1a1a` alors que `manifest.json` déclare `theme_color #ea580c` (traité par V2-THEME-02).
- [vérifié] Le build local `dist/assets/index-C2qto8R6.css` (19/11, possiblement antérieur au HEAD) contient `@layer` (5 couches), `color-mix` (418 occurrences), `lab(` (90), `@property` (63) : formats hors de portée d'iOS 12 et des navigateurs TV 2022-2024 [à confirmer sur appareil, voir V2-DS-00].
- [vérifié] CSP `public/_headers:2` : `style-src 'self' 'unsafe-inline'` autorise des variables CSS posées en ligne (thème club ultérieur).

## 5. Comportement cible
Une feuille de tokens définit des primitives (préfixe `--bd-`), des rôles sémantiques par thème sur `html[data-theme="dark"|"light"]`, et quelques tokens de composants. Un pont `@theme inline` expose les rôles à Tailwind (`bg-surface`, `text-fg`, `border-border`…). L'application reste en Dark ; seul le mécanisme change.

## 6. Périmètre
### Inclus
- Fichiers de tokens (primitives, thèmes, composants, pont Tailwind) dans `src/styles/tokens/`.
- Attribut `data-theme="dark"` posé sur `<html>` dès le premier rendu (la sélection est V2-THEME-02).
- Thème Dark officiel = valeurs actuelles normalisées (les 10 quasi-noirs relevés réduits à 3 niveaux au plus, sous réserve de validation visuelle).
- Suppression du style dupliqué du `body` et tokenisation des 3 couleurs en dur de `tailwind.css`.
- Cliquet CI dans `scripts/guard-clean-codebase.sh` (compteur de classes de palette brute, référence 1 465).
- Documentation de la convention de nommage (ADR 0006 + guide court).
### Exclu
- Conversion des écrans (V2-DS-03), composants (V2-DS-02), couleurs métier (V2-DS-04), mouvement (V2-DS-05), palette Light (V2-THEME-01), sélection du thème (V2-THEME-02), thème club (V2-BRAND-01), feuille TV (V2-TV-06).
- Verrouillage final `--color-*: initial` (fin de V2-DS-03).

## 7. User stories
- En tant que mainteneur, je veux une liste fermée de rôles de couleur, afin d'ajouter Light, TV et thème club sans retoucher chaque écran.
- En tant que joueur, je veux que l'application reste identique après la livraison du socle, afin de ne subir aucune régression.

## 8. Règles métier
- RM-01 Aucune règle de jeu n'est concernée ; les tokens sont de la présentation pure.
- RM-02 Les couleurs à sens métier (bust, fermé, multiplicateurs, joueur actif) sont des rôles réservés définis par V2-DS-04, non personnalisables.

## 9. Parcours utilisateurs
Sans objet : aucun parcours visible ne change (livraison sans changement visuel). Le parcours ouvrir → jeu → prénoms → jouer reste identique.

## 10. Exigences fonctionnelles
- FR-01 Trois niveaux de tokens : primitives (jamais utilisées dans le JSX), rôles sémantiques (seuls exposés à Tailwind), tokens de composants (limités : bouton primaire, touche de pavé, carte de score, TV).
- FR-02 Les rôles couvrent au minimum : surfaces (`canvas`, `surface`, `surface-raised`, `surface-sunken`, `scrim`), bordures (`border-subtle`, `border`, `border-strong`), texte (`fg`, `fg-muted`, `fg-subtle`, `fg-disabled`, `fg-inverse`), marque (`brand`, `brand-2`, `brand-fg`, `on-brand`, `brand-subtle`), feedback (`success`, `danger`, `warning`, `info` + `on-*`), `focus-ring`, et l'espace de nommage `game-*` réservé à V2-DS-04.
- FR-03 Les rôles sont exposés via `@theme inline` ; `@custom-variant dark`/`light` existent mais leur usage dans les composants est interdit hors exception documentée.
- FR-04 `<html>` porte `data-theme="dark"` avant le premier rendu React (valeur par défaut tant que V2-THEME-02 n'est pas livrée).
- FR-05 Les variantes translucides critiques (`brand-subtle`, `scrim`…) sont **pré-calculées** en rgb/rgba, sans dépendre de `color-mix()` ni de la syntaxe `/opacité` de Tailwind.
- FR-06 Le style du `body` n'est déclaré qu'une fois et utilise `var(--bd-canvas)` / `var(--bd-fg)`.
- FR-07 `scripts/guard-clean-codebase.sh` échoue si le nombre de classes de palette brute dépasse la référence enregistrée ; la référence ne peut que décroître.
- FR-08 Les tokens de mise en page existants (`--app-safe-*`, `--tablet-safe-*`, `--x01-*`, `--app-viewport-height`) ne sont pas renommés par cette spec.

## 11. Exigences non fonctionnelles
- NFR-01 Compatibilité : format des valeurs (hex/rgb vs oklch) conforme à la baseline V2-DS-00 ; recommandation : hex/rgb pour toutes les primitives.
- NFR-02 Performance : aucun re-render React lié au thème ; aucun octet JS supplémentaire au démarrage hors attribut `data-theme`.
- NFR-03 Aucune nouvelle dépendance runtime ; coût récurrent 0 €.
- NFR-04 Accessibilité : les paires déclarées du Dark officiel sont mesurées (matrice de contraste V2-QA-05) ; aucune paire ne se dégrade.

## 12. Cas nominaux et alternatifs
- Nominal : build → CSS contenant primitives, rôles Dark, pont Tailwind ; rendu identique aux captures de référence.
- Alternatif : un écran non encore migré continue d'utiliser la palette Tailwind par défaut (cohabitation pendant V2-DS-03).

## 13. Cas limites
- Navigateur sans support des propriétés personnalisées (aucun dans la baseline envisagée) : sans objet si V2-DS-00 confirme une baseline ≥ Safari 9.1.
- Navigateur ignorant `@layer` (Safari < 15.4 [à confirmer]) : les tokens restent définis hors couche pour rester lisibles ; le comportement des utilitaires relève de V2-DS-00.

## 14. Gestion des erreurs
Sans objet à l'exécution (CSS statique). En CI : message explicite du cliquet indiquant le fichier et le delta.

## 15. Impacts architecturaux
Couche présentation uniquement (`src/styles/`). Aucune dépendance du domaine vers les tokens. `src/features/x01/scoring/matchFeedback.ts` (qui renvoie des classes) est traité par V2-DS-04. ADR 0006 à créer.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Contrat d'interface CSS : liste des rôles publiée (documentation) ; elle devient un contrat pour V2-BRAND-01 et V2-TV-06.

## 17. Compatibilité avec l'existant
Les classes Tailwind par défaut continuent de fonctionner pendant la migration. Les crochets de mise en page (`data-layout`, `.tablet-*`) sont inchangés.

## 18. Dépendances
- V2-DS-00 (spec 018) : baseline navigateurs **décidée avant** le choix du format des tokens.
- V2-QA-05 (041) : captures de référence et matrice de contraste **avant** la livraison du socle.
- Débloque : V2-DS-02 (064), V2-DS-03 (065), V2-DS-04 (066), V2-DS-05 (067), V2-THEME-02 (069), V2-TAB-03 (072), V2-TV-06 (086), V2-BRAND-01 (093).

## 19. Critères d'acceptation
- AC-01 Étant donné le build de production, quand on inspecte la CSS, alors elle contient les primitives, les rôles Dark et le pont `@theme inline`, et `<html data-theme="dark">` est présent dans `index.html` (preuve : test unitaire de lecture du fichier + inspection build).
- AC-02 Étant donné les captures V2-QA-05 (accueil, sélection, setup, X01, Cricket, Capital, Killer, Gotcha, Triathlon, statistiques ; téléphone, tablette, bureau), quand on rejoue la suite après livraison, alors aucune capture ne dépasse la tolérance fixée par V2-QA-05.
- AC-03 Étant donné une PR ajoutant une classe `bg-gray-800`, quand la CI exécute `guard:clean`, alors le job échoue avec le fichier et le compteur.
- AC-04 Étant donné le code source, quand on recherche `dark:` dans `components/`, `views/`, `src/`, alors 0 occurrence hors exceptions listées.
- AC-05 Étant donné `index.html` et `tailwind.css`, alors le fond du `body` n'est déclaré qu'une fois.
- AC-06 Étant donné la CSS des tokens, quand on recherche `color-mix(` ou `oklch(` dans les fichiers de tokens, alors 0 occurrence (si NFR-01 est retenue).

## 20. Scénarios de tests
- Unitaires (Vitest) : lecture de `src/styles/tokens/*.css`, vérification que chaque rôle déclaré existe pour `dark`, que les primitives sont en hex/rgb.
- Tests du cliquet : script testé sur un fichier fixture (ajout → échec ; retrait → succès).
- E2E : captures V2-QA-05 rejouées ; attribut `data-theme` vérifié au chargement.
- Terrain : vérification visuelle sur un appareil de la baseline la plus basse retenue par V2-DS-00.

## 21. Exigences de non-régression
Specs 005 (cohérence scoreboard), 021 (résilience à l'échelle de police), 027/028 (contrats de mise en page) : aucun sélecteur de mise en page modifié. Tous les tests unitaires existants passent sans modification.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Normalisation des quasi-noirs perceptible | Moyen | Moyenne | Captures avant/après, validation PO sur maquette |
| Choix de format invalidé par V2-DS-00 | Élevé | Moyenne | Ne pas démarrer avant la décision 018 |
| Conflits avec la refonte tablette | Moyen | Élevée | Socle seul ici ; écrans migrés dans les lots V2-DS-03 + V2-TAB-03 |
| Cliquet contourné (classes construites dynamiquement) | Faible | Moyenne | Regex documentée, revue de code |

## 23. Décisions architecturales
ADR 0006 — design tokens (option « variables CSS + `@theme inline` » retenue contre `dark:` partout, CSS-in-JS, feuilles multiples, bibliothèque de thèmes ; comparatif au rapport 05 §4.1).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Format des valeurs de tokens | hex/rgb ; oklch avec repli | hex/rgb (compatible baseline basse, TV) — dépend de V2-DS-00 | À prendre |
| Q2 | Normaliser les 10 quasi-noirs dès le socle | Oui (3 niveaux) ; non (copie exacte) | Oui, validé sur captures | À prendre |
| Q3 | Préfixe des primitives | `--bd-` ; autre | `--bd-` | À prendre |
| Q4 | Moment du verrouillage `--color-*: initial` | Fin de V2-DS-03 ; jamais | Fin de V2-DS-03 | À prendre |
| Q5 | Tokens avant ou pendant la refonte tablette (H, C.2) | Socle avant, écrans dans les mêmes lots | Socle avant ; écrans dans les lots V2-DS-03/V2-TAB-03 | À prendre |

## 25. Traçabilité
Rapport 05 §2.1, §2.2, §2.7, §4.1-4.6 ; compte rendu §A (faiblesse 4), §C.2, §F.3, §G (Lot 1), §H.3 ; ADR 0006 ; specs liées 005, 018, 021, 027, 028, 031.
