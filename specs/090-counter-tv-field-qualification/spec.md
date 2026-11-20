---
id: 090-counter-tv-field-qualification
v2_id: V2-TV-11
titre: Qualification sur TV réelles
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Recommandation architecturale
famille: tv
priorite: P2
difficulte: M
recommandation: recommande
lot: 3
poids: 10
depend_de: [V2-TV-05, V2-DS-00]
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 090 — Qualification sur TV réelles

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Aucune compatibilité TV n'a été vérifiée sur appareil (`07-tv-mode.md` §10 ; compte rendu, « Incertitudes non levées »). Les moteurs web des TV 2022-2024 (Samsung Tizen 2022 = Chromium 85, LG webOS 2022 = Chromium 87, 2023 = 94, 2024 = 108) sont sous la cible de Tailwind 4 (Chrome 111+). La mission demande de ne pas supposer que Chromecast, AirPlay ou les navigateurs de TV permettent tous les usages. Cette spec définit la **matrice d'appareils**, le **protocole de qualification** et les **seuils d'acceptation** de l'écran TV, avant toute promesse publique de compatibilité.

## 2. Problématique

Sans qualification, l'écran TV peut être illisible, ne pas se reconnecter après une veille ou être coupé par l'économiseur d'écran, et la documentation risquerait de promettre une compatibilité non démontrée.

## 3. Objectifs

- Une matrice de compatibilité publiée, chaque ligne marquée « qualifiée », « partielle » ou « non supportée ».
- Des mesures reproductibles : rendu, lisibilité à 3 et 5 m, latence, reconnexion, veille, stabilité sur 2 h.
- Une décision de baseline TV confirmée ou révisée dans la spec 018 (V2-DS-00).

## 4. État actuel vérifié dans le code

- [vérifié] Aucun écran TV, aucune page de diagnostic.
- [vérifié] Build legacy JS ciblant `ios >= 12`, `safari >= 12` (`vite.config.ts:29-33`) ; CSS produite par Tailwind 4 sans cible legacy (`package.json:41-42,58`) — l'écran TV aura sa feuille conservatrice (086).
- [vérifié] Classes de capacités CSS legacy détectées au démarrage (`index.tsx:7-9`, `src/infrastructure/web/legacySupport.ts`), réutilisables pour le diagnostic.
- [vérifié] Aucune matrice d'appareils réels dans le dépôt (sujet général de V2-QA-09, 042).
- [EXT, consulté le 2026-11-20] Versions de moteur publiées par LG et Samsung pour les **applications web** ; l'application navigateur intégrée peut différer [à confirmer sur appareil].

## 5. Comportement cible

Une campagne de qualification par plateforme, menée avec une page de diagnostic `/tv?diag=1` et le mode TV réel (local 085, relais 087), produit un rapport versionné et met à jour la matrice publiée dans le guide utilisateur.

## 6. Périmètre

### Inclus
- Matrice cible (tableau §10, FR-01).
- Page de diagnostic TV (moteur, agent utilisateur, plein écran, Wake Lock, WebSocket, `BroadcastChannel`, propriétés CSS clés, résolution, ratio de pixels).
- Protocole et gabarit de rapport ; seuils d'acceptation.
- Émulation en CI des moteurs anciens quand c'est possible [à confirmer : images Chromium anciennes].

### Exclu
- Corrections de rendu elles-mêmes (portées par 086/089) ; décision de baseline (portée par 018) ; Google Cast et Presentation API (091).

## 7. User stories

- En tant que club, je veux savoir si ma TV est compatible avant d'acheter un mini-PC.
- En tant que mainteneur, je veux détecter une régression de rendu sur un moteur ancien avant publication.

## 8. Règles métier

- RM-01 Une plateforme n'est annoncée « compatible » qu'après qualification complète sur appareil réel.
- RM-02 Le résultat de qualification indique la version exacte du moteur relevée par le diagnostic.

## 9. Parcours utilisateurs

Testeur : ouvrir `/tv?diag=1` sur la TV, photographier le diagnostic, puis dérouler le protocole (appairage, partie de 2 h simulée, coupures, veille) et remplir le gabarit.

## 10. Exigences fonctionnelles

- FR-01 Matrice cible :

| Plateforme | Versions | Moteur attendu | Accès envisagé | Priorité |
|---|---|---|---|---|
| Samsung Tizen | 2022 / 2023 / 2024 / ≥ 2025 | Chromium 85 / 94 / 108 / ≥ 120 | Prêt d'appareils, laboratoire distant [à confirmer] | Haute |
| LG webOS | 2022 / 2023 / 2024 / ≥ 2025 | Chromium 87 / 94 / 108 / ≥ 120 | Prêt, émulateur du SDK pour le moteur | Haute |
| Android TV / Google TV | 11+ | Navigateur tiers [à confirmer] | Prêt | Moyenne |
| Fire TV | Clé récente | Silk [à confirmer] | Achat d'une clé | Moyenne |
| Ordinateur + HDMI | Chrome, Edge, Firefox, Safari récents | — | Disponible | Haute (085) |
| Chrome desktop → Chromecast (« Caster l'onglet ») | — | — | Prêt | Basse |
| iPad + écran externe (Stage Manager) | iPadOS récent | WebKit | Prêt [à confirmer] | Basse |
| Apple TV | — | Pas de navigateur [à confirmer] | Recopie AirPlay documentée | Information |

- FR-02 Page `/tv?diag=1` sans dépendance au relais, affichant les capacités listées au §6 et un motif de test (zone sûre 5 %, échelle de tailles, contrastes).
- FR-03 Protocole par appareil : Q1 rendu (captures vs référence 086), Q2 lisibilité à 3 et 5 m, Q3 latence saisie → écran, Q4 stabilité 2 h (mémoire, fluidité), Q5 veille et économiseur d'écran, Q6 reconnexion (Wi-Fi coupé 30 s, veille/réveil, redéploiement du Worker), Q7 plein écran à la télécommande, Q8 lisibilité du code d'appairage (088), Q9 surbalayage.
- FR-04 Seuils : Q2 ≥ 95 % de lectures correctes du score par 3 personnes à 5 m ; Q3 p95 < 1 s (relais) et < 300 ms (local) ; Q4 aucun plantage ni dérive mémoire > 50 % ; Q6 reconnexion automatique < 10 s après retour du réseau.
- FR-05 Gabarit de rapport (appareil, moteur relevé, date, résultats Q1-Q9, photos) versionné dans la documentation (emplacement fixé par V2-DOC-02, 035).
- FR-06 Matrice publique dans le guide utilisateur (037) avec statut par ligne.

## 11. Exigences non fonctionnelles

- NFR-01 Coût récurrent : 0 €. Coût ponctuel d'appareils à décider (une clé Fire TV [à confirmer : prix]).
- NFR-02 Confidentialité : aucune donnée de diagnostic envoyée ; affichage local seulement.
- NFR-03 La page de diagnostic n'est pas liée depuis l'interface joueur.

## 12. Cas nominaux et alternatifs

Qualification complète sur Samsung 2022 et LG 2023 ; qualification partielle (rendu seul) via émulateur quand l'appareil manque.

## 13. Cas limites

- Navigateur intégré plus ancien que le moteur d'application web annoncé : classer selon le moteur relevé.
- TV sans plein écran ou sans Wake Lock : documenter le réglage manuel de veille.
- Économiseur d'écran déclenché pendant une partie : contournement documenté, sinon « partielle ».

## 14. Gestion des erreurs

Diagnostic en échec (API absente) : affiché « non disponible », jamais bloquant.

## 15. Impacts architecturaux

Page de diagnostic dans l'entrée TV (`src/tv/diag/`), sans dépendance au contrôleur ni au relais.

## 16. Impacts sur les données et les interfaces

Aucune donnée persistée ; nouveau paramètre `?diag=1` sur `/tv`.

## 17. Compatibilité avec l'existant

Aucun impact sur le contrôleur.

## 18. Dépendances

- V2-TV-05 (087) : nécessaire pour Q3 (relais), Q6, Q8 sur TV autonome.
- V2-DS-00 (018) : baseline navigateurs (entrée et sortie de cette qualification).
- Liens : 085 et 086 (qualifiables plus tôt sur ordinateur + HDMI), 088, 089, 042 (V2-QA-09), 037.

## 19. Critères d'acceptation

- AC-01 Rapport de qualification complet (Q1-Q9) pour au moins une TV Samsung et une TV LG de 2022 ou 2023.
- AC-02 `/tv?diag=1` affiche le moteur et les capacités sur chacun des appareils testés.
- AC-03 Matrice publiée dans le guide, chaque ligne avec statut et date de qualification.
- AC-04 Décision de baseline TV renseignée dans la spec 018 à partir des résultats.
- AC-05 Aucun appareil marqué « qualifiée » sans les seuils FR-04 atteints.

## 20. Scénarios de tests

Campagne terrain (protocole FR-03) ; émulation CI si disponible ; test de régression visuelle 086 rejoué sur Chromium anciens.

## 21. Exigences de non-régression

Toute modification de la feuille TV (086/089) rejoue Q1 sur l'émulation et, avant publication majeure, sur un appareil 2022.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Pas d'accès aux appareils | Élevé | Moyenne | Prêts (clubs), émulateurs, laboratoire distant |
| Navigateur intégré différent du moteur annoncé | Moyen | Moyenne | Diagnostic du moteur réel |
| Veille non contrôlable | Moyen | Moyenne | Doc de réglage, statut « partielle » |

## 23. Décisions architecturales

Baseline TV (018) ; ADR 0005 pour la reconnexion attendue.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| 1 | Budget d'appareils (H.3) | Achat Fire TV / prêts seuls / laboratoire distant | Prêts + une clé Fire TV | — |
| 2 | Générations minimales | 2022+ / 2023+ | 2022+ si Q1 passe sur Chromium 85 | — |
| 3 | Mode démonstration (partie enregistrée rejouée) | Inclure / non | Inclure dans `/tv?diag=1` pour qualifier le rendu sans relais | — |
| 4 | Testeurs de lisibilité | Équipe / club partenaire | Club (conditions réelles) | — |

## 25. Traçabilité

Rapports : `07-tv-mode.md` §4.4, §7, §10 ; `05-design-system.md` §2.5 ; compte rendu C.6, H.3, incertitudes. Revue croisée : Samsung 2022 = Chromium 85, LG = 87. Specs : 087, 018, 085, 086, 088, 089, 042, 035, 037.
