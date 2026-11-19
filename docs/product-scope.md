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
- lien de match externe `X01` optionnel (`v2.0.0`) : match ouvert par lien, setup verrouille, resultat renvoye par navigation

## Bougnat Darts Counter ne contient pas

- backend metier
- authentification metier
- gestion riche des comptes
- profils persistants distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistance backend metier

## Jeux supportes en v2.0

- **X01** (501, 301, 701 — Legs ou Sets, Single/Double/Master Out, mode bot IA)
- **Cricket**
- **Capital**
- **Triathlon**
- **Killer**
- **Gotcha**

## Frontiere produit

Le repo est aligne comme une application open source de scoring stable en `v2.0`.

Cette release couvre le gameplay local, le scoring, les jeux supportes, le voice scoring optionnel, les sessions locales, la logique offline-first et le lien de match externe optionnel.

Le lien de match externe ([spec 030](../specs/030-counter-external-match-link/spec.md)) est un contrat d URL versionne : il ne contient aucune logique tournoi, n ajoute aucun appel reseau et reste desactive tant qu aucun site partenaire n est declare. La validation du resultat recu reste a la charge du partenaire.

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

La frontiere de release `v2.0` impose que cette relation reste contractuelle, sans dependance runtime obligatoire du gameplay local vers le systeme maitre. Le lien de match externe est le point de contact prevu : le systeme maitre ouvre un match par lien et recoit le resultat par son URL de retour.
