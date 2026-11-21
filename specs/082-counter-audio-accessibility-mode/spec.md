---
id: 082-counter-audio-accessibility-mode
v2_id: V2-VOICE-14
titre: Mode accessibilité audio
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: voix
priorite: P3
difficulte: M
recommandation: optionnel
lot: 5
poids: 8
depend_de: [V2-VOICE-05, V2-VOICE-06]
remplace: []
remplacee_par: []
issue: '#288'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 082 — Mode accessibilité audio

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte
Innovation produit INNO-10 « Jouer sans voir l'écran » (rapport 09 §6, V2-INNO-11 ; compte rendu §E rang 10). Sources de veille : lhblind.org (« audible darts »), chapitre Springer 2024 (prototype de recherche) [EXT 2026-11-20, extraits]. Aucune application de scoring consultée ne le propose ; seul du matériel spécialisé existe [EXT]. La fonctionnalité découle du mode mains libres (076) et du caller (077), complétés par un travail d'accessibilité du pavé.

## 2. Problématique
Le scoring est entièrement visuel : un joueur malvoyant (ou âgé, ou en darts handisport) dépend d'un tiers pour connaître son reste, son finish et le joueur suivant, et le pavé n'est pas conçu pour un lecteur d'écran.

## 3. Objectifs
- O1 — Permettre une partie X01 complète sans regarder l'écran, par la voix en entrée et l'audio en sortie.
- O2 — Rendre le pavé et l'état de partie utilisables au lecteur d'écran (VoiceOver, TalkBack).
- O3 — Valider la promesse avec des utilisateurs concernés **avant** toute communication.

## 4. État actuel vérifié dans le code
- [vérifié] Aucune région ARIA live dans l'interface de jeu : seule occurrence `role="alert"` dans `src/features/smartphone/RotateToPortraitOverlay.tsx:10`.
- [vérifié] Aucune sortie audio (`speechSynthesis` : 0 occurrence) — prévue par la spec 077.
- [vérifié] Le conseil de finish existe sous forme visuelle seulement : `components/game/CheckoutHint.tsx:8-18` (`CHECKOUT_GUIDE`, libellé anglais « Checkout Path »), affiché si `showHints` (`components/match/MatchStatusPill.tsx:47`).
- [vérifié] Focus clavier peu visible (`components/ui/Button.tsx:15`, compte rendu §A, faiblesse 4) — traité par les specs 064/041.
- [vérifié] Portrait imposé sur téléphone (`src/features/smartphone/RotateToPortraitOverlay.tsx`) : interaction avec WCAG 1.3.4 (compte rendu H.7).

## 5. Comportement cible
Un réglage « Accessibilité audio » active : la voix en entrée en mode mains libres (076), le caller en verbosité complète (077) — à qui le tour, score, reste, finish conseillé —, des réponses vocales aux questions (« il reste combien ? », « quel finish ? », « où en est Paul ? »), des régions ARIA live doublant chaque annonce, et un pavé dont chaque touche est correctement nommée et ordonnée.

## 6. Périmètre
### Inclus
Réglage dédié, profil de verbosité « complet », questions vocales d'information, régions live, audit et corrections du pavé X01 au lecteur d'écran, tests avec utilisateurs concernés.
### Exclu
Autres jeux que X01 (après 079) ; matériel spécialisé ; communication publique avant validation terrain.

## 7. User stories
- En tant que joueur malvoyant, je veux entendre mon reste et le finish conseillé afin de jouer sans aide.
- En tant que joueur utilisant VoiceOver, je veux saisir un score au pavé sans me perdre.

## 8. Règles métier
- RM-01 — Les informations annoncées proviennent du moteur et des modules existants (reste, `CHECKOUT_GUIDE`) ; aucune règle dans la couche audio.
- RM-02 — Chaque annonce audio a un équivalent textuel dans une région live (pas d'information exclusivement sonore).
- RM-03 — Les réponses aux questions ne modifient jamais l'état de partie.
- RM-04 — La confirmation des scores reste explicite (invariant de la spec 003 ; mode de la spec 076).

## 9. Parcours utilisateurs
1. Réglages → « Accessibilité audio » → la voix et le caller complet s'activent (information de la spec 080 lue à voix haute).
2. « Gérard, à toi. Il te reste quatre-vingt-un. Finish : triple quinze, double dix-huit. »
3. Gérard : « soixante » → « Soixante, valide ? » → « valide » → « Reste vingt et un. Léa, à toi. »
4. « où en est Léa ? » → « Léa : cent quarante restants. »

## 10. Exigences fonctionnelles
- FR-01 — Réglage « Accessibilité audio » mémorisé sur l'appareil, activable aussi depuis l'accueil (sans étape ajoutée au parcours standard).
- FR-02 — Profil de verbosité « complet » du caller : joueur, score, reste, finish conseillé (si disponible), bust, fin de manche.
- FR-03 — Questions vocales d'information : reste du joueur courant, finish conseillé, reste d'un autre joueur, score de manche/set.
- FR-04 — Relecture vocale de la proposition avant confirmation (« Soixante, valide ? »).
- FR-05 — Régions ARIA live (polies) pour les annonces ; ordre de focus et noms accessibles du pavé X01, de la barre d'entrée et des réglages corrigés.
- FR-06 — Libellé du conseil de finish traduit (« Finish conseillé ») et exposé aux technologies d'assistance.

## 11. Exigences non fonctionnelles
- NFR-01 Accessibilité : conformité WCAG 2.2 AA sur l'écran de jeu X01 vérifiée par la spec 041 (axe) et par test manuel VoiceOver/TalkBack.
- NFR-02 Coût : 0 € hors voix en entrée (budget de la spec 006).
- NFR-03 Les annonces ne se chevauchent pas avec celles du lecteur d'écran (régions live polies, service audio unique de la spec 077).

## 12. Cas nominaux et alternatifs
Nominal : parcours 1-3. Alternatifs : saisie au pavé avec VoiceOver ; questions (4).

## 13. Cas limites
Lecteur d'écran et synthèse vocale simultanés ; casque ; bruit de club ; doublettes ; robot adversaire.

## 14. Gestion des erreurs
Voix indisponible (budget, hors ligne) → annonce « Saisie vocale indisponible, utilise le pavé » et focus sur le pavé.

## 15. Impacts architecturaux
Réutilise les événements neutres et le service audio de la spec 077, le contrôleur de la spec 075 (nouvelles intentions d'information) ; corrections d'accessibilité en présentation. Domaine inchangé.

## 16. Impacts sur les données et les interfaces
Préférence locale ; intentions d'information ajoutées au contrat interne de la spec 075.

## 17. Compatibilité avec l'existant
Sans le réglage, aucun changement. Les corrections ARIA profitent à tous.

## 18. Dépendances
**V2-VOICE-05 / spec 076** et **V2-VOICE-06 / spec 077** (bloquantes). Liens : 075 (intentions), 080 (information), 041 (accessibilité automatisée), 064 (composants accessibles), V2-QA-09 / 042 (matrice d'appareils).

## 19. Critères d'acceptation
- AC-01 — Partie 301 complète à deux joueurs jouée par un testeur les yeux bandés, sans aide, en salle calme (terrain).
- AC-02 — Chaque annonce audio a un équivalent dans une région live (test composant).
- AC-03 — Pavé X01 navigable et saisissable avec VoiceOver (iPadOS) et TalkBack (Android) (protocole manuel).
- AC-04 — Questions FR-03 répondues correctement sur 20 cas (tests unitaires sur événements factices).
- AC-05 — Audit axe sans violation critique sur l'écran de jeu avec le réglage actif.
- AC-06 — Retour d'au moins 3 utilisateurs concernés recueilli et intégré avant toute communication.

## 20. Scénarios de tests
Unitaires (réponses, verbosité), composants (régions live), E2E (axe), terrain (utilisateurs concernés, association locale).

## 21. Exigences de non-régression
Pavé, raccourcis, caller et voix standards ; performances INP (spec 020).

## 22. Risques
| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Promesse non tenue | Image | Moyenne | Tests utilisateurs avant communication (AC-06) |
| Conflit lecteur d'écran / synthèse | Inaudible | Moyenne | Régions polies, service audio unique |
| Dépendances 076/077 non livrées | Blocage | Moyenne | Lot 5, après elles |

## 23. Décisions architecturales
Aucun ADR nouveau ; ADR 0008 (intentions d'information).

## 24. Questions ouvertes
| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Livrer en V2 ou V2.x | Lot 5 ; plus tard | Lot 5 si 076/077 livrées, sinon V2.x | — |
| Q2 | Partenaire de test | Association locale ; handisport ; bénévoles | Association locale (contact soumis à autorisation, H.21) | — |
| Q3 | Orientation téléphone | Portrait imposé ; libre en mode accessibilité | Libre en mode accessibilité (WCAG 1.3.4, H.7) | — |

## 25. Traçabilité
Rapport 09 (INNO-10, V2-INNO-11) ; compte rendu §E, §H.7, §H.13 ; specs 003, 041, 042, 064, 075, 076, 077, 080 ; ADR 0008.
