---
id: 036-counter-doc-ai-agents-onboarding
v2_id: V2-DOC-03
titre: Onboarding des agents IA (AGENTS.md)
type: doc
statut: a-valider
validation: en-attente
origine: Documentation
famille: doc
priorite: P1
difficulte: S
recommandation: recommande
lot: 0
poids: 30
depend_de: [V2-SDD-01]
remplace: []
remplacee_par: []
issue: '#217'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 036 — Onboarding des agents IA (AGENTS.md)

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

Au commit `508dfa6`, le dépôt ne contient aucune instruction pour agents IA (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.github/instructions/`) ; les règles critiques sont dispersées dans six documents, dont certains avec des chemins absolus locaux (rapport `10-docs-quality.md` §2.1, D3, §5.2). La V2 sera largement implémentée par des agents à partir des specs : sans porte d'entrée fiable, ils reproduisent les erreurs de la documentation (domaine X01 supposé utilisé, reprise multi-jeux supposée existante…).

Le product owner a autorisé la création d'`AGENTS.md` : le fichier a été **créé à la racine dans la PR `docs/v2-specs`** (71 lignes). Cette spec décrit son contenu attendu, les écarts restants et ses règles de maintenance.

## 2. Problématique

Un guide d'agent est utile s'il est exact ; il devient nuisible dès qu'il dérive du code. Il faut donc un contenu minimal vérifiable et des règles qui obligent à le maintenir.

## 3. Objectifs

- O1 : un agent qui ne lit qu'`AGENTS.md` connaît le produit, la frontière, l'architecture réelle, les commandes, le processus SDD et les interdits.
- O2 : chaque affirmation d'`AGENTS.md` est vérifiable (lien, commande, chemin).
- O3 : `AGENTS.md` est mis à jour dans la même PR que tout changement qui le rend faux.

## 4. État actuel vérifié dans le code

- [vérifié] `AGENTS.md` (arbre de travail de la PR) : §1 produit et frontière, §2 stack et commandes, §3 architecture réelle « au 2026-11-20 » avec pièges connus, §4 SDD, §5 règles de contribution, §6 « Où trouver quoi ».
- [vérifié] Versions citées conformes à `package.json` : React 19.3.1 (l.35), TypeScript ~6.0.3 (l.59), Vite ^8.3.8 (l.61), Vitest ^5.1.1 (l.62), Playwright ^1.65.1 (l.40), Tailwind ^4.3.5 (l.58), npm 12.2.3 (l.5) ; Node 26.13.1 (`.nvmrc`).
- [vérifié] Pièges cités conformes au code : logique X01 exécutée dans `src/application/scoring/matchLifecycle.ts`, `src/features/x01/scoring/matchSubmission.ts`, `views/MatchView.tsx` ; seul X01 restauré (`App.tsx:353-361`) ; `finishLeg` mute `legsWon/setsWon` (`src/application/scoring/matchLifecycle.ts:214-220`).
- [vérifié] Commandes citées présentes dans `package.json` (`dev`, `typecheck`, `lint`, `lint:type-aware`, `test:unit`, `test:unit:coverage`, `governance:coverage`, `guard:clean`, `wrangler:check`, `build`, `test:e2e`).
- [constat] Absents d'`AGENTS.md` : prérequis E2E locaux (installation des navigateurs Playwright, origine partenaire de test `https://partner.example` pour le build de smoke — cause des 64 échecs locaux, rapport 10 C9) ; interdits opérationnels (modifier `wrangler.jsonc` hors PR dédiée) ; définition de « terminé » incluant notes de release et changelog in-app.
- [constat] `AGENTS.md` et `README.md` renvoient vers `docs/roadmap-v2.md`, absent de l'arbre au moment de la rédaction [à vérifier à la revue de la PR].
- [vérifié] Aucun `.github/copilot-instructions.md` ; la prise en charge exacte d'`AGENTS.md` par chaque outil est [à confirmer] (format ouvert https://agents.md/).

## 5. Comportement cible

`AGENTS.md` reste court (≤ 150 lignes), daté, exact, et renvoie vers les documents détaillés. Les fichiers propres à un outil (s'ils sont créés) ne contiennent qu'un renvoi vers `AGENTS.md`. Un contrôle automatique vérifie liens et commandes.

## 6. Périmètre

### Inclus
- Contenu d'`AGENTS.md` et règles de maintenance.
- Éventuels fichiers de renvoi par outil (Q1).
- Contrôle automatique des liens et des commandes citées.
- Case de vérification dans le modèle de PR.

### Exclu
- Réécriture de `CONTRIBUTING.md` au-delà des renvois (V2-DOC-01 C-44, V2-DOC-02).
- Conventions SDD elles-mêmes (V2-SDD-01, spec 032).
- Instructions par dossier (`.github/instructions/*.instructions.md`) : hors V2 sauf décision Q2.

## 7. User stories

- En tant qu'agent IA, je veux savoir quelles specs je peux implémenter (statut `validee` uniquement), afin de ne pas coder une proposition.
- En tant qu'agent IA, je veux connaître les pièges de l'architecture réelle, afin de ne pas modifier du code mort.
- En tant que mainteneur, je veux qu'une PR qui renomme un script mette à jour `AGENTS.md`, afin que les agents ne lancent pas des commandes inexistantes.

## 8. Règles métier

- RM-01 : en cas de conflit, le code fait foi, puis la spec validée, puis la documentation (règle déjà écrite en tête d'`AGENTS.md`).
- RM-02 : aucune spec `a-valider` ne peut être implémentée ; ses questions ouvertes sont tranchées par le product owner.
- RM-03 : `AGENTS.md` ne contient ni secret, ni chemin absolu local, ni donnée personnelle.

## 9. Parcours utilisateurs

Agent : `AGENTS.md` → `.specify/conventions.md` → `specs/README.md` → spec `validee` → `plan.md`/`tasks.md` → commandes de vérification → mise à jour du statut.

## 10. Exigences fonctionnelles

- FR-01 `AGENTS.md` à la racine avec les sections : produit et frontière ; stack et commandes ; architecture réelle et pièges ; SDD ; règles de contribution ; interdits ; définition de « terminé » ; « Où trouver quoi » (fait, à compléter par FR-02 à FR-04).
- FR-02 Ajouter les prérequis E2E locaux (navigateurs Playwright, origine de test du lien partenaire, alternative Docker `docker/playwright.Dockerfile`).
- FR-03 Ajouter une liste d'interdits explicite : modifier `wrangler.jsonc`, les workflows ou les planchers de couverture sans PR dédiée ; désactiver une règle ESLint ou un test pour passer la CI ; ajouter une dépendance runtime sans justification dans la spec ; présenter une fonctionnalité non livrée comme disponible.
- FR-04 Définition de « terminé » : critères d'acceptation vérifiés, tests, statut de spec et `verifie_au_commit`, documentation, notes de release et changelog in-app si visible par l'utilisateur.
- FR-05 Règles de maintenance (M-01 à M-06 ci-dessous) recopiées en fin d'`AGENTS.md` et dans `CONTRIBUTING.md`.
- FR-06 Contrôle automatique (intégré au `docs:check` de V2-DOC-02) : liens relatifs valides et chaque `npm run <script>` cité existe dans `package.json`.
- FR-07 Case « `AGENTS.md` mis à jour si commandes, architecture, conventions ou frontière changent » dans `.github/pull_request_template.md`.

**Règles de maintenance proposées**
- M-01 Mise à jour dans la même PR que tout changement de : scripts `package.json` cités, versions Node/npm, arborescence décrite, conventions SDD, frontière produit.
- M-02 Un piège connu est retiré quand la spec qui le corrige passe `implementee` (ex. mutation de `finishLeg` → V2-QA-01/V2-ARCH-04 ; reprise X01 seule → V2-ARCH-06).
- M-03 La date « architecture réelle au … » est revalidée à chaque release (item de la checklist V2-REL-01).
- M-04 Longueur ≤ 150 lignes ; tout détail va dans un document lié.
- M-05 Les fichiers propres à un outil ne font que renvoyer vers `AGENTS.md`.
- M-06 Toute affirmation factuelle cite un chemin vérifiable.

## 11. Exigences non fonctionnelles

- NFR-01 Français accentué ; identifiants et commandes en anglais.
- NFR-02 Coût nul, aucune dépendance.

## 12. Cas nominaux et alternatifs

- Nominal : un agent suit `AGENTS.md` et n'implémente qu'une spec validée.
- Alternatif : l'outil de l'agent ne lit pas `AGENTS.md` → fichier de renvoi (Q1).

## 13. Cas limites

- Agent travaillant sur une branche ancienne : `AGENTS.md` décrit l'état de la branche, d'où la date.
- Spec historique en anglais sans en-tête V2 : `AGENTS.md` renvoie à `specs/README.md` pour le statut réel.

## 14. Gestion des erreurs

Le contrôle FR-06 échoue en citant la ligne d'`AGENTS.md` fautive.

## 15. Impacts architecturaux

Aucun sur le code.

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Compatible avec `CONTRIBUTING.md` (public humain) : `AGENTS.md` le résume et y renvoie.

## 18. Dépendances

Bloquante : V2-SDD-01 (032). Liens : V2-DOC-01 (034, C-28 et C-44), V2-DOC-02 (035, contrôle `docs:check`), V2-QA-10 (043, CI), V2-REL-01 (033, revalidation à chaque release).

## 19. Critères d'acceptation

- AC-01 `AGENTS.md` contient les huit sections de FR-01 et fait ≤ 150 lignes.
- AC-02 Chaque commande citée existe dans `package.json` (contrôle FR-06 vert ; rouge si l'on cite un script inexistant).
- AC-03 Chaque lien relatif d'`AGENTS.md` résout (dont `docs/roadmap-v2.md`).
- AC-04 Un essai à blanc : un agent sans contexte, à qui l'on demande « implémente la spec 045 » alors qu'elle est `a-valider`, refuse en citant la règle RM-02 [essai manuel].
- AC-05 Le modèle de PR contient la case FR-07.

## 20. Scénarios de tests

Test unitaire du contrôle (fixtures : script cité inexistant, lien cassé) ; essai manuel AC-04 avec un agent.

## 21. Exigences de non-régression

Aucune commande ou lien d'`AGENTS.md` ne casse lors des PR suivantes (contrôle en CI).

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Dérive d'`AGENTS.md` | Élevé (agents mal guidés) | Élevée sans contrôle | M-01, FR-06, FR-07 |
| Fichier trop long, ignoré | Moyen | Moyenne | M-04 |
| Pièges périmés laissés en place | Moyen | Moyenne | M-02 |

## 23. Décisions architecturales

Aucun ADR. Rappel : H.8 (conventions SDD et langue).

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Fichiers de renvoi par outil | Aucun / `.github/copilot-instructions.md` / + `CLAUDE.md` | `.github/copilot-instructions.md` d'une ligne renvoyant à `AGENTS.md` [prise en charge à confirmer] | — |
| Q2 | Instructions ciblées par dossier | Non / `tests/**`, `specs/**` | Non en V2 (un seul fichier à maintenir) | — |
| Q3 | Publier ou recopier les règles du workspace multi-repos | Recopier l'essentiel / lien hors dépôt | Recopier l'essentiel (déjà fait dans la constitution locale) | — |

## 25. Traçabilité

Rapports : `10-docs-quality.md` §2.1 (« Instructions agents IA »), §5.2, §9 Q6, C9 ; compte rendu §A (faiblesse 6), §C.8. Specs : 032, 034, 035, 033.
