---
id: 055-counter-discovery-mode
v2_id: V2-GAMES-23
titre: Mode Découverte — première partie guidée
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: innovation
priorite: P2
difficulte: M
recommandation: optionnel
lot: 4
poids: 15
depend_de: [V2-GAMES-06]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 055 — Mode Découverte : première partie guidée

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

- Rapport 09 : INNO-07 « Mode Découverte », constat P15 (règles statiques au setup, aucun accompagnement en partie), §4 (contexte « Découverte / débutants »).
- Compte rendu : E (rang 6, « Moyenne-haute », non signature), F.6, G (lot 4).
- Terrain : Bougnat Darts anime des événements de découverte (rapport 09 §2.2, `bougnatdarts.fr` [VÉRIFIÉ ext.]).
- Niveau de vérification de la différenciation (rapport 09) : guides de règles statiques chez The Darts App [VÉRIFIÉ ext.] ; **coaching contextuel en partie [NON TROUVÉ]** parmi les applications consultées, avec une vérification **partielle** (pages d'accueil et FAQ seulement). **Aucune nouveauté n'est revendiquée.**

## 2. Problématique

Un débutant (animation, famille, bar) ne sait ni lire la cible, ni quoi viser, ni pourquoi une volée est « cassée ». L'application n'explique les règles qu'avant la partie, en texte, et seulement pour la configuration choisie.

## 3. Objectifs

- O1 : un débutant joue une première partie complète sans aide humaine, guidé par l'application.
- O2 : le mode est strictement facultatif : aucune étape ajoutée au parcours de base, aucun changement pour un joueur qui ne l'active pas.
- O3 : chaque conseil affiché est juste au regard de la règle active (relecture par un joueur confirmé).

## 4. État actuel vérifié dans le code

- [vérifié] Règles affichées au setup dans une modale (`views/SetupView.tsx:185`, `:390-393`), contenu produit par `getRulesContent` (`src/features/game-setup/setupPresentation.ts:97-144`) ; textes statiques pour Capital, Killer, Gotcha, Triathlon (`:59` et suivantes).
- [vérifié] Le texte X01 annonce « ne commence qu'après une ouverture valide » si l'ouverture n'est pas Open (`setupPresentation.ts:109`), alors que l'ouverture n'est pas appliquée (compte rendu A, V2-GAMES-02, 046) : un conseil fondé sur ce texte serait faux.
- [vérifié] Aide de fin X01 : `components/game/CheckoutHint.tsx:8-11` ne reçoit que le score et lit `CHECKOUT_GUIDE` (`constants.ts:3`), table Double Out affichée aussi en Open/Master (rapport 03, G3) ; libellé anglais « Checkout Path » (`CheckoutHint.tsx:15`).
- [vérifié] Possibilité de finir selon la règle : `isCheckoutPossible` (`src/features/x01/scoring/checkoutEligibility.ts:5-15`).
- [vérifié] Six jeux (`utils/arenaFlow.ts:1`) ; aucune notion de mode d'apprentissage dans `GameConfig` (`types.ts:14-26`).
- [vérifié] Aucune sortie sonore (`speechSynthesis` absent, rapport 09 P10).

## 5. Comportement cible

Au setup, un interrupteur discret « Je découvre (conseils pendant la partie) », désactivé par défaut. Activé, il :
1. propose une **présentation interactive de la cible** (simple, double, triple, bulle et demi-bulle), consultable aussi en partie via « Règles » ;
2. affiche **au plus un conseil par tour**, court, contextuel, fermable, produit par une fonction pure à partir de l'état de la partie et de la configuration ;
3. explique les événements de règle au moment où ils surviennent (« Trop ! Tu as dépassé : ton score reste à 32 ») ;
4. propose un **préréglage débutant** (X01 301, fermeture Open, 1 manche) **sans créer de règle nouvelle** : il s'agit d'une configuration existante.

## 6. Périmètre

### Inclus
- Interrupteur au setup, présentation de la cible, conseils contextuels X01 et Cricket, explications d'événements, préréglage débutant X01.

### Exclu
- Capital, Killer, Gotcha, Triathlon en V1 (Q2).
- Saisie par zone de cible pour X01 (« j'ai touché triple 20 ») : dépend de la décision « saisie fléchette par fléchette » (compte rendu C.5, H.11).
- Conseils vocaux (après V2-VOICE-06, 077 ; Q5).
- Règles simplifiées nouvelles (aucune variante inventée).
- Progression, badges, comptes.

## 7. User stories

- En tant que débutante, je veux savoir quoi viser quand il me reste 40, afin de finir la partie.
- En tant qu'animateur, je veux lancer une partie guidée pour un groupe de novices sans tout expliquer moi-même.
- En tant que joueur confirmé, je ne veux voir aucun conseil si je n'ai rien activé.

## 8. Règles métier

- RM-01 : le mode Découverte ne modifie jamais le calcul des scores ni la détermination du vainqueur.
- RM-02 : un conseil de fin X01 respecte la règle de fermeture active (Open, Double, Master) ; si aucune suggestion fiable n'existe, aucun conseil de fin n'est affiché.
- RM-03 : les conseils sont dérivés de l'état engagé de la partie, jamais de la saisie en cours non validée.
- RM-04 : un joueur robot ne reçoit pas de conseil.
- RM-05 : en match lié (030), l'interrupteur est disponible mais n'altère pas le résultat transmis.

## 9. Parcours utilisateurs

1. Accueil → « Lancer une partie » → X01 → setup.
2. Le joueur active « Je découvre » ; le setup propose « Utiliser le préréglage débutant (301, sans double) » (facultatif).
3. Prénoms → « Lancer » → une carte « La cible en 20 secondes » s'affiche une fois (passable).
4. Pendant la partie : un bandeau de conseil au-dessus de la saisie (« Vise le triple 20, la zone étroite du milieu »).
5. Score ≤ 170 finissable : « Il te reste 40 : en Open, 20 puis 20, ou un double 20 » (selon RM-02).
6. Volée cassée : explication de l'événement.
7. Fin de partie : écran de fin commun (V2-GAMES-06), avec « Rejouer sans conseils ».

## 10. Exigences fonctionnelles

- FR-01 : le setup X01 et Cricket affiche l'interrupteur « Je découvre », désactivé par défaut, sans modifier l'ordre ni le nombre des étapes.
- FR-02 : l'état de l'interrupteur est porté par la configuration de la partie (`discovery?: boolean`, optionnel), conservé à la reprise (010) et à la revanche, ignoré par les règles.
- FR-03 : le préréglage débutant X01 applique 301, fermeture Open, 1 manche ; il reste modifiable.
- FR-04 : la présentation de la cible est un composant accessible (texte + schéma), affichée une fois au lancement et rouvrable via « Règles » (barre de partie de V2-GAMES-06).
- FR-05 : `getDiscoveryTip(gameType, state, config) → Tip | null` est une fonction pure (application), testée par table, sans dépendance React.
- FR-06 : X01 — conseils : objectif de visée hors zone de fin, chemin de fin conforme à la règle active (réutilise la source de vérité de V2-GAMES-01, 045), explication du « Trop » et de la fin manquée.
- FR-07 : Cricket — conseils : cibles à fermer en priorité, signification des marques, quand les points comptent.
- FR-08 : au plus un conseil par tour ; chaque conseil est fermable ; « Masquer les conseils » les coupe pour la partie en cours.
- FR-09 : les conseils sont annoncés dans une région `aria-live="polite"`.
- FR-10 : les textes respectent le lexique français de V2-GAMES-10 (013) et sont relus par un joueur confirmé avant publication.

## 11. Exigences non fonctionnelles

- NFR-01 (performance) : calcul d'un conseil < 2 ms sur le téléphone de référence (V2-QA-09, 042) ; aucune dégradation INP mesurable (spec 020).
- NFR-02 (lisibilité) : le bandeau ne masque ni le score ni le clavier en portrait 360 × 640 et en tablette paysage (V2-TAB-02, 071).
- NFR-03 (accessibilité) : contraste conforme aux tokens (V2-DS-01, 063) ; respect de `prefers-reduced-motion`.
- NFR-04 (coût) : 0 € ; aucun appel réseau.
- NFR-05 (non-intrusion) : aucun élément nouveau à l'écran quand le mode est désactivé.

## 12. Cas nominaux et alternatifs

- Nominal : 301 Open, deux débutants, conseils à chaque tour jusqu'à la victoire.
- Alternatif : mode activé en 501 Double Out → conseils de fin en Double Out uniquement.
- Alternatif : un joueur humain contre le robot → conseils pour l'humain seulement.
- Alternatif : doublettes → conseils pour le lanceur courant.

## 13. Cas limites

- Reste non finissable (bogeys en Double Out, 1 en Double/Master) : conseil « Il te faut d'abord réduire ton score : vise un nombre qui laisse un double ».
- Ouverture Double/Master tant que V2-GAMES-02 (046) n'est pas tranchée : aucun conseil sur l'ouverture.
- Score personnalisé élevé : conseils de visée seulement.
- Reprise après rechargement : le mode est conservé (FR-02) ; la présentation de la cible n'est pas rejouée.

## 14. Gestion des erreurs

- `getDiscoveryTip` renvoie `null` en cas d'état inattendu ; aucune exception ne remonte à l'interface.

## 15. Impacts architecturaux

- Application : module `src/application/discovery/` (fonctions pures par jeu), consommant l'état sérialisable de V2-ARCH-04 (058) et la règle de fin de V2-GAMES-01 (045).
- Présentation : bandeau de conseil et présentation de la cible, intégrés à la barre/zone commune de V2-GAMES-06 (049).
- Aucune règle dans l'UI ; aucun nouvel état de jeu.

## 16. Impacts sur les données et les interfaces

- `GameConfig.discovery?: boolean` (optionnel, rétrocompatible) ; non exposé par le lien externe 030 ; enregistré dans l'historique (101).

## 17. Compatibilité avec l'existant

- Désactivé par défaut : comportement actuel inchangé.
- La modale de règles existante est conservée ; son contenu X01 doit être corrigé par V2-GAMES-02 (046).

## 18. Dépendances

- V2-GAMES-06 (049) : barre de partie (bouton « Règles ») et fin de partie commune (bloquant).
- V2-GAMES-01 (045) : aide de fin conforme à la règle active (bloquant pour FR-06).
- V2-ARCH-04 (058) : état de partie sérialisable (Cricket).
- V2-GAMES-10 (013) : lexique.
- V2-VOICE-06 (077) : conseils vocaux (optionnel, ultérieur).

## 19. Critères d'acceptation

- AC-01 : setup X01 sans interaction sur l'interrupteur → partie identique à aujourd'hui, aucun bandeau. Preuve : E2E existants + capture.
- AC-02 : 301 Open, mode activé, reste 40 → conseil conforme à Open ; 501 Double Out, reste 40 → conseil « double 20 ». Preuve : tests unitaires par table (≥ 30 restes par règle).
- AC-03 : pour tous les restes de 2 à 170 et chaque règle de fermeture, aucun conseil de fin n'est impossible selon `isCheckoutPossible` et la source de V2-GAMES-01. Preuve : test exhaustif.
- AC-04 : volée cassée → explication affichée une fois, fermable. Preuve : test de composant.
- AC-05 : Cricket, mode activé → au plus un conseil par tour sur 10 tours. Preuve : test de composant.
- AC-06 : rechargement en cours de partie X01 → mode conservé. Preuve : E2E.
- AC-07 : lecteur d'écran (VoiceOver ou NVDA) annonce le conseil sans voler le focus [à confirmer sur appareil]. Preuve : test manuel consigné.
- AC-08 : relecture des textes par un joueur confirmé de l'association, consignée dans la PR. Preuve : validation écrite.
- AC-09 : test terrain avec 5 débutants : ≥ 4 terminent un 301 sans aide humaine [hypothèse de cible à valider]. Preuve : compte rendu de séance.

## 20. Scénarios de tests

- Unitaires : `getDiscoveryTip` X01 (tables par règle), Cricket (états de marques), cas limites §13.
- Composants : bandeau, présentation de la cible, masquage.
- E2E : AC-01, AC-06.
- Terrain : AC-07, AC-09.

## 21. Exigences de non-régression

- Parcours de base et E2E X01/Cricket inchangés ; INP non dégradé (020) ; lien 030 inchangé.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Conseil faux (règle mal prise en compte) | Élevé (crédibilité) | Moyenne | Source de vérité unique (045), test exhaustif AC-03, relecture AC-08 |
| Surcharge visuelle | Moyen | Moyenne | Un conseil par tour, opt-in, masquable |
| Dérive vers un « cours » complet | Moyen | Faible | Périmètre V1 limité à X01 et Cricket |
| Dépendances non livrées (049, 045) | Moyen | Moyenne | Lot 4, après les fondations |

## 23. Décisions architecturales

- Conseils produits par des fonctions pures de la couche application ; aucun texte de conseil dans le domaine (le domaine fournit des faits, l'application les traduit).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Retenir le mode Découverte en V2 ? | V2 lot 4 / V2.x / Non | V2 lot 4, après 049 et 045 | — |
| Q2 | Jeux couverts en V1 | X01 seul / X01 + Cricket / tous | X01 + Cricket | — |
| Q3 | Emplacement de l'interrupteur | Setup / Accueil (« Première partie ? ») / Les deux | Setup seul (aucune étape ajoutée) | — |
| Q4 | Saisie par zone de cible en Découverte | Oui (dépend de la saisie par fléchette, H.11) / Non | Non en V1 | — |
| Q5 | Conseils vocaux via le caller | Oui / Non / Plus tard | Plus tard, après 077 | — |
| Q6 | Ton des conseils | Neutre / « Bougnat » humoristique | Neutre et bienveillant, tutoiement (cohérent avec l'existant) | — |
| Q7 | Mention du mode dans l'historique et le récap | Oui / Non | Oui, discrète | — |

## 25. Traçabilité

- Rapports : `reports/09-innovation.md` (P10, P15, §4, INNO-07, §9 V2-INNO-08), `reports/03-games.md` (§3.1 présentation des règles, G3, §5.9 règles en partie).
- Compte rendu : C.5, E (rang 6), F.6, G (lot 4), H.11.
- Specs liées : 045, 046, 049, 058, 013, 077, 101, 102.
