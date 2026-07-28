# Acceptance Tests - Spec 031 coach assessment premium

Scenarios Gherkin (langage metier). Servent de reference aux tests automatises
(backend integration + frontend integration + unit domaine).

## Feature: Definition data-driven

```gherkin
Scenario: Charger la definition de l evaluation
  Given un joueur authentifie
  When il ouvre l evaluation complete
  Then il recoit une definition versionnee
  And la definition contient au moins 10 epreuves ordonnees
  And la definition contient le referentiel de 14 competences
  And aucune epreuve ni bareme n est code en dur cote application
```

## Feature: Cycle de vie de session

```gherkin
Scenario: Demarrer une nouvelle session
  Given un joueur sans session en cours
  When il demarre l evaluation
  Then une session in_progress est creee cote serveur
  And l epreuve courante est la premiere
  And un temps restant estime est fourni

Scenario: Autosave apres une epreuve
  Given une session in_progress a l epreuve "scoring_501"
  When le joueur valide ses entrees brutes de l epreuve
  Then les entrees sont persistees cote serveur
  And l epreuve courante avance a la suivante
  And le temps restant estime est mis a jour

Scenario: Pause puis reprise sans perte
  Given une session in_progress avec 4 epreuves enregistrees
  When le joueur met en pause puis revient plus tard
  Then il reprend a l epreuve exacte laissee
  And les 4 epreuves enregistrees sont conservees
  And aucune donnee n a ete stockee localement
```

## Feature: Calcul par le moteur metier

```gherkin
Scenario: Le calcul est realise cote backend
  Given une session avec toutes les epreuves enregistrees
  When le joueur soumet l evaluation
  Then le moteur metier calcule les scores par competence
  And un score global agrege est calcule (non simple moyenne)
  And les competences limitantes sont ordonnees en priorites
  And un potentiel de progression est estime
  And l application frontend n effectue aucun calcul de score

Scenario: Soumission incomplete refusee
  Given une session avec des epreuves requises manquantes
  When le joueur tente de soumettre
  Then la soumission est refusee avec un code 422
```

## Feature: Calibration du profil

```gherkin
Scenario: Le profil est calibre a partir du bilan
  Given une evaluation soumise avec doubles faibles
  When le calcul est termine
  Then le niveau global du profil est mis a jour
  And l objectif prioritaire devient la finition des doubles
  And les 14 competences sont mises a jour avec une confiance
  And une tendance est enregistree si un historique existe
```

## Feature: Rapport IA (interpretation uniquement)

```gherkin
Scenario: L IA interprete sans calculer ni inventer
  Given des resultats calcules par le moteur metier
  When le rapport IA est genere
  Then le rapport contient resume, forces, faiblesses, priorites, potentiel
  And le rapport ne modifie aucun score calcule
  And le rapport n introduit aucune donnee absente du contexte
  And si l IA echoue, un rapport deterministe de secours est fourni
```

## Feature: Programme personnalise

```gherkin
Scenario: Un programme est pret a la fin de l evaluation
  Given une evaluation soumise et calculee
  When le bilan est presente
  Then un programme personnalise en brouillon est disponible
  And il contient un premier cycle et une premiere seance
  And les exercices proviennent du catalogue existant
  And un bouton "Commencer ma progression" est propose
```

## Feature: Bilan final (rendu premium)

```gherkin
Scenario: Le bilan affiche un radar et une analyse complete
  Given une evaluation calculee avec rapport pret
  When le joueur consulte le bilan
  Then il voit un radar de competences
  And le score global et le detail par competence
  And l evolution si un historique existe
  And l analyse IA et l estimation du potentiel
  And l objectif recommande
```

## Feature: Idempotency et robustesse

```gherkin
Scenario: Rejeu de la soumission sans double effet
  Given une evaluation deja soumise avec une cle d idempotence
  When la meme soumission est rejouee avec la meme cle
  Then aucun second calcul ni double evenement n est produit
  And la reponse est identique a la premiere soumission
```

## Feature: Non-regression

```gherkin
Scenario: Le scoring de jeu existant n est pas impacte
  Given l application de comptage de darts existante
  When la fonctionnalite d evaluation premium est deployee
  Then le scoring de jeu fonctionne a l identique
  And le contrat evaluations existant reste disponible en compatibilite
```
