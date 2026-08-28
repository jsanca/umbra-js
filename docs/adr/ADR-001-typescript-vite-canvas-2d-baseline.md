# ADR-001: Use TypeScript, Vite, and Canvas 2D for the Sprint 1 Baseline

Status: Approved at Gate G0 on 2026-08-28  
Date: 2026-08-28

## Context

Umbra begins with no application scaffold. The project definition names TypeScript, Vite, and Canvas 2D, while Sprint 1 needs a small, inspectable foundation rather than a general rendering platform.

## Decision

Sprint 1 will establish a browser application using TypeScript, Vite, vanilla browser APIs, and the browser Canvas 2D API. The selected test runner and browser-test tooling are implementation details to be proposed in Slice 1, provided they support the verification strategy and each package is explicitly justified.

Sprint 1 will not introduce Three.js, WebGL, external math libraries, rendering engines, path tracing, acceleration structures/BVH, meshes, textures, Web Workers, a complex scene editor, or premature optimization.

## Consequences

- The initial build stays focused on browser fundamentals and direct pixel output.
- The project avoids a WebGL, framework, or 3D-engine commitment before it is justified.
- Dependencies remain small and auditable; a new package needs a documented immediate purpose.
- Canvas rendering must be kept separate from the mathematical/rendering core as specified by ADR-002.
- This decision does not establish installed packages or runnable commands; those do not exist until Slice 1 is authorized and executed.

## Alternatives considered

- **WebGL/WebGPU:** deferred; adds graphics-API concepts before the first ray-tracing lessons are established.
- **A UI framework:** deferred; no product requirement currently justifies its state and dependency surface.
- **A static mockup image:** rejected; it cannot demonstrate light-to-pixel rendering.

## References

- [Project definition](../product/SPRINT-1-PRODUCT-BRIEF.md)
- [Rendering boundaries](ADR-002-sprint-1-rendering-boundaries.md)
