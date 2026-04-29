# Contributing

## Principes

- ne pas casser le gameplay existant
- preferer des changements incrementaux
- garder le domaine separable de l UI et de l infrastructure
- documenter les changements structurants dans les specs et les docs d architecture
- ne pas reintroduire de dependance runtime a un backend metier dans le perimetre supporte

## Frontiere open source `v1.1`

Les contributions attendues doivent renforcer ou clarifier :

- scoring
- jeux supportes
- voice scoring optionnel
- persistance locale
- reprise locale
- experience offline-first
- traçabilite spec → code → tests → issues

Les contributions ne doivent pas reintroduire dans ce repo :

- backend metier
- authentification metier avancee
- profils distants persistants
- statistiques cloud consolidees
- logique tournoi proprietaire
- dependance runtime obligatoire a `Bougnat_Darts_Tournaments`

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
