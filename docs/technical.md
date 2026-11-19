# Guide technique et developpement

Ce document regroupe les informations techniques qui ne doivent pas alourdir le README principal, destine aux joueurs et a la communaute.

## Etat du projet

- Version de reference : `v1.1.5`, preparee sur `release/v1.1.5` depuis `develop`
- Application Vite / React
- Base frontend alignee sur `React 19`
- Scorage offline-first
- Jeux supportes : `X01`, `501 Double Out`, `Cricket`, `Capital`, `Killer`, `Gotcha`, `Triathlon`
- Assistance vocale `X01` optionnelle
- Aucune dependance runtime a un backend metier pour le gameplay supporte

## Demarrage local

Le socle de developpement et de build est Node.js `24.22.3` (branche LTS 24),
declare dans `.nvmrc`, utilise en CI et dans l image Docker applicative.
Le manifeste accepte les correctifs et mineures suivants de Node 24, pas les
autres majeures. Les types Node suivent egalement la branche 24.
Avec nvm, executer `nvm install` puis `nvm use` avant les commandes ci-dessous.
Sans nvm, installer la version indiquee dans `.nvmrc`.
Utiliser npm `12.2.3`, declare dans `packageManager` et installe explicitement
en CI et pendant le build Docker. Apres selection de Node, executer
`npm install --global npm@12.2.3` si necessaire.
Sur Cloudflare Pages, supprimer ou aligner tout `NODE_VERSION` configure dans
le dashboard sur `.nvmrc` pour eviter qu il ne remplace la version du depot.

```bash
npm ci
cp .env.local.example .env.local
npm run dev
```

Acces local par defaut : `http://localhost:3000`

## Build Docker et certificats TLS

Sur un reseau standard :

```bash
docker build --pull -t bougnat-darts -f docker/app.Dockerfile .
```

Si un proxy TLS utilise une autorite interne deja approuvee sur l hote,
fournir le bundle PEM de confiance de l hote via un secret BuildKit :

```bash
docker build --pull \
  --secret id=build_ca_bundle,src=/etc/ssl/certs/ca-certificates.crt \
  -t bougnat-darts -f docker/app.Dockerfile .
```

Adapter le chemin au magasin PEM approuve de la machine. Le secret optionnel
est utilise uniquement pendant les etapes Alpine et npm : il n est ni copie
dans l image finale, ni ajoute au depot. Sans secret, les magasins de confiance
standard restent utilises. Aucune verification TLS ne doit etre desactivee.
Cette option configure le build uniquement, pas la confiance TLS au runtime.

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
Node 24.22.3. Son backend canvas optionnel est desormais `@napi-rs/canvas` ;
il n est pas installe car les tests actuels ne le necessitent pas.
Les changements de moteur CSS, de focus et de parsing HTML de jsdom doivent
etre valides par la suite unitaire, sans confondre ces tests avec ceux des
navigateurs reels.

Le compilateur TypeScript est maintenu sur `~6.0.3` : TypeScript-ESLint 8.73
declare une compatibilite `>=4.8.4 <6.1.0`. Ne pas passer a TypeScript 7 avant
sa prise en charge par le lint type-aware. La migration vers TypeScript 6
ne desactive aucune verification du compilateur ni regle ESLint.

## Bilan des versions au 19 novembre 2026

Comparaison au registre npm : 29 des 31 dependances directes verrouillees
correspondent au tag editeur `latest`. Les deux exceptions sont volontaires :

| Paquet | Version retenue | Tag `latest` | Motif |
| --- | --- | --- | --- |
| `@types/node` | 24.19.2 | 26.6.6 | Derniere version de la branche du runtime applicatif Node 24 |
| `typescript` | 6.0.3 | 7.0.2 | Plage prise en charge par TypeScript-ESLint : `>=4.8.4 <6.1.0` |

Node `24.22.3` est le dernier Node 24 publie et npm `12.2.3` correspond a
`latest` lors de cette verification. Les overrides sont egalement a jour,
soit sur `latest`, soit sur la derniere version de leur branche compatible :
Babel 7, Undici 7, Nanoid 3 et `@humanfs/node` 0.16. Undici 8 reste limite
a jsdom. Une montee de majeure de ces branches exige d abord la prise en
charge par leurs consommateurs, pas un remplacement force.

Verification finale : arbre complet `npm ls --all` valide, aucune decision
de script npm en attente et audit npm complet sans vulnerabilite connue.
Les 61 tests E2E Chromium/WebKit passent apres l installation npm 12,
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

Les actions mises a niveau (Checkout 7.0.1, Setup Node 7.1.0, Upload Artifact
7.0.2, Dependency Review 5.0.1, Gitleaks 3.0.0 et SonarQube Scan 8.5.0)
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

Le paquet `@playwright/test`, ses dependances `playwright` et `playwright-core`
dans le lockfile, et l image officielle de `docker/playwright.Dockerfile`
doivent rester alignes sur `1.65.1`.
Apres une mise a jour, installer les navigateurs correspondants avec
`npm exec -- playwright install chromium webkit` pour une execution locale.
L image officielle fournit deja ces navigateurs et leurs dependances systeme ;
son runtime Node est fourni par Microsoft et reste distinct du socle Node 24
de l application et de la CI.
Valider tous les projets : Chromium et les six profils WebKit tablette/mobile.

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

- les variables publiques de routage `VITE_APP_*`, `VITE_ENABLE_VOICE_SCORING`, `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS`, `VITE_LOG_LEVEL` et `DEEPGRAM_PROJECT_ID` sont declarees dans [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc)
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

- `preprod`: `https://ccdc74ab.bougnat-darts-counter.pages.dev`
- `production`: `https://play.bougnatdarts.fr`

## Observabilite web

Le projet utilise desormais uniquement un beacon web natif configure au bootstrap.

Regles de setup :

- definir `VITE_CF_WEB_ANALYTICS_TOKEN` dans les environnements cibles
- ne pas activer en meme temps une injection automatique du beacon dans le dashboard pour eviter un double snippet
- garder la CSP autorisant `https://static.cloudflareinsights.com`
- ne pas declarer `observability` dans [wrangler.jsonc](/home/e103350/projects/perso/Bougnat_darts_counter/wrangler.jsonc) car Cloudflare Pages rejette ce champ au build

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
npm run test:e2e
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

Pour les smoke E2E en local :

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# dans un second terminal
npm run test:e2e
```

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

La qualite du projet repose aussi sur :

- une approche spec-driven pour cadrer les evolutions fonctionnelles
- une Clean Architecture pragmatique pour proteger le coeur de scorage
- un principe de decoupe a responsabilite unique : chaque fichier cible une seule responsabilite metier identifiable

### Qualite et securite CI

- `Quality Gate / SonarCloud` analyse le New Code des pull requests et publie les metriques dans le Summary GitHub Actions ;
- `Global Quality Baseline` mesure toute la base applicative pour chaque pull request ciblee vers `main` ;
- SonarCloud analyse aussi `main` apres merge et chaque semaine ;
- `Security Review / Snyk Dependencies` controle les dependances npm avec un seuil bloquant `high` ;
- les secrets CI requis sont `SONAR_TOKEN` et `SNYK_TOKEN`, uniquement dans les Repository secrets GitHub Actions ;
- les checks SonarCloud, Snyk, CodeQL, Gitleaks, tests/build et E2E doivent etre requis par le ruleset de `main`.

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
et la [coverage map v1.1.5](release/v1.1.5-coverage-map.md).

## Flux GitHub Actions

Flux de branches :

- `main` : branche source de promotion preprod
- `preprod` : branche miroir poussee par le workflow de preprod, puis source de promotion production
- `production` : branche miroir poussee par le workflow de promotion

Workflows principaux :

- `Quality Gate` : PR vers `main`, `preprod`, `develop`, `release/**`
- `End-to-End` : PR vers `main`, `preprod`, `release/**`
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
- [Architecture](architecture.md)
- [Architecture clean pragmatique](architecture/counter-pragmatic-clean-architecture.md)
- [Scoring access modes](architecture/scoring-access-modes.md)
- [Fondation offline-first](architecture/scoring-terminal-offline-first-foundation.md)
- [Audit securite hebergement et performance](audit-security-hosting-performance-2026-04-24.md)
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
- [Release v1.0.1](release/v1.0.1.md)
- [Coverage map v1.0.1](release/v1.0.1-coverage-map.md)

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
