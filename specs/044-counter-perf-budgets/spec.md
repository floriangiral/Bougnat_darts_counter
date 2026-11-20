---
id: 044-counter-perf-budgets
v2_id: V2-PERF-01
titre: Budgets de performance mesurés (INP, bundle)
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Backlog existant
famille: qualite
priorite: P2
difficulte: S
recommandation: recommande
lot: 5
poids: 20
depend_de: []
remplace: []
remplacee_par: []
issue: null
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 044 — Budgets de performance mesurés (INP, bundle)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La spec 020 (« INP phase 1 ») a livré trois correctifs pour passer l'INP mobile de 296 ms (P75) sous 200 ms, mais sa validation « INP P75 mobile < 200 ms après déploiement » n'a jamais été mesurée (`specs/020-…/spec.md:27, 89` ; statut réel « Implémentée, non mesurée »). Le compte rendu V2 (§B.2, §F.1) propose de clôturer 020 après mesure et d'ouvrir cette suite. La V2 ajoutera des modules lourds (voix mains libres, TV, QR, thèmes) qui doivent rester chargés à la demande.

## 2. Problématique

Aucune mesure ne garantit que l'application reste réactive et légère : l'INP n'est pas suivi, la taille du bundle n'a pas de plafond, et le découpage actuel annule le chargement différé des écrans.

## 3. Objectifs

- O1 : mesurer l'INP réel (terrain) et un indicateur de laboratoire reproductible, et clôturer 020 sur preuve.
- O2 : fixer des budgets de taille par chunk, contrôlés à chaque build en CI.
- O3 : garantir le chargement différé des modules optionnels (voix, TV, QR, éditeur de thème).

## 4. État actuel vérifié dans le code

- [vérifié] Les vues sont importées en `React.lazy` (`App.tsx:54-65`), mais `manualChunks` regroupe tout fichier contenant `/views/` dans un seul chunk `views` (`vite.config.ts:80-91`) ; dans le build du 19/11 (`dist/`, antérieur au HEAD de quelques commits [à confirmer au HEAD]), ce chunk est **préchargé** par `dist/index.html` (`modulepreload` de `views-*.js`) : le chargement différé est donc sans effet.
- [vérifié, build du 19/11] Tailles gzip mesurées en lecture seule : `views` 97 Ko (452 Ko bruts), `react-vendor` 65 Ko, `polyfills` modernes 22 Ko, `index` 10 Ko, `icons-vendor` 7 Ko, CSS 21 Ko ; JS initial moderne ≈ 202 Ko gzip. Bundle legacy : `polyfills-legacy` 45 Ko, `index-legacy` 32 Ko, `views-legacy` 102 Ko.
- [vérifié] La voix est importée statiquement par `views/MatchView.tsx:20-21` (`useDeepgramStreaming`, `VoiceScoringControl`) : son code est téléchargé même quand `VITE_ENABLE_VOICE_SCORING=false`.
- [vérifié] `modernPolyfills: true` et cible `ios >= 12` (`vite.config.ts:29-33`) : polyfills chargés aussi par les navigateurs modernes ; dépend de la baseline 018.
- [vérifié] `qrcode` est une dépendance d'exécution (`package.json:34`) mais n'est utilisé que par `scripts/generate-app-qr.mjs:3` (QR généré au build) : absent du bundle aujourd'hui ; un QR côté client (V2-QR-01, 092) l'y ferait entrer.
- [vérifié] Le chrono incrémente l'état chaque seconde (`src/features/x01/hooks/useMatchTimer.ts:27-32`) ; la persistance est différée de 300 ms (`src/app/appShell.ts:132`) mais se déclenche donc chaque seconde en partie (correction portée par 010).
- [vérifié] Le beacon Cloudflare Web Analytics est injecté si un jeton est fourni (`index.tsx:30-39`) ; la CSP l'autorise (`public/_headers:2`). [à confirmer] Disponibilité de l'INP P75 par type d'appareil dans le tableau de bord Cloudflare.
- [vérifié] Aucun contrôle de taille de bundle ni mesure de performance dans les workflows (`.github/workflows/*.yml`).

## 5. Comportement cible

1. **Terrain** : l'INP P75 mobile est relevé dans Cloudflare Web Analytics à chaque release et consigné dans la note de version.
2. **Laboratoire** : un test Playwright Chromium (CPU ralenti ×4) joue une séquence de saisie X01 et Cricket et mesure la durée des interactions via l'API Event Timing ; un rapport est produit en nightly (informatif).
3. **Bundle** : après chaque build CI, un script compare la taille gzip de chaque chunk et du chargement initial à `perf-budgets.json` et échoue en cas de dépassement.
4. **Chargement différé** : chaque écran de jeu, la voix, et les futurs modules TV/QR/éditeur de thème sont dans des chunks séparés non préchargés au démarrage.

## 6. Périmètre

### Inclus
- Mesure terrain et laboratoire de l'INP ; clôture de 020.
- Budgets par chunk et chargement initial ; script de contrôle CI.
- Correction du découpage des vues et import différé de la voix.
- Règle de chargement différé pour les modules V2 optionnels.

### Exclu
- Correction de l'écriture chaque seconde (010, V2-ARCH-06).
- Choix de la baseline navigateurs et des polyfills (018, V2-DS-00).
- Optimisations de rendu React au-delà des constats de mesure (nouvelles specs si nécessaire).

## 7. User stories

- En tant que joueur sur une tablette d'entrée de gamme, je veux que la touche réagisse immédiatement, afin de ne pas saisir deux fois.
- En tant que gérant de bar en 4G, je veux que l'application s'ouvre vite, afin de lancer la partie sans attendre.

## 8. Règles métier

- RM-01 Un dépassement de budget bloque la PR, sauf relèvement explicite du budget justifié dans la PR et accepté par le PO.
- RM-02 Un module optionnel (voix, TV, QR, thèmes) n'est jamais chargé avant que l'utilisateur ne l'active.

## 9. Parcours utilisateurs

Sans objet côté joueur (aucun changement visible). Contributeur : `npm run build` puis `npm run perf:budget` en local ; lecture du rapport en CI.

## 10. Exigences fonctionnelles

- FR-01 `perf-budgets.json` (budgets gzip par chunk nommé et pour le chargement initial), versionné.
- FR-02 Script `scripts/check-bundle-budget.mjs` : lit `dist/index.html` et `dist/assets/`, calcule les tailles gzip (`node:zlib`), identifie le chargement initial (entrée + `modulepreload`), compare aux budgets, publie un tableau dans le résumé CI.
- FR-03 Étape CI après `build` dans le job `validate` (043).
- FR-04 Supprimer le regroupement `views` de `manualChunks` (un chunk par écran, sans préchargement initial) ; vérifier l'absence de `modulepreload` des écrans de jeu.
- FR-05 Charger la voix à la demande (import dynamique du contrôle vocal et du hook) quand la voix est activée.
- FR-06 Test de laboratoire INP (Chromium, CPU ×4, séquence de 20 saisies X01 et 20 Cricket) : rapport p75 et maximum des durées d'interaction ; informatif en nightly.
- FR-07 Relevé terrain INP P75 mobile/desktop à chaque release dans la note de version ; clôture de 020 si < 200 ms sur 28 jours [durée à confirmer].

## 11. Exigences non fonctionnelles

- NFR-01 Budgets proposés (à valider, gzip) : chargement initial JS moderne ≤ 210 Ko au lot de mise en place (non-régression, état ≈ 202 Ko), cible ≤ 150 Ko après FR-04/FR-05 ; chunk d'écran ≤ 40 Ko ; chunk voix ≤ 40 Ko ; CSS ≤ 25 Ko.
- NFR-02 INP laboratoire p75 ≤ 100 ms sous CPU ×4 [seuil à calibrer après première mesure].
- NFR-03 Coût : 0 € (Cloudflare Web Analytics gratuit, déjà en place ; aucune dépendance ajoutée).
- NFR-04 Confidentialité : aucune nouvelle collecte ; pas de bibliothèque d'envoi de métriques vers un serveur tiers.

## 12. Cas nominaux et alternatifs

- Nominal : PR sans impact → tableau de tailles dans le résumé, vert.
- Alternatif : ajout d'une bibliothèque lourde → échec avec chunk et dépassement indiqués.

## 13. Cas limites

- Bundle legacy (si conservé par 018) : budgets séparés.
- Navigateur sans Event Timing (WebKit, Firefox) : mesure laboratoire Chromium seulement ; terrain via Cloudflare.

## 14. Gestion des erreurs

Script de budget : message par chunk (taille, budget, écart) ; absence de `dist/` → erreur explicite « lancer le build d'abord ».

## 15. Impacts architecturaux

Configuration de build (`vite.config.ts`) et imports dynamiques dans la couche UI ; aucune règle de jeu touchée.

## 16. Impacts sur les données et les interfaces

Aucun.

## 17. Compatibilité avec l'existant

Le passage à un chunk par écran ajoute une requête à l'ouverture d'un jeu ; le service worker (031) devra précacher ces chunks pour l'usage hors ligne.

## 18. Dépendances

- Aucune dépendance bloquante.
- Liées : 020 (clôture), 043 (étape CI), 031 (précache des chunks), 018 (polyfills), 092 (QR à la demande), 010 (écriture par seconde).

## 19. Critères d'acceptation

- AC-01 `npm run perf:budget` après un build affiche la taille gzip de chaque chunk et du chargement initial ; dépassement → code de sortie non nul.
- AC-02 Après FR-04, `dist/index.html` ne précharge aucun chunk d'écran de jeu ; ouvrir l'accueil ne télécharge pas `MatchView` (onglet réseau ou trace Playwright).
- AC-03 Avec `VITE_ENABLE_VOICE_SCORING=false`, aucun chunk contenant le code Deepgram n'est téléchargé pendant une partie X01.
- AC-04 Le rapport de laboratoire INP est publié en nightly ; la première mesure est consignée dans la spec.
- AC-05 L'INP P75 mobile terrain est consigné pour la release suivante ; 020 est clôturée ou rouverte selon le résultat.

## 20. Scénarios de tests

Unitaires du script de budget (fixtures de `dist` factice) ; E2E réseau (AC-02, AC-03) ; laboratoire INP (FR-06).

## 21. Exigences de non-régression

Parcours E2E existants verts ; usage hors ligne inchangé une fois 031 livrée ; invariants de 020 (pointerdown, long-press 450 ms) préservés.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Laboratoire non représentatif | Moyen | Élevée | Terrain fait foi ; laboratoire informatif |
| Chunks par écran mal précachés hors ligne | Élevé | Moyenne | Coordination avec 031, test E2E hors ligne |
| INP absent du tableau Cloudflare | Moyen | Faible | [à confirmer] ; repli : mesure terrain manuelle (Chrome DevTools) |
| Budgets trop serrés | Faible | Moyenne | Budget de non-régression d'abord, cible ensuite |

## 23. Décisions architecturales

Aucun ADR ; règle RM-02 à reprendre dans `AGENTS.md` (036).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Mesure terrain | Cloudflare Web Analytics / bibliothèque `web-vitals` + point de collecte | Cloudflare seul (déjà en place, sans cookie, sans serveur) | — |
| Q2 | Budgets de NFR-01 | Tels quels / autres | Tels quels, revus après la première mesure | — |
| Q3 | Laboratoire INP bloquant ? | Bloquant / informatif | Informatif (variabilité des runners) | — |
| Q4 | Avancer FR-04/FR-05 hors lot 5 ? | Lot 5 / avec 031 (lot 0) | Avec 031 si la PWA est livrée avant (précache cohérent) | — |

## 25. Traçabilité

Spec 020 ; rapport `docs/v2/audit/10-docs-quality.md` (§3.3 « performance non mesurée ») ; rapport `docs/v2/audit/02-architecture.md` (§4.4 écriture par seconde) ; compte rendu V2 (`docs/v2/compte-rendu-audit-2026-11-20.md`) §B.2 (020), §B.3, §F.1 ; specs 010, 018, 031, 043, 092.
