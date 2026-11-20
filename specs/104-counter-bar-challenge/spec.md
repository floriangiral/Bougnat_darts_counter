---
id: 104-counter-bar-challenge
v2_id: V2-GAMES-24
titre: Défi du comptoir
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Innovation produit
famille: innovation
priorite: P3
difficulte: M
recommandation: optionnel
lot: 5
poids: 5
depend_de: [V2-ARCH-04]
remplace: []
remplacee_par: []
issue: '#295'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 104 — Défi du comptoir

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

- Rapport 09 : INNO-09 « Défi du comptoir (bars) : défis QR et tableau d'honneur local » ; §5.2 (un bar cherche de l'animation et de la fréquentation plutôt qu'un terminal de scoring) ; §5.3 B « L'animateur de soirée ».
- Compte rendu : E (rang 9, « Moyenne (bars) »), F.6, G (lot 5).
- Le rapport 09 estime la complexité à L ; le catalogue retient M en limitant la V1 à un seul type de défi, sans lien partagé ni TV (voir §6).
- Niveau de vérification de la différenciation (rapport 09) : Target Arcade (matériel Omni) et Scolia Social (à venir, matériel) visent l'animation de pub [VÉRIFIÉ ext., 20/11/2026] ; une version **sans matériel ni compte, en web, [NON TROUVÉE]** parmi les applications consultées. **Aucune nouveauté n'est revendiquée.**

## 2. Problématique

Un bar ou un club veut animer les temps creux et faire revenir ses clients avec un défi simple (« battez 87 points en 3 volées ») sans organisation lourde, sans compte et sans matériel. Rien dans l'application ne le permet aujourd'hui.

## 3. Objectifs

- O1 : un gérant crée un défi en moins de 1 minute, sans compte.
- O2 : un client tente le défi en 3 interactions depuis l'écran du défi (pseudo → jouer → résultat).
- O3 : un tableau d'honneur local affiche les meilleurs scores de la période, sur la tablette (et sur la TV quand V2-TV-04 est disponible).
- O4 : le parcours de base « Lancer une partie » reste inchangé.

## 4. État actuel vérifié dans le code

- [vérifié] Six jeux, aucun mode « défi » ni classement (`utils/arenaFlow.ts:1`).
- [vérifié] Validation des totaux de volée possibles : `isPossibleThreeDartTurnScore` (`src/domain/scoring/valueObjects/ScoreInput.ts:49`) ; non utilisée par Gotcha et Capital (compte rendu C.5, V2-GAMES-30, 054).
- [vérifié] Stockage local disponible (IndexedDB `bougnat-counter-local` v1, `src/infrastructure/local/IndexedDBSessionRepository.ts:10-14`) ; aucun store adapté à un classement.
- [vérifié] Modèle de contrat d'URL versionné et validé strictement : `src/features/external-match/externalMatchLink.ts` (spec 030).
- [vérifié] Aucune diffusion vers un second écran (`BroadcastChannel` absent, rapport 09 P14).
- [vérifié] Frontière produit : pas de backend métier ni de statistiques cloud consolidées (`docs/product-scope.md:19-26`, `CONTRIBUTING.md:28-33`).

## 5. Comportement cible

Une entrée secondaire « Défi du comptoir » (hors « Lancer une partie ») permet au gérant de créer un défi : type (V1 : « Meilleur total en 3 volées »), titre facultatif, période (date de fin), nombre d'essais par pseudo (facultatif). L'écran du défi montre le tableau d'honneur (top 10) et un bouton « Relever le défi ». Le client saisit un pseudo, accepte l'affichage public de son pseudo, joue ses 3 volées au clavier de total, et voit son rang. À la date de fin, le tableau est figé puis effacé après un délai (Q4).

## 6. Périmètre

### Inclus (V1)
- Un type de défi : « Meilleur total en 3 volées » (9 fléchettes, total de chaque volée validé).
- Création, tentative, tableau d'honneur local, purge.
- Pseudonyme libre, consentement à l'affichage.

### Exclu
- Autres types (« 121 en 9 fléchettes », « Capital > 500 ») : incréments ultérieurs (Q2).
- Lien/QR de défi partagé entre plusieurs tablettes (Q3) — dépend de V2-QR-01 (092) et V2-STATION-01 (100).
- Affichage TV (après V2-TV-04, 085, et V2-TV-02, 084).
- Classement entre lieux, classement national, anti-triche : nécessitent un serveur ; hors périmètre de ce dépôt (relèvent de `Bougnat_Darts_Tournaments`).
- Récompenses, paiement, compte.

## 7. User stories

- En tant que gérant de bar, je veux lancer le défi du mois en une minute, afin d'animer la salle.
- En tant que client, je veux tenter le défi et voir mon rang, afin de revenir battre le meilleur score.
- En tant que client, je veux pouvoir rester anonyme (pseudo libre) ou ne pas apparaître au tableau.

## 8. Règles métier

- RM-01 : une tentative = 3 volées ; chaque volée est un total possible en 3 fléchettes (0-180, hors totaux impossibles) ; le score de la tentative est la somme.
- RM-02 : le classement est trié par score décroissant ; à égalité, la tentative la plus ancienne est classée devant.
- RM-03 : si un nombre maximal d'essais est fixé, il s'applique par pseudo (comparaison sans casse ni espaces superflus) ; c'est une règle d'honneur, non vérifiable.
- RM-04 : un défi expiré n'accepte plus de tentative ; son tableau reste consultable jusqu'à la purge.
- RM-05 : une tentative abandonnée n'est pas enregistrée.
- RM-06 : le tableau porte la mention « Classement local, sans valeur officielle ».

## 9. Parcours utilisateurs

1. Gérant : accueil → entrée secondaire « Défi du comptoir » → « Créer un défi » → type, date de fin → « Lancer ».
2. Écran du défi : titre, règle en une phrase, tableau d'honneur, « Relever le défi ».
3. Client : « Relever le défi » → pseudo + case « Afficher mon pseudo au tableau » → 3 volées au clavier → résultat et rang → retour à l'écran du défi.
4. Gérant : « Terminer le défi » ou « Effacer le tableau » (confirmation, code local facultatif, Q5).

## 10. Exigences fonctionnelles

- FR-01 : l'entrée « Défi du comptoir » est secondaire (pied de l'accueil ou menu « Animation », Q1) et n'ajoute aucune étape à « Lancer une partie ».
- FR-02 : un seul défi actif par appareil en V1.
- FR-03 : la règle de tentative est un reducer pur (`src/domain/challenge/`) conforme au contrat d'état de V2-ARCH-04 (058) : sérialisable, reprenable après rechargement.
- FR-04 : la saisie réutilise le clavier de total X01 et refuse les totaux impossibles (même source que V2-ARCH-03, 057, et V2-GAMES-30, 054).
- FR-05 : le tableau d'honneur affiche au moins rang, pseudo (ou « Anonyme »), score, date ; top 10 visible, liste complète accessible.
- FR-06 : sans consentement, la tentative est classée sous « Anonyme ».
- FR-07 : le défi, ses tentatives et son état sont persistés localement (IndexedDB, repli localStorage) et survivent au rechargement.
- FR-08 : à la date de fin, le défi passe en « terminé » ; ses données sont supprimées automatiquement après un délai (7 jours proposés, Q4).
- FR-09 : « Effacer le tableau » et « Terminer le défi » demandent une confirmation ; un code local facultatif peut les protéger (Q5).
- FR-10 : la mention de marque Bougnat Darts reste visible sur l'écran du défi (V2-BRAND-05, 097).

## 11. Exigences non fonctionnelles

- NFR-01 (lisibilité) : tableau lisible à 2 m sur une tablette 10" en paysage [à confirmer sur appareil].
- NFR-02 (confidentialité) : seuls des pseudonymes sont stockés ; aucune donnée ne quitte l'appareil ; purge automatique (FR-08).
- NFR-03 (accessibilité) : cibles ≥ 48 px, focus visible, tableau en `<table>` sémantique.
- NFR-04 (coût) : 0 € récurrent.
- NFR-05 (robustesse) : 500 tentatives par défi sans dégradation perceptible [à confirmer].

## 12. Cas nominaux et alternatifs

- Nominal : défi créé, 20 tentatives dans la soirée, le top 10 s'affiche.
- Alternatif : client refusant l'affichage → « Anonyme ».
- Alternatif : tablette rechargée pendant une tentative → reprise de la tentative (FR-03).

## 13. Cas limites

- Pseudo vide ou trop long : « Anonyme » ou troncature à 16 caractères (Q6).
- Pseudo offensant : effacement de la tentative par le gérant (FR-09) ; aucun filtrage automatique en V1.
- Horloge de l'appareil modifiée : l'expiration suit l'horloge locale ; accepté.
- Quota de stockage plein : message non bloquant, tentative non enregistrée signalée.

## 14. Gestion des erreurs

- Écriture impossible : la tentative est affichée avec la mention « non enregistrée ».
- Défi corrompu à la lecture : proposition « Réinitialiser le défi » après confirmation.

## 15. Impacts architecturaux

- Domaine : `src/domain/challenge/` (définition, tentative, classement) pur.
- Application : cas d'usage `createChallenge`, `recordAttempt`, `getLeaderboard`, `purgeExpiredChallenges` ; port `ChallengeRepository`.
- Infrastructure : implémentation IndexedDB (nouveau store → montée de version de la base, coordonnée avec 010 et 101).
- Présentation : écrans création, défi, tentative.
- Si V2-ARCH-09 (060) est retenu, le défi s'enregistre comme mode dans le registre de jeux.

## 16. Impacts sur les données et les interfaces

- Nouveau store `challenges` (base `bougnat-counter-local` v2) avec migration additive ; à coordonner avec toute autre évolution de schéma.
- Aucun contrat d'URL en V1 (Q3).

## 17. Compatibilité avec l'existant

- Aucun changement des jeux existants ni du lien 030 ; la montée de version IndexedDB doit préserver les stores existants (`app_sessions`, `current_matches`, `match_history`).

## 18. Dépendances

- V2-ARCH-04 (058) : contrat d'état sérialisable (bloquant).
- V2-ARCH-03 (057) / V2-GAMES-30 (054) : validation des totaux (bloquant pour FR-04).
- V2-BRAND-05 (097) : mention de marque.
- Ultérieures : V2-QR-01 (092), V2-STATION-01 (100), V2-TV-04 (085), V2-TV-02 (084).

## 19. Critères d'acceptation

- AC-01 : appareil sans défi ; créer un défi « Meilleur total en 3 volées » avec date de fin → écran du défi avec tableau vide en ≤ 1 min (chronométré). Preuve : E2E + test terrain.
- AC-02 : tentative 60 + 100 + 140 → score 300, rang 1. Preuve : test unitaire du reducer + E2E.
- AC-03 : saisie d'un total impossible (179) → refusée avec message. Preuve : test unitaire.
- AC-04 : deux tentatives à 300 → la plus ancienne est classée devant. Preuve : test unitaire.
- AC-05 : rechargement pendant la 2e volée → reprise à la 2e volée avec la 1re conservée. Preuve : E2E.
- AC-06 : défi expiré → « Relever le défi » indisponible ; 7 jours plus tard (horloge simulée) → données supprimées. Preuve : tests unitaires.
- AC-07 : case de consentement décochée → tentative affichée « Anonyme ». Preuve : test de composant.
- AC-08 : « Lancer une partie » → jeu → prénoms → jouer inchangé. Preuve : E2E existants.
- AC-09 : montée de version IndexedDB : historique et session existants intacts. Preuve : test de migration.

## 20. Scénarios de tests

- Unitaires : reducer de tentative, classement, expiration et purge, validation des totaux, pseudos.
- Composants : création, tableau, consentement.
- E2E : AC-01, AC-02, AC-05, AC-08.
- Migration : AC-09.
- Terrain : un bar pilote pendant 2 semaines [à confirmer, sur autorisation].

## 21. Exigences de non-régression

- Suites de persistance (`tests/unit/application/indexedDbSessionRepository*.test.ts`) vertes ; parcours de base E2E inchangé.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Triche (saisie fausse) | Faible (local, sans enjeu) | Élevée | Mention RM-06 ; tablette tenue par le lieu |
| Pseudos offensants affichés | Moyen | Moyenne | Effacement par le gérant, code local (Q5) |
| Effacement malveillant du tableau | Faible | Moyenne | Code local facultatif |
| Demande de classement inter-lieux | Moyen (périmètre) | Moyenne | Renvoi explicite vers `Bougnat_Darts_Tournaments` |
| Faible usage | Moyen | Moyenne | Pilote terrain avant extension |

## 23. Décisions architecturales

- Montée de version IndexedDB : à décider avec 010 et 101 (une seule migration coordonnée de préférence).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Emplacement de l'entrée | Pied de l'accueil / Menu « Animation » / Uniquement via station (100) | Menu « Animation » regroupant défi et future soirée (105) | — |
| Q2 | Types de défi en V1 | Total 3 volées / + 121 en 9 fléchettes / + Capital | Total 3 volées seul | — |
| Q3 | Lien/QR de défi partagé | V1 / Plus tard | Plus tard (après 092 et 100) ; classements toujours par appareil | — |
| Q4 | Rétention après la fin | 0 / 7 / 30 jours | 7 jours | — |
| Q5 | Code local de gestion | Aucun / Facultatif / Obligatoire | Facultatif, stocké haché localement | — |
| Q6 | Longueur du pseudo | 12 / 16 / 24 | 16 caractères | — |
| Q7 | Retenir la fonctionnalité en V2.x ? | Oui / Non / Après pilote | Après validation de l'intérêt par un lieu pilote | — |

## 25. Traçabilité

- Rapports : `reports/09-innovation.md` (§4 « Bars », §5.2, §5.3 B, INNO-09, §9 V2-INNO-10).
- Compte rendu : E (rang 9), F.6, G (lot 5).
- Specs liées : 058, 057, 054, 060, 092, 097, 100, 084, 085, 101, 105, 010.
