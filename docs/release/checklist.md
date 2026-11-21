# Checklist de release — porte « Gate »

> Spec [033](../../specs/033-counter-release-v2-0-0-publication/spec.md) (FR-01, AC-01), issue #211.
> **Brouillon à valider par le product owner** : la spec 033 est encore au statut `a-valider`.

Une version n'est taguée et promue en production qu'après que chaque item bloquant est coché **avec une preuve** (lien de run, rapport, compte rendu), sur un **commit candidat unique**. Pendant la gate, la branche de release n'accepte que des correctifs de gate (NFR-02) et aucun réglage DevSecOps ne change (gel DSO-FR-01).

La checklist est réutilisable : copier la section « Gate » pour la version suivante et repartir de cases vides.

## Gate 2.0.0

- **Commit candidat** : `daef027` (`main`, merge de la PR #320). Son arbre est identique à `4b8db58`, tête de `release/v2.0.0` sur laquelle les E2E ont tourné (`git diff 4b8db58 daef027` vide).
- **Preprod** : `main` promue le 2026-11-21 ([Deploy Preview](https://github.com/floriangiral/Bougnat_darts_counter/actions/runs/44877617033)), `https://ccdc74ab.bougnat-darts-counter.pages.dev`, origine partenaire `https://badarts.fr` configurée.
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
| Annulation, revanche et retour au setup (X01 et Cricket) | | | |
| Scoring vocal Deepgram : démarrer, arrêter, naviguer pendant l'écoute, délai d'inactivité | | | |
| Installation de l'application (PWA) et cycle de mise à jour | | | |
| Safari / iOS (iPhone et iPad) | | | |
| Preview connectée validée avant promotion | | | |

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
