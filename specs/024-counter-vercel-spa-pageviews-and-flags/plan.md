# Plan - Spec 024

1. Etendre le port analytics pour supporter les `pageview` manuels.
2. Introduire un mapping centralise entre `AppScreen` et route analytique.
3. Instrumenter `App.tsx` pour emettre un `pageview` a chaque changement d ecran hydrate.
4. Conserver et verifier la synchronisation des flags avant emission du `pageview`.
5. Ajouter des tests unitaires d orchestration application.