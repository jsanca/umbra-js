# Umbra Sprint 1 Architecture Overview

Status: Implemented (S1-001 through S1-010 verified)
Authority: [ADR-001](../adr/ADR-001-typescript-vite-canvas-2d-baseline.md) and [ADR-002](../adr/ADR-002-sprint-1-rendering-boundaries.md); implementation evidence in the [S1-001..S1-010 reports](../engineering/agents/reports/).

```text
UI shell ──► render controller ──► pure rendering core ──► pixel buffer
   │                │                                           │
   │                └────────► diagnostics adapter ◄───────────┘
   └──────────────────────────► Canvas output adapter ◄─────────┘
```

## Lightweight boundaries (as implemented)

- **Pure rendering core (`src/core/`)** — pure data and math: `Vec3`, `Ray`, `Camera`, `Sphere`, `SphereHit`, `computeSphereNormal`, `normalToRgbaColor`, `PointLight`, `lightDirectionFromHit`, `diffuseShadingColor`, `backgroundColorForDirection`, `createSolidColorGenerator` (S1-003, superseded for the fixed scene by `createBackgroundGradientGenerator` and `createSphereRenderGenerator`), `createBackgroundGradientGenerator`, `createSphereRenderGenerator`, `createRequestRenderGenerator`, `PixelBuffer`, `RgbaColor`. No browser or framework imports. ADR-002 is preserved end-to-end.
- **Diagnostics adapter (`src/diagnostics/`)** — `createRenderDiagnostics` plus the `RenderDiagnosticsSnapshot`/`RenderDiagnosticsSink` value types and `formatStatus`/`formatDimensions`/`formatRenderTime` formatters. Passive value object; not a plugin system.
- **Canvas output adapter (`src/canvas/`)** — `createCanvasOutputAdapter` and `assertContextMatchesBuffer`. The only module that touches `CanvasRenderingContext2D` / `ImageData`. It accepts an already-computed pixel buffer and pushes it onto a 2D context via `putImageData`.
- **Render controller (`src/controller/`)** — `createRenderController` is the single dual-dependency module: it depends on both the pure rendering core and the Canvas output adapter. It acquires a 2D context, calls the supplied `PixelBufferGenerator`, delegates the buffer write to the adapter, records timing/status through the diagnostics adapter, and projects the snapshot onto the UI status/dims/time elements.
- **Scene input adapter (realized in `src/core/render-request.ts`)** — the contract module that accepts `RenderRequest v0`, validates it (`validateRenderRequest`), converts it to core values (`createRequestRenderGenerator`), and returns a `PixelBufferGenerator` whose buffer dimensions are fixed by `request.output`. This is the G7-recommended "scene input adapter" seam, implemented inside the pure core so the conversion is testable and DOM/Canvas-free.
- **UI shell (`src/ui/`)** — `mountShell` builds the static laboratory: header, viewport, status, dims, time, and lesson/pipeline panels. No control behavior beyond the Render button. The current-concept and pipeline labels remain as set in S1-002 ("Ray–Sphere Intersection" + the four-step pipeline with `intersection` highlighted); they are S1-011-known limitations (carry-forward).
- **Composition root (`src/main.ts`)** — constructs the `RenderRequest v0` describing the fixed scene (camera, sphere, point light) and passes the resulting `PixelBufferGenerator` into `createRenderController`.

## Implemented core modules

The Sprint 1 pure rendering core consists of the following modules (each a single file under `src/core/`, with a colocated `.test.ts`):

| Module | Purpose | Introduced by |
| --- | --- | --- |
| `vec3.ts` | `Vec3` value + arithmetic + normalization + `VEC3_ZERO`/`VEC3_EPSILON` policies | S1-004 |
| `ray.ts` | `Ray` value + `pointAtRay` | S1-004 |
| `pixel-buffer.ts` | `PixelBuffer`, `RgbaColor`, `createPixelBuffer`, `fillPixelBuffer`, `expectedBufferLength` | S1-003 |
| `smoke-generator.ts` | `createSolidColorGenerator` + `SMOKE_FILL_COLOR` (S1-003 fixed-color smoke path; superseded for the fixed scene by `createSphereRenderGenerator`) | S1-003 |
| `camera.ts` | `Camera`/`CameraConfig`, `createCamera`, `generateRay`, `VEC3_UP`, `VIEWPORT_CENTER`, `VIEWPORT_SAMPLES` | S1-005 |
| `sphere.ts` | `Sphere`, `SphereHit`, `createSphere`, `intersectSphere` (full quadratic, nearest-valid-root policy) | S1-007 |
| `normal.ts` | `computeSphereNormal`, `normalToRgbaColor` | S1-008 |
| `background-gradient.ts` | `DEFAULT_BACKGROUND_GRADIENT`, `backgroundColorForDirection`, `createBackgroundGradientGenerator` | S1-006 |
| `light.ts` | `PointLight`, `createPointLight`, `lightDirectionFromHit`, `diffuseShadingColor` (Lambertian) | S1-010 |
| `sphere-renderer.ts` | `createSphereRenderGenerator` (hit → diffuse or normal color; miss → background) | S1-008 (normal path), S1-010 (light option) |
| `render-request.ts` | `RenderRequestV0` and like-types, `validateRenderRequest`, `createRequestRenderGenerator` (scene input adapter) | S1-009 (contract), S1-010 (`scene.light` additive) |

## Dependency rules (as enforced)

| Source | May depend on | Must not depend on |
| --- | --- | --- |
| Pure core (`src/core/**`) | Language-standard value types and pure-core siblings | DOM, Canvas, Vite, UI, diagnostics implementation |
| Diagnostics adapter (`src/diagnostics/**`) | Language types and an injectable clock | DOM, Canvas, Vite, UI, pure-core math |
| Canvas adapter (`src/canvas/**`) | `../core/pixel-buffer.js` | DOM globals outside the `CanvasRenderingContext2D` argument; pure-core math internals |
| Controller (`src/controller/**`) | `../core/**`, `../canvas/**`, `../diagnostics/**` | UI details or direct visual styling |
| UI shell (`src/ui/**`) | Controller, `Document`/`HTMLElement` | Pure-core math internals |

No formal ports/adapters framework or plugin architecture is used in Sprint 1. The scene input adapter lives inside the pure core so its conversion is testable without DOM. These conceptual seams exist solely to preserve testability and evolutionary change.

## Carried limitations (tracked, not addressed)

The Sprint 1 architecture honors the constraints above but the following limitations are documented and tracked in the [carry-forward backlog](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md):

- The `PixelBufferGenerator` type still lives in `smoke-generator.ts` (CF-002 / G6-3); moving it to a neutral core module is deferred.
- `intersectSphere` silently returns `null` for a degenerate zero-length direction (CF-001 / G6-1); the guard is deferred.
- `normalToRgbaColor` does not harden against `NaN` components (CF-003 / S1-008-2); non-material because the pipeline only feeds finite unit vectors.
- `validateRenderRequest` does not surface `position == lookAt` or `forward ∥ up` (CF-005 / G7-2); those are delegated to `createCamera` during conversion.
- `validateRenderRequest` is permissive about unknown fields (CF-004 / G7-1, recorded in [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md)); a hardening pass may add strict mode or versioning.
- The conceptual docs (this page and the [API contract](umbra-api-contract.md)) were stale relative to the implementation through G7 and were promoted at S1-011 (CF-006 / G7-5).

## References

- [ADR-001 — TypeScript, Vite, and Canvas 2D baseline](../adr/ADR-001-typescript-vite-canvas-2d-baseline.md)
- [ADR-002 — Sprint 1 rendering boundaries](../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [ADR-003 — RenderRequest v0 validation policy](../adr/ADR-003-render-request-v0-validation-policy.md)
- [API contract](umbra-api-contract.md)
- [Domain model](umbra-domain-model.md)
- [Carry-forward backlog](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md)
- [Sprint 1 verification strategy](../engineering/umbra-verification-strategy.md)
- [ENGINEERING_LOG](../engineering/ENGINEERING_LOG.md)