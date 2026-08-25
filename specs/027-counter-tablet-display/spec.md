# Spec 027 - Counter tablet display

## Status

Active

## Objective

Provide a dedicated tablet presentation for every scoring game while preserving the existing phone and desktop experiences. Portrait is the default orientation, but landscape must remain fully supported when the device or user prefers it.

## Scope

- X01
- Cricket
- Capital
- Killer
- Gotcha
- Triathlon
- setup, starter overlays, statistics and exit dialogs used by scoring flows
- installed PWA orientation and safe-area behavior

## Architectural decisions

- Scoring rules and game state remain in domain/application layers.
- Tablet detection and responsive state live in `src/features/tablet`.
- Tablet presentation is exposed by the application shell through data attributes.
- A tablet is a coarse-pointer viewport from 768px to 1279px, or an explicit `dedicated_tablet` access mode.
- Portrait is the default layout; landscape uses available width for a scoreboard/control split.
- Compact density is selected below 700px viewport height.
- No tablet CSS selector may affect phone or desktop layouts.

## Invariants

1. `orientation: any` is allowed by the PWA manifest.
2. No game is functionally blocked by landscape orientation.
3. Critical controls have a 48px touch target on tablet.
4. Scoreboard and primary input remain simultaneously reachable in landscape.
5. A compact-height tablet never hides the primary action behind `overflow: hidden`.
6. Safe-area insets are applied to fullscreen scoring surfaces and modals.
7. The same scoring use cases and persisted session contracts are used in every layout.

## Acceptance checks

- Playwright projects cover 768x1024, 1024x768, 1280x800 and 1024x600.
- Every game is entered in portrait and landscape.
- Horizontal overflow is absent.
- Primary keypad/action controls are visible and at least 48px high.
- Stats, setup rules, starter selection and exit confirmation remain usable.
- The complete Triathlon flow is checked through all phases.
