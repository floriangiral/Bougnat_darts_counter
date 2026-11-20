---
id: 034-counter-doc-immediate-corrections
v2_id: V2-DOC-01
titre: Corrections documentaires immédiates
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: doc
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 60
depend_de: []
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 034 — Corrections documentaires immédiates

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

L'audit V2 (rapport `10-docs-quality.md` §2 et §7.1, compte rendu §B.4 et §C.8) a relevé 11 écarts majeurs entre la documentation et le code au commit `508dfa6` : fonctionnalités présentées comme disponibles alors qu'elles ne le sont pas, contradictions entre notes de release et configuration livrée, compteurs de tests divergents, liens absolus `/home/...` cassés sur GitHub et formulaires d'issue obsolètes. Ces corrections ne dépendent d'aucune implémentation V2 et conditionnent la publication 2.0.0 (V2-REL-01, spec 033).

Le product owner a autorisé les corrections documentaires immédiates : une partie est appliquée dans la PR `docs/v2-specs` (voir `tasks.md`), le reste est planifié ici.

## 2. Problématique

Un joueur, un partenaire (badarts.fr) ou un agent IA qui lit la documentation actuelle croit disponibles des fonctions absentes (ouverture Double/Master-In, reprise de tous les jeux, historique consultable) et reçoit des informations contradictoires sur l'état de la release 2.0.0.

## 3. Objectifs

- O1 : zéro fonctionnalité non livrée présentée comme disponible (règle 4 des conventions SDD, `.specify/conventions.md` §4).
- O2 : zéro contradiction entre notes de release, configuration livrée (`wrangler.jsonc`) et code.
- O3 : zéro lien absolu local (`/home/...`) dans les fichiers versionnés.
- O4 : formulaires d'issue couvrant les six jeux réels et les zones actives.
- O5 : chaque écart non corrigé ici est rattaché à une spec propriétaire (ID V2).

## 4. État actuel vérifié dans le code

Références au commit `508dfa6` (les numéros de ligne peuvent avoir bougé dans l'arbre de travail de la PR). Inventaire exhaustif : voir §10 (FR-01 à FR-12) et le tableau de `tasks.md`.

- [vérifié] `checkIn` est saisi (`components/game-setup/SetupX01RulesSection.tsx:27`) et persisté (`src/shared/session/persistedAppSession.ts:15`) mais aucun calcul de score ne le lit (`src/application/scoring/matchLifecycle.ts:264` ne teste que `checkOut`).
- [vérifié] Seul X01 est restauré après rechargement (`App.tsx:353-361` vs `App.tsx:364-422` pour les autres jeux).
- [vérifié] `listLocalGameHistory` n'a aucun consommateur UI (historique écrit, jamais affiché).
- [vérifié] `wrangler.jsonc:17` et `wrangler.jsonc:29` déclarent `https://badarts.fr` alors que `docs/release/v2.0.0.md:9` affirme le lien « désactivé tant qu'aucune origine n'est déclarée ».
- [vérifié] `dist/index.html` référence un manifeste haché `/assets/manifest-*.json` : le manifeste est livré ; seuls `/sw.js`, `/manifest.json` et `/logo.svg` sont absents du build. `docs/release/v2.0.0.md:70` affirme à tort que le manifeste n'est pas livré.
- [vérifié] `docs/technical.md:187` et `:218` contiennent des liens absolus locaux (`/home/<utilisateur>/…/wrangler.jsonc`).
- [vérifié] `.github/ISSUE_TEMPLATE/bug_report.yml:25,30` et `improvement.yml:24,29` proposent « 501 Double Out » et « Historique » mais ni Killer, ni Gotcha, ni lien de match, ni tablette.
- [vérifié] Compteurs : `specs/README.md:142` (727 tests) vs `docs/release/v2.0.0.md:87` (746) ; `docs/technical.md:132` (« 61 tests E2E passent ») vs `docs/release/v2.0.0.md:100-102` (suite complète non exécutée).
- [à confirmer] Le site vitrine (hors dépôt) promet une « annonce vocale des scores » inexistante (compte rendu §B.4) ; URL exacte non vérifiée.

## 5. Comportement cible

Chaque document décrit l'état **livré** ; les capacités partielles sont qualifiées (« X01 seulement », « enregistré, pas encore consultable ») avec un lien vers la spec qui les traite ; les promesses futures sont renvoyées vers la feuille de route V2 ou la spec, jamais présentées comme disponibles.

## 6. Périmètre

### Inclus
- `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/**/*.md`, `.specify/memory/constitution.md`, `.github/ISSUE_TEMPLATE/*.yml`.
- Signalement (sans correction) des écarts situés dans le code, les specs ou la CI, avec rattachement à la spec propriétaire.

### Exclu
- Réorganisation de `docs/` et bandeaux de statut normalisés (V2-DOC-02, spec 035).
- Contenu de `AGENTS.md` (V2-DOC-03, spec 036).
- Index et statuts de `specs/README.md` (V2-SDD-01, spec 032).
- Toute modification de code applicatif, de test ou de workflow (libellés UI, `quality-gate.yml`, `.env.local.example`).
- Traduction des specs historiques anglaises (conventions §7).

## 7. User stories

- En tant que joueur, je veux que le README ne promette que ce que l'application fait, afin de ne pas être déçu en partie.
- En tant que partenaire, je veux savoir que `in=double` n'a aujourd'hui aucun effet, afin de ne pas l'imposer à tort.
- En tant que testeur, je veux pouvoir signaler un bug Killer ou Gotcha dans le formulaire, afin que le retour soit correctement classé.
- En tant que contributeur (humain ou agent), je veux des liens qui fonctionnent sur GitHub et des chiffres cohérents.

## 8. Règles métier

- RM-01 : une capacité n'est décrite comme disponible que si elle est implémentée **et** atteignable par l'utilisateur dans la version décrite.
- RM-02 : une capacité partielle mentionne sa limite et la spec de suivi.
- RM-03 : la version « en production » n'est affirmée qu'après vérification (`origin/production:package.json` = 1.1.4 au 2026-11-20 ; état Cloudflare [à confirmer]).
- RM-04 : un chiffre (tests, couverture, E2E) est toujours daté et sourcé.

## 9. Parcours utilisateurs

Sans objet : aucun parcours applicatif n'est modifié (parcours de base ouvrir → jeu → prénoms → jouer inchangé).

## 10. Exigences fonctionnelles

- FR-01 Sur-promesse « ouverture / Double-In / Master-In » : retirer ou qualifier dans `README.md:30`, `docs/specifications.md:80`, et ajouter un avertissement sur `in` dans `docs/integration/external-match-link.md:46` (« accepté, sans effet sur le score tant que V2-GAMES-02 n'est pas tranché »).
- FR-02 Sur-promesse « reprise » : limiter à X01 dans `README.md:22`, `docs/specifications.md:20,243`, `docs/product-scope.md:10`, `docs/architecture.md:36` (+ lien spec 010 / V2-ARCH-06).
- FR-03 Sur-promesse « historique local » : « enregistré, non consultable » dans `docs/specifications.md:21,236,245`, `docs/product-scope.md:11` (+ lien V2-HIST-01, spec 101).
- FR-04 Vocabulaire : « 501 Double Out » n'est pas un jeu (`docs/specifications.md:68`, `docs/technical.md:12`) ; « bot IA » → « adversaire robot » (`docs/product-scope.md:28`) ; `CONNECTED_MODE` inexistant (`docs/architecture.md:60-65`) ; « écran de comptoir… tout le monde suit » à reformuler sans laisser croire à un mode TV (`README.md:21,60`).
- FR-05 Contradiction 030 : aligner `docs/release/v2.0.0.md:9`, `docs/product-scope.md:41`, `docs/architecture.md:158,172` sur la configuration livrée (badarts.fr déclaré en preview et production, commit `f9ac4c2`).
- FR-06 Contradiction PWA : corriger `docs/release/v2.0.0.md:70` (manifeste haché livré ; `/sw.js` absent → enregistrement en échec ; `sw.js:6-7` précache `/logo.svg` et `/manifest.json` absents du build).
- FR-07 Contradiction 028 : signaler dans la documentation (et dans la révision V2 de la spec 028, V2-TAB-06) que l'invariant « Landscape is never functionally blocked » (`specs/028-counter-smartphone-display/spec.md:31`) est contredit par le portrait imposé (`src/features/smartphone/usePortraitLock.ts`, `src/features/smartphone/RotateToPortraitOverlay.tsx`).
- FR-08 Compteurs : `specs/README.md:142` (727) et `docs/technical.md:132` (61 E2E) et `:333` (398 tests du 3 novembre) alignés sur la dernière mesure datée ; mention explicite « suite E2E complète non exécutée » tant que V2-REL-01 ne l'a pas fait.
- FR-09 Liens absolus : `docs/technical.md:187,218` et `.specify/memory/constitution.md:4` remplacés par des liens relatifs ou une citation du contenu utile.
- FR-10 Formulaires d'issue : ajouter Killer, Gotcha, Lien de match partenaire, Mode tablette ; retirer « 501 Double Out » et « Historique » ; placeholder de version `v1.0.1` (`bug_report.yml:113`) actualisé.
- FR-11 Bandeaux de release : `docs/release/v1.1*.md:3` (« La version active est v2.0.0 ») → « Dernière version préparée : v2.0.0 (non publiée) » ; bandeau historique sur `docs/release/v1.0.0.md`, `v1.0.1.md`, `v1.0.2.md` (statut « stable », l.5) et `react-19-validation-matrix.md:5` (React 19.2.0 vs 19.3.1).
- FR-12 Compléments techniques (`docs/technical.md`) : prérequis E2E locaux (installation WebKit, `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example`), Docker de dev (`compose.yml`), support navigateurs (`vite.config.ts:29-33`), index documentaire (`docs/technical.md:393-412`, entrées manquantes `v1.0.0`, `v1.0.2-coverage-map`, `react-19-validation-matrix`), affirmation l.187 « `VITE_APP_*` déclarées dans `wrangler.jsonc` » inexacte pour `VITE_APP_VERSION` (absente de `wrangler.jsonc:10-19`, voir spec 009).
- FR-13 `CONTRIBUTING.md:35-48` : ajouter `guard:clean` et le renvoi vers les prérequis E2E ; renvoyer vers `AGENTS.md` et `.specify/conventions.md`.
- FR-14 Écarts hors documentation : chaque écart du tableau `tasks.md` marqué « rattaché » est inscrit dans la spec propriétaire indiquée (aucune correction de code ici).

## 11. Exigences non fonctionnelles

- NFR-01 Langue : textes modifiés en français accentué, sans réécrire les passages non concernés.
- NFR-02 Traçabilité : chaque modification cite la spec qui porte la fonctionnalité future.
- NFR-03 Coût : nul (aucune dépendance, aucun service).

## 12. Cas nominaux et alternatifs

- Nominal : correction sur place, lien vers la spec V2.
- Alternatif : si V2-DOC-02 (réorganisation) est validée avant la fin de 034, les corrections restantes sont faites directement dans la structure cible.

## 13. Cas limites

- `README.md` de `main` vs `feat/v2.0.0` : les corrections portant sur la 2.0.0 (lien partenaire) ne doivent pas atteindre `main` avant la publication (question Q3).
- Décision V2-GAMES-02 « implémenter » : l'avertissement sur `in=` devient temporaire et doit être retiré à la livraison.

## 14. Gestion des erreurs

Sans objet (documentation) ; une erreur de lien est détectée par la relecture puis, à terme, par le contrôle « doc drift » de V2-QA-10.

## 15. Impacts architecturaux

Aucun sur le code. La documentation d'architecture (`docs/architecture.md`) décrit l'arbre réel et les violations connues de la règle de dépendance, sans en promettre l'outillage (porté par V2-ARCH-01, spec 056).

## 16. Impacts sur les données et les interfaces

Contrat partenaire `v=1` inchangé ; seule sa documentation signale l'absence d'effet de `in`.

## 17. Compatibilité avec l'existant

Liens existants conservés (aucun déplacement de fichier dans cette spec).

## 18. Dépendances

Aucune dépendance bloquante. Liens : V2-REL-01 (033) dépend de 034 ; V2-GAMES-02 (046), V2-ARCH-06 (010), V2-HIST-01 (101), V2-TAB-06 (028), V2-INT-01 (030), V2-REL-02 (031), V2-REL-03 (009), V2-QA-10 (043), V2-SDD-01 (032), V2-DOC-02 (035), V2-DOC-03 (036).

## 19. Critères d'acceptation

- AC-01 `grep -rniE "double in|master in|l.ouverture" README.md docs/` ne renvoie que des mentions qualifiées (non appliqué / spec à venir).
- AC-02 `grep -rn "](/home/" --include=*.md .` (hors `node_modules`) ne renvoie aucun lien Markdown absolu local dans les fichiers versionnés.
- AC-03 Aucune occurrence de « historique local » ou « reprise » présentée sans qualification dans `README.md`, `docs/product-scope.md`, `docs/specifications.md`.
- AC-04 `docs/release/v2.0.0.md` est cohérent avec `wrangler.jsonc` (origine badarts.fr) et avec `dist/` (manifeste haché livré, `/sw.js` absent).
- AC-05 Un seul chiffre de tests unitaires daté et sourcé dans `specs/README.md`, `docs/technical.md` et les notes 2.0.0.
- AC-06 Les deux formulaires d'issue listent X01, Cricket, Capital, Killer, Gotcha, Triathlon, Lien de match, Mode tablette, sans « 501 Double Out » ni « Historique ».
- AC-07 Chaque ligne « rattachée » de `tasks.md` apparaît dans la spec propriétaire (vérification par lecture).
- AC-08 Relecture par le product owner : aucune promesse non tenue relevée dans `README.md`.

## 20. Scénarios de tests

Pas de test automatisé ajouté par cette spec (documentation). Vérifications par commandes `grep` (AC-01, AC-02, AC-06) et relecture. Contrôle automatique durable : script « doc drift » proposé par V2-QA-10 (043).

## 21. Exigences de non-régression

- Les liens relatifs ajoutés résolvent sur GitHub.
- `tests/unit/tooling/partnerSimulator.test.ts` reste vert (le simulateur partenaire n'est pas modifié).

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Correction de `README.md` fusionnée dans `main` avant publication 2.0.0 | Moyen | Moyenne | Corrections 2.0.0 sur la branche de release uniquement (Q3) |
| Retirer « Double-In » de la doc casse la confiance de partenaires utilisant `in=double` | Moyen | Faible | Avertissement plutôt que retrait du paramètre ; décision V2-GAMES-02 |
| Corrections reperdues lors de la réorganisation V2-DOC-02 | Faible | Moyenne | 035 reprend le contenu corrigé, pas l'ancien |

## 23. Décisions architecturales

Aucun ADR. Rappel d'arbitrages : H.2 (Double/Master-In), H.9 (reprise multi-jeux), H.12 (historique), H.26 (réorganisation de `docs/`), H.27 (site vitrine).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Lien WhatsApp public (`.github/ISSUE_TEMPLATE/config.yml:3-5`) | Conserver / retirer / remplacer par Discussions | Conserver si volontaire, sinon remplacer par GitHub Discussions | — |
| Q2 | Adresse sécurité `bougnatdarts.net` (`SECURITY.md:15`) vs domaine `.fr` | Confirmer `.net` / passer en `.fr` | Confirmer que la boîte `.net` est opérée, sinon `.fr` | — |
| Q3 | Corrections visant 2.0.0 : sur `feat/v2.0.0` seulement ou aussi `main` | Branche de release / les deux | Branche de release ; `main` reçoit uniquement les corrections valables pour 1.1.x | — |
| Q4 | Site vitrine (« annonce vocale des scores ») | Corriger maintenant / attendre la voix V2 | Corriger maintenant (H.27) ; remettre la promesse à la livraison de V2-VOICE-05 | — |
| Q5 | Libellé UI « Assistance vocale IA » (`components/match/MatchSettingsModal.tsx:89`) | Garder / « Saisie vocale » | « Saisie vocale » via V2-GAMES-10 (013), hors 034 | — |

## 25. Traçabilité

Rapports : `10-docs-quality.md` §2.1-2.3, §7.1 (I1-I11) ; `01-specs-backlog.md` §7 (A9, A10) ; compte rendu §B.4, §C.8, §H (Q2, Q9, Q12, Q26, Q27). Commit de référence `508dfa6`. Spec suivante : V2-REL-01 (033).
