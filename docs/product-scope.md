# Product Scope

> État de la branche au 2026-11-27 : version `2.2.0` en préparation sur `release/v2.2.0`, non publiée et non promue ([notes](release/v2.2.0.md)). La GitHub Release publiée reste la `2.1.0` et la production la `1.1.4` ; la `2.0.0` n'a jamais été publiée. Les propositions non validées restent dans la [feuille de route V2](roadmap-v2.md).

## Bougnat Darts Counter contient

- moteur de scoring
- jeux de flechettes supportes
- UI de scorage
- voice scoring `X01` (désactivé par défaut, activable dans les Réglages ; touche « Trop de score » sans voix, spec [131](../specs/131-counter-x01-bust-voice-default/spec.md))
- sessions locales
- reprise locale de la partie en cours pour tous les jeux (spec [010](../specs/010-counter-offline-session-recovery-guarantees/spec.md))
- historique local enregistré sur l'appareil (pas encore consultable : spec [101](../specs/101-counter-my-games-history/spec.md))
- base offline-first cote client
- lien de match externe `X01` optionnel (`v2.0.0`) : match ouvert par lien, setup verrouille, resultat renvoye par navigation ; 2 a 4 joueurs en simple et classement final (`rankN`, `places`) a 3 ou 4 joueurs (spec 132)
- présentation adaptative téléphone / tablette / ordinateur (tablette portrait de référence, arène en tablette paysage tactile, invite non bloquante sur téléphone en paysage) et thème Auto / Sombre / Clair mémorisé sur l'appareil (`v2.0.0`, specs [070](../specs/070-counter-size-class-resolver/spec.md) à [072](../specs/072-counter-arena-layout/spec.md), [068](../specs/068-counter-light-mode/spec.md), [069](../specs/069-counter-theme-preference/spec.md))
- page Réglages : préférences de l'appareil (apparence, aides X01, raccourcis) (`v2.0.0`, spec [129](../specs/129-counter-settings-screen/spec.md))
- partie rapide `X01` par défaut et limite de volées par manche avec départage au bull (`v2.1.0`, hors spec, voir [specifications](specifications.md))
- version `2.2.0` en préparation : dernier format de partie rapide à deux, positions fixes X01 à 3 ou 4 joueurs, ordre complet et classement à plusieurs hors Triathlon, places jouées en Cricket et Gotcha, progression solo du 180 Around the Clock (specs [133](../specs/133-counter-x01-quick-last-format/spec.md), [132](../specs/132-counter-x01-order-and-placements/spec.md), [136](../specs/136-counter-multiplayer-rankings/spec.md), [130](../specs/130-counter-180-around-the-clock/spec.md))

## Bougnat Darts Counter ne contient pas

- backend metier
- authentification metier
- gestion riche des comptes
- profils persistants distants
- statistiques cloud consolidees
- logique tournoi avancee
- orchestration organisateur
- persistance backend metier

## Jeux supportes en v2.x

- **X01** (partie rapide 501 par défaut ; 301, 701 ou score personnalisé de 2 à 2501 — Legs ou Sets, Open/Double/Master In et Out, simple de 1 à 4 joueurs (à 3 ou 4 : ordre de passage obligatoire et places jouables après la victoire, spec [132](../specs/132-counter-x01-order-and-placements/spec.md)) ou doublettes, limite de volées par manche optionnelle, adversaire robot — tirage probabiliste calibré par niveau, pas une IA)
- **Cricket**
- **Capital**
- **Triathlon**
- **Killer**
- **Gotcha**
- **180 Around the Clock** (1 à 4 joueurs, sans variante, spec 130)

## Frontiere produit

Le repo est aligne comme une application open source de scoring stable en `v2.x`.

Cette release couvre le gameplay local, le scoring, les jeux supportes, le voice scoring optionnel, les sessions locales, la logique offline-first et le lien de match externe optionnel.

Le lien de match externe ([spec 030](../specs/030-counter-external-match-link/spec.md)) est un contrat d URL versionne : il ne contient aucune logique tournoi, n ajoute aucun appel reseau et reste desactive tant qu aucun site partenaire n est declare (la configuration livree declare `https://badarts.fr`). La validation du resultat recu reste a la charge du partenaire.

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

La frontiere de release `v2.x` impose que cette relation reste contractuelle, sans dependance runtime obligatoire du gameplay local vers le systeme maitre. Le lien de match externe est le point de contact prevu : le systeme maitre ouvre un match par lien et recoit le resultat par son URL de retour.
