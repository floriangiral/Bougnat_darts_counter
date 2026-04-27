# Plan - Counter iOS 12 Compatibility

1. Formaliser les exigences runtime/CSS/PWA iOS 12.
2. Ajouter plugin build legacy pour Safari/iOS 12.
3. Introduire un module infrastructure de detection des capacites CSS.
4. Appliquer des classes `no-*` au bootstrap app.
5. Ajouter fallbacks CSS cibles sans casser le rendu moderne.
6. Ajouter tests unitaires de detection legacy.
7. Verifier `typecheck`, tests cibles, build.
