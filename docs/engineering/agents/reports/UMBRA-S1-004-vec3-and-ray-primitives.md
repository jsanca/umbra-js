# UMBRA-S1-004 — Vec3 and Ray Primitives — Report

## Status

Complete

## Objective

Create the independently testable mathematical vocabulary for the rendering core. Scope: `Vec3` operations, `Ray` value, normalization/zero policy, and pure unit tests. Non-goals: camera, Canvas, sphere, lighting, and UI changes.

Acceptance criteria (from [S1-004 in the slice plan](../tasks/umbra-sprint-1-slices.md)): documented arithmetic and ray-point cases pass; zero/normalization behavior is explicit; no browser import enters the core.

Task contract: [S1-004 in the slice plan](../tasks/umbra-sprint-1-slices.md).
Verification strategy row: [TC-S1-005 (vectors/rays)](../umbra-verification-strategy.md).

## Summary

Added two pure-core modules — `Vec3` and `Ray` — plus their unit tests. The whole slice lives in `src/core/` and imports nothing but language types and sibling core modules, so the ADR-002 boundary ("pure core must not import DOM, Canvas, Vite, or UI") is preserved. No dependency, UI, controller, Canvas, or diagnostics change was needed; the existing `core` Vitest project already globs `src/core/**/*.test.ts`, so the new tests are picked up automatically.

The suite now reports **94 tests across 9 files** (60 from S1-003 + 34 new), typecheck is silent, the production build is clean, and `npm run verify` passes.

## Files Changed

### New — pure rendering core

- `src/core/vec3.ts` — `Vec3` immutable value type (`readonly x/y/z`), `VEC3_ZERO`, `VEC3_EPSILON`, and pure operations: `createVec3`, `addVec3`, `subtractVec3`, `negateVec3`, `scaleVec3`, `divideVec3`, `dotVec3`, `crossVec3`, `lengthSquaredVec3`, `lengthVec3`, `normalizeVec3`, `approxEqualsVec3`. Only imports language types; `node`-clean.
- `src/core/ray.ts` — `Ray` value type (`origin`, `direction`), `createRay`, and `pointAtRay(ray, t) = origin + t · direction`. Imports only `vec3.js`.
- `src/core/vec3.test.ts` — 26 tests covering construction, add/subtract/negate/scale/divide, dot, cross (right-handed basis, anti-commutativity, parallel-zero), length/lengthSquared, normalize (unit length, direction preservation, zero policy), and approximate equality (default + explicit tolerance), plus immutability and zero-identity checks.
- `src/core/ray.test.ts` — 8 tests covering ray construction, non-normalized direction, `pointAtRay` at `t = 0/1/2/0.5/-1`, manual `origin + t·direction` parity, and a ray-points difference integration check.

No existing files were modified. No files under `docs/knowledge/`, `docs/adr/`, `docs/roadmap/`, or `.osk/` were touched (knowledge promotion is the knowledge-curator's responsibility, per the slice plan).

## Semantics (recorded for S1-005 handoff)

These are the exact, documented semantics S1-005 (camera-ray generation) and later slices must rely on:

- **Immutability:** every operation returns a new `Vec3`/`Ray`; inputs are never mutated.
- **Numeric tolerance:** `VEC3_EPSILON = 1e-6`, used as the default in `approxEqualsVec3`. Float comparisons (e.g. normalized results, cross products) use this tolerance.
- **Zero/normalization policy:** `normalizeVec3(VEC3_ZERO)` returns `VEC3_ZERO` — no `NaN`, no throw. Non-zero inputs return a unit vector in the same direction.
- **Division policy:** `divideVec3(v, 0)` throws a `RangeError`; no silent `Infinity`/`NaN`.
- **Ray direction policy:** `createRay` does **not** normalize its direction. Callers requiring a unit direction (S1-005 camera rays) must apply `normalizeVec3`.
- **Ray parameterization:** `pointAtRay(ray, t)` is defined for all real `t` (including negative); hit-testing (S1-007) will restrict to non-negative roots.

## Evidence

- `npm run typecheck` → silent, exit 0 (both `tsconfig.app.json` and `tsconfig.node.json`).
- `npm run test:run` → `Test Files 9 passed (9) / Tests 94 passed (94)`; the new files run in the `core` (node) project.
- `npx vitest run src/core/vec3.test.ts src/core/ray.test.ts` → `Test Files 2 passed (2) / Tests 34 passed (34)`.
- `npm run build` → `vite v8.2.2 ... ✓ 11 modules transformed.` exit 0 (bundle unchanged — the new core modules are not yet imported by the app entry, which is correct for S1-004's non-goals).
- `npm run verify` → PASS, report at `docs/engineering/agents/reports/hooks/umbra-verify-20260828T223200Z.md`.

### Core boundary inspection (TC-S1-005 dependency check)

Imports in `src/core/` after this slice:

| File | Imports |
| --- | --- |
| `vec3.ts` | none (language types only) |
| `ray.ts` | `./vec3.js` only |
| `pixel-buffer.ts` | none |
| `smoke-generator.ts` | `./pixel-buffer.js` only |

Test files import only `vitest` and sibling core modules. No `document`, `window`, `HTMLCanvasElement`, `CanvasRenderingContext2D`, `getContext`, or Vite/UI import appears anywhere in `src/core/`. The pure-core boundary is preserved.

## Validation

### TC-S1-005 — Vec3 / Ray arithmetic, ray point, zero policy

| Command | Exit | Output summary |
| --- | --- | --- |
| `npm run typecheck` | 0 | silent |
| `npm run test:run` | 0 | `Test Files 9 passed (9) / Tests 94 passed (94)` |
| `npm run build` | 0 | `✓ 11 modules transformed.` |
| `npm run verify` | 0 | PASS (audit-signatures, audit, typecheck, test, build) |

Deterministic assertions (no visual proof): the tests assert exact integer arithmetic with `toEqual` (add, subtract, scale, divide, dot, cross-basis) and floating-point results with `approxEqualsVec3` / `toBeCloseTo(…, 6)` against `VEC3_EPSILON`. The zero/normalization policy (`normalizeVec3(zero) === zero`) and the zero-divisor policy (`divideVec3(v, 0)` throws) are asserted explicitly.

## Limitations

- **The new modules are not yet wired into the render path.** S1-004 is deliberately pure-core: no camera, controller, Canvas, or UI integration. The smoke generator (`src/core/smoke-generator.ts`) remains the S1-003 default; S1-005 will introduce the camera that consumes `Vec3`/`Ray`.
- **`VEC3_EPSILON = 1e-6` is a provisional default.** It is sufficient for vector arithmetic and will be revisited (not silently changed) if S1-007's intersection root-selection needs a tighter tolerance; that decision belongs to that slice and its review.
- **No `Vec3 → RgbaColor` mapping yet.** The S1-003 handoff noted a color-clamp policy would be documented in S1-004; that mapping belongs to the shading/lighting work (S1-008/S1-010) and is intentionally out of scope here. No color conversion exists in this slice.

## Open Follow-Up

- S1-005 consumes `Vec3`/`Ray` for camera-ray generation and must honor the recorded semantics above, especially the un-normalized `createRay` direction policy.
- Re-export `Vec3`/`Ray` from a public core barrel only if a later slice finds the per-module imports awkward; none is needed now.
- Knowledge-curator: the Vec3/Ray semantics above are now proven facts and are candidates for a `docs/knowledge/` page when the curator runs.

## Handoff (to S1-005)

- `Vec3` and `Ray` live in `src/core/vec3.ts` and `src/core/ray.ts`; both are pure and immutable.
- Recorded semantics and tolerance (`VEC3_EPSILON = 1e-6`) are listed under "Semantics" above; S1-005 must follow them and define camera-specific degenerate-input behavior on top of the zero policy.
- The pure-core boundary remains: no browser import in `src/core/`.

## Related Records

- Task contract: [Sprint 1 slice plan](../tasks/umbra-sprint-1-slices.md) (S1-004 section).
- Decisions: [ADR-001](../../adr/ADR-001-typescript-vite-canvas-2d-baseline.md), [ADR-002](../../adr/ADR-002-sprint-1-rendering-boundaries.md).
- Verification strategy: [Sprint 1 verification strategy](../umbra-verification-strategy.md) (TC-S1-005 row).
- Review gates: [Umbra Sprint 1 review gates](../reviews/umbra-review-gates.md) (G3 row).
- Predecessor reports: [UMBRA-S1-003 report](UMBRA-S1-003-canvas-viewport-and-pixel-writer.md).
- Predecessor review: [G2 approval](../reviews/UMBRA-S1-002-g2-approval.md).
- Verification hook run: [umbra-verify-20260828T223200Z.md](hooks/umbra-verify-20260828T223200Z.md).
- Workspace guide: [AGENTS.md](../../../../AGENTS.md).
