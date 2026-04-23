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

Le repo est publie comme une application open source de scoring.

Toute integration plus large avec un systeme maitre doit se faire :

- par contrats explicites
- sans fuite de logique proprietaire dans le domaine
- sans rendre le gameplay local dependant du reseau
