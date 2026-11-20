---
id: 102-counter-take-away-recap
v2_id: V2-SHARE-01
titre: « La partie à emporter » — récap partageable
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: innovation
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-QR-01]
remplace: []
remplacee_par: []
issue: '#273'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 102 — « La partie à emporter » : récap partageable

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

- Rapport 09 : INNO-04 « Récap à emporter » (candidat signature n° 2), constats P6 et P11.
- Rapport 08 : proposition « carte de résultat et export local d'un match » (ID provisoire V2-INT-06, non reprise telle quelle au catalogue ; **ses besoins sont absorbés ici**) pour faciliter la ressaisie manuelle dans 3K Darts, Darts for Windows ou DartConnect, seule voie admise ou documentée aujourd'hui (compte rendu D.4).
- Compte rendu : E (rang 4), F.6, G (lot 4), H.13 (signatures), H.25 (`qrcode` embarqué côté client), H.27 (mesure d'adoption).
- Issue historique #46 « Récupérer ses stats de fin de partie avec un QR code » : fermée NOT_PLANNED le 24/04/2026 (vérifié avec `gh issue view 46`). Cette spec la retrace.
- Niveau de vérification de la différenciation (rapport 09) : Darts Scorer 180 propose un QR, mais pour rattacher la partie à un **compte** [VÉRIFIÉ ext., 20/11/2026] ; un récap portable sans compte ni serveur est **[NON TROUVÉ]** parmi les 19 applications consultées sur leurs pages publiques. Cela ne prouve pas qu'il n'existe nulle part : **aucune nouveauté n'est revendiquée**.

## 2. Problématique

En fin de partie, les statistiques restent sur l'appareil qui a compté, disparaissent de l'écran après 2 minutes et ne peuvent ni être gardées par les joueurs, ni être transmises proprement à un organisateur qui ressaisit le résultat ailleurs.

## 3. Objectifs

- O1 : chaque joueur peut emporter le récap de la partie sur son téléphone en ≤ 2 interactions, sans compte ni serveur.
- O2 : le récap peut être partagé comme image (réseaux, messageries) avec la mention Bougnat Darts.
- O3 : un organisateur peut copier un résultat lisible pour le ressaisir dans une autre plateforme.
- O4 : aucune donnée de partie n'est envoyée à un serveur par ces fonctions.

## 4. État actuel vérifié dans le code

- [vérifié] Fin de partie X01 : `views/StatsView.tsx` affiche les statistiques (`StatsModal`) et deux actions (Revanche, Quitter) ou, en match lié, « Envoyer le résultat » (`:59-80`) ; retour automatique à l'accueil après 120 s hors match lié (`:28-36`).
- [vérifié] Statistiques X01 disponibles (moyenne 3 fléchettes, First 9, checkout, meilleur score, 180…) : `src/application/scoring/matchStats.ts:13-31`.
- [vérifié] Chaque volée X01 conserve `score`, `isBust`, `remainingAfter`, `dartsThrown` (`types.ts:28-34`).
- [vérifié] Le seul QR de l'application est un fichier statique généré au build (`scripts/generate-app-qr.mjs:3`, `views/HomeView.tsx:44`). `qrcode` est déclaré en dépendance (`package.json:34`) mais n'est importé par aucun module client.
- [vérifié] Aucun appel à `navigator.share`, `canvas.toBlob` ou `toDataURL` dans `src/`, `views/`, `components/`, `utils/`, `App.tsx`.
- [vérifié] La CSP autorise `img-src 'self' data: blob: https:` et limite `connect-src` à l'origine, Deepgram et Cloudflare Insights (`public/_headers:2`) : générer une image locale ne demande aucun changement de CSP.
- [vérifié] L'application ne lit pas le fragment d'URL ; seul `window.location.search` est analysé pour le lien externe (`App.tsx:91`).
- [à confirmer] Prise en charge du partage de fichiers (Web Share niveau 2) : Chrome Android, Safari iOS récents ; absente de Firefox desktop. Le rapport 09 cite 91,9 % pour Web Share (caniuse, 20/11/2026), sans distinguer le partage de fichiers.

## 5. Comportement cible

Sur l'écran de fin de partie (et dans le détail de « Mes parties », 101), un bouton secondaire « Emporter la partie » ouvre un panneau contenant :
1. un **aperçu de la carte** (image) avec « Partager » (Web Share avec fichier) ou, à défaut, « Télécharger l'image » ;
2. un **QR code récap** : scanné par un téléphone, il ouvre Bougnat Darts sur une vue « Récap de partie » en lecture seule ; les données sont dans le **fragment** de l'URL (`#…`), qui n'est jamais transmis au serveur ;
3. « Copier le résultat » (texte lisible pour ressaisie) et « Télécharger (JSON) ».

## 6. Périmètre

### Inclus
- Modèle de récap pur, carte image, QR récap, vue de lecture, copie texte, export JSON.
- X01 (simple, doublettes, robot) en première version.

### Exclu
- Autres jeux en V1 (Q2) : ajoutés via la fin de partie commune de V2-GAMES-06 (049).
- Logo de club sur la carte (après V2-BRAND-03, 095).
- Stockage serveur, lien court, compte, galerie publique.
- Transmission automatique du résultat à un partenaire (contrat 030 et V2-INT-04, 107).
- Valeur probante : le récap n'est pas un résultat officiel.

## 7. User stories

- En tant que joueuse, je veux scanner un QR en fin de partie pour garder mon récap sur mon téléphone.
- En tant que joueur, je veux partager une image de ma victoire dans le groupe de mes amis.
- En tant qu'organisateur de club, je veux copier le résultat formaté pour le ressaisir dans la plateforme de la ligue.
- En tant que gérant de bar, je veux que chaque partage montre que la partie a été comptée avec Bougnat Darts.

## 8. Règles métier

- RM-01 : le récap est calculé à partir de l'état final de la partie, sans recalcul des règles (réutilise `matchStats`).
- RM-02 : le récap porte la mention « Récapitulatif non officiel » ; il ne remplace jamais l'envoi du résultat d'un match lié.
- RM-03 : la mention « Compté avec Bougnat Darts » et l'adresse de l'application figurent sur la carte et dans la vue de lecture (cohérent avec V2-BRAND-05, 097).
- RM-04 : un récap reçu par QR n'est jamais ajouté automatiquement à l'historique de l'appareil qui le lit (Q5).

## 9. Parcours utilisateurs

1. Fin de partie X01 → « Emporter la partie ».
2. Panneau : aperçu de la carte + QR + actions.
3a. « Partager » → feuille de partage du système avec l'image PNG.
3b. Un joueur scanne le QR → son navigateur ouvre la vue « Récap de partie » → « Ouvrir Bougnat Darts » mène à l'accueil.
3c. « Copier le résultat » → texte dans le presse-papiers → confirmation « Copié ».
4. Fermer le panneau → retour à l'écran de fin, actions inchangées.

## 10. Exigences fonctionnelles

- FR-01 : un bouton secondaire « Emporter la partie » est ajouté à l'écran de fin X01 sans masquer ni déplacer hors écran « Revanche », « Quitter » ou « Envoyer le résultat ».
- FR-02 : l'ouverture du panneau suspend le retour automatique de l'écran de fin tant que le panneau est ouvert.
- FR-03 : le modèle `MatchRecap` (pur) contient : jeu, format, date, joueurs ou équipes, vainqueur, score (manches/sets), durée et, par joueur, moyenne 3 fléchettes, 180, meilleur checkout, meilleur score.
- FR-04 : la carte image (PNG, format portrait proposé 1080 × 1350 px, Q4) reprend `MatchRecap`, les noms tronqués proprement, la mention RM-02 et RM-03.
- FR-05 : « Partager » utilise Web Share avec fichier si `navigator.canShare({ files })` est vrai ; sinon le bouton devient « Télécharger l'image ».
- FR-06 : le QR encode une URL `<VITE_APP_URL>/#r=<charge utile>` ; la charge utile est versionnée (`v=1`), compacte (encodage positionnel, sans compression dépendante de `CompressionStream`) et tient dans un budget fixé par mesure (Q3).
- FR-07 : au chargement, si le fragment contient `r=`, l'application valide strictement la charge utile (version, longueurs, bornes numériques) et affiche la vue « Récap de partie » en lecture seule ; une charge invalide affiche « Récap illisible » et un bouton vers l'accueil.
- FR-08 : après lecture, le fragment est retiré de la barre d'adresse (`history.replaceState`) ; la vue reste affichée jusqu'à l'action de l'utilisateur.
- FR-09 : « Copier le résultat » produit un texte stable, par exemple « 501 Double Out — 3 manches — Alice bat Bob 3-1 — Moy. 54,3 / 48,1 — 180 : 1 / 0 — 20/11/2026 21:14 ».
- FR-10 : « Télécharger (JSON) » produit un fichier `bougnat-partie-<date>.json` contenant `MatchRecap` versionné (sans l'état complet de la partie).
- FR-11 : le générateur de QR est celui de V2-QR-01 (092), chargé à la demande à l'ouverture du panneau.
- FR-12 : en match lié (030), le panneau est disponible mais « Envoyer le résultat » reste l'action principale.

## 11. Exigences non fonctionnelles

- NFR-01 (confidentialité) : aucune requête réseau n'est émise par la génération ou la lecture d'un récap (vérifiable dans l'onglet réseau / test E2E).
- NFR-02 (performance) : panneau affiché en ≤ 1 s sur le téléphone de référence (V2-QA-09, 042) [à confirmer] ; le code du récap et du QR n'alourdit pas le chargement initial (chunks différés, budget V2-PERF-01, 044).
- NFR-03 (lisibilité du QR) : lecture réussie par l'appareil photo natif d'un iPhone et d'un Android récents à 30-50 cm d'un écran de téléphone et de tablette [à confirmer sur appareil].
- NFR-04 (accessibilité) : la carte a un équivalent textuel (le texte de FR-09) ; panneau dans un `<dialog>` avec focus géré ; cibles ≥ 48 px.
- NFR-05 (sécurité) : les champs décodés sont affichés comme texte uniquement ; aucune URL ni HTML n'est accepté dans la charge utile.
- NFR-06 (coût) : 0 € récurrent.

## 12. Cas nominaux et alternatifs

- Nominal : X01 simple terminé → partage de l'image.
- Alternatif : navigateur sans partage de fichiers → téléchargement.
- Alternatif : doublettes → la carte affiche les équipes.
- Alternatif : partie contre le robot → le robot est identifié comme tel.
- Alternatif : ouverture depuis « Mes parties » (101) → même panneau.

## 13. Cas limites

- Prénoms longs ou avec emoji : troncature à l'affichage et dans la charge utile (longueur maximale par nom, Q3).
- Budget QR dépassé (statistiques nombreuses) : la charge utile omet les statistiques facultatives par ordre de priorité défini, puis le QR est généré.
- Fragment présent en même temps qu'un lien externe (030) : le lien externe est prioritaire et le fragment est ignoré.
- Presse-papiers refusé : le texte s'affiche dans une zone sélectionnable.
- Police non chargée au moment du dessin : la carte attend `document.fonts.ready` ou utilise une police système.

## 14. Gestion des erreurs

- Échec de génération de l'image ou du QR : message non bloquant, les autres actions restent disponibles.
- Partage annulé par l'utilisateur : aucun message d'erreur.
- Charge utile invalide : « Récap illisible » (FR-07).

## 15. Impacts architecturaux

- Application : `buildMatchRecap(match)` pur ; `encodeRecapPayload` / `decodeRecapPayload` purs et versionnés (même rigueur que `src/features/external-match/externalMatchLink.ts`).
- Infrastructure / présentation : rendu canvas (`recapImageRenderer`), adaptateur de partage (`shareFile` avec repli téléchargement), générateur QR (V2-QR-01).
- Shell : détection du fragment `#r=` au démarrage dans `App.tsx`, écran `RECAP_VIEW`.
- Aucune règle de jeu dans le rendu ; le modèle est réutilisable par la TV (V2-TV-06, 086) et l'historique (101).

## 16. Impacts sur les données et les interfaces

- Nouveau contrat public d'URL « récap » `v=1` (fragment) : à documenter, compatibilité ascendante obligatoire (une ancienne carte doit rester lisible).
- Format JSON exporté versionné.
- Aucun changement de `PersistedAppSession` hors l'éventuel écran `RECAP_VIEW` (non restauré après rechargement).

## 17. Compatibilité avec l'existant

- Lien externe 030 inchangé (paramètres de requête, pas de fragment).
- Écran de fin inchangé hors ajout du bouton.
- Baseline navigateurs (spec 018) : pas de `CompressionStream` ; repli téléchargement si Web Share indisponible.

## 18. Dépendances

- V2-QR-01 (092) : générateur de QR côté client, chargé à la demande (bloquant pour le QR ; la carte et la copie peuvent être livrées avant).
- V2-HIST-01 (101) : point d'entrée depuis l'historique (optionnel).
- V2-BRAND-05 (097) : forme de la mention de marque.
- V2-GAMES-06 (049) : extension aux autres jeux.
- V2-PERF-01 (044) : budget de poids.

## 19. Critères d'acceptation

- AC-01 : X01 501 terminé ; « Emporter la partie » → aperçu, QR et 3 actions visibles en portrait 360 × 640 sans masquer « Revanche ». Preuve : E2E + capture.
- AC-02 : sur Chrome Android, « Partager » ouvre la feuille de partage avec un fichier PNG [à confirmer sur appareil] ; sur Firefox desktop, le bouton est « Télécharger l'image » et télécharge un PNG. Preuve : E2E (repli) + test terrain.
- AC-03 : le QR scanné par l'appareil photo natif iOS et Android ouvre la vue de lecture avec les mêmes vainqueur, score et moyennes que l'écran de fin. Preuve : test terrain + test unitaire aller-retour `encode`/`decode`.
- AC-04 : aucune requête réseau n'est émise pendant la génération ni à l'ouverture de la vue de lecture hors chargement de l'application. Preuve : E2E avec interception réseau.
- AC-05 : 30 charges utiles malformées (version inconnue, champs trop longs, nombres hors bornes, caractères de contrôle) produisent « Récap illisible » sans exception. Preuve : tests unitaires.
- AC-06 : « Copier le résultat » place le texte attendu (FR-09) dans le presse-papiers. Preuve : test unitaire du formateur + E2E.
- AC-07 : en match lié, « Envoyer le résultat » reste le premier bouton et fonctionne à l'identique. Preuve : E2E 030 existants verts.
- AC-08 : le chargement initial de l'application n'inclut pas le code du QR ni du rendu (chunks différés). Preuve : rapport de build.
- AC-09 : le panneau ouvert, aucun retour automatique à l'accueil ne survient après 120 s. Preuve : test de composant avec horloge simulée.

## 20. Scénarios de tests

- Unitaires : `buildMatchRecap` (simple, doublettes, robot), encodage/décodage (aller-retour, fuzz), formateur texte, sélection des champs sous budget.
- Composants : panneau, vue de lecture (valide, illisible).
- E2E : AC-01, AC-02 (repli), AC-04, AC-06, AC-07, AC-09.
- Terrain : AC-02 et AC-03 sur iPhone et Android, lumière de bar.

## 21. Exigences de non-régression

- E2E du lien externe (030) et de l'écran de fin X01 inchangés ; CSP inchangée.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| QR trop dense, illisible en bar | Moyen | Moyenne | Budget mesuré (Q3), niveau de correction M, taille minimale à l'écran |
| Prénoms partagés sans accord | Moyen | Faible | Partage volontaire, option initiales (Q6) |
| Récap retouché à la main dans l'URL | Faible | Moyenne | Mention « non officiel » ; aucun usage probant |
| Poids du bundle | Faible | Moyenne | Chargement à la demande, budget 044 |
| Contrat de fragment figé trop tôt | Moyen | Faible | Version `v=1`, lecture des versions antérieures garantie |

## 23. Décisions architecturales

- Contrats d'URL multiples (030, récap, thème, station) : un registre commun des contrats et de leurs versions est souhaitable (rapport 09 §11) — à porter dans V2-QR-01 ou un ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Retenir « La partie à emporter » comme signature (H.13) ? | Oui / Non | Oui (levier d'adoption sans publicité, coût 0 €) | — |
| Q2 | Jeux couverts en V1 | X01 seul / tous | X01 seul, autres via 049 | — |
| Q3 | Budget de la charge utile du QR | ≈ 200 / 300 / 400 octets | Fixer par mesure ; viser une version de QR ≤ 10 (213 octets en correction M selon ISO/IEC 18004 [à confirmer]) | — |
| Q4 | Format de la carte | Carré 1080² / portrait 1080 × 1350 | Portrait (messageries et réseaux) | — |
| Q5 | Le lecteur peut-il ajouter le récap à son propre historique ? | Non / Bouton explicite | Non en V1 | — |
| Q6 | Prénoms complets ou initiales sur la carte et le QR | Complets / Initiales / Choix | Complets par défaut, option « initiales » | — |
| Q7 | Export CSV en plus du JSON (ressaisie DfW) | Oui / Non | Non en V1 ; texte copiable suffisant | — |
| Q8 | Mesure d'adoption (taux de partage ≥ 15 % [hypothèse rapport 09]) | Cloudflare Web Analytics sans cookie / Aucune | Décision transverse H.27 ; aucune télémétrie ajoutée par cette spec | — |
| Q9 | Embarquer `qrcode` côté client ou générateur minimal (H.25) | `qrcode` / générateur SVG minimal | Décidé dans V2-QR-01 | — |

## 25. Traçabilité

- Rapports : `reports/09-innovation.md` (P6, P11, INNO-04, §6 signature n° 2), `reports/08-integrations.md` (V2-INT-06 provisoire, D4, D9), `reports/03-games.md` (§5.5).
- Compte rendu : D.4, E (rang 4), F.6, G (lot 4), H.13, H.25, H.27.
- Issue historique #46 (fermée NOT_PLANNED le 24/04/2026).
- Specs liées : 030, 092, 097, 101, 049, 044.
