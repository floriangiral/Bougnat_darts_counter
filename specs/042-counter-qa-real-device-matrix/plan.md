# Plan — 042 Matrice d'appareils et de viewports réalistes

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `playwright.config.ts:16-53` (7 projets), `tests/e2e/tablet-layout.smoke.spec.ts:12-46` (mode forcé l.17), `tests/e2e/smartphone-layout.smoke.spec.ts:1-60`.
- Détection : `src/features/tablet/tabletLayout.ts:22-56`, `src/features/tablet/useTabletLayout.ts`, seconde détection `views/MatchView.tsx:246-266`.
- Test unitaire figé : `tests/unit/tabletLayout.test.ts:66-72`.
- Installation des navigateurs en CI : `.github/actions/setup-ci-app/action.yml:52-55` (`chromium webkit` uniquement).

## 2. Approche retenue (et alternatives écartées)

Retenue : matrice déclarative TypeScript générant les projets Playwright ; défauts connus en `test.fail` référencés ; PR réduite + nightly complète ; protocole terrain écrit.
Écartées : fermes d'appareils payantes (coût récurrent, compte tiers) ; un fichier de test par appareil (duplication) ; détection par user-agent (contraire au rapport 06).

## 3. Étapes

1. Créer `tests/e2e/devices/matrix.ts` (profils, moteur, viewport, tactile, exécution `pr`/`nightly`, défauts connus).
2. Générer les projets dans `playwright.config.ts` à partir de la matrice ; tag `@nightly` pour filtrer (`--grep-invert @nightly` en PR).
3. Créer `tests/e2e/device-matrix.spec.ts` (6 jeux × profil, assertions FR-02/FR-03, mesure des cibles par `boundingBox()`).
4. Retirer `?mode=dedicated_tablet` de `tablet-layout.smoke.spec.ts` ; créer `dedicated-tablet-mode.smoke.spec.ts` pour le mode forcé.
5. Étendre l'installation CI à `firefox` pour la nightly (action `setup-ci-app`, entrée dédiée).
6. Rédiger le protocole terrain dans la spec (annexe) puis dans le guide de test (035).
7. Premier passage terrain ; recalibrer les hauteurs de barres.

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `playwright.config.ts` | Projets générés depuis la matrice |
| `tests/e2e/devices/matrix.ts`, `tests/e2e/device-matrix.spec.ts` | Création |
| `tests/e2e/tablet-layout.smoke.spec.ts` | Suppression du mode forcé ; fusion possible dans la matrice |
| `tests/e2e/dedicated-tablet-mode.smoke.spec.ts` | Création |
| `.github/actions/setup-ci-app/action.yml` | Navigateurs installables paramétrables (`firefox` en nightly) |
| `.github/workflows/e2e.yml` | Exécution nightly (coordonnée avec 043) |
| `docker/playwright.Dockerfile` | Commande par défaut : projets `pr` de la matrice |

## 5. Impacts UI / domaine / application / infrastructure

Aucun sur le code applicatif ; consomme l'attribut de recette exposé par 070.

## 6. Stratégie de migration (données, sessions persistées, contrats)

Sans objet.

## 7. Stratégie de test

Les tests sont le livrable ; validation de la détection d'une cible < 48 px sur branche jetable ; spec 029 : workflow modifié ⇒ note de validation CI.

## 8. Non-régression

Les assertions actuelles (débordement, rotation téléphone) restent ; durée PR mesurée.

## 9. Rollback / désactivation

Revenir aux projets fixes de `playwright.config.ts` (historique Git) ; désactiver le job nightly.

## 10. Documentation à mettre à jour avec l'implémentation

Guide de test (035 ou `docs/technical.md`, section « Versions Playwright ») : matrice, tags, protocole terrain ; spec 027/028 (révisions V2) : référence à la matrice comme preuve d'acceptation.
