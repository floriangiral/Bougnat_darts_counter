# Contributing

## Principes

- ne pas casser le gameplay existant
- preferer des changements incrementaux
- garder le domaine separable de l UI et de l infrastructure
- documenter les changements structurants dans les specs et les docs d architecture
- ne pas reintroduire de dependance runtime a un backend metier dans le perimetre supporte

## Verification minimale

Avant une pull request :

```bash
npm run typecheck
npm run test:unit
npm run build
```

## Orientation produit

Les contributions attendues pour `v1.0.0+` concernent en priorite :

- scoring
- jeux
- assistance vocale
- persistance locale
- experience offline-first
