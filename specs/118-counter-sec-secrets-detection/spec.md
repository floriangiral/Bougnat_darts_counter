---
id: 118-counter-sec-secrets-detection
v2_id: V2-SEC-03
titre: Secrets — Gitleaks, secret scanning, protection des pushes et procédure de rotation
type: fonctionnel
statut: a-valider
validation: en-attente
origine: Demande V2
famille: devsecops
priorite: P0
difficulte: S
recommandation: recommande
lot: 0
poids: 60
depend_de: []
remplace: []
remplacee_par: []
issue: '#301'
verifie_au_commit: 508dfa6
derniere_revue: 2026-11-20
---

# 118 — Secrets : Gitleaks, secret scanning, protection des pushes et procédure de rotation

> **Statut : À VALIDER.** Proposition issue de l'audit V2 du 2026-11-20 ; aucune exigence n'est validée.

## 1. Origine et contexte

La demande DevSecOps (§8) exige la détection des secrets à chaque changement, une analyse initiale de l'historique, les mécanismes natifs de GitHub et une procédure de révocation et de rotation. Le dépôt dispose déjà de Gitleaks et des protections natives : il manque la preuve de l'analyse historique, la maîtrise de ce que les rapports exposent, la justification des exceptions et le runbook de rotation (déjà signalé absent pour la voix par la spec 006, constat C-07).

## 2. Problématique

Un dépôt public avec une clé Deepgram facturée côté serveur, deux jetons de services tiers et une clé privée d'application GitHub ne dispose d'aucune procédure écrite en cas de fuite, et ses rapports Gitleaks peuvent republier un secret détecté dans un commentaire ou un artefact public.

## 3. Objectifs

- O1 : aucun nouveau secret ne peut entrer dans le dépôt sans être bloqué (push) ou détecté (PR).
- O2 : un état initial prouvé de l'historique complet.
- O3 : une procédure de rotation par secret, testée à blanc au moins une fois.
- O4 : aucun secret exposé par les journaux, artefacts ou commentaires.

## 4. État actuel vérifié dans le code

- [vérifié] `secret-scan.yml:29-54` : Gitleaks (`gitleaks/gitleaks-action` v3.0.0 épinglé, `fetch-depth: 0`) sur PR, push `main`/`preprod` et lundi 06:11 UTC ; check requis `Gitleaks`. Permissions de niveau workflow `security-events: write` (`:25-27`) sans envoi SARIF vers l'onglet Security.
- [vérifié] Aucune configuration Gitleaks (`.gitleaks.toml`) : règles par défaut. Les commentaires de PR et l'artefact SARIF de l'action sont actifs par défaut (`GITLEAKS_ENABLE_COMMENTS`, `GITLEAKS_ENABLE_UPLOAD_ARTIFACT` : `true`) — README de `gitleaks/gitleaks-action`, consulté le 2026-11-20.
- [vérifié, source externe] Licence de l'action : propriétaire depuis la v2 ; clé `GITLEAKS_LICENSE` requise pour les comptes d'**organisation**, pas pour les comptes personnels (clé gratuite sur formulaire sinon) — même source. Le dépôt appartient à un compte personnel.
- [vérifié] `.gitleaksignore:1-2` ignore deux détections `generic-api-key` sur `wrangler.jsonc` au commit `78b6a16` ; il s'agit vraisemblablement de `DEEPGRAM_PROJECT_ID` (identifiant de projet, non secret, `wrangler.jsonc:11, 23`) [à confirmer par relance de Gitleaks] ; aucune justification écrite.
- [vérifié] GitHub : secret scanning et protection des pushes **activés** ; motifs non-fournisseurs et contrôles de validité désactivés ; 0 alerte [`gh api`, 2026-11-20]. La protection des pushes « utilisateur » est active par défaut pour les pushes vers des dépôts publics — docs.github.com « Push protection », consulté le 2026-11-20.
- [vérifié] Inventaire des secrets GitHub (noms) : `SONAR_TOKEN`, `SNYK_TOKEN` (dépôt) ; `DEEPGRAM_API_KEY`, `BRANCH_PROMOTER_APP_ID`, `BRANCH_PROMOTER_APP_PRIVATE_KEY` (environnements). Côté Cloudflare : `DEEPGRAM_API_KEY` (fonction `functions/api/deepgram/token.ts`) [à confirmer dans le tableau de bord].
- [vérifié] `.env.local` et variantes ignorés (`.gitignore:20-29`) ; seuls les fichiers `*.example` sont versionnés.
- [vérifié] `promote-preprod.yml:90` et `promote-production.yml:91` affichent la réponse brute de l'API Deepgram en cas d'échec.
- [vérifié] Aucun runbook de rotation (`docs/release/`, `SECURITY.md`) ; tâche ouverte de la spec 006.
- [à confirmer] Le scan planifié de l'action couvre-t-il tout l'historique ? Aucune trace d'un scan historique complet documenté.

## 5. Comportement cible

- Gitleaks bloquant sur les commits de chaque PR et de chaque push `main` ; scan hebdomadaire de **tout l'historique** ; rapports **masqués** (`--redact`), sans commentaire de PR ni artefact public contenant la valeur.
- Configuration Gitleaks versionnée, exceptions justifiées une à une.
- Protections natives conservées, motifs supplémentaires activés si disponibles gratuitement.
- Runbook par secret : révoquer d'abord, remplacer, vérifier, documenter ; l'historique Git n'est pas réécrit (le secret est considéré compromis).

## 6. Périmètre

### Inclus
- Gitleaks (configuration, déclencheurs, masquage), protections natives, inventaire des secrets, runbook de rotation, analyse initiale.

### Exclu
- Protection budgétaire de la clé Deepgram (006, V2-VOICE-10) ; permissions des environnements (115).

## 7. User stories

- En tant que mainteneur, je veux que mon push soit refusé si j'ajoute une clé par erreur, afin qu'elle ne devienne jamais publique.
- En tant que mainteneur, je veux une procédure pas à pas pour révoquer la clé Deepgram, afin d'agir en minutes en cas de fuite.

## 8. Règles métier

- RM-01 Un secret détecté est réputé compromis : révocation immédiate, même si le commit est supprimé.
- RM-02 Aucune valeur de secret dans un commentaire, une issue, un artefact, un résumé de job ou un journal.
- RM-03 Une exception Gitleaks exige une justification écrite (fichier, règle, raison, date).
- RM-04 Un contournement de la protection des pushes est consigné avec sa raison.

## 9. Parcours utilisateurs

Push contenant un jeton reconnu → refusé par GitHub. PR contenant un secret générique → Gitleaks rouge (résumé masqué) → correction → rotation. Alerte secret scanning → runbook.

## 10. Exigences fonctionnelles

- FR-01 Gitleaks : PR (commits de la PR), push `main`, hebdomadaire sur tout l'historique ; `GITLEAKS_ENABLE_COMMENTS: false`, `GITLEAKS_ENABLE_UPLOAD_ARTIFACT: false`, sortie masquée ; permissions de job minimales.
- FR-02 `.gitleaks.toml` : règles par défaut étendues ; liste d'autorisations limitée aux identifiants publics (identifiant de projet Deepgram, jeton public Cloudflare Web Analytics s'il est un jour versionné) ; justification dans un registre (128).
- FR-03 Analyse initiale de tout l'historique (toutes branches) : résultat consigné (nombre de détections, décision par détection, sans valeur).
- FR-04 GitHub : conserver secret scanning et protection des pushes ; activer motifs non-fournisseurs et contrôles de validité si disponibles sans licence pour un dépôt public [à confirmer] (opération manuelle).
- FR-05 Runbook de rotation (`SECURITY.md` ou document lié) pour `DEEPGRAM_API_KEY` (GitHub et Cloudflare), `SONAR_TOKEN`, `SNYK_TOKEN` (tant que conservé), clé privée de l'application de promotion, futurs jetons (Codecov si non OIDC, Sentry) : où le révoquer, comment le remplacer, comment vérifier, qui prévenir.
- FR-06 Supprimer l'affichage de réponses d'API dans les workflows (avec 115 FR-07).
- FR-07 Exercice de rotation à blanc (secret non critique, ex. `SONAR_TOKEN`) consigné.

## 11. Exigences non fonctionnelles

- NFR-01 Coût : 0 € (action gratuite pour un compte personnel ; protections natives gratuites pour un dépôt public).
- NFR-02 Gitleaks PR ≤ 30 s ; historique complet ≤ 5 min [à mesurer].

## 12. Cas nominaux et alternatifs

- Nominal : PR sans secret → vert.
- Alternatif : faux positif → exception justifiée dans la même PR, revue humaine.

## 13. Cas limites

- Secret dans un fichier binaire ou une image : hors capacité de Gitleaks ; règle de revue.
- Transfert du dépôt vers une organisation : clé `GITLEAKS_LICENSE` gratuite à demander (risque de blocage du check, à anticiper).

## 14. Gestion des erreurs

Résumé : règle, fichier, ligne, commit, valeur masquée ; renvoi vers le runbook.

## 15. Impacts architecturaux

Aucun sur l'application.

## 16. Impacts sur les données et les interfaces

Sans objet.

## 17. Compatibilité avec l'existant

Check `Gitleaks` conservé sous l'agrégateur `security / requis` (114) ; `.gitleaksignore` remplacé ou complété par la configuration justifiée.

## 18. Dépendances

- Aucune dépendance bloquante (lot 0).
- Liées : V2-VOICE-10 (006, runbook voix), V2-SEC-01 (115), V2-CICD-01 (113).

## 19. Critères d'acceptation

- AC-01 Un secret fictif de test ajouté sur une branche jetable est détecté par Gitleaks ; le résumé ne contient pas sa valeur ; aucun commentaire ni artefact n'est publié ; la branche est supprimée.
- AC-02 Un push d'un jeton au format fournisseur (valeur fictive) est refusé par la protection des pushes (essai documenté, sans contournement).
- AC-03 Le scan historique complet est exécuté et son résultat consigné.
- AC-04 Chaque exception Gitleaks a une justification écrite.
- AC-05 Le runbook couvre chaque secret de l'inventaire ; un exercice de rotation à blanc est consigné.
- AC-06 Aucun workflow n'affiche de réponse brute d'API ou de valeur dérivée d'un secret.

## 20. Scénarios de tests

Branche jetable (AC-01, AC-02) ; `workflow_dispatch` du scan historique (AC-03) ; revue documentaire (AC-04, AC-05).

## 21. Exigences de non-régression

Check `Gitleaks` toujours requis ; protections natives toujours actives.

## 22. Risques

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Changement de licence ou d'éligibilité de l'action | Moyen | Faible | CLI Gitleaks (MIT) exécutable directement en alternative [à confirmer licence CLI] |
| Faux positifs répétés | Faible | Moyenne | Configuration justifiée |
| Fuite de la clé Deepgram (coût) | Élevé | Faible | Runbook, protection budgétaire (006) |

## 23. Décisions architecturales

Aucun ADR.

## 24. Questions ouvertes

| # | Question | Options | Recommandation | Décision |
|---|---|---|---|---|
| Q1 | Action Gitleaks ou CLI | Action (licence propriétaire, gratuite pour compte personnel) / CLI épinglée | Action tant que le dépôt reste personnel ; CLI si transfert en organisation | — |
| Q2 | Envoyer les résultats Gitleaks dans l'onglet Security (SARIF) | Oui / non | Non (le secret natif de GitHub y figure déjà ; éviter une copie supplémentaire) | — |
| Q3 | Emplacement du runbook | `SECURITY.md` / document dédié | Document dédié lié depuis `SECURITY.md` (128) | — |

## 25. Traçabilité

Audit `docs/v2/audit/11-devsecops.md` (§3, §6) ; demande DevSecOps §8 ; spec 006 (C-07) ; specs 113, 115, 128.
