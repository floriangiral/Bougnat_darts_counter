---
id: 085-counter-tv-local-window
v2_id: V2-TV-04
titre: TV locale (fenêtre secondaire, HDMI, hors ligne)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tv
priorite: P1
difficulte: M
recommandation: recommande
lot: 3
poids: 30
depend_de: [V2-TV-02]
remplace: []
remplacee_par: []
issue: '#257'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 085 — TV locale (fenêtre secondaire, HDMI, hors ligne)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Demande V2 (mission §5.6) : diffuser une partie sur un grand écran sans dupliquer l'interface de contrôle. Le rapport `07-tv-mode.md` (§4.3, §5.1) et le compte rendu (C.6, D.2) recommandent comme **MVP** une fenêtre secondaire sur le **même appareil** (ordinateur relié en HDMI, écran étendu) alimentée par `BroadcastChannel` : 0 €, hors ligne, aucune infrastructure. Cette spec **ne dépend pas** de l'étude 083 (V2-TV-01) ni d'une autorisation serveur : elle n'émet aucune requête réseau.

## 2. Problématique

Aujourd'hui, la seule façon d'afficher une partie sur une TV est la recopie d'écran (HDMI miroir, AirPlay, Cast d'écran) : la TV montre le clavier et les boutons, petits et inutiles aux spectateurs.

## 3. Objectifs

- Ouvrir un écran spectateur dédié en ≤ 3 étapes depuis une partie X01.
- Fonctionner hors ligne, sans compte, sans serveur, sans coût.
- Ne jamais ralentir ni bloquer la saisie.

## 4. État actuel vérifié dans le code

- [vérifié] Aucun usage de `BroadcastChannel`, `getScreenDetails` ni `navigator.presentation` dans `src`, `views`, `components`, `App.tsx`.
- [vérifié] Pas de routeur : l'écran courant est un état (`src/app/appShell.ts:10-25`), le mode d'accès vient de `?mode=` (`appShell.ts:93-107`) ; tous les écrans sont « scoring » (`appShell.ts:109-112`, spec 001).
- [vérifié] Point d'entrée unique `index.tsx` (`index.html:32`) ; la session est restaurée au démarrage (`App.tsx:106-110`).
- [vérifié] `enterFullScreen` gère les préfixes (`utils/uiUtils.ts:17-30`) et exige un geste utilisateur.
- [vérifié] Le Service Worker sert la navigation en network-first avec repli `/index.html` (`sw.js:42-54`) ; non servi en production selon la spec 031.
- [vérifié] CSP `connect-src` sans changement nécessaire : `BroadcastChannel` n'est pas une connexion réseau (`public/_headers:2`).
- [EXT, consulté le 2026-11-20] `BroadcastChannel` : Chrome 54+, Firefox 38+, Safari 15.4+ ; **même origine, même navigateur et même profil, donc même appareil seulement**. Window Management API : Chrome/Edge 100+ desktop uniquement.

## 5. Comportement cible

Depuis une partie X01, « Diffuser » → « Sur cet appareil (2e écran) » ouvre une fenêtre `/tv?local=1`. Cette fenêtre charge uniquement le module TV (pas Deepgram, pas le clavier), affiche un écran d'attente puis la partie dès réception du premier snapshot (084). Sur Chrome/Edge desktop avec permission, la fenêtre se place en plein écran sur l'écran externe ; ailleurs, une consigne « Glissez cette fenêtre sur la TV, puis touchez Plein écran » s'affiche.

## 6. Périmètre

### Inclus
- Adaptateur `LocalChannelPublisher` (contrôleur) et `LocalChannelSubscriber` (écran) sur le port de 084.
- Point d'entrée `/tv` léger, détecté avant la restauration de session.
- Commande « Diffuser » dans la barre de partie X01, indicateur d'état, « Arrêter la diffusion ».
- Mono-écrivain local, resynchronisation à l'ouverture et au rechargement de l'un ou l'autre côté.
- Placement automatique (Window Management API) en amélioration progressive.

### Exclu
- Écrans distants et appairage (087, 088), autres jeux (089), interface X01 détaillée (086, livrée conjointement), thème club (098), Presentation API et Cast (091).

## 7. User stories

- En tant que joueur à domicile avec un ordinateur relié à la TV, je veux afficher le score en grand sans Internet.
- En tant que club, je veux un écran spectateur sans clavier ni bouton, lisible depuis le pas de tir.

## 8. Règles métier

- RM-01 La fenêtre TV est en lecture seule : elle n'embarque aucun dispatcher de commande de jeu.
- RM-02 Un seul émetteur actif par canal : le plus récent (génération la plus élevée) l'emporte ; l'ancien cesse d'émettre et l'indique.
- RM-03 La diffusion est optionnelle et n'ajoute aucune étape au parcours de base.

## 9. Parcours utilisateurs

1. En partie X01, toucher l'icône « Diffuser » de la barre de partie.
2. Choisir « Sur cet appareil (2e écran) » → la fenêtre `/tv?local=1` s'ouvre (geste utilisateur).
3. Sur Chrome desktop : accepter la permission d'écrans → plein écran sur la TV. Ailleurs : glisser la fenêtre sur la TV et toucher « Plein écran ».

Revanche ou nouvelle partie X01 : la fenêtre reste ouverte et bascule automatiquement.

## 10. Exigences fonctionnelles

- FR-01 Canal `BroadcastChannel('bougnat-tv-local-v1')` ; messages : `snapshot` et `end` (084), `hello` (écran → contrôleur, demande de resynchronisation), `presence` (contrôleur, toutes les 10 s, gratuit en local).
- FR-02 Génération locale = horodatage en millisecondes de la prise du rôle émetteur ; l'écran ignore toute génération inférieure à la plus haute reçue.
- FR-03 À la réception d'une génération supérieure, un contrôleur émetteur cesse d'émettre et affiche « Diffusion reprise par une autre fenêtre ».
- FR-04 À l'ouverture de l'écran ou au rechargement du contrôleur, le dernier snapshot est (re)envoyé avec `cause: sync`.
- FR-05 Point d'entrée `/tv` : détection dans `index.tsx` avant toute restauration de session ; chargement à la demande du module TV ; aucun chunk voix ni clavier chargé.
- FR-06 Commande « Diffuser » visible uniquement en X01 tant que 089 n'est pas livrée ; masquée si `BroadcastChannel` est absent.
- FR-07 Indicateur dans la barre de partie : « TV ● » (écran présent), « TV ○ » (aucun écran depuis 15 s), action « Arrêter la diffusion » qui envoie `end` et ferme la fenêtre si elle a été ouverte par l'application.
- FR-08 Écran : états « En attente de la tablette », « Partie en cours », « Contrôleur absent depuis HH:MM » (aucune `presence` depuis 30 s, scores figés conservés), « Diffusion terminée ».
- FR-09 Écran : bouton « Plein écran » de grande taille au premier affichage ; curseur masqué après 3 s d'inactivité.
- FR-10 Amélioration progressive : si `getScreenDetails` existe, proposer le placement sur l'écran externe ; refus ou absence → consigne manuelle.
- FR-11 Drapeau `VITE_ENABLE_TV_LOCAL` (défaut à trancher) ajouté au contrat d'environnement (spec 009).

## 11. Exigences non fonctionnelles

- NFR-01 Hors ligne : fonctionne en mode avion après chargement initial (et après installation du SW, spec 031).
- NFR-02 Latence saisie → affichage < 300 ms p95 sur ordinateur portable milieu de gamme [à confirmer par mesure].
- NFR-03 Aucune requête réseau supplémentaire ; CSP inchangée ; coût récurrent 0 €.
- NFR-04 INP du contrôleur inchangé (spec 020) ; publication hors du chemin d'interaction.
- NFR-05 Chunk TV initial ≤ 60 Ko gzip [à confirmer, à fixer avec V2-PERF-01, 044].

## 12. Cas nominaux et alternatifs

- Ordinateur + HDMI en écran étendu (nominal).
- iPad avec Stage Manager et écran externe : fenêtre Safari déplaçable [à confirmer sur appareil].
- Chrome desktop : onglet TV « casté » vers un Chromecast (« Caster l'onglet ») : documenté comme complément sans développement.
- Écran de diffusion fermé par erreur : rouvrir via « Diffuser » ; resynchronisation immédiate.

## 13. Cas limites

- Application installée (PWA) : la fenêtre ouverte peut l'être dans un autre contexte de stockage (notamment iOS) et ne pas recevoir les messages [à confirmer] → détection par absence de `hello` en 3 s et message « Ouvrez la diffusion depuis le navigateur ».
- Bloqueur de fenêtres : message « Autorisez l'ouverture de fenêtre » et lien de repli.
- Deux onglets de contrôle restaurés : RM-02.
- Onglet contrôleur en arrière-plan : `presence` ralentie par le navigateur ; seuil de 30 s volontairement large.
- Écran de diffusion d'une version antérieure (cache) : schéma non supporté → « Rechargez cet écran ».

## 14. Gestion des erreurs

Échec de `postMessage` ou de projection : journalisé au niveau `warn`, indicateur « TV ! », saisie non affectée. Message reçu invalide : ignoré par l'écran (validateur 084).

## 15. Impacts architecturaux

Adaptateurs `src/infrastructure/broadcast/LocalChannelPublisher.ts` et `LocalChannelSubscriber.ts` implémentant les ports de 084 ; module d'entrée `src/tv/` (ou `src/features/tv/`) isolé du shell de contrôle ; aucune dépendance de `domain`/`application` vers `BroadcastChannel`.

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée côté contrôleur. Écran : aucune persistance (l'état vit en mémoire). Nouveau point d'entrée `/tv?local=1`.

## 17. Compatibilité avec l'existant

Parcours X01 inchangé hors l'icône « Diffuser ». Modes d'accès (spec 001, V2-ARCH-12) : la route `/tv` est une surface « affichage » hors `AppScreen`, à mentionner dans la révision de 001. SW (031) : `/tv` couvert par le repli SPA ; aucune mise à jour forcée pendant une diffusion.

## 18. Dépendances

- V2-TV-02 (084) : contrat et projection.
- Livraison conjointe recommandée avec V2-TV-06 (086) pour l'interface X01.
- **Aucune dépendance** à V2-TV-01 (083) : pas de serveur.
- Liens : 018 (V2-DS-00, baseline), 031 (SW), 001 (surface affichage), 009 (variable d'environnement).

## 19. Critères d'acceptation

- AC-01 Chrome desktop, partie X01 en cours, « Diffuser → Sur cet appareil » → fenêtre `/tv?local=1` affichant la partie en < 2 s ; aucune requête réseau émise (onglet Réseau).
- AC-02 Mode avion, 180 validé sur le contrôleur → affichage mis à jour en < 300 ms.
- AC-03 Rechargement du contrôleur en cours de partie → l'écran affiche l'état restauré sans action.
- AC-04 Deux onglets de contrôle → l'écran suit le plus récent ; l'ancien affiche « Diffusion reprise par une autre fenêtre ».
- AC-05 Contrôleur fermé → après 30 s, l'écran affiche « Contrôleur absent depuis HH:MM » avec les derniers scores.
- AC-06 Ouverture de `/tv?local=1` → aucun chunk voix ni clavier chargé (vérification des requêtes de modules).
- AC-07 Navigateur sans `BroadcastChannel` (simulé) → commande « Diffuser » masquée.
- AC-08 « Arrêter la diffusion » → l'écran affiche « Diffusion terminée » puis se ferme s'il a été ouvert par l'application.

## 20. Scénarios de tests

- Unitaires : adaptateurs avec un `BroadcastChannel` simulé (génération, `hello`, `presence`, `end`).
- E2E Playwright (Chromium, WebKit) : deux pages du même contexte, saisie puis assertion sur la page TV ; rechargement ; deux contrôleurs ; mode hors ligne (`context.setOffline`).
- Terrain : ordinateur + HDMI, iPad Stage Manager [à confirmer] (spec 090).

## 21. Exigences de non-régression

Parcours de base et E2E X01 inchangés ; aucun ajout dans `connect-src` ; INP mesuré avant/après.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| PWA installée isolée du navigateur | Moyen | Moyenne | Détection + message, doc |
| Usage limité aux ordinateurs | Moyen | Haute | Assumé (MVP) ; écrans distants via 087 |
| Rendu TV dépendant de Tailwind 4 | Faible ici (navigateur desktop récent) | Faible | CSS TV de 086 |

## 23. Décisions architecturales

ADR 0005 « Projection spectateur et transport » : adaptateur local du port de diffusion, mono-écrivain par génération.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Activation par défaut | `VITE_ENABLE_TV_LOCAL=true` / désactivé | Activé (aucun coût, aucun réseau) | — |
| 2 | Placement de la commande | Barre de partie / réglages de partie | Barre de partie (icône TV) | — |
| 3 | Window Management API | Inclure / reporter à 091 | Inclure en amélioration progressive | — |
| 4 | Pause (H.19) | Commande « Mettre la TV en pause » / non | Reporter, contrat prêt (`cause: pause`) | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §4.3, §5.1, §6.1-6.2 ; compte rendu C.6, D.2 (« Principal (MVP) »), G (Lot 3 : « la TV locale n'attend pas le relais »). Revue croisée : `BroadcastChannel` = même navigateur/appareil seulement ; TV locale indépendante de V2-TV-01. Specs : 084, 086, 083, 087, 090, 018, 031, 001, 009, 020.
