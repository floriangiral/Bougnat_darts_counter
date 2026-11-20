---
id: 067-counter-motion-reduced-motion
v2_id: V2-DS-05
titre: Animations et prefers-reduced-motion
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation UX/UI
famille: design-system
priorite: P2
difficulte: S
recommandation: recommande
lot: 2
poids: 20
depend_de: [V2-DS-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 067 — Animations et prefers-reduced-motion

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Rapport d'audit 05 (§2.4, §3 P7, §5.3), compte rendu §C.2 (« `animate-in` sans plugin ; `prefers-reduced-motion` ignoré ») et §F.3. Le mouvement devient aussi un sujet TV (animations 180/checkout, V2-TV-06) et arène (V2-TAB-03) : il faut une base commune avant de les multiplier.

## 2. Problématique
Des classes d'animation ne produisent rien (plugin absent), des pulsations tournent en continu sur les écrans de jeu et la préférence système « réduire les animations » n'est jamais respectée.

## 3. Objectifs
- O1. Supprimer ou implémenter les classes mortes, sans dépendance.
- O2. Respecter `prefers-reduced-motion: reduce` sur 100 % des animations non essentielles.
- O3. Disposer de tokens de durée et d'easing communs (Dark, Light, TV).
- O4. Remplacer les pulsations continues par des impulsions ponctuelles.

## 4. État actuel vérifié dans le code
- [vérifié] `animate-in fade-in` utilisé 6 fois : `components/ui/ChangelogModal.tsx:11`, `views/CapitalGameView.tsx:144`, `views/MatchView.tsx:664`, `:679`, `:772`, `views/CricketGameView.tsx:247`. Aucun plugin d'animation dans `package.json` ; 0 occurrence de `fade-in`/`animate-in` dans la CSS du build local `dist/assets/index-C2qto8R6.css` → **sans effet**.
- [vérifié] `animate-pulse` continu : `components/game/CheckoutHint.tsx:14`, badge du lanceur `components/game/PlayerScore.tsx:110`, `views/CapitalGameView.tsx:233`, `src/features/x01/voice/VoiceScoringControl.tsx:61`.
- [vérifié] `animate-spin` (chargement) : `App.tsx:76`, `VoiceScoringControl.tsx:59` (légitime, à conserver).
- [vérifié] 0 occurrence de `motion-reduce`, `motion-safe` ou `prefers-reduced-motion` dans le code et la CSS.
- [vérifié] 37 `transition-all`, 19 `active:scale-*` dans les `.tsx`.
- [hypothèse] `transition-all` peut coûter sur matériel ancien (tablettes d'entrée de gamme, TV) ; non mesuré.

## 5. Comportement cible
Tokens `--bd-duration-fast` (120 ms), `--bd-duration-base` (200 ms), `--bd-duration-slow` (300 ms) et un easing de référence ; une utilité `animate-fade-in` déclarée en CSS natif (`@keyframes` + `@theme --animate-*`) ; une règle globale `@media (prefers-reduced-motion: reduce)` qui neutralise pulsations, translations et mises à l'échelle (les indicateurs de chargement restent visibles sous forme statique ou lente).

## 6. Périmètre
### Inclus
- Tokens de mouvement (dans V2-DS-01).
- Implémentation native de `animate-fade-in` et remplacement des 6 usages (ou suppression si l'effet n'est pas voulu).
- Remplacement des 4 `animate-pulse` continus par une impulsion unique à l'apparition.
- Règle globale `prefers-reduced-motion`.
- Remplacement des `transition-all` par des transitions ciblées (couleur, opacité, transform) quand c'est trivial.
### Exclu
- Animations TV (V2-TV-06), transitions d'arène (V2-TAB-03) : elles consomment ces tokens.
- `prefers-contrast: more` : option à arbitrer (Q2).

## 7. User stories
- En tant que joueur sensible au mouvement, je veux que l'application respecte mon réglage système, afin d'éviter l'inconfort.
- En tant que joueur, je veux que les indications importantes (finish, lanceur) attirent l'œil une fois sans clignoter en permanence.

## 8. Règles métier
Sans objet ; aucune information de jeu ne doit dépendre d'une animation (une animation ne fait qu'accompagner un état visible statiquement).

## 9. Parcours utilisateurs
Inchangés.

## 10. Exigences fonctionnelles
- FR-01 Aucune classe d'animation sans effet dans le code (0 `animate-in`, 0 `fade-in` non définie).
- FR-02 Sous `prefers-reduced-motion: reduce`, aucune animation non essentielle ne s'exécute (pulsations, échelles, translations, fondus > 0 ms neutralisés) ; les indicateurs de chargement restent perceptibles.
- FR-03 Les pulsations du conseil de finish, du badge du lanceur, de Capital et de la voix ne bouclent plus indéfiniment (une impulsion ≤ 2 cycles à l'apparition), sauf l'état « écoute en cours » de la voix s'il est jugé essentiel (Q3).
- FR-04 Les durées et easings proviennent des tokens.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 2.3.3 (AAA) visé comme bonne pratique ; WCAG 2.2.2 (pause, arrêt, masquage) pour les animations > 5 s.
- NFR-02 Performance : aucune régression INP ; préférence pour `transform`/`opacity`.
- NFR-03 Aucune dépendance ajoutée.

## 12. Cas nominaux et alternatifs
- Nominal : ouverture du changelog → fondu de 200 ms.
- Alternatif : réglage « réduire les animations » actif → apparition immédiate.

## 13. Cas limites
- Navigateurs sans support de la media query : comportement par défaut (animations courtes).
- TV : le réglage système n'est pas toujours exposé [à confirmer] ; la TV appliquera ses propres limites (V2-TV-06).

## 14. Gestion des erreurs
Sans objet.

## 15. Impacts architecturaux
Présentation (`src/styles/`, composants). Aucun impact domaine.

## 16. Impacts sur les données et les interfaces
Aucun.

## 17. Compatibilité avec l'existant
Rendu identique hors pulsations (désormais ponctuelles) et fondus (désormais effectifs). Les fondus effectifs sont un changement visible à valider (Q1).

## 18. Dépendances
- V2-DS-01 (063) pour les tokens. Consommée par V2-TAB-03 (072), V2-TV-06 (086), V2-VOICE-05 (076).

## 19. Critères d'acceptation
- AC-01 Recherche dans le code : 0 `animate-in`, 0 `fade-in` non définie.
- AC-02 E2E avec `reducedMotion: 'reduce'` (Playwright) : sur X01 avec conseil de finish visible, `getAnimations()` du conseil et du badge du lanceur renvoie 0 animation en cours.
- AC-03 E2E sans réduction : 5 s après l'apparition du conseil de finish, aucune animation n'est en cours sur ce conseil.
- AC-04 Les durées utilisées dans la CSS des composants migrés proviennent des tokens (revue + recherche de valeurs `duration-[`).

## 20. Scénarios de tests
- E2E Playwright `reducedMotion` (option de contexte) sur X01 et Capital.
- Unitaires : présence de la règle globale dans la CSS (lecture de fichier).
- Terrain : iPad avec « Réduire les animations » activé [à confirmer].

## 21. Exigences de non-régression
Spec 020 (INP) : pas de dégradation ; tests de présentation X01.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Perte d'attention sur le finish sans pulsation | Faible | Moyenne | Impulsion à l'apparition + contraste élevé |
| Fondus effectifs perçus comme lenteur | Faible | Faible | 120-200 ms maximum |

## 23. Décisions architecturales
Aucune nouvelle ; s'appuie sur ADR 0006.

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Classes `animate-in` mortes | Implémenter le fondu ; supprimer | Implémenter (intention d'origine), 120-200 ms | À prendre |
| Q2 | Prendre en charge `prefers-contrast: more` | Ici ; plus tard | Plus tard (V2-THEME-01) | À prendre |
| Q3 | Pulsation « écoute en cours » de la voix | Continue ; ponctuelle | Continue mais lente, neutralisée en mouvement réduit (indicateur statique) | À prendre |

## 25. Traçabilité
Rapport 05 §2.4, §3 P7, §5.3 ; compte rendu §C.2, §F.3 ; specs 020, 003.
