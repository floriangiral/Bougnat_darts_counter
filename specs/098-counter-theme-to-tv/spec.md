---
id: 098-counter-theme-to-tv
v2_id: V2-BRAND-06
titre: Thème transmis à l'écran TV
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: perso
priorite: P2
difficulte: S
recommandation: recommande
lot: 4
poids: 30
depend_de: [V2-TV-02, V2-BRAND-01]
remplace: []
remplacee_par: []
issue: '#265'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 098 — Thème transmis à l'écran TV

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demandes V2 §5.6 × §5.7 : la TV d'un club ou d'un bar doit afficher les couleurs, le nom et le logo du lieu, avec la mention Bougnat Darts. Le rapport 05 (§4.4) fait du `ThemeDescriptor` le format pivot unique ; le rapport 07 (§5.3, §6.5) propose un message `branding` séparé du snapshot, envoyé rarement et référencé par empreinte, avec un plafond de 12 Ko. Le compte rendu (§C.7, risques) note l'écart entre le logo de l'éditeur (~100 Ko) et le plafond TV : il faut un **profil d'asset TV** distinct.

## 2. Problématique
Envoyer le thème complet à chaque mise à jour de score gaspillerait la bande passante (relais 087) et dépasserait le plafond des messages ; ne pas l'envoyer prive la TV de l'identité du lieu. La TV est en outre un destinataire de données non fiables (relais, autre appareil) et souvent un navigateur ancien (Samsung 2022 = Chromium 85).

## 3. Objectifs
- Transmettre le thème **une fois** par session (et à chaque changement), puis le référencer par empreinte.
- Borner le message (≤ 12 Ko) grâce à un profil de logo TV dédié.
- Revalider le thème côté TV avec les mêmes fonctions que le contrôleur.
- Indépendance au transport (fenêtre locale 085, relais distant 087).

## 4. État actuel vérifié dans le code
- [vérifié] Aucune diffusion TV n'existe : pas de `BroadcastChannel`, pas de WebSocket (recherche négative) ; `src/features/x01/session/useSharedX01Session.ts:11` et le type `SyncRepository = Record<string, never>` (`src/application/scoring/ports.ts:10`) sont des vestiges sans effet réseau (rapport 07 §2.1).
- [vérifié] Aucun thème ni logo n'existe (093, 095 à créer).
- [vérifié] CSP actuelle : `connect-src 'self' https://api.deepgram.com wss://api.deepgram.com https://cloudflareinsights.com` (`public/_headers:2`) ; un relais distant exigera une ouverture traitée par 087, pas par cette spec.
- [hypothèse, rapport 07 et revue croisée] Navigateurs TV : Samsung 2022 = Chromium 85, LG = Chromium 87 ; Tailwind 4 vise Chrome ≥ 111 (rapport 05 §2.7) → la vue TV aura une feuille conservatrice ; les valeurs de thème doivent être des hex pré-calculés [à confirmer sur TV réelles, 090].
- [hypothèse] Les noms des messages et champs du contrat TV seront fixés par 084 (V2-TV-02), en cours de rédaction : ceux ci-dessous sont indicatifs.

## 5. Comportement cible
Le contrôleur construit un message `branding` à partir du thème actif : descripteur validé (093) sans identifiant local + logo renormalisé au **profil TV** (095 `normalizeLogo(…, 'tv')`) + empreinte. Il l'envoie à l'ouverture de la diffusion, à chaque reconnexion d'un écran et à chaque changement de thème. Chaque snapshot (084) porte seulement `brandingHash`. La TV valide le message avec les mêmes fonctions, dérive les tokens pour son propre mode (sombre par défaut), les pose en variables CSS, met le logo en cache mémoire par empreinte et affiche la mention Bougnat dans sa zone fixe (097). Sans thème club, aucun message `branding` n'est envoyé et la TV affiche le thème officiel.

## 6. Périmètre
### Inclus
Message `branding` v1, profil de logo TV, référence par empreinte, revalidation côté TV, application des tokens en mode TV, cache, comportement sans thème, écran d'attente aux couleurs du lieu.
### Exclu
Transport (085, 087), appairage (088), mise en page TV (086, 089), mention (097, consommée), intermède publicitaire de toute sorte.

## 7. User stories
- En tant que gérant de bar, je veux que la TV affiche le logo et les couleurs du bar dès la diffusion lancée.
- En tant que spectateur, je veux des scores lisibles à 4 m quelle que soit la couleur du club.
- En tant que mainteneur, je veux qu'un message `branding` falsifié ne puisse rien injecter dans la TV.

## 8. Règles métier
- RM-01 Le thème est une **donnée JSON** ; jamais de CSS ni de HTML dans un message.
- RM-02 La TV revalide intégralement le message (liste blanche 093, logo via 095 profil TV) ; un message invalide est ignoré et la TV garde le thème officiel.
- RM-03 Le mode de la TV est indépendant de celui du contrôleur ; sombre par défaut (Q1).
- RM-04 Les couleurs de jeu restent réservées (066) ; objectif de contraste 7:1 pour les scores TV (093 FR-06).
- RM-05 La mention Bougnat est rendue par la TV elle-même (097) et ne dépend d'aucun champ du message.
- RM-06 Le message `branding` ne contient aucune donnée de partie ni de joueur.

## 9. Parcours utilisateurs
1. Le gérant a activé un thème club sur la tablette.
2. Il lance la diffusion (085 ou 087/088).
3. La TV affiche l'écran d'attente puis la partie aux couleurs du lieu, avec logo et mention.
4. Il change de thème en cours de soirée : la TV se met à jour à la prochaine émission, sans interrompre la partie.

## 10. Exigences fonctionnelles
- FR-01 Message `branding` v1 : `{ t: 'branding', v: 1, hash, theme: ThemeDescriptor (sans id local), logo?: { mime, w, h, data (base64) } }` ; taille sérialisée ≤ 12 Ko.
- FR-02 Profil de logo TV : plus grand côté ≤ 192 px [à valider en 1080p], WebP sinon PNG, ≤ 8 Ko ; si le plafond ne peut être tenu, le message part sans logo (nom du lieu seul) et le contrôleur affiche un avertissement.
- FR-03 `hash` = SHA-256 du contenu canonique (descripteur trié + octets du logo TV).
- FR-04 Les snapshots (084) portent `brandingHash` (ou `null` sans thème club) ; la TV demande ou attend le message correspondant si elle ne le connaît pas.
- FR-05 Émission : à l'ouverture de la diffusion, à chaque reconnexion d'écran, à chaque changement de thème actif ; jamais à chaque coup.
- FR-06 Côté TV : validation 093/095, dérivation pour le mode TV, pose des variables, cache mémoire par empreinte (≤ 3 entrées).
- FR-07 Écran d'attente TV aux couleurs du lieu (nom, logo) avec mention Bougnat (097).
- FR-08 Sans thème club ou thème invalide : thème officiel, aucun message d'erreur sur la TV (journal de diagnostic local seulement).

## 11. Exigences non fonctionnelles
- NFR-01 Compatibilité : application du thème sans `color-mix()`, oklch, `@property` ni `@layer` côté TV (valeurs hex pré-calculées) ; vérification sur Chromium 85 [à confirmer, 090].
- NFR-02 Performance : application du thème ≤ 50 ms sur TV [à mesurer] ; aucune réémission pendant le jeu.
- NFR-03 Trafic : 1 message `branding` par écran et par session (hors changement) ; impact sur le quota du relais négligeable.
- NFR-04 Confidentialité : nom du lieu et logo transitent en mémoire seulement (pas de stockage serveur, conforme à 087) ; pas de donnée personnelle.
- NFR-05 Coût récurrent : 0 € en local ; inclus dans le budget du relais (087) en distant.

## 12. Cas nominaux et alternatifs
- Nominal local (085) : fenêtre TV ouverte, message reçu, thème appliqué.
- Nominal distant (087) : TV appairée, message reçu après `hello`.
- Alternatif : logo trop lourd au profil TV → nom seul.
- Alternatif : changement de thème pendant une partie → mise à jour visuelle sans interruption.

## 13. Cas limites
- Snapshot reçu avant le message `branding` : rendu officiel puis bascule dès réception.
- Deux contrôleurs (onglets restaurés) avec des thèmes différents : la règle mono-écrivain de 084/087 s'applique, la TV suit l'émetteur autorisé.
- Thème désactivé sur le contrôleur : `brandingHash: null` → retour au thème officiel.
- TV sans prise en charge du WebP : logo PNG (profil TV) [à confirmer, 090].

## 14. Gestion des erreurs
Message invalide, trop gros ou d'une version inconnue : ignoré côté TV, compteur de diagnostic ; côté contrôleur, avertissement « Le logo n'a pas pu être envoyé à la TV » le cas échéant.

## 15. Impacts architecturaux
- Construction et validation du message : module pur partagé (`src/features/theming/tv/brandingMessage.ts`), utilisé par le contrôleur et la TV.
- Le transport (085/087) traite `branding` comme un message opaque.
- La vue TV dépend de `src/features/theming` (même `deriveThemeTokens`) et de `BrandMark` (097) ; aucune dépendance vers les règles de jeu.

## 16. Impacts sur les données et les interfaces
Ajout du type `branding` et du champ `brandingHash` au contrat TV (084) : à intégrer dans sa version 1 si possible, sinon ajout optionnel compatible.

## 17. Compatibilité avec l'existant
Aucun impact hors diffusion TV. Contrôleur sans thème club : comportement identique à la TV officielle.

## 18. Dépendances
Bloquantes : V2-TV-02 (084, contrat de projection), V2-BRAND-01 (093). Liées : V2-BRAND-03 (095, profil logo), V2-BRAND-05 (097), V2-TV-04 (085), V2-TV-05 (087), V2-TV-06 (086), V2-TV-11 (090, qualification TV), V2-DS-00 (018).

## 19. Critères d'acceptation
- AC-01 Diffusion locale avec thème club et logo : la TV affiche couleurs, nom et logo en ≤ 1 s après ouverture ; un seul message `branding` émis pendant une partie de 501 complète.
- AC-02 Message `branding` sérialisé ≤ 12 Ko pour chaque preset avec un logo de test de 100 Ko.
- AC-03 Message falsifié (couleur `url(x)`, propriété `css`, logo SVG, 13 Ko) : ignoré, TV au thème officiel, aucune exception.
- AC-04 Scores TV : contraste ≥ 7:1 pour chaque preset (test de matrice).
- AC-05 Changement de thème en cours de partie : TV mise à jour, partie non interrompue, aucun snapshot perdu.
- AC-06 Rendu correct sur un navigateur Chromium 85 (ou TV Samsung 2022) [à confirmer, 090].
- AC-07 La mention Bougnat est visible sur la TV avec et sans message `branding`.

## 20. Scénarios de tests
Unitaires (construction, empreinte, bornes, validation) ; composants TV (application des variables) ; E2E deux fenêtres (085) ; terrain (TV réelles, 090).

## 21. Exigences de non-régression
Contrat de snapshot (084) inchangé hors ajout de `brandingHash` ; performance de la TV.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Navigateur TV trop ancien | Élevé | Moyenne | Valeurs hex, feuille TV conservatrice, qualification 090 |
| Logo illisible à 192 px | Faible | Moyenne | Valider la taille sur maquette 1080p |
| Désynchronisation empreinte / message | Faible | Faible | Réémission à la reconnexion, repli officiel |

## 23. Décisions architecturales
Thème par message séparé référencé par empreinte (rapport 07 §5.3). À intégrer à l'ADR TV de 083 si celui-ci fige le protocole.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mode TV par défaut (H.17) | Sombre / hérité du contrôleur / `preferredMode` du thème | Sombre par défaut, `preferredMode` en suggestion | À prendre |
| Q2 | Taille du logo TV | 128 / 192 / 256 px | 192 px, à valider à 3-5 m | À prendre |
| Q3 | Cache côté TV | Mémoire seule / persistant (station TV fixe) | Mémoire seule en V2 | À prendre |
| Q4 | Intégration au contrat 084 | Dans la v1 / extension optionnelle | Dans la v1 si 084 n'est pas figée | À prendre |

## 25. Traçabilité
Rapport 05 §4.4, §6.5 ; rapport 07 §5.3, §6.5 ; compte rendu §C.6, §C.7, H.17. Specs liées : 083, 084, 085, 086, 087, 090, 093, 095, 097.
