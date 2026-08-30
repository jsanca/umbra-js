# UMBRA-S1-009 — Declarative RenderRequest v0 — Report

## Status

Complete

## Objective

Expose the implemented fixed scene through the approved conceptual request boundary. Scope: `output`, `camera`, and `scene` request data; validation policy; request-to-core conversion. Non-goals: generic plugin scenes, arbitrary primitives, Canvas types in the contract, compatibility promises beyond v0, point lighting, materials beyond the current normal shading, additional primitives, UI controls.

Acceptance criteria (from [S1-009 in the slice plan](../tasks/umbra-sprint-1-slices.md)): valid equivalent requests are deterministic; invalid dimensions/camera/unsupported types follow documented outcomes; core remains DOM/Canvas-free.

Task contract: [S1-009 in the slice plan](../tasks/umbra-sprint-1-slices.md) and the [RenderRequest v0 API contract (conceptual)](../../knowledge/umbra-api-contract.md).
Verification strategy rows: [TC-S1-009 (determinism), TC-S1-010 (boundary/validation), TC-S1-015 (RenderRequest v0 validation)](../umbra-verification-strategy.md).

Authorization note: this slice was authorized by the **human Product Authority** as an explicit instruction (2026-08-30). S1-009 remains gated behind G7 (API architecture/boundary review); G7 and G8 are **not yet passed**.

## Summary

Introduced `RenderRequest v0` — the DOM/Canvas-free declarative input contract — as a pure-core module. The contract carries `output` (dimensions), `camera` (position, lookAt, optional up, vertical field of view), and `scene` (a single sphere and an optional background gradient). `validateRenderRequest(request)` is the single source of truth for request-shape errors and throws `RangeError` messages that name the failing field. `createRequestRenderGenerator(request)` validates, converts the request into core values (`createCamera`, `createSphere`, a `BackgroundGradient`), and returns a `PixelBufferGenerator` whose buffer dimensions are fixed by `request.output`. The composition root (`src/main.ts`) now wires the fixed scene through a `RenderRequest v0` instead of constructing camera and sphere directly; the visual output is byte-identical to the previous S1-008 render path.

ADR-002 is preserved. `render-request.ts` imports only pure-core siblings (`camera`, `background-gradient`, `sphere`, `sphere-renderer`, `pixel-buffer`, `vec3`, `smoke-generator` type-only). No DOM, Canvas, Vite, or UI symbol appears in the contract module.

The suite now reports **232 tests across 15 files** (199 from S1-008 + 33 new), typecheck is silent, the production bundle grows from 18 to 19 modules, and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/render-request.ts` — the declarative contract, the validator, and the request-to-core conversion. Exports the v0 types (`RenderRequestV0`, `OutputConfig`, `CameraConfig`, `SphereConfig`, `SceneConfig`, `Vec3Like`, `ColorLike`, `BackgroundGradientLike`), `validateRenderRequest(request: unknown)`, and `createRequestRenderGenerator(request: RenderRequestV0)`. The module header documents the shape, the validation policy, the dimension contract, and the evolution boundary (v0 is minimal; later features require an additive contract decision).
- `src/core/render-request.test.ts` — 33 tests covering: valid requests (with required fields only, with optional `camera.up`, with explicit background); top-level shape errors (non-object, missing `output`/`camera`/`scene`); invalid output dimensions (non-positive, non-integer, `NaN`, `Infinity`); invalid camera (non-finite position, `fieldOfView` at or beyond π, non-positive `fieldOfView`, `NaN` `fieldOfView`, malformed `up`); invalid scene sphere (non-positive radius, non-finite radius, non-finite center coordinate); invalid background colors (out-of-range channel, non-finite channel, missing top/bottom); the dimension contract (`createRequestRenderGenerator` produces buffers of the requested dims, throws on controller-dim mismatch); equivalence (byte-equal buffer to the direct sphere renderer for the fixed scene); per-pixel contract (hits → normal shading, misses → gradient); custom background override honored; runtime rejection of malformed inputs at `createRequestRenderGenerator`; boundary compliance (documented runtime export surface).

### Modified

- `src/main.ts` — composition root now constructs a `RenderRequestV0` describing the fixed scene (`output: 640×400`, `camera: position (0,0,0), lookAt (0,0,−1), fieldOfView π/3`, `scene: sphere (0,0,−3) r=1`) and passes `createRequestRenderGenerator(request)` as the controller's generator. The direct `createCamera` / `createSphere` construction is gone from `main.ts`; both now live behind the request conversion.

No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge curator's responsibility). The conceptual [API contract](../knowledge/umbra-api-contract.md) and the [architecture overview](../../knowledge/umbra-architecture-overview.md) remain planning artifacts; the curator can promote them once the G7 review is favorable.

## Semantics (recorded for S1-010 handoff)

- **`RenderRequestV0` shape.** Three top-level fields:
  - `output: { width: number, height: number }` — positive-integer pixel dimensions.
  - `camera: { position: Vec3Like, lookAt: Vec3Like, up?: Vec3Like, fieldOfView: number }` — pinhole config; vertical `fieldOfView` in radians, must be in the open interval `(0, π)`. The aspect ratio is **derived** from `output.width / output.height` (not a contract field), so callers do not duplicate the aspect ratio and cannot drift between dims and aspect.
  - `scene: { background?: BackgroundGradientLike, sphere: SphereConfig }` — a single sphere (`center: Vec3Like`, `radius: number > 0`); an optional `BackgroundGradientLike` with `top` and `bottom` `ColorLike`. `ColorLike` is `{ r, g, b }`; alpha is always fully opaque in v0 and the conversion fills `a = 0xff`.
- **Validation policy.** `validateRenderRequest(request: unknown)` is the single source of truth for request-shape errors. It throws `RangeError` with a message that names the failing field (`UMBRA: render request <field>: <reason>`), so callers can surface a precise reason. The conversion function calls the validator internally so callers do not have to.
- **Conversion.** `createRequestRenderGenerator(request)`:
  1. `validateRenderRequest(request)`.
  2. Convert the request to core values: `createCamera({ position, lookAt, up?, fov, aspect: width/height })`, `createSphere(center, radius)`, and either the default `DEFAULT_BACKGROUND_GRADIENT` or a `BackgroundGradient` built from the like-type (alpha filled to `0xff`).
  3. Delegate to `createSphereRenderGenerator(camera, sphere, { background })`.
  4. Return a `PixelBufferGenerator` that validates the controller's `(width, height)` arguments against `request.output` and throws `RangeError` on mismatch.
- **Determinism.** Two structurally equivalent requests produce byte-equal buffers (the conversion is deterministic; the underlying sphere renderer is deterministic). The byte-equality test in `src/core/render-request.test.ts` proves this for the fixed scene.
- **Boundary.** The contract module imports only pure-core siblings; type-only imports are stripped at compile time. No DOM, Canvas, Vite, or UI symbol is referenced. The module's runtime export surface is exactly `{ validateRenderRequest, createRequestRenderGenerator }` (asserted by `render-request.test.ts`).
- **Scope containment.** No point light, no material parameter, no second primitive, no mesh, no export. v0 is intentionally minimal; the slice plan stop condition ("contract expansion would add unimplemented material, mesh, export, or adapter-plugin behavior") gates future growth.

## Numeric tolerance and invalid-input policy

Per the evidence policy, tolerances and invalid-input behavior were defined before tests were written:

- **Dimensions** must be positive integers. Non-positive, non-integer, `NaN`, and `Infinity` values are rejected with a `RangeError` that names the failing field.
- **Camera field of view** must be a finite number in the open interval `(0, π)`. Out-of-range and non-finite values are rejected with a `RangeError`.
- **Camera position / lookAt / up** coordinates must be finite numbers; `NaN` and `Infinity` are rejected.
- **Sphere radius** must be a positive finite number; zero, negative, and non-finite values are rejected.
- **Background color channels** must be finite numbers in `[0, 255]`; out-of-range and non-finite values are rejected.
- **Controller-dim mismatch.** If the controller invokes the returned generator with `(width, height)` that do not match `request.output`, the generator throws `RangeError` — the request is the source of truth for output dimensions.
- **Equivalence.** The render path through `RenderRequest v0` is byte-equal to the direct sphere renderer for the same camera, sphere, and background (asserted by the "produces a byte-equal buffer to the direct sphere renderer for the fixed scene" test).
- **Per-pixel determinism.** Each pixel of the request-rendered buffer matches the documented contract: hits render `normalToRgbaColor(computeSphereNormal(hit))`, misses render `backgroundColorForDirection(ray.direction)`.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 15 passed (15) / Tests 232 passed (232)`. The new file runs in the `core` (node) project.
- `npx vitest run src/core/render-request.test.ts` → 33 passed.
- `npm run build` → `✓ 19 modules transformed.` exit 0 (bundle now includes `render-request`; previously 18 modules).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260830T170726Z.md`.
- `npm audit signatures` → 56/56 verified, 25 with attestations (no new packages added).
- `npm audit` → 0 vulnerabilities.

### Core boundary inspection (TC-S1-005 continuity + G7 boundary-review prep)

Imports in `src/core/` after this slice:

| File | Imports |
| --- | --- |
| `vec3.ts` | none (language types only) |
| `ray.ts` | `./vec3.js` only |
| `pixel-buffer.ts` | none |
| `smoke-generator.ts` | `./pixel-buffer.js` only |
| `camera.ts` | `./vec3.js`, `./ray.js` only |
| `background-gradient.ts` | `./pixel-buffer.js`, `./camera.js`, `./vec3.js`, `./smoke-generator.js` (type-only) |
| `sphere.ts` | `./vec3.js`, `./ray.js` only |
| `normal.ts` | `./vec3.js`, `./sphere.js`, `./pixel-buffer.js` (type-only) |
| `sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./normal.js`, `./sphere.js`, `./smoke-generator.js` (type-only) |
| `render-request.ts` | `./camera.js`, `./background-gradient.js`, `./pixel-buffer.js`, `./sphere-renderer.js`, `./sphere.js`, `./smoke-generator.js` (type-only), `./vec3.js` |

No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

### ADR-002 boundary check

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/*` | internal core only | — | Compliant: `render-request.ts` adds the six pure-core siblings listed above (one type-only) |
| `src/diagnostics/*` | none | — | Compliant (unchanged) |
| `src/canvas/*` | `../core/pixel-buffer.js` | allowed | Compliant (unchanged) |
| `src/controller/*` | core + canvas + diagnostics | allowed | Compliant (unchanged; still generator-agnostic) |
| `src/ui/shell.ts` | none | — | Compliant (unchanged) |
| `src/main.ts` | shell + controller + core | composition root | Compliant (now constructs `RenderRequest v0` and passes the request-derived generator) |

## Validation

### TC-S1-009 / TC-S1-010 / TC-S1-015

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 15 passed (15) / Tests 232 passed (232)` |
| `npm run build` | 0 | `✓ 19 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |
| `npx vitest run src/core/render-request.test.ts` | 0 | 33 passed |

The new render-request tests break down as:

| Group | Count | What it asserts |
| --- | --- | --- |
| Valid requests | 3 | Required-only request; optional `camera.up`; explicit background |
| Top-level shape | 5 | `null`/primitive rejected; missing `output`/`camera`/`scene` rejected |
| Output dimensions | 4 | Non-positive width; non-integer width; `NaN` height; `Infinity` width |
| Camera | 5 | Non-finite position; `fieldOfView` at π; non-positive `fieldOfView`; `NaN` `fieldOfView`; malformed `up` |
| Scene sphere | 3 | Non-positive radius; non-finite radius; non-finite center coordinate |
| Background colors | 3 | Out-of-range channel; non-finite channel; missing top/bottom |
| Dimension contract | 3 | Buffer of requested dims; throws on dim mismatch (both dims, height-only) |
| Equivalence | 3 | Byte-equal buffer to the direct sphere renderer for the fixed scene; per-pixel contract holds; custom background honored |
| Runtime rejection | 3 | `createRequestRenderGenerator` rejects malformed inputs at runtime (non-positive dims, `NaN` position, negative radius) |
| Boundary compliance | 1 | Runtime export surface is exactly `{ validateRenderRequest, createRequestRenderGenerator }` |

### Forbidden tech — confirmed absent

ADR-001 and the [Sprint 1 product brief](../../product/SPRINT-1-PRODUCT-BRIEF.md) forbid Three.js, WebGL/WebGPU, UI frameworks, external math libraries, rendering engines, BVH, path tracing, meshes, textures, post-processing, Web Workers, scene editors, settings, and export. None of these appear. The slice's explicit non-goals (point lighting, materials beyond current normal shading, additional primitives, UI controls, Canvas types in the contract, generic plugin scenes, compatibility promises beyond v0) are confirmed absent: no light / material / reflectance / mesh / export module exists or is imported; `render-request.ts` carries no DOM/Canvas/Vite/UI types.

## Limitations

- **No lights in v0.** The contract defines `scene.sphere` but not lights. S1-010 (point light + diffuse shading) will add a `scene.light` (or equivalent) field via an additive contract decision; until then, `scene` carries the single sphere only. The slice plan stop condition means this is intentional.
- **Aspect is derived, not declared.** `camera.aspect` is computed from `output.width / output.height`.` Callers cannot override the aspect ratio independently of the dims. This is the deliberate choice that keeps the contract minimal and prevents drift; if a future slice needs a non-uniform-pixel aspect, it adds an explicit field via an additive decision.
- **Alpha is implicit.** `ColorLike` is `{ r, g, b }`; the conversion fills `a = 0xff`. v0 is opaque-only. A future additive decision can expose alpha if a translucent background or material is needed.
- **No runtime evolution guard.** v0 does not reject unknown top-level or nested fields; forward compatibility is the caller's responsibility until an additive contract decision is approved. The contract documents this.
- **No screenshot in this automated environment.** Producing one requires browser automation, and the repo intentionally carries no browser-automation dependency. A human may capture the running app via `npm run dev` for the G7 visual record; the byte-equality test proves the request path produces the same buffer as the previous direct path.
- **`PixelBufferGenerator` type placement unchanged.** The G6-3 carry-forward remains open; the type is still defined in `smoke-generator.ts` and now also imported (type-only) by `render-request.ts`. The carry-forward is documented but not addressed here.

## Handoff (to G7 reviewers and S1-010)

- **Contract API.** `RenderRequestV0`, `OutputConfig`, `CameraConfig`, `SceneConfig`, `SphereConfig`, `Vec3Like`, `ColorLike`, `BackgroundGradientLike` (all types). Runtime: `validateRenderRequest(request: unknown)` and `createRequestRenderGenerator(request: RenderRequestV0)`. All in `src/core/render-request.ts`.
- **Conversion path.** `createRequestRenderGenerator` validates, then composes `createCamera` + `createSphere` + `createSphereRenderGenerator` with the request's `output.width / output.height` as the aspect ratio and the request's output dims as the buffer contract.
- **Equivalence.** The fixed-scene render produced through `RenderRequest v0` is byte-equal to the direct sphere renderer for the same camera, sphere, and background (asserted by `render-request.test.ts`).
- **Boundary.** `render-request.ts` is DOM/Canvas-free; its runtime export surface is exactly two functions (asserted by a test).
- **S1-010 integration point.** S1-010 (point light + diffuse shading) will introduce a `scene.light` field via an additive contract decision. The existing `scene.sphere` and `scene.background` continue to work unchanged; the new field is optional. The normal-based shading introduced in S1-008 is replaced by a Lambertian (or equivalent) reflectance term using the new light.
- **No unapproved dependencies were added.** `package.json` and `package-lock.json` are unchanged from S1-008.
- **No `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were modified.** G7 and G8 remain unpassed; this report records the human authorization but does not assert gate passage. The conceptual [API contract](../knowledge/umbra-api-contract.md) and [architecture overview](../../knowledge/umbra-architecture-overview.md) are now proven facts and are candidates for promotion by the knowledge curator after G7.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-009 section; status line now reflects authorization).
- Conceptual API contract: [RenderRequest v0 API contract](../../knowledge/umbra-api-contract.md).
- Architecture overview: [Sprint 1 architecture overview](../../knowledge/umbra-architecture-overview.md) (Scene input adapter now realized as `createRequestRenderGenerator`).
- Roadmap: [Sprint 1 roadmap](../../roadmap/umbra-sprint-1-roadmap.md).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-009, TC-S1-010, TC-S1-015 rows).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G7 row).
- Predecessor reviews: [G4 camera review](../reviews/UMBRA-S1-005-g4-camera-review.md), [G5 background-gradient review](../reviews/UMBRA-S1-006-g5-background-gradient-review.md), [G6 sphere-intersection review](../reviews/UMBRA-S1-007-g6-sphere-intersection-review.md), [S1-008 normal-shading review](../reviews/UMBRA-S1-008-normal-based-shading-review.md).
- Verification hook run: [umbra-verify-20260830T170726Z.md](hooks/umbra-verify-20260830T170726Z.md).
- Predecessor reports: [UMBRA-S1-005 report](UMBRA-S1-005-camera-ray-generation.md), [UMBRA-S1-006 report](UMBRA-S1-006-background-gradient-render.md), [UMBRA-S1-007 report](UMBRA-S1-007-sphere-intersection.md), [UMBRA-S1-008 report](UMBRA-S1-008-normal-based-shading.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).