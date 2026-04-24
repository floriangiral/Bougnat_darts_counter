# Product Scope

## Bougnat Darts Counter contient

- moteur de scoring
- jeux de flechettes supportes
- UI de scorage
- voice scoring `X01`
- sessions locales
- reprise locale
- historique local
- base offline-first cote client

## Bougnat Darts Counter ne contient pas

- backend metier
- authentification metier
- gestion riche des comptes
- profils persistants distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistance backend metier

## Frontiere produit

Le repo est publie comme une application open source de scoring stable en `v1.0.1`.

Le voice scoring reste un module optionnel: l application doit rester jouable en scorage manuel si Deepgram est indisponible.

Toute integration plus large avec un systeme maitre doit se faire :

- par contrats explicites
- sans fuite de logique proprietaire dans le domaine
- sans rendre le gameplay local dependant du reseau
- sans reintroduire de persistance metier distante dans ce repo

## Relation avec Bougnat_Darts_Tournaments

`Bougnat_darts_counter` est le client de scorage.

`Bougnat_Darts_Tournaments` est le futur systeme maitre metier pour :

- l orchestration tournoi
- les donnees proprietaires
- les profils distants
- les integrations backend explicites

La frontiere de release `v1.0.1` impose que cette relation reste contractuelle, sans dependance runtime obligatoire du gameplay local vers le systeme maitre.
