# Bougnat Darts Counter Architecture Target

## Objective

This document defines the target architecture for `Bougnat_darts_counter` as an open source, offline-first scoring engine.

The goal is to turn the current application into a cleanly separable product:

- reusable as a standalone darts scoring app
- independent from any backend business logic
- incrementally refactorable without breaking existing gameplay
- integrable with external systems through explicit contracts

This document is the reference for the refactor phases. When an implementation detail conflicts with this target, the target wins unless an explicit migration note says otherwise.

## Product Positioning

`Bougnat_darts_counter` becomes a scoring client and local session engine.

It is not the source of truth for tournament organization, user identity, or cloud analytics.

Its responsibility is to score a darts match reliably on a local device first, then optionally expose clean integration points for remote systems.

## Core Principles

- gameplay first: no refactor may break current scoring flows
- incremental migration: move phase by phase, keep the app running
- spec-driven development: responsibilities and migration goals are documented before structural changes
- clean architecture: domain and use cases must not depend on React, storage, or network
- offline first: the app must remain useful with zero network
- explicit boundaries: remote integrations must go through ports
- open source ready: no backend proprietary business logic inside the counter
- no premature abstraction: add only the boundaries needed for the next phases

## Specification-Driven Direction

The refactor is intentionally specification-driven.

In practice this means:

- product scope is written down before large structural work starts
- each migration phase has an explicit objective and expected deliverable
- responsibilities are frozen in documentation before they are enforced in code
- architecture work is evaluated against documented boundaries, not intuition alone

The documentation set and the architecture are therefore linked:

- `docs/specifications.md` defines what the product must do
- `docs/architecture.md` defines where that behavior should live
- the implementation phases progressively align the code with both

## Scope Split

### What stays in the counter

The counter keeps everything required to run and score a match on device:

- scoring engine
- game rules and variants
- X01, Cricket, Capital, Triathlon gameplay
- score entry flows
- voice scoring
- local sessions
- local persistence
- local history
- local replay and resume
- offline event capture for future sync
- UI for local scoring and optional remote integrations

### What leaves the counter

The counter must stop owning backend business capabilities:

- authentication logic as a business dependency
- persistent cloud profiles
- cloud-based player identity features
- cloud statistics as a core requirement
- multiplayer business logic tied to remote backend state
- tournament orchestration
- match assignment rules
- bracket logic
- remote authoritative user management

These concerns are out of scope for the supported `v1.0.0` runtime and must stay outside the scoring core.

## Operating Modes

The application supports two explicit modes.

### `LOCAL_MODE`

Purpose:

- play freely on one device
- score without network
- keep data on device

Characteristics:

- no auth required
- no backend dependency
- storage is local only
- the device is the temporary source of truth
- session recovery works after refresh or app restart

### `CONNECTED_MODE`

Purpose:

- attach the scoring client to an external scoring ecosystem

Characteristics:

- remote integration is optional, never required for core gameplay
- contracts are defined in ports
- the counter still works offline locally and synchronizes later
- backend-specific logic stays outside the domain
- the backend can become authoritative without polluting the scoring engine

## Bounded Contexts

The target architecture is organized around three bounded contexts.

### 1. Scoring

Responsibility:

- represent games, legs, turns, throws, scores
- validate score inputs
- apply scoring rules
- resolve bust, checkout, leg end, game end
- expose pure business behavior

Must not depend on:

- React
- IndexedDB
- backend-specific SDKs
- HTTP
- browser APIs outside explicit adapters

Key target artifacts:

- entities: `Game`, `Leg`, `Turn`, `Throw`, `Score`
- value objects: `ScoreInput`, `Checkout`
- services: `ScoringRules`, `ScoreValidator`
- use cases: `StartGame`, `RecordThrow`, `UndoThrow`, `EndLeg`, `EndGame`

### 2. Local Session

Responsibility:

- manage current local play session
- persist and restore match state
- manage local history
- manage offline event queue for future sync
- expose repositories and persistence adapters

Must not depend on:

- backend business workflows
- user account model
- tournament bracket model

Key target artifacts:

- `SessionRepository`
- `IndexedDBSessionRepository`
- local history store
- resume session flow
- sync queue storage

### 3. Voice

Responsibility:

- capture voice input
- parse voice scoring intent
- transform utterances into score propositions
- remain an optional capability layered on top of scoring use cases

Must not own:

- match persistence
- scoring state mutation directly
- backend coupling

Key target artifacts:

- voice input adapter
- transcript parser
- score proposal mapper
- UI controls for enabling and confirming voice input

## Clean Architecture Layers

The target source structure is:

```text
src/
  domain/
  application/
  infrastructure/
  features/
  views/
  components/
  shared/
```

Layer responsibilities:

- `domain/`
  - pure business model
  - entities, value objects, domain services
- `application/`
  - use cases
  - orchestration
  - ports
  - DTOs
- `infrastructure/`
  - storage adapters
  - remote adapters
  - serialization
  - IndexedDB and future sync implementations
- `features/`
  - feature-specific orchestration and pure helpers
  - `game-setup/` for setup state, validation, and copy
  - `x01/scoring/` for score submission, previews, and presentation helpers
  - `x01/voice/` for voice parsing and transcription helpers
- `application/scoring/`
  - `matchLifecycle.ts` for match creation, rotation, turns, undo, and start resolution
  - `matchStats.ts` for checkout thresholds and detailed scoring statistics
  - public compatibility facades may remain in `utils/` while callers migrate
- `views/` and `components/`
  - React views, components, hooks, presenters
  - composition roots with minimal business logic
- `shared/`
  - cross-cutting primitives that are not business rules
  - ids, clocks, safe helpers, result types

View split rule:

- when a view mixes orchestration, validation, and rendering, move the non-UI parts into `src/features/...`
- keep rendering components narrowly focused on display and user interaction
- prefer explicit feature files over generic utility buckets when a responsibility is real

Dependency rule:

- `ui` may depend on `application` and `shared`
- `infrastructure` may depend on `application`, `domain`, and `shared`
- `application` may depend on `domain` and `shared`
- `domain` may depend only on `shared` primitives that are framework-agnostic
- no inward layer may import an outward layer

This layering is not cosmetic. It is the concrete implementation of the specification-driven boundaries defined for the scoring engine.

## Integration Boundary

Any remote scoring or session platform is treated as an external system.

The counter must never embed:

- tournament domain rules
- backend persistence assumptions
- remote user model assumptions
- remote authorization business flow inside scoring core

Integration happens only through application ports such as:

- `AuthProvider`
- `RemoteScoringGateway`
- `DeviceAssignmentProvider`
- `SyncRepository`

The first remote implementation may be a no-op adapter or placeholder adapter. The important part is the contract, not the transport.

## Legacy Inventory to Isolate

The v1.0.0 cleanup removes the previous backend-coupled and social surfaces from the supported runtime.

What remains acceptable after this release:

- local persistence adapters
- optional voice integration adapters
- remote-scoring contracts prepared behind ports, without mandatory backend coupling

What is no longer part of the runtime perimeter:

- auth flows
- social or lobby flows
- cloud profile management
- shared mutable session sync
- backend-owned persistence assumptions

The following concerns must stay outside the future core:

- backend-coupled account flows
- remote session and shared-state sync mechanisms
- cloud profile and cloud-history ownership
- any adapter that makes local scoring depend on a proprietary platform

## Simple Context Diagram

```text
                           +-----------------------------------+
                           | External scoring platform         |
                           | auth / assignment / sync backend  |
                           +----------------+------------------+
                                            ^
                                            |
                                 ports + adapters only
                                            |
+-------------------------+      +---------+----------+      +----------------------+
| Voice Context           |----->| Application Layer  |<-----| Local Session Context|
| capture / parse / map   |      | use cases + ports  |      | persistence / resume |
+-------------+-----------+      +---------+----------+      +----------+-----------+
              |                              |                            |
              v                              v                            v
      +-------+------------------------------------------------------------+------+
      |                            Scoring Context                                 |
      |                  pure rules, entities, validation                          |
      +------------------------------------------------------------------------------+
                                            |
                                            v
                                   React UI / local device
```

## Refactor Roadmap

### Phase 1

- freeze responsibilities
- define target scope and boundaries
- align terminology

### Phase 2

- create target folder structure
- add clean layer entry points
- move code progressively without breaking build

### Phase 3

- extract pure domain model
- keep rules framework-free and testable

### Phase 4

- wrap scoring logic in application use cases
- add repository and sync ports

### Phase 5

- move persistence to robust local offline-first storage

### Phase 6

- remove backend business coupling from core flows

### Phase 7

- define optional remote-mode contracts without real backend implementation

### Phase 8

- introduce event-based sync pipeline

### Phase 9

- clarify UI between local session and remote session

### Phase 10

- publish shared contracts package for interoperability

## Non Goals for the Refactor

The refactor does not aim to:

- rewrite every screen at once
- redesign gameplay rules
- introduce a heavy DDD framework
- over-model trivial concepts
- force a backend implementation in the counter repository

## Migration Guardrails

Every phase must respect these rules:

- gameplay remains stable
- build stays green
- changes stay incremental
- each phase is independently reviewable
- tests are added first for extracted pure logic when possible
- no dead code kept "for later" without a migration note

## Success Criteria

The refactor succeeds when the counter is:

- open source ready
- usable fully offline
- independent from backend business dependencies
- cleanly layered
- locally persistent
- ready to connect to external systems through stable contracts
