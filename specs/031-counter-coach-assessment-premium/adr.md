# ADR - Spec 031 coach assessment premium

Statut global: `proposed`. A valider avant implementation.

## ADR-031-001 - Moteur metier backend autoritatif

- Contexte: le prompt exige que le moteur metier calcule (scores, indicateurs,
  tendances, priorites) et que l UI ne porte aucune logique metier.
- Decision: tout calcul d evaluation est realise par le moteur metier backend
  (module `coach` du repo Tournament). Le frontend ne transmet que des entrees
  brutes et n affiche que des resultats deja calcules.
- Consequence: la normalisation brut->0..100 aujourd hui cote frontend (spec 030)
  est rapatriee cote backend. Le frontend est simplifie (capture + rendu).
- Alternatives rejetees: calcul cote frontend (viole "aucune logique metier UI"
  et rend les baremes non centralises).

## ADR-031-002 - Epreuves, competences et baremes data-driven et versionnes

- Contexte: l ordre des epreuves et les baremes doivent evoluer sans modifier le
  code metier; aucune donnee codee en dur.
- Decision: definitions d epreuves (`input_schema`, `scoring_config`, ordre),
  referentiel de competences et mapping epreuve->competence sont stockes en base
  et exposes par l API. Chaque definition porte une `version`.
- Consequence: le moteur interprete la configuration; ajout/retrait/reordonnancement
  d une epreuve = donnee, pas code. Les evaluations referencent la version utilisee
  pour la reproductibilite.

## ADR-031-003 - Cycle de vie "session" persiste, autosave, pause et reprise

- Contexte: l utilisateur doit pouvoir mettre en pause, reprendre plus tard, avec
  sauvegarde automatique; aucun stockage local.
- Decision: une `AssessmentSession` serveur porte l etat (draft/in_progress/paused/
  completed/abandoned), l epreuve courante et le temps restant estime. Chaque
  epreuve validee est persistee (autosave) via l API. La reprise recharge la
  session in_progress du joueur.
- Consequence: aucune perte de progression; reprise a l epreuve exacte; robustesse
  reseau (idempotency sur autosave et submit).

## ADR-031-004 - L IA interprete uniquement (jamais de calcul, jamais d invention)

- Contexte: separation stricte calcul (metier) / interpretation (IA).
- Decision: GPT-5.5 recoit un contexte structure (resultats, statistiques,
  historique, competences, objectif) et renvoie un rapport JSON structure
  (resume, forces, faiblesses, priorites, potentiel, explication). Aucune donnee
  n est calculee ni modifiee par l IA. Le system prompt impose de ne s appuyer
  que sur les donnees fournies. La sortie est validee contre un schema strict;
  en cas d echec, fallback deterministe.
- Consequence: reproductibilite et securite; l IA ne peut pas fausser un bilan.

## ADR-031-005 - Programme genere par le moteur metier, enrichi par l IA

- Contexte: a la fin de l evaluation, un programme personnalise doit etre pret.
- Decision: le moteur metier construit le programme (niveau, competences
  prioritaires, objectifs, duree, premier cycle, premiere seance) a partir des
  resultats et du catalogue existant. L IA n enrichit que les explications.
- Consequence: le programme reste borne au catalogue et aux regles metier;
  l IA ne cree jamais d exercice ni de structure de programme.

## ADR-031-006 - Compatibilite du contrat evaluations existant

- Contexte: la spec 030 expose `POST /v1/coach/me/evaluations` (scores 0..100).
- Decision: cet endpoint est conserve en compatibilite (deprecie) pendant la
  migration, puis retire une fois le cycle de vie session generalise.
- Consequence: aucune rupture immediate; trajectoire de depreciation documentee.

## ADR-031-007 - Radar et rendu cote UI sans logique metier

- Contexte: bilan premium avec radar de competences.
- Decision: le radar et les visualisations sont rendus a partir des `skillScores`
  fournis par l API. L UI ne calcule aucun score ni indicateur.
- Consequence: coherence des chiffres entre ecrans; UI testable en pur rendu.

## ADR-031-008 - Idempotency et reproductibilite

- Contexte: robustesse des POST critiques.
- Decision: `Idempotency-Key` obligatoire sur start, submit et generation de
  rapport. Les resultats referencent la `definition_version` utilisee.
- Consequence: rejeu sur; audit et reproductibilite des bilans.
