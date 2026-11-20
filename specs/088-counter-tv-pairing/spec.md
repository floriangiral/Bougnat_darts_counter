---
id: 088-counter-tv-pairing
v2_id: V2-TV-07
titre: Appairage TV par code court ou QR
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tv
priorite: P2
difficulte: M
recommandation: recommande
lot: 3
poids: 20
depend_de: [V2-TV-05, V2-QR-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 088 — Appairage TV par code court ou QR

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.
>
> Conditionnée au relais 087 (V2-TV-05), lui-même conditionné à la décision de l'étude 083 (V2-TV-01).

## 1. Origine et contexte

La mission (§5.6) demande « l'association rapide d'un écran », « la reconnexion automatique », « la durée de vie des liens » et « la gestion des sessions sans compte ». Le rapport `07-tv-mode.md` (§5.4, §6.1) recommande un parcours **« TV d'abord »** : la TV affiche un code court, la tablette le saisit. Une TV ne scanne pas de QR ; le QR et le lien servent aux appareils dotés d'une caméra ou d'un clavier.

## 2. Problématique

Saisir une longue URL à la télécommande est pénible ; un QR affiché par la tablette ne peut pas être lu par une TV ; sur iOS, un QR scanné ouvre Safari, dont le stockage est séparé de l'application installée (`specs/030-counter-external-match-link/spec.md:107`).

## 3. Objectifs

- Appairer une TV en ≤ 3 étapes, sans compte.
- Enchaîner revanches et nouvelles parties sans nouvel appairage pendant la soirée.
- Reconnecter automatiquement la TV après une veille, un rechargement ou une coupure.

## 4. État actuel vérifié dans le code

- [vérifié] Aucun parcours d'appairage ni écran `/tv`.
- [vérifié] `qrcode` est une dépendance de production (`package.json:34`) utilisée **au build** seulement (`scripts/generate-app-qr.mjs`) pour `public/app-qr.svg`, affiché par `views/HomeView.tsx:44` ; aucun QR généré à l'exécution (objet de V2-QR-01, 092).
- [vérifié] Identifiants aléatoires : `src/shared/ids/createId.ts:15` ; TTL de 12 h déjà utilisé pour le contexte de match externe (`src/features/external-match/externalMatchLink.ts:61`).
- [vérifié] Spec 030 : un QR sur iOS ouvre Safari, stockage séparé de l'application installée (`specs/030-counter-external-match-link/spec.md:107`).

## 5. Comportement cible

La TV ouvre `/tv` (une fois, puis favori ou page d'accueil) et affiche un code de 6 caractères. Sur la tablette, « Diffuser » → « Sur un écran (code) » → saisie du code → « Connecté ». La TV reçoit un jeton de lecture, le mémorise et bascule sur la partie. Tant que la session de diffusion vit (12 h glissantes), toute nouvelle partie s'affiche sur la même TV.

## 6. Périmètre

### Inclus
- Écran d'attente TV avec code, renouvellement du code, état « Connecté ».
- Saisie du code côté contrôleur, liste des écrans appairés, « Oublier cet écran », « Changer le lien », « Arrêter la diffusion ».
- Remise du jeton de lecture par le relais (DO d'appairage à usage unique).
- Lien et QR lecture seule pour un appareil doté d'une caméra ou d'un clavier.
- Reconnexion automatique de la TV.

### Exclu
- Relais de diffusion (087), spectateurs publics et multi-écrans (091), mode local (085), thème de l'écran d'attente (098).

## 7. User stories

- En tant que club, je veux associer la TV une fois par soirée et enchaîner les parties.
- En tant que joueur, je veux qu'une TV sortie de veille retrouve seule la partie.
- En tant que propriétaire de la TV, je ne veux pas qu'un inconnu y affiche sa partie sans voir le code à l'écran.

## 8. Règles métier

- RM-01 Le code est affiché par la TV et saisi sur le contrôleur, jamais l'inverse.
- RM-02 Un code est valable 10 min et une seule fois ; il est renouvelé automatiquement.
- RM-03 La TV ne reçoit qu'un jeton de **lecture** ; le jeton d'émission ne quitte jamais le contrôleur.
- RM-04 Une session de diffusion survit aux revanches et aux nouvelles parties ; elle expire 12 h après la dernière activité ou sur « Arrêter la diffusion ».

## 9. Parcours utilisateurs

**TV d'abord (nominal, 3 étapes)**
1. Sur la TV : ouvrir `play.bougnatdarts.fr/tv` (favori) → code `K7M-4QX` et consigne « Sur la tablette : Diffuser, puis saisir ce code ».
2. Sur la tablette, en partie : « Diffuser » → « Sur un écran (code) ».
3. Saisir le code → « Connecté à l'écran » ; la TV affiche la partie.

**Lien ou QR (secondaire)** : « Diffuser » → « Ouvrir sur un autre appareil » → QR et lien `/tv#r=…&v=…` (fragment non transmis au serveur), copiables.

**Revanche** : aucune étape. **TV redémarrée** : reconnexion automatique, sinon nouveau code.

## 10. Exigences fonctionnelles

- FR-01 Code de 6 caractères dans un alphabet de 31 symboles sans ambiguïté (sans 0, O, 1, I, L), affiché `XXX-XXX`, ≈ 29,7 bits ; saisie insensible à la casse et aux tirets.
- FR-02 La TV ouvre une WebSocket d'attente vers `/api/tv/pairing` ; le Worker attribue un code libre et le DO d'appairage correspondant garde la socket en hibernation.
- FR-03 Le contrôleur envoie `claim { code, roomKey, viewerToken }` ; le DO d'appairage transmet `{ roomKey, viewerToken }` à la TV, ferme la socket et s'efface (usage unique).
- FR-04 Échecs : code inconnu ou expiré → « Code introuvable, vérifiez l'écran » ; au plus 10 tentatives par minute et par adresse IP [à confirmer : outil de limitation global].
- FR-05 La TV mémorise `{ roomKey, viewerToken, screenId }` dans son stockage local et se reconnecte au démarrage ; échec (salle expirée, jeton révoqué) → nouvel écran de code.
- FR-06 Le contrôleur mémorise la session de diffusion et la liste des écrans appairés (libellé, date) avec les jetons (087, FR-10) ; restauration après rechargement.
- FR-07 « Changer le lien » génère un nouveau jeton de lecture, déconnecte les anciens écrans (4003) et invite à ré-appairer.
- FR-08 « Arrêter la diffusion » envoie `end` ; la TV revient à l'écran de code.
- FR-09 QR généré à la demande par le module de V2-QR-01 (092), chargé en différé ; jamais de jeton d'émission dans un QR ou un lien.
- FR-10 `/tv` sans relais disponible (kill switch, décision 083 négative) → message « Diffusion distante indisponible » et renvoi vers la diffusion sur cet appareil (085).

## 11. Exigences non fonctionnelles

- NFR-01 Parcours nominal mesuré ≤ 3 étapes et ≤ 30 s pour un utilisateur novice [à confirmer en test utilisateur].
- NFR-02 Code lisible à 4 m : hauteur ≥ 12 % de l'écran, contraste ≥ 7:1.
- NFR-03 Sécurité : codes à usage unique, expiration 10 min, limitation des tentatives ; probabilité de deviner un code actif < 10⁻⁵ par tentative pour 1 000 codes actifs.
- NFR-04 Coût : ≤ 3 requêtes DO par appairage ; aucune écriture de stockage.
- NFR-05 Confidentialité : le libellé d'écran est local au contrôleur, aucun identifiant matériel collecté.

## 12. Cas nominaux et alternatifs

Appairage d'une TV ; appairage d'une seconde TV (nouveau code, même session) ; ouverture du lien sur un PC relié à la TV ; reprise après rechargement du contrôleur (nouvelle génération, 087).

## 13. Cas limites

- Code saisi après expiration : refus, la TV a déjà affiché un nouveau code.
- Deux contrôleurs saisissent le même code : le premier gagne, le second reçoit « Code déjà utilisé ».
- TV en veille au-delà de 12 h : session expirée, nouvel appairage.
- Lien ouvert dans Safari depuis un QR sur iOS : fonctionne en lecture (aucun besoin du stockage de l'application installée).
- Stockage local de la TV indisponible (navigation privée) : appairage valable jusqu'au rechargement.

## 14. Gestion des erreurs

Relais indisponible pendant l'attente : la TV réessaie (délais 1 à 30 s) et affiche « Connexion au service… » ; jamais d'écran blanc. Côté contrôleur : erreurs explicites, saisie de partie jamais bloquée.

## 15. Impacts architecturaux

Classe DO `PairingSlot` dans le Worker de 087 ; Function `/api/tv/pairing*` ; composants contrôleur dans `src/features/broadcast/` ; écran d'attente dans `src/tv/`. Aucune dépendance de `domain`/`application`.

## 16. Impacts sur les données et les interfaces

Contrôleur : `broadcastSession.pairedScreens[] { screenId, label, pairedAt }`. TV : `localStorage['bougnat-tv-pairing'] = { roomKey, viewerToken, screenId }`. Contrat `/api/tv/pairing` versionné avec 084.

## 17. Compatibilité avec l'existant

Parcours de base inchangé ; QR de l'accueil (`public/app-qr.svg`) inchangé ; spec 030 inchangée.

## 18. Dépendances

- V2-TV-05 (087) : relais, jetons — **bloquant**.
- V2-QR-01 (092) : générateur de QR côté client.
- Liens : 083 (décision), 085 (repli local), 086 (écran), 091 (multi-écrans), 098 (thème de l'écran d'attente), 037 (guide).

## 19. Critères d'acceptation

- AC-01 TV ouverte sur `/tv`, tablette en partie X01 : code saisi → la TV affiche la partie en < 3 s ; 3 étapes comptées.
- AC-02 Code utilisé une fois → seconde saisie refusée « Code déjà utilisé ».
- AC-03 Code de plus de 10 min → refusé ; la TV affiche un nouveau code.
- AC-04 Revanche lancée → la TV affiche la nouvelle partie sans action.
- AC-05 TV rechargée → reconnexion automatique en < 5 s sans saisie.
- AC-06 « Changer le lien » → TV déconnectée et revenue à l'écran de code.
- AC-07 QR et lien ne contiennent ni `publisherToken` ni `roomKey` lisible en clair dans un paramètre de requête (fragment uniquement).
- AC-08 Relais désactivé → `/tv` affiche « Diffusion distante indisponible » et le lien vers la diffusion sur cet appareil.

## 20. Scénarios de tests

Miniflare : `PairingSlot` (usage unique, expiration, concurrence) ; unitaires : normalisation du code, alphabet ; E2E deux contextes (TV et tablette) contre `wrangler dev` ; test utilisateur novice (NFR-01) ; terrain : 090.

## 21. Exigences de non-régression

Parcours de base et mode local 085 ; QR d'accueil ; E2E existants.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Saisie d'URL à la télécommande | Moyen | Haute | Favori, URL courte, doc |
| Squat de code | Faible | Faible | Usage unique, 10 min, limitation |
| Jeton de lecture copié depuis la TV | Faible | Faible | Lecture seule, renouvellement, TTL |
| Limitation globale par IP indisponible | Faible | Moyenne | Espace de codes large, expiration courte |

## 23. Décisions architecturales

ADR 0005 (jetons distincts lecture/émission, sessions sans compte, TTL).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Mode principal (rapport §9.5) | Code affiché par la TV / QR affiché par la tablette | Code affiché par la TV | — |
| 2 | Durées (rapport §9.7) | Session 12 h glissantes, code 10 min / autres | 12 h et 10 min | — |
| 3 | Nombre de TV appairées par session | 1 / 3 / 20 | 3 en V2, extension étudiée en 091 | — |
| 4 | Nom d'écran | Libellé saisi / automatique « Écran 4QX » | Automatique, renommable | — |
| 5 | URL courte | `/tv` / sous-domaine `tv.` | `/tv` (aucun DNS supplémentaire) | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §5.4, §6.1, §6.2, §9.5-9.7 ; compte rendu C.6, F.5. Specs : 083, 087, 092, 085, 086, 091, 098, 030, 037.
