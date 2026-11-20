---
id: 042-counter-qa-real-device-matrix
v2_id: V2-QA-09
titre: Matrice d'appareils et de viewports réalistes
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: qualite
priorite: P0
difficulte: M
recommandation: recommande
lot: 1
poids: 30
depend_de: []
remplace: []
remplacee_par: []
issue: '#224'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 042 — Matrice d'appareils et de viewports réalistes

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Le rapport 06 (tablette) a mesuré en émulation qu'un iPad 10,2" en Safari paysage (1080×750) ou une Galaxy Tab 1280×800 reçoivent la mise en page téléphone, avec un clavier X01 écrasé et la ligne Bull du Cricket coupée — défauts **invisibles pour la CI** parce que les tests tablette forcent le mode tablette et utilisent des viewports « nus ». Le compte rendu V2 (§C.3, §F.1) classe la matrice réaliste en P0, avec le résolveur de taille (V2-TAB-01, spec 070) et les correctifs tablette (V2-TAB-02, spec 071). Cette spec reprend aussi la proposition V2-TAB-09 du rapport 06.

## 2. Problématique

Les tests d'affichage ne reproduisent pas les conditions réelles (barres de navigateur, absence de mode forcé, Android, Firefox) : ils sont verts alors que l'usage cible de la V2 — tablette paysage dans un onglet — est dégradé.

## 3. Objectifs

- O1 : des projets Playwright aux viewports réalistes (barres de navigateur déduites), **sans** `?mode=dedicated_tablet`.
- O2 : des assertions utiles : recette d'affichage attendue, actions primaires visibles et ≥ 48 px, lignes de jeu complètes, score lisible.
- O3 : une couverture moteur élargie (Chromium Android émulé, Firefox desktop) en exécution planifiée.
- O4 : un protocole de test terrain reproductible avant chaque release.

## 4. État actuel vérifié dans le code

- [vérifié] `tests/e2e/tablet-layout.smoke.spec.ts:17` ouvre `/?mode=dedicated_tablet`, ce qui force `isTablet` (`src/features/tablet/tabletLayout.ts:36`) et contourne la détection réelle.
- [vérifié] Projets tablette : profil `iPad (gen 7)` (WebKit) avec viewports remplacés par 768×1024, 1024×768, 1024×600 (`playwright.config.ts:23-37`).
- [vérifié] Projets téléphone : `iPhone SE`, `iPhone 13` (WebKit), `iPhone 13` forcé en 844×390 (`playwright.config.ts:38-52`). Le descripteur Playwright `iPhone 13` a un viewport de 390×664 (barres incluses), contrairement aux tablettes.
- [vérifié] Aucun projet Firefox ni Chromium mobile ; aucun test du bundle legacy (`vite.config.ts:29-33`, cible `ios >= 12`).
- [vérifié] Seuils : tablette si `pointer: coarse` et petit côté ≥ 768 et grand côté ≤ 1279 (`tabletLayout.ts:22-39`) ; téléphone si petit côté < 768 (l.43-44). Le test unitaire fige `1024×600 → isSmartphone: true` (`tests/unit/tabletLayout.test.ts:71`).
- [vérifié] Seconde détection indépendante dans `views/MatchView.tsx:246-266` (`max-width: 767px` + `display-mode: standalone`).
- [vérifié] Le test tablette ne vérifie que l'absence de débordement (`tablet-layout.smoke.spec.ts:42-44`) ; la spec 027 exige des contrôles ≥ 48 px et un projet 1280×800 (`specs/027-…/spec.md:49, 57, 60`) non présents.
- [vérifié émulation, rapport 06] 1080×750 et 1280×696/752/800 → présentation téléphone ; 960×520 → score X01 à 0 px et touches Killer hors écran.
- [à confirmer] Le descripteur Playwright `Galaxy Tab S9` déclare 640×1024 en portrait, ce qui le classerait « téléphone » ; à vérifier sur appareil.

## 5. Comportement cible

Une matrice déclarative (`tests/e2e/devices/matrix.ts`) associe à chaque profil : moteur, viewport, `hasTouch`/`isMobile`, recette attendue (après 070), statut (`pr`, `nightly`, `terrain`). Un spec `tests/e2e/device-matrix.spec.ts` ouvre chaque jeu **sans paramètre de mode** et vérifie les assertions du §10. Les écarts connus avant 070/071 sont déclarés `test.fail` avec la référence de la spec corrective, pour que la matrice soit utile dès son introduction sans bloquer la CI.

Profils proposés (rapport 06, valeurs « navigateur » = hypothèses de barres) :

| Profil | Viewport | Moteur | Exécution |
|---|---|---|---|
| iPad 10,2" Safari paysage | 1080×750 | WebKit tactile | PR |
| iPad 10,2" PWA paysage | 1080×810 | WebKit tactile | nightly |
| iPad 10,2" Safari portrait | 810×1010 | WebKit tactile | PR |
| iPad Pro 12,9" paysage / portrait | 1366×950 / 1024×1292 | WebKit tactile | nightly |
| iPad mini paysage / portrait | 1133×690 / 744×1080 | WebKit tactile | nightly |
| Galaxy Tab Chrome paysage | 1280×696 | Chromium mobile | PR |
| Galaxy Tab PWA / plein écran | 1280×752 / 1280×800 | Chromium mobile | nightly |
| Galaxy Tab portrait | 800×1176 | Chromium mobile | nightly |
| Petite tablette 7-8" | 960×520 / 600×880 | Chromium mobile | nightly |
| Téléphone Android | Pixel 7 (412×839) | Chromium mobile | PR |
| iPhone SE / iPhone 13 | descripteurs Playwright | WebKit | PR (existants) |
| Bureau Firefox | 1280×720 | Firefox | nightly (parcours d'entrée seulement) |
| Bundle legacy | 1024×768 | WebKit, modules désactivés | nightly, selon décision 018 |

## 6. Périmètre

### Inclus
- Matrice déclarative, spec de matrice, nouveaux projets Playwright, exécution PR réduite et nightly complète.
- Protocole terrain (checklist par jeu et par appareil, tableau de résultats par release).
- Suppression de `?mode=dedicated_tablet` des tests d'affichage (un test dédié conserve la vérification du mode forcé).

### Exclu
- Correction des défauts (070, 071, 072, 073) et décision de baseline navigateurs (V2-DS-00, spec 018).
- TV réelles (V2-TV-11, spec 090) ; services de fermes d'appareils payants.
- Régression visuelle (041), qui réutilisera les profils.

## 7. User stories

- En tant que gérant de bar, je veux que la tablette posée en paysage affiche le clavier complet, afin que les joueurs saisissent sans erreur.
- En tant que mainteneur, je veux qu'un test échoue quand un viewport réel reçoit la mauvaise mise en page.

## 8. Règles métier

- RM-01 Aucun test d'affichage n'utilise de mode forcé, sauf le test qui vérifie ce mode.
- RM-02 Une cible tactile primaire mesure au moins 48 px CSS dans son plus petit côté sur tablette (spec 027, invariant 3).
- RM-03 Un défaut connu figure dans la matrice avec sa spec corrective ; il n'est jamais retiré silencieusement.

## 9. Parcours utilisateurs

Par profil et par jeu : accueil → sélection → setup → lancement → premier joueur → vérifications. Terrain : même parcours sur appareil réel, avec rotation et rechargement, résultat consigné.

## 10. Exigences fonctionnelles

- FR-01 Matrice déclarative unique, utilisée par `playwright.config.ts` pour générer les projets.
- FR-02 Pour chaque profil × jeu : recette attendue (attribut de mise en page exposé par 070), actions primaires dans le viewport, cibles primaires ≥ 48 px (RM-02), aucun débordement.
- FR-03 Assertions spécifiques : Cricket — 7 lignes (20→15 + Bull) visibles ; X01 — taille de police du score actif ≥ seuil (proposé : 64 px en tablette paysage) ; Killer — 21 cibles atteignables sans défilement.
- FR-04 Exécution PR : 5 profils marqués `pr` ; exécution nightly : matrice complète (via 043).
- FR-05 Défauts connus en `test.fail` référencés (070/071) jusqu'à correction.
- FR-06 Projet Firefox desktop limité aux parcours d'entrée ; projet Chromium mobile (`Pixel 7`).
- FR-07 Projet « legacy » activé seulement si 018 maintient une cible legacy.
- FR-08 Protocole terrain : liste d'appareils, version d'OS/navigateur, parcours, critères, gabarit de compte rendu ; exécuté avant chaque release mineure.

## 11. Exigences non fonctionnelles

- NFR-01 Durée PR additionnelle ≤ 3 min ; nightly ≤ 25 min [à mesurer].
- NFR-02 Coût : 0 € en CI (dépôt public) ; coût terrain ponctuel = accès à 3-4 appareils (iPad, tablette Android, petite tablette, téléphone Android) [budget à décider, H.3].
- NFR-03 L'émulation n'est pas une preuve terrain : chaque résultat indique « émulation » ou « appareil ».

## 12. Cas nominaux et alternatifs

- Nominal : 070/071 livrées → les `test.fail` deviennent des tests verts sans marqueur.
- Alternatif : nouveau profil (ex. Fire HD) → une ligne dans la matrice.

## 13. Cas limites

- iPad multitâche (fenêtre portrait sur écran paysage) : terrain seulement [à confirmer].
- `pointer: coarse` sur iPad avec trackpad ; zoom texte (spec 021) ; changement d'orientation en cours de saisie.

## 14. Gestion des erreurs

En échec : capture et trace du profil concerné, nom du profil dans le titre du test.

## 15. Impacts architecturaux

Aucun sur le code applicatif. Dépend d'un attribut de recette lisible exposé par 070 (`data-size-*` proposé par le rapport 06).

## 16. Impacts sur les données et les interfaces

Aucun.

## 17. Compatibilité avec l'existant

Les projets existants sont remplacés par la matrice ; les vérifications actuelles (débordement, rotation téléphone) sont conservées.

## 18. Dépendances

- Aucune dépendance bloquante (catalogue).
- Forte synergie : V2-TAB-01 (070) pour l'assertion de recette, V2-TAB-02 (071) pour lever les `test.fail`, V2-DS-00 (018) pour le projet legacy, V2-QA-10 (043) pour l'exécution nightly, V2-QA-04 (040) pour les objets de page.

## 19. Critères d'acceptation

- AC-01 `rg "mode=dedicated_tablet" tests/e2e` ne renvoie que le test dédié au mode forcé.
- AC-02 Au commit de livraison, le profil 1080×750 WebKit tactile exécute les 6 jeux ; les défauts connus (présentation téléphone, Bull coupé) sont en `test.fail` référencés 070/071.
- AC-03 Une cible primaire < 48 px sur un profil tablette fait échouer le test (essai sur branche jetable).
- AC-04 La nightly exécute la matrice complète, Firefox et Chromium mobile compris ; rapport publié en artefact.
- AC-05 Le protocole terrain est rédigé et a été exécuté une fois sur au moins un iPad et une tablette Android ; résultats consignés.
- AC-06 Le test unitaire `tabletLayout.test.ts:71` est revu avec 070 (pas de figement de `1024×600 → téléphone` sans décision).

## 20. Scénarios de tests

E2E par profil (livrable) ; unitaires de la table de vérité (portés par 070) ; terrain selon protocole.

## 21. Exigences de non-régression

Les vérifications de rotation téléphone (`smartphone-layout.smoke.spec.ts:34-45`) et de débordement restent couvertes.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Hauteurs de barres estimées fausses | Moyen | Moyenne | Calibrer au premier passage terrain |
| Émulation WebKit ≠ Safari réel | Moyen | Élevée | Protocole terrain obligatoire avant release |
| Durée CI | Moyen | Moyenne | PR réduite, nightly complète |
| `test.fail` oubliés | Moyen | Faible | RM-03, revue à chaque livraison 070/071 |

## 23. Décisions architecturales

Aucune ; la baseline navigateurs est décidée par 018.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Budget d'appareils de test (H.3) | Aucun / prêt / achat d'occasion (~300-500 €) | Prêt d'abord (club, contributeurs), achat d'une tablette Android d'entrée de gamme si besoin | — |
| Q2 | Firefox : smoke ou matrice complète ? | Smoke / complet | Smoke en nightly (faible part d'usage tablette [hypothèse]) | — |
| Q3 | Bundle legacy testé ? | Oui / non | Selon 018 ; non si iOS 12 abandonné | — |
| Q4 | Fermes d'appareils (BrowserStack/Sauce, programmes open source) | Oui / non | Non par défaut ; étude si le terrain est insuffisant [conditions à confirmer] | — |
| Q5 | Seuil de police du score X01 | 64 px / autre | 64 px en tablette paysage, à valider en terrain à 2-3 m | — |

## 25. Traçabilité

Rapport `docs/v2/audit/06-tablet.md` (§2.2, P4, P10, V2-TAB-09), `docs/v2/audit/10-docs-quality.md` (§3.3, V2-QA-09), `docs/v2/audit/05-design-system.md` (§2.9) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.3, §C.3, §F.1, §H.3 ; captures d'émulation de l'audit (dossier de session, hors dépôt) ; specs 018, 021, 027, 028, 070, 071.
