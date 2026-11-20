# Plan — 096 Partage de thème sans compte

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant
- `src/features/external-match/externalMatchLink.ts:23-35,49,148` : modèle de contrat et de validation.
- `src/features/external-match/externalMatchAddressBar.ts:17` : nettoyage de l'adresse.
- `App.tsx:91` : lecture du lien de match externe au démarrage (query).
- `specs/030-counter-external-match-link/spec.md:107` : stockage iOS séparé.

## 2. Approche retenue (et alternatives écartées)
Contrats purs (fichier, lien) + adaptateurs (fichier, partage natif, adresse) + carte de confirmation. Écartées : serveur ou code court (099) ; application automatique du thème ; logo dans le lien (QR trop dense) ; query `?theme=` (journalisation serveur, collision avec `v=1`).

## 3. Étapes
1. `themeFile.ts` : sérialisation et parsing v1, bornes, liste blanche (délègue à 093 et 095).
2. `themeLink.ts` : encodage compact base64url, parsing du fragment, motifs typés.
3. Lecture du fragment au démarrage, après `analyzeExternalMatchLink`, puis nettoyage.
4. Carte de confirmation sur l'accueil (différée si une partie est restaurée).
5. Actions de partage dans l'éditeur : fichier, lien, QR (092).
6. Import de fichier dans l'éditeur.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `src/features/theming/sharing/themeFile.ts` | Nouveau (pur) |
| `src/features/theming/sharing/themeLink.ts` | Nouveau (pur) |
| `src/infrastructure/web/fileTransfer.ts` | Nouveau (téléchargement, partage natif, lecture bornée) |
| `App.tsx` ou `src/app/*` | Lecture du fragment au démarrage |
| `views/HomeView.tsx` | Carte de confirmation |
| `src/presentation/theme/ThemeShareSheet.tsx` | Nouveau |
| `tests/unit/theming/sharing/*.test.ts`, `tests/e2e/theme-sharing.spec.ts` | Nouveaux tests |

## 5. Impacts UI / domaine / application / infrastructure
UI : feuille de partage, carte de confirmation. Domaine de jeu : aucun. Infrastructure : fichiers et adresse.

## 6. Stratégie de migration (données, sessions persistées, contrats)
Contrats v1 nouveaux. Toute évolution : nouvelle version, l'ancienne restant lisible au moins une version majeure.

## 7. Stratégie de test
Unitaires exhaustifs des contrats (aller-retour, troncature, versions, injections) ; E2E (export/import, lien, coexistence avec les E2E de 030, partie restaurée) ; manuels sur messageries et scan.

## 8. Non-régression
Suite E2E du lien de match externe ; démarrage sans fragment ; contrôle des chunks initiaux.

## 9. Rollback / désactivation (feature flag le cas échéant)
Drapeau de 093 : fragment ignoré (mais nettoyé), actions de partage masquées.

## 10. Documentation à mettre à jour avec l'implémentation
Contrats publics (fichier, lien) dans `docs/integration/` ou `docs/architecture/` [selon 035] ; guide utilisateur « Partager le thème du club ».
