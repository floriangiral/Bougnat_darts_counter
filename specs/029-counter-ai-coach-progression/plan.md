# Plan - counter ai coach progression

## Phase 1 - Spec et fondations frontend

- [x] creer la spec locale `029`
- [x] definir les contrats domaine/application du Coach
- [x] creer le composant `CoachAIService` avec validation metier
- [x] ajouter un ecran Coach Home avec les 4 parcours imposes
- [x] ajouter des tests unitaires de fondation

## Phase 2 - Contrats backend Tournament

- [ ] implementer les endpoints REST Coach sur `Bougnat_Darts_Tournaments`
- [ ] brancher persistance SQL normalisee + migrations
- [ ] exposer le catalogue d exercices depuis la DB
- [ ] implementer evaluation initiale et progression

## Phase 3 - IA decisionnelle (backend)

- [ ] integrer OpenAI GPT-5.5 cote backend uniquement
- [ ] ajouter RAG sur catalogue/historique/competences
- [ ] verrouiller le system prompt et le format JSON de sortie
- [ ] valider toutes les sorties IA via moteur metier

## Phase 4 - Programmes et seances

- [ ] generation cycles + seances
- [ ] adaptation selon executions et reevaluations
- [ ] strategie de cache pour limiter les appels IA

## Phase 5 - Qualite et livraison

- [ ] tests integration et E2E Coach
- [ ] non-regression scoring complet
- [ ] documentation release + ADR complementaires
