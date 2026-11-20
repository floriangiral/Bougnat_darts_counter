---
id: 100-counter-station-one-scan
v2_id: V2-STATION-01
titre: « Station en un scan » — configuration de lieu par QR
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: perso
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-BRAND-04, V2-QR-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 100 — « Station en un scan » : configuration de lieu par QR

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Proposition d'innovation INNO-05 (rapport 09), classée 5ᵉ et candidate « signature » (compte rendu §E, H.13). Un club ou un bar compose **une fois**, sans compte, la configuration de son lieu (nom, couleurs, jeux mis en avant, réglages par défaut, écran allumé) ; Bougnat Darts produit un **lien/QR de configuration** qui configure une tablette en un scan, et une **affiche imprimable** aux couleurs du lieu. Équivalent gratuit et sans compte d'offres « lieu » payantes (The Darts App, 199 $/an, rapport 09 [EXT]). Garde-fou du rapport 09 : toutes les fonctions « lieu » passent par une **entrée distincte**, jamais par des étapes supplémentaires dans « Lancer une partie ».

## 2. Problématique
Sans compte ni serveur, il n'existe aucun moyen de déployer ou de restaurer l'identité et les réglages d'un lieu sur plusieurs tablettes ; chaque appareil doit être réglé à la main, et une tablette posée près de la cible peut se mettre en veille.

## 3. Objectifs
- Configurer une nouvelle tablette en moins de 10 secondes, en un scan et une confirmation.
- Produire une affiche A4 aux couleurs du lieu, avec mention Bougnat Darts.
- Rester réversible en un geste et sans effet sur le parcours de base.
- 0 € de coût récurrent, aucun serveur.

## 4. État actuel vérifié dans le code
- [vérifié] Ordre des jeux codé en dur : `GAME_DISPLAY_ORDER` (`views/GameSelectionView.tsx:21-28`) ; `GameType` = 6 jeux (`utils/arenaFlow.ts:1`).
- [vérifié] Réglages initiaux du setup codés en dur : 501, manches, 3 manches gagnantes, sortie Double, entrée Open (`src/features/game-setup/setupModel.ts:68-80`) ; `InOutRule` = `Open | Double | Master` (`types.ts:2`). L'ouverture Double/Master n'est pas appliquée par le moteur (V2-GAMES-02, 046).
- [vérifié] Aucun Wake Lock, aucun `BroadcastChannel`, aucun `navigator.share` (recherche négative).
- [vérifié] Une affiche statique existe déjà : `public/Affiche_Bougnat_Darts_scorer.png`, référencée par `README.md:86` (QR vers l'application) ; aucune feuille d'impression dans `src/styles/tailwind.css` (aucun `@media print`).
- [vérifié] Le lien de match externe (030) démontre un contrat d'URL versionné et validé (`src/features/external-match/externalMatchLink.ts:49`) et verrouille le setup quand il est actif.
- [vérifié] Sur iOS/iPadOS, un QR scanné s'ouvre dans Safari, dont le stockage est séparé de l'application installée (`specs/030-counter-external-match-link/spec.md:107`).
- [vérifié, calcul] Un lien de station d'environ 284 caractères (nom, couleurs, 3 jeux, réglages X01) donne un QR version 12 au niveau M (65×65 modules).

## 5. Comportement cible
Une entrée secondaire « Préparer une station (clubs et bars) » ouvre un écran qui regroupe : thème du lieu (094, couleurs et nom), jeux mis en avant, réglages par défaut X01, préférence « écran toujours allumé pendant les parties ». Deux sorties :
1. **Fiche de configuration** (personnel) : QR + lien `#station=1.<base64url>` pour configurer d'autres tablettes ;
2. **Affiche « Jouez ici »** (public) : page imprimable A4 aux couleurs du lieu, logo si présent sur l'appareil, QR **de thème** (096) ou de l'application, mention Bougnat Darts.
À la réception d'un lien de station, une carte de confirmation liste précisément ce qui va changer ; rien n'est appliqué sans accord. Une station configurée affiche un indicateur discret « Station : {lieu} » et « Retirer la configuration de station » dans l'entrée secondaire.

## 6. Périmètre
### Inclus
Contrat de lien `station` v1, écran de préparation, fiche de configuration (QR + lien), affiche imprimable, réception avec confirmation, stockage local, application des préférences (thème, ordre des jeux, réglages par défaut), Wake Lock pendant les parties, retrait de la configuration.
### Exclu
Logo dans le lien ou le QR (fichier de thème 096), appairage TV persistant (088), caller vocal (préférence réservée, Q4), défis du comptoir et soirées (V2-GAMES-24/25), gestion de flotte, serveur, mode kiosque verrouillé (031 / système d'exploitation).

## 7. User stories
- En tant que gérant du « Café de la Gare », je veux configurer une nouvelle tablette en scannant la fiche de station, afin de ne pas tout régler à nouveau.
- En tant que responsable de club, je veux imprimer une affiche aux couleurs du club invitant à jouer avec Bougnat Darts.
- En tant que joueur, je veux lancer une partie exactement comme d'habitude sur une tablette de station.
- En tant que client d'un bar, je ne veux pas que scanner l'affiche modifie autre chose que les couleurs de mon téléphone, et seulement si je l'accepte.

## 8. Règles métier
- RM-01 Deux payloads distincts : `station` (fiche du personnel) et `theme` (affiche publique, 096). L'affiche ne porte **jamais** le QR de station.
- RM-02 Le lien de station ne contient ni logo, ni URL, ni jeton, ni prénom, ni clé ; uniquement des valeurs énumérées ou bornées.
- RM-03 Rien n'est appliqué sans confirmation explicite ; une partie en cours n'est jamais interrompue.
- RM-04 Le parcours de base (ouvrir → jeu → prénoms → jouer) garde le même nombre d'étapes ; la station modifie seulement l'ordre des jeux et les valeurs **pré-remplies**, toujours modifiables.
- RM-05 Un match lié (030) prime sur les réglages de station (setup verrouillé par le partenaire).
- RM-06 La mention Bougnat Darts figure sur l'affiche et les écrans (097) ; aucun champ de station ne peut la masquer.
- RM-07 Les réglages par défaut n'incluent pas l'ouverture (Double/Master-In) tant que 046 n'est pas tranchée.

## 9. Parcours utilisateurs
**Préparer** : Accueil → pied de page → « Préparer une station » → thème (094) → jeux mis en avant → réglages X01 → écran allumé → « Enregistrer et appliquer à cette tablette » → « Fiche de configuration » (QR + lien) et « Affiche à imprimer ».
**Configurer une autre tablette** : scanner la fiche → l'application s'ouvre → carte « Configurer cette tablette pour {lieu} ? » avec la liste des changements → « Configurer » → indicateur « Station : {lieu} ». Facultatif : importer le fichier de thème pour le logo.
**Retirer** : entrée secondaire → « Retirer la configuration de station » → retour aux réglages d'origine (le thème est désactivé, la bibliothèque conservée).

## 10. Exigences fonctionnelles
- FR-01 Contrat `station` v1 dans le fragment `#station=1.<base64url(JSON compact)>` : `o` (nom du lieu ≤ 40), `t` (graines de thème au format compact de 096), `g` (1 à 6 `GameType` distincts, ordonnés), `x` (`s` score de départ ∈ {301, 501, 701} [liste à valider], `o` sortie ∈ {Open, Double, Master}, `l` manches gagnantes 1-15), `k` (écran allumé : 0/1). Liste blanche ; ≤ 600 octets (plafond `station` de 092).
- FR-02 Module pur `parseStationLink` / `buildStationLink` avec motifs typés (sur le modèle de 030), lecture au démarrage après le lien de match externe, nettoyage du fragment.
- FR-03 Carte de confirmation listant chaque changement (« Couleurs du lieu », « Jeux mis en avant : X01, Cricket, Capital », « Partie par défaut : 501, sortie Double, 3 manches », « Écran allumé pendant les parties ») ; actions « Configurer » / « Ignorer ».
- FR-04 Stockage local `bougnat-station-v1` ; le thème est enregistré et activé via 093/096.
- FR-05 Sélection de jeu : jeux mis en avant en tête, dans l'ordre choisi ; les autres jeux restent accessibles.
- FR-06 Setup : valeurs pré-remplies par la station, modifiables ; aucune étape ajoutée.
- FR-07 Wake Lock (API Screen Wake Lock) demandé sur les écrans de jeu si `k = 1` et si l'API existe ; relâché hors partie et à la mise en arrière-plan ; absence d'API signalée une fois dans l'écran de préparation.
- FR-08 Affiche A4 : page dédiée imprimable (`@media print`), nom et logo du lieu (si présent localement), couleurs du thème, QR « Jouez ici » (payload `theme` ou URL de l'app, Q2), mention Bougnat Darts, sans donnée de joueur ; impression via `window.print()`.
- FR-09 Fiche de configuration : QR `station` + lien copiable + rappel « Le logo s'ajoute avec le fichier du thème ».
- FR-10 « Retirer la configuration de station » restaure ordre et réglages d'origine et désactive le thème de station.

## 11. Exigences non fonctionnelles
- NFR-01 Parcours de base : nombre d'étapes et temps de démarrage inchangés ; modules de station chargés à la demande (sauf parseur minimal).
- NFR-02 Sécurité : validation stricte à chaque lecture (lien et stockage local) ; aucun contenu interprété comme HTML, CSS ou URL.
- NFR-03 Confidentialité : fragment non transmis au serveur ; aucune donnée de joueur dans la station ou l'affiche.
- NFR-04 Accessibilité : carte de confirmation et écran de préparation utilisables au clavier ; affiche lisible imprimée en noir et blanc (QR noir sur blanc, 092).
- NFR-05 Compatibilité : Screen Wake Lock [à confirmer : Safari iOS 16.4+, Chrome Android] ; impression depuis iPad et Android [à confirmer].
- NFR-06 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : préparation sur tablette A, impression de l'affiche, scan de la fiche par tablette B, confirmation.
- Alternatif : tablette B sans Wake Lock → configuration appliquée, préférence ignorée avec information.
- Alternatif : client scannant l'affiche → carte de thème (096) sur son téléphone, sans réglages de station.

## 13. Cas limites
- iPad avec application installée : le scan configure Safari, pas l'application (030:107) → message d'aide recommandant d'utiliser la tablette en onglet de navigateur ou d'importer le fichier depuis l'application [formulation à valider].
- Lien de station d'une version future ou tronqué → refus explicite, aucune modification.
- Station déjà configurée pour un autre lieu → confirmation de remplacement.
- Lien de station + paramètres `v=1` → match lié prioritaire, station ignorée.
- Jeu mis en avant retiré dans une version future → ignoré.

## 14. Gestion des erreurs
Motifs : `invalid-link`, `unsupported-version`, `link-too-long`, `invalid-theme`, `invalid-games`, `invalid-defaults`, `storage-unavailable`, `wake-lock-unavailable`, `wake-lock-denied`. Aucun ne bloque une partie.

## 15. Impacts architecturaux
- Pur : `src/features/station/stationLink.ts`, `stationPreferences.ts` (contrat, validation, application aux valeurs par défaut).
- Application : `createInitialSetupState` reçoit des valeurs par défaut injectées (port de préférences), au lieu de lire le stockage ; l'ordre des jeux devient une donnée fournie à la vue.
- Infrastructure : stockage local, Wake Lock (`src/infrastructure/web/wakeLock.ts`), impression.
- Présentation : écran de préparation, carte de confirmation, affiche, indicateur.
- Les règles de jeu ne connaissent pas la station.

## 16. Impacts sur les données et les interfaces
Nouveau contrat public `#station=1.` ; nouvelle clé `bougnat-station-v1`. Paramètre optionnel de valeurs par défaut pour `createInitialSetupState` (`src/features/game-setup/setupModel.ts:68`).

## 17. Compatibilité avec l'existant
Sans station : comportement strictement identique. Lien de match externe (030) inchangé et prioritaire. Affiche statique existante conservée.

## 18. Dépendances
Bloquantes : V2-BRAND-04 (096, format couleurs et carte de confirmation), V2-QR-01 (092). Liées : V2-BRAND-01/02/03/05 (093, 094, 095, 097), V2-REL-02 (031, installation), V2-GAMES-02 (046, ouverture), V2-TV-07 (088, appairage persistant), V2-TAB-05 (073, orientation tablette).

## 19. Critères d'acceptation
- AC-01 Tablette B neuve : scan de la fiche, « Configurer » → thème, ordre des jeux et réglages X01 appliqués en ≤ 10 s (hors chargement réseau initial).
- AC-02 Avec station : accueil → « Lancer une partie » → jeu → prénoms → jouer, même nombre d'étapes qu'avant (E2E comparatif).
- AC-03 Ouverture d'un lien de station : aucune modification avant « Configurer » ; « Ignorer » ne laisse aucune trace ; fragment retiré.
- AC-04 Lien de station contenant une URL, un champ `logo`, une propriété inconnue ou un jeu inexistant : propriété ignorée ou refus typé, aucune requête réseau.
- AC-05 L'affiche imprimée contient le nom du lieu, le QR « Jouez ici », la mention Bougnat Darts, et **pas** le QR de station.
- AC-06 Station avec `k = 1` sur navigateur compatible : l'écran ne s'éteint pas pendant une partie de 10 min ; Wake Lock relâché au retour à l'accueil [à confirmer sur appareil].
- AC-07 « Retirer la configuration de station » : ordre des jeux et réglages d'origine restaurés, partie possible immédiatement.
- AC-08 Lien de station combiné à un lien `v=1` valide : match lié appliqué, station ignorée.

## 20. Scénarios de tests
Unitaires (contrat, bornes, liste blanche, application des valeurs par défaut) ; E2E (préparation, réception, retrait, parcours de base, coexistence 030) ; manuels (impression A4 depuis iPad et Android, scan, Wake Lock) ; terrain (2-3 lieux pilotes [à organiser]).

## 21. Exigences de non-régression
Parcours de base, setup sans station, lien de match externe, chunks initiaux.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Confusion entre fiche de station et affiche publique | Moyen | Moyenne | Payloads distincts (RM-01), libellés clairs |
| Stockage iOS séparé (Safari / application) | Moyen | Élevée | Aide contextuelle, recommandation d'usage |
| Usurpation visuelle d'un lieu | Faible | Faible | Configuration locale, confirmation, aucune galerie |
| Complexification de l'application | Moyen | Moyenne | Entrée secondaire unique, chargement à la demande |
| QR trop dense | Faible | Faible | Plafond 600 octets, test terrain |

## 23. Décisions architecturales
Station = préférences locales injectées dans le setup et la sélection, jamais lues par les règles de jeu ; payload `station` distinct du payload `theme`.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Signature retenue (H.13) | Oui / plus tard | Oui, en lot 4 après 096 | À prendre |
| Q2 | QR de l'affiche | Thème du lieu (096) / URL de l'application | Thème du lieu (couleurs sur le téléphone du joueur, avec confirmation) | À prendre |
| Q3 | Wake Lock | Dans cette spec / spec tablette dédiée | Dans cette spec (préférence de station), réutilisable | À prendre |
| Q4 | Préférence « caller activé » | Réserver le champ / attendre la spec voix | Attendre la spec voix ; aucun champ en v1 | À prendre |
| Q5 | Scores de départ proposés | 301/501/701 / toute valeur autorisée par le setup | 301/501/701 | À prendre |
| Q6 | Libellé de l'entrée | « Préparer une station (clubs et bars) » / « Mode lieu » | « Préparer une station (clubs et bars) » | À prendre |

## 25. Traçabilité
Rapport 09 INNO-05, §5, §2.1 (P11, P12, P14) ; rapport 05 §6.4 ; compte rendu §E (rang 5), H.13, H.16. Specs liées : 030, 031, 046, 088, 092, 093, 094, 095, 096, 097.
