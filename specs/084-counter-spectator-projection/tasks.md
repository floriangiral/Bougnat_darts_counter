# Tâches — 084 Projection spectateur versionnée

> À exécuter uniquement après validation de la spec. Chaque tâche référence les critères d'acceptation (AC) qu'elle couvre.

## Préalables
- [ ] T000 Vérifier que la spec est validée (statut `validee`) et que V2-ARCH-03 (057) est levée ou explicitement contournée
- [ ] T001 Trancher les questions ouvertes 1 à 4 (valeur par défaut des noms, emplacement, statut du contrat, pause)

## Implémentation
- [ ] T002 Types `SpectatorSnapshot` v1 et message `end` dans `src/shared/broadcast/contract.ts` (AC-08)
- [ ] T003 Validateur `validateSpectatorEnvelope` : version, taille ≤ 12 288 octets, monotonicité génération/seq (AC-07, AC-08)
- [ ] T004 Projection X01 pure avec `remainingPreview = null` et règle de checkout conditionnelle (AC-05)
- [ ] T005 Minimisation des noms `full | short | initials` dans la projection (AC-06)
- [ ] T006 Empreinte métier hors `clock` (AC-02)
- [ ] T007 `deriveX01Highlights` et `inferX01Cause` comparant des projections sérialisées (AC-01, AC-03, AC-04)
- [ ] T008 Port `SpectatorPublisher` + adaptateur `Noop`
- [ ] T009 Hook `useSpectatorBroadcast` : coalescence 150 ms, 2 msg/s max, déclenchement sur `match` et non sur `elapsedSeconds` (AC-01, AC-02)
- [ ] T010 Branchement dans `App.tsx`
- [ ] T011 Retrait de `useSharedX01Session` et `SyncRepository` (AC-09)

## Tests
- [ ] T012 Tests unitaires projection, noms, taille, validateur (AC-05 à AC-08)
- [ ] T013 Tests unitaires temps forts sur fixtures `submitTurn` réelles, dont fin de leg et de set (AC-01, AC-03, AC-04)
- [ ] T014 Test du hook avec horloge simulée : 60 s sans saisie = 0 émission (AC-02)

## Documentation et clôture
- [ ] T015 Documenter le contrat (expérimental) dans `docs/architecture.md` et l'ADR 0005
- [ ] T016 Passer la spec à `implementee`, renseigner `verifie_au_commit`, fermer l'issue
