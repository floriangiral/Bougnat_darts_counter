---
id: 096-counter-theme-sharing-no-account
v2_id: V2-BRAND-04
titre: Partage de thème sans compte (fichier, lien, QR)
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
depend_de: [V2-BRAND-01, V2-QR-01]
remplace: []
remplacee_par: []
issue: '#270'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 096 — Partage de thème sans compte (fichier, lien, QR)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 §5.7 : partager un thème entre les appareils d'un club **sans compte ni serveur**. Le rapport 05 (§6.4) et le compte rendu (§D.3) recommandent trois mécanismes complémentaires : **fichier JSON complet** (avec logo), **lien** et **QR** (couleurs et nom seulement, le logo ne tenant pas dans un QR). Le stockage serveur par code court fait l'objet d'une étude déconseillée en V2 (099).

## 2. Problématique
Un thème créé sur une tablette reste aujourd'hui prisonnier de cet appareil. Chaque canal de partage est aussi un canal d'entrée de données non fiables : il doit être validé aussi strictement que l'éditeur.

## 3. Objectifs
- Transférer un thème complet (logo compris) par fichier, en moins d'une minute, via les outils habituels (WhatsApp, mail, AirDrop, clé USB).
- Transmettre couleurs et nom par simple scan, sans fichier.
- N'appliquer **jamais** un thème reçu sans confirmation explicite.
- Rester sans serveur, sans compte, à 0 € de coût récurrent.

## 4. État actuel vérifié dans le code
- [vérifié] Précédent de contrat d'URL versionné et validé : `src/features/external-match/externalMatchLink.ts` (version `:49`, motifs de rejet `:23-35`, nettoyage des noms `:148`) ; nettoyage de la barre d'adresse après lecture : `src/features/external-match/externalMatchAddressBar.ts:17` (`history.replaceState`).
- [vérifié] Le lien de match externe est lu dans la **query** au démarrage (`App.tsx:91`, `analyzeExternalMatchLink(window.location.search, …)`) ; le paramètre `mode` l'est aussi (`src/app/appShell.ts:100`). Aucun usage du fragment (`location.hash`) n'existe hors préservation dans `externalMatchAddressBar.ts:17`.
- [vérifié] Aucune fonction d'export ou d'import de fichier dans l'application ; aucun usage de `navigator.share` (recherche négative).
- [vérifié] `qrcode` n'est utilisé qu'au build (`scripts/generate-app-qr.mjs:3`) ; le QR dynamique viendra de 092.
- [vérifié, calcul] Un lien de thème d'environ 186 caractères produit un QR version 10 au niveau M (57×57 modules) ; un logo même réduit (1-2 Ko en base64) ferait passer le QR au-delà de la version 25 [estimation], d'où « logo hors QR ».
- [vérifié] Sur iOS/iPadOS, un lien scanné s'ouvre dans Safari, dont le stockage est séparé de l'application installée (`specs/030-counter-external-match-link/spec.md:107`).

## 5. Comportement cible
Depuis l'éditeur (094), « Partager » propose :
1. **Fichier** : export `<nom>.bougnat-theme.json` (descripteur + logo en base64), par téléchargement ou partage natif si disponible ; import par « Importer un thème » (sélecteur de fichier).
2. **Lien** : `https://<app>/#theme=1.<base64url>` (couleurs, nom du thème, nom du lieu), bouton « Copier le lien ».
3. **QR** du lien, via 092, avec la mention « Le logo n'est pas inclus : envoyez le fichier du thème ».
À la réception (fichier importé ou lien ouvert), une carte de confirmation présente l'aperçu et propose « Appliquer », « Enregistrer sans appliquer » ou « Ignorer ».

## 6. Périmètre
### Inclus
Format de fichier v1, format de lien v1, QR du lien, import par fichier, réception par lien, confirmation, nettoyage de l'adresse, validation à chaque entrée.
### Exclu
Serveur ou code court (099), logo dans le lien ou le QR (Q1), synchronisation automatique entre appareils, partage de la configuration de station (100, payload distinct), galerie publique.

## 7. User stories
- En tant que responsable de club, je veux envoyer le thème complet au groupe WhatsApp du club.
- En tant que membre, je veux scanner le QR affiché au club pour avoir les couleurs du club sur mon téléphone.
- En tant que joueur, je ne veux pas que l'ouverture d'un lien change mon interface sans mon accord.

## 8. Règles métier
- RM-01 Fichier, lien et QR transportent le **même** `ThemeDescriptor` v1 (093), validé par la même fonction à chaque entrée ; le logo d'un fichier repasse par le pipeline de 095.
- RM-02 Lien et QR ne contiennent **jamais** de logo ni de donnée de partie, de station, de jeton TV ou de résultat (payload distinct, 092 RM-02).
- RM-03 Le thème reçu n'est **jamais** appliqué sans action explicite ; une partie en cours n'est jamais interrompue (proposition différée au retour à l'accueil).
- RM-04 Le fragment `#theme=…` est retiré de l'adresse après lecture, sans rechargement.
- RM-05 Le lien de thème est ignoré pendant un match lié (030) et n'interagit pas avec les paramètres `v=1`.

## 9. Parcours utilisateurs
**Émetteur** : Éditeur → « Partager » → Fichier (télécharger / partager) ou Lien (copier) ou QR (afficher).
**Récepteur par lien/QR** : scan → l'application s'ouvre sur l'accueil → carte « Thème « Club des Volcans » proposé » avec aperçu → Appliquer / Enregistrer / Ignorer → l'adresse est nettoyée.
**Récepteur par fichier** : Éditeur → « Importer un thème » → choix du fichier → même carte de confirmation.

## 10. Exigences fonctionnelles
- FR-01 Format de fichier v1 : `{ "format": "bougnat-theme", "version": 1, "theme": ThemeDescriptor (sans id local), "logo"?: { "mime", "w", "h", "sha256", "data" (base64) } }`, extension `.bougnat-theme.json`.
- FR-02 Import de fichier : taille ≤ 200 Ko vérifiée **avant** lecture ; `JSON.parse` protégé ; `format` et `version` vérifiés ; liste blanche de propriétés ; longueur base64 du logo bornée (≤ 140 000 caractères) avant décodage ; logo renormalisé par 095 et empreinte recalculée (l'empreinte fournie n'est pas crue).
- FR-03 Export : téléchargement (`Blob` + lien `download`) ; partage natif de fichier si `navigator.canShare({ files })` est vrai [à confirmer iOS/Android].
- FR-04 Format de lien v1 : fragment `#theme=1.<base64url(JSON compact)>` avec clés courtes (`n` nom, `o` lieu, `b`, `b2`, `a`, `s` graines hex sans `#`) ; longueur totale ≤ 400 octets (plafond `theme` de 092).
- FR-05 Lecture du lien au démarrage par un module pur `parseThemeLink(hash)` ; motifs typés comme 030 ; puis nettoyage du fragment (`history.replaceState`).
- FR-06 Carte de confirmation non bloquante sur l'accueil : aperçu (vignettes de 094 si disponibles, sinon pastilles), nom du lieu, mention « logo non inclus » le cas échéant, actions Appliquer / Enregistrer sans appliquer / Ignorer.
- FR-07 Si un thème du même nom existe : proposer « Remplacer » ou « Garder les deux ».
- FR-08 QR via 092 avec `kind: 'theme'` et libellé « Scanner pour appliquer le thème du club ».
- FR-09 Erreurs de lien affichées une fois, sans bloquer l'accueil (« Lien de thème invalide ou d'une version plus récente »).

## 11. Exigences non fonctionnelles
- NFR-01 Sécurité : aucune donnée reçue n'est interprétée comme CSS, HTML ou URL ; aucune requête réseau.
- NFR-02 Confidentialité : fragment non transmis au serveur ni aux journaux d'accès ; aucun suivi du partage.
- NFR-03 Performance : lecture du lien ≤ 5 ms ; modules de partage chargés à la demande (sauf `parseThemeLink`, minimal).
- NFR-04 Accessibilité : carte de confirmation focalisable, lisible par lecteur d'écran, actions au clavier.
- NFR-05 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal fichier : export sur tablette A → WhatsApp → import sur tablette B → Appliquer.
- Nominal lien : QR affiché au club → scan → Appliquer.
- Alternatif : « Enregistrer sans appliquer » → thème disponible dans la bibliothèque.
- Alternatif : réception sur iPhone avec application installée → thème appliqué dans Safari seulement (stockage séparé, 030:107) ; message d'aide [à confirmer formulation].

## 13. Cas limites
- Lien tronqué par une messagerie ; caractères non ASCII dans le nom ; fragment combiné à des paramètres `v=1` (match lié prioritaire, thème ignoré).
- Fichier JSON valide mais d'une version future ; logo base64 corrompu (thème importé sans logo, avertissement).
- Bibliothèque pleine (10) : import refusé avec message, possibilité d'appliquer sans enregistrer [à confirmer].

## 14. Gestion des erreurs
Motifs : `file-too-large`, `invalid-json`, `unsupported-format`, `unsupported-version`, `invalid-theme` (détail de 093), `invalid-logo` (détail de 095), `link-too-long`, `invalid-link`. Aucun n'affecte le thème actif ni une partie.

## 15. Impacts architecturaux
- Pur : `src/features/theming/sharing/themeFile.ts`, `themeLink.ts` (sérialisation, parsing, bornes).
- Infrastructure : export/import de fichiers, partage natif, nettoyage de l'adresse.
- Présentation : actions de partage dans l'éditeur, carte de confirmation sur l'accueil.
- Le démarrage lit le fragment **après** l'analyse du lien de match externe et sans la modifier.

## 16. Impacts sur les données et les interfaces
Deux contrats publics versionnés : fichier `bougnat-theme` v1 et lien `#theme=1.` ; à documenter comme interfaces stables.

## 17. Compatibilité avec l'existant
Lien de match externe (030) inchangé ; query non utilisée ; accueil inchangé hors carte de confirmation éphémère.

## 18. Dépendances
Bloquantes : V2-BRAND-01 (093), V2-QR-01 (092). Liées : V2-BRAND-03 (095, logo dans le fichier), V2-BRAND-02 (094, aperçus), V2-INT-01 (030, coexistence des liens), V2-STATION-01 (100, réutilise le format couleurs).

## 19. Critères d'acceptation
- AC-01 Export puis import d'un thème avec logo sur un autre navigateur : descripteur identique (hors id local) et logo identique après renormalisation.
- AC-02 Ouverture de `/#theme=1.<valide>` : carte de confirmation affichée, aucun changement visuel avant « Appliquer », fragment retiré de l'adresse.
- AC-03 Lien de thème ouvert alors qu'une partie est restaurée : la partie reprend, la carte n'apparaît qu'au retour à l'accueil.
- AC-04 Fichier de 250 Ko : rejet `file-too-large` sans lecture.
- AC-05 Fichier contenant une propriété `css` ou une couleur `url(x)` : propriété ignorée / rejet `invalid-theme` ; rien n'est appliqué automatiquement.
- AC-06 QR du lien lu par l'appareil photo d'un iPhone et d'un Android ouvre l'application avec la carte de confirmation [à confirmer sur appareils].
- AC-07 Lien combinant paramètres `v=1` valides et `#theme=` : le match lié démarre, le thème est ignoré.
- AC-08 Le lien et le QR ne contiennent aucune donnée de logo (test sur le payload produit).

## 20. Scénarios de tests
Unitaires (sérialisation aller-retour, bornes, liste blanche, versions) ; E2E (export/import, lien, coexistence 030, partie restaurée) ; manuels (WhatsApp, mail, AirDrop, scan iOS/Android).

## 21. Exigences de non-régression
Lien de match externe (suite E2E existante, 28 scénarios selon le rapport 08 [à recompter]) ; démarrage sans fragment ; parcours de base.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Thème appliqué par surprise (lien malveillant) | Moyen | Faible | Confirmation obligatoire, aperçu |
| Lien tronqué par une messagerie | Faible | Moyenne | Base64url, longueur bornée, fichier en alternative |
| Stockage iOS séparé (Safari / application installée) | Moyen | Élevée | Message d'aide, import par fichier dans l'application |
| Fichier modifié à la main | Faible | Moyenne | Validation stricte, renormalisation du logo |

## 23. Décisions architecturales
Lien dans le **fragment** (recommandé) plutôt que dans la query : non transmis au serveur, pas de collision avec `v=1`. À confirmer (Q2).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Logo dans le lien/QR (H.16) | Fichier seulement / logo 64 px dégradé dans le lien | Fichier seulement | À prendre |
| Q2 | Emplacement du payload | Fragment `#theme=` / query `?theme=` | Fragment (confidentialité, coexistence 030) ; renoncer au comptage par Web Analytics | À prendre |
| Q3 | Pas de serveur de partage en V2 | Confirmer / ouvrir 099 | Confirmer | À prendre |
| Q4 | Partage natif de fichier | Oui si disponible / téléchargement seul | Oui si disponible | À prendre |
| Q5 | Thème reçu, bibliothèque pleine | Refus / application sans enregistrement | Application sans enregistrement possible | À prendre |

## 25. Traçabilité
Rapport 05 §6.4, §6.6 ; rapport 09 INNO-05 ; compte rendu §C.7, §D.3, H.16. Specs liées : 030, 092, 093, 094, 095, 099, 100.
