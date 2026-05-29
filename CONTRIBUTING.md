# Contributing

## Principes

- ne pas casser le gameplay existant
- preferer des changements incrementaux
- garder le domaine separable de l UI et de l infrastructure
- documenter les changements structurants dans les specs et les docs d architecture
- garder le gameplay local utilisable sans backend

## Frontiere open source `v1.1` et evolution hub

Les contributions attendues doivent renforcer ou clarifier :

- scoring
- jeux supportes
- voice scoring optionnel
- persistance locale
- reprise locale
- experience offline-first
- traçabilite spec → code → tests → issues
- integration hub via `spec:counter/hub-auth-tournament-scoring`

Les contributions connectees peuvent ajouter :

- inscription / connexion utilisateur
- chargement de matchs tournoi
- soumission de resultats tournoi
- adapters frontend vers le backend Bougnat Darts

Les contributions ne doivent pas introduire dans ce repo :

- implementation du backend metier
- profils distants persistants
- statistiques cloud consolidees
- logique tournoi proprietaire
- orchestration organisateur avancee
- dependance reseau pour jouer une partie locale

## Verification minimale

Avant une pull request :

```bash
npm run typecheck
npm run test:unit
npm run build
```

Verification recommandee pour les changements de flux utilisateur :

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
# puis dans un second terminal
npm run test:e2e
```

## Orientation produit

Les contributions attendues pour `v1.1+` concernent en priorite :

- scoring
- jeux
- assistance vocale
- persistance locale
- experience offline-first
- integration hub/tournoi derriere ports applicatifs explicites
