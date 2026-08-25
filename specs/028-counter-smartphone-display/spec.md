# Spec 028 - Counter smartphone display

## Status

Active

## Objective

Provide a robust smartphone presentation for every scoring game, including small-height devices, virtual keyboards, PWA safe areas and landscape orientation when the user chooses it.

## Scope

- iOS and Android smartphones from 320px wide
- portrait as the default orientation, landscape allowed
- X01, Cricket, Capital, Killer, Gotcha and Triathlon
- setup, starter selection, statistics, checkout and exit dialogs
- browser and standalone PWA display modes

## Architectural decisions

- Smartphone presentation state is owned by `src/features/smartphone` and exposed by the application shell.
- The scoring domain and persisted session contracts are unchanged.
- `dedicated_tablet` never activates tablet presentation below 768px.
- `visualViewport` drives a CSS viewport-height variable when the virtual keyboard changes the visible area.
- Safe-area primitives are global and reusable by smartphone and tablet surfaces.
- Triathlon phases share one fullscreen presentation shell.

## Invariants

1. Portrait remains the default smartphone presentation.
2. Landscape is never functionally blocked.
3. Primary controls are at least 44px high.
4. The primary action remains reachable when the virtual keyboard is open.
5. Safe-area insets protect fullscreen controls and dialogs.
6. No smartphone rule changes desktop or tablet layouts.
7. `dedicated_tablet` on a smartphone keeps smartphone presentation.
8. Every game can enter without horizontal or vertical document overflow.

## Acceptance checks

- Playwright covers 320x568, 390x844 and 844x390.
- Every game is entered on every smartphone profile.
- Primary action visibility and document overflow are checked.
- Setup numeric input is checked with the virtual keyboard emulation.
- Dialogs expose a consistent modal surface and remain inside the viewport.
- Triathlon is checked at initial draw and at each scoring phase.
