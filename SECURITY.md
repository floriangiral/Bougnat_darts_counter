# Politique de securite

Merci de nous aider a proteger Bougnat Darts Counter.

Ce depot est public. Merci de ne jamais publier de faille de securite sensible dans une issue, une discussion ou une pull request publique.

## Signaler une vulnerabilite

Canal recommande :

- utilisez le module GitHub `Report a vulnerability` du depot si le signalement prive GitHub est active

Canal de secours :

- contactez l equipe projet a l adresse `security_code@bougnatdarts.net`

Merci d inclure si possible :

- un titre court et explicite
- le type de faille presume
- l impact estime
- les etapes de reproduction
- le perimetre concerne
  - application web
  - moteur de scorage
  - persistence locale
  - assistance vocale
  - outillage CI
- des captures ou extraits utiles
- une proposition de correction si vous en avez une

## Delais de traitement

Objectifs de reponse :

- accuse de reception sous `3 jours ouvres`
- premiere qualification sous `7 jours ouvres`
- plan d action ou statut sous `14 jours ouvres`

Ces delais sont des objectifs, pas une garantie contractuelle.

## Regles de divulgation

Merci de :

- laisser le temps a l equipe de confirmer et corriger la faille
- eviter toute divulgation publique avant correctif ou validation explicite
- ne pas acceder a des donnees reelles au dela du strict necessaire a la demonstration
- ne pas perturber volontairement le service, les comptes ou l infrastructure

## Perimetre prioritaire

Les sujets consideres comme prioritaires incluent notamment :

- execution de code non prevue
- elevation de privilege
- fuite de secrets
- acces non autorise a des donnees locales ou a des sessions de jeu
- bypass des protections autour des flux sensibles
- faille exploitable dans les traitements vocaux ou les endpoints associes
- faille exploitable dans la chaine de build ou de CI

## Hors perimetre ou faible priorite

Sauf demonstration d un impact concret, les cas suivants sont generalement hors perimetre ou de priorite faible :

- problemes purement cosmetiques ou UX
- versions de dependances sans exploitabilite demontree
- alertes automatiques sans chemin d attaque verifiable
- recommandations generales sans preuve d impact

## Bonnes pratiques attendues

Le projet applique ou vise les principes suivants :

- aucune cle sensible exposee au frontend
- separation claire entre variables publiques et secrets
- stockage local resilient sans exposer d information sensible inutile
- checks automatises avant evolution du code
- logique metier testee et cloisonnee

## Versions supportees

Les correctifs de securite sont traites en priorite sur :

- `main`
- la release en cours

Les anciennes branches de travail ou versions non maintenues peuvent ne pas recevoir de correctif dedie.

## Merci

Les signalements responsables, clairs et reproductibles nous aident directement a ameliorer la securite du projet.
