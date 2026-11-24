# Checklist de release — porte « Gate »

> Spec [033](../../specs/033-counter-release-v2-0-0-publication/spec.md) (FR-01, AC-01), issue #211.
> **Brouillon à valider par le product owner** : la spec 033 est encore au statut `a-valider`.

Une version n'est taguée et promue en production qu'après que chaque item bloquant est coché **avec une preuve** (lien de run, rapport, compte rendu), sur un **commit candidat unique**. Pendant la gate, la branche de release n'accepte que des correctifs de gate (NFR-02) et aucun réglage DevSecOps ne change (gel DSO-FR-01).

La checklist est réutilisable : copier la section « Gate » pour la version suivante et repartir de cases vides.

## Gate 2.1.0

La 2.0.0 n'a jamais été promue : la 2.1.0 est la première version 2 publiée et reprend sa gate. Les items déjà prouvés pour la 2.0.0 (b, c, d, j) restent acquis ; les autres sont à rejouer sur le commit candidat 2.1.0.

- **Commit candidat** : à fixer (tête de `release/v2.1.0` après fusion de sa PR vers `main`).
- **Contenu** : [notes v2.1.0](v2.1.0.md) — 2.0.0, correctifs de recette #322 à #326, partie rapide X01, limite de volées par manche, score personnalisé ≤ 2501.
- **Production actuelle** : `v1.1.4` (`origin/production` = `c101ba4`).

### Items bloquants

| Item | Exigence | Statut | Preuve |
| --- | --- | --- | --- |
| (a) | V2-DOC-01 (#207) : corrections documentaires | ⬜ À confirmer | Documentation alignée sur 2.1.0 ; spec [034](../../specs/034-counter-doc-immediate-corrections/spec.md) toujours à valider par le PO |
| (b) (c) (d) (j) | Sorties X01, Double/Master-In, contrat `v=1`, PWA | ✅ Acquis en 2.0.0 | Voir « Gate 2.0.0 » ci-dessous |
| (e) | V2-QA-10 (#212) : durcissement CI | ⏭ Reporté | Décision du 2026-11-21, **à confirmer par le PO** |
| (f) | E2E complet vert, 7 projets (Chromium + WebKit) sur le commit candidat | ⬜ À faire | CI de la PR `release/v2.1.0` |
| (g) | Couverture ≥ planchers et `governance:coverage` vert | ⬜ À confirmer en CI | Local 2026-11-23 : lignes 97,75 %, branches 92,76 % |
| (h) | SonarCloud, Snyk, CodeQL verts | ⬜ À faire | Checks du commit candidat |
| (i) | Validations manuelles 025 et revalidations ci-dessous | ⬜ À faire | Tableaux de la gate 2.0.0 et liste ci-dessous |

### À valider sur la preprod 2.1.0

- [ ] Revalidations des correctifs #322 à #326 (liste « À revalider » de la gate 2.0.0)
- [ ] Partie rapide X01 sur téléphone : tout visible sans défiler, Entrée enchaîne les prénoms puis lance, « Personnaliser la partie » puis « ← Partie rapide » rétablit le standard
- [ ] Limite de volées : fenêtre « Départage au bull » à la limite, annulation de la dernière volée, manche attribuée, statistiques sans checkout pour cette manche, en simple et en doublettes
- [ ] Score personnalisé : 2501 accepté, 2502 refusé
- [ ] Fenêtre « Nouveautés » : bloc « Version v2.1.0 » en tête
- [ ] PWA : mise à jour de l'application installée 2.0.0 → 2.1.0 en dehors d'une partie
- [ ] Après le tag — fin de X01 classique : statistiques directes, bandeau de score, Revanche / Partager / Sortie sur une rangée (téléphone et tablette)
- [ ] Après le tag — « Partager » sur iPhone (Safari et PWA installée) et Android ; repli presse-papiers sur PC
- [ ] Après le tag — match partenaire : retour ouvert automatiquement dans un nouvel onglet, message de 2 s ; avec bloqueur de fenêtres ou fin par rechargement : « Réessayer » et « Prévenir l'organisation » ; rechargement des statistiques sans « Revanche »
- [ ] Après le tag — X01 voix désactivée par défaut : touche « Trop de score » sans voix ; avec voix, « Annonce ton score » et « Trop de score » côte à côte, même taille (spec 131)
- [ ] Après le tag — préparation X01 sur tablette, rapide et personnalisée : colonne centrée, récapitulatif pleine largeur, « Lancer la partie » identique en bas
- [ ] Après le tag — raccourcis X01 sur tablette dans l'ordre et les couleurs du pavé ; textes des touches ajustés ; statistiques à 3 ou 4 joueurs sans chevauchement ; moyennes des joueurs en attente en paysage
- [ ] Après le tag — X01 à 3 ou 4 joueurs (spec 132) : rotation anti-horaire des cartes, « Ordre de passage » obligatoire, numéros sur les cartes, « Jouer la 2e place » / « Terminer le match », départage au bull d'une place à la limite de volées, classement final ; lien partenaire `p3`/`p4` avec `rankN` et `places`
- [x] Numéro de version : décision du product owner du 2026-11-24, ces évolutions restent en 2.1.0 ; le tag publié `v2.1.0` a été déplacé sur `a84ce14` le 24/11/2026

### Publication 2.1.0

- [ ] Notes [`v2.1.0.md`](v2.1.0.md) : retirer « Non publiée », date de publication, liens de preuve
- [ ] Changelog in-app daté du jour de publication
- [ ] Workflow **Promote Production** lancé depuis `preprod`
- [ ] `origin/production:package.json` = `2.1.0`
- [x] Tag annoté `v2.1.0` déplacé sur `a84ce14` le 2026-11-24 ; GitHub Release « v2.1.0 » conservée et marquée **Latest** ; pas de tag `v2.0.0` ; anciennes releases et tags conservés
- [ ] Suivi J+1 et J+7 selon le [runbook](runbook.md)

## Gate 2.0.0

> Remplacée par la gate 2.1.0 : la 2.0.0 n'a pas été promue. Conservée comme preuve des items acquis et de la recette du 2026-11-21.

- **Commit candidat** : `daef027` (`main`, merge de la PR #320). Son arbre est identique à `4b8db58`, tête de `release/v2.0.0` sur laquelle les E2E ont tourné (`git diff 4b8db58 daef027` vide).
- **Preprod** : `main` promue le 2026-11-21 ([Deploy Preview](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/44877617033)), `https://preprod.bougnat-darts-counter.pages.dev` (alias de la branche `preprod`), origine partenaire `https://badarts.fr` configurée.
  ⚠️ `https://ccdc74ab.bougnat-darts-counter.pages.dev`, encore indiquée comme preprod dans `docs/technical.md`, `wrangler.jsonc` (`VITE_APP_URL`) et le simulateur partenaire, est un **déploiement figé d'août** : son en-tête CSP d'avant #153 bloque les scripts et l'application ne démarre pas. Correction rattachée à V2-REL-03 (#285, spec 009) ; impact limité à la preprod (QR, lien de partage, option « Préprod » du simulateur).
- **Production actuelle** : `v1.1.4` (`origin/production` = `c101ba4`).

### Items bloquants

| Item | Exigence | Statut | Preuve |
| --- | --- | --- | --- |
| (a) | V2-DOC-01 (#207) clos : corrections documentaires | ⬜ En cours | Spec [034](../../specs/034-counter-doc-immediate-corrections/spec.md), à valider par le PO |
| (b) | V2-GAMES-01 (#204) livré : conformité des sorties X01 | ✅ | Issue #204 fermée le 2026-11-21 |
| (c) | V2-GAMES-02 (#213) tranché et appliqué : Double/Master-In | ✅ | Issue #213 fermée le 2026-11-21 |
| (d) | V2-INT-01 (#205) clos : contrat `v=1` figé | ✅ | Issue #205 fermée le 2026-11-21 |
| (e) | V2-QA-10 (#212) a minima C1/C2/C9 : durcissement CI | ⏭ Reporté en 2.0.1 | Décision du 2026-11-21 (gel DevSecOps pendant la gate) — **à confirmer par le PO**, l'item étant bloquant dans la spec 033 |
| (f) | E2E complet vert, 7 projets (Chromium + WebKit), build servi avec `VITE_EXTERNAL_RETURN_ALLOWED_ORIGINS=https://partner.example` | ✅ | [End-to-End sur `4b8db58`](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/44877207535) (la CI installe Chromium et WebKit et lance `npm run test:e2e`) |
| (g) | Couverture ≥ planchers 90/80/90/90 et `governance:coverage` vert | ✅ | [Quality Gate sur `main`](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/44877543066) (jobs « Lint, Typecheck, Unit Tests, Build » et « SonarCloud ») |
| (h) | SonarCloud Quality Gate, analyses de dépendances (Snyk) et CodeQL verts | ✅ | Checks du commit `daef027` : SonarCloud Code Analysis, Snyk Dependencies, Snyk Container, CodeQL, NPM Audit, Gitleaks — tous « success » ; [Security Review](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/44877543039) |
| (i) | Validations manuelles 025 tracées (voir ci-dessous) | ⬜ À faire | Tableau « Validations manuelles » |
| (j) | Décision 031 (PWA) appliquée | ✅ Incluse dans 2.0.0 | `public/manifest.json` et `public/sw.js` livrés (commit `92d398c`, notes 2.0.0) ; issue #216 encore ouverte, à fermer |

### Validations manuelles (025, FR-03, AC-04)

À exécuter sur la preprod. Noter pour chaque ligne l'appareil, le navigateur, la date et le résultat.

| Parcours | Appareil / navigateur | Date | Résultat |
| --- | --- | --- | --- |
| Annulation, revanche et retour au setup (X01 et Cricket) | PC (Chrome), téléphone Android (Chrome) | 2026-11-21 | ✅ Annulation de scores, finish par appui long, revanche et sortie avec confirmation (réglages conservés au retour au setup), en X01 et en Cricket |
| Reprise après rechargement de la page (X01 et Cricket) | PC (Chrome), téléphone Android (Chrome) | 2026-11-21 | ✅ La partie reprend où elle en était |
| Affichage téléphone : barre de raccourcis, réglage Actif / Off, pas de chevauchement, 501 lisible, en-tête carré, paysage utilisable | Téléphone Android (Chrome) | 2026-11-21 | ✅ Raccourcis, interrupteur, mise en page et nouvel affichage paysage. ⚠️ Modifier un score de la barre : défaut trouvé (voir « Défauts ») |
| Scoring vocal Deepgram : démarrer, arrêter, naviguer pendant l'écoute, délai d'inactivité | Téléphone Android (Chrome) | 2026-11-21 | ✅ Autorisation du micro, annonce reconnue et validée, arrêt, arrêt propre en changeant d'écran, désactivation de l'assistance. ⚠️ « Micro en erreur » après une annonce réussie et après l'inactivité ; message d'inactivité tronqué (voir « Défauts ») |
| Installation de l'application (PWA) et cycle de mise à jour | | | |
| Safari / iOS (iPhone et iPad) | | | |
| Preview connectée validée avant promotion | | | |

### Défauts trouvés pendant la recette

| Défaut | Où | Statut |
| --- | --- | --- |
| Adresse de preprod documentée (`ccdc74ab…pages.dev`) = déploiement figé d'août, l'application n'y démarre pas | `wrangler.jsonc`, `docs/technical.md`, simulateur partenaire | ✅ Corrigé par #322 (Refs #285), à revalider en preprod |
| « FINISH » superposé au chiffre sur le pavé X01 bureau | PC | ✅ Corrigé par #323, à revalider |
| « ✓ OK » déborde de sa touche sur PC à fenêtre basse | PC | ✅ Corrigé par #323, à revalider |
| Cricket : croix de la cible fermée décentrée dans son cercle ; « / », « X » et X cerclé de formes différentes | PC | ✅ Corrigé par #323, à revalider |
| Dernière rangée de l'écran de jeu coupée en plein écran (visible seulement après défilement), X01 et Cricket | Android (Chrome) | Cause : `100dvh` plus haut que la zone visible en plein écran. ✅ Corrigé par #324, à revalider |
| Modifier un score de la barre : taper 179 enregistre 17, taper 666 enregistre 66 (enregistrement à chaque frappe) | Android (Chrome) ; aussi colonnes latérales et page Réglages | Défaut antérieur (présent en 1.1.4). ✅ Corrigé par #325, à revalider |
| Voix : « Micro en erreur » après une annonce reconnue (délai d'écoute non arrêté) et après une simple inactivité ; message d'inactivité tronqué | Android (Chrome) | ✅ Corrigé par #326 (vérifié avec Deepgram simulé), à revalider sur Android |
| Statistiques Cloudflare : `cdn-cgi/rum` répond 404 en preprod (visites non comptées, sans effet sur le jeu) | Preprod | À vérifier côté Cloudflare (jeton Web Analytics non déclaré pour l'alias preprod) |

### À revalider sur la preprod après fusion des correctifs et redéploiement

- [ ] Pavé X01 bureau : « FINISH » sous le chiffre, « ✓ OK » dans sa touche (`fix/keypad-finish-label`)
- [ ] Cricket : marques « / », « X » et X cerclé au même trait, croix centrée (`fix/keypad-finish-label`)
- [ ] Plein écran Android : dernière rangée entière sans défilement, en X01 et en Cricket (`fix/fullscreen-height`)
- [ ] Scores de la barre : 57 enregistré ; 179 et 666 refusés, ancien score conservé (`fix/shortcut-commit-on-blur`)
- [ ] Voix : annonce reconnue sans « Micro en erreur » ensuite ; inactivité avec message entier et touche « Annonce ton score » (`fix/voice-timeout-state`)
- [ ] QR code et lien de partage de la preprod vers `preprod.bougnat-darts-counter.pages.dev` (`fix/preprod-url`)
- [ ] PWA : mise à jour de l'application installée en dehors d'une partie (nécessite ce redéploiement)

### Parcours partenaire en preprod (FR-04, AC-07)

| Parcours | Date | Résultat |
| --- | --- | --- |
| Lien de match ouvert depuis le [simulateur partenaire](../integration/partner-simulator/index.html), match joué, résultat renvoyé (`status=completed`) | | |
| Abandon depuis le match : retour au tournoi (`status=cancelled`) | | |
| Essai avec badarts.fr (seulement avec l'accord du partenaire) | | |

### Retour arrière vérifié (T013)

| Vérification | Date | Résultat |
| --- | --- | --- |
| Session 2.0.0 relue par 1.1.4 (même clé `bougnat-app-session-v1`, même base IndexedDB v1) | 2026-11-21 | ✅ **X01 en cours** : relu à l'identique (scores, fléchettes, moyennes), aucune erreur console. ⚠️ **Cricket en cours** : aucune erreur, mais la partie repart à zéro (la 1.1.4 ne reprend que le X01). Test local, Chrome, profils navigateur persistants. |

### Publication (après tous les items bloquants)

- [ ] Notes [`v2.0.0.md`](v2.0.0.md) : retirer « Non publiee » et « a confirmer », date de publication, liens de preuve (FR-05, AC-06)
- [ ] Changelog in-app (`components/ui/ChangelogModal.tsx`) daté du jour de publication
- [ ] Bandeaux des notes v1.1.x : ne plus présenter 1.1.x comme version active
- [ ] Workflow **Promote Production** lancé depuis `preprod` (`confirm_branch=preprod`, `confirm_target=production`)
- [ ] `origin/production:package.json` = `2.0.0` (AC-05)
- [ ] Tag `v2.0.0` sur le commit promu et GitHub Release (notes = `docs/release/v2.0.0.md`) (FR-06)
- [ ] Statuts de specs : 030 → `implementee` ; 025, 026 → `cloturee` ; 007 → remplacée par cette checklist ; reliquats transférés (FR-08, AC-08)
- [ ] Suivi J+1 et J+7 selon le [runbook](runbook.md)
