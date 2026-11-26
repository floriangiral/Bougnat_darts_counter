# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de référence : `v2.1.0`, préparée sur `release/v2.1.0` depuis `main` (2.0.0 et correctifs de recette) ; tag et GitHub Release publiés le 2026-11-23, pas encore promue en production ; production actuelle `v1.1.4`
- La `v2.0.0` a ete preparee et fusionnee dans `main` mais jamais promue : son contenu est publie avec la `v2.1.0` ([notes v2.1.0](release/v2.1.0.md))
- Nouveaute majeure de la version 2 : lien de match externe `X01` optionnel ([spec 030](../specs/030-counter-external-match-link/spec.md), [guide partenaire](integration/external-match-link.md))
- Nouveautes `v2.1.0` : partie rapide `X01`, limite de volees par manche avec departage au bull, score personnalise `X01` plafonne a 2501 (hors spec, voir [specifications](specifications.md))
- Application Vite / React
- Base frontend alignee sur `React 19`
- Scorage offline-first
- Jeux supportes : `X01` (dont la configuration 501 Double Out), `Cricket`, `Capital`, `Killer`, `Gotcha`, `180 Around the Clock`, `Triathlon`
- Assistance vocale `X01` optionnelle
- Aucune dependance runtime a un backend metier pour le gameplay supporte

## Demarrage local

Le socle de developpement et de build est Node.js `26.13.1` (branche LTS 26),
declare dans `.nvmrc` et utilise en CI.
Le manifeste accepte les correctifs et mineures suivants de Node 26, pas les
autres majeures. Les types Node suivent egalement la branche 26.
Avec nvm, executer `nvm install` puis `nvm use` avant les commandes ci-dessous.
Sans nvm, installer la version indiquee dans `.nvmrc`.
Utiliser npm `12.2.3`, declare dans `packageManager` et installe explicitement
en CI. Apres selection de Node, executer
`npm install --global npm@12.2.3` si necessaire.
Sur Cloudflare Pages, supprimer ou aligner tout `NODE_VERSION` configure dans
le dashboard sur `.nvmrc` pour eviter qu il ne remplace la version du depot.

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Acces local par defaut : `http://localhost:3000`

Le projet ne maintient plus d'outillage Docker : utiliser Node/npm directement.
Aucun conteneur ni backend n'est nécessaire pour développer ou déployer.
Les tests E2E et smoke restent réservés à la CI ; les vérifications locales
se limitent au typecheck, au lint, aux tests unitaires et au build.

## Navigateurs pris en charge

`vite.config.ts` produit un build moderne et, avec `@vitejs/plugin-legacy`, un build de repli pour iOS et Safari 12 ou plus (cibles `ios >= 12`, `safari >= 12`, spec [018](../specs/018-counter-ios12-compatibility/spec.md)). Les navigateurs legacy ne fonctionnent hors ligne qu'avec les fichiers déjà chargés (le service worker ne précache que le build moderne). Les E2E couvrent Chromium et WebKit (`playwright.config.ts`) ; aucune matrice d'appareils réels n'est tenue à jour (spec 042, à valider).

## Installation npm et scripts de dependances

`package-lock.json` est l unique verrouillage du projet. La CI execute
`npm ci --include=dev` et propage tout echec, sans repli pnpm/Corepack qui
recalculerait un autre arbre de dependances.
Avec npm 12, les scripts de dependances sont bloques par defaut.
La politique `allowScripts` autorise uniquement `esbuild@0.28.2` et
`workerd@1.20261118.1` pour leurs binaires natifs ; le script de banniere
`core-js` est refuse, sans retirer les polyfills.
Lors d une mise a jour de ces paquets, examiner les scripts, renouveler
explicitement les autorisations versionnees et verifier
`npm install-scripts ls --json`. Ne pas utiliser d autorisation globale.
Le build local et la CI doivent rester valides apres une installation propre.

## Overrides npm

Les overrides de securite restent sur la branche compatible avec leurs
consommateurs : Babel 7 pour le build legacy, Nanoid 3 pour PostCSS et
`@humanfs/node` 0.16 pour ESLint. Ne pas les remplacer automatiquement par
le tag npm `latest` d une autre majeure.
Le plugin React Vite 6 utilise Oxc/Vite 8 pour les transformations JSX et
Fast Refresh avec `react()` sans option Babel. Babel 7 reste necessaire au
plugin legacy et au lint ; sa presence dans le lockfile est intentionnelle.
Undici est maintenu en 7.30.2 pour les consommateurs tels que Miniflare ;
une regle specifique a jsdom utilise 8.12.4 pour respecter son besoin Undici 8.
`renovate.json` borne les overrides Babel à `>=7 <8`, Nanoid à `>=3 <4`
et `@humanfs/node` à `>=0.16 <0.17`. Les deux overrides Undici conservent
leur branche actuelle : `>=7 <8` globalement, `>=8 <9` pour jsdom.
Ces bornes s'ajoutent à l'approbation des majeures ; elles n'autorisent
aucune migration incompatible par simple approbation dans le tableau de bord.
Toute evolution de ces regles doit etre verifiee dans le lockfile et avec
`npm ls undici --all`, les audits npm, les tests et le build legacy.

Exception ciblee pour l installation de Wrangler : son SDK `cloudflare`
5.2.0 demande encore `formdata-node` 4, qui installe `node-domexception`
deprecie. L override limite a `cloudflare` utilise `formdata-node` 6.0.3,
qui remplace ce polyfill par les API natives de Node 18 et suivants et
conserve les entrees CommonJS/ESM. Cette version est hors de la plage
declaree par ce SDK : les tests de contrat verifient donc les deux entrees,
un upload multipart HTTP local, son contenu binaire et sa longueur, sans
warning. Retirer cette exception quand Wrangler adoptera un SDK corrige.
Le test de lockfile refuse egalement toute entree marquee `deprecated`.
Il controle les metadonnees verrouillees, pas les futures decisions des
editeurs entre deux installations.

L environnement DOM de Vitest utilise jsdom 31, compatible avec le socle
Node 26.13.1. Son backend canvas optionnel est desormais `@napi-rs/canvas` ;
il n est pas installe car les tests actuels ne le necessitent pas.
Les changements de moteur CSS, de focus et de parsing HTML de jsdom doivent
etre valides par la suite unitaire, sans confondre ces tests avec ceux des
navigateurs reels.

Le compilateur TypeScript est maintenu sur `~6.0.3` : TypeScript-ESLint 8.73
declare une compatibilite `>=4.8.4 <6.1.0`. Ne pas passer a TypeScript 7 avant
sa prise en charge par le lint type-aware. La migration vers TypeScript 6
ne desactive aucune verification du compilateur ni regle ESLint.

## Bilan des versions au 19 novembre 2026

Comparaison au registre npm : 30 des 31 dependances directes verrouillees
correspondent au tag editeur `latest`. L exception restante est volontaire :

| Paquet | Version retenue | Tag `latest` | Motif |
| --- | --- | --- | --- |
| `@types/node` | 26.6.6 | 26.6.6 | Branche alignee sur le runtime applicatif Node 26 |
| `typescript` | 6.0.3 | 7.0.2 | Plage prise en charge par TypeScript-ESLint : `>=4.8.4 <6.1.0` |

Node `26.13.1` est la version LTS de production retenue et npm `12.2.3` correspond a
`latest` lors de cette verification. Les overrides sont egalement a jour,
soit sur `latest`, soit sur la derniere version de leur branche compatible :
Babel 7, Undici 7, Nanoid 3 et `@humanfs/node` 0.16. Undici 8 reste limite
a jsdom. Une montee de majeure de ces branches exige d abord la prise en
charge par leurs consommateurs, pas un remplacement force.

Verification finale : arbre complet `npm ls --all` valide, aucune decision
de script npm en attente et audit npm complet sans vulnerabilite connue.
Les 61 tests E2E Chromium/WebKit passaient apres l installation npm 12 (bilan date ; la suite complete est executee par la CI de la PR de release, voir [release v2.1.0](release/v2.1.0.md)),
dans l image Playwright officielle. Ce bilan ne remplace ni une nouvelle
analyse Snyk ni les controles GitHub Actions apres publication.
Apres retrait du polyfill deprecie, installation propre, build moderne/legacy,
compilation Pages Functions et build Docker ont ete controles sans warning,
sans abaisser le niveau des logs. La validation npm locale utilise une
configuration utilisateur vierge : l option obsolete `sass_binary_site`
presente sur la machine de validation n appartient pas au depot et n a pas
ete modifiee. Les journaux du deploiement heberge restent a verifier apres
publication ; aucune absence future de warnings editeurs n est garantie.
Reverifier les tags editeurs avant une prochaine campagne : ils evoluent
independamment du lockfile.

## Actions GitHub

### Isolation des tests nocturnes

Le cron de `e2e.yml` sur `main` ne checkout aucun code et n'utilise aucun cache.
Son seul job actif déclenche `e2e.yml` sur `develop` avec l'entrée `nightly=true`.
La permission `actions: write` est limitée à ce déclencheur ; les jobs de tests
gardent `contents: read`, sans secret hérité. Le workflow réutilisable teste
uniquement le commit de son contexte appelant, sans entrée `ref` de checkout.
Ainsi, du code de `develop` ne s'exécute plus dans le contexte de cache de `main`.
Les PR et les déclenchements manuels ordinaires conservent leur comportement ;
le nocturne reste bloquant et ses rapports sont conservés 14 jours.
La notification distingue les échecs du déclencheur et ceux des tests :
un dispatch réussi ne ferme pas l'incident d'une suite nocturne en échec.
Seuls les dispatchs `nightly=true` sur `develop`, identifiés par leur titre
d'exécution, participent à la notification nocturne ; les manuels ordinaires
ne ferment pas ses incidents.
Après fusion, synchroniser ces workflows sur `develop` avant le premier cron ;
un dispatch refusé échoue explicitement, sans repli vers un checkout interbranche.
La recette du dispatch, du contexte de cache et des notifications se fait en CI.

Les actions mises a niveau (Checkout 7.0.1, Setup Node 7.1.0, Upload Artifact
7.0.2, Download Artifact 8.0.2, GitHub Script 9.0.0, Dependency Review 5.0.1,
Gitleaks 3.0.0 et SonarQube Scan 8.5.0)
sont epinglees par SHA, avec la version lisible en commentaire.
Conserver cet epinglage lors des mises a jour Dependabot.
Leur runtime `node24` est distinct de la version applicative choisie par
Setup Node via `.nvmrc`. Les jobs utilisent les runners heberges `ubuntu-latest`.
Setup Node 7 ne fournit plus de `NODE_AUTH_TOKEN` factice ; les installations
publiques actuelles n en dependent pas. Upload Artifact 7 conserve l archivage
active par defaut pour les deux dossiers de rapports Playwright.
Valider la syntaxe et les entrees des actions localement, puis confirmer les
analyses, caches et artefacts par une execution GitHub Actions apres publication.

## Versions Playwright

Le paquet `@playwright/test` et ses dépendances `playwright` et `playwright-core`
dans le lockfile doivent rester alignés sur `1.65.1`.
Après une mise à jour, la CI installe les navigateurs correspondants ;
ne pas les installer ni exécuter les E2E ou smoke en développement local.
La CI valide tous les projets de `playwright.config.ts` :

- `chromium` (fenêtre de bureau, pointeur fin) : toutes les suites sauf `smartphone-layout` et `tablet-layout` ;
- sept profils tablette tactiles réalistes, barres de navigateur comprises et sans forçage `?mode=dedicated_tablet` (specs 070, 071) : iPad (gen 7) 1080×750 et 810×1010 (portrait), iPad Pro 11 1366×950, Galaxy Tab S4 1280×696, 1280×800, 960×520 et 1024×600 — suite `tablet-layout.smoke.spec.ts` ;
- quatre profils téléphone (spec 028) : iPhone SE, iPhone 13, iPhone 13 en paysage 844×390, Pixel 7 en paysage 932×430 — suite `smartphone-layout.smoke.spec.ts`.

Les profils iPad et iPhone utilisent WebKit, les profils Galaxy Tab et Pixel Chromium.

## Configuration

Variables publiques utiles :

- `VITE_APP_ENV`
- `VITE_APP_NAME`
- `VITE_APP_VERSION`
- `VITE_APP_URL`
- `VITE_APP_ACCESS_MODE`
- `VITE_CF_WEB_ANALYTICS_TOKEN`
- `VITE_ENABLE_VOICE_SCORING`
- `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` (optionnel, vide par defaut) : origines autorisees comme adresse de retour d un lien de match externe, separees par des virgules (cf. [spec 030](../specs/030-counter-external-match-link/spec.md) et le [guide partenaire](integration/external-match-link.md)). Vide = fonctionnalite desactivee. Voir la section dediee ci-dessous.
- `VITE_LOG_LEVEL`

Pour ce projet Cloudflare Pages connecte a Wrangler :

- les variables publiques de routage `VITE_APP_ENV`, `VITE_APP_NAME`, `VITE_APP_URL`, `VITE_APP_ACCESS_MODE`, `VITE_ENABLE_VOICE_SCORING`, `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS`, `VITE_LOG_LEVEL` et `DEEPGRAM_PROJECT_ID` sont déclarées dans [wrangler.jsonc](../wrangler.jsonc)
- `VITE_APP_VERSION` n'est **pas** déclarée dans `wrangler.jsonc` : sans valeur injectée au build, elle vaut `dev` et l'accueil n'affiche pas de code build (`src/lib/env.ts`, `views/HomeView.tsx`) ; son contrat est traité par la spec [009](../specs/009-counter-env-contract-and-validation/spec.md) (V2-REL-03)
- `VITE_CF_WEB_ANALYTICS_TOKEN` doit etre injecte par les variables de build Cloudflare Pages ou par un secret Cloudflare, pas commit dans le repo
- les blocs `env.production.vars` et `env.preview.vars` doivent etre complets, car Wrangler n herite pas les `vars` top-level vers les environnements
- les secrets serveur restent geres comme secrets Cloudflare et ne doivent pas etre commits

### Origines partenaires du lien de match externe

`VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS` est figee dans le bundle au build (variable `VITE_*`). Le bundle publie est construit par Cloudflare Pages a partir des branches miroirs `preprod` / `production`, avec les valeurs de `wrangler.jsonc` :

- source de verite : `env.preview.vars` (preprod) et `env.production.vars` (production) de `wrangler.jsonc`, modifies par PR ;
- la variable GitHub du meme nom (environnements `preprod` / `production`) n alimente que le build de validation de la CI ; `npm run preprod:check` / `npm run production:check` avertissent si elle differe de `wrangler.jsonc` ;
- format : origines `https` separees par des virgules, sans chemin, sans identifiants, sans doublon ni localhost (`https://badarts.fr,https://tournoi.club.fr`). Une entree invalide fait echouer `npm run wrangler:check`, les verifications de deploiement et le build Pages ;
- un sous-domaine est une origine distincte (`www.badarts.fr` != `badarts.fr`), sans joker ;
- tout ajout ou retrait d un partenaire demande un redeploiement (preprod d abord, puis production).

Test local sur telephone : avec `VITE_APP_ENV=local` explicite dans `.env.local`, le compteur accepte aussi un retour en `http` vers une IPv4 privee (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) declaree dans la liste, par exemple `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=http://192.168.1.20:7020`. Le serveur de dev ecoute deja sur `0.0.0.0:3000` : ouvrir `http://<ip-du-pc>:3000/?v=1&game=x01&p1=A&p2=B&return=http://192.168.1.20:7020/match/1` depuis le telephone. En preprod et en production, `https` reste obligatoire. Le [simulateur de partenaire](integration/partner-simulator/index.html) peut jouer l application partenaire en local : `python3 -m http.server 7020 --directory docs/integration/partner-simulator`.

URLs cibles actuellement attendues :

- `preprod`: `https://preprod.bougnat-darts-counter.pages.dev`
- `production`: `https://play.bougnatdarts.fr`

## Observabilite web

Le projet utilise desormais uniquement un beacon web natif configure au bootstrap.

Regles de setup :

- definir `VITE_CF_WEB_ANALYTICS_TOKEN` dans les environnements cibles
- ne pas activer en meme temps une injection automatique du beacon dans le dashboard pour eviter un double snippet
- garder la CSP autorisant `https://static.cloudflareinsights.com`
- ne pas declarer `observability` dans [wrangler.jsonc](../wrangler.jsonc) car Cloudflare Pages rejette ce champ au build

Comportement runtime :

- le beacon est injecte une seule fois au bootstrap frontend
- le suivi SPA est laisse au beacon par defaut
- aucun event metier custom ni couche analytics maison n est conservee dans l application

Observabilite Functions :

- pour ce projet Pages, l observabilite edge ne doit pas etre configuree dans `wrangler.jsonc`
- si des reglages runtime edge sont necessaires, ils doivent etre geres depuis le dashboard Cloudflare compatible Pages

Variables privees utiles pour l'assistance vocale :

- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

Regles importantes :

- Les variables `VITE_*` sont publiques cote frontend.
- Les cles privees ne doivent jamais etre exposees au navigateur.
- L'assistance vocale reste optionnelle et garde toujours un fallback manuel.

## Scripts utiles

```bash
npm run dev
npm run build
npm run deploy:pages
npm run preview
npm run lint
npm run lint:type-aware
npm run typecheck
npm run test:unit
npm run test:unit:coverage
npm run governance:coverage
npm run guard:clean
npm run wrangler:check
npm run test:e2e # CI uniquement
npm run ci:check
```

## Deploiement Cloudflare Pages

Le repo est configure pour un projet `Cloudflare Pages`, pas pour un `Workers deploy` classique.

Regles a respecter :

- dans le dashboard Pages, utiliser `npm run build` comme build command
- definir `dist` comme build output directory
- ne pas renseigner `npx wrangler deploy` comme commande de deploiement
- pour un deploiement manuel en CLI, utiliser `npm run deploy:pages` ou `npx wrangler pages deploy dist`
- si le projet affiche que les variables sont gerees par Wrangler, maintenir les variables de routage dans `wrangler.jsonc` et injecter `VITE_CF_WEB_ANALYTICS_TOKEN` depuis les variables de build Pages

Symptome d une mauvaise configuration : si Cloudflare lance `wrangler deploy`, Wrangler detecte un projet Pages puis echoue en reclamant `main` ou `assets.directory`. Dans ce cas, il faut corriger la configuration du projet Pages, pas convertir ce repo en Worker classique.

Autre symptome connu : si Pages lit `wrangler.jsonc` et echoue sur `observability`, il faut retirer ce bloc de la config car il n est pas supporte sur les projets Pages.

## Application installable et service worker (spec 031)

- `public/manifest.json` et `public/sw.js` sont copiés tels quels dans `dist/` (URL stables `/manifest.json` et `/sw.js`). `public/_headers` sert `/sw.js` en `no-cache` et `/manifest.json` en `application/manifest+json` revalidé à chaque visite.
- `npm run build` enchaîne, après `vite build` :
  - `scripts/generate-sw-precache.mjs` : liste les fichiers de la coquille (page, manifeste, icônes, JS/CSS modernes de `dist/assets`, hors chunks legacy et sources maps) et l'injecte dans `dist/sw.js` avec un identifiant de build (`bougnat-darts-<hash>`), calculé à partir du contenu : il change à chaque version, jamais `dev` ;
  - `scripts/validate-pwa-build.mjs` : échoue si le manifeste, une icône (taille et type PNG), le service worker ou une URL précachée manque, ou si l'un d'eux contient la page HTML de repli.
- Cycle de vie : une nouvelle version s'installe puis **attend**. Hors écran de partie protégé, la page lui demande de s'activer (`SKIP_WAITING`) puis recharge une fois ; pendant une partie, la mise à jour est mise en attente et appliquée à la sortie de l'écran protégé. Le premier enregistrement ne recharge pas la page. L'activation ne supprime que les anciens caches `bougnat-darts-*`. Logique côté page : `src/infrastructure/web/serviceWorkerUpdates.ts`.
- Navigation en réseau d'abord : seule une réponse `ok` non redirigée est mise en cache ; hors ligne, la coquille en cache est servie. Les requêtes `/api/`, externes et non `GET` ne passent pas par le cache. Le service worker ne lit ni n'écrit la sauvegarde des parties (IndexedDB, `localStorage`).
- Retour arrière : construire avec `BOUGNAT_PWA_KILL_SWITCH=true npm run build` pour livrer à la place `scripts/pwa/sw-kill-switch.js`, qui supprime les caches `bougnat-darts-*` et se désenregistre, sans toucher aux parties sauvegardées.
- En développement (`npm run dev`), les service workers d'un build de production sur la même origine sont désenregistrés.
- E2E : `playwright.config.ts` bloque les service workers ; seul `tests/e2e/pwa.smoke.spec.ts` les autorise.

### Tests E2E et smoke : CI uniquement

Ne jamais exécuter ces tests en développement local, même en WSL, dans
Docker ou sur une sélection ciblée. Ne pas démarrer de serveur de test ni
installer de navigateurs ou de bibliothèques système pour les reproduire.
La validation se fait sur les checks du workflow `End-to-End` de la PR ;
les rapports Playwright et les journaux du serveur sont disponibles dans
les artefacts du run en cas d'échec.

L'action CI `.github/actions/run-local-smoke/action.yml` construit le build
avec `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example` et
`VITE_ENABLE_VOICE_SCORING=true`, installe les navigateurs via
`setup-ci-app` et démarre un seul serveur de preview sur un port strict.
En local, utiliser le typecheck, le lint, les tests unitaires et le build.

## Qualite

Le projet embarque :

- lint
- typecheck
- tests unitaires
- tests end-to-end
- controle de securite
- audit de dependances
- analyse SonarCloud du New Code et de la branche `main`
- analyse Snyk des dependances npm
- analyse OSV-Scanner des dependances npm, CodeQL du code et des workflows, OpenSSF Scorecard

La qualite du projet repose aussi sur :

- une approche spec-driven pour cadrer les evolutions fonctionnelles
- une Clean Architecture pragmatique pour proteger le coeur de scorage
- un principe de decoupe a responsabilite unique : chaque fichier cible une seule responsabilite metier identifiable

### Couleurs et design tokens (specs 063, 065)

- Les couleurs passent uniquement par les rôles de `src/styles/tokens/` (guide : [design-system.md](design-system.md)).
- `npm run guard:clean` exécute `scripts/design-tokens/check.mjs` : il compte les classes de palette Tailwind brutes et les valeurs arbitraires colorées dans `App.tsx`, `views/`, `components/`, `src/` et `utils/` (hors tests) et échoue si ce nombre dépasse la référence de `scripts/design-tokens/baseline.json`. C'est un cliquet : la référence ne peut que baisser.
- `node scripts/design-tokens/migrate.mjs <fichier|dossier>… [--dry-run]` convertit les cas non ambigus (table de `scripts/design-tokens/palette.mjs`) et liste ceux à migrer à la main.
- Préférence de thème : clé `localStorage` `bougnat-theme-v1` (`{"v":1,"mode":"system"|"dark"|"light"}`), appliquée avant le premier rendu par le script inline de `index.html`, qui doit rester aligné sur `src/features/theming/themePreference.ts` (test de cohérence dans `tests/unit/designSystem/themePreference.test.tsx`). Invite d'orientation : clé `sessionStorage` `bougnat-orientation-hint-dismissed`.

### Performances (Web Vitals)

Les indicateurs LCP, CLS et INP se mesurent sur le **build de production** (`npm run build` puis `npm run preview`), jamais sur `npm run dev` : le serveur de développement sert des modules non regroupés et React en mode développement (rendus doublés par `StrictMode`), ce qui gonfle fortement les valeurs (relevé du 2026-11-20 dans les DevTools sur `npm run dev` : LCP 5,3 s, CLS 0,24, INP 1,3 s).

Mesures du 2026-11-20 sur le build de production, Chromium sans interface, processeur ralenti ×4 (profil tablette/mobile pessimiste), parcours accueil → configuration → partie → saisie de volées : LCP 0,35 à 0,67 s, CLS 0 à 0,022, INP 40 à 168 ms selon le jeu et le format (téléphone 390×844, Galaxy Tab S9+ 780×1240, 1200×1920) — cibles « bonnes » : LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms. Le suivi automatisé des budgets relève de la spec 044 (V2-PERF-01, à valider).

### Qualite et securite CI

- `Quality Gate / SonarCloud` analyse le New Code des pull requests et publie les metriques dans le Summary GitHub Actions ; l'action SonarQube Scan 8.5.1 utilise le scanner CLI 8.5.0.16571 avec vérification de signature activée. Les déclarations `**/*.d.ts`, sans code exécutable, ne sont pas incluses dans le LCOV Vitest ; les planchers et les exclusions UI approuvées restent inchangés ;
- le scanner Sonar réanalyse les sources sans réutiliser le cache d'analyse (`sonar.analysisCache.enabled=false`) : l'ancien cache JS/TS ne fournit aucun graphe d'architecture UDG. L'analyse d'architecture reste activée ; sa génération effective est à vérifier dans les journaux CI ;
- `Global Quality Baseline` mesure toute la base applicative pour chaque pull request ciblee vers `main` ;
- SonarCloud analyse aussi `main` apres merge et chaque semaine ;
- `Security Review / Snyk Dependencies` contrôle les dépendances npm (`package-lock.json`) avec un seuil bloquant `high`, publie un SARIF dans l'onglet Security et enregistre un instantané Snyk après chaque fusion sur `main` ; il est ignoré avec une notice sur les PR de fork et de Dependabot (secret non exposé) ;
- `Security Review / CodeQL (javascript-typescript)` et `CodeQL (actions)` analysent le code et les workflows (`security-extended` sur PR et push, `security-and-quality` chaque semaine ; configuration `.github/codeql/codeql-config.yml`). Les jobs sont séparés : `codeql` conserve l'environnement sans matrice et la catégorie implicite historiques de `main` ; `codeql-actions` publie `/language:actions`. Ne pas modifier cette identité ni supprimer les analyses historiques pour masquer une configuration manquante. `Dependency Review` ajoute un contrôle des licences non bloquant et `NPM Audit` un `npm audit signatures` informatif (spec 117) ;
- `OSV-Scanner / OSV-Scanner` compare `package-lock.json` entre la branche cible et la PR et bloque toute nouvelle vulnérabilité haute ou critique ; `OSV Full Scan` publie chaque nuit et après fusion sur `main` un SARIF (catégorie `osv-scanner`) et échoue au-dessus du même seuil ; `OSV Exceptions` (`npm run security:osv-exceptions`) vérifie les exceptions datées d'`osv-scanner.toml` (spec 117, politique dans `SECURITY.md`) ;
- `OpenSSF Scorecard` analyse `main` chaque semaine et après fusion, publie ses résultats (api.scorecard.dev et onglet Security) ; `OpenSSF Scorecard Summary` résume les scores et leur écart ; plan : [security/scorecard-plan.md](security/scorecard-plan.md) (spec 119) ;
- `Renovate configuration` valide `renovate.json` en mode strict ; Renovate (application GitHub hébergée) cible `main`, sans auto-fusion, avec délai de maturité de 7 jours ; Dependabot reste configuré jusqu'à la recette de la spec 116 ;
- les actions tierces autorisées par le dépôt sont Gitleaks, Snyk, SonarQube Scan, OSV-Scanner et Scorecard ; toute nouvelle action tierce doit y être ajoutée et épinglée par SHA ;
- aucun outillage Docker ni aucune image de conteneur n'est maintenu : le développement utilise Node/npm et la production est servie par Cloudflare Pages ;
- les secrets CI requis sont `SONAR_TOKEN` et `SNYK_TOKEN`, uniquement dans les Repository secrets GitHub Actions ;
- les checks SonarCloud, Snyk, CodeQL, Gitleaks, tests/build et E2E doivent etre requis par le ruleset de `main`.

Durcissement de la CI (spec 043) :

- le job `Lint, Typecheck, Unit Tests, Build` exécute `env:check`, `guard:clean`, `wrangler:check`, `governance:coverage`, `lint`, `lint:type-aware` (`--max-warnings 0`), `typecheck`, `test:unit` et `build` ;
- `guard:clean` recherche les références legacy avec `git grep` (fichiers suivis et non suivis, hors fichiers ignorés) et échoue explicitement si Git est indisponible ;
- le résumé `Global Quality Baseline` lit les planchers dans `vitest.config.ts` (`scripts/ci-coverage-summary.mjs`) ; le rapport de couverture est publié en artefact et réutilisé par le job `SonarCloud`, qui ne le recalcule que si la baseline n a pas tourné ;
- sans `SONAR_TOKEN` (pull request de fork ou Dependabot), le job `SonarCloud` est ignoré avec le message « Analyse ignorée » ;
- le smoke E2E démarre un seul `vite preview` (`PLAYWRIGHT_EXTERNAL_SERVER=1`), sur un port strict (`--strictPort`, port occupé = échec), avec un journal dans `$RUNNER_TEMP` publié en artefact `preview-server-log` en cas d échec ;
- les tests Playwright réussis seulement au second essai sont listés dans le Summary (`scripts/ci-playwright-flaky-summary.mjs`), sans bloquer ;
- le workflow `Scheduled Failure Notification` ouvre ou complète une issue unique étiquetée `ci:echec-planifie` par workflow planifié en échec (`Quality Gate`, `Security Review`, `Secret Scan`, `Dependency Watch`, `End-to-End`) et la ferme à la réussite planifiée suivante.

Le correctif proposé dans la PR #356 reconnaît aussi le nom d'exécution `End-to-End (nocturne)` : un dispatch n'est traité comme nocturne que s'il vient du workflow `.github/workflows/e2e.yml`, porte ce titre et cible `develop`. Le titre de l'incident reste `End-to-End`, distinct de `End-to-End (déclenchement)` pour le planificateur. Les dispatchs ordinaires et les PR ne ferment pas ces incidents. La réception réelle de `workflow_run` et le cycle échec/succès restent à observer après intégration du correctif sur la branche par défaut.

### Couverture locale et SonarCloud

Le lint standard et le lint type-aware sont complementaires. Executer
`npm run lint:type-aware` pour verifier les appels et affectations non surs,
les promesses non attendues et les methodes detachees de leur recepteur.
Dans les tests React, attendre les appels `act` asynchrones ; aux frontieres
navigateur ou stockage, verifier les valeurs inconnues plutot que propager
`any`. Une correction ne doit pas desactiver ces regles pour rendre le lint vert.

`npm run test:unit:coverage` mesure tous les fichiers TS/TSX du perimetre source
Sonar, y compris ceux qu aucun test n importe. Les exclusions sont lues
directement dans `sonar-project.properties` et controlees par
`npm run governance:coverage` : aucune liste parallele ni exclusion
supplementaire n est utilisee pour relever artificiellement les resultats.

Planchers globaux Vitest :

| Instructions | Branches | Fonctions | Lignes |
|---:|---:|---:|---:|
| 90 % | 80 % | 90 % | 90 % |

Mesures historiques (ne décrivent plus l'état actuel ; dernière mesure datée : section
« Vérification » des [notes v2.1.0](release/v2.1.0.md)).

Validation locale du 3 novembre 2026 sur `develop` : **398 tests dans 67
fichiers**, 94,10 % des instructions, 85,71 % des branches, 96,33 % des
fonctions et **95,29 % des lignes** (2954/3100). A perimetre identique, la
couverture des lignes passe de 62,58 % a 95,29 %. Les anciens 85,84 % locaux
ne comptaient que les fichiers importes par les tests et ne sont donc pas
directement comparables.

Apres le suivi securite/lint type-aware du meme jour : **401 tests**,
94,01 % des instructions, 85,51 % des branches, 96,57 % des fonctions et
**95,23 % des lignes (2961/3109)**. Les deux linters, le typecheck et le build
passent ; l audit npm ne remonte aucune vulnerabilite avec les overrides
`minimatch 11.0.1` et `zod 4.6.6`.

Les nouveaux tests couvrent les interactions de saisie/statistiques, le
streaming vocal et ses erreurs, la navigation, le cycle de vie des parties,
la persistance et les transitions/bonus du Triathlon. Les frontieres
audio/SDK/token sont simulees : un essai reel de microphone/Deepgram reste
complementaire.

Rapports generes : `coverage/lcov.info` pour SonarCloud et
`coverage/coverage-summary.json` pour les mesures locales.
Le seuil Sonar du **nouveau code (80 %)** reste une validation distincte :
les resultats locaux ne prouvent pas que le Quality Gate serveur est vert.

Voir la [gouvernance de couverture](../specs/029-counter-sonar-coverage-governance/spec.md)
et la [coverage map v2.1.0](release/v2.1.0-coverage-map.md).

## Flux GitHub Actions

Flux de branches :

- `main` : branche source de promotion preprod
- `preprod` : branche miroir poussee par le workflow de preprod, puis source de promotion production
- `production` : branche miroir poussee par le workflow de promotion

Workflows principaux :

- `Quality Gate` : PR vers `main`, `preprod`, `develop`, `release/**`
- `End-to-End` : PR vers `develop`, `main`, `preprod`, `release/**`, chaque nuit à 03:17 UTC sur `develop` (bloquant en exécution planifiée) et manuel
- `Scheduled Failure Notification` : suit les exécutions planifiées et tient à jour une issue `ci:echec-planifie` par workflow en échec
- `Deploy Preview` : manuel uniquement depuis `main`, puis synchronise la branche `preprod`
- `Promote Production` : manuel uniquement depuis `preprod`, puis synchronise la branche `production`
- `Validate Environments` : manuel, valide seulement le contrat d environnement cible

Regles de securite recommandees dans GitHub :

- environment `preprod` : limiter les lancements manuels a la branche `main`
- environment `production` : limiter les lancements manuels a la branche `preprod`
- environment `production` : exiger au moins un reviewer manuel avant execution
- conserver les secrets uniquement au niveau des environments qui les utilisent
- les workflows `Deploy Preview` et `Promote Production` peuvent pousser les branches miroirs `preprod` et `production` avec le `GITHUB_TOKEN`, sans GitHub App dediee

## Documentation technique

- [Specifications](specifications.md)
- [Architecture](architecture.md) et [décisions d'architecture (ADR)](adr/README.md)
- [Design system : tokens, thèmes et couleurs métier](design-system.md)
- [Périmètre produit](product-scope.md)
- [Feuille de route V2](roadmap-v2.md) et [audit V2 du 2026-11-20](v2/README.md)
- [Architecture clean pragmatique](architecture/counter-pragmatic-clean-architecture.md)
- [Scoring access modes](architecture/scoring-access-modes.md)
- [Fondation offline-first](architecture/scoring-terminal-offline-first-foundation.md)
- [Audit securite hebergement et performance](audit-security-hosting-performance-2026-04-24.md)
- [Release v2.1.0](release/v2.1.0.md)
- [Coverage map v2.1.0](release/v2.1.0-coverage-map.md)
- [Checklist de release](release/checklist.md) et [runbook](release/runbook.md)
- [Release v2.0.0](release/v2.0.0.md) (jamais publiee, integree a la v2.1.0)
- [Coverage map v2.0.0](release/v2.0.0-coverage-map.md)
- [Guide partenaire : lien de match externe](integration/external-match-link.md)
- [Release v1.1.5](release/v1.1.5.md)
- [Coverage map v1.1.5](release/v1.1.5-coverage-map.md)
- [Release v1.1.4](release/v1.1.4.md)
- [Coverage map v1.1.4](release/v1.1.4-coverage-map.md)
- [Release v1.1.3](release/v1.1.3.md)
- [Coverage map v1.1.3](release/v1.1.3-coverage-map.md)
- [Release v1.1.2](release/v1.1.2.md)
- [Coverage map v1.1.2](release/v1.1.2-coverage-map.md)
- [Release v1.1.1](release/v1.1.1.md)
- [Coverage map v1.1.1](release/v1.1.1-coverage-map.md)
- [Release v1.1](release/v1.1.md)
- [Coverage map v1.1](release/v1.1-coverage-map.md)
- [Release v1.0.2](release/v1.0.2.md)
- [Coverage map v1.0.2](release/v1.0.2-coverage-map.md)
- [Release v1.0.1](release/v1.0.1.md)
- [Coverage map v1.0.1](release/v1.0.1-coverage-map.md)
- [Release v1.0.0](release/v1.0.0.md)
- [Coverage map v1.0.0](release/v1.0.0-coverage-map.md)
- [Matrice de validation React 19](release/react-19-validation-matrix.md) (historique)

## Frontiere produit

Ce repository porte l'application de scoring. Il ne porte pas :

- backend metier
- authentification metier
- espace utilisateur riche
- profils distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistence backend metier
