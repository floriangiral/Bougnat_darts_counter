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
- inscription / connexion utilisateur pour le mode connecte
- selection et scorage de matchs de tournoi fournis par le hub
- soumission contractuelle des resultats tournoi au backend Bougnat Darts

## Bougnat Darts Counter ne contient pas

- implementation du backend metier
- gestion riche des comptes
- profils persistants distants
- statistiques cloud consolidees
- orchestration organisateur avancee
- persistance backend metier

## Jeux supportes en v1.1

- **X01** (501, 301, 701 — Legs ou Sets, Single/Double/Master Out, mode bot IA)
- **Cricket**
- **Capital**
- **Triathlon**
- **Killer**
- **Gotcha**

## Frontiere produit

Le repo est aligne comme une application open source de scoring stable en `v1.1`.

Cette release stable couvre uniquement le gameplay local, le scoring, les jeux supportes, le voice scoring optionnel, les sessions locales et la logique offline-first.

L evolution majeure suivante integre le counter au hub `Bougnat_Darts_Tournaments` pour deux parcours connectes : inscription / connexion utilisateur et scorage de matchs de tournoi.

Le voice scoring reste un module optionnel: l application doit rester jouable en scorage manuel si Deepgram est indisponible.

Toute integration plus large avec un systeme maitre doit se faire :

- par contrats explicites
- sans fuite de logique proprietaire dans le domaine
- sans rendre le gameplay local dependant du reseau
- sans faire du counter la source de verite des comptes ou des tournois

## Relation avec Bougnat_Darts_Tournaments

`Bougnat_darts_counter` est le client de scorage.

`Bougnat_Darts_Tournaments` est le systeme maitre metier pour :

- l orchestration tournoi
- les donnees proprietaires
- les profils distants
- les integrations backend explicites

La frontiere de release `v1.1` imposait que cette relation reste contractuelle, sans dependance runtime obligatoire du gameplay local vers le systeme maitre.

La spec `spec:counter/hub-auth-tournament-scoring` ouvre maintenant le mode connecte. Le backend Bougnat Darts est accessible via :

- dev: `http://localhost:8080`
- preprod: `https://bougnat-darts-develop.fly.dev`
- production: `https://api.bougnatdarts.fr`

Le mode local reste disponible sans compte et sans reseau.
