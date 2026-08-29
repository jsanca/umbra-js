# UMBRA-S1-005 — Camera-Ray Generation — Report

## Status

Complete

## Objective

Generate deterministic rays for documented viewport coordinates. Scope: camera configuration (position, look-at, world up, vertical FOV, aspect ratio), field-of-view convention, look-at semantics, and pure-core tests for center and corner rays plus documented degenerate inputs. Non-goals: rendering loop, geometry, Canvas, and UI camera controls.

Acceptance criteria (from [S1-005 in the slice plan](../tasks/umbra-sprint-1-slices.md)): center and selected corner rays match documented expected directions within tolerance; degenerate camera behavior is defined.

Task contract: [S1-005 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy row: [TC-S1-014 (camera rays, pure unit)](../umbra-verification-strategy.md).

## Summary

Added the camera and camera-ray generation to the pure rendering core. The `Camera` value is a fully-resolved immutable record: the user-supplied inputs (`position`, `lookAt`, `up`, `fov`, `aspect`) plus the computed basis (`forward`, `right`, `trueUp`, `halfWidth`, `halfHeight`). `generateRay(camera, u, v)` produces a unit-direction `Ray` for the requested viewport sample using screen convention (`u = 0` left, `u = 1` right; `v = 0` top, `v = 1` bottom). The math is the standard pinhole model: viewport at camera-local `z = -1`, vertical FOV in radians, horizontal extent derived from `aspect`.

ADR-002 is preserved end-to-end. The camera module imports only `Vec3` and `Ray` from sibling core modules and is `node`-clean. The S1-004 semantics — `Vec3` immutability, `VEC3_EPSILON = 1e-6` tolerance, `normalizeVec3(VEC3_ZERO) === VEC3_ZERO` zero policy, and `createRay` storing the caller's direction verbatim — are honored: the returned `Ray` carries a unit direction (computed by `generateRay`), and the input-validation `RangeError`s are produced before any `normalizeVec3` zero-policy fallback would matter.

The suite now reports **137 tests across 10 files** (94 from S1-004 + 43 new), typecheck is silent, the production build is unchanged (the camera module is not yet imported by the app entry — correct for this slice's non-goals), and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/camera.ts` — `CameraConfig` and `Camera` value types; `VEC3_UP`, `VIEWPORT_CENTER`, and `VIEWPORT_SAMPLES` documented sample constants; `createCamera(config)` validating factory; `generateRay(camera, u, v)` producing a unit-direction `Ray`; `pointAtCameraSample(camera, u, v, t)` and `isInViewport(u, v)` helpers for downstream slices. Re-exports `createVec3` so downstream slices can construct sample vectors without re-importing `vec3.js`. The full set of semantics, the math, the screen convention, and the degenerate-input policy are documented in the module header (see "Semantics" below).
- `src/core/camera.test.ts` — 43 tests covering: documented `VEC3_UP`/`VIEWPORT_CENTER`/`VIEWPORT_SAMPLES` constants; `createCamera` validation (fov range, aspect, position==lookAt, forward parallel to up); computed basis matches expected orthonormal frame for the sample camera; basis orthonormality (dot products within `VEC3_EPSILON`); translated camera invariance; center ray contract (`generateRay(c, 0.5, 0.5).direction === camera.forward`); four corner-ray contracts against the closed-form expression `(±halfW, ±halfH, −1) / |...|` with the sample camera's documented values; corner-ray numeric example `(-0.6246950476, 0.3904344047, -0.6762522260)`; horizontal/vertical mirror symmetry; per-edge sign checks (top y>0, bottom y<0, left x<0, right x>0); non-finite input rejection; off-screen samples accepted without error; `pointAtCameraSample` parity with `pointAtRay(generateRay(...), t)`; `isInViewport` boundary conditions; deterministic ray generation for repeated samples; no-NaN guarantee over a 5×5 grid; translated-camera ray contract; custom-up camera with the basis computed explicitly in the test comments.

No existing files were modified. No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility; the camera semantics are recorded here for the S1-006 handoff and will be promoted when the curator runs).

## Semantics (recorded for S1-006 handoff)

These are the exact, documented semantics S1-006 (background gradient) and later slices must rely on:

- **Vertical field of view.** `fov` is the *vertical* field of view in radians. The horizontal extent is `aspect * tan(fov / 2)`. This is the conventional "vertical FOV" used by most pinhole-camera formulations; future slices that need a horizontal FOV must convert.
- **Aspect ratio.** `aspect = width / height`, positive finite. The Sprint 1 viewport is `640 × 400`, so the default sample aspect is `1.6`.
- **Viewport convention.** `(u, v)` use screen coordinates with `u, v ∈ [0, 1]`: `u = 0` is the left edge, `u = 1` is the right edge, `v = 0` is the top edge, `v = 1` is the bottom edge. The center is `(0.5, 0.5)`. The NDC transform is `ndcX = 2u − 1`, `ndcY = 1 − 2v` (so `v = 0 → ndcY = +1`, `v = 1 → ndcY = −1`).
- **Pinhole model.** The viewport is a unit-distance plane in front of the camera (camera-local `z = -1`). A pinhole camera at the eye position generates one ray per `(u, v)` pixel.
- **World basis.** With `f = normalize(lookAt - position)`, the right vector is `r = normalize(cross(f, up))` and the re-orthogonalized up vector is `t = normalize(cross(r, f))`. `up` defaults to `VEC3_UP = (0, 1, 0)`. The returned `Camera` exposes `forward`, `right`, `trueUp` as precomputed unit vectors.
- **Camera ray direction.** For a pixel at `(u, v)`:
    ```
    dir = normalize(ndcX * halfWidth  * r
                  + ndcY * halfHeight * t
                  + f)
    ```
  where `halfWidth = aspect * tan(fov / 2)` and `halfHeight = tan(fov / 2)`. The returned `Ray.origin` is `camera.position`; the returned `Ray.direction` is unit-length.
- **Center ray contract.** `generateRay(camera, 0.5, 0.5).direction` equals `camera.forward`. This is the canonical TC-S1-014 test value.
- **Corner ray contract.** For the documented sample camera (`position = (0,0,0)`, `lookAt = (0,0,-1)`, `fov = π/3`, `aspect = 16/10`):
    - `halfHeight = tan(π/6) ≈ 0.5773502692`
    - `halfWidth = 1.6 * tan(π/6) ≈ 0.9237604307`
    - `topLeft = normalize((-halfW, +halfH, -1)) ≈ (-0.6247, 0.3905, -0.6762)`
    - `topRight = normalize((+halfW, +halfH, -1)) ≈ (+0.6247, 0.3905, -0.6762)`
    - `bottomLeft = normalize((-halfW, -halfH, -1)) ≈ (-0.6247, -0.3905, -0.6762)`
    - `bottomRight = normalize((+halfW, -halfH, -1)) ≈ (+0.6247, -0.3905, -0.6762)`
- **Degenerate-input policy.** `createCamera` throws `RangeError` for:
    - `fov` outside `(0, π)` — message `UMBRA: camera fov must be in (0, π) radians, received <value>`
    - non-positive or non-finite `aspect` — message `UMBRA: camera aspect must be a positive finite number, received <value>`
    - `position === lookAt` — message `UMBRA: camera position equals lookAt; forward direction is undefined`
    - forward parallel to up — message `UMBRA: camera forward is parallel to up; right direction is undefined`
    - basis collapse (defense-in-depth) — message `UMBRA: camera basis collapsed; trueUp direction is undefined`
  The errors fire *before* any `normalizeVec3` zero-policy fallback would matter (per S1-004), so the caller always sees the precise degenerate cause.
- **Off-screen samples.** Values outside `[0, 1]` are accepted and produce well-defined off-screen rays (the math is identical to in-screen sampling). `isInViewport(u, v)` is provided for callers that want to gate or clip.
- **Determinism.** The same `Camera` and `(u, v)` always produce the same `Ray`. The 5×5 grid no-NaN sweep + repeated-center equality test asserts this.

## Numeric tolerance

- Vector equality uses `VEC3_EPSILON = 1e-6` (S1-004 default).
- Direction magnitude is asserted with `toBeCloseTo(..., 6)` for six-decimal place equality.
- The corner-ray numeric example `(-0.6246950476, 0.3904344047, -0.6762522260)` matches the closed-form direction to the documented precision.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 10 passed (10) / Tests 137 passed (137)`; the new file runs in the `core` (node) project.
- `npx vitest run src/core/camera.test.ts` → `Test Files 1 passed (1) / Tests 43 passed (43)`.
- `npm run build` → `vite v8.2.2 ... ✓ 11 modules transformed.` exit 0 (bundle unchanged — the camera module is not yet imported by the app entry, which is correct for S1-005's non-goals).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260828T234221Z.md`.
- `npm audit signatures` → 56/56 verified, 25 with attestations (G1 Observation 1 still satisfied; no new packages added).
- `npm audit` → 0 vulnerabilities.

### Core boundary inspection (TC-S1-005 + G3 follow-through)

Imports in `src/core/` after this slice:

| File | Imports |
| --- | --- |
| `vec3.ts` | none (language types only) |
| `ray.ts` | `./vec3.js` only |
| `pixel-buffer.ts` | none |
| `smoke-generator.ts` | `./pixel-buffer.js` only |
| `camera.ts` | `./vec3.js`, `./ray.js` only |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: no DOM/Canvas/Vite/UI imports; `camera.ts` adds `vec3`+`ray` only |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; not yet wired to camera) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller | composition root | Compliant (unchanged) |

## Validation

### TC-S1-014 — Camera center/corner rays and degenerate inputs

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 10 passed (10) / Tests 137 passed (137)` |
| `npm run build` | 0 | `✓ 11 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/camera.test.ts` | 0 | `43 passed (43)` |

The new camera tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Constants | 2 | `VEC3_UP = (0,1,0)`, `VIEWPORT_CENTER = (0.5, 0.5)` |
| `createCamera` validation | 5 | fov ∈ (0, π), positive finite aspect, position≠lookAt, forward ∦ up |
| Computed basis | 7 | basis matches the expected orthonormal frame; orthonormality (dot products ≈ 0, lengths ≈ 1); default + custom `up`; documented `halfWidth`/`halfHeight`; translated-camera invariance; input config preserved verbatim |
| Center ray | 3 | `direction = forward`; `origin = camera.position`; unit-length direction |
| Corner rays | 6 | each of TL/TR/BL/BR against the closed-form `(±halfW, ±halfH, −1) / |...|`; all four unit-length; numeric example for TL |
| Symmetry / convention | 6 | horizontal/vertical mirror symmetry; per-edge sign checks (top/bottom/left/right) |
| Input validation | 3 | non-finite `u` / `v` rejected; off-screen samples accepted without error |
| `pointAtCameraSample` | 3 | parity with `pointAtRay(generateRay(...), t)` at `t = 0, 1, 5` |
| `isInViewport` | 2 | in/out of `[0, 1] × [0, 1]` |
| Integration with S1-004 | 3 | origin-identity, determinism, no-NaN over 5×5 grid |
| Translated camera | 2 | `(0,0,5) → origin` gives same center direction, translated origin; `t = 5` at center lands at origin |
| Custom up | 1 | `(0,5,0) → origin` with `up = (0,0,−1)` basis computed and asserted explicitly |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear in `package.json`, `tsconfig.app.json`, `tsconfig.node.json`, or anywhere in `src/`. The slice's explicit non-goals (rendering loop, geometry, Canvas, UI camera controls) are also confirmed absent: `camera.ts` imports only `vec3` and `ray`; no controller/Canvas/UI change was made.

## Limitations

- **The camera is not yet wired into the render path.** S1-005 is deliberately pure-core: no controller, Canvas, or UI integration. The S1-003 smoke generator (`src/core/smoke-generator.ts`) remains the default generator for the controller; S1-006 will introduce the background-gradient generator and integrate the camera.
- **`fov` is documented as vertical.** This is the conventional choice but should be called out explicitly so future slices do not assume a horizontal FOV. If a later slice needs horizontal FOV, it must convert: `fov_horizontal = 2 * atan(aspect * tan(fov_vertical / 2))`.
- **No lazy re-computation of the basis.** The basis is computed once in `createCamera` and exposed on the `Camera` value. `generateRay` reads `halfWidth`/`halfHeight`/`forward`/`right`/`trueUp` from the `Camera`; it does not re-derive them. Future slices that need a different basis (e.g., for a moving camera) must build a new `Camera` per frame.
- **Off-screen samples produce off-screen rays** (documented), not clamped. This is the deliberate design — clamping would silently bias corner pixels and was rejected as a non-goal. `isInViewport` is provided for callers that want to gate.
- **No `Camera → RGBA` mapping yet.** Color/lighting remains out of scope until S1-008/S1-010; the camera only generates geometric rays.
- **`VEC3_EPSILON = 1e-6` continues to be the default.** Sufficient for camera-ray direction equality; if S1-007's root-selection needs a tighter tolerance, that decision belongs to that slice and its review.

## Open Follow-Up

- **S1-006 handoff:** the camera contract is published. S1-006 (background gradient) consumes `generateRay(camera, u, v)` to produce one ray per pixel. The recommended sample camera for S1-006 is the documented `position = (0,0,0)`, `lookAt = (0,0,-1)`, `fov = π/3`, `aspect = 16/10` configuration — its center/corner ray directions are listed in "Semantics" above and asserted by `src/core/camera.test.ts`. S1-006 may define its own background gradient function `pixelColor(camera, u, v) → RgbaColor` or the equivalent; the camera returns `Ray` objects whose `direction` is the deterministic viewport-coordinate input.
- **Re-export from a public core barrel only if a later slice finds the per-module imports awkward**; none is needed now.
- **Knowledge-curator:** the camera semantics above are now proven facts and are candidates for a `docs/knowledge/` page when the curator runs. The current `umbra-domain-model.md` lists `Camera` as a conceptual entity; that page can be promoted from "Conceptual" to "Implemented" once the curator runs.

## Handoff (to G4 reviewers)

- **Camera API:** `createCamera(config) → Camera`, `generateRay(camera, u, v) → Ray`. Both live in `src/core/camera.ts`. The returned `Camera` exposes the inputs plus the computed basis (`forward`, `right`, `trueUp`, `halfWidth`, `halfHeight`) so later slices can use the basis directly.
- **Math convention:** vertical FOV, screen `(u, v)` convention, pinhole viewport at camera-local `z = -1`. Documented in the module header and asserted by 43 tests.
- **Sample coordinates for downstream slices:** `VIEWPORT_SAMPLES` exports the documented `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `center`, `upperThird`, `lowerThird` coordinates.
- **Numeric tolerance:** `VEC3_EPSILON = 1e-6` (S1-004 default).
- **Degenerate-input policy:** documented `RangeError`s for invalid fov, invalid aspect, `position === lookAt`, and `forward ∥ up`. Each error message names the failure so callers can surface a precise reason.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-004.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** The architecture overview remains a planning artifact; the domain model and API contract describe the camera as a conceptual entity — the curator can promote them when the G4 review is favorable.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-005 section; status line now reflects authorization).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-014 row).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G4 row).
- Verification hook run: [umbra-verify-20260828T234221Z.md](hooks/umbra-verify-20260828T234221Z.md).
- Predecessor reports: [UMBRA-S1-003 report](UMBRA-S1-003-canvas-viewport-and-pixel-writer.md), [UMBRA-S1-004 report](UMBRA-S1-004-vec3-and-ray-primitives.md).
- Predecessor reviews: [G2 approval (S1-002 + S1-003)](../reviews/UMBRA-S1-002-g2-approval.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).