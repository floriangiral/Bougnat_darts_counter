# Spec 011 - counter home install shortcut

## Meta

- ID: `011-counter-home-install-shortcut`
- Statut: `active`
- Milestone cible: `M5: Offline-first UX`
- Issues GitHub: `#to-create`

## Objectif

Ajouter sur la page d accueil un bouton d installation explicite pour simplifier la creation du raccourci ecran d accueil sur Android et iOS (smartphone et tablette).

## Decisions

- placer le bouton juste sous le bloc `Partager L'App`
- utiliser `beforeinstallprompt` quand disponible (Android/Chrome-like)
- afficher un guide manuel iOS (Safari: partager puis sur l ecran d accueil)
- masquer l action si l app est deja installee en mode standalone
- conserver un fallback guide Android si le prompt natif n est pas disponible

## Invariants critiques

- aucun blocage du flux principal `Lancer une partie`
- aucune dependance backend pour l installation
- guidance explicite et lisible pour iOS et Android
- comportement identique smartphone et tablette

## Impacted Code

- `views/HomeView.tsx`
- `components/ui/InstallAppButton.tsx`
- `src/features/app-install/installPromptModel.ts`
- `src/features/app-install/useInstallPrompt.ts`

## Canonical Entry Points

- CTA homepage `Installer sur l ecran d accueil`
- hook `useInstallPrompt`

## Key Tests

- `tests/unit/appInstall/installPromptModel.test.ts`
- `npm run typecheck`
- `npm run lint`

## Validation

- bouton visible sous `Partager L'App` sur mobile/tablette
- prompt natif Android quand disponible
- guide iOS affiche les etapes Safari
- bouton cache en mode standalone
