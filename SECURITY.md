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

## Controles automatises

Les pull requests vers `main` sont controlees par plusieurs outils complementaires :

- CodeQL pour les vulnerabilites et les flux de donnees JavaScript/TypeScript ;
- Gitleaks pour la detection de secrets dans le depot ;
- `npm audit` et Dependency Review pour les dependances npm modifiees et l arbre complet ;
- Snyk pour une seconde analyse des dependances, bloquante a partir du niveau `high` ;
- SonarCloud pour la qualite du New Code, la couverture, la duplication et les hotspots.

Les tokens `SONAR_TOKEN` et `SNYK_TOKEN` sont des secrets GitHub Actions au niveau du depot. Ils ne doivent jamais etre places dans Cloudflare Pages, une variable `VITE_*`, un fichier `.env` committe ou le bundle frontend.

La CI execute egalement une analyse SonarCloud globale sur `main` apres merge et chaque semaine. Les issues historiques SonarCloud sont suivies dans SonarCloud et traitees par lots ; elles ne sont pas dupliquees automatiquement dans GitHub Issues.

## Versions supportees

Les correctifs de securite sont traites en priorite sur :

- `main`
- la release en cours

Les anciennes branches de travail ou versions non maintenues peuvent ne pas recevoir de correctif dedie.

## Merci

Les signalements responsables, clairs et reproductibles nous aident directement a ameliorer la securite du projet.
