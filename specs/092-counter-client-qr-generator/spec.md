---
id: 092-counter-client-qr-generator
v2_id: V2-QR-01
titre: Générateur de QR côté client partagé
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: archi
priorite: P1
difficulte: S
recommandation: recommande
lot: 3
poids: 30
depend_de: []
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 092 — Générateur de QR côté client partagé

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Plusieurs propositions V2 ont besoin d'afficher un QR code construit **à l'exécution** : partage de thème (V2-BRAND-04, 096), « Station en un scan » (V2-STATION-01, 100), appairage et lien spectateur TV (V2-TV-07, 088), retour du résultat partenaire (V2-INT-04, 107), récap à emporter (V2-SHARE-01, 102). Sans brique commune, chaque fonctionnalité risquerait d'embarquer sa propre bibliothèque ou de recourir à un service tiers. Sources : rapport 05 §2.7 et §6.4, rapport 07 §2.4, rapport 08 (V2-INT-04, décision D5), rapport 09 (INNO-04, INNO-05), compte rendu §D.3 et question H.25.

## 2. Problématique
L'application ne sait produire qu'un QR **statique**, généré au build. Aucun QR dynamique n'est possible sans ajouter du code au bundle client, et ce code ne doit ni alourdir le parcours de base ni mélanger des contenus de nature et de sensibilité différentes.

## 3. Objectifs
- Fournir **un seul** service de rendu QR, chargé à la demande, réutilisé par tous les consommateurs.
- Garder chaque **payload distinct** : le générateur rend une chaîne déjà construite et validée par la fonctionnalité propriétaire ; il ne connaît pas les contrats.
- Coût nul au démarrage : aucun octet de la bibliothèque QR dans les chunks initiaux.
- Fonctionnement hors ligne une fois le chunk mis en cache (dépend de 031).

## 4. État actuel vérifié dans le code
- [vérifié] `qrcode` ^1.5.4 est une dépendance **de production** (`package.json:34`) mais n'est importée que par `scripts/generate-app-qr.mjs:3`, exécuté au build ; il écrit `public/app-qr.svg` avec `errorCorrectionLevel: 'M'` et `margin: 1` (`scripts/generate-app-qr.mjs:35-38`).
- [vérifié] L'accueil affiche ce SVG statique : `views/HomeView.tsx:44` (`/app-qr.svg?appUrl=…`) et `:191` (`<img src={qrUrl}>`), bouton « Partager L'App » (`:141`).
- [vérifié] Aucune génération de QR à l'exécution, aucun `dangerouslySetInnerHTML` dans les `.tsx` du repo.
- [vérifié] Les vues sont déjà chargées à la demande (`App.tsx:54-62`, `lazy(() => import(...))`) : le découpage en chunks est un mécanisme en place.
- [vérifié] CSP : `img-src 'self' data: blob: https:` (`public/_headers:2`) autorise un QR affiché en `data:` ou `blob:` sans modification.
- [vérifié, mesure locale] Les sources navigateur de `qrcode` (`lib/browser.js`, `lib/core/*`, rendu SVG) pèsent ~18,7 Ko gzip **non minifiés** ; le chunk minifié réel est [à confirmer] par build (hypothèse rapport 05 : 10-15 Ko gzip ; rapport 09 : 20-30 Ko).
- [vérifié, calcul avec `qrcode` 1.5.4] Un lien de thème d'environ 186 caractères donne un QR version 10 (57×57 modules) au niveau M ; un lien de station d'environ 284 caractères donne une version 12 (65×65). L'URL de l'app (28 caractères) donne une version 3.
- [vérifié] La marge du QR statique (1 module) est inférieure à la zone de silence de 4 modules recommandée par ISO/IEC 18004 [à confirmer impact terrain].

## 5. Comportement cible
Un composant de présentation `QrCode` reçoit un **payload typé** `{ kind, text }` produit par la fonctionnalité propriétaire. Il charge à la demande un adaptateur d'infrastructure qui encode le texte en SVG, puis l'affiche dans un `<img>` (URL `blob:` ou `data:`), jamais par injection de balisage. Il affiche toujours, à côté du QR, une alternative textuelle (lien copiable) et un libellé décrivant l'usage. Si l'encodage échoue (texte trop long, chunk indisponible), un message non bloquant remplace le QR et le lien reste disponible.

## 6. Périmètre
### Inclus
- Port `QrEncoder` (application) et adaptateur `qrcode` chargé par `import()` dynamique.
- Composant `QrCode` accessible, avec états chargement / prêt / erreur.
- Type `QrPayloadKind` fermé (`theme`, `station`, `tv-viewer`, `partner-result`, `recap`) et plafond de longueur par type.
- Garde de bundle : la bibliothèque n'apparaît dans aucun chunk initial.
### Exclu
- Les contrats des payloads (propriété de 088, 096, 100, 102, 107).
- La lecture de QR (scanner) : les appareils utilisent leur appareil photo natif.
- Le QR statique de l'accueil (inchangé ; voir Q2).
- Tout service de génération QR tiers (fuite de données, dépendance réseau).

## 7. User stories
- En tant que responsable de club, je veux afficher un QR de mon thème sur la tablette, afin que les membres le scannent.
- En tant que joueur, je veux que l'application démarre aussi vite qu'avant, même si la fonction QR existe.
- En tant que développeur, je veux une seule API QR, afin de ne pas dupliquer la bibliothèque ni la logique d'accessibilité.

## 8. Règles métier
- RM-01 Le générateur n'interprète jamais le contenu : il encode une chaîne déjà construite et validée par le propriétaire du payload.
- RM-02 Un QR porte **un seul** type de payload ; un QR de thème ne contient jamais de jeton spectateur, de résultat ou de récap, et inversement.
- RM-03 Le logo n'est **jamais** encodé dans un QR (taille et densité ; voir 096 et 100).
- RM-04 Les payloads porteurs d'une capacité (jeton spectateur TV, 088) restent dans le fragment d'URL (`#…`), non transmis au serveur ; le générateur ne les journalise ni ne les persiste.

## 9. Parcours utilisateurs
1. L'utilisateur ouvre une fonctionnalité secondaire (ex. « Partager le thème »).
2. Le composant `QrCode` affiche un état de chargement, charge le chunk QR, puis le QR.
3. Sous le QR : le libellé d'usage, le lien (bouton « Copier le lien »), et, si disponible, « Partager » (Web Share) [à confirmer selon consommateur].
4. Hors ligne et chunk absent du cache : message « QR indisponible hors ligne, utilisez le lien ».

## 10. Exigences fonctionnelles
- FR-01 Exposer un port `QrEncoder.encodeSvg(text, options) → Promise<string>` sans dépendance au DOM, implémenté dans `src/infrastructure/web/qrcodeEncoder.ts` via `import('qrcode')`.
- FR-02 Exposer un composant `QrCode` (`payload`, `label`, `size`) affichant le SVG via `<img>` avec une URL `blob:` révoquée au démontage (ou `data:` en repli).
- FR-03 Définir `QrPayloadKind` et une table de plafonds de longueur par type (valeurs proposées : `theme` ≤ 400 octets, `station` ≤ 600, `tv-viewer` ≤ 200, `partner-result` et `recap` fixés par leurs specs) ; au-delà, refus typé `payload-too-long`.
- FR-04 Niveau de correction par défaut `M`, zone de silence de 4 modules, couleurs **noir sur blanc** non thémables (lisibilité des lecteurs).
- FR-05 Afficher toujours une alternative textuelle (lien copiable) et un `alt` décrivant l'usage (« QR code pour appliquer le thème du club »), jamais le contenu brut.
- FR-06 Mémoriser le module chargé (une seule résolution de `import()` par session).
- FR-07 Exposer `estimateQrVersion(text)` (ou équivalent) pour que les consommateurs testent leurs plafonds.

## 11. Exigences non fonctionnelles
- NFR-01 Performance : 0 octet de `qrcode` dans les chunks chargés par l'accueil, la sélection de jeu, le setup et les écrans de jeu ; chunk QR ≤ 15 Ko gzip [à mesurer, à reporter dans V2-PERF-01 (044)].
- NFR-02 Temps d'affichage d'un QR ≤ 300 ms après chargement du chunk sur tablette milieu de gamme [à confirmer sur appareil].
- NFR-03 Accessibilité : contraste QR maximal, taille d'affichage ≥ 200 px CSS sur tablette, focus visible sur « Copier le lien » (V2-DS-02).
- NFR-04 Sécurité : aucun `dangerouslySetInnerHTML` ; aucun appel réseau autre que le chargement du chunk same-origin ; CSP inchangée.
- NFR-05 Compatibilité : chunk transpilé par la chaîne legacy existante (`vite.config.ts:29-30`) ; comportement sur iOS 12 [à confirmer, dépend de 018].
- NFR-06 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : payload valide, chunk chargé, QR affiché.
- Alternatif : Web Share indisponible → seul « Copier le lien » est proposé.
- Alternatif : presse-papiers refusé → le lien est affiché sélectionnable.

## 13. Cas limites
- Payload vide ou au-delà du plafond → pas de QR, message explicite au développeur (test) et à l'utilisateur.
- Caractères non ASCII (nom de club accentué) : encodage UTF-8 en mode octet ; vérifier la lecture par les appareils photo iOS et Android [à confirmer].
- Démontage pendant le chargement : aucune fuite d'URL `blob:`, aucune mise à jour d'état après démontage.

## 14. Gestion des erreurs
Erreurs typées : `chunk-load-failed`, `payload-too-long`, `encode-failed`. Aucune n'interrompt le parcours ; toutes laissent le lien textuel disponible.

## 15. Impacts architecturaux
- Application : port `QrEncoder` (pur). Infrastructure : adaptateur `qrcode`. Présentation : composant `QrCode`.
- Direction : les features (thème, station, TV, intégrations) dépendent du port, jamais de `qrcode`. Les règles de jeu ne dépendent de rien de tout cela.
- Pas de registre générique de payloads : chaque feature garde son contrat et son validateur.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Nouveau contrat interne `QrPayload { kind: QrPayloadKind; text: string }`.

## 17. Compatibilité avec l'existant
QR statique de l'accueil et script de build inchangés. `qrcode` reste en `dependencies` (déjà le cas) : aucune modification de `package.json`.

## 18. Dépendances
Aucune dépendance bloquante. Liées : 031 (V2-REL-02, précache du chunk pour le hors-ligne), 044 (V2-PERF-01, budget de chunk), 018 (V2-DS-00, baseline navigateurs). Consommateurs : 088, 096, 100, 102, 107.

## 19. Critères d'acceptation
- AC-01 Build de production : aucun chunk initial (accueil → setup → jeu) ne contient de module `qrcode` ; preuve : analyse du manifeste de build en CI.
- AC-02 Ouvrir un consommateur QR : le chunk QR est chargé une seule fois, le QR s'affiche et se lit avec l'appareil photo d'un iPhone et d'un Android [à confirmer sur appareils].
- AC-03 Payload de 401 octets de type `theme` : refus `payload-too-long`, lien textuel affiché.
- AC-04 Chunk indisponible (hors ligne simulé) : message non bloquant, lien textuel affiché, aucune erreur non gérée.
- AC-05 Le QR rendu a une zone de silence ≥ 4 modules et est noir sur blanc quel que soit le thème actif.
- AC-06 Le `alt` décrit l'usage et ne contient pas le payload ; navigation clavier jusqu'à « Copier le lien » avec focus visible.

## 20. Scénarios de tests
- Unitaires : plafonds par type, erreurs typées, cache du module (mock de `import()`).
- Composants : états chargement / prêt / erreur, révocation de l'URL `blob:` au démontage.
- E2E : lecture du SVG produit et décodage par une bibliothèque de test [à choisir, devDependency à arbitrer] ou comparaison de la matrice.
- Terrain : lecture à 30 cm et 1 m, écran tablette et impression A4.

## 21. Exigences de non-régression
Accueil, QR statique, temps de démarrage et taille des chunks initiaux inchangés.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Chunk plus lourd qu'estimé | Moyen | Moyenne | Mesure au build ; alternative plus légère [à étudier] |
| Mélange de payloads (jeton TV dans un QR de thème) | Élevé | Faible | `kind` fermé, constructeurs séparés, tests par consommateur |
| QR trop dense illisible | Moyen | Moyenne | Plafonds par type, niveau M, test terrain |
| Chunk absent hors ligne | Faible | Moyenne | Précache via 031, lien textuel toujours affiché |

## 23. Décisions architecturales
Décision proposée : embarquer `qrcode` côté client en chargement différé (H.25), sans ADR dédié si le PO valide cette spec.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Embarquer `qrcode` côté client ? | `qrcode` en lazy / encodeur minimal maison / bibliothèque plus légère | `qrcode` en lazy (déjà dépendance, MIT, éprouvée) | À prendre |
| Q2 | Migrer le QR statique de l'accueil vers le générateur ? | Garder le SVG statique / migrer | Garder le statique (0 coût au démarrage) | À prendre |
| Q3 | Corriger la marge (1 → 4 modules) du QR statique ? | Oui (script de build) / non | Oui, via une tâche distincte après test terrain | À prendre |
| Q4 | Plafonds par type | Valeurs FR-03 / autres | Valeurs FR-03, à ajuster après test terrain | À prendre |
| Q5 | Outil de décodage pour les tests | `jsqr` en devDependency / comparaison de matrice | Comparaison de matrice (aucune dépendance) | À prendre |

## 25. Traçabilité
Rapports 05 §2.7, §6.4 ; 07 §2.4 ; 08 V2-INT-04 / D5 ; 09 INNO-04, INNO-05 ; compte rendu §D.3, §F.6, H.25. Specs liées : 031, 044, 088, 096, 100, 102, 107.
