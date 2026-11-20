---
id: 065-counter-screen-migration-to-tokens
v2_id: V2-DS-03
titre: Migration écran par écran vers les tokens
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: design-system
priorite: P1
difficulte: L
recommandation: recommande
lot: 2
poids: 10
depend_de: [V2-DS-01, V2-QA-05]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 065 — Migration écran par écran vers les tokens

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Rapport d'audit 05 (§2.2, §4.6), compte rendu §C.2 et §G. La revue croisée a retenu que **la migration vers les tokens et la disposition « arène » (V2-TAB-03) se font dans les mêmes lots, écran par écran**, pour ne pas restyler deux fois les mêmes fichiers. Cette spec est la condition d'activation du mode Light (V2-THEME-01, « Light activé à 100 % »).

## 2. Problématique
Les écrans utilisent directement la palette Tailwind (couleurs, transparences sur blanc/noir, lueurs arbitraires) qui suppose un fond sombre. Tant qu'un écran n'est pas migré, il ne peut ni passer en Light, ni recevoir un thème club, ni être réutilisé en TV.

## 3. Objectifs
- O1. 0 classe de palette brute dans les écrans et composants à la fin de la migration (référence 1 465).
- O2. Migration sans régression visuelle Dark (captures V2-QA-05).
- O3. Ordre et lots compatibles avec V2-TAB-03 (une PR par écran : tokens + arène).
- O4. Verrouillage final empêchant la réintroduction de couleurs brutes.

## 4. État actuel vérifié dans le code
- [vérifié] 1 465 occurrences de classes de palette brute dans 48 fichiers `.ts/.tsx` hors tests (rapport 05 §2.2, recomptées au commit 508dfa6).
- [rapport 05, non recompté] 305 classes distinctes, 100 classes = 83 % des usages ; 167 transparences `*-white/x`, 46 `*-black/x` ; 100 valeurs arbitraires colorées (ombres, lueurs) ; 69 dégradés.
- [vérifié] Fichiers les plus couplés (rapport 05) : `components/game/CapitalKeypad.tsx`, `components/ui/ChangelogModal.tsx`, `views/CapitalGameView.tsx`, `views/GotchaGameView.tsx`, `views/GameSelectionView.tsx`, `views/KillerGameView.tsx`, `components/game/Keypad.tsx`, `views/HomeView.tsx`.
- [vérifié] Tests couplés aux classes de couleur : `tests/unit/components/keypads.test.tsx:106` (`text-cyan-500`), `tests/unit/components/cricketScoreboard.test.tsx:24` (`text-orange-400`), `tests/unit/x01/VoiceScoringControl.test.tsx`, `tests/unit/x01/matchScoring.test.ts` (rapport 05 : 10 assertions dans 4 fichiers).
- [vérifié] `src/features/x01/scoring/matchFeedback.ts:3-12` renvoie des classes Tailwind depuis la couche `features`.
- [vérifié] `views/MatchView.tsx` (869 lignes) et `App.tsx` (479 lignes) : migration à coordonner avec le découpage V2-ARCH-11.

## 5. Comportement cible
Chaque écran n'utilise que des rôles sémantiques (V2-DS-01), des couleurs métier réservées (V2-DS-04) et des composants de base (V2-DS-02). Les transparences et lueurs « sombres » sont remplacées par des rôles d'élévation (`surface-raised`, `border`, `brand-subtle`) valables en Dark et en Light. En fin de migration, `@theme { --color-*: initial; }` supprime la palette par défaut.

## 6. Périmètre
### Inclus
- Table de correspondance « classe brute → rôle » validée à la main (≈ 100 classes couvrant 83 %).
- Script de conversion hors runtime (codemod ou regex outillée, sans dépendance de production) avec liste des cas ambigus.
- Migration manuelle des transparences, lueurs, dégradés.
- Ordre des lots (§9) aligné sur V2-TAB-03.
- Conversion des assertions de tests couplées aux couleurs vers des attributs sémantiques (`data-state`, `data-tone`, `data-multiplier`).
- Verrouillage final et passage du cliquet (V2-DS-01) à zéro.
### Exclu
- Valeurs de la palette Light (V2-THEME-01), nouvelles mises en page (V2-TAB-03), refonte fonctionnelle des écrans.

## 7. User stories
- En tant que joueur, je veux que chaque écran garde son apparence pendant la migration, afin de ne pas être perturbé.
- En tant que mainteneur, je veux migrer un écran à la fois avec sa disposition arène, afin de ne toucher chaque fichier qu'une fois.

## 8. Règles métier
Sans objet (présentation). Les règles de jeu ne sont pas modifiées ; toute logique rencontrée dans les vues reste en place (son extraction relève de V2-ARCH-*).

## 9. Parcours utilisateurs
Inchangés. Ordre de migration proposé (par valeur et risque) :
1. Accueil, sélection, setup ;
2. X01 (`MatchView`, `PlayerScore`, `Keypad`, `MatchTopBar`, `MatchStatusPill`, `MatchInputBar`) ;
3. Cricket ; 4. Capital (avec l'unification des multiplicateurs V2-DS-04) ; 5. Killer et Gotcha ; 6. Triathlon ;
7. Statistiques et modales ; 8. `ChangelogModal` (contenu statique) en dernier.

## 10. Exigences fonctionnelles
- FR-01 Chaque lot migre un écran complet (vue + composants propres) et, si V2-TAB-03 est validée, sa disposition arène dans la même PR.
- FR-02 Après migration d'un écran, ses fichiers ne contiennent plus de classe de palette brute ni de valeur arbitraire colorée (`[#…]`, `[rgba…]`).
- FR-03 Le cliquet V2-DS-01 est abaissé à chaque lot (la référence ne remonte jamais).
- FR-04 Les tests ne vérifient plus de noms de classes de couleur ; ils vérifient des attributs sémantiques.
- FR-05 `matchFeedback.ts` renvoie une intention (`tone`), la présentation la traduit (coordonné avec V2-DS-04).
- FR-06 Un registre de migration (tableau dans `plan.md`) indique pour chaque écran : migré Dark, prêt Light, capture de référence.
- FR-07 Fin de migration : verrouillage `--color-*: initial` ; toute classe brute ne génère plus de CSS.

## 11. Exigences non fonctionnelles
- NFR-01 Aucune régression visuelle Dark au-delà de la tolérance V2-QA-05.
- NFR-02 Aucune dépendance de production ajoutée ; le script de conversion vit dans `scripts/` et n'est pas embarqué.
- NFR-03 Taille de CSS : pas d'augmentation > 5 % du fichier CSS de production [seuil à confirmer].

## 12. Cas nominaux et alternatifs
- Nominal : un écran migré passe le cliquet, les captures et les tests.
- Alternatif : si V2-TAB-03 n'est pas validée, la migration avance seule écran par écran, sans attendre.

## 13. Cas limites
- Classes construites dynamiquement (concaténations) non détectées par le script : revue manuelle et recherche ciblée.
- Couleurs d'identité des jeux (`views/GameSelectionView.tsx:38-83`) : rôles `game-x01`… définis par V2-DS-04.

## 14. Gestion des erreurs
Sans objet à l'exécution. En CI : cliquet et captures bloquants.

## 15. Impacts architecturaux
Présentation uniquement. Fin de la fuite de classes dans `src/features/x01/scoring/matchFeedback.ts`. Coordination avec V2-ARCH-11 (découpage de `MatchView`) pour éviter des conflits.

## 16. Impacts sur les données et les interfaces
Aucune donnée persistée. Attributs `data-*` ajoutés (contrat de test).

## 17. Compatibilité avec l'existant
Cohabitation palette par défaut / rôles pendant toute la migration. Specs 005, 021, 027, 028 : sélecteurs de mise en page inchangés (hors refonte TAB-03).

## 18. Dépendances
- V2-DS-01 (063), V2-QA-05 (041) : prérequis.
- Recommandé : V2-DS-02 (064) et V2-DS-04 (066) livrées avant les écrans de jeu.
- Coordonnée avec : V2-TAB-03 (072), V2-ARCH-11 (061).
- Débloque : V2-THEME-01 (068), V2-BRAND-01 (093), V2-TV-06 (086) pour la réutilisation des rôles.

## 19. Critères d'acceptation
- AC-01 Pour chaque écran migré : recherche de classes de palette brute dans ses fichiers = 0 (preuve : sortie du cliquet par fichier).
- AC-02 Pour chaque écran migré : captures Dark V2-QA-05 dans la tolérance sur téléphone, tablette, bureau.
- AC-03 Les 4 fichiers de tests couplés aux couleurs n'assertent plus de nom de classe de couleur.
- AC-04 À la clôture : cliquet à 0 et verrouillage `--color-*: initial` actif ; un `bg-gray-800` ajouté dans une PR n'a aucun effet visuel et la CI échoue.
- AC-05 Registre de migration complet (100 % des écrans « prêt Light »), condition d'activation de V2-THEME-01.

## 20. Scénarios de tests
- Unitaires : attributs sémantiques des composants migrés ; `matchFeedback` renvoie un ton.
- E2E : captures Dark par écran ; parcours smoke existants.
- Terrain : contrôle visuel sur tablette réelle à la fin de chaque lot de jeu.

## 21. Exigences de non-régression
Tous les tests unitaires et E2E existants ; specs 005, 014, 021 ; captures Dark.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Conflits avec TAB-03 / ARCH-11 | Moyen | Élevée | Même PR par écran ; planning commun |
| Régression visuelle subtile (transparences) | Moyen | Moyenne | Captures, revue visuelle |
| Gel prolongé des évolutions visuelles | Moyen | Moyenne | Lots courts (1 écran) |
| Effort sous-estimé (L) | Moyen | Moyenne | Codemod pour 83 %, manuel pour le reste |

## 23. Décisions architecturales
ADR 0006 (tokens). Décision de séquencement « tokens + arène dans les mêmes lots » à acter par le PO (Q1).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Séquencement avec la refonte tablette | Tokens avant ; mêmes lots écran par écran | Socle avant (DS-01), écrans dans les mêmes lots que TAB-03 | À prendre |
| Q2 | Outil de conversion | jscodeshift ; regex outillée | Regex outillée + revue (aucune dépendance) | À prendre |
| Q3 | Ordre des écrans | Proposé §9 ; autre | Proposé §9 | À prendre |
| Q4 | Light derrière drapeau pendant la migration | Oui ; non | Non en production ; drapeau de développement seulement | À prendre |

## 25. Traçabilité
Rapport 05 §2.2, §3 (P1, P2, P11, P12), §4.6 ; compte rendu §C.2, §F.3, §G (Lot 2) ; specs 005, 021, 027, 028 ; ADR 0006.
