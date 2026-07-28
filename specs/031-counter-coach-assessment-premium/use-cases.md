# Use Cases - Spec 031 coach assessment premium

Notation: acteur principal = Joueur (via UI). Le moteur metier et l IA sont des
acteurs systeme cote backend.

## UC1 - Charger la definition de l evaluation

- But: obtenir les epreuves, competences et baremes (data-driven).
- Precondition: joueur authentifie.
- Flux: UI appelle `GET /assessment/definition`.
- Postcondition: UI dispose de la version, des epreuves ordonnees et des schemas d entrees.
- Regles: aucune epreuve/bareme code en dur cote UI; ordre lu depuis la config.

## UC2 - Demarrer (ou reprendre) une session

- But: creer une session ou reprendre celle en cours.
- Precondition: definition chargee.
- Flux: `POST /assessment/sessions` (idempotent). Si une session `in_progress`/`paused`
  existe, elle est renvoyee (reprise a l epreuve courante).
- Postcondition: session persistee, epreuve courante et temps restant connus.
- Regles: au plus une session active par joueur.

## UC3 - Enregistrer une epreuve (autosave)

- But: sauvegarder les entrees brutes d une epreuve.
- Precondition: session `in_progress`.
- Flux: `PUT /sessions/{id}/exercises/{code}` avec `rawInputs` conformes au schema.
- Postcondition: epreuve persistee; `currentExerciseOrder` et temps restant mis a jour.
- Regles: validation des entrees contre `input_schema`; idempotent (remplace l epreuve).

## UC4 - Mettre en pause et reprendre

- But: interrompre puis continuer plus tard sans perte.
- Flux pause: `POST /sessions/{id}/pause`. Flux reprise: `GET /sessions/current` puis UC3.
- Postcondition: progression conservee cote serveur; reprise a l epreuve exacte.
- Regles: aucun stockage local; etat porte par la session.

## UC5 - Soumettre et calculer les resultats (moteur metier)

- But: finaliser et produire scores, indicateurs, agregat, priorites, potentiel.
- Precondition: toutes les epreuves requises enregistrees.
- Flux: `POST /sessions/{id}:submit` (idempotent) -> moteur metier calcule et persiste
  (`coach_assessment_skill_scores`, `coach_assessment_results`).
- Postcondition: resultats disponibles; evenement `results.computed`.
- Regles: `422` si epreuves manquantes; calcul exclusivement backend.

## UC6 - Calibrer le profil du joueur

- But: refleter le bilan dans le profil.
- Flux: le service met a jour `coach_player_skills`, `coach_skill_evolution`,
  `coach_player_progress` (niveau + objectif prioritaire).
- Postcondition: profil calibre; evenement `progress.recomputed`.
- Regles: derivation niveau/objectif deterministe (reutilise la logique calibration).

## UC7 - Generer le rapport IA (interpretation)

- But: produire un bilan pedagogique.
- Flux: le service envoie un contexte structure a GPT-5.5; sortie JSON validee et
  persistee (`coach_assessment_reports`). Fallback deterministe si echec.
- Postcondition: rapport `ready` ou `failed`+fallback; evenement `report.generated`.
- Regles: l IA n effectue aucun calcul et n invente aucune donnee (ADR-031-004).

## UC8 - Generer le programme personnalise

- But: preparer un programme adapte au bilan.
- Flux: le moteur metier cree `coach_training_programs` + premier cycle + premiere
  seance a partir des priorites, du niveau et du catalogue existant.
- Postcondition: programme `draft` pret; evenement `program.generated`.
- Regles: borne au catalogue et aux regles metier; l IA n enrichit que les explications.

## UC9 - Consulter le bilan final

- But: afficher le bilan premium.
- Flux: UI lit le retour du submit + `GET /sessions/{id}/report`.
- Postcondition: radar, score global, details par competence, evolution, analyse IA,
  potentiel, objectif recommande, programme pret + bouton `Commencer ma progression`.
- Regles: rendu pur; aucune logique metier cote UI (ADR-031-007).

## UC10 - Consulter l historique et l evolution

- But: suivre la progression entre bilans.
- Flux: `GET /assessment/history`; comparaison des scores dans le temps.
- Postcondition: liste des bilans, tendances par competence.
- Regles: tendances calculees backend a partir de l historique persiste.
