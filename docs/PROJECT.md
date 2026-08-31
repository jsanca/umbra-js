# Project Context

> Complete each placeholder with project-specific facts. Mark unknown information as `Unknown` and link evidence when it becomes available.

## Mission

Umbra is a didactic ray tracer that helps learners understand how light becomes pixels by building a small rendering engine from first principles.

## Scope

### In scope

- A browser-based educational ray-tracing laboratory.
- Stepwise teaching of vectors, rays, camera-ray generation, sphere intersection, surface normals, lighting, shadows, materials, and Canvas 2D pixel output.
- A small, inspectable Sprint 1 experience that reaches a deterministic, directly lit sphere scene through Canvas 2D.

### Out of scope

- A general-purpose 3D editor, game engine, or production path tracer.
- Sprint 1 scene graphs, export, post-processing, BVH acceleration, advanced materials, textures, WebGL, and settings dialogs.

## Current State

Sprint 1 implementation is present: a TypeScript/Vite application, deterministic rendering core, Canvas 2D presentation adapter, static learning shell, tests, and the `npm run verify` evidence hook. S1-001 through S1-011 have implementation/checkpoint records. Gate reviews exist for G1, G2, and G4–G8; G3 has no recorded review artifact, and G9 product acceptance remains pending. This is not authorization for Sprint 2.

## Architecture

The implemented Sprint 1 architecture separates a pure rendering core from diagnostics, Canvas output, controller, and UI-shell layers. The current explanation is the [Sprint 1 architecture overview](knowledge/umbra-architecture-overview.md); [ADR-001](adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and [ADR-002](adr/ADR-002-sprint-1-rendering-boundaries.md) retain the decision rationale.

## Technology

TypeScript, Vite, browser Canvas 2D, Vitest, and happy-dom shell/controller tests. The reproducible local commands are `npm run build`, `npm run test:run`, `npm run typecheck`, and `npm run verify`; the verification strategy records their scope and evidence limits.

## Repository Map

- `docs/product/`: product intent and Stitch design input.
- `docs/roadmap/`: committed staged direction.
- `docs/adr/`: approved architectural choices and consequences.
- `docs/engineering/agents/tasks/`: implementation contracts for authorized slices.
- `docs/engineering/agents/reviews/`: future independent review evidence.
- `docs/knowledge/`: durable current system knowledge after implementation establishes it.

## Getting Started

Install dependencies, then use `npm run dev` for local development or `npm run verify` for the standard recorded validation sequence. Read the [verification strategy](engineering/umbra-verification-strategy.md) before interpreting a passing hook as product acceptance.

## Important References

- [Workspace operating guide](OSK.md)
- [Project knowledge](knowledge/README.md)
- [Sprint 1 product brief](product/SPRINT-1-PRODUCT-BRIEF.md)
- [Sprint 1 architecture overview](knowledge/umbra-architecture-overview.md)
- [Sprint 1 roadmap](roadmap/umbra-sprint-1-roadmap.md)
- [Sprint 1 verification strategy](engineering/umbra-verification-strategy.md)
