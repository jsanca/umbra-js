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

Gate G0 is approved. The repository contains OSK bootstrap documentation and the Google Stitch product mockup, but no TypeScript/Vite application, build configuration, source, or test implementation. Only `UMBRA-S1-001` is authorized; all later Sprint 1 slices remain unauthorized until their preceding gates pass.

## Architecture

No implemented architecture exists. The proposed Sprint 1 architecture and its decision rationale are recorded in [ADR-001](adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and [ADR-002](adr/ADR-002-sprint-1-rendering-boundaries.md); they are planning decisions, not claims about current implementation.

## Technology

Planned baseline: TypeScript, Vite, browser Canvas 2D, and a browser test layer selected during Slice 1. No package manager lockfile, dependencies, commands, or deployment target exist yet.

## Repository Map

- `docs/product/`: product intent and Stitch design input.
- `docs/roadmap/`: committed staged direction.
- `docs/adr/`: approved architectural choices and consequences.
- `docs/engineering/agents/tasks/`: implementation contracts for authorized slices.
- `docs/engineering/agents/reviews/`: future independent review evidence.
- `docs/knowledge/`: durable current system knowledge after implementation establishes it.

## Getting Started

There is no runnable application yet. After Gate G0 approval, the Software Engineer begins with [UMBRA-S1-001](engineering/agents/tasks/umbra-sprint-1-slices.md); that slice will establish the reproducible setup and validation path.

## Important References

- [Workspace operating guide](OSK.md)
- [Project knowledge](knowledge/README.md)
- [Sprint 1 product brief](product/SPRINT-1-PRODUCT-BRIEF.md)
- [Sprint 1 architecture overview](knowledge/umbra-architecture-overview.md)
- [Sprint 1 roadmap](roadmap/umbra-sprint-1-roadmap.md)
- [Sprint 1 verification strategy](engineering/umbra-verification-strategy.md)
