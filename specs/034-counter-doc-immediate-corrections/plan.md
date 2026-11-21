# Plan — 034 Corrections documentaires immédiates

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`. Une partie des corrections a été appliquée par anticipation dans la PR `docs/v2-specs` avec l'autorisation du product owner (voir `tasks.md`, colonne « Statut »).

## 1. Lecture de l'existant
Inventaire complet au commit `508dfa6` : tableau C-01 à C-45 de `tasks.md`. Sources : rapport `10-docs-quality.md` §2.1-2.3 et §7.1, compte rendu §B.4.

## 2. Approche retenue (et alternatives écartées)
- **Retenue** : correction sur place (option A du rapport 10 §5.1), qualifiant chaque capacité partielle et renvoyant vers la spec V2 propriétaire. Rapide, sans déplacement de fichier, compatible avec une réorganisation ultérieure (V2-DOC-02, spec 035).
- Écartée : attendre la réorganisation 035 (laisse des sur-promesses publiques pendant plusieurs lots).
- Écartée : supprimer les passages litigieux sans renvoi (perte d'information pour les partenaires).

## 3. Étapes
1. Vérifier, ligne à ligne, les corrections marquées « PR docs/v2-specs » (relecture de la PR).
2. Appliquer les corrections « À faire » purement documentaires (C-17, C-22, C-31, C-32, C-35 à C-38, C-44 ; puis C-27, C-43, C-51 après décisions Q1, Q2, Q4).
3. Inscrire les écarts « Rattaché » (C-18, C-39 à C-42, C-45 à C-50) dans la spec propriétaire (V2-TAB-06, V2-ARCH-12, V2-DOC-02, V2-SDD-01, V2-SDD-02, V2-REL-03, V2-QA-10, V2-GAMES-02, V2-GAMES-10, V2-REL-01, V2-DOC-06, V2-INT-01).
4. Exécuter les vérifications `grep` des critères AC-01, AC-02, AC-06.
5. Faire relire `README.md` par le product owner (AC-08).

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `README.md` | Qualification reprise/ouverture/écran de comptoir |
| `docs/specifications.md`, `docs/product-scope.md` | Sur-promesses, vocabulaire |
| `docs/architecture.md` | Arbre réel, règle de dépendance avec écarts connus, `CONNECTED_MODE` |
| `docs/technical.md` | Liens relatifs, compteurs, prérequis E2E, Docker, navigateurs, index |
| `docs/release/*.md` | Bandeaux, contradiction 030, point PWA |
| `docs/integration/external-match-link.md` | Avertissement `in` |
| `.specify/memory/constitution.md` | Lien local remplacé |
| `.github/ISSUE_TEMPLATE/*.yml` | Zones des formulaires |
| `CONTRIBUTING.md`, `SECURITY.md` | Vérifications minimales ; adresse (après Q2) |

## 5. Impacts UI / domaine / application / infrastructure
Aucun. Les écarts présents dans le code ou la CI (C-45 à C-49) sont rattachés à d'autres specs.

## 6. Stratégie de migration
Sans objet (pas de donnée ni de contrat modifié).

## 7. Stratégie de test
Pas de test unitaire. Vérifications par `grep` (AC-01, AC-02, AC-06) et relecture ; contrôle automatique pérenne délégué à V2-QA-10 (script « doc drift » : liens absolus, slugs de spec inexistants).

## 8. Non-régression
Les liens relatifs résolvent sur GitHub ; le simulateur partenaire et son test (`tests/unit/tooling/partnerSimulator.test.ts`) ne sont pas touchés.

## 9. Rollback / désactivation
`git revert` du commit documentaire ; aucun effet sur l'application.

## 10. Documentation à mettre à jour avec l'implémentation
- Retirer l'avertissement `in` quand V2-GAMES-02 sera livré ou tranché.
- Retirer les mentions « X01 seulement » quand V2-ARCH-06 (010) sera livré.
- Mettre à jour les chiffres de tests à chaque release (checklist V2-REL-01).
