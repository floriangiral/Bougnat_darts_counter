# Plan — 090 Qualification sur TV réelles

> Plan d'implémentation proposé. Il ne s'exécute qu'après passage de la spec au statut `validee`.

## 1. Lecture de l'existant

- `vite.config.ts:29-33` (build legacy), `index.tsx:7-9`, `src/infrastructure/web/legacySupport.ts` (détection de capacités CSS).
- Entrée TV et écrans : specs 085, 086 ; relais et appairage : 087, 088.

## 2. Approche retenue (et alternatives écartées)

Page de diagnostic intégrée à l'entrée TV + protocole manuel outillé + émulation CI quand elle existe. Écartés : services de test de navigateurs commerciaux (pas de TV, coût) ; promesse de compatibilité fondée sur les seules versions publiées.

## 3. Étapes

1. Créer `src/tv/diag/TvDiagnostics.tsx` (capacités, moteur, motif de test, mode démonstration si retenu).
2. Rédiger le protocole Q1-Q9 et le gabarit de rapport (emplacement V2-DOC-02).
3. Qualifier d'abord ordinateur + HDMI (085/086), puis les TV dès que 087/088 sont en préproduction.
4. Rassembler les appareils (prêts, clé Fire TV selon décision).
5. Conduire la campagne, consigner les rapports, ouvrir des issues de correction.
6. Proposer la baseline à 018 ; publier la matrice dans le guide (037).

## 4. Fichiers impactés

| Fichier | Nature du changement |
|---|---|
| `src/tv/diag/*.tsx` | Création |
| `src/tv/main.tsx` | Route `?diag=1` |
| Documentation QA (emplacement 035) | Protocole, gabarit, rapports |
| Guide utilisateur TV (037) | Matrice publique |
| `specs/018-*/spec.md` | Décision de baseline (par son propriétaire) |

## 5. Impacts UI / domaine / application / infrastructure

UI : page de diagnostic non liée. Autres couches : aucun impact.

## 6. Stratégie de migration

Sans objet.

## 7. Stratégie de test

Campagne terrain ; tests de composants de la page de diagnostic (API absentes simulées) ; captures sur Chromium anciens si une image d'émulation est disponible [à confirmer].

## 8. Non-régression

Rejouer Q1 à chaque modification de la feuille TV ; rejouer la campagne complète avant toute annonce de compatibilité.

## 9. Rollback / désactivation

La page de diagnostic peut être retirée sans effet ; la matrice publique repasse une ligne en « non qualifiée » si une régression est constatée.

## 10. Documentation à mettre à jour avec l'implémentation

Guide TV (037) : matrice, réglages de veille ; spec 018 ; rapport de qualification.
