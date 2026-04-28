# Audit cible securite, Vercel, performance - 2026-04-24

## Synthese

Passe ciblee sur Bougnat Darts Counter, application Vite/React offline-first avec une seule route serverless Vercel pour le provisioning de token Deepgram.

Priorite traitee: durcissement de `/api/deepgram/token`, contrat d'environnement Vercel, dependances, cout initial du bundle et logs runtime.

## Diagnostic court

| Fichier | Gravite | Impact utilisateur | Recommandation / statut |
| --- | --- | --- | --- |
| `api/deepgram/token.ts` | Haute | Endpoint vocal exposable a l'abus, CORS implicite, erreurs fournisseur renvoyees au navigateur | Corrige: CORS strict, validation JSON, rate limit best-effort, no-store, headers de securite, erreurs client generiques |
| `vite.config.ts` | Moyenne | Le proxy local Deepgram exposait aussi des details fournisseur | Corrige: reponses locales alignees, pas de details sensibles client, headers no-store/nosniff |
| `scripts/deployment-check.mjs` | Haute | Risque de secret rendu public via variable `VITE_*` sur Vercel | Corrige: detection bloquante des noms publics sensibles (`SECRET`, `TOKEN`, `API_KEY`, etc.) |
| `vercel.json` | Moyenne | Build Vercel sensible aux differences d'outil d'installation | Corrige: installation npm explicite et package manager declare |
| `package-lock.json` | Moyenne | `npm audit` signalait `brace-expansion` en dependance dev | Corrige: `npm audit fix`, audit a 0 vulnerabilite |
| `App.tsx`, `index.tsx` | Basse | Bundle initial et logs runtime trop bavards | Corrige: lazy loading des ecrans setup/match, loader plus sobre, logs SW limites au debug |
| `views/MatchView.tsx`, `views/SetupView.tsx` | Basse | Composants volumineux | Action prudente: chargement a la demande. Extraction interne a planifier plus tard si evolution fonctionnelle |
| `src/styles/tailwind.css` | Basse | CSS global limite, pas de surcharge majeure detectee | Pas de refonte recommandee |

## Audit Vercel

- Variables publiques: seules les variables `VITE_*` sont exposees au client. Le check de deploiement bloque maintenant les noms `VITE_*` a apparence sensible.
- Secrets serveur: `DEEPGRAM_API_KEY` et `DEEPGRAM_PROJECT_ID` restent server-only et ne sont pas lus par le bundle client.
- API routes: `/api/deepgram/token` accepte seulement `POST` et `OPTIONS`, valide le corps JSON, limite la taille du body, applique CORS strict et renvoie des erreurs generiques.
- Headers: `vercel.json` couvre CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy et Permissions-Policy; la route API ajoute aussi ses headers defensifs.
- CORS: aucune wildcard; l'origine doit etre l'origine de la requete Vercel ou `VITE_APP_URL`.
- Abuse: rate limiting memoire best-effort par IP sur Edge. Pour une forte exposition publique, passer a une solution partagee type Vercel KV/Upstash.
- Logs: les erreurs fournisseur sont journalisees cote serveur sans renvoyer de detail au navigateur; les logs service worker passent en debug.
- Build output: build Vite valide, secrets non injectes via `VITE_*`, installation Vercel alignee sur npm via configuration explicite.

## Dette et risques residuels

- `MatchView.tsx`, `SetupView.tsx`, `CapitalGameView.tsx` et `CricketGameView.tsx` restent gros. Les decouper necessite une passe fonctionnelle plus longue avec tests E2E dedies.
- Le rate limiting Edge en memoire est volontairement simple; il reduit l'abus opportuniste mais n'est pas global entre regions/instances.
- Les donnees de session restent en stockage local/IndexedDB par design offline-first; ne pas y ajouter de secret ou token longue duree.

## Corrections appliquees

- Durcissement serverless Deepgram et tests unitaires API.
- Blocage des variables publiques sensibles au deploiement.
- Correction `npm audit`.
- Build Vercel aligne sur npm avec configuration explicite.
- Lazy loading des ecrans de scorage et setup.
- Logs runtime reduits hors debug.

## Verifications executees

- `npm audit --audit-level=moderate`
- `npm run ci:check`
- `DEPLOY_TARGET=production ... node scripts/deployment-check.mjs`
- `DEPLOY_TARGET=production ... VITE_SECRET_TOKEN=oops node scripts/deployment-check.mjs` (echec attendu)
- `npm run test:e2e` avec `npm run preview -- --host 127.0.0.1 --port 4173`
