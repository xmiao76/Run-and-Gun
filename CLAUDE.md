# Persistent Agent Instructions

## Product identity

The working title is **Operation Iron Echo**. It is an original browser-based 2D side-scrolling run-and-gun game inspired by the broad mechanics of classic arcade games. It is not a Contra port, remake, fan game, ROM wrapper, or asset recreation.

## Read-first documents

Before implementation work, read:

1. GAME_REQUIREMENTS.md
2. ACCEPTANCE_CRITERIA.md
3. ARCHITECTURE.md
4. TEST_PLAN.md
5. MILESTONES.md
6. ASSET_POLICY.md
7. PROGRESS.md
8. BLOCKERS.md

## Technology constraints

- TypeScript with strict type checking
- Phaser for the 2D game runtime
- Vite for development and production builds
- Vitest for deterministic unit and integration tests
- Playwright with Chromium for browser flows
- ESLint for static analysis
- Static deployment compatible with Cloudflare Pages
- No React, Vue, Angular, server framework, database, or runtime backend

## Engineering principles

- Keep simulation, rendering, input, audio, and persistence separated.
- Prefer data-driven enemies, weapons, levels, and balance values.
- Use a fixed or bounded simulation step and make core rules deterministic.
- Never use frame-rate-dependent movement or damage.
- Centralize collision layers and object categories.
- Use object pooling for frequently created bullets and effects after correctness is established.
- Do not hide gameplay behavior inside scene files when it can be a testable system.
- Expose a small test/debug bridge only in development or explicit debug mode.
- Keep the production bundle free of secrets and private endpoints.

## Workflow

- Work on one milestone at a time.
- Update PROGRESS.md before and after each milestone.
- Run relevant tests after each meaningful change.
- Run the full quality gate before a milestone is marked complete.
- Commit locally only when the repository is in a coherent, tested state.
- Never push, deploy, or open a pull request without explicit user authorization.

## Definition of done

A feature is not done because it appears on screen. It is done only when:

- behavior matches GAME_REQUIREMENTS.md;
- relevant acceptance criteria are objectively verified;
- tests cover important deterministic rules;
- the game remains playable in the browser;
- there are no uncaught browser console errors;
- lint, typecheck, tests, E2E tests, and build all pass;
- PROGRESS.md contains evidence.
