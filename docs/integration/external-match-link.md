# Guide d'intégration partenaire : lien de match externe

Ce guide s'adresse aux applications qui veulent faire jouer un match X01 sur le compteur
Bougnat Darts et récupérer son résultat, par exemple un gestionnaire de tournoi de club.

Référence technique : [spec 030](../../specs/030-counter-external-match-link/spec.md).
Disponible à partir de la v2.1.0, première version 2 publiée (contrat `v=1` préparé avec la 2.0.0, jamais mise en production).

## Principe

L'intégration n'utilise ni API, ni compte, ni appel réseau :

1. votre application ouvre le compteur avec un **lien** qui décrit le match ;
2. les joueurs vérifient le match, qu'ils ne peuvent pas modifier, puis le jouent ;
3. à la fin, le bouton **ENVOYER LE RESULTAT** ramène la tablette sur votre **URL de retour**, avec le score dans l'URL.

Si les joueurs abandonnent le match, ils peuvent aussi revenir sur votre URL de retour avec `status=cancelled`.

## Prérequis : déclarer votre origine

Le compteur ne renvoie un résultat que vers une **origine autorisée** : protocole, domaine
et port, par exemple `https://badarts.fr`.

- Demandez l'ajout de votre origine au mainteneur du compteur. Elle est déclarée dans
  `wrangler.jsonc`, d'abord en préprod pour vos tests, puis en production.
- `https` est obligatoire.
- Un sous-domaine est une origine distincte : `https://www.badarts.fr` et `https://badarts.fr`
  sont deux entrées.
- Chaque ajout ou retrait demande un redéploiement du compteur.

Sans origine déclarée, le lien est ignoré et le compteur s'ouvre sur son accueil habituel.

## Le lien d'entrée

```
https://play.bougnatdarts.fr/?v=1&game=x01&start=501&out=double&legs=3&p1=Alice&p2=Bob&return=<URL de retour encodée>
```

| Paramètre | Valeurs | Par défaut |
|---|---|---|
| `v` | version du contrat, `1` | `1` |
| `game` | `x01` (obligatoire) | - |
| `p1`, `p2` | noms des joueurs en simple | - |
| `t1p1`, `t1p2`, `t2p1`, `t2p2` | noms des joueurs en double (équipe 1 puis équipe 2) | - |
| `start` | score de départ, de 2 à 9999 | `501` |
| `in` / `out` | `open`, `double`, `master` | `open` / `double` |
| `legs` | manches à gagner (par set au format sets), de 1 à 15 | `3` |
| `sets` | sets à gagner, de 1 à 15 (active le format sets) | format manches |
| `stats` | `1` pour recevoir aussi les statistiques du match, `0` sinon | `0` |
| `return` | URL de retour absolue, **encodée** (`encodeURIComponent`) | obligatoire |

Règles importantes :

- `in=double` et `in=master` sont appliqués : avant son ouverture, chaque camp confirme
  l'ouverture et saisit les points comptés à partir de la fléchette d'ouverture (spec
  [046](../../specs/046-counter-x01-double-master-in/spec.md)). L'adversaire robot n'est pas
  disponible avec ces ouvertures ; le contrat `v=1` est inchangé. `in=open` (par défaut)
  ne change rien.
- **Une seule valeur invalide rend tout le lien invalide.** Le compteur ne devine rien pour
  un match officiel. Une version `v` inconnue est aussi rejetée. Le compteur affiche alors
  la raison aux joueurs (« Lien de match invalide », par exemple « Nombre de manches
  invalide (de 1 à 15) » ou « L'adresse de retour exemple.fr n'est pas autorisée »), puis
  s'ouvre normalement.
- Un paramètre inconnu est **ignoré** : il ne rend pas le lien invalide (voir
  « Compatibilité du contrat `v=1` »).
- Les noms sont nettoyés : caractères invisibles retirés, 32 caractères au maximum. Pour
  pouvoir comparer, utilisez de préférence des noms courts et sans caractères spéciaux.
- `legs` est le nombre de manches **à gagner** (« premier à »), pas un « best of ».
  « Best of 5 » correspond à `legs=3`.

Exemple de construction en JavaScript :

```js
const params = new URLSearchParams({
  v: '1',
  game: 'x01',
  start: '501',
  out: 'double',
  legs: '3',
  p1: 'Alice',
  p2: 'Bob',
  return: 'https://badarts.fr/match/12?token=9f2c…',
});
const link = `https://play.bougnatdarts.fr/?${params}`;
```

`URLSearchParams` encode automatiquement l'URL de retour.

## Ce que voient les joueurs

- **Écran de configuration :** les joueurs et le format sont **verrouillés**, et un bandeau indique
  « Match organisé par votre-domaine ». Les libellés sont neutres (tournoi, ligue,
  entraînement…) et affichent toujours votre domaine. En double, seul l'ordre de passage dans chaque
  duo reste modifiable. Un match lié ouvre toujours cet écran complet verrouillé, jamais la
  « partie rapide » X01, et n'a jamais de limite de volées par manche (le contrat `v=1` ne la porte pas).
- **Partie en cours sur la tablette :** si une autre partie est en cours, ou si le résultat du
  match précédent n'a pas été envoyé, le compteur demande avant d'ouvrir votre match.
- **Abandon :** quitter le match lié propose « Retour vers votre-domaine », qui vous prévient de l'abandon,
  ou « Quitter sans prévenir ».
- **Fin du match :** le bouton **ENVOYER LE RESULTAT** et la mention « Retour vers votre-domaine »
  s'affichent. Le bouton « Revanche » est masqué.

## L'URL de retour

Le compteur ajoute ses paramètres à votre URL de retour et **conserve les vôtres**
(`token`, `match`…). Les noms suivants sont **réservés** et écrasés s'ils existent déjà :
`v`, `status`, `legs1`, `legs2`, `sets1`, `sets2`, `winner`, `avg1`, `avg2`, `n180_1`,
`n180_2`, `hco1`, `hco2`, `duration`.

Match terminé :

```
https://badarts.fr/match/12?token=9f2c…&v=1&status=completed&legs1=3&legs2=1&winner=1
```

| Paramètre | Signification |
|---|---|
| `v` | version du contrat, `1` |
| `status` | `completed` |
| `legs1`, `legs2` | manches gagnées sur **tout le match** par le joueur/équipe 1 et 2 (ordre du lien) |
| `sets1`, `sets2` | sets gagnés (format sets uniquement) |
| `winner` | `1` ou `2` |

Avec `stats=1` dans le lien, le résultat contient aussi, par joueur ou équipe (1 et 2) :

| Paramètre | Signification |
|---|---|
| `avg1`, `avg2` | moyenne sur 3 fléchettes, 2 décimales (`45.67`) |
| `n180_1`, `n180_2` | nombre de 180 |
| `hco1`, `hco2` | meilleur checkout, `0` s'il n'y en a pas |
| `duration` | durée du match en secondes |

Match abandonné sur le compteur :

```
https://badarts.fr/match/12?token=9f2c…&v=1&status=cancelled
```

Aucun score n'est envoyé dans ce cas. Le match peut être relancé avec un nouveau lien.

## Sécurité : ce que vous devez vérifier

L'URL de retour **n'est pas signée**. Le compteur est une application web publique : il ne
peut pas détenir de secret. N'importe qui peut donc modifier `legs1` dans la barre
d'adresse. Traitez le résultat comme une **saisie à confirmer** :

1. **Jeton à usage unique et de courte durée** dans l'URL de retour (`token=…`), lié au
   match. Refusez un jeton déjà utilisé ou expiré.
2. **Traitement idempotent :** le même résultat peut arriver deux fois (double clic, retour
   arrière du navigateur). Le second ne doit rien changer.
3. **Contrôles de cohérence :** `winner` correspond au camp qui a atteint le nombre de
   manches (ou de sets) à gagner, et le perdant en a moins.
4. **Validation humaine :** l'arbitre ou l'organisateur confirme le score dans votre
   application avant de le publier.
5. **Rien de sensible dans l'URL de retour :** elle reste sur la tablette, qui peut être
   partagée, jusqu'à l'envoi ou l'oubli du match lié (voir « Durées et rejeu »), puis dans
   l'historique du navigateur.

Le jeton **corrèle** le retour à un match de votre application et empêche son rejeu ; il
ne **certifie** pas le score, que les joueurs saisissent eux-mêmes. Aucun secret ne peut
être protégé côté compteur (application web publique) : la validation humaine (point 4)
reste obligatoire.

Le compteur garantit de son côté que :

- le résultat n'est envoyé que vers une origine autorisée ;
- le résultat n'est envoyé que pour le match décrit par le lien : mêmes joueurs, même
  ordre, même format, sans robot ;
- un match lié est oublié quand la session est restaurée plus de 12 heures après
  l'ouverture du lien (voir « Durées et rejeu ») ;
- la mesure d'audience (Cloudflare Web Analytics) n'est pas chargée quand la page s'ouvre
  sur un lien de match : les noms des joueurs et votre URL de retour ne lui sont pas
  transmis.

## Durées et rejeu

Trois notions distinctes :

| Élément | Durée côté compteur | Qui protège contre le rejeu ? |
|---|---|---|
| **Contexte local du match lié** (URL de retour, joueurs, format) | Daté à l'ouverture du lien. Il est oublié s'il a plus de 12 heures quand la session est restaurée (rechargement, réouverture de l'onglet ou de l'application). Dans un onglet resté ouvert sans rechargement, il reste utilisable jusqu'à l'envoi ou à l'abandon. | — |
| **Lien entrant** (`?v=1&game=x01…`) | **N'expire pas.** Rouvrir le même lien des jours plus tard ouvre un nouveau match lié, daté de ce moment. | Votre application |
| **Jeton de votre URL de retour** | Celle que vous fixez. | **Votre application** : jeton à usage unique et de courte durée |

Conséquences :

- refusez un retour dont le jeton est déjà utilisé ou expiré, même si le lien entrant est
  rouvert plus tard ;
- choisissez une durée de jeton adaptée à la durée d'un match et de son attente (quelques
  heures), pas à la durée de 12 heures du compteur.

## Compatibilité du contrat `v=1`

Le contrat `v=1` est **figé** :

- aucun paramètre existant (entrée ou retour) ne change de nom, de valeurs admises, de
  valeur par défaut ni de sens ;
- seuls des paramètres **optionnels et additifs** peuvent être ajoutés. Un compteur plus
  ancien les ignore sans erreur, et votre application doit faire de même pour un paramètre
  de retour qu'elle ne connaît pas ;
- les noms de paramètres de retour listés dans « L'URL de retour » sont réservés : n'utilisez
  pas ces noms pour vos propres paramètres ;
- tout changement incompatible imposera une version `v=2`. `v=1` restera alors accepté au
  moins 12 mois après la publication de `v=2` ; la date de fin sera annoncée dans les notes
  de version.

Des tests de non-régression (« golden ») figent les URL de résultat et d'abandon produites
par le compteur.

## Organisation recommandée : un QR code par cible

Comme le retour se fait dans le même onglet, la tablette peut rester connectée à votre application toute la journée :

```
votre-app/tournoi/cible/4  →  « Jouer le match 12 »  →  compteur (setup verrouillé)
          ↑                                                    ↓
          └─────  ENVOYER LE RESULTAT → votre-app/match/12?…&status=completed…
```

1. Un QR code par cible ouvre la page de la cible dans votre application.
2. Cette page affiche le match en cours avec un bouton qui ouvre le lien.
3. Votre URL de retour enregistre le score, puis réaffiche la page de la cible avec le match suivant.

Si un joueur quitte sans prévenir, il suffit de revenir en arrière dans le navigateur ou de rescanner le QR code de la cible.

### Variante : nouvel onglet et relais

Votre application peut aussi ouvrir le lien dans un **nouvel onglet** (`window.open(lien,
'_blank')`) et garder sa page de gestion dans l'onglet d'origine. L'URL de retour pointe
alors vers une page dédiée de votre application, qui relaie le résultat à l'onglet de
gestion (par exemple avec `BroadcastChannel` ou `localStorage`), puis peut se fermer.

Limites de cette variante :

- le relais ne fonctionne que sur **le même appareil et le même navigateur** : un QR code
  scanné sur un autre téléphone, ou un lien ouvert dans un autre navigateur, n'atteint pas
  l'onglet de gestion ;
- votre page de retour doit rester capable d'enregistrer le résultat seule si l'onglet de
  gestion a été fermé ;
- les contrôles de la section « Sécurité » s'appliquent de la même façon (jeton, idempotence,
  validation humaine).

## Tablette : navigateur ou application installée ?

Utilisez le **navigateur** (un onglet par cible), pas l'application installée sur l'écran
d'accueil :

- sur iPad et iPhone, un lien ou un QR code s'ouvre toujours dans Safari, jamais dans
  l'application installée, dont le stockage est séparé. La partie liée vit donc dans
  le navigateur ;
- la boucle « un QR code par cible » repose sur la navigation dans le même onglet.

## Tester l'intégration

Un **simulateur de partenaire** est fourni :
[partner-simulator/index.html](partner-simulator/index.html). C'est une page autonome, sans
dépendance ni appel réseau. Elle construit le lien (simple ou double, format, stats,
URL de retour avec un jeton à usage unique), puis affiche le résultat reçu avec quelques
contrôles : version, jeton déjà utilisé, cohérence du vainqueur.

- **En préprod :** demandez l'ajout de votre origine dans le bloc `preview` de `wrangler.jsonc`.
- **En local, sur téléphone :** servez le simulateur sur votre réseau, il joue le rôle de
  votre application :

  ```
  python3 -m http.server 7020 --directory docs/integration/partner-simulator
  ```

  Lancez le compteur avec `npm run dev` et `VITE_APP_ENV=local` dans `.env.local`. Vous
  pouvez alors déclarer une origine en `http` vers une IPv4 privée de votre réseau, par
  exemple :

  ```
  VITE_APP_ENV=local
  VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=http://192.168.1.20:7020
  ```

  Ouvrez ensuite `http://192.168.1.20:7020/` sur le téléphone, choisissez « Local ou
  autre » avec `http://<ip-du-pc>:3000/` comme compteur, puis « Ouvrir le compteur ». Vous
  pouvez aussi ouvrir directement
  `http://<ip-du-pc>:3000/?v=1&game=x01&p1=A&p2=B&return=http%3A%2F%2F192.168.1.20%3A7020%2F`.
  Cette tolérance n'existe qu'en local : en préprod et en production, `https` est obligatoire.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| « Lien de match invalide » s'affiche | La raison est indiquée : origine non déclarée, URL de retour absente, non encodée ou en `http`, joueur manquant, valeur invalide (`legs=0`, `out=triple`…), version `v` inconnue, fonctionnalité non activée sur ce compteur |
| Le compteur s'ouvre sur l'accueil sans message | Le lien ne contient ni `game` ni `return` |
| Pas de bouton « Envoyer le résultat » | Le match a été quitté puis relancé hors lien, ou le match lié a été oublié (session restaurée plus de 12 heures après l'ouverture du lien) : rouvrez le lien |
| Score inversé | L'ordre des joueurs du lien (`p1` / `p2`) ne correspond pas à votre ordre interne |
| `status=cancelled` reçu | Les joueurs ont abandonné le match sur le compteur |
