# UMBRA-S1-007 — G6 Sphere-Intersection Adversarial Review

Status: Approved (with observations)
Date: 2026-08-29
Verdict: PASS WITH OBSERVATIONS
Decision owners: Engineering Reviewer (`osk-adversarial-analysis`), QA Engineer (`osk-verification-engineering`), with `osk-boundary-review` supporting the ADR-002 check
Review task: `UMBRA-REVIEW-004` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-004—G6SphereIntersectionAdversarialReview.md`)
Scope: S1-007 (sphere intersection + hit/miss render) only. Normals, lighting, materials, shadows, `RenderRequest v0`, and UI controls are out of scope except to confirm they were not introduced.

## Decision

S1-007 satisfies its slice scope and the G6 gate ("edge cases covered; no unresolved material math risk"). The ray–sphere quadratic, discriminant classification, and nearest-valid-root policy are correct; I re-derived every documented case independently and the results match the code and tests exactly. Edge cases — miss (`D < 0`), sphere behind the origin, tangent (`D = 0`), inside the sphere, nearest-of-two-roots, and non-unit direction — each have a dedicated test, and the render path is proven deterministic and generator-agnostic with the background gradient preserved on misses. ADR-002 holds: the new core modules import only pure-core siblings and a type-only import, and no DOM/Canvas/Vite/UI symbol appears in `src/core/`.

One validation gap (G6-1, MINOR): `intersectSphere` silently returns `null` for a zero-length ray direction, despite its header claiming correctness "for any non-zero direction" without enforcing that precondition. This is a defensive-robustness gap, not a material math error — the S1-007 pipeline (`generateRay`) never emits a zero direction — so it does not block.

## Reviewed claim / target

S1-007 claims that `intersectSphere(sphere, ray)` correctly classifies ray–sphere intersection (miss / tangent / hit / inside / behind) and returns the nearest valid non-negative hit, and that `createSphereRenderGenerator(camera, sphere)` deterministically writes the hit color on hits and `backgroundColorForDirection` on misses, preserving ADR-002.

## Focus answers (review question A.1 + inferred scope)

The review task file is truncated (it ends mid-list during "A. Intersection math" question 1 and contains no "Required evidence" or "Output" sections — see Limitations). The following answers cover the documented S1-007 contract and the G6 gate criteria, following the structure of the G4/G5 reviews.

1. **Ray–sphere quadratic** — Correct. `a = dot(d,d)`, `b = 2·dot(d, oc)`, `c = dot(oc,oc) − r²`, `D = b² − 4ac`. Re-derived for every documented case (below) and confirmed against `src/core/sphere.ts`.
2. **Root policy** — Correct and documented. `t0 ≤ t1`; `t0 ≥ 0 → t0`; else `t1 ≥ 0 → t1` (origin inside); else `null` (behind).
3. **Discriminant boundary** — `D < 0` miss, `D = 0` tangent, `D > 0` two roots; tangent uses exact `D = 0`, no epsilon.
4. **Hit point** — `pointAtRay(ray, t)`; tested to equal `origin + t·direction`, including for a non-unit direction.
5. **Render contract** — Hit → constant hit color; miss → background gradient; proven by per-pixel re-derivation in the unit and controller integration tests.
6. **Boundary** — Clean; no drift into normals/lighting/materials/anti-aliasing (one ray per pixel, constant hit color).

## Adversarial analysis

### Assumptions identified

| Assumption | Evidence | Why it matters | Confidence |
| --- | --- | --- | --- |
| Direction is non-zero | `sphere.ts` header: "correct for any non-zero direction" | `a = dot(d,d) = 0` makes the quadratic degenerate (`t = ±…/0`) | Verified as unenforced (G6-1) |
| Direction is unit-length | `generateRay` normalizes; S1-004 `createRay` stores verbatim | `a ≠ 1` changes the root formula; the full `a` must be used | Verified correct (non-unit test) |
| Radius is finite and small enough that `r²` stays finite | `createSphere` checks finite radius, not `r²` | `r²` overflow → `c = −Infinity` | Plausible but unverified (non-material) |
| Floating-point `D ≈ 0` grazing is acceptable | Report "Limitations" | Near-tangent may flip miss↔hit | Documented; accepted for Sprint 1 |

### Counterexamples

| Counterexample | Target assumption | Expected failure | Verification status |
| --- | --- | --- | --- |
| Zero direction `(0,0,0)` | non-zero direction | `a=0` → `0/0` internally → silent `null` (miss), even when the "ray" is a point on the surface | Plausible, verified by code path (`a=0, b=0, D=0 → t0=t1=NaN → null`); no test covers it |
| Direction length 2 `(0,0,−2)` | unit direction | wrong `t` if `a` were assumed 1 | Covered; test asserts `t = 1` |
| Origin exactly on the sphere surface, tangent | tangent `D=0` | should hit at `t = 0` | Covered; test asserts `t === 0` with `+0` normalization |
| Origin inside the sphere | nearest valid root | must return exit root `t1`, not `t0 < 0` | Covered; test asserts `t = 1` |
| Both roots behind origin | miss | must return `null` | Covered; test asserts `null` |
| Huge radius `1e6` | finite radius | all pixels hit | Covered; test asserts all-hit |

### Failure modes

| Failure mode | Trigger | Impact | Existing coverage | Gap |
| --- | --- | --- | --- | --- |
| Silent degenerate-ray miss | `createRay(origin, (0,0,0))` fed to `intersectSphere` | A degenerate ray is reported as "miss" with no error, potentially masking an upstream bug | None | No guard / no test for `a === 0` |
| `r²` overflow | `radius > ~1e154` | `c` becomes `−Infinity`, `D`/`t` lose meaning | None | `createSphere` validates finite radius but not `r²` |
| Grazing flip | true `D ≈ 0` under rounding | near-tangent ray flips miss↔tangent | None | Documented as accepted; no epsilon |

### Invariants challenged

- **"A hit's `t` is non-negative and `point === pointAtRay(ray, t)`"** — holds for every covered case, including the `+0` normalization for exact-tangent `t = 0`.
- **"Misses resolve to the documented background gradient"** — holds; the renderer calls `backgroundColorForDirection(ray.direction)` on miss, verified per-pixel.

### Validation gaps

- No test exercises a zero-length direction (the only degenerate input `createRay` can produce that breaks the quadratic's `a`).
- No test exercises a radius large enough to overflow `r²` (non-material, note only).

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| G6-1 | MINOR | Validation gap | `intersectSphere` has no guard for a zero-length direction. `a = dot(d,d) = 0` yields `b = 0`, `D = 0`, and `t0 = t1 = (−0)/0 = NaN`, which falls through the `>= 0` checks to `null` — a silent "miss" for a degenerate ray, even if the ray's origin lies exactly on the sphere surface. The header states "correct for any non-zero direction" but does not enforce it. Recommend: document the degenerate-direction policy (return `null`) or throw a `RangeError` (consistent with `createSphere`/`createCamera`), and add a test. | `src/core/sphere.ts:81-100`; contrast `src/core/sphere.ts:63-79` (factory validates inputs) |
| G6-2 | NOTE | Report accuracy | The S1-007 report states `sphere-renderer.test.ts` has "7 tests" / "7 passed"; the actual count is 8 (1 default-color + 1 dimensions + 3 hit/miss + 3 determinism/options). The totals are otherwise correct (155 + 13 + 8 + 2 = 178). | S1-007 report "Files Changed"/"Evidence"/"Validation" vs `src/core/sphere-renderer.test.ts` (8 `it` blocks) |
| G6-3 | NOTE | Cohesion (carried from G5-1) | The shared `PixelBufferGenerator` type still lives in `smoke-generator.ts` and is now imported by three modules (`sphere-renderer`, `background-gradient`, `render-controller`). The cohesion concern compounds; move it to a neutral core module in a later slice. | `src/core/smoke-generator.ts:16`; `src/core/sphere-renderer.ts:37`, `src/core/background-gradient.ts:38`, `src/controller/render-controller.ts:18` |
| G6-4 | NOTE | Known limitation (documented) | No discriminant epsilon; near-tangent rays with true `D ≈ 0` may flip miss↔tangent under floating-point noise. Already documented in the S1-007 report and acceptable for Sprint 1. | S1-007 report "Limitations"; `src/core/sphere.ts:42-44` |
| G6-5 | — (pass) | Math correctness | Quadratic, discriminant, and nearest-valid-root policy independently re-derived and confirmed for all documented cases (miss, behind, tangent, entry, nearest, inside, non-unit). | `src/core/sphere.ts:81-106`, `src/core/sphere.test.ts:30-127` |
| G6-6 | — (pass) | Boundary / scope | Core stays DOM/Canvas/Vite/UI-free; controller unchanged and generator-agnostic; `main.ts` wires the fixed sphere; no normals/lighting/materials/anti-aliasing drift (constant hit color, one ray per pixel). | `src/core/sphere-renderer.ts` imports; `src/main.ts`; `src/controller/render-controller.ts` |

## Boundary matrix

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/sphere.ts` | `./vec3.js`, `./ray.js` | internal core | Compliant |
| `src/core/sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./sphere.js`, `./smoke-generator.js` (type-only) | internal core | Compliant |
| `src/controller/render-controller.ts` | `../core/*`, `../canvas/*`, `../diagnostics/*` | allowed (sole dual-dependency module) | Compliant: unchanged |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, `./core/*`, CSS | composition root | Compliant |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports |

## Evidence summary (reviewer-reproduced, 2026-08-29)

- `npm run typecheck` → silent, exit 0 (both tsconfigs).
- `npm run test:run` → `Test Files 13 passed (13) / Tests 178 passed (178)`.
- `npx vitest run src/core/sphere.test.ts` → `13 passed`.
- `npx vitest run src/core/sphere-renderer.test.ts` → `8 passed` (report states 7 — see G6-2).
- `npm run verify` → PASS (audit-signatures 56/56, audit 0 vulns, typecheck, 178 tests, build `✓ 17 modules transformed`), recorded at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T183605Z.md` (commit `98af674`).
- Import inspection confirms the boundary matrix; no DOM/Canvas/Vite/UI symbols in `src/core/`.
- Screenshot present: `UMBRA-S1-007-sphere-render.png` (`3328 × 1694`, full-page capture). This reviewer cannot decode image pixels, so visual confirmation of the "amber sphere on violet gradient" relies on the deterministic per-pixel assertions above; the screenshot is the human-visible record.
- Sphere math re-derived by hand against `src/core/sphere.ts`; every documented case matches exactly (see Counterexamples table).

## Required fixes before S1-008

None that block. No BLOCKER or MAJOR findings.

Recommended follow-up (non-blocking): address G6-1 by adding an explicit degenerate-direction guard (or documenting `null` for `a === 0`) plus a test. G6-2 and G6-3 are documentation/cohesion cleanups for a later slice.

## Authorization recommendation

**G6 passes.** S1-007 sphere intersection is approved: edge cases are covered, the root policy is documented and deterministic, and no material math risk remains. This does **not** authorize S1-008 — per the review task, S1-008 requires its own gate (G6 covers S1-007/S1-008 jointly in the gates table, but the task states "Do not authorize S1-008"; authorization follows the explicit S1-008 gate/review). S1-007's completion is confirmed; S1-008 remains not authorized by this review.

## Limitations

- The `UMBRA-REVIEW-004` task file is **truncated** (76 lines; ends mid-way through "A. Intersection math" question 1 and omits the "Required evidence" and "Output" sections). This review inferred the standard review structure and output requirements from the G4/G5 tasks and the review-gates table.
- The sphere-render screenshot could not be decoded pixel-by-pixel in this review environment; visual correctness is established by the deterministic exact-channel assertions, with the screenshot as the human-visible supplement.

## References

- [S1-007 implementation report](../reports/UMBRA-S1-007-sphere-intersection.md)
- [S1-006 report](../reports/UMBRA-S1-006-background-gradient-render.md)
- [G4 camera review](UMBRA-S1-005-g4-camera-review.md), [G5 background-gradient review](UMBRA-S1-006-g5-background-gradient-review.md)
- [Verification hook run (PASS)](../reports/hooks/umbra-verify-20260829T183605Z.md)
- [Review gates](umbra-review-gates.md) (G6 row)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Review task](../tasks/review/UMBRA-REVIEW-004—G6SphereIntersectionAdversarialReview.md)
- Screenshot: `evidence/UMBRA-S1-007-sphere-render.png`
- Reviewed sources: `src/core/sphere.ts`, `src/core/sphere.test.ts`, `src/core/sphere-renderer.ts`, `src/core/sphere-renderer.test.ts`, `src/controller/render-controller.test.ts`, `src/main.ts`
