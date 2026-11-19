# Guide d'intégration partenaire : lien de match externe

Ce guide s'adresse aux applications qui veulent faire jouer un match X01 sur le compteur
Bougnat Darts et récupérer son résultat, par exemple un gestionnaire de tournoi de club.

Référence technique : [spec 030](../../specs/030-counter-external-match-link/spec.md).
Disponible à partir de la v2.0.0.

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
| `return` | URL de retour absolue, **encodée** (`encodeURIComponent`) | obligatoire |

Règles importantes :

- **Une seule valeur invalide rend tout le lien invalide.** Le compteur ne devine rien pour
  un match officiel. Une version `v` inconnue est aussi rejetée.
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
  « Match de tournoi » avec votre domaine. En double, seul l'ordre de passage dans chaque
  duo reste modifiable.
- **Partie en cours sur la tablette :** si une autre partie est en cours, ou si le résultat du
  match précédent n'a pas été envoyé, le compteur demande avant d'ouvrir votre match.
- **Abandon :** quitter le match propose « Retour au tournoi », qui vous prévient de l'abandon,
  ou « Quitter sans prévenir ».
- **Fin du match :** le bouton **ENVOYER LE RESULTAT** et la mention « Retour vers votre-domaine »
  s'affichent. Le bouton « Revanche » est masqué.

## L'URL de retour

Le compteur ajoute ses paramètres à votre URL de retour et **conserve les vôtres**
(`token`, `match`…). Les noms suivants sont **réservés** et écrasés s'ils existent déjà :
`v`, `status`, `legs1`, `legs2`, `sets1`, `sets2`, `winner`.

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
   partagée, jusqu'à l'envoi (au plus 12 heures), puis dans l'historique du navigateur.

Le compteur garantit de son côté que :

- le résultat n'est envoyé que vers une origine autorisée ;
- le résultat n'est envoyé que pour le match décrit par le lien : mêmes joueurs, même
  ordre, même format, sans robot ;
- un lien en attente est oublié après 12 heures.

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

## Tester l'intégration

- **En préprod :** demandez l'ajout de votre origine dans le bloc `preview` de `wrangler.jsonc`.
- **En local, sur téléphone :** lancez le compteur avec `npm run dev` et `VITE_APP_ENV=local`
  dans `.env.local`. Vous pouvez alors déclarer une origine en `http` vers une IPv4
  privée de votre réseau, par exemple :

  ```
  VITE_APP_ENV=local
  VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=http://192.168.1.20:7020
  ```

  Ouvrez ensuite depuis le téléphone :
  `http://<ip-du-pc>:3000/?v=1&game=x01&p1=A&p2=B&return=http%3A%2F%2F192.168.1.20%3A7020%2Fmatch%2F1`.
  Cette tolérance n'existe qu'en local : en préprod et en production, `https` est obligatoire.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Le compteur s'ouvre sur l'accueil | Origine non déclarée, URL de retour non encodée ou en `http`, `game` absent, joueur manquant, valeur invalide (`legs=0`, `out=triple`…), version `v` inconnue |
| Pas de bouton « Envoyer le résultat » | Le match a été quitté puis relancé hors lien, ou le lien a expiré (12 heures) |
| Score inversé | L'ordre des joueurs du lien (`p1` / `p2`) ne correspond pas à votre ordre interne |
| `status=cancelled` reçu | Les joueurs ont abandonné le match sur le compteur |
