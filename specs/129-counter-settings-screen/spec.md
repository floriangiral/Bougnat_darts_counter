---
id: 129-counter-settings-screen
v2_id: V2-SET-01
titre: Page Réglages (apparence et options de partie, préférences de l'appareil)
type: fonctionnel
statut: implementee
validation: en-attente
origine: Demande du product owner (2026-11-20)
famille: perso
priorite: P1
difficulte: M
recommandation: recommande
lot: 2
poids: 30
depend_de: [V2-THEME-02]
remplace: []
remplacee_par: []
issue: à créer
verifie_au_commit: 24dbbab
derniere_revue: 2026-11-20
---

# 129 — Page Réglages (apparence et options de partie, préférences de l'appareil)

> **Statut : IMPLÉMENTÉE** le 2026-11-20 sur `feat/v2.0.0`, à la demande directe du product owner. La recette terrain (téléphone, tablette portrait/paysage, bureau, Dark et Light) et l'exécution des E2E dans la CI de la PR restent à faire (`validation: en-attente`). Issue GitHub à créer.

## 1. Origine et contexte
Demande du product owner (2026-11-20) : « Sur la page d'accueil, je veux ajouter une roue crantée (paramètres) ; dans cette page je veux y mettre le choix de l'apparence ainsi que toutes les options qu'on trouve dans le même menu sur X01 et ailleurs. La page d'accueil doit rester la plus simple possible (comme avant). »

La spec [069](../069-counter-theme-preference/spec.md) (Q1) avait placé le sélecteur d'apparence dans le pied de page de l'accueil ; cette demande révise Q1.

## 2. Problématique
Les options de partie X01 (aide de finish, voix, raccourcis) ne se règlent qu'en pleine partie et sont oubliées à chaque nouvelle partie ; le sélecteur d'apparence alourdit l'accueil.

## 3. Objectifs
- Un point unique, hors partie, pour régler l'apparence et toutes les options de jeu.
- Des options mémorisées sur l'appareil, sans compte, appliquées dès le démarrage d'une partie.
- Un accueil revenu à sa simplicité : un seul bouton d'action principal et une roue crantée discrète.

## 4. État actuel vérifié dans le code (avant la spec)
Inventaire des options [vérifié] :

| Option | Écran | Mémorisation avant la spec |
|---|---|---|
| Suggestions de finish (`showHints`) | menu « Options de jeu » X01 (`components/match/MatchSettingsModal.tsx`) | état React de `views/MatchView.tsx`, désactivé à chaque partie |
| Assistance vocale IA (`voiceAssistEnabled`, si `VITE_ENABLE_VOICE_SCORING`) | idem | état React, remis à « actif » à chaque nouvelle partie |
| Barre de raccourcis téléphone (activée) | idem (téléphone) | état React de `src/features/x01/hooks/useMatchShortcuts.ts` |
| Raccourcis de la barre téléphone (6 scores) | idem (téléphone) | état React, valeurs par défaut à chaque partie |
| Raccourcis colonnes gauche/droite (4 + 4 scores) | idem (tablette, PC) | état React, valeurs par défaut à chaque partie |
| Apparence Auto / Sombre / Clair | pied de page de l'accueil + menu X01 | `localStorage` `bougnat-theme-v1` (spec 069) |

- Autres jeux (Cricket, Capital, Triathlon, Killer, Gotcha) : aucun menu ni option de réglage [vérifié dans `views/` et `components/`].
- Hors périmètre car ce ne sont pas des réglages : choix de format dans la configuration de partie (`SetupView`), invite « Tourne ton téléphone » (masquage par partie en `sessionStorage`), installation de l'application.

## 5. Comportement cible
- Une roue crantée (« Réglages ») en haut à droite de l'accueil ouvre l'écran d'application `SETTINGS`.
- La page Réglages regroupe « Apparence » (sélecteur de thème), « X01 · Aides de jeu », « X01 · Raccourcis » et un rappel « Autres jeux » (aucune option pour l'instant).
- Chaque option X01 devient une préférence de l'appareil, lue au démarrage d'une partie ; le menu « Options de jeu » de la partie X01 reste en place et modifie la même préférence.

## 6. Périmètre
### Inclus
Écran Réglages, roue crantée de l'accueil, préférences X01 versionnées, branchement du menu de partie X01, tests unitaires, documentation.
### Exclu
Réglages par joueur, synchronisation entre appareils ou onglets, nouvelles options, options pour les autres jeux.

## 7. User stories
- En tant que joueur, je veux régler l'apparence et mes raccourcis avant de jouer, afin de ne pas le faire à chaque partie.
- En tant que joueur, je veux que mes choix faits pendant une partie soient conservés pour la suivante.

## 8. Règles métier
- RM-01 Un raccourci est un total réalisable en une volée de trois fléchettes (0 à 180, `POSSIBLE_TURN_SCORES`) ; une saisie invalide conserve le raccourci précédent.
- RM-02 Valeurs par défaut identiques au comportement antérieur : aide de finish masquée, assistance vocale active, barre téléphone active, raccourcis 41/45/60/100, 26/81/85/140 et 45/60/100/81/85/140.

## 9. Parcours utilisateurs
Accueil → roue crantée → Réglages → modification (effet et mémorisation immédiats) → « Retour à l'accueil » ou retour du navigateur → accueil. Le parcours de base (ouvrir → choisir un jeu → prénoms → jouer) est inchangé.

## 10. Exigences fonctionnelles
- FR-01 L'accueil n'affiche plus le sélecteur d'apparence ; il affiche une seule roue crantée (`IconButton`, `aria-label="Réglages"`, `data-testid="home-settings"`).
- FR-02 Écran `SETTINGS` (pas de plein écran, pas de protection de mise à jour) avec en-tête et retour vers l'accueil ; le retour du navigateur ramène à l'accueil.
- FR-03 Sections Apparence, X01 · Aides de jeu (voix seulement si disponible), X01 · Raccourcis (barre téléphone, colonnes latérales), Autres jeux.
- FR-04 Préférences stockées sous la clé `bougnat-settings-v1` au format `{"v":1,"x01":{…}}` ; valeur absente, corrompue ou d'une autre version → valeurs par défaut ; validation champ par champ ; un groupe de raccourcis invalide revient entier à sa valeur par défaut.
- FR-05 `MatchView` lit les préférences au démarrage et le menu de partie les modifie (même source).
- FR-06 La préférence d'apparence reste celle de la spec 069 (`bougnat-theme-v1`), inchangée.

## 11. Exigences non fonctionnelles
- NFR-01 Stockage indisponible (navigation privée, quota) non bloquant : le réglage s'applique sans être mémorisé.
- NFR-02 Rôles de tokens uniquement, Dark et Light ; cibles tactiles ≥ 44 px (téléphone) / 48 px (tablette) via `Button`/`IconButton`.
- NFR-03 Mise en page lisible sur téléphone (une colonne), tablette et bureau (deux colonnes dès `md`).
- NFR-04 Aucune nouvelle dépendance ; textes en français accentué.

## 12. Cas nominaux et alternatifs
- Activer l'aide de finish dans Réglages → la prochaine partie X01 l'affiche d'emblée.
- Couper la barre téléphone pendant une partie → la page Réglages et la partie suivante la montrent coupée.

## 13. Cas limites
- Saisie `179` ou vide dans un raccourci : refusée, le brouillon revient à la valeur enregistrée à la sortie du champ.
- Voix non disponible dans le déploiement : option masquée, préférence conservée.
- Session restaurée sur l'écran `SETTINGS` après rechargement : l'écran s'affiche normalement.

## 14. Gestion des erreurs
Toute erreur de lecture/écriture du stockage est absorbée (valeurs par défaut ou réglage non mémorisé).

## 15. Impacts architecturaux
- `src/features/settings/counterSettings.ts` (pur) ; `src/infrastructure/local/counterSettingsStore.ts` (stockage) ; `src/app/counterSettingsController.ts` + `src/app/useCounterSettings.ts` (cache, abonnement, unique point d'écriture), sur le modèle de la spec 069.
- `src/features/settings/useShortcutDrafts.ts` et `src/features/x01/hooks/useMatchShortcuts.ts` importent `src/app/useCounterSettings` : écart à la règle de dépendance du même type que `useViewportClass` (déjà connu, spec 056).

## 16. Impacts sur les données et les interfaces
Nouvelle clé `localStorage` `bougnat-settings-v1` ; nouvelle valeur `SETTINGS` d'`AppScreen` (acceptée par la reprise de session). Aucune migration : rien n'était mémorisé avant.

## 17. Compatibilité avec l'existant
Les préférences de thème existantes (`bougnat-theme-v1`) sont lues sans changement. Sans préférence enregistrée, le comportement est identique à l'existant, à une exception près : un choix fait pendant une partie (par exemple couper la voix) est désormais conservé pour la suivante, ce qui est l'objet de la demande.

## 18. Dépendances
Spec 069 (préférence de thème), spec 064 (composants de base), spec 063 (tokens).

## 19. Critères d'acceptation
- AC-01 Accueil : une roue crantée « Réglages », aucun sélecteur d'apparence ; « Lancer une partie » inchangé.
- AC-02 Roue crantée → page Réglages ; « Retour à l'accueil » et le retour du navigateur ramènent à l'accueil.
- AC-03 Le choix « Clair » dans Réglages s'applique immédiatement et est mémorisé (`bougnat-theme-v1`).
- AC-04 Chaque option X01 modifiée dans Réglages est mémorisée (`bougnat-settings-v1`) et appliquée au démarrage de la partie X01 suivante.
- AC-05 Une option modifiée dans le menu de partie X01 est mémorisée et visible dans Réglages.
- AC-06 Une valeur stockée corrompue ou d'une autre version donne les valeurs par défaut, sans erreur.
- AC-07 Lisible en Dark et Light, sur téléphone, tablette portrait/paysage et bureau (recette terrain).

## 20. Scénarios de tests
- Unitaires : `tests/unit/settings/counterSettings.test.ts` (pur, stockage, contrôleur), `tests/unit/components/settingsView.test.tsx`, `tests/unit/components/homeAndSelection.test.tsx`, `tests/unit/x01/matchHooks.test.ts`, `tests/unit/x01/matchViewSettings.test.tsx`.
- E2E (écrit, non exécuté localement) : `tests/e2e/theme.smoke.spec.ts` passe par la roue crantée.
- Terrain : AC-07.

## 21. Exigences de non-régression
Parcours de base, menu de partie X01, préférence de thème, reprise de session.

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Voix coupée une fois puis oubliée | Moyen | Moyenne | Option visible dans Réglages et dans le menu de partie |
| Raccourcis personnalisés surprenants sur un appareil partagé | Faible | Faible | Valeurs visibles et modifiables dans Réglages |

## 23. Décisions architecturales
Pas d'ADR : même mécanisme que la spec 069 (préférence locale versionnée, contrôleur unique).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Bouton « Réinitialiser les réglages » | Oui ; non | Non pour l'instant | À trancher par le product owner |
| Q2 | Synchronisation entre onglets (événement `storage`) | Oui ; non | Non (le dernier onglet qui écrit gagne, comme la session) | À trancher par le product owner |

## 25. Traçabilité
Demande du product owner du 2026-11-20 ; spec 069 (Q1 révisée) ; `docs/design-system.md` §6.

## Implémentation (2026-11-20)

- Branche `feat/v2.0.0` ; vérifiée au commit `24dbbab` ; issue à créer.
- Fichiers : `src/features/settings/counterSettings.ts`, `src/features/settings/useShortcutDrafts.ts`, `src/infrastructure/local/counterSettingsStore.ts`, `src/app/counterSettingsController.ts`, `src/app/useCounterSettings.ts`, `src/app/appScreens.ts`, `views/SettingsView.tsx`, `views/HomeView.tsx`, `App.tsx`, `views/MatchView.tsx` (initialisation et persistance des réglages), `components/match/MatchSettingsModal.tsx` (`ShortcutDraftGrid` exporté, mention de la mémorisation), `src/features/x01/hooks/useMatchShortcuts.ts`.
- Écarts et restes : recette terrain (AC-07) ; E2E non exécutés localement ; issue GitHub à créer.
