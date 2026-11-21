---
id: 093-counter-club-theme-model
v2_id: V2-BRAND-01
titre: Modèle de thème club (graines, dérivation, garde-fous)
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
depend_de: [V2-DS-01, V2-DS-04]
remplace: []
remplacee_par: []
issue: '#267'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 093 — Modèle de thème club (graines, dérivation, garde-fous)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 §5.7 : permettre aux clubs et bars d'afficher Bougnat Darts à leurs couleurs. Le rapport 05 (§4.2 à §4.5, §6.1) et le compte rendu (§C.7, §D.3) recommandent un **thème club = surcharge de quelques tokens dérivés** du système unique de tokens (V2-DS-01, 063), et non un système parallèle. Cette spec définit le **modèle** (descripteur, validation, dérivation, garde-fous) sur lequel s'appuient l'éditeur (094), le logo (095), le partage (096), la mention obligatoire (097), la TV (098) et la station (100).

## 2. Problématique
Une couleur choisie librement peut rendre les scores illisibles ou entrer en collision avec la sémantique de jeu (bust rouge, cible fermée verte). Sans modèle strict et validé, chaque point d'entrée (éditeur, fichier, lien, TV) deviendrait une surface d'injection ou d'illisibilité.

## 3. Objectifs
- Un format pivot unique, versionné et sérialisable : `ThemeDescriptor`.
- 1 à 3 couleurs « graines » suffisent ; toutes les autres valeurs sont **dérivées**.
- Contrastes WCAG garantis automatiquement ; couleurs métier de jeu protégées.
- Validation identique à chaque entrée ; repli sûr vers le thème officiel ; jamais de CSS libre.

## 4. État actuel vérifié dans le code
- [vérifié] Aucun token de couleur : `src/styles/tailwind.css` ne contient ni `@theme` ni variable `--color-*` ; la palette Tailwind est utilisée directement dans le JSX (rapport 05 §2.1-2.2 : 1 465 usages dans 48 fichiers).
- [vérifié] L'orange est surchargé de sens (marque, joueur actif, triple, vies Killer, minuteur) : ex. `components/match/MatchTopBar.tsx:26` (mot-symbole), rapport 05 §2.3.
- [vérifié] Aucune préférence d'apparence persistée : `utils/appPersistence.ts:1-3` ne gère que la session et les drapeaux de mise à jour ; IndexedDB `bougnat-counter-local` v1 avec trois stores (`src/infrastructure/local/IndexedDBSessionRepository.ts:10-14`).
- [vérifié] Modèle de validation à imiter : `src/features/external-match/externalMatchLink.ts` (version de contrat `:49`, motifs de rejet typés `:23-35`, `MAX_NAME_LENGTH = 32` `:65`, nettoyage des noms `:148`).
- [vérifié] `index.html:7` fixe `theme-color` à `#1a1a1a` ; `index.html:21-28` style inline du `body`.
- [hypothèse] Les noms de tokens (`brand`, `game-*`) seront fixés par 063 et 066, non encore rédigées : les noms ci-dessous sont indicatifs.

## 5. Comportement cible
Un module **pur** `src/features/theming/` (aucun DOM, aucun stockage) fournit :
1. le type `ThemeDescriptor` (schéma 1) ;
2. `validateThemeDescriptor(input) → { ok, descriptor } | { ok: false, issue }` (liste blanche de propriétés) ;
3. `deriveThemeTokens(descriptor, mode) → Record<TokenName, Hex>` (valeurs prêtes à poser en variables CSS) avec un rapport d'ajustements (`adjusted`, `gameActiveFollowsBrand`) ;
4. les fonctions `contrastRatio`, `ensureContrast`, `deltaEOk` ;
5. les presets officiels sous forme de descripteurs.
L'infrastructure (`themeDom.ts`, `themeStorage.ts`) applique et persiste ; la présentation consomme. Un thème club s'applique **par-dessus** le mode effectif (sombre/clair de 069) : il contient des graines, pas un mode figé.

## 6. Périmètre
### Inclus
Descripteur, validation, dérivation, garde-fous, presets, stockage local du thème actif et de la bibliothèque (≤ 10), application au DOM, repli.
### Exclu
Éditeur (094), logo (095, seule la référence est modélisée), partage (096), TV (098), mention Bougnat (097, **hors descripteur**), images de fond, polices personnalisées, personnalisation des couleurs de jeu.

## 7. User stories
- En tant que club, je veux définir une couleur principale et obtenir une interface cohérente et lisible sans connaissance technique.
- En tant que joueur, je veux que le bust, la cible fermée et le score restent reconnaissables quel que soit le thème.
- En tant que mainteneur, je veux qu'un thème importé ne puisse jamais injecter de CSS ni bloquer une partie.

## 8. Règles métier
- RM-01 Graines personnalisables : `brand` (obligatoire), `brand2`, `accent`, `surfaceTint` (facultatives, dérivées si absentes).
- RM-02 Textes, scores, focus, feedback et couleurs de jeu (`game-*` de 066) ne sont **pas** personnalisables.
- RM-03 `game-active` peut suivre `brand` seulement si la distance perceptuelle (ΔE OKLab) avec `game-bust`, `game-closed` et `success` dépasse un seuil (proposé 0,12, à calibrer) ; sinon il garde la valeur officielle.
- RM-04 La mention Bougnat Darts n'est pas un champ du descripteur ; aucun champ ne peut la masquer (097).
- RM-05 Un descripteur invalide n'empêche jamais de jouer : retour au thème officiel et message non bloquant.

## 9. Parcours utilisateurs
Aucun parcours propre (modèle). Le parcours de base (ouvrir → jeu → prénoms → jouer) est inchangé : sans thème club, l'application est strictement identique.

## 10. Exigences fonctionnelles
- FR-01 Schéma `ThemeDescriptor` v1 : `schema: 1`, `id` (local), `name` (≤ 32 caractères), `orgName?` (≤ 40), `seeds { brand, brand2?, accent?, surfaceTint? }` au format `#rrggbb`, `preferredMode?` (`dark` | `light`, suggestion), `logo?` (référence : `sha256`, `mime`, `w`, `h`, `bytes`).
- FR-02 Validation par **liste blanche** : seules les propriétés de FR-01 sont lues et conservées ; les autres sont ignorées et jamais persistées ni réémises ; version inconnue → `unsupported-schema`.
- FR-03 Textes : normalisation NFC, suppression des caractères de contrôle et des marques bidirectionnelles (U+202A-202E, U+2066-2069), coupe par graphèmes, rendu uniquement en nœud texte.
- FR-04 Couleurs : seul `#rrggbb` est accepté (pas de nom, `rgb()`, `url()`, `var()`, `;`).
- FR-05 Dérivation : `on-brand`/`on-accent` (noir ou blanc au meilleur contraste), `brand-hover`/`brand-pressed` (±6-10 % de luminance), `brand-subtle` (mélange pré-calculé), `brand-fg` (≥ 4,5:1 sur `canvas` et `surface`), surfaces teintées.
- FR-06 Contraste : 4,5:1 texte, 3:1 grand texte et non-texte, objectif 7:1 pour les scores en contexte TV ; `ensureContrast` ajuste la luminance et signale l'ajustement.
- FR-07 Clamp des surfaces : en sombre L ∈ [0,08 ; 0,22], en clair L ∈ [0,94 ; 1] (OKLCH), chroma bornée.
- FR-08 Sorties en hex/rgba **pré-calculées** (pas de `color-mix()`, pas d'oklch dans les valeurs posées) pour les navigateurs anciens et TV (018).
- FR-09 Presets officiels (6 à 8, noms à arbitrer) livrés comme descripteurs validés par les mêmes tests.
- FR-10 Persistance : `localStorage['bougnat-theme-v1']` = identifiant du thème actif + descripteur sans logo + variables dérivées (lecture synchrone pour l'anti-flash de 069) ; bibliothèque (≤ 10 descripteurs) et logos en IndexedDB (voir Q2).
- FR-11 Application : `themeDom.ts` pose les variables dérivées sur `<html>` et met à jour `theme-color` ; jamais de feuille de style construite à partir de chaînes utilisateur.
- FR-12 Réinitialisation : « Restaurer les couleurs Bougnat » supprime la surcharge sans effacer la bibliothèque.

## 11. Exigences non fonctionnelles
- NFR-01 Module pur, sans dépendance externe (~150-250 lignes estimées pour le calcul colorimétrique).
- NFR-02 Dérivation ≤ 5 ms par thème sur tablette milieu de gamme [à mesurer] ; aucun calcul au démarrage (valeurs stockées).
- NFR-03 Accessibilité : WCAG 1.4.3, 1.4.11, 1.4.1 (doublage par la forme assuré par 066).
- NFR-04 Sécurité : aucune chaîne utilisateur dans un sélecteur, une règle CSS ou du HTML.
- NFR-05 Confidentialité : aucune donnée de thème envoyée à un serveur ; coût récurrent 0 €.

## 12. Cas nominaux et alternatifs
- Nominal : graine `brand` seule → toutes les valeurs dérivées, contrastes conformes.
- Alternatif : club rouge → `game-active` ne suit pas la marque, indicateur « couleur de jeu non suivie » remonté à l'éditeur.
- Alternatif : mode clair activé alors que `preferredMode` vaut `dark` → le mode de l'utilisateur prime.

## 13. Cas limites
- Graine noire ou blanche pure, graines identiques, `surfaceTint` très saturée.
- `localStorage` indisponible (navigation privée) : thème appliqué pour la session seulement.
- Descripteur stocké corrompu ou d'un schéma futur : repli officiel, entrée conservée pour diagnostic [à confirmer].

## 14. Gestion des erreurs
Motifs typés : `invalid-json`, `unsupported-schema`, `invalid-color`, `invalid-name`, `too-many-themes`, `storage-unavailable`. Messages en français, non bloquants.

## 15. Impacts architecturaux
- `src/features/theming/` pur ; `src/infrastructure/web/themeDom.ts` ; `src/infrastructure/local/themeStorage.ts` ; consommation en présentation.
- Le domaine de jeu n'importe jamais le thème ; la TV réutilise le même module (098).

## 16. Impacts sur les données et les interfaces
Nouvelle clé `localStorage` `bougnat-theme-v1` ; nouveau stockage IndexedDB (base dédiée recommandée, Q2). Contrat `ThemeDescriptor` v1 partagé avec 094-098 et 100.

## 17. Compatibilité avec l'existant
Sans thème club : rendu identique au Dark officiel de 063. Les sessions et l'historique ne sont pas touchés.

## 18. Dépendances
Bloquantes : V2-DS-01 (063, tokens), V2-DS-04 (066, couleurs de jeu réservées). Liées : V2-THEME-02 (069, préférence et anti-flash), V2-DS-00 (018, baseline navigateurs).

## 19. Critères d'acceptation
- AC-01 Descripteur avec seule graine `brand` valide : toutes les paires texte/fond déclarées atteignent 4,5:1 (3:1 pour non-texte), vérifié par test de matrice en sombre et en clair.
- AC-02 Descripteur contenant `css`, `style`, `branding.hidden` ou toute propriété inconnue : propriétés absentes du descripteur validé et du stockage.
- AC-03 Couleur `red; background:url(x)` ou `rgb(1,2,3)` : rejet `invalid-color`.
- AC-04 Graine `brand` proche de `game-bust` (ΔE < seuil) : `game-active` reste officiel, rapport `gameActiveFollowsBrand: false`.
- AC-05 Nom contenant U+202E et des caractères de contrôle : supprimés, longueur ≤ 32 graphèmes.
- AC-06 Descripteur stocké corrompu : l'application démarre avec le thème officiel et une partie peut être lancée.
- AC-07 Chaque preset officiel passe AC-01.

## 20. Scénarios de tests
Unitaires (validation, dérivation, contraste, ΔE, clamp, presets, sérialisation aller-retour) ; propriétés aléatoires (graines aléatoires → contrastes toujours conformes) ; composant (application des variables) ; E2E (thème actif persistant après rechargement, repli sur corruption).

## 21. Exigences de non-régression
Rendu Dark officiel inchangé sans thème ; scores, bust et cibles fermées identiques ; temps de démarrage inchangé.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Tokens 063/066 non livrés | Bloquant | Moyenne | Dépendance explicite, pas de démarrage avant |
| Seuil ΔE mal calibré (daltonisme) | Moyen | Moyenne | Calibrage sur simulateurs de daltonisme, test utilisateurs |
| Thème illisible en conditions réelles (bar) | Moyen | Faible | Clamp, contrastes auto, bouton « Restaurer » |
| Navigateurs anciens (oklch, `color-mix`) | Élevé | Moyenne | Valeurs pré-calculées en hex (FR-08) |

## 23. Décisions architecturales
Format pivot unique pour stockage, export, lien, QR et TV. ADR recommandé si le PO valide (« thème = surcharge de tokens dérivés, jamais de CSS libre »).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Le joueur actif peut-il suivre la couleur du club (H.16) ? | Oui sous garde-fou ΔE / toujours orange Bougnat | Oui sous garde-fou | À prendre |
| Q2 | Stockage IndexedDB | Base dédiée `bougnat-theming` / nouveau store dans `bougnat-counter-local` (montée de version) | Base dédiée (aucune migration de la base des sessions) | À prendre |
| Q3 | Propriété inconnue à l'import | Ignorée silencieusement / ignorée avec avertissement / rejet total | Ignorée avec avertissement discret | À prendre |
| Q4 | Noms des presets (« Braise », « Craie »…) | Liste rapport 05 / autre | Valider sur maquette | À prendre |
| Q5 | Seuil ΔE | 0,10 / 0,12 / 0,15 | 0,12 puis calibrage | À prendre |

## 25. Traçabilité
Rapport 05 §2.1-2.3, §4.2-4.5, §6.1 ; compte rendu §C.7, §D.3, H.16-H.17. Specs liées : 063, 066, 069, 094, 095, 096, 097, 098, 100.
