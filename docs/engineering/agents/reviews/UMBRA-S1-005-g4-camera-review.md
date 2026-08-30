# UMBRA-S1-005 — G4 Camera Architecture Review

Status: Approved (with observations)
Date: 2026-08-29
Verdict: PASS WITH OBSERVATIONS
Decision owner: Engineering Reviewer (`osk-architecture-review`), with `osk-boundary-review` and `osk-verification-engineering` as supporting evidence
Review task: `UMBRA-REVIEW-002` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-002-g4-camera-review.md`)
Scope: S1-005 (camera-ray generation) only. S1-006 and S1-007 are out of scope for this review.

## Decision

S1-005 satisfies its slice scope and the G4 pass criteria. `createCamera(config)` defines a coherent vertical-FOV pinhole camera; the `(u, v)` screen convention is correct and documented; the camera basis is a correct right-handed orthonormal frame; `generateRay(camera, u, v)` returns unit-direction rays; and the center/corner contracts and degenerate-input policy are explicitly defined and asserted. ADR-002 is preserved: `src/core/camera.ts` imports only `vec3.js` and `ray.js`, and the pure core remains free of DOM/Canvas/Vite/UI. The math was re-derived independently and matches the documented corner-ray values.

One documentation drift was found (finding G4-1): the `generateRay` JSDoc describes `u`/`v` as "clamped to `[0, 1]`", but the implementation does not clamp — it validates finiteness only and produces off-screen rays. This contradicts both the module's own off-screen policy and the S1-005 report, which document off-screen rays correctly. It is a documentation defect, not a math defect, and does not block.

## Focus answers (review questions 1–10)

1. **Coherent pinhole model** — Yes. `position`/`lookAt` define the eye and gaze; the viewport is the unit-distance plane at camera-local `z = -1`; `halfHeight = tan(fov/2)`, `halfWidth = aspect * halfHeight`. The `Camera` value is a fully-resolved immutable record (inputs + computed basis + half-extents).
2. **Vertical FOV** — Clearly defined and consistently used. `fov` is documented as vertical in the module header and report; horizontal extent is derived from `aspect`.
3. **`(u, v)` screen convention** — Correct and documented. `ndcX = 2u − 1`, `ndcY = 1 − 2v`, so `v = 0` is top and `v = 1` is bottom. Asserted by the mirror-symmetry and per-edge sign tests.
4. **Camera basis** — Correct. `forward = normalize(lookAt − position)`, `right = normalize(cross(forward, up))`, `trueUp = normalize(cross(right, forward))` produce a right-handed orthonormal frame. Verified independently: for the sample camera, `forward = (0,0,−1)`, `right = (1,0,0)`, `trueUp = (0,1,0)`.
5. **Unit-direction rays** — Yes. `generateRay` normalizes the composed direction before calling `createRay`.
6. **Center/corner contracts** — Correct. Center reduces to `forward`; the four corner directions match the closed form `(±halfW, ±halfH, −1)/|·|`. Re-derived: `halfHeight ≈ 0.5773502692`, `halfWidth ≈ 0.9237604307`, `topLeft ≈ (−0.624695, 0.390434, −0.676252)`.
7. **Degenerate inputs** — Explicit. `RangeError` for fov outside `(0, π)`, non-positive/non-finite aspect, `position === lookAt`, forward parallel to up, and basis collapse. These fire before `normalizeVec3`'s zero-policy fallback can mask the cause.
8. **S1-004 semantics preserved** — Yes. `VEC3_EPSILON` tolerance, immutability-by-convention, and `createRay`'s verbatim-direction storage are honored; `generateRay` supplies the unit direction itself.
9. **Core boundary** — Clean. Import inspection confirms no `document`/`window`/Canvas/Vite/UI symbols anywhere in `src/core/`.
10. **`createVec3` re-export** — Acceptable for now, but avoidable surface (finding G4-2). Not a boundary violation.

## Boundary compliance

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/camera.ts` | `./vec3.js`, `./ray.js` | internal core | Compliant: pure-core math only |
| `src/core/camera.test.ts` | `./camera.js`, `./vec3.js`, `./ray.js`, `vitest` | test-only | Compliant |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports present |

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| G4-1 | MINOR | Documentation drift | The `generateRay` JSDoc states `u`/`v` "are clamped to `[0, 1]`", but the implementation does not clamp — `assertSample` checks finiteness only, and out-of-range values produce off-screen rays. The module header, the S1-005 report ("Off-screen samples … accepted and produce well-defined off-screen rays"), and the `isInViewport` helper all agree with the code; only this sentence disagrees. Risk: a downstream slice reading the source header could assume clamping behavior. | `src/core/camera.ts:164-167` (doc) vs `:168-180` (no clamp); contrast `src/core/camera.test.ts:312-317` |
| G4-2 | NOTE | API surface | `camera.ts` re-exports `createVec3` as a convenience for downstream slices. Acceptable, but it couples an unrelated constructor to the camera module's surface. The S1-005 report's Open Follow-Up already flags this; prefer a public core barrel or direct `vec3.js` imports when a later slice needs it. | `src/core/camera.ts:211` |
| G4-3 | NOTE | Documentation nuance | `pointAtCameraSample`'s JSDoc says it "computes both in one step using the camera's precomputed basis"; it actually delegates to `generateRay` (recomputing the direction). Behavior is correct; the wording overstates the optimization. | `src/core/camera.ts:190-203` |
| G4-4 | — (pass) | Math correctness | Basis and ray math independently re-derived and confirmed: orthonormal frame, vertical-FOV half-extents, center ray = `forward`, corner rays match the documented closed form to `VEC3_EPSILON`. | `src/core/camera.ts:122-179`, `src/core/camera.test.ts:190-256` |
| G4-5 | — (pass) | Degenerate-input policy | All documented degenerate cases throw a `RangeError` naming the cause, ordered before any zero-policy fallback. Deterministic and testable. | `src/core/camera.ts:111-141`, `src/core/camera.test.ts:46-118` |
| G4-6 | — (pass) | Boundary | Pure core remains DOM/Canvas/Vite/UI-free; `camera.ts` adds only `vec3` + `ray`. | import inspection of `src/core/` |

## Evidence summary (reviewer-reproduced, 2026-08-29)

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npx vitest run src/core/camera.test.ts` → `Test Files 1 passed (1) / Tests 43 passed (43)`.
- `npm run test:run` → `Test Files 11 passed (11) / Tests 155 passed (155)` (includes S1-006 tests present in the working tree; S1-005's 43 camera tests are among them).
- Import inspection (`src/core/`): `camera.ts` imports `./vec3.js` and `./ray.js` only; no `document`/`window`/Canvas/Vite/UI symbols anywhere in `src/core/`.
- Camera math re-derived by hand against `src/core/camera.ts` and the corner-ray contract in the S1-005 report; values match.
- Review basis commit: `98af674`. The working tree also contains uncommitted S1-006 changes; those are out of scope for G4.

## Required fixes before S1-007

None. No BLOCKER or MAJOR findings.

Recommended follow-up (non-blocking): correct the `generateRay` JSDoc wording in `src/core/camera.ts:164` from "clamped to `[0, 1]`" to "not clamped" so the source header matches the documented off-screen-ray policy. Findings G4-2 and G4-3 are opportunistic cleanups with no gate impact.

## Authorization recommendation

**G4 passes.** S1-005 camera-ray generation is approved as deterministic, boundary-compliant, and consistent with S1-004 semantics. This passes the G4 gate but does **not** authorize any new slice: S1-006 was already human-authorized and is complete (its own G5 review is separate), and S1-007 remains not authorized, pending the G5 (S1-006) review.

## References

- [S1-005 implementation report](../reports/UMBRA-S1-005-camera-ray-generation.md)
- [S1-004 implementation report](../reports/UMBRA-S1-004-vec3-and-ray-primitives.md)
- [Review gates](umbra-review-gates.md) (G4 row)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Architecture overview](../../knowledge/umbra-architecture-overview.md)
- [Verification strategy](../umbra-verification-strategy.md) (TC-S1-014)
- [Review task](../tasks/review/UMBRA-REVIEW-002-g4-camera-review.md)
- Reviewed sources: `src/core/camera.ts`, `src/core/camera.test.ts`, `src/core/vec3.ts`, `src/core/ray.ts`
