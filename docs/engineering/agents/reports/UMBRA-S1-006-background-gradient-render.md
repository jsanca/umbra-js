# UMBRA-S1-006 — Background-Gradient Render — Report

## Status

Complete

## Objective

Create the first visually meaningful render without geometry: a controller/core loop that maps one camera ray per pixel to a deterministic background gradient and returns a `PixelBuffer` to Canvas. Non-goals: sphere hit testing, normals, point lighting, materials, and anti-aliasing.

Acceptance criteria (from [S1-006 in the slice plan](../tasks/umbra-sprint-1-slices.md)): selected output pixels prove the gradient; Render visibly updates Canvas deterministically.

Task contract: [S1-006 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy rows: [TC-S1-008 (pixel samples), TC-S1-009 (determinism), TC-S1-011 (Canvas image data)](../umbra-verification-strategy.md).

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-29), not by a passed review gate. G4 (S1-005 camera) and G5 (first visual) remain **unpassed**.

## Summary

Added a pure-core background-gradient module that maps a camera ray's unit direction to an opaque RGBA color by linear interpolation between a `bottom` and a `top` color, driven solely by the vertical component of the direction. A `createBackgroundGradientGenerator(camera, gradient)` factory returns a `PixelBufferGenerator` (the same shape the render controller already consumes) that samples one camera ray per pixel using the pixel-center convention and writes the result into a `PixelBuffer`.

The composition root (`src/main.ts`) now builds the documented S1-005 sample camera and injects the gradient generator into the existing render controller. The controller is unchanged — it remains generator-agnostic — so the change is exactly the "wire the gradient into the render path" step the slice required, and no new boundary was introduced.

ADR-002 is preserved: `background-gradient.ts` imports only `pixel-buffer`, `camera`, `vec3`, and the `PixelBufferGenerator` type from `smoke-generator`, all pure-core siblings. No DOM, Canvas, Vite, or UI type appears in the module.

The suite now reports **155 tests across 11 files** (137 from S1-005 + 18 new), typecheck is silent, the production bundle grows from 11 to 15 modules (the camera/vec3/ray/background-gradient modules are now reachable from the app entry), and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/background-gradient.ts` — `BackgroundGradient` value type; `DEFAULT_BACKGROUND_GRADIENT` constant; `backgroundColorForDirection(direction, gradient?)` mapping a direction to a color; `createBackgroundGradientGenerator(camera, gradient?)` returning a `PixelBufferGenerator` that samples one ray per pixel. Full semantics documented in the module header (see "Semantics" below).
- `src/core/background-gradient.test.ts` — 16 tests: default-gradient constants and range; `backgroundColorForDirection` contract (up/down/horizon, y-only dependence, monotonicity, clamping, determinism, 8-bit range sweep); generator contract (dimensions/stride, per-pixel consistency against the documented contract, top-lighter-than-bottom, opaque alpha, cross-instance determinism, fresh buffer per call).

### Modified

- `src/main.ts` — composition root now creates the documented sample camera (`position = (0,0,0)`, `lookAt = (0,0,-1)`, `fov = π/3`, `aspect = 640/400`) and passes `createBackgroundGradientGenerator(camera)` as the controller's `generator`.
- `src/controller/render-controller.test.ts` — added a `background-gradient integration` describe block (2 tests) proving the real gradient generator plugs into the existing render path and writes a deterministic gradient buffer through the Canvas adapter.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility; gradient semantics are recorded here for the S1-007 handoff).

## Semantics (recorded for S1-007 handoff)

- **Gradient is a function of the ray direction's vertical component.** `backgroundColorForDirection(direction, gradient)` computes `t = clamp01(0.5 * (direction.y + 1))` and returns `lerp(bottom, top, t)` channel-by-channel. `direction` is expected to be the unit direction from `generateRay`; only `direction.y` is read, so the gradient is symmetric about the camera's trueUp axis.
- **Canonical colors.** `DEFAULT_BACKGROUND_GRADIENT`:
  - `top = (0x66, 0x4d, 0xb3)` (bright violet) — reached at `direction.y = +1` (looking up);
  - `bottom = (0x0c, 0x07, 0x1f)` (near-black violet) — reached at `direction.y = -1` (looking down);
  - horizon (`direction.y = 0`) → midpoint `(0x39, 0x2a, 0x69)`.
- **Pixel-center convention.** Pixel `(x, y)` maps to `u = (x + 0.5) / width`, `v = (y + 0.5) / height`. This is the same `(u, v)` screen convention S1-005 documents (`v = 0` top, `v = 1` bottom), so top rows resolve toward the top color.
- **Integer output.** Channels are blended in floating point, rounded with `Math.round`, and clamped to `[0, 255]`. The alpha channel blends the same way and is `0xff` for the default gradient (both endpoints are opaque).
- **Determinism.** The same `Camera`, `gradient`, and pixel coordinates always produce the same buffer. The controller-level integration test re-derives every pixel from `generateRay` + `backgroundColorForDirection` and asserts exact equality against the written `ImageData`.

## Color tolerance

Per the evidence policy, tolerances were defined before the tests were written:

- **Color channels are exact 8-bit integers.** Assertions use strict `toEqual`/`toBe` equality on channel values, not approximate comparison, because the blend path is deterministic integer arithmetic. There is no floating-point color tolerance.
- **Direction → color mapping is exact per channel.** The `y`-only dependence, the three canonical colors (up/down/horizon), and the per-pixel consistency sweep are all asserted exactly.
- **Inherited tolerance.** The only floating point in the pipeline is the S1-005 camera ray direction (`VEC3_EPSILON = 1e-6`); the gradient consumes `direction.y` and performs no vector math of its own.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 11 passed (11) / Tests 155 passed (155)`; the new file runs in the `core` (node) project, the integration tests in the `shell` (happy-dom) project.
- `npx vitest run src/core/background-gradient.test.ts` → 16 passed.
- `npm run build` → `✓ 15 modules transformed.` exit 0 (bundle now includes camera/vec3/ray/background-gradient; previously 11 modules).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T171211Z.md`.
- `npm audit signatures` → 56/56 verified, 25 with attestations (no new packages added).
- `npm audit` → 0 vulnerabilities.

### Core boundary inspection (TC-S1-005 continuity)

Imports in `src/core/` after this slice:

| File | Imports |
| --- | --- |
| `vec3.ts` | none (language types only) |
| `ray.ts` | `./vec3.js` only |
| `pixel-buffer.ts` | none |
| `smoke-generator.ts` | `./pixel-buffer.js` only |
| `camera.ts` | `./vec3.js`, `./ray.js` only |
| `background-gradient.ts` | `./pixel-buffer.js`, `./camera.js`, `./vec3.js`, `./smoke-generator.js` (type-only) |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: `background-gradient.ts` adds pixel-buffer/camera/vec3 + a smoke-generator type-only import |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; still generator-agnostic) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller + core | composition root | Compliant (wires camera + gradient generator) |

## Validation

### TC-S1-008 / TC-S1-009 / TC-S1-011

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 11 passed (11) / Tests 155 passed (155)` |
| `npm run build` | 0 | `✓ 15 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/background-gradient.test.ts` | 0 | `16 passed (16)` |

The new tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Default gradient | 2 | top/bottom constants; 8-bit range + opaque alpha |
| `backgroundColorForDirection` | 8 | up→top, down→bottom, horizon→midpoint; y-only dependence; monotonic in y; out-of-range clamping; determinism; 8-bit sweep |
| Generator contract | 6 | dimensions/stride; per-pixel consistency vs `generateRay`+`backgroundColorForDirection`; top lighter than bottom; opaque alpha; cross-instance determinism; fresh buffer |
| Controller integration | 2 | render path writes a gradient `ImageData` matching the contract; visible vertical gradient |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear. The slice's explicit non-goals (sphere hit testing, normals, point lighting, materials, anti-aliasing) are confirmed absent: no sphere/intersection/light module was created or imported.

## Limitations

- **No screenshot in this environment.** The slice handoff calls for a stable first-render screenshot; producing one requires browser automation, and the repo intentionally carries no browser-automation dependency (and S1-006 forbids adding one). The deterministic pixel-coordinate evidence above supersedes a visual screenshot per the evidence policy ("manual visual confirmation supplements, never replaces"). A human may capture the running app via `npm run dev` for the G5 visual record.
- **Gradient is vertical (world-space `y`).** The color depends only on the camera ray's trueUp component, so tilting the camera rotates the gradient with the view. A screen-space gradient was not a requirement and would have hidden the "ray direction → color" teaching point.
- **`smoke-generator.ts` remains the controller default.** The smoke generator is unchanged and still used as the controller fallback; `main.ts` explicitly passes the gradient generator. If a later slice wants the gradient as the default, that is a controller-policy change for that slice.
- **No `Camera → RGBA` change to the camera module.** The camera still returns geometric `Ray`s only; the color mapping lives in the gradient module, keeping the S1-005 boundary intact.

## Handoff (to G5 reviewers and S1-007)

- **Gradient API:** `backgroundColorForDirection(direction, gradient?)` and `createBackgroundGradientGenerator(camera, gradient?)`, both in `src/core/background-gradient.ts`. The generator is a drop-in `PixelBufferGenerator` for `createRenderController`.
- **Stable first-render pixel coordinates for S1-007.** For the fixed camera `position = (0,0,0)`, `lookAt = (0,0,-1)`, `fov = π/3`, `aspect = 16/10`, pixel `(x, y)` in a `640 × 400` viewport has direction from `generateRay(camera, (x+0.5)/640, (y+0.5)/400)`; its color is `lerp(bottom, top, clamp01(0.5 * (direction.y + 1)))` with `top = (0x66,0x4d,0xb3)` and `bottom = (0x0c,0x07,0x1f)`. Three canonical anchor values: up `(102,77,179)`, down `(12,7,31)`, horizon `(57,42,105)`.
- **S1-007 integration point.** The sphere-intersection slice will replace the background color for rays that hit the sphere; rays that miss must continue to resolve to `backgroundColorForDirection(ray.direction)` so the background remains visible on misses (S1-007 acceptance criterion).
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-005.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** G4 and G5 remain unpassed; this report records the human authorization but does not assert gate passage.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-006 section; status line now reflects authorization).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-008, TC-S1-009, TC-S1-011 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G5 row).
- Verification hook run: [umbra-verify-20260829T171211Z.md](hooks/umbra-verify-20260829T171211Z.md).
- Predecessor report: [UMBRA-S1-005 report](UMBRA-S1-005-camera-ray-generation.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).
