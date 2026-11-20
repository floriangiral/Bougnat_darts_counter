---
id: 095-counter-logo-import
v2_id: V2-BRAND-03
titre: Import du logo du club
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: perso
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-BRAND-01]
remplace: []
remplacee_par: []
issue: '#269'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 095 — Import du logo du club

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 §5.7 : afficher le logo du club ou du bar dans l'en-tête de jeu et sur la TV. Le rapport 05 (§6.3) et le compte rendu (§C.7, risques) imposent une **validation à chaque entrée**, des **bornes en octets et en pixels vérifiées avant décodage**, un format de sortie unique et léger, et un SVG **refusé ou rasterisé**, jamais injecté dans le DOM. La revue croisée recommande de **refuser le SVG dans un premier temps**.

## 2. Problématique
Une image importée est la donnée utilisateur la plus risquée du périmètre : fichiers énormes (déni de service mémoire, « bombe de décompression »), formats déguisés, SVG actif, métadonnées personnelles (EXIF, géolocalisation). Elle doit aussi rester légère pour le stockage local et la TV.

## 3. Objectifs
- Accepter PNG, JPEG et WebP ; refuser le reste avec un message clair.
- Rejeter avant décodage tout fichier hors bornes.
- Produire un logo normalisé (≤ 512 px, ≤ 100 Ko) sans métadonnées, stocké localement.
- Fournir un pipeline **unique** réutilisé par toutes les entrées (fichier image, fichier de thème 096, message TV 098).

## 4. État actuel vérifié dans le code
- [vérifié] Aucun import de fichier image ni manipulation de canvas pour des images dans l'application (rapport 05 §2.1 ; logo applicatif = mot-symbole CSS, ex. `components/match/MatchTopBar.tsx:26`).
- [vérifié] CSP : `img-src 'self' data: blob: https:` (`public/_headers:2`) autorise l'affichage d'un logo en `blob:` ou `data:` ; `connect-src` limité (`'self'`, Deepgram, Cloudflare Insights) : aucun logo distant ne peut être récupéré par `fetch`.
- [vérifié] IndexedDB existante `bougnat-counter-local` v1 (`src/infrastructure/local/IndexedDBSessionRepository.ts:10-14`), sans store pour les fichiers.
- [vérifié] La chaîne legacy cible `ios >= 12` / `safari >= 12` (`vite.config.ts:29-30`) : `createImageBitmap`, `canvas.toBlob('image/webp')` et le stockage de `Blob` en IndexedDB sont [à confirmer] sur ces versions.
- [hypothèse] Le chargement d'un SVG dans un `<img>` désactive scripts et ressources externes (modèle « SVG as image ») ; un `foreignObject` peut « tainter » le canvas sur certains Safari (rapport 05 §6.3).

## 5. Comportement cible
Depuis l'éditeur (094) : « Ajouter un logo » ouvre le sélecteur de fichiers (`accept="image/png,image/jpeg,image/webp"`). Le fichier traverse le pipeline : (1) taille en octets, (2) signature binaire, (3) dimensions lues dans l'en-tête, (4) décodage borné, (5) redimensionnement et réencodage, (6) empreinte SHA-256, (7) stockage. Le logo validé est référencé par son empreinte dans le `ThemeDescriptor` (093). Choix d'un fond de pastille (transparent, clair, sombre) et d'un mode « ajuster ». Suppression possible à tout moment.

## 6. Périmètre
### Inclus
Pipeline de validation et de normalisation, stockage local, affichage (en-tête de jeu, TV via 098), pastille de contraste automatique, suppression, réutilisation du pipeline par 096 et 098.
### Exclu
SVG en première livraison (Q1), recadrage interactif (P3), logo distant par URL, galerie partagée, logo dans un lien ou un QR (096, 100), images de fond.

## 7. User stories
- En tant que responsable de club, je veux importer le logo PNG reçu de mon bureau, afin qu'il apparaisse en partie et sur la TV.
- En tant que gérant, je veux un message clair si mon fichier ne convient pas, avec la marche à suivre.
- En tant que mainteneur, je veux qu'aucun fichier importé ne puisse exécuter du code ni saturer la mémoire de la tablette.

## 8. Règles métier
- RM-01 Formats acceptés en entrée : PNG, JPEG, WebP, identifiés par leur **signature binaire** (l'extension et le type MIME déclaré ne font pas foi).
- RM-02 Bornes vérifiées **avant décodage** : ≤ 2 Mo ; largeur et hauteur ≤ 4096 px ; surface ≤ 16 Mpx ; rapport largeur/hauteur ≤ 4:1.
- RM-03 Sortie : plus grand côté ≤ 512 px, WebP (qualité 0,85) ou PNG en repli, ≤ 100 Ko ; métadonnées supprimées par le réencodage.
- RM-04 Le même pipeline s'applique à **chaque** entrée : fichier image, logo contenu dans un fichier de thème (096), logo reçu par la TV (098, profil réduit).
- RM-05 Le balisage d'un fichier n'est jamais inséré dans le DOM ; l'affichage passe par `<img>` sur une URL `blob:` issue du réencodage.
- RM-06 Le logo reste sur l'appareil ; l'utilisateur est responsable des droits sur le logo qu'il importe (mention dans l'éditeur).

## 9. Parcours utilisateurs
1. Éditeur → « Ajouter un logo ».
2. Choix du fichier → indicateur de traitement.
3. Succès : aperçu dans les vignettes (094), choix du fond de pastille.
4. Échec : message précis (« Fichier trop lourd : 2 Mo maximum », « Format non pris en charge : PNG, JPEG ou WebP », « Image trop allongée »).
5. « Retirer le logo » → retour au nom du lieu seul.

## 10. Exigences fonctionnelles
- FR-01 Vérifier `File.size` ≤ 2 Mo avant toute lecture du contenu.
- FR-02 Lire les 32 premiers octets et vérifier la signature PNG, JPEG (SOI) ou WebP (RIFF…WEBP) ; sinon `unsupported-format`.
- FR-03 Lire les dimensions dans l'en-tête (PNG IHDR, JPEG SOFn, WebP VP8/VP8L/VP8X) par un parseur **pur** et borné ; rejeter selon RM-02 avant décodage ; en-tête illisible → `invalid-image`.
- FR-04 Décoder (`createImageBitmap` ou `<img>` sur URL `blob:` en repli), dessiner sur un canvas aux dimensions cibles, réencoder (WebP sinon PNG), réduire la qualité ou la taille (512 → 384 → 256 px) jusqu'à ≤ 100 Ko ; sinon `too-heavy-after-processing`.
- FR-05 Images animées : seule la première image est conservée.
- FR-06 Calculer l'empreinte SHA-256 de la sortie ; la référence `{ sha256, mime, w, h, bytes }` est enregistrée dans le descripteur (093 FR-01).
- FR-07 Stocker la sortie en IndexedDB (base de 093), avec repli `ArrayBuffer` si le stockage de `Blob` échoue [à confirmer sur anciens Safari].
- FR-08 Affichage : cadre de hauteur fixe par contexte (en-tête 28-40 px, TV via 098), `object-fit: contain`, `alt` = « Logo de {nom du lieu} » ; pastille de fond ajoutée automatiquement si la luminance moyenne du logo contraste trop peu avec la surface.
- FR-09 Les URL `blob:` sont créées une fois par session et révoquées à la suppression ou au changement de logo ; aucun nouveau rendu du logo pendant une partie.
- FR-10 Exposer `normalizeLogo(bytes, profile)` réutilisable avec les profils `editor` (512 px, 100 Ko) et `tv` (défini par 098).

## 11. Exigences non fonctionnelles
- NFR-01 Sécurité : aucun SVG accepté en première livraison ; aucune bibliothèque de nettoyage HTML nécessaire ; aucun appel réseau.
- NFR-02 Mémoire : jamais plus d'un décodage simultané ; bitmap libérée (`close()`) après réencodage.
- NFR-03 Performance : traitement ≤ 1 s pour un JPEG de 2 Mo sur tablette milieu de gamme [à mesurer] ; hors chemin de jeu.
- NFR-04 Confidentialité : métadonnées EXIF (dont géolocalisation) supprimées ; rien n'est envoyé.
- NFR-05 Accessibilité : messages d'erreur annoncés (`aria-live`), bouton de retrait au clavier.
- NFR-06 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : PNG 800×800 de 300 Ko → WebP 512×512 ≤ 100 Ko.
- Alternatif : navigateur sans encodage WebP → PNG, éventuellement réduit à 384 px pour tenir sous 100 Ko.
- Alternatif : logo très sombre en mode sombre → pastille claire automatique.

## 13. Cas limites
- Fichier `.png` qui est en réalité un SVG ou un exécutable → `unsupported-format`.
- PNG déclarant 50 000×50 000 px dans un fichier de 50 Ko → rejet avant décodage.
- JPEG progressif ou CMJN [à confirmer : rendu des couleurs].
- Logo 4:1 exact accepté ; 4,01:1 refusé.
- Stockage plein ou éviction par le navigateur : logo absent, thème conservé, message invitant à réimporter.

## 14. Gestion des erreurs
Motifs typés : `file-too-large`, `unsupported-format`, `invalid-image`, `dimensions-too-large`, `aspect-ratio`, `decode-failed`, `too-heavy-after-processing`, `storage-failed`. Aucun n'affecte le thème déjà actif ni une partie.

## 15. Impacts architecturaux
- Pur : `src/features/theming/logo/imageHeader.ts` (signatures, dimensions, bornes).
- Infrastructure : `src/infrastructure/web/logoProcessor.ts` (décodage, canvas, réencodage, SHA-256) ; stockage via `themeStorage` (093).
- Présentation : `ClubLogo` (affichage), intégration dans l'éditeur (094).

## 16. Impacts sur les données et les interfaces
Nouveau store de logos (base dédiée de 093). Référence de logo dans `ThemeDescriptor` v1.

## 17. Compatibilité avec l'existant
Sans logo, l'en-tête reste inchangé. Aucun impact sur les sessions et l'historique.

## 18. Dépendances
Bloquante : V2-BRAND-01 (093). Liées : V2-BRAND-02 (094, interface), V2-BRAND-04 (096, logo dans le fichier de thème), V2-BRAND-06 (098, profil TV), V2-DS-00 (018, capacités des anciens Safari).

## 19. Critères d'acceptation
- AC-01 PNG 800×800 de 300 Ko : logo stocké en WebP (ou PNG) ≤ 512 px et ≤ 100 Ko, affiché dans l'aperçu.
- AC-02 Fichier de 2,1 Mo : rejet `file-too-large` sans lecture du contenu (vérifié par test avec espion sur la lecture).
- AC-03 PNG dont l'en-tête annonce 20 000×20 000 px : rejet `dimensions-too-large` sans appel au décodeur.
- AC-04 Fichier SVG (y compris renommé en `.png`) : rejet `unsupported-format`.
- AC-05 JPEG avec EXIF de géolocalisation : la sortie stockée ne contient aucun bloc EXIF.
- AC-06 Logo 1000×200 (5:1) : rejet `aspect-ratio`.
- AC-07 Le même fichier invalide injecté via un fichier de thème (096) produit le même motif de rejet.
- AC-08 Aucun nœud `<svg>` ni HTML issu d'un fichier importé n'apparaît dans le DOM (test E2E).

## 20. Scénarios de tests
Unitaires du parseur d'en-tête (fixtures valides, tronquées, falsifiées, dimensions extrêmes) ; tests d'infrastructure en navigateur (Playwright) pour le décodage et le réencodage ; E2E d'import réussi et d'échecs ; tests manuels sur iPad et Android.

## 21. Exigences de non-régression
En-têtes de jeu sans logo inchangés ; parcours de base inchangé ; aucune nouvelle requête réseau.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Encodage WebP indisponible (anciens Safari) | Faible | Moyenne | Repli PNG et réduction de taille |
| Blob en IndexedDB peu fiable sur anciens Safari | Moyen | Moyenne | Repli `ArrayBuffer` |
| Éviction du stockage | Moyen | Faible | Message, fichier de thème (096) comme sauvegarde |
| Logo inapproprié affiché en bar | Image | Faible | Stockage local uniquement, aucune galerie |
| Rejet de SVG mal compris par les clubs | Faible | Moyenne | Message expliquant comment exporter en PNG |

## 23. Décisions architecturales
Pipeline unique de normalisation partagé par toutes les entrées ; SVG refusé en première livraison.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | SVG (H.16) | Refusé / rasterisé via `<img>` + canvas / accepté tel quel | Refusé en première livraison ; rasterisation réévaluée après retour des clubs ; jamais tel quel | À prendre |
| Q2 | Bornes | 2 Mo / 4096 px / 16 Mpx / 4:1 (proposées) / autres | Valeurs proposées | À prendre |
| Q3 | Taille de sortie | 512 px / 384 px | 512 px (TV 1080p) | À prendre |
| Q4 | Logo trop allongé | Refus / recadrage automatique en zone de sécurité | Refus avec conseil | À prendre |
| Q5 | Demande de stockage persistant (`navigator.storage.persist()`) | Oui / non | Oui lors de l'enregistrement d'un thème avec logo [à confirmer support] | À prendre |

## 25. Traçabilité
Rapport 05 §6.3, §6.4, §7 ; compte rendu §C.7, §D.3, H.16. Specs liées : 093, 094, 096, 098, 018.
