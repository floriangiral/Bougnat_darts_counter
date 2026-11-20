# Plan — 037 Guides utilisateur V2 (voix, TV, thèmes, station)

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`, guide par guide, au rythme des fonctionnalités livrées.

## 1. Lecture de l'existant
- `README.md` (vitrine, vouvoiement) ; `src/features/game-setup/setupPresentation.ts:97-135` (règles dans l'application) ; `src/features/x01/voice/dartsSpeechParserLexicon.ts` (vocabulaire) ; `components/ui/InstallAppButton.tsx`.
- Specs sources : 076 (voix mains libres), 085 (TV locale), 068 (Light), 094 (éditeur de thème), 100 (station).

## 2. Approche retenue (et alternatives écartées)
- **Retenue** : un guide Markdown court par fonctionnalité, livré dans la PR de la fonctionnalité, captures générées par Playwright.
- Écartée : un manuel unique (difficile à maintenir, lu en entier par personne).
- Écartée : aide intégrée riche dans l'application (alourdit l'interface ; hors V2 sauf Q2).

## 3. Étapes
1. Créer le gabarit de guide (FR-01) à l'emplacement choisi par V2-DOC-02.
2. Créer le scénario Playwright de captures (`tests/e2e/docs-screenshots.spec.ts`), exclu de la suite bloquante.
3. Pour chaque fonctionnalité livrée (ordre probable : 068, 085, 076, 094, 100) : rédiger le guide, générer les captures, ajouter le lien dans `README.md`.
4. Guide voix : extraire les formulations du corpus V2-VOICE-03 et ajouter un test qui les fait passer par le parseur (AC-05).
5. Tests utilisateurs AC-03 avant la promotion production de chaque signature.

## 4. Fichiers impactés
| Fichier | Nature du changement |
|---|---|
| `docs/user/*.md` (ou emplacement 035) | Guides et gabarit |
| `docs/user/img/*.png` | Captures générées |
| `tests/e2e/docs-screenshots.spec.ts` | Génération des captures |
| `tests/unit/x01/voiceGuidePhrases.test.ts` | Formulations du guide reconnues |
| `README.md` | Section « Guides » |

## 5. Impacts UI / domaine / application / infrastructure
Aucun (hors lien « Aide » si Q2, porté par la spec de la fonctionnalité).

## 6. Stratégie de migration
Sans objet.

## 7. Stratégie de test
Test de formulations vocales ; génération de captures ; tests utilisateurs terrain.

## 8. Non-régression
Parcours de base décrit à l'identique dans le `README.md`.

## 9. Rollback / désactivation
Si une fonctionnalité est retirée, son guide est retiré ou passé `Historique` dans la même PR.

## 10. Documentation à mettre à jour avec l'implémentation
`README.md`, index `docs/README.md` (035), notes de release de la version qui livre la fonctionnalité.
