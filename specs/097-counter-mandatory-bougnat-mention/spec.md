---
id: 097-counter-mandatory-bougnat-mention
v2_id: V2-BRAND-05
titre: Mention Bougnat Darts obligatoire (co-branding)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: perso
priorite: P2
difficulte: S
recommandation: recommande
lot: 4
poids: 20
depend_de: [V2-BRAND-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 097 — Mention Bougnat Darts obligatoire (co-branding)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 §5.7 : la personnalisation par un club ou un bar ne doit pas transformer Bougnat Darts en « marque blanche ». Le rapport 05 (§6.5) propose une mention **non désactivable**, rendue hors du descripteur de thème, et quatre formules graphiques ; le compte rendu (§C.7) retient « logo club + BOUGNAT DARTS réduit » en en-tête de jeu et, sur la TV, pastille « Powered by », intermède avec QR « Jouez avec Bougnat Darts » et liseré « feu ». La formule exacte reste à arbitrer (H.17).

## 2. Problématique
Sans règle explicite, la mention peut disparaître : thème qui la rend illisible, écran qui ne l'affiche pas, champ de configuration qui la masque. L'identité Bougnat est aussi le levier d'adoption sans publicité dans les lieux (rapport 05 §6.6).

## 3. Objectifs
- Mention présente et lisible sur **tous** les écrans de jeu et **toutes** les vues TV, quel que soit le thème.
- Aucun réglage, champ de thème, lien ou fichier ne peut la masquer.
- Mention discrète : elle ne gêne ni les scores ni le pavé de saisie.

## 4. État actuel vérifié dans le code
- [vérifié] Le mot-symbole « BOUGNAT DARTS » est dupliqué en dur : `components/match/MatchTopBar.tsx:26` (X01), `views/CricketGameView.tsx:285`, `views/CapitalGameView.tsx:171`, `components/triathlon/TriathlonGameHeader.tsx:21`, `views/GameSelectionView.tsx:119`, `views/HomeView.tsx:98`.
- [vérifié] `views/KillerGameView.tsx` et `views/GotchaGameView.tsx` n'affichent **aucune** mention (recherche négative de `BOUGNAT`).
- [vérifié] Pas de composant de marque partagé ; couleurs codées en dur (`text-white`, `text-orange-500`).
- [vérifié] Aucune vue TV n'existe à ce jour (rapport 07) ; aucune personnalisation n'existe.
- [hypothèse] Le code est sous licence MIT : un fork peut retirer la mention ; la règle vise l'application officielle déployée.

## 5. Comportement cible
Deux composants de présentation non paramétrables par le thème : `BrandMark` (mot-symbole BOUGNAT DARTS, tailles normalisées) et `CoBrandHeader` (`[logo club] Nom du lieu` + séparateur + `BrandMark` réduit). Sans thème club, les écrans de jeu affichent `BrandMark` comme aujourd'hui. Avec thème club, ils affichent `CoBrandHeader`. Sur la TV, une zone fixe porte « Powered by Bougnat Darts » (formule à arbitrer), y compris sur l'écran d'attente. Les couleurs de la mention sont dérivées pour garantir ≥ 4,5:1 sur la surface, indépendamment des graines du club.

## 6. Périmètre
### Inclus
Composants `BrandMark` / `CoBrandHeader`, remplacement des 6 duplications, ajout sur Killer et Gotcha, zone TV fixe (contrat pour 086/089/098), règles de taille et de contraste, tests de présence.
### Exclu
Écran d'intermède TV avec QR (lié aux specs TV ; proposé en Q3), liseré « feu » (alternative graphique, Q2), affiche de station (100, qui réutilise `BrandMark`), récap partageable (102).

## 7. User stories
- En tant que Bougnat Darts, je veux que chaque écran de jeu et chaque TV porte la mention, afin de préserver l'identité et la visibilité sans publicité.
- En tant que club, je veux voir mon logo et mon nom en premier, la mention Bougnat restant discrète.
- En tant que joueur, je veux que la mention ne réduise pas la place des scores.

## 8. Règles métier
- RM-01 La mention n'est pas un champ du `ThemeDescriptor` (093) ; tout champ tiers prétendant la masquer est ignoré.
- RM-02 La mention est présente sur : écrans de jeu des 6 jeux, vues TV (attente, partie, fin), et toute sortie imprimable ou image produite par l'application (100, 102).
- RM-03 Taille minimale : en-tête de jeu, hauteur de capitale ≥ 10 px CSS ; TV, ≥ 2 % de la hauteur de l'écran [valeurs à valider sur maquette].
- RM-04 Contraste ≥ 4,5:1 avec la surface, calculé par 093 sur des couleurs non personnalisables.
- RM-05 La mention ne peut être ni recouverte par le logo du club ni tronquée ; en cas de manque de place, le nom du lieu est tronqué en premier.

## 9. Parcours utilisateurs
Aucun parcours propre : la mention est visible passivement. Le parcours de base est inchangé.

## 10. Exigences fonctionnelles
- FR-01 Créer `BrandMark` (tailles `sm`, `md`, `tv`) et remplacer les 6 duplications existantes, à rendu identique sans thème club.
- FR-02 Créer `CoBrandHeader` utilisé dans les en-têtes de jeu lorsque le thème club actif a un nom de lieu ou un logo.
- FR-03 Ajouter la mention aux écrans Killer et Gotcha.
- FR-04 Définir une zone TV fixe « Powered by Bougnat Darts » consommée par les vues TV (086, 089) et l'écran d'attente (098).
- FR-05 Couleurs de la mention issues de tokens non personnalisables (`fg-subtle` dérivé) ; contraste vérifié par 093.
- FR-06 Attributs de test stables (`data-testid="bougnat-brandmark"`) et nom accessible « Bougnat Darts ».
- FR-07 Aucune option de réglage, de station, de lien ou de fichier ne permet de masquer la mention (vérification par test sur les schémas 093, 096, 100).

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : mention lisible (RM-03, RM-04), non annoncée de façon répétitive par les lecteurs d'écran (une fois par écran).
- NFR-02 Mise en page : aucune perte de hauteur pour les scores sur téléphone et tablette (vérification par captures 027/028).
- NFR-03 Compatibilité avec la résilience à l'échelle de police (021).
- NFR-04 Coût récurrent : 0 €.

## 12. Cas nominaux et alternatifs
- Sans thème club : mot-symbole actuel, rendu inchangé.
- Avec thème club : `[logo] Club des Volcans | BOUGNAT DARTS`.
- TV : bandeau club + pastille fixe.

## 13. Cas limites
- Nom de lieu de 40 caractères sur téléphone portrait : nom tronqué avec ellipse, mention intacte.
- Logo très large (4:1) : hauteur bornée, mention intacte.
- Thème aux couleurs proches de la mention : la mention garde ses couleurs dérivées (RM-04).

## 14. Gestion des erreurs
Sans objet : composant statique, sans donnée externe hors nom et logo déjà validés (093, 095).

## 15. Impacts architecturaux
Présentation uniquement (`src/presentation/brand/`). Aucun impact sur le domaine de jeu. Les vues TV dépendent du composant, pas l'inverse.

## 16. Impacts sur les données et les interfaces
Aucune donnée. Contrainte de schéma : aucun champ de masquage dans 093, 096, 100.

## 17. Compatibilité avec l'existant
Rendu identique sans thème club (captures de référence). Les en-têtes existants sont factorisés.

## 18. Dépendances
Bloquante : V2-BRAND-01 (093). Liées : V2-DS-02 (064, composants de base), V2-TV-06 (086) et V2-TV-08 (089) pour la zone TV, V2-BRAND-06 (098), V2-STATION-01 (100), V2-SHARE-01 (102).

## 19. Critères d'acceptation
- AC-01 Pour chacun des 6 jeux, avec et sans thème club, l'écran de jeu contient un élément `bougnat-brandmark` visible (E2E sur projets téléphone, tablette, bureau).
- AC-02 Avec un descripteur contenant `branding: { hidden: true }` ou `showBougnat: false`, la mention reste affichée.
- AC-03 Contraste de la mention ≥ 4,5:1 pour chaque preset et pour 100 graines aléatoires (test unitaire de matrice).
- AC-04 Sans thème club, captures des en-têtes X01, Cricket, Capital et Triathlon identiques à la référence.
- AC-05 Nom de lieu de 40 caractères sur 360 px de large : mention entièrement visible, nom tronqué.
- AC-06 Vue TV (dès qu'elle existe) : zone « Powered by Bougnat Darts » visible sur attente, partie et fin.

## 20. Scénarios de tests
Unitaires (contraste, schémas sans champ de masquage) ; composants ; E2E de présence par jeu ; régression visuelle des en-têtes (041).

## 21. Exigences de non-régression
Hauteur utile des scores (027, 028, 021) ; en-têtes existants sans thème.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Rejet des lieux souhaitant une marque blanche | Faible | Faible | Mention discrète, valeur gratuite expliquée |
| Encombrement sur téléphone | Moyen | Moyenne | Taille `sm`, troncature du nom de lieu |
| Oubli sur un futur écran | Moyen | Moyenne | Test E2E par jeu, composant d'en-tête commun |

## 23. Décisions architecturales
Mention hors descripteur de thème ; composant unique. Pas d'ADR dédié.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Formulation (H.17) | « Powered by Bougnat Darts » / « Scoring par Bougnat Darts » / « avec Bougnat Darts » | « Scoring par Bougnat Darts » (français) | À prendre |
| Q2 | Formules graphiques | 1 (en-tête) / 2 (pastille) / 3 (intermède QR) / 4 (liseré) | 1 sur les écrans de jeu ; 1 + 2 + 3 sur la TV ; 4 en alternative design | À prendre |
| Q3 | Intermède TV avec QR « Jouez avec Bougnat Darts » | Dans cette spec / dans les specs TV | Dans les specs TV (086/089), avec QR via 092 | À prendre |
| Q4 | Tailles minimales | Valeurs RM-03 / autres | Valider sur maquette et à 3-5 m | À prendre |

## 25. Traçabilité
Rapport 05 §2.1, §6.5, §6.6 ; rapport 07 §6.5 ; compte rendu §C.7, H.17. Specs liées : 093, 098, 086, 089, 100, 102, 021, 027, 028.
