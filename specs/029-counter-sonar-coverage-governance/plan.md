# Plan - Sonar coverage governance

## Phase 1 - Contract

- Publish the coverage classification and exception rules in `spec.md`.
- Reference the contract from `CONTRIBUTING.md` and `specs/README.md`.

## Phase 2 - CI alignment

- Keep Vitest global floors and Sonar new-code coverage as independent gates.
- Ensure every Playwright browser declared in `playwright.config.ts` is installed by CI.
- Keep coverage exclusions narrow and documented.

## Phase 3 - Adoption

- Require every feature spec to declare changed layers and test strategy.
- Add unit tests for business and presentation-model behavior before merge.
- Add component or E2E acceptance tests for user-visible UI composition.
- Review temporary exceptions during release readiness checks.

## Exit criteria

- The contribution guide links to the active governance spec.
- CI configuration has no browser-install mismatch.
- Sonar exclusions are explicit and justified.
- New-code coverage remains at or above 80% on pull requests.
