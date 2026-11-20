#!/usr/bin/env python3
# Script ponctuel de mise à jour documentaire (chantier tablette + thèmes, 2026-11-20). Supprimé après usage.
import glob
import re
import sys

BANNER = ("> **Statut : IMPLÉMENTÉE** le 2026-11-20 (issue {issue}, branche `feat/v2.0.0`, chantier « refonte tablette "
          "et thèmes »). Les questions ouvertes ont été tranchées selon la recommandation de la spec, à la demande du "
          "product owner ; la recette terrain et l'exécution des tests E2E dans la CI de la PR restent à faire "
          "(`validation: en-attente`).")

PLAN_NOTE = "> **Réalisation (2026-11-20)** : {text}"

SUIVI = ("\n## Suivi d'implémentation (2026-11-20)\n\n{text}\n")


def folder(num):
    return glob.glob(f"specs/{num}-*")[0]


def read(path):
    with open(path, encoding="utf-8") as handle:
        return handle.read()


def write(path, text):
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)


def set_yaml(text, key, value):
    head, sep, body = text.partition("\n---\n")
    pattern = re.compile(rf"^{re.escape(key)}: .*$", re.M)
    if pattern.search(head):
        head = pattern.sub(lambda _m: f"{key}: {value}", head, count=1)
    else:
        head = head + f"\n{key}: {value}"
    return head + sep + body


def fill_decisions(text, decisions):
    for qid, decision in decisions.items():
        pattern = re.compile(rf"^(\| {qid} \|.*\| )À prendre( \|)$", re.M)
        text, count = pattern.subn(lambda m: m.group(1) + decision + m.group(2), text, count=1)
        if count != 1:
            sys.exit(f"décision {qid} introuvable")
    return text


def update_tasks(text, tasks):
    for tid, (checked, note) in tasks.items():
        pattern = re.compile(rf"^- \[ \] ({tid}\b.*)$", re.M)
        match = pattern.search(text)
        if not match:
            sys.exit(f"tâche {tid} introuvable")
        line = match.group(1)
        if note:
            line = f"{line} — {note}"
        box = "[x]" if checked else "[ ]"
        text = text[:match.start()] + f"- {box} {line}" + text[match.end():]
    return text


def apply(num, issue, decisions, implementation, plan_note, tasks, suivi, yaml=None, banner=True):
    base = folder(num)
    spec = read(f"{base}/spec.md")
    spec = set_yaml(spec, "statut", "implementee")
    spec = set_yaml(spec, "validation", "en-attente")
    spec = set_yaml(spec, "verifie_au_commit", "à renseigner")
    spec = set_yaml(spec, "derniere_revue", "2026-11-20")
    for key, value in (yaml or {}).items():
        spec = set_yaml(spec, key, value)
    if banner:
        old = "> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée."
        if old not in spec:
            sys.exit(f"bandeau introuvable : {num}")
        spec = spec.replace(old, BANNER.format(issue=issue), 1)
    spec = fill_decisions(spec, decisions)
    spec = spec.rstrip("\n") + "\n\n## Implémentation (2026-11-20)\n\n" + implementation.strip("\n") + "\n"
    write(f"{base}/spec.md", spec)

    plan = read(f"{base}/plan.md")
    lines = plan.split("\n")
    index = next(i for i, line in enumerate(lines) if line.startswith("> "))
    lines.insert(index + 1, "")
    lines.insert(index + 2, PLAN_NOTE.format(text=plan_note))
    write(f"{base}/plan.md", "\n".join(lines))

    task_text = update_tasks(read(f"{base}/tasks.md"), tasks)
    task_text = task_text.rstrip("\n") + "\n" + SUIVI.format(text=suivi.strip("\n"))
    write(f"{base}/tasks.md", task_text)


E2E_PENDING = "écrit, à exécuter dans la CI de la PR"
FIELD = "recette terrain à faire"
CLOSE = "spec passée à `implementee` ; `verifie_au_commit` à renseigner et issue à fermer"
PO = "décision du PO du 2026-11-20 : recommandations appliquées"

# ---------------------------------------------------------------- 070
apply(
    "070", "#221",
    {
        "Q1": "Forçage `touch` seulement : `dedicated_tablet` ne change jamais la structure",
        "Q2": "Rendu PC conservé pour l'instant : la recette `arena` est calculée mais la CSS ne l'applique qu'avec `data-input=\"touch\"` ; arène sur PC après validation sur tablette",
        "Q3": "`src/features/layout/` (`src/features/tablet/` supprimé)",
        "Q4": "Hauteur de fenêtre (`innerHeight`), pas `visualViewport`, pour la recette ; `--app-viewport-height` inchangé",
    },
    """
- Issue #221 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation (colonne « Décision »). L'[ADR 0007](../../docs/adr/0007-classes-de-taille-et-orientation.md) est acceptée.
- Fichiers principaux :
  - `src/features/layout/viewportClass.ts` : fonction pure `resolveViewportClass` (classes de largeur 600/840/1200, de hauteur 480/900, densité 600/760/900, orientation, modalité, recette `stack` / `stack-wide` / `arena` / `phone-landscape`), constantes nommées exportées ; repli sûr (`stack`, tactile) pour des dimensions nulles ou invalides ; `matchMedia` indisponible → tactile. Une fenêtre de bureau (pointeur fin) de moins de 768 px garde la présentation téléphone (`DESKTOP_NARROW_WIDTH`, comportement antérieur conservé).
  - `src/features/layout/useViewportClass.ts` : hook unique lu par `App` (`resize`, `orientationchange`, changement de `any-pointer: coarse`), sans nouveau rendu quand la classe ne change pas ; `ViewportContext` / `useViewport()` pour les vues.
  - `App.tsx` : attributs racine `data-size-w`, `data-size-h`, `data-orientation`, `data-input`, `data-density`, `data-recipe` et `data-layout` **dérivé** (FR-06 : conservé tant que la CSS le lit, retrait ultérieur).
  - `views/MatchView.tsx` : plus aucune détection locale ; `isCompactPhone` vient du contexte (présentation téléphone et densité `tight`/`compact`). `isCompactBrowserMobile` est supprimé.
  - Supprimés : `src/features/tablet/` (dont `TABLET_BREAKPOINTS`) et `tests/unit/tabletLayout.test.ts`.
- Tests unitaires : `tests/unit/layout/viewportClass.test.ts` (table de vérité des profils d'AC-01, plus 1024×600, 932×430 et une fenêtre de bureau étroite ; seuils ; forçage `dedicated_tablet` ; repli ; contrat d'attributs), `tests/unit/layout/useViewportClass.test.tsx` (lecture, absence de `matchMedia`, recalcul à la rotation sans rendu inutile, contexte).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/tablet-layout.smoke.spec.ts` (détection réelle sans `?mode=dedicated_tablet`, AC-03 ; rotation 810×1010 → 1080×750 avec une saisie en cours, AC-04) sur les sept profils tablette de `playwright.config.ts` ; `tests/e2e/smartphone-layout.smoke.spec.ts` (recettes `stack` et `phone-landscape`).
- Écarts et restes :
  - AC-05 : captures de non-régression téléphone/bureau non produites (dépend de V2-QA-05, spec 041).
  - `data-layout` est toujours posé et lu par la CSS : son retrait reste à planifier (FR-06).
  - Cas limites §13 (multitâche iPad, iPad avec trackpad) et recette terrain (iPad Safari, iPad écran d'accueil, Galaxy Tab Chrome, petite tablette Android) à faire.
  - Coordination avec V2-ARCH-12 (spec 001) : le rôle de `dedicated_tablet` est redéfini dans le code, la spec 001 n'a pas été modifiée.
""",
    "étapes 1 à 6 réalisées (module `src/features/layout/`, hook unique, attributs racine, `MatchView` sans détection locale, `dedicated_tablet` = forçage tactile) ; étape 7 réalisée par suppression directe de `src/features/tablet/`. Restent le retrait de `data-layout`, les captures V2-QA-05 et la recette terrain. Détail : section « Implémentation (2026-11-20) » de la spec.",
    {
        "T000": (True, f"{PO} ; ADR 0007 acceptée"),
        "T001": (True, "décisions reportées dans la spec"),
        "T002": (True, None),
        "T003": (True, None),
        "T004": (True, "stabilisation par la hauteur de fenêtre (Q4)"),
        "T005": (True, None),
        "T006": (True, None),
        "T007": (True, "forçage tactile seulement ; spec 001 non modifiée"),
        "T008": (True, "`src/features/tablet/` supprimé"),
        "T009": (True, None),
        "T010": (False, E2E_PENDING),
        "T011": (False, E2E_PENDING),
        "T012": (False, "captures à produire par V2-QA-05 (spec 041)"),
        "T013": (True, "ADR 0007 acceptée, `docs/architecture.md`, notes v2.0.0"),
        "T014": (False, CLOSE),
    },
    "Code et tests unitaires livrés sur `feat/v2.0.0` (issue #221) ; commit de vérification à renseigner. Restent ouverts : exécution des E2E dans la CI de la PR (T010, T011), captures de non-régression (T012, spec 041), recette terrain, validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 071
apply(
    "071", "#209",
    {
        "Q1": "Pas de seuils transitoires : la classification est remplacée directement par le résolveur de 070",
        "Q2": "48 px tablette / 28 px téléphone (`--x01-score-floor`), ajustables après mesure",
        "Q3": "Inclus dans la 2.0.0",
        "Q4": "Grille compacte d'abord ; en dernier recours, seule la zone de saisie défile",
    },
    """
- Issue #209 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation, Q1 étant absorbée par le résolveur de la spec 070 (aucune règle transitoire n'a été écrite).
- Correctifs :
  - Classification (FR-01, AC-01) : 1080×750, 1280×696, 1280×800, 960×520, 1024×600 et 1366×950 tactiles sont classés tablette par `resolveViewportClass` (spec 070).
  - Cascade (FR-02) : la règle « bureau à fenêtre basse » de `src/styles/games/x01.css` est limitée à `[data-layout='default']` ; elle ne réduit plus la zone de saisie d'une tablette.
  - Plancher 48 px (FR-03) : seul le bureau (pointeur fin) retire la hauteur minimale des touches du pavé X01 ; la classe `bd-touch-target` des composants de base (spec 064) donne 48 px en tablette tactile et 44 px en téléphone tactile ; boutons d'en-tête `IconButton` carrés de 48 px en tablette ; en tablette portrait, la zone de saisie X01 garde la place de quatre rangées de 48 px.
  - Score X01 (FR-04) : plancher `--x01-score-floor` (48 px tablette, 28 px téléphone) dans le calcul de taille du score.
  - Killer (FR-05) : grille compacte, défilement de la seule zone de saisie en dernier recours (`src/styles/games/killer.css`).
  - Cricket (FR-06) : le tableau grandit ou défile au lieu d'être coupé ; la ligne Bull n'est jamais masquée (`src/styles/games/cricket.css`).
- Tests unitaires : table de vérité de classification de la spec 070 (`tests/unit/layout/viewportClass.test.ts`, remplace `tests/unit/tabletLayout.test.ts`).
- Tests E2E écrits, **non exécutés localement** : projets `tablet-*` de `playwright.config.ts` (1080×750, 1366×950, 1280×696, 1280×800, 960×520, 1024×600, 810×1010), sans `?mode=dedicated_tablet` ; `tests/e2e/tablet-layout.smoke.spec.ts` mesure les boutons d'en-tête et de saisie de chaque jeu (≥ 48 × 48 px, atteignables), l'absence de débordement, le corps du score X01 (≥ 48 px) et l'absence de vide de plus de 48 px sous le pavé X01 en paysage.
- Écarts et restes :
  - AC-04 est vérifié avec la configuration par défaut de Killer, pas avec 6 joueurs ; AC-05 (ligne Bull visible) est garanti par la CSS mais pas mesuré explicitement par l'E2E.
  - AC-07 : la non-régression téléphone/bureau n'est pas comparée au commit 508dfa6 (captures V2-QA-05, spec 041).
  - Recette terrain (iPad Safari paysage, tablette Android) à faire.
""",
    "étapes réalisées dans le chantier tablette (spec 070 pour la classification, CSS par jeu dans `src/styles/games/`, planchers dans `src/styles/layout/game-screen.css`). Les seuils transitoires n'ont pas été écrits (Q1). Restent l'exécution des E2E en CI, les captures de non-régression et la recette terrain.",
    {
        "T000": (True, f"{PO} ; inclus dans la 2.0.0 (Q3)"),
        "T001": (True, None),
        "T002": (False, f"projets ajoutés ; {E2E_PENDING}"),
        "T003": (False, f"assertions écrites (Killer à la configuration par défaut, ligne Bull non mesurée) ; {E2E_PENDING}"),
        "T004": (True, "remplacé par le résolveur de 070 (Q1) ; `tests/unit/tabletLayout.test.ts` supprimé"),
        "T005": (True, "règle bureau limitée à `[data-layout='default']`"),
        "T006": (True, None),
        "T007": (True, "plancher `--x01-score-floor`"),
        "T008": (True, None),
        "T009": (True, None),
        "T010": (True, "`IconButton` 48 × 48 px en tablette"),
        "T011": (False, "comparaison au commit 508dfa6 à faire (captures spec 041)"),
        "T012": (False, FIELD),
        "T013": (True, "`docs/release/v2.0.0.md` et Révision V2 de 027 mis à jour"),
        "T014": (False, CLOSE),
    },
    "Correctifs livrés sur `feat/v2.0.0` (issue #209) ; commit de vérification à renseigner. Restent ouverts : exécution des E2E dans la CI de la PR (T002, T003), non-régression comparée (T011), recette terrain (T012), validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 072
apply(
    "072", "#244",
    {
        "Q1": "Rendu PC conservé pour l'instant (arène limitée à `data-input=\"touch\"`) ; arène sur PC après validation sur tablette",
        "Q2": "Actif dominant (prototype sur appareil non réalisé, validation sur captures et en recette)",
        "Q3": "Saisie à droite, côté fixe ; réglage de main dominante plus tard si demandé",
        "Q4": "Oui : finish dans la zone de saisie en arène et en paysage téléphone ; modale plein écran conservée en pile",
        "Q5": "Oui : transition de manche limitée à la zone joueurs",
    },
    """
- Issue #244 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q5 selon la recommandation (colonne « Décision »).
- Structure commune :
  - `components/layout/GameScreenLayout.tsx` : zones `header`, `band` (optionnelle : bandeau de phase), `players`, `input`, superpositions en enfants ; emplacements `voiceStatus` et `broadcastStatus` vides par défaut (FR-09) ; aucune règle de jeu (RM-01). Écart avec le §5 : pas de zones `active` et `controls` séparées, la carte du joueur actif vit dans `players` et les commandes dans `header` / `input`.
  - `src/styles/layout/game-screen.css` : zones empilées en `stack` / `stack-wide` (et au bureau) ; en `arena` et `phone-landscape` tactiles, grille joueurs (~58 %) | saisie (~42 %, 50/50 en paysage téléphone), saisie à droite (Q3), en-tête et bandeau sur toute la largeur.
  - Les six écrans de jeu utilisent `GameScreenLayout` : `views/MatchView.tsx`, `CricketGameView.tsx`, `CapitalGameView.tsx`, `KillerGameView.tsx`, `GotchaGameView.tsx`, `TriathlonGameView.tsx` (bandeau de phase `components/triathlon/TriathlonPhaseBand.tsx`, FR-06). Règles propres à chaque jeu : `src/styles/games/{x01,cricket,capital,killer,gotcha,triathlon}.css`.
- Par jeu :
  - X01 : `components/match/MatchPlayersBoard.tsx` (joueur actif dominant, compteurs par carte), joueur actif signalé par fond, barre et ▶ (RM-02) ; Retour posé à côté de OK sur la dernière rangée du pavé (≥ 64 px, ≥ 48 px en densité `tight`, FR-07) ; Quitter séparé et confirmé ; choix des fléchettes au finish limité à la zone de saisie (Q4, FR-08) ; transition de manche limitée à la zone joueurs (Q5).
  - Cricket : colonne des cibles au centre, 7 lignes toujours affichées (le tableau défile au lieu d'être coupé), états `data-state` fermé (X cerclé) et fermé par tous (barré), joueur actif ▶ + bordure + fond ; pas de touche Valider : « C » (annuler) est placé dans la rangée du bas avec MISS et 3 MISS.
  - Capital : objectif courant ≥ 40 px, scores ≥ 56 px, grille 2 × 2 à 4 joueurs, Retour et OK côte à côte en bas de la zone de saisie.
  - Killer et Gotcha : cartes et textes agrandis en arène (≥ 32 px visés), grille de saisie dans la zone de saisie.
- Tests unitaires : `tests/unit/layout/gameScreenLayout.test.tsx` (ordre des zones, bandeau absent par défaut, emplacements voix et TV), `tests/unit/components/keypads.test.tsx` (touche Retour d'arène juste avant OK).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/tablet-layout.smoke.spec.ts` (tous les jeux : actions atteignables et cibles ≥ 48 px ; X01 : Annuler et Valider sur la même rangée en paysage ; rotation en cours de saisie, AC-06).
- Écarts et restes :
  - Tailles calculées par la CSS, **non mesurées** : AC-01 (score actif ≥ 160 px, adverse ≥ 96 px à 1080×810), AC-02 (points Cricket ≥ 48 px), AC-03 (Killer à 6 joueurs, textes ≥ 32 px) et la hauteur ≥ 64 px d'AC-04 (l'E2E vérifie un plancher de 48 px) ; contrôle axe-core non écrit (V2-QA-05).
  - AC-07 : les vues n'utilisent plus les classes `.tablet-<jeu>-*`, mais la feuille `src/styles/layout/legacy-tablet-grid.css` est encore importée au moment de cette rédaction ; sa suppression est prévue en fin de chantier.
  - AC-08 (lecture à 3 m par trois personnes) et prototype sur appareil (Q2) : recette terrain à faire.
  - Guide utilisateur tablette : inexistant, non créé.
""",
    "étape 1 (prototype sur appareil) non réalisée ; étapes 2 à 5 réalisées (composant à zones, lots X01, Cricket, Capital, Killer/Gotcha, Triathlon) ; étape 6 en cours (vues migrées, feuille `legacy-tablet-grid.css` à supprimer) ; étape 7 (arène sur PC) reportée (Q1). Détail : section « Implémentation (2026-11-20) » de la spec.",
    {
        "T000": (True, f"{PO} ; 070 et 063 livrées dans le même chantier"),
        "T001": (False, "décisions Q1 à Q5 reportées ; prototype sur appareil non réalisé"),
        "T002": (True, None),
        "T003": (True, None),
        "T004": (True, None),
        "T005": (True, None),
        "T006": (True, None),
        "T007": (True, None),
        "T008": (False, "vues migrées ; `src/styles/layout/legacy-tablet-grid.css` à supprimer en fin de chantier"),
        "T009": (True, None),
        "T010": (False, f"cibles ≥ 48 px et rangée Annuler/Valider écrites, tailles AC-01 à AC-03 non mesurées ; {E2E_PENDING}"),
        "T011": (False, E2E_PENDING),
        "T012": (False, FIELD),
        "T013": (False, "notes de release et architecture mises à jour ; guide utilisateur tablette non créé"),
        "T014": (False, CLOSE),
    },
    "Disposition à zones livrée sur `feat/v2.0.0` pour les six écrans de jeu (issue #244) ; commit de vérification à renseigner. Restent ouverts : prototype et lecture à 3 m sur appareil (T001, T012), suppression de la grille legacy (T008), mesures et exécution des E2E dans la CI de la PR (T010, T011), guide tablette (T013), validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 073
apply(
    "073", "#247",
    {
        "Q1": "Invite non bloquante",
        "Q2": "Écrans de jeu (`FULLSCREEN_SCREENS`)",
        "Q3": "Étude `orientation: natural` ultérieure (après 031) ; manifeste inchangé (`orientation: any`)",
        "Q4": "« Tournez la tablette pour l'affichage paysage » (action « Continuer en portrait »)",
    },
    """
- Issue #247 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation ; côté téléphone, décision B de la spec 028 (V2-TAB-06).
- Fichiers principaux :
  - Port `src/application/orientation/orientationPort.ts` (`isSupported`, `lock('landscape')`, `unlock`) et adaptateur `src/infrastructure/web/screenOrientation.ts` (refus ou absence d'API sans erreur visible ; détection du multitâche — écran paysage, fenêtre portrait ; lecture du plein écran standard et préfixé).
  - Décision pure `src/features/layout/orientationHint.ts` (`resolveOrientationHint`, `shouldLockLandscape`) fondée sur la classe de la spec 070 ; hook `src/app/useGameOrientation.ts` appelé par `App.tsx` ; composant `components/ui/OrientationHint.tsx` (`role="status"`, bouton « Continuer en portrait » atteignable au clavier, bandeau centré en haut de l'écran).
  - Android : le verrou paysage est tenté quand le document est en plein écran (au montage et sur `fullscreenchange` / `webkitfullscreenchange`), uniquement en classe tablette tactile sur un écran de jeu ; `unlock()` à la sortie des écrans de jeu ; un verrou est considéré libéré quand le plein écran est quitté. Écart avec T003 : `enterFullScreen` n'a pas été modifié, la séquence repose sur l'événement de plein écran.
  - « Continuer en portrait » est mémorisé pour la partie en cours : `sessionStorage`, clé `bougnat-orientation-hint-dismissed` (identifiant de la partie) ; le choix survit au rechargement de la même partie, l'invite revient à la partie suivante.
  - Aucun `lock('portrait')` n'existe plus : `usePortraitLock` est supprimé (spec 028, Q4).
- Tests unitaires : `tests/unit/layout/orientation.test.tsx` (table de décision AC-O1 à AC-O4, AC-O7 ; verrou réservé à la tablette tactile en partie, AC-O6 ; port web et absence d'API ; séquence plein écran → verrou → libération, AC-O5 ; mémorisation par partie et après rechargement ; invite non bloquante et fermable).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/tablet-layout.smoke.spec.ts` (aucune invite hors partie, AC-O2 ; invite en portrait et disparition en paysage, AC-O1 ; « Continuer en portrait », AC-O4) ; `tests/e2e/smartphone-layout.smoke.spec.ts` (aucune invite tablette sur téléphone, AC-O3).
- Écarts et restes :
  - Délai d'affichage ≤ 300 ms (FR-01) et emprise ≤ 20 % de la hauteur (NFR-03) non mesurés.
  - AC-O8 (partie restaurée en portrait) : couvert par la décision pure, indépendante du plein écran, et les tests unitaires ; pas d'E2E dédié.
  - Tests manuels : Chrome Android en plein écran (AC-O5), Samsung Internet, iPad Safari, multitâche iPad (AC-O7).
""",
    "étapes réalisées (port d'orientation, adaptateur web, décision pure, hook et invite, mémorisation par partie, suppression du verrou portrait) ; la séquence Android s'appuie sur l'événement `fullscreenchange` plutôt que sur une promesse renvoyée par `enterFullScreen`. Restent les tests terrain et l'exécution des E2E en CI.",
    {
        "T000": (True, f"{PO} ; 070 livrée dans le même chantier"),
        "T001": (True, "y compris la décision B de V2-TAB-06 (verrou portrait retiré)"),
        "T002": (True, None),
        "T003": (True, "verrou posé sur `fullscreenchange` ; `enterFullScreen` inchangé"),
        "T004": (True, None),
        "T005": (True, "composant `OrientationHint`"),
        "T006": (True, None),
        "T007": (True, "`usePortraitLock` supprimé (spec 028, Q4)"),
        "T008": (True, None),
        "T009": (False, f"AC-O1 à AC-O4 écrits, AC-O8 couvert en unitaire ; {E2E_PENDING}"),
        "T010": (False, FIELD),
        "T011": (True, "notes v2.0.0 corrigées ; guide tablette inexistant"),
        "T012": (False, CLOSE),
    },
    "Orientation livrée sur `feat/v2.0.0` (issue #247) ; commit de vérification à renseigner. Restent ouverts : exécution des E2E dans la CI de la PR (T009), tests terrain Android et iPad (T010), validation par le product owner et clôture de l'issue (T012).",
)

# ---------------------------------------------------------------- 063
apply(
    "063", "#227",
    {
        "Q1": "hex/rgb(a) pré-calculés ; aucun `color-mix()` ni `oklch()` dans les tokens",
        "Q2": "Oui : quasi-noirs ramenés à l'échelle `--bd-ink-*` ; `fg-faint` relevé (`--bd-ink-450`) pour atteindre 4,5:1",
        "Q3": "`--bd-`",
        "Q4": "Fin de V2-DS-03 (065) : verrouillage `--color-*: initial` en clôture du chantier",
        "Q5": "Socle avant ; écrans migrés dans les mêmes lots que l'arène (072)",
    },
    """
- Issue #227 ; branche `feat/v2.0.0` (socle au commit `21969b2`) ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q5 selon la recommandation.
- Fichiers principaux :
  - `src/styles/tokens/primitives.css` (primitives hexadécimales `--bd-ink-*`, `--bd-chalk-*`, `--bd-orange-*`…), `src/styles/tokens/themes.css` (rôles par thème sur `[data-theme='dark']` — aussi `:root` — et `[data-theme='light']`, `color-scheme`), `src/styles/tokens/bridge.css` (`@theme inline` : chaque rôle devient un utilitaire Tailwind) ; `@custom-variant dark` / `light` déclarées dans `src/styles/tailwind.css`, sans usage dans les composants (AC-04 : 0 `dark:`).
  - Fond de page déclaré une seule fois (`body`, `var(--bd-canvas)` / `var(--bd-fg)`) ; style inline du `body` retiré de `index.html`, qui porte `data-theme="dark"` et le script anti-flash de la spec 069.
  - Cliquet : `scripts/design-tokens/check.mjs` (appelé par `scripts/guard-clean-codebase.sh`, donc par `npm run guard:clean`) compare le nombre de classes de palette brute à `scripts/design-tokens/baseline.json` ; détection et table de correspondance dans `scripts/design-tokens/palette.mjs`.
  - Tokens de mise en page existants (`--app-safe-*`, `--tablet-safe-*`, `--x01-*`, `--app-viewport-height`) non renommés (FR-08).
  - Guide des rôles : [docs/design-system.md](../../docs/design-system.md) ; [ADR 0006](../../docs/adr/0006-design-tokens-systeme-de-themes-unique.md) acceptée.
- Tests unitaires : `tests/unit/designSystem/themeContrast.test.ts` (rôles déclarés dans les deux thèmes et exposés au pont, rôles minimaux et espace `game-*`, primitives hexadécimales sans fonction moderne, fond déclaré une fois, `theme-color` aligné), `tests/unit/designSystem/paletteGuard.test.ts` (détection, table de correspondance, cliquet sur un dépôt factice).
- Écarts et restes :
  - Dépendances V2-DS-00 (spec 018, baseline navigateurs) et V2-QA-05 (spec 041, captures de référence) **non livrées** : écart assumé à la demande du PO. Le format hex/rgb est compatible avec toute baseline ; les captures de référence restent à produire par la spec 041 (AC-02 non vérifié).
  - Pas de fichier de tokens de composants (`components.css`, FR-01) : les composants consomment directement les rôles, les variantes de boutons sont centralisées dans `components/ui/buttonStyles.ts`. Le pont s'appelle `bridge.css` (et non `tailwind-bridge.css`).
  - Verrouillage `--color-*: initial` (Q4) et référence du cliquet à 0 : appliqués en clôture du chantier (voir spec 065).
  - Règle « pas de couleur brute » : documentée dans `docs/design-system.md` et `AGENTS.md`, pas encore dans `CONTRIBUTING.md`.
""",
    "socle livré (primitives, rôles Dark et Light, pont `@theme inline`, cliquet) ; écarts : pas de fichier de tokens de composants, pont nommé `bridge.css`, captures V2-QA-05 non produites. Détail : section « Implémentation (2026-11-20) » de la spec.",
    {
        "T000": (False, f"{PO} ; V2-DS-00 (018) et V2-QA-05 (041) non levées, écart assumé"),
        "T001": (True, None),
        "T002": (True, None),
        "T003": (True, "rôles Dark et Light"),
        "T004": (False, "non créé : composants sur les rôles, variantes dans `components/ui/buttonStyles.ts`"),
        "T005": (True, "`src/styles/tokens/bridge.css` ; `@custom-variant` dans `tailwind.css`"),
        "T006": (True, None),
        "T007": (True, None),
        "T008": (True, "`scripts/design-tokens/check.mjs`"),
        "T009": (True, None),
        "T010": (True, None),
        "T011": (False, "captures à produire par V2-QA-05 (spec 041)"),
        "T012": (True, "0 occurrence"),
        "T013": (False, "ADR 0006 acceptée et `docs/design-system.md` publié ; règle à ajouter dans `CONTRIBUTING.md`"),
        "T014": (False, CLOSE),
    },
    "Socle livré sur `feat/v2.0.0` (issue #227) ; commit de vérification à renseigner. Restent ouverts : levée des préalables 018/041 (T000) et captures (T011), fichier de tokens de composants non retenu (T004), règle dans `CONTRIBUTING.md` (T013), validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 064
apply(
    "064", "#231",
    {
        "Q1": "Oui (livré dans la 2.0.0, avec le reste de la spec)",
        "Q2": "48 px tablette / 44 px téléphone (classe `bd-touch-target`)",
        "Q3": "Ici (composant de base) ; `BrandMark` non encore créé",
    },
    """
- Issue #231 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q3 selon la recommandation ; `BrandMark` (Q3, FR-07) n'est pas encore livré.
- Fichiers principaux :
  - `components/ui/Button.tsx` et `components/ui/buttonStyles.ts` : `variant` ∈ `primary`, `secondary`, `danger`, `ghost`, `keypad`, `success` ; `tone` (pour `keypad`) ∈ `neutral`, `double`, `triple`, `bull`, `dbull`, `danger`, `success` ; `data-variant` / `data-tone` exposés ; désactivé = une seule règle (opacité et curseur) ; aucun `!important`.
  - `IconButton` : libellé accessible obligatoire (`label` → `aria-label` et `title`), cible carrée au plancher (48 × 48 px en tablette), utilisé par les en-têtes de jeu et la fermeture des notes de version.
  - Focus visible global dans `src/styles/tailwind.css` : anneau `:focus-visible` de 2 px (`focus-ring`, ≥ 3:1 sur `canvas` et `surface`) ; 0 `focus:outline-none` ; `releaseButtonFocus` supprimé.
  - Plancher tactile : classe `bd-touch-target` (`src/styles/layout/game-screen.css`) — 44 px en téléphone tactile, 48 px en tablette tactile ; seul le bureau retire la hauteur minimale des touches du pavé X01.
  - Pavés X01, Cricket et Capital et `VoiceScoringControl` construits sur ces variantes, sans utilitaire `!`.
  - Écrans hors jeu : accueil, sélection, setup (options avec `aria-pressed`), `ChangelogModal` (désormais un `<dialog>` étiqueté, fermé par l'`IconButton` « Fermer les notes de version »), `InstallAppButton`, dialogues du lien externe et `SessionNotice` utilisent les rôles et le plancher tactile.
- Tests unitaires : `tests/unit/components/keypads.test.tsx` et `capitalKeypad.test.tsx` (tons et états lus par `data-tone`, `data-multiplier`, `data-state`), `tests/unit/x01/VoiceScoringControl.test.tsx`, `changelogModal.test.tsx`, `homeAndSelection.test.tsx`, `gameSetupSections.test.tsx` ; contraste de l'anneau dans `tests/unit/designSystem/themeContrast.test.ts`.
- Tests E2E écrits, **non exécutés localement** : mesures des cibles ≥ 48 px (profils tablette) et ≥ 44 px (profils téléphone) dans `tests/e2e/tablet-layout.smoke.spec.ts` et `smartphone-layout.smoke.spec.ts` (AC-04, AC-05).
- Écarts et restes :
  - `BrandMark` (FR-07) et `Surface` non créés : les duplications du mot-symbole restent.
  - AC-01 (navigation clavier X01 + axe-core) et AC-06 (captures Dark) : dépendent de V2-QA-05 (spec 041), non réalisés.
""",
    "étapes réalisées sauf `BrandMark` et `Surface` (non créés) ; le plancher tactile est porté par la classe `bd-touch-target` des composants de base. Restent les E2E en CI, l'E2E clavier + axe-core et les captures (spec 041).",
    {
        "T000": (True, f"{PO} ; 063 livrée dans le même chantier"),
        "T001": (True, "focus visible global, 0 `focus:outline-none`"),
        "T002": (True, None),
        "T003": (True, None),
        "T004": (False, "`IconButton` créé ; `Surface` et `BrandMark` non créés"),
        "T005": (True, None),
        "T006": (True, "classe `bd-touch-target`"),
        "T007": (False, "`BrandMark` non livré"),
        "T008": (True, None),
        "T009": (True, None),
        "T010": (False, "dépend de V2-QA-05 (spec 041)"),
        "T011": (False, E2E_PENDING),
        "T012": (False, "captures à produire par V2-QA-05 (spec 041)"),
        "T013": (True, "`docs/design-system.md` §4, notes v2.0.0"),
        "T014": (False, CLOSE),
    },
    "Composants de base livrés sur `feat/v2.0.0` (issue #231) ; commit de vérification à renseigner. Restent ouverts : `Surface` et `BrandMark` (T004, T007), E2E clavier + axe-core et captures (T010, T012, spec 041), exécution des E2E de mesure dans la CI de la PR (T011), validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 065
apply(
    "065", "#250",
    {
        "Q1": "Socle avant (063) ; écrans migrés dans les mêmes lots que l'arène (072)",
        "Q2": "Regex outillée sans dépendance : `scripts/design-tokens/migrate.mjs` (1 540 → 203 classes automatiquement), puis migration manuelle → 0",
        "Q3": "Ordre du §9",
        "Q4": "Pas de drapeau en production ; Light activé à 100 % de migration (068)",
    },
    """
- Issue #250 ; branche `feat/v2.0.0` (codemod au commit `21969b2`) ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation.
- Migration :
  - Codemod `scripts/design-tokens/migrate.mjs` (table de correspondance des cas non ambigus dans `scripts/design-tokens/palette.mjs`, cas ambigus signalés) : 1 540 classes de palette brute détectées par le scanner du cliquet → 203 automatiquement (la spec comptait 1 465 au commit 508dfa6 avec la regex du rapport 05, plus étroite).
  - Migration manuelle des cas restants, écran par écran dans l'ordre du §9 : au moment de cette rédaction, `node scripts/design-tokens/check.mjs` compte **0** classe de palette brute (référence enregistrée : 203).
  - `src/features/x01/scoring/matchFeedback.ts` renvoie un ton (`getFeedbackPresentation`), traduit en rôles par `components/match/MatchFeedbackOverlay.tsx` (FR-05).
  - Les tests vérifient des attributs sémantiques (`data-tone`, `data-multiplier`, `data-state`) et non des noms de classes de couleur (FR-04, AC-03).
  - Registre de migration (FR-06) : tableau du §6 de `plan.md`.
- Tests unitaires : `tests/unit/designSystem/paletteGuard.test.ts` (détection, table de correspondance, cliquet) ; assertions sémantiques dans `keypads.test.tsx`, `cricketScoreboard.test.tsx`, `VoiceScoringControl.test.tsx`, `matchScoring.test.ts`.
- Écarts et restes :
  - Une seule branche de chantier plutôt qu'une PR par écran ; la référence du cliquet n'a pas été abaissée lot par lot (FR-03).
  - Clôture (FR-07, AC-04) : référence `baseline.json` à ramener à 0 et verrouillage `@theme { --color-*: initial; }` à appliquer en fin de chantier.
  - AC-02 : captures Dark de référence à produire par V2-QA-05 (spec 041).
""",
    "migration réalisée en une branche : codemod (étape 2) puis migration manuelle de tous les écrans dans l'ordre du §9 (étapes 3 à 7). L'étape 8 (verrouillage `--color-*: initial`, référence du cliquet à 0) est appliquée en clôture du chantier. Registre ci-dessous (§6).",
    {
        "T000": (False, f"{PO} ; V2-QA-05 (041) non livrée, écart assumé"),
        "T001": (True, "mêmes lots que l'arène (Q1)"),
        "T002": (True, "`scripts/design-tokens/palette.mjs`"),
        "T003": (True, "`scripts/design-tokens/migrate.mjs` (nom différent)"),
        "T004": (True, None),
        "T005": (True, None),
        "T006": (True, None),
        "T007": (True, None),
        "T008": (True, None),
        "T009": (True, None),
        "T010": (True, None),
        "T011": (True, None),
        "T012": (False, "compteur à 0 ; référence et verrouillage `--color-*: initial` à appliquer en clôture"),
        "T013": (True, None),
        "T014": (False, "captures à produire par V2-QA-05 (spec 041)"),
        "T015": (True, "test du cliquet sur dépôt factice (`paletteGuard.test.ts`) ; `guard:clean` en CI"),
        "T016": (True, "registre complet dans `plan.md` §6 ; Light activé (068)"),
        "T017": (False, CLOSE),
    },
    "Migration livrée sur `feat/v2.0.0` (issue #250) ; commit de vérification à renseigner. Restent ouverts : verrouillage `--color-*: initial` et référence du cliquet à 0 (T012), captures Dark (T014, spec 041), validation par le product owner et clôture de l'issue (T017).",
)

# Registre de migration (FR-06) dans plan.md §6.
plan_path = f"{folder('065')}/plan.md"
plan = read(plan_path)
old_registry = plan[plan.index("| Écran | Migré Dark | Prêt Light | Capture |"):plan.index("| Changelog | ☐ | ☐ | ☐ |") + len("| Changelog | ☐ | ☐ | ☐ |")]
new_registry = """Registre au 2026-11-20 : « prêt Light » = toutes les couleurs passent par des rôles déclarés dans les deux thèmes (matrice de contraste au vert) ; la revue visuelle se fait sur les captures de la PR (spec 068, Q3).

| Écran | Migré Dark | Prêt Light | Capture de référence |
|---|---|---|---|
| Accueil / sélection / setup | ☑ | ☑ | à produire par 041 |
| X01 | ☑ | ☑ | à produire par 041 |
| Cricket | ☑ | ☑ | à produire par 041 |
| Capital | ☑ | ☑ | à produire par 041 |
| Killer / Gotcha | ☑ | ☑ | à produire par 041 |
| Triathlon | ☑ | ☑ | à produire par 041 |
| Statistiques et modales | ☑ | ☑ | à produire par 041 |
| Changelog | ☑ | ☑ | à produire par 041 |"""
write(plan_path, plan.replace(old_registry, new_registry, 1))

# ---------------------------------------------------------------- 066
apply(
    "066", "#228",
    {
        "Q1": "Capital aligné sur la convention commune (y compris le mode plateau)",
        "Q2": "Oui sous garde-fou (V2-BRAND-01, spec 093) ; non implémenté ici : `game-active` reste un rôle réservé",
        "Q3": "4,5:1 visé et atteint (matrice de contraste, Dark et Light)",
    },
    """
- Issue #228 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q3 selon la recommandation ; Q2 attend V2-BRAND-01 pour sa mise en œuvre.
- Fichiers principaux :
  - Rôles `game-*` dans `src/styles/tokens/themes.css` (Dark et Light) et `bridge.css` : simple, double (cyan), triple (orange), Bull (vert — émeraude 700 en Dark), double bull (rouge), `on-game`, bust, fermé, fermé par tous, éliminé, victoire, joueur actif, scores actif et inactif, identités des six jeux. Convention publiée dans [docs/design-system.md](../../docs/design-system.md) §3 (AC-05).
  - `components/ui/buttonStyles.ts` (`KEYPAD_TONES`) ; pavés X01, Cricket et Capital (tous modes, y compris le plateau) sur la convention commune, avec `data-tone` et `data-multiplier` sur chaque touche ; style inline `#d90416` supprimé (AC-02).
  - Libellés au clavier : « BULL (25) » et « D-BULL (50) » au Cricket, alignés au Capital qui affichait « BULLE (25) » / « D-BULLE (50) » (`components/game/multiplierStyles.ts`, demande du PO).
  - `src/features/x01/scoring/matchFeedback.ts` : fonction pure renvoyant `tone` ∈ `bust`, `miss`, `notice`, `info`, sans classe Tailwind (FR-06).
  - Indices non colorés : joueur actif X01 et Cricket (fond, bordure ou barre, ▶), Cricket fermé (X cerclé, `data-state="closed"`) et fermé par tous (barré, `data-state="dead"`), libellés « TROP ! », « S » / « D » / « T ».
- Tests unitaires : `tests/unit/components/capitalKeypad.test.tsx` (convention sur tous les modes Capital ; T20 avec le même ton et les mêmes classes métier en Cricket et en Capital, AC-01), `keypads.test.tsx` (convention partagée), `tests/unit/x01/matchScoring.test.ts` (ton du feedback, AC-02), `tests/unit/designSystem/themeContrast.test.ts` (paires `game-*`, dont `game-score-inactive` ≥ 4,5:1 sur `canvas` et `surface`, AC-03 par calcul).
- Écarts et restes :
  - AC-03 : contraste vérifié par calcul sur les tokens ; E2E axe-core non écrit (V2-QA-05).
  - AC-04 : revue des captures en niveaux de gris non réalisée.
  - Q2 : couleur de club pour le joueur actif à traiter par V2-BRAND-01.
""",
    "étapes réalisées (rôles `game-*` Dark et Light, ton du feedback, suppression du style inline, alignement du Capital, attributs de test, contraste du score inactif). Restent l'E2E axe-core et la revue des captures en niveaux de gris.",
    {
        "T000": (True, f"{PO} ; 063 livrée dans le même chantier"),
        "T001": (True, None),
        "T002": (True, "Dark et Light"),
        "T003": (True, None),
        "T004": (True, None),
        "T005": (True, None),
        "T006": (True, None),
        "T007": (True, "`game-score-inactive` ≥ 4,5:1"),
        "T008": (True, "indices de forme en place ; revue en niveaux de gris : voir T012"),
        "T009": (True, None),
        "T010": (True, None),
        "T011": (False, "dépend de V2-QA-05 (spec 041)"),
        "T012": (False, "revue des captures à faire"),
        "T013": (True, "`docs/design-system.md` §3, notes v2.0.0"),
        "T014": (False, CLOSE),
    },
    "Couleurs métier livrées sur `feat/v2.0.0` (issue #228) ; commit de vérification à renseigner. Restent ouverts : E2E axe-core (T011), revue en niveaux de gris (T012), validation par le product owner et clôture de l'issue (T014).",
)

# ---------------------------------------------------------------- 068
apply(
    "068", "#242",
    {
        "Q1": "Activé à 100 % des écrans (`LIGHT_THEME_ENABLED = true`) ; pas de Light partiel",
        "Q2": "Libellés « Sombre » / « Clair » (et « Auto » pour le mode système)",
        "Q3": "Validation visuelle sur les captures de la PR ; maquette préalable non produite (écart)",
        "Q4": "Plus tard",
    },
    """
- Issue #242 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation, avec un écart sur Q3 : pas de maquette avant implémentation, la validation visuelle se fait sur les captures de la PR.
- Fichiers principaux :
  - `src/styles/tokens/themes.css` : valeurs `[data-theme='light']` de tous les rôles et de tous les `game-*` (fond `#f5f3ef`, neutres chauds `--bd-chalk-*`, texte de marque assombri, ombres douces) ; en clair, les lueurs (`shadow-glow-*`) deviennent des anneaux de 2 px (FR-03, AC-05 : 0 `shadow-[0_0_…]` dans le code).
  - `src/features/theming/themePreference.ts` : `LIGHT_THEME_ENABLED = true` (registre de la spec 065 à 100 %), libellés `Auto` / `Sombre` / `Clair`.
  - `theme-color` (`#f5f3ef` en clair) et barre d'état iOS (`default` en clair) : voir spec 069 (FR-05).
- Tests unitaires : `tests/unit/designSystem/themeContrast.test.ts` (matrice de contraste des paires déclarées en Dark et en Light : 4,5:1 texte, 7:1 score actif, 3:1 indicateurs, AC-01).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/theme.smoke.spec.ts` (parcours de base en clair jusqu'au pavé X01, fond `canvas` clair).
- Écarts et restes :
  - AC-02 (axe-core en `colorScheme: 'light'`) : non écrit (V2-QA-05).
  - AC-03 / AC-06 : captures Light de référence à valider par le PO, captures Dark de référence à produire (spec 041).
  - Test terrain en salle éclairée à faire ; `prefers-contrast: more` reporté (Q4).
""",
    "étape « prototype de palette » remplacée par une revue des captures de la PR (Q3) ; valeurs Light, matrice de contraste, remplacement des lueurs et activation réalisés. Restent axe-core, les captures de référence et le test terrain.",
    {
        "T000": (True, f"{PO} ; 065 et 069 livrées dans le même chantier"),
        "T001": (True, None),
        "T002": (False, "maquette non produite ; validation sur les captures de la PR (Q3)"),
        "T003": (True, None),
        "T004": (True, "calcul de contraste dans `themeContrast.test.ts`"),
        "T005": (True, "lueurs → anneaux en clair"),
        "T006": (True, "spec 069"),
        "T007": (True, "`LIGHT_THEME_ENABLED = true`"),
        "T008": (True, None),
        "T009": (False, "dépend de V2-QA-05 (spec 041)"),
        "T010": (False, "captures à produire par V2-QA-05 et à valider par le PO"),
        "T011": (False, FIELD),
        "T012": (True, "README, notes v2.0.0, `docs/design-system.md` ; pas de guide utilisateur dédié"),
        "T013": (False, CLOSE),
    },
    "Mode Light livré et activé sur `feat/v2.0.0` (issue #242) ; commit de vérification à renseigner. Restent ouverts : validation visuelle par le PO sur captures (T002, T010), axe-core (T009), test terrain (T011), validation par le product owner et clôture de l'issue (T013).",
)

# ---------------------------------------------------------------- 069
apply(
    "069", "#237",
    {
        "Q1": "Accueil + options de partie X01",
        "Q2": "Dynamique : `default` en clair, `black-translucent` en sombre ; à vérifier sur appareil",
        "Q3": "Livré avec le Light (068), dans le même chantier",
        "Q4": "Aligné sur le canvas sombre `#06080d` (`theme_color` et `background_color`)",
    },
    """
- Issue #237 ; branche `feat/v2.0.0` ; commit de vérification à renseigner.
- Décisions appliquées : Q1 à Q4 selon la recommandation ; Q3 sans objet, le Light étant livré en même temps.
- Fichiers principaux :
  - `src/features/theming/themePreference.ts` : module pur (modes `system` | `dark` | `light`, clé `bougnat-theme-v1` au format `{"v":1,"mode":…}`, valeur absente, corrompue ou d'un autre schéma → `system`, résolution du thème effectif, couleurs `theme-color`, style de barre d'état).
  - `src/infrastructure/local/themePreferenceStore.ts` (lecture/écriture protégées, stockage indisponible non bloquant) ; `src/infrastructure/web/themeDocument.ts` (`data-theme`, `theme-color`, barre d'état iOS, écoute de `prefers-color-scheme`) ; `color-scheme` porté par `themes.css` selon `data-theme`.
  - `src/app/themeController.ts` (unique point d'écriture, démarré par `index.tsx`) et `src/app/useThemeMode.ts`.
  - `index.html` : script inline synchrone ES5 qui applique `data-theme`, `theme-color` et la barre d'état avant le premier rendu ; il reproduit la clé, le schéma et les couleurs du module TypeScript (test de cohérence).
  - `components/ui/ThemeSelector.tsx` (« Apparence : Auto / Sombre / Clair », effet immédiat) dans le pied de page de l'accueil et dans les options de partie X01 (`MatchSettingsModal`), masqué si le Light est désactivé.
  - `public/manifest.json` : `theme_color` et `background_color` = `#06080d`.
- Tests unitaires : `tests/unit/designSystem/themePreference.test.tsx` (table de vérité, valeurs corrompues, script anti-flash minimal et aligné, repli sans `matchMedia`, stockage, document, contrôleur en mode Auto, sélecteur), `homeAndSelection.test.tsx` et `matchSettingsModal.test.tsx` (présence du sélecteur).
- Tests E2E écrits, **non exécutés localement** : `tests/e2e/theme.smoke.spec.ts` (système clair au premier rendu, AC-01/AC-04 ; choix Sombre prioritaire, AC-02 ; changement système sans rechargement, AC-03 ; sélecteur de l'accueil mémorisé ; valeur corrompue sans erreur, AC-06 ; parcours en clair).
- Écarts et restes :
  - AC-05 (sélecteur absent quand le Light est désactivé) : couvert par le code et la cohérence du script, pas par un E2E (le Light étant activé).
  - L'absence de frame claire (AC-02) est vérifiée par l'attribut au chargement, pas par une trace de performance.
  - Vérification terrain iOS/Android (barre d'état, barre d'adresse) à faire.
""",
    "étapes réalisées (module pur, stockage, application au document, script anti-flash, sélecteur à l'accueil et dans les options X01), le Light étant livré en même temps. Restent l'exécution des E2E en CI et la vérification terrain.",
    {
        "T000": (True, f"{PO} ; 063 livrée dans le même chantier"),
        "T001": (True, None),
        "T002": (True, None),
        "T003": (True, None),
        "T004": (True, "`color-scheme` porté par `themes.css`"),
        "T005": (True, None),
        "T006": (True, None),
        "T007": (True, None),
        "T008": (False, E2E_PENDING),
        "T009": (False, "sans objet tant que le Light est activé ; couvert par le code"),
        "T010": (False, FIELD),
        "T011": (True, "notes v2.0.0, `docs/design-system.md` §6, `docs/technical.md`"),
        "T012": (False, CLOSE),
    },
    "Préférence de thème livrée sur `feat/v2.0.0` (issue #237) ; commit de vérification à renseigner. Restent ouverts : exécution des E2E dans la CI de la PR (T008), vérification terrain (T010), validation par le product owner et clôture de l'issue (T012).",
)

print("specs 063-073 mises à jour")
