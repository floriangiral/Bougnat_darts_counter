# Plan — 110 Politique d'admission, de compatibilité et de révocation des partenaires

> Plan proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `wrangler.jsonc:17`, `:29` (origines déclarées).
- `scripts/lib/externalReturnOrigins.mjs:27-62`, `scripts/validate-wrangler-config.mjs`, `scripts/deployment-check.mjs:84`.
- `docs/integration/external-match-link.md:19-32` (déclaration d'origine), section « Sécurité ».
- `README.md:68-78`, `CONTRIBUTING.md:24`, `.github/ISSUE_TEMPLATE/`.

## 2. Approche retenue (et alternatives écartées)
Politique documentaire + registre + gabarit d'issue. Écartés : liste d'origines dynamique (contraire à la sécurité voulue : redéploiement obligatoire), contrat signé avec chaque partenaire (disproportionné).

## 3. Étapes
1. Rédiger la section « Politique partenaires » du guide (critères, procédure, compatibilité, révocation).
2. Créer `docs/integration/partners.md` (registre) avec badarts.fr.
3. Créer `.github/ISSUE_TEMPLATE/partner-request.yml`.
4. Lier la politique depuis le README.
5. Exercice de révocation en préprod avec une origine fictive (AC-04).
6. Optionnel (Q4) : contrôle de cohérence registre ↔ `wrangler.jsonc` dans `scripts/validate-wrangler-config.mjs`.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `docs/integration/external-match-link.md` | Section politique |
| `docs/integration/partners.md` (nouveau) | Registre |
| `.github/ISSUE_TEMPLATE/partner-request.yml` (nouveau) | Gabarit de demande |
| `README.md` | Lien vers la politique et le registre |
| `scripts/validate-wrangler-config.mjs`, `tests/unit/tooling/` | Optionnel (Q4) |

## 5. Impacts UI / domaine / application / infrastructure
Aucun sur l'application.

## 6. Stratégie de migration
Reprise de badarts.fr dans le registre ; délai de mise en conformité si Q1 rend le jeton obligatoire.

## 7. Stratégie de test
Exercice de révocation (AC-04) ; tests d'outillage si Q4.

## 8. Non-régression
Contrat `v=1` et règles d'outillage inchangés.

## 9. Rollback / désactivation
Revert documentaire ; la liste d'origines reste la source de vérité opérationnelle.

## 10. Documentation à mettre à jour
Guide partenaire, registre, README, gabarit d'issue ; index documentaire de V2-DOC-02 (035).
