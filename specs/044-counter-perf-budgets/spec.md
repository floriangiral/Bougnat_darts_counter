---
id: 044-counter-perf-budgets
v2_id: V2-PERF-01
titre: Budgets de performance mesurés (INP, bundle)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: qualite
priorite: P2
difficulte: S
recommandation: recommande
lot: 5
poids: 20
depend_de: []
remplace: []
remplacee_par: []
issue: '#278'
verifie_au_commit: 7b454d3
derniere_revue: 2026-11-26
---

# 044 — Budgets de performance mesurés (INP, bundle)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La [spec 020](../020-counter-inp-phase1-quick-wins/spec.md) a livré trois correctifs et a été **clôturée le 2026-11-23** ; sa validation terrain « INP P75 mobile < 200 ms » n'a pas été mesurée et son reliquat est transféré à 044. La valeur de départ de 296 ms est une donnée historique rapportée par 020, pas une nouvelle mesure.

La voix et les thèmes existent déjà ; le thème de base est appliqué dès l'ouverture (`index.html`, `index.tsx`) et le QR d'accueil est une image générée au build (`scripts/generate-app-qr.mjs`). TV, générateur QR côté client et éditeur de thème sont des pistes proposées, pas des fonctionnalités supposées livrées. Le chargement à la demande doit distinguer transfert, évaluation du JavaScript, affichage et précache PWA.

## 2. Problématique

Aucune mesure INP terrain récente n'est documentée ici ; les données du projet et la disponibilité d'un P75 global par classe d'appareil dans Cloudflare restent à vérifier. Aucun budget de bundle n'est contrôlé par la CI actuelle. Malgré `React.lazy`, le découpage actuel fait entrer les écrans et la voix dans le JavaScript initial.

## 3. Objectifs

- O1 : mesurer l'INP réel (terrain) et un indicateur de laboratoire reproductible, et traiter sur preuve le reliquat transféré par 020.
- O2 : fixer des budgets de taille par chunk, contrôlés à chaque build en CI.
- O3 : définir puis vérifier le chargement différé des modules optionnels, sans confondre rendu et transfert par le précache hors ligne.

## 4. État actuel vérifié dans le code

- [vérifié] `HomeView` est importée **statiquement** et les autres vues sont déclarées en `lazy` (`App.tsx:2-3,104-117`). `manualChunks` regroupe les fichiers `/views/` (`vite.config.ts`). Dans l'artefact ci-dessous, `index` importe statiquement `views` et `index.html` le précharge : les composants restent rendus conditionnellement, mais une page moderne sans cache doit acquérir ce JavaScript dès l'amorçage. Aucun trafic navigateur n'a été observé.
- [vérifié] `MatchView` importe statiquement le hook et le contrôle vocal (`views/MatchView.tsx:27-33`) ; le hook importe le gestionnaire qui importe `@deepgram/sdk` (`src/features/x01/voice/useDeepgramStreaming.ts`, `deepgramConnectionManager.ts`). Avec la voix à `false` dans le build CI, le chunk initial `views` contient notamment `/api/deepgram/token`, `getUserMedia` et `api.deepgram.com`. Cela ne signifie pas que le micro ou Deepgram sont appelés : le hook garde le préchargement du jeton et le démarrage derrière `enabled` et l'acceptation de la notice (`useDeepgramStreaming.ts:97-103,350-390`).
- [vérifié] `modernPolyfills: true`, cible `ios >= 12` et génération legacy (`vite.config.ts`) ; l'artefact moderne référence bien un script `polyfills`. La compatibilité iOS 12 relève de la [spec 018](../018-counter-ios12-compatibility/spec.md), actuellement `a-revoir`.
- [vérifié] `qrcode` est une dépendance de production, mais son seul import source est dans `scripts/generate-app-qr.mjs` (`package.json`, recherche `qrcode` dans `*.{ts,tsx,js,mjs}`). Le QR de `HomeView` est un SVG statique affiché à la demande, mais précaché par la PWA (`views/HomeView.tsx`, `scripts/lib/pwaBuild.mjs`).
- [vérifié] La [spec 031](../031-counter-pwa-static-delivery/spec.md) est implémentée, sa validation préprod/terrain restant en attente. `collectPrecacheUrls` inclut les assets modernes de `dist/assets/`, le shell, les icônes et le QR ; il exclut les assets `-legacy`, les sourcemaps et les métadonnées Vite (`scripts/lib/pwaBuild.mjs`). Après le chargement de la page, l'installation du service worker demande **toute** cette liste avec `cache.addAll` (`index.tsx`, `src/infrastructure/web/serviceWorkerUpdates.ts`, `public/sw.js`) : un chunk séparé peut donc être transféré avant son activation, même sans `modulepreload`.
- [vérifié] Le chrono change l'état chaque seconde (`src/features/x01/hooks/useMatchTimer.ts`), mais un tick seul ne publie plus l'instantané X01 : une ref porte le temps et l'effet dépend des changements métier (`views/MatchView.tsx:508-521`, `App.tsx:530`). La persistance reste débouncée à 300 ms (`src/app/appShell.ts`) ; l'ancien constat d'une écriture à chaque seconde est périmé.
- [vérifié] `index.tsx` injecte le beacon Cloudflare Web Analytics si le jeton `VITE_CF_WEB_ANALYTICS_TOKEN` est non vide, mais pas lors d'une tentative de lien partenaire ; la CSP l'autorise (`public/_headers`). La [documentation Cloudflare](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/) indique que le beacon collecte l'INP, présente un P75 par élément dans sa vue de débogage et permet notamment des filtres par URL, navigateur, OS et pays. Elle ne démontre ni l'existence de données pour ce projet, ni la disponibilité d'un P75 global par classe d'appareil. Les éventuelles données de ce beacon ne représentent pas tous les parcours : les tentatives de lien partenaire sont exclues par le code et un jeton vide désactive son injection.
- [vérifié] Il n'existe pas de script `perf:budget` dans `package.json` ni d'étape de budget dans `.github/workflows/quality-gate.yml`.

### Mesure du build de production CI, le 2026-11-26

L'artefact `production-build` provient de `npm run build` dans le [job CI 139993734641](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45844273200/job/139993734641), commit `2adc77b8814b9eae0d7fe597c52027074a1bc447`. `git rev-parse '7b454d3^{tree}' '2adc77b^{tree}'` donne le même arbre `3f1b440555d24069a8a254fccab15095689ca513`. Attention : la CI injecte son propre SHA comme `VITE_APP_VERSION` ; arbre identique ne signifie donc pas build bit à bit identique à un build du merge.

Contexte du build : runner GitHub `ubuntu-26.04` x64, Node 26.13.1, npm 12.2.3, Vite 8.3.8 ; `VITE_APP_ENV=ci`, URL `http://localhost:3000`, jeton Analytics factice et `VITE_ENABLE_VOICE_SCORING=false` (`.github/workflows/quality-gate.yml`, journal du job). Le calcul ci-dessous est fait **localement sur cet artefact CI**, en mémoire, sur Linux x86_64 / Intel Core i7-1365U, Python 3.14.7 et zlib 1.3.2, avec gzip niveau 6, `mtime=0`, chaque fichier compressé séparément. Ce n'est ni un appareil joueur, ni un build Pages configuré pour la production.

| Fichier moderne de l'artefact | Brut (octets) | Gzip (octets) |
|---|---:|---:|
| `index-DTDTmX2I.js` | 31 499 | 10 520 |
| `polyfills-UtUt6YGa.js` | 63 518 | 22 302 |
| `react-vendor-Beo6OYgs.js` | 211 038 | 65 179 |
| `icons-vendor-GHrP96lS.js` | 19 884 | 7 472 |
| `rolldown-runtime-COiEfhsA.js` | 1 116 | 629 |
| `views-C36LWbD1.js` | 566 495 | 136 621 |
| **JS initial moderne, fichiers uniques** | **893 550** | **242 723** |
| `index-Ce6LsIDt.css`, séparé du JS | 266 248 | 34 424 |

Le total JS comprend les deux scripts modules de `index.html` (`polyfills`, `index`), ses quatre `modulepreload` (`rolldown-runtime`, `icons-vendor`, `react-vendor`, `views`) et leurs imports statiques transitifs, dédupliqués. Dans cet artefact, aucune dépendance statique supplémentaire ni aucun autre chunk JS moderne ne s'ajoute à ces six fichiers ; les imports dynamiques de vues pointent sur `views`, déjà initial. Les scripts legacy ne font pas partie de ce total. HTML, images, éventuel beacon et précache sont exclus : ce nombre ne représente **pas** les octets réellement transférés lors d'une visite.

Le rapport Vite du même job affiche `views` à **566,49 kB bruts / 137,99 kB gzip** et avertit que ce chunk minifié dépasse 500 kB. Son gzip diffère du recalcul Python ci-dessus ; l'écart de méthode/implémentation n'a pas été élucidé et les deux séries ne doivent pas être mélangées. Le JS initial recalculé (~242,7 kB gzip) et le CSS (~34,4 kB) dépassent déjà les propositions respectives de 210 Ko et 25 Ko de NFR-01 : aucun nouveau seuil n'est fixé par ce constat.

Le `sw.js` de l'artefact liste 15 URL, soit **1 779 873 octets bruts** de ressources distinctes, dont tous les JS/CSS modernes, le shell, les icônes et le QR. Ce total n'est pas un volume réseau observé : caches, compression HTTP, requêtes déjà faites et installation effective peuvent le modifier. Les six chunks legacy et `/pcmCaptureWorklet.js` ne sont pas dans cette liste ; le worklet est demandé lors de la capture vocale compatible, s'il n'est pas déjà chargé (`audioContextManager.ts`). Le cache d'exécution peut ensuite conserver des ressources chargées sous le contrôle du service worker (`public/sw.js`), sans garantie de premier usage hors ligne pour ces ressources.

**Reproduction en lecture seule**, depuis la racine avec `gh` authentifié et les dépendances existantes (Node 26.13.0, `es-module-lexer` 2.3.2) ; l'archive CI est disponible jusqu'au 2026-12-03 à 15:00:16 UTC. SHA-256 de l'archive : `225d976e77e4d038ddec66aa310fa7e68738931b8c5f96e486b42522597f7d1f`. Elle est lue en mémoire, sans modifier `dist/` :

```bash
python3 - <<'PY'
import gzip, io, json, posixpath, re, subprocess, zipfile
from html.parser import HTMLParser

api = "repos/floriangiral/Bougnat_darts_counter/actions/artifacts/15130870731/zip"
z = zipfile.ZipFile(io.BytesIO(subprocess.check_output(["gh", "api", api])))
class HTML(HTMLParser):
    def __init__(self):
        super().__init__(); self.modules = []; self.preloads = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and a.get("type") == "module" and a.get("src"):
            self.modules.append(a["src"])
        if tag == "link" and a.get("rel") == "modulepreload":
            self.preloads.append(a["href"])
h = HTML(); h.feed(z.read("index.html").decode())
assets = sorted(n for n in z.namelist() if n.startswith("assets/")
                and "-legacy" not in n and n.endswith((".js", ".css")))
size = lambda n: (len(z.read(n)), len(gzip.compress(z.read(n), compresslevel=6, mtime=0)))
for n in assets:
    print(n, *size(n))
lexer = ('import {init,parse} from "es-module-lexer";await init;const b=[];'
         'for await(const x of process.stdin)b.push(x);'
         'console.log(JSON.stringify(parse(Buffer.concat(b).toString())[0]'
         '.filter(x=>x.d===-1&&x.n?.startsWith(".")).map(x=>x.n)))')
graph = {n: json.loads(subprocess.check_output(
    ["node", "--input-type=module", "-e", lexer], input=z.read(n)))
    for n in assets if n.endswith(".js")}
initial = {u.lstrip("/") for u in h.modules + h.preloads}
todo = list(initial)
while todo:
    parent = todo.pop()
    for ref in graph.get(parent, []):
        child = posixpath.normpath(posixpath.join(posixpath.dirname(parent), ref))
        if child not in initial:
            initial.add(child); todo.append(child)
print("modules", h.modules, "modulepreload", h.preloads)
print("JS initial", sorted(initial), tuple(sum(size(n)[i] for n in initial) for i in (0, 1)))
urls = json.loads(re.search(rb"const PRECACHE_URLS = (\[[^\n]*\]);", z.read("sw.js")).group(1))
print("précache", len(urls), sum(len(z.read("index.html" if u == "/" else u.lstrip("/"))) for u in urls), urls)
PY
```

Après expiration, le journal CI reste une preuve indépendante des tailles affichées par Vite ; une nouvelle exécution CI du même commit et des variables de `.github/workflows/quality-gate.yml` permet de produire un nouvel artefact, dont l'identifiant devra remplacer celui ci-dessus. Comparer les tailles seulement à méthode de compression et versions connues.

Effets du build **CI** : génération de `public/app-qr.svg`, production de `dist/`, injection puis validation de `dist/sw.js` (`package.json`). Aucun build, serveur, navigateur, E2E ou smoke n'a été lancé localement pour ce cadrage : le fichier d'environnement local est restreint par la politique de l'organisation et le build ordinaire y accède ; les versions locales Node 26.13.0/npm 11.20.0 diffèrent aussi des versions déclarées. Les commandes de cadrage n'ont généré ni QR ni `dist/` local. Aucune durée d'interaction, latence, ni valeur INP n'a été mesurée.

## 5. Comportement cible

1. **Terrain** : sous réserve de Q1, l'INP P75 mobile est relevé à chaque release et consigné dans la note de version.
2. **Laboratoire** : un test Playwright Chromium en CI (CPU ralenti ×4) joue une séquence de saisie X01 et Cricket et mesure la durée des interactions via l'API Event Timing ; un rapport est proposé en nightly (informatif). Le P75 de ces saisies n'est pas l'INP P75 de visites réelles (Q6).
3. **Bundle** : après chaque build CI, un script compare la taille gzip de chaque chunk et du chargement initial à `perf-budgets.json` et échoue en cas de dépassement.
4. **Chargement différé** : chaque écran de jeu, la voix, et les éventuels futurs modules TV/QR/éditeur de thème sont dans des chunks séparés non préchargés par la page au démarrage ; le transfert par la PWA reste à arbitrer (Q5).

## 6. Périmètre

### Inclus
- Mesure terrain de l'INP et indicateur de laboratoire ; traitement du reliquat de 020 déjà clôturée.
- Budgets par chunk et chargement initial ; script de contrôle CI.
- Correction du découpage des vues et import différé de la voix.
- Règle de chargement différé pour les modules V2 optionnels.

### Exclu
- Refonte de la persistance, dont l'absence de publication au seul tick est déjà traitée par 010 (V2-ARCH-06).
- Choix de la baseline navigateurs et des polyfills (018, V2-DS-00).
- Optimisations de rendu React au-delà des constats de mesure (nouvelles specs si nécessaire).

## 7. User stories

- En tant que joueur sur une tablette d'entrée de gamme, je veux que la touche réagisse immédiatement, afin de ne pas saisir deux fois.
- En tant que gérant de bar en 4G, je veux que l'application s'ouvre vite, afin de lancer la partie sans attendre.

## 8. Règles métier

- RM-01 Un dépassement de budget bloque la PR, sauf relèvement explicite du budget justifié dans la PR et accepté par le PO.
- RM-02 Un module optionnel (voix, TV, QR, thèmes) n'est jamais chargé avant que l'utilisateur ne l'active.

RM-02 reste une proposition : « chargé » doit être défini, car l'absence de tout transfert, précache compris, contredit le précache actuel conçu pour permettre les écrans modernes hors ligne après une première installation réussie (Q5). Le thème de base déjà nécessaire au démarrage n'est pas assimilable à un futur éditeur optionnel.

## 9. Parcours utilisateurs

Sans objet côté joueur (aucun changement visible). Parcours contributeur proposé : `npm run build` puis `npm run perf:budget` ; ce dernier script n'existe pas encore. Les tests navigateur sont réservés à la CI.

## 10. Exigences fonctionnelles

- FR-01 `perf-budgets.json` (budgets gzip par chunk nommé et pour le chargement initial), versionné.
- FR-02 Script proposé `scripts/check-bundle-budget.mjs` : lit `dist/index.html` et `dist/assets/`, calcule les tailles gzip (`node:zlib`), identifie le chargement initial (entrées, `modulepreload` et imports statiques transitifs, sans doublons), compare aux budgets et publie un tableau dans le résumé CI. Définir séparément le périmètre PWA, les styles et les paramètres de compression (Q5, Q7).
- FR-03 Étape CI après `build` dans le job `validate` (043).
- FR-04 Supprimer le regroupement `views` de `manualChunks` (un chunk par écran, sans préchargement initial) ; vérifier les dépendances partagées et le build produit, sans supposer que la suppression suffit.
- FR-05 Charger la voix à la demande (import dynamique du contrôle vocal et du hook) quand la voix est activée.
- FR-06 Test d'interactions en laboratoire (Chromium, CPU ×4, séquence de 20 saisies X01 et 20 Cricket) : rapport P75 et maximum des durées d'interaction ; informatif en nightly. Ce P75 ne vaut pas INP P75 terrain (Q6).
- FR-07 Relevé terrain INP P75 mobile/desktop à chaque release dans la note de version ; traiter le reliquat transféré par 020 [source et durée à confirmer].

## 11. Exigences non fonctionnelles

- NFR-01 Budgets historiques proposés (à valider, gzip) : chargement initial JS moderne ≤ 210 Ko au lot de mise en place, cible ≤ 150 Ko après FR-04/FR-05 ; chunk d'écran ≤ 40 Ko ; chunk voix ≤ 40 Ko ; CSS ≤ 25 Ko. L'ancienne base d'environ 202 Ko est périmée ; les seuils initiaux JS et CSS sont déjà dépassés par la mesure §4 et doivent être arbitrés (Q2, Q7).
- NFR-02 P75 des durées d'interaction en laboratoire ≤ 100 ms sous CPU ×4 [indicateur et seuil à arbitrer après première mesure ; ce n'est pas l'INP P75 terrain].
- NFR-03 Coût visé : 0 € ; Cloudflare Web Analytics est intégré, mais l'accès à la métrique souhaitée reste à confirmer ; aucune dépendance ajoutée sans justification.
- NFR-04 Confidentialité : aucune nouvelle collecte ni nouvelle bibliothèque d'envoi de métriques vers un serveur tiers.

## 12. Cas nominaux et alternatifs

- Nominal : PR sans impact → tableau de tailles dans le résumé, vert.
- Alternatif : ajout d'une bibliothèque lourde → échec avec chunk et dépassement indiqués.

## 13. Cas limites

- Bundle legacy (si conservé par 018) : budgets séparés.
- Navigateur sans Event Timing : laboratoire proposé sur Chromium seulement ; prise en charge des navigateurs cibles et source terrain à confirmer (Q1, Q6).

## 14. Gestion des erreurs

Script de budget : message par chunk (taille, budget, écart) ; absence de `dist/` → erreur explicite « lancer le build d'abord ».

## 15. Impacts architecturaux

Configuration de build (`vite.config.ts`) et imports dynamiques dans la couche UI ; aucune règle de jeu touchée.

## 16. Impacts sur les données et les interfaces

Aucun.

## 17. Compatibilité avec l'existant

La PWA 031 précache déjà les assets modernes émis, y compris les futurs chunks séparés tant que cette règle reste inchangée. Un découpage peut donc ajouter des requêtes à l'installation/mise à jour et au premier usage ; exclure des chunks du précache peut compromettre le premier usage hors ligne d'un écran encore jamais chargé. Les bundles legacy ne sont pas précachés. La conservation d'anciens assets hachés après déploiement n'est pas établie ; tester aussi une mise à jour et une partie active (Q5).

## 18. Dépendances

- Disponibilité de la métrique terrain et compromis hors ligne à trancher avant de figer les critères.
- Liées : 020 (reliquat transféré), 043 (étape CI ; implémentée), 031 (précache déjà implémenté), 018 (polyfills), 092 (QR à la demande, proposition), 010 (persistance sans tick).

## 19. Critères d'acceptation

- AC-01 `npm run perf:budget` après un build affiche la taille gzip de chaque chunk et du chargement initial ; dépassement → code de sortie non nul.
- AC-02 Après FR-04, `dist/index.html` ne précharge aucun chunk d'écran de jeu ; ouvrir l'accueil ne télécharge pas `MatchView` (onglet réseau ou trace Playwright). La portée de « télécharge », notamment l'installation du service worker, reste à trancher (Q5).
- AC-03 Avec `VITE_ENABLE_VOICE_SCORING=false`, aucun chunk contenant le code Deepgram n'est téléchargé pendant une partie X01 ; même ambiguïté sur le précache (Q5).
- AC-04 Le rapport de laboratoire est publié en nightly ; la première mesure est consignée dans la spec, avec la définition de l'indicateur retenu (Q6).
- AC-05 L'INP P75 mobile terrain est consigné pour la release suivante ; le reliquat transféré par 020 est traité sur preuve, sans supposer sa réouverture.

## 20. Scénarios de tests

Unitaires du script de budget (fixtures de `dist` factice et imports transitifs) ; en CI uniquement, E2E réseau distinguant page et service worker (AC-02, AC-03), premier passage en ligne puis hors ligne, mise à jour en partie, et laboratoire d'interactions (FR-06). Désactiver le service worker dans un test ne prouve pas l'absence de ses transferts.

## 21. Exigences de non-régression

Parcours E2E existants verts en CI ; garanties hors ligne de 031 préservées ou explicitement réarbitrées ; invariants de 020 (pointerdown, long-press 450 ms) préservés. Toute modification des workflows ou actions `.github/` exige une PR dédiée, une justification écrite et la revue du mainteneur, même après validation de cette spec.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Laboratoire non représentatif ou P75 des saisies confondu avec l'INP terrain | Élevé | Élevée | Définir l'indicateur et ses limites ; terrain distinct (Q1, Q6) |
| Précache complet contraire au zéro transfert avant activation | Élevé | Élevée | Arbitrer le compromis hors ligne / réseau, puis tester page et service worker en CI (Q5) |
| Une URL du précache indisponible fait échouer `cache.addAll` et l'installation du service worker | Élevé | Moyenne | Vérifier les assets du build et tester le déploiement et l'installation en CI (`public/sw.js`) |
| Chunk absent hors ligne ou ancienne version hachée indisponible après mise à jour | Élevé | Moyenne | Tester première visite, installation, partie active et changement de version ; rétention Cloudflare à confirmer |
| Données Cloudflare absentes, non segmentables ou non représentatives de tous les parcours | Moyen | À confirmer | Vérifier le tableau et ses limites ; les liens partenaires sont exclus et DevTools manuel ne fournit pas un P75 terrain de population (Q1) |
| Budgets trop serrés | Moyen | Élevée | Recalibrer à partir d'une mesure reproductible après décision du PO (Q2, Q7) |
| Legacy non précaché | Moyen | Moyenne | Préserver la limite documentée de 031 et coordonner avec 018 |

## 23. Décisions architecturales

Aucun ADR identifié à ce stade ; la reprise de RM-02 dans `AGENTS.md` (036) dépend de sa validation et de Q5.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mesure terrain et disponibilité d'un P75 global par appareil | Cloudflare Web Analytics / autre recueil à justifier / mesure indisponible | Vérifier les données du projet, la segmentation et les parcours couverts avant de choisir ; aucun recueil supplémentaire décidé | — |
| Q2 | Budgets de NFR-01 | Tels quels / recalibrés après mesure | À arbitrer : les seuils initiaux JS et CSS sont déjà dépassés (§4) | — |
| Q3 | Laboratoire d'interactions bloquant ? | Bloquant / informatif | Informatif (variabilité des runners) | — |
| Q4 | Séquencement FR-04/FR-05 et budgets | Lot 5 / autre lot, notamment avec 123 | Coordonner avec 031 déjà implémentée et avec DSO-Q1 ; lot non décidé | — |
| Q5 | Hors ligne et sens de « chargé » dans RM-02, AC-02 et AC-03 | Précacher les chunks optionnels / ne les transférer qu'à l'activation / autre compromis | À arbitrer : préserver ou réviser explicitement la garantie hors ligne de 031 | — |
| Q6 | Indicateur de laboratoire et mesure terrain | Durées Event Timing par saisie / véritable INP par visite puis P75 de visites / autre méthode | Ne pas assimiler le P75 de 20 saisies à l'INP P75 terrain | — |
| Q7 | Périmètre et méthode des budgets | JS initial et imports transitifs, CSS, legacy et précache séparés / autre périmètre ; gzip, niveau et unités à définir | À calibrer sur un build et une méthode reproductibles (§4) | — |

## 25. Traçabilité

Spec 020 ; rapport `docs/v2/audit/10-docs-quality.md` (§3.3 « performance non mesurée ») ; rapport `docs/v2/audit/02-architecture.md` (§4.4, constat historique corrigé par 010) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.2 (020), §B.3, §F.1 ; specs 010, 018, 031, 043, 092 ; [job CI et artefact mesuré](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/45844273200/job/139993734641) ; [Cloudflare Core Web Vitals](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/).

## Révision DevSecOps (2026-11-20) — proposition à valider

> **Statut : À VALIDER.** Proposition issue du chantier DevSecOps (audit `docs/v2/audit/11-devsecops.md`) ; aucune exigence ci-dessous n'est validée. Les constats ci-dessus ont été actualisés le 2026-11-26.

### Articulation

La demande DevSecOps impose Lighthouse CI (performance, accessibilité, bonnes pratiques, SEO). Plutôt que d'élargir cette spec (difficulté S), une spec dédiée est proposée : **V2-QA-15 (spec 123)**. Partage des rôles :

| Mesure | Porteur |
|---|---|
| Budgets de taille par chunk et chargement initial (`perf-budgets.json`) | 044 (source unique) |
| Indicateur d'interactions en laboratoire (Playwright, CPU ralenti) et INP terrain (source à confirmer) | 044 |
| Chargement (LCP, CLS, TBT), bonnes pratiques, SEO, score global | 123 (Lighthouse CI) |
| Poids des scripts dans Lighthouse | 123, lu depuis `perf-budgets.json` |

### Exigences proposées

- DSO-FR-01 `perf-budgets.json` est la source unique des budgets de poids, consommée par le script de 044 et par la configuration Lighthouse de 123.
- DSO-FR-02 Le build analysé est l'artefact `dist/` produit une seule fois par la CI (113 FR-07).
- DSO-FR-03 Si 123 est validée, FR-01 à FR-03 de 044 (budgets et contrôle CI) passent du lot 5 au lot 2 (prérequis de 123).

### Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| DSO-Q1 | Lot des budgets de bundle | Lot 5 / lot 2 avec 123 | Lot 2 si Lighthouse CI est retenu | — |

### Dépendances

V2-QA-15 (123), V2-CICD-01 (113).
