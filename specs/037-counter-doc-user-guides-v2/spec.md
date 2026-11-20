---
id: 037-counter-doc-user-guides-v2
v2_id: V2-DOC-05
titre: Guides utilisateur V2 (voix, TV, thèmes, station)
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: doc
priorite: P2
difficulte: M
recommandation: recommande
lot: 4
poids: 15
depend_de: [V2-VOICE-05, V2-TV-04, V2-THEME-01, V2-BRAND-02]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 037 — Guides utilisateur V2 (voix, TV, thèmes, station)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La documentation utilisateur est « quasi absente hors README » (rapport `10-docs-quality.md` §2.1) : règles des jeux uniquement dans l'application, aucun guide de la voix (vocabulaire, micro, limites), aucune FAQ tablette/installation/iOS. Les signatures V2 proposées (voix mains libres, TV, thèmes et personnalisation, « Station en un scan ») ajoutent des réglages que joueurs, bars et clubs devront comprendre sans assistance. Le compte rendu (§C.8) impose que ces guides soient écrits **avec** l'implémentation, jamais avant (règle 4 des conventions SDD).

## 2. Problématique

Sans guide, les fonctions V2 les plus différenciantes (voix, TV, station de club) risquent d'être mal configurées ou ignorées ; écrits trop tôt, les guides deviennent des sur-promesses.

## 3. Objectifs

- O1 : un guide court par fonctionnalité V2 livrée, publié dans la même PR que la fonctionnalité.
- O2 : chaque guide permet une première utilisation réussie en moins de 2 minutes de lecture.
- O3 : aucun guide ne décrit une capacité non livrée.

## 4. État actuel vérifié dans le code

- [vérifié] Règles des jeux affichées dans l'application (`src/features/game-setup/setupPresentation.ts:97-135`, `getRulesContent`) ; aucune page de règles dans `docs/`.
- [vérifié] Voix X01 : pipeline dans `src/features/x01/voice/` (normaliseur `dartsSpeechNormalizer.ts`, lexique `dartsSpeechParserLexicon.ts`, client Deepgram `deepgramClient.ts`) ; aucun document listant les formulations reconnues ni la conduite à tenir si le micro est refusé.
- [vérifié] Installation : `components/ui/InstallAppButton.tsx` ; pas de FAQ iOS/Android (l'invite Android dépend de la spec 031).
- [vérifié] Aucun mode TV, aucun thème clair, aucune personnalisation, aucune station : fonctionnalités **proposées** par V2-TV-04 (085), V2-THEME-01 (068), V2-BRAND-02 (094), V2-STATION-01 (100), V2-VOICE-05 (076), toutes `a-valider`.
- [hypothèse] Public cible : joueurs occasionnels, responsables de bar, référents de club, peu enclins à lire une documentation longue.

## 5. Comportement cible

Un dossier de guides (emplacement selon V2-DOC-02 : `docs/user/` si l'option B est retenue) contient un guide par fonctionnalité livrée, accessible depuis le `README.md` et, si Q2 est validée, depuis un lien « Aide » de l'application. Chaque guide suit le même plan : à quoi ça sert, prérequis, mise en route pas à pas, limites connues, dépannage, confidentialité/coûts éventuels.

## 6. Périmètre

### Inclus
- Guides : voix mains libres (076), mode TV local (085), mode Light et thèmes (068), éditeur de thème (094), station de club en un scan (100).
- Gabarit commun de guide et règles de publication.
- Captures d'écran produites par Playwright (pas de captures manuelles non reproductibles).

### Exclu
- Règles de référence des jeux (portées par les specs de jeux et `docs/product/games/*`, V2-DOC-02).
- Guide partenaire (existant : `docs/integration/external-match-link.md`).
- Traductions (français uniquement en V2).
- Guides des fonctionnalités existantes (voix X01 actuelle, installation, tablette) : selon Q1.

## 7. User stories

- En tant que joueur, je veux savoir quelles phrases la voix comprend, afin de compter sans toucher l'écran.
- En tant que responsable de bar, je veux afficher la partie sur la TV en quelques étapes, afin que les spectateurs suivent.
- En tant que référent de club, je veux préparer une station aux couleurs du club et la reproduire sur une autre tablette par QR.
- En tant que joueur malvoyant ou en salle lumineuse, je veux savoir activer le mode Light.

## 8. Règles métier

- RM-01 : un guide est fusionné dans la PR qui livre la fonctionnalité, ou au plus tard avant sa promotion en production.
- RM-02 : un guide porte le bandeau `Implémenté (vX.Y.Z)` ; sinon il n'est pas publié.
- RM-03 : toute limite connue (navigateur, appareil, coût, confidentialité) figure dans le guide.
- RM-04 : aucun guide ne rend obligatoire une étape supplémentaire dans le parcours de base.

## 9. Parcours utilisateurs

`README.md` → section « Guides » → guide → (option Q2) retour dans l'application via un lien profond.

## 10. Exigences fonctionnelles

- FR-01 Gabarit de guide (`docs/user/_gabarit.md` ou équivalent) : 6 rubriques de §5, longueur cible ≤ 120 lignes.
- FR-02 Guide voix mains libres : activation, autorisation du micro, formulations reconnues (générées ou vérifiées depuis le corpus de V2-VOICE-03, 074), confirmation, correction, bascule clavier, confidentialité (audio envoyé à Deepgram), limites (bruit, plafond budgétaire de V2-VOICE-10).
- FR-03 Guide TV locale : matériel (PC + HDMI, fenêtre secondaire), étapes, ce qui est affiché, limites navigateurs (baseline V2-DS-00, 018).
- FR-04 Guide Light/thèmes : bascule, préférence système, contraste.
- FR-05 Guide éditeur de thème et co-branding : formats de logo acceptés, taille, couleurs non personnalisables, export/import.
- FR-06 Guide station de club : préparation, QR de configuration, affiche imprimable, réinitialisation.
- FR-07 Captures générées par un scénario Playwright dédié (thème sombre et clair), régénérables à chaque release.
- FR-08 Section « Guides » dans `README.md` listant uniquement les guides publiés.

## 11. Exigences non fonctionnelles

- NFR-01 Français accentué, phrases courtes, tutoiement ou vouvoiement unique (Q3).
- NFR-02 Aucune dépendance ajoutée ; captures ≤ 200 Ko chacune.
- NFR-03 Accessibilité : texte alternatif sur chaque capture.

## 12. Cas nominaux et alternatifs

- Nominal : fonctionnalité livrée + guide dans la même PR.
- Alternatif : fonctionnalité livrée derrière un réglage expérimental → guide marqué « expérimental » ou différé.

## 13. Cas limites

- Fonctionnalité retirée ou reportée : le guide passe `Historique` ou est supprimé dans la même PR.
- Différences iOS/Android : sections par plateforme plutôt que des guides séparés.

## 14. Gestion des erreurs

Chaque guide comporte une rubrique « Dépannage » reprenant les messages d'erreur réels de l'application (texte exact).

## 15. Impacts architecturaux

Aucun sur le code, sauf Q2 (lien « Aide » dans l'interface, porté par la spec de la fonctionnalité).

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Le `README.md` reste la vitrine ; les guides le complètent sans le dupliquer.

## 18. Dépendances

Bloquantes (par guide) : V2-VOICE-05 (076), V2-TV-04 (085), V2-THEME-01 (068), V2-BRAND-02 (094). Liées : V2-STATION-01 (100), V2-VOICE-03 (074), V2-VOICE-10 (006), V2-DOC-02 (035, emplacement et bandeaux), V2-DS-00 (018).

## 19. Critères d'acceptation

- AC-01 Pour chaque fonctionnalité listée au §6 promue en production, le guide existe, porte le bandeau `Implémenté (vX.Y.Z)` et est lié depuis le `README.md`.
- AC-02 Aucun guide publié pour une fonctionnalité non livrée (contrôle `docs:check` de 035 croisé avec le statut de la spec).
- AC-03 Test utilisateur : 3 personnes sans aide réussissent la mise en route décrite (voix, TV, station) en suivant le guide [terrain].
- AC-04 Les captures sont régénérées par le scénario Playwright sans retouche manuelle.
- AC-05 Les formulations vocales du guide passent toutes le parseur (test sur le corpus).

## 20. Scénarios de tests

Playwright de captures (`tests/e2e/docs-screenshots.spec.ts`, hors suite bloquante) ; test unitaire vérifiant que chaque formulation citée dans le guide voix est reconnue ; tests utilisateurs AC-03.

## 21. Exigences de non-régression

Le parcours de base reste décrit en quatre étapes dans le `README.md` ; aucun guide ne l'allonge.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Guides périmés après évolution | Moyen | Élevée | RM-01, captures régénérées, bandeau de version |
| Guide écrit avant la fonctionnalité | Élevé (sur-promesse) | Moyenne | RM-02, AC-02 |
| Guide voix divergent du parseur | Moyen | Moyenne | AC-05 |

## 23. Décisions architecturales

Aucun ADR. Arbitrages rappelés : H.13 (signatures retenues), H.14 (caller), H.16-H.17 (personnalisation, co-branding), H.26 (organisation de `docs/`).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Documenter aussi l'existant (voix X01 actuelle, installation, tablette) | Oui maintenant / avec V2 | Oui, guide court de l'existant dès V2-DOC-02 (fonctionnalités déjà livrées) | — |
| Q2 | Lien « Aide » dans l'application | Aucun / lien vers GitHub / aide intégrée | Lien externe discret dans les réglages (aucune étape ajoutée) | — |
| Q3 | Ton des guides | Tutoiement / vouvoiement | Vouvoiement, cohérent avec le `README.md` | — |
| Q4 | Hébergement | GitHub (Markdown) / site vitrine | GitHub d'abord ; site vitrine ensuite si demandé | — |

## 25. Traçabilité

Rapports : `10-docs-quality.md` §2.1 (« Documentation utilisateur »), §5.1, §7.2 ; compte rendu §C.8, §E, §G (lot 4). Specs : 076, 085, 068, 094, 100, 035.
