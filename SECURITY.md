# Politique de securite

Merci de nous aider a proteger Bougnat Darts.

Ce depot est public. Merci de ne jamais publier de faille de securite sensible dans une issue, une discussion ou une pull request publique.

## Signaler une vulnerabilite

Canal recommande :

- utilisez le module GitHub `Report a vulnerability` de ce depot si le signalement prive GitHub est active

Canal de secours :

- contactez l'equipe projet a l'adresse `security_code@bougnatdarts.net`

Merci d'inclure si possible :

- un titre court et explicite
- le type de faille presume
- l'impact estime
- les etapes de reproduction
- le perimetre concerne
  - frontend
  - GitHub Actions
  - Vercel
  - Supabase
- des captures ou extraits utiles
- une proposition de correction si vous en avez une

## Delais de traitement

Objectifs de reponse :

- accuse de reception sous `3 jours ouvres`
- premiere qualification sous `7 jours ouvres`
- plan d'action ou statut sous `14 jours ouvres`

Ces delais sont des objectifs, pas une garantie contractuelle.

## Regles de divulgation

Merci de :

- laisser le temps a l'equipe de confirmer et corriger la faille
- eviter toute divulgation publique avant correctif ou validation explicite
- ne pas acceder a des donnees reelles au-dela du strict necessaire a la demonstration
- ne pas perturber volontairement le service, les comptes ou l'infrastructure

## Perimetre prioritaire

Les sujets consideres comme prioritaires incluent notamment :

- contournement de l'authentification
- mauvaise configuration Supabase ou fuite de donnees via RLS
- exposition de secrets dans GitHub Actions, Vercel ou le frontend
- elevation de privilege
- acces non autorise a des profils, lobbies, invitations ou sessions partagees
- injection ou execution non prevue via les workflows CI/CD

## Hors perimetre ou faible priorite

Sauf demonstration d'un impact concret, les cas suivants sont generalement hors perimetre ou de priorite faible :

- presence de la `VITE_SUPABASE_ANON_KEY` dans le bundle frontend
- problemes purement cosmetiques ou UX
- versions de dependances sans exploitabilite demontree
- alertes automatiques sans chemin d'attaque verifiable
- rate limiting ou anti-spam perfectibles sans abus concret

## Bonnes pratiques attendues

Le projet applique ou vise les principes suivants :

- aucune cle sensible exposee au frontend
- usage exclusif de variables publiques `VITE_*` cote client
- service role Supabase reserve au serveur ou a l'outillage CI controle
- RLS active sur les tables sensibles
- separation des environnements local, preprod et production
- previews Vercel protegees
- checks CI obligatoires avant promotion

## Versions supportees

Les correctifs de securite sont traites en priorite sur :

- la branche `main`
- la release en cours dans `release/*`
- les environnements actifs `preprod` et `production`

Les anciennes branches de travail, hotfix historiques ou versions non deployees peuvent ne pas recevoir de correctif dedie.

## Merci

Les signalements responsables, clairs et reproductibles nous aident directement a ameliorer la securite du projet.
