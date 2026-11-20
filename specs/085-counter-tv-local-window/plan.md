# Plan — 085 TV locale (fenêtre secondaire, HDMI, hors ligne)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `index.tsx:1-4` : import statique de `tailwind.css` et de `App` → une détection tardive chargerait tout le contrôleur.
- `index.html:32` : point d'entrée unique ; `vite.config.ts:29-33` : build legacy (`ios >= 12`).
- `App.tsx:106-110,355-360` : restauration de session et `matchRuntime`.
- `components/match/MatchTopBar.tsx` : barre de partie (actions à droite).
- `utils/uiUtils.ts:17-30` : `enterFullScreen`.
- `sw.js:42-54` : repli de navigation sur `/index.html`.

## 2. Approche retenue (et alternatives écartées)

Entrée Vite séparée `tv.html` + `src/tv/main.tsx` avec sa propre feuille (CSS conservatrice de 086), servie sous `/tv` ; adaptateurs `BroadcastChannel` sur le port de 084. Alternative : détection de `/tv` dans `index.tsx` avec import dynamique de `App` (modifie le démarrage du contrôleur, garde `tailwind.css` global) — écartée sauf si Pages ne sert pas `/tv` → `tv.html` [à confirmer en préproduction ; repli : `public/_redirects` en réécriture 200].

## 3. Étapes

1. Ajouter l'entrée `tv.html` dans `vite.config.ts` (`build.rollupOptions.input`) et `src/tv/main.tsx` (aucun import de `App`, voix, clavier).
2. Créer `src/infrastructure/broadcast/LocalChannelPublisher.ts` et `LocalChannelSubscriber.ts` (génération, `hello`, `presence`, `end`).
3. Brancher le publisher dans `src/app/useSpectatorBroadcast.ts` (084) quand la diffusion locale est active.
4. Ajouter l'icône « Diffuser » et l'indicateur dans `MatchTopBar.tsx` (props optionnelles), feuille de choix « Sur cet appareil (2e écran) ».
5. Ouvrir la fenêtre par `window.open('/tv?local=1', 'bougnat-tv')` dans le gestionnaire du clic ; amélioration progressive `getScreenDetails` + plein écran ciblé.
6. Écran TV : états attente / partie / contrôleur absent / terminé ; bouton « Plein écran » ; masquage du curseur.
7. Variable `VITE_ENABLE_TV_LOCAL` dans le contrat d'environnement (spec 009) et `wrangler.jsonc`.
8. Vérifier le précache SW (spec 031) : ajouter `tv.html` et ses assets si le SW est actif.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `tv.html`, `src/tv/main.tsx`, `src/tv/TvApp.tsx` | Création |
| `vite.config.ts` | Entrée supplémentaire |
| `src/infrastructure/broadcast/LocalChannel*.ts` | Création |
| `src/app/useSpectatorBroadcast.ts` | Sélection de l'adaptateur |
| `components/match/MatchTopBar.tsx`, `views/MatchView.tsx` | Icône, indicateur, feuille de choix |
| `src/lib/env.ts`, `scripts/validate-*.mjs`, `wrangler.jsonc` | Drapeau `VITE_ENABLE_TV_LOCAL` |
| `sw.js` | Précache de l'entrée TV (si 031 livrée) |
| `tests/unit/broadcast/localChannel.test.ts`, `tests/e2e/tv-local.spec.ts` | Création |

## 5. Impacts UI / domaine / application / infrastructure

UI : une icône et une feuille de choix dans la partie X01 ; nouvelle surface TV. Domaine : aucun. Application : aucun (port existant). Infrastructure : deux adaptateurs.

## 6. Stratégie de migration

Aucune donnée persistée ; aucun schéma modifié.

## 7. Stratégie de test

Unitaires des adaptateurs avec canal simulé ; E2E Playwright avec deux pages du même contexte (Chromium + WebKit), hors ligne, rechargement, deux contrôleurs ; vérification des modules chargés par `/tv`. Terrain : spec 090.

## 8. Non-régression

E2E X01 complets ; mesure INP avant/après (spec 020) ; taille du chunk contrôleur inchangée à ± 2 Ko.

## 9. Rollback / désactivation

`VITE_ENABLE_TV_LOCAL=false` masque la commande ; l'entrée `tv.html` reste inoffensive. Rollback complet = retrait de l'entrée Vite et de l'icône.

## 10. Documentation à mettre à jour avec l'implémentation

Guide « Diffuser sur un grand écran » (V2-DOC-05, 037), `README.md` (fonctionnalités, seulement après livraison), `docs/architecture.md`, contrat d'environnement.
