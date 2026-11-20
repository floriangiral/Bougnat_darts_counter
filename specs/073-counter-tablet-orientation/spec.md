---
id: 073-counter-tablet-orientation
v2_id: V2-TAB-05
titre: Orientation tablette (verrou Android plein écran, invite non bloquante)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: tablette
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 23
depend_de: [V2-TAB-01]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 073 — Orientation tablette (verrou Android plein écran, invite non bloquante)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Demande V2 (chantier 5.4 : « verrouiller le paysage sur tablette pendant les parties »), rapport d'audit 06 (§2.6, §4.3, AC-O1…O8), compte rendu §C.4 et §H.7. Le compte rendu conteste la demande d'un verrou strict : il est **techniquement impossible sur iPadOS** et un blocage serait contraire à WCAG 2.1 SC 1.3.4 sans justification d'essentialité. Le même argument concerne le portrait imposé sur téléphone, traité par V2-TAB-06 (spec 028).

## 2. Problématique
La disposition arène (V2-TAB-03) suppose le paysage pendant les parties, mais une page web ne peut pas imposer l'orientation partout ; l'actuel `usePortraitLock` est appelé sans lien avec le plein écran, n'est jamais libéré et pourrait viser une tablette mal classée.

## 3. Objectifs
- O1. Obtenir le paysage pendant les parties sur tablette chaque fois que la plateforme le permet (Android en plein écran).
- O2. Ailleurs, inviter sans bloquer, uniquement sur les écrans de jeu.
- O3. Ne jamais poser de verrou portrait sur une tablette ; toujours libérer le verrou en sortie de partie.
- O4. Rester conforme à WCAG 1.3.4 (le portrait tablette reste supporté).

## 4. État actuel vérifié dans le code
- [vérifié] `src/features/smartphone/usePortraitLock.ts:12-19` : `screen.orientation.lock('portrait')` dans un `useEffect` dépendant de `enabled`, erreur avalée, aucun `unlock()`.
- [vérifié] `App.tsx:220` : `usePortraitLock(layoutMode === 'smartphone')` ; `layoutMode` inclut aujourd'hui des tablettes paysage mal classées (rapport 06 §2.2, corrigé par V2-TAB-02).
- [vérifié] Plein écran demandé au lancement : `src/app/useGameLifecycle.ts:70` (`enterFullScreen()` dans `handleStartSetup`) ; entrée/sortie selon `FULLSCREEN_SCREENS` (`src/app/appShell.ts:27`) dans `src/app/useAppScreenHistory.ts:38-44` ; `utils/uiUtils.ts:17-58`.
- [vérifié] Une partie restaurée après rechargement revient à l'écran de jeu sans geste utilisateur, donc sans plein écran.
- [vérifié] `manifest.json` : `"orientation": "any"`, `display: standalone` ; manifeste non livré à la racine du build (`docs/release/v2.0.0.md:71`, spec 031).
- [vérifié] Commentaire `usePortraitLock.ts:7-11` et note `docs/release/v2.0.0.md:43` (« pris en compte quand elle est installée ») : **effet non démontré** — selon le code Chromium cité au rapport 06 §1.2, Android exige le plein écran (ou `display: fullscreen`) ; l'effet s'exécute au montage, avant tout plein écran [à confirmer sur appareil].
- [source externe, rapport 06 §1.2] `ScreenOrientation.lock()` non supporté par Safari/iPadOS ; membre `orientation` du manifeste non supporté par Safari ; plein écran d'élément disponible sur iPad mais quitté par glissement vers le bas.

## 5. Comportement cible
1. **Android (best effort)** : au geste « Lancer la partie », après résolution de `requestFullscreen()`, si la classe est tablette (V2-TAB-01) et l'écran tactile, appeler `screen.orientation.lock('landscape')` ; `unlock()` à la sortie de l'écran de jeu. Échec silencieux.
2. **Ailleurs** (iPad, PWA iOS, plein écran quitté, partie restaurée) : sur un écran de jeu (`FULLSCREEN_SCREENS`) en classe tablette portrait, afficher une **invite non bloquante** (« Tournez la tablette pour l'affichage paysage ») avec « Continuer en portrait », mémorisée pour la partie en cours.
3. **Écrans hors jeu** : aucune invite.
4. `usePortraitLock` est limité aux téléphones (selon la décision V2-TAB-06), appelé après le plein écran et accompagné d'`unlock()`.

## 6. Périmètre
### Inclus
- Port d'orientation (infrastructure) : `lock(orientation)`, `unlock()`, `isSupported`.
- Séquence plein écran → verrou paysage → déverrouillage sur Android.
- Invite non bloquante, mémorisation par partie (`sessionStorage`).
- Correction de `usePortraitLock` (portée, moment, `unlock`).
- Correction des textes inexacts (`usePortraitLock.ts:7-11`, notes de version).
### Exclu
- Manifeste `orientation: natural` (étude ultérieure après la livraison du manifeste, 031 / V2-REL-02).
- Décision portrait téléphone (V2-TAB-06) ; ordinateurs (aucune invite, aucun verrou).

## 7. User stories
- En tant que joueur sur tablette Android, je veux que l'écran reste en paysage pendant la partie, afin que l'arène ne bascule pas quand je pose la tablette.
- En tant que joueur sur iPad, je veux une invite discrète à tourner la tablette, afin de profiter de l'arène sans être bloqué.
- En tant que club avec un support mural portrait, je veux continuer en portrait, afin d'utiliser mon installation.

## 8. Règles métier
- RM-01 L'orientation n'affecte jamais l'état de partie ni la saisie en cours.
- RM-02 Le choix « Continuer en portrait » vaut pour la partie en cours seulement.

## 9. Parcours utilisateurs
- Android : Accueil → jeu → prénoms → « Lancer la partie » (plein écran + paysage) → partie → fin ou sortie (déverrouillage).
- iPad portrait : « Lancer la partie » → invite → rotation (invite disparaît) ou « Continuer en portrait ».

## 10. Exigences fonctionnelles
- FR-01 Écran de jeu + classe tablette + portrait (hors multitâche détecté) → invite visible ≤ 300 ms après `resize`/`orientationchange` ; disparition en paysage (AC-O1).
- FR-02 Aucune invite sur HOME, GAME_SELECTION, SETUP et écrans de statistiques (AC-O2).
- FR-03 Aucune invite sur pointeur fin (bureau) ni sur classe téléphone (AC-O3).
- FR-04 « Continuer en portrait » masque l'invite jusqu'à la fin de la partie courante (AC-O4).
- FR-05 Android : `lock('landscape')` appelé une fois au lancement d'une partie en classe tablette, après le plein écran ; `unlock()` à la sortie ; rejet sans message (AC-O5).
- FR-06 Jamais de `lock('portrait')` sur une classe tablette (AC-O6).
- FR-07 Multitâche iPad (écran paysage, fenêtre portrait) → pas d'invite (AC-O7, [à confirmer]).
- FR-08 Partie restaurée en portrait après rechargement → invite (AC-O8).

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : WCAG 1.3.4 respecté (aucun blocage) ; invite lisible, focusable, fermable au clavier.
- NFR-02 Aucune dépendance ; coût 0 €.
- NFR-03 L'invite n'occupe pas plus de 20 % de la hauteur et ne masque pas la saisie [seuil à valider].

## 12. Cas nominaux et alternatifs
- Nominal Android : verrou paysage actif pendant la partie.
- Alternatif : l'utilisateur quitte le plein écran (geste système) → Chromium libère le verrou ; l'invite prend le relais si l'appareil est en portrait.

## 13. Cas limites
- Tablette 7" en paysage classée tablette compacte : comportement identique.
- Appareil sans `screen.orientation` : invite seule.
- Rotation pendant la saisie : saisie conservée (V2-TAB-01 FR-04).

## 14. Gestion des erreurs
`lock()` rejeté ou absent : aucune erreur visible, journalisation de débogage seulement.

## 15. Impacts architecturaux
Port `OrientationPort` en application, adaptateur web en infrastructure (`src/infrastructure/web/`), hook de présentation pour l'invite. Décision fondée sur la recette/classe de V2-TAB-01 ; aucune dépendance au domaine.

## 16. Impacts sur les données et les interfaces
`sessionStorage` : drapeau « portrait accepté » associé à l'identifiant de la partie courante. Aucune donnée persistée durablement.

## 17. Compatibilité avec l'existant
Le portrait tablette reste supporté (captures 810×1010, 800×1176 correctes au rapport 06). Téléphones : selon V2-TAB-06. Bureau : inchangé.

## 18. Dépendances
- V2-TAB-01 (070) : classes et recettes.
- Coordination : V2-TAB-06 (028) pour la portée de `usePortraitLock` ; 031 / V2-REL-02 pour toute évolution du manifeste ; V2-TAB-03 (072) pour l'intérêt du paysage.

## 19. Critères d'acceptation
- AC-O1 Playwright `hasTouch`, 810×1010 ↔ 1080×750 sur X01 : invite visible en portrait ≤ 300 ms, absente en paysage ; état de partie persisté identique.
- AC-O2 Parcours accueil → sélection → setup → statistiques en portrait tablette : aucune invite.
- AC-O3 Projets bureau et téléphone : aucune invite tablette.
- AC-O4 « Continuer en portrait » → invite absente jusqu'à la fin de la partie, présente à la partie suivante.
- AC-O5 Test unitaire avec `screen.orientation` simulé (modèle `tests/unit/components/portraitOrientation.test.tsx`) : séquence `requestFullscreen` → `lock('landscape')` → `unlock()` ; test manuel Chrome Android.
- AC-O6 Table de vérité unitaire : aucune combinaison tablette ne produit `lock('portrait')`.
- AC-O7 Multitâche iPad : pas d'invite [test manuel, à confirmer].
- AC-O8 Rechargement d'une partie X01 en portrait tablette : invite affichée.

## 20. Scénarios de tests
- Unitaires : décision d'invite (table de vérité), séquence de verrou, mémorisation par partie.
- E2E : AC-O1 à AC-O4, AC-O8.
- Terrain : Chrome Android tablette, Samsung Internet, iPad Safari, iPad écran d'accueil [à confirmer].

## 21. Exigences de non-régression
E2E téléphone (selon V2-TAB-06), reprise X01 (spec 010), plein écran existant.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Verrou non libéré | Moyen | Faible | `unlock()` en sortie + libération par Chromium à la sortie du plein écran |
| Invite jugée intrusive | Faible | Moyenne | Non bloquante, mémorisée, écrans de jeu seulement |
| Comportement Samsung Internet/Firefox différent | Faible | Moyenne | Test terrain, échec silencieux |

## 23. Décisions architecturales
Pas d'ADR propre ; la décision « invite non bloquante vs blocage » est un arbitrage produit (§H.7).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Invite ou blocage (D1, §H.7) | Invite non bloquante ; blocage strict | Invite non bloquante (WCAG 1.3.4, iPad, supports muraux) | À prendre |
| Q2 | Périmètre (D2) | Écrans de jeu ; toute l'application | Écrans de jeu | À prendre |
| Q3 | Étude `orientation: natural` du manifeste (D8) | Après 031 ; jamais | Après 031, en étude | À prendre |
| Q4 | Libellé de l'invite | « Tournez la tablette » ; autre | « Tournez la tablette pour l'affichage paysage » | À prendre |

## 25. Traçabilité
Rapport 06 §1.2, §2.6, §4.3 (AC-O1…O8), §7 (D1, D2, D8) ; compte rendu §C.4, §H.7 ; specs 010, 027, 028, 031.
