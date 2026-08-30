# UMBRA-S1-008 — Normal-Based Shading Review

Status: Approved (with observations)
Date: 2026-08-29
Verdict: PASS WITH OBSERVATIONS
Decision owners: QA Engineer (`osk-verification-engineering`), Engineering Reviewer (`osk-boundary-review`), with light `osk-adversarial-analysis`
Review task: `UMBRA-REVIEW-005` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-005—S1-008Normal-BasedShadingReview.md`)
Scope: S1-008 (sphere normal computation + normal-based color mapping + renderer integration) only. Point light, shadows, reflectance models, `RenderRequest v0`, and UI controls are out of scope except to confirm they were not introduced.

## Decision

S1-008 satisfies its slice scope. `computeSphereNormal(hit)` correctly returns the unit outward normal (`normalize(hit.point − hit.sphere.center)`); `normalToRgbaColor(normal)` maps each component from `[−1, 1]` to a `[0, 255]` byte via `clamp01(0.5 · (n + 1))` with `a = 0xff`; the miss path still resolves to the documented background gradient; and the sphere renderer did not introduce lighting, materials, shadows, or `RenderRequest v0`. ADR-002 holds — `normal.ts` imports only `vec3`, `sphere` (type), and `pixel-buffer` (type). The two carry-forward observations (G6-1, G6-3) remain explicitly open, as the slice's constraint required.

I re-derived the cardinal and diagonal colors independently and they match the code and tests exactly. No BLOCKER or MAJOR findings.

## Focus answers

1. **`computeSphereNormal(hit) = normalize(hit.point − hit.sphere.center)`** — Confirmed. `src/core/normal.ts:42-44` implements exactly this via `normalizeVec3(subtractVec3(...))`.
2. **`normalToRgbaColor(normal)` maps `[−1, 1]` → `[0, 255]` with `a = 0xff`** — Confirmed. `channelFor` uses `t = clamp01(0.5·(n+1))` then `Math.round(t·255)`; alpha is the constant `0xff`. Cardinal colors and the diagonal `(201,201,201,255)` are exact.
3. **Miss path still uses the background gradient** — Confirmed. `sphere-renderer.ts:57-59` writes `backgroundColorForDirection(ray.direction, background)` on a miss.
4. **No lighting/materials/shadows** — Confirmed. The hit color is `normalToRgbaColor(computeSphereNormal(hit))` only; no light direction, no dot-product, no shadow term, no material parameter.
5. **S1-009 `RenderRequest v0` not implemented** — Confirmed. No `RenderRequest` symbol exists anywhere in `src/` (grep found only UI copy strings from S1-002, e.g. "Lighting" pipeline label).
6. **ADR-002 boundary still holds** — Confirmed. `normal.ts` imports `vec3` (values) + `sphere`/`pixel-buffer` (types); `sphere-renderer.ts` adds `normal.js`. No DOM/Canvas/Vite/UI import in `src/core/`.
7. **Carry-forward G6-1 and G6-3 remain open** — Confirmed. `intersectSphere` is unchanged (zero-direction guard still absent) and `PixelBufferGenerator` still lives in `smoke-generator.ts`; both are explicitly documented as carry-forward in the S1-008 report.

## Boundary matrix

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/normal.ts` | `./vec3.js`, `./sphere.js` (type), `./pixel-buffer.js` (type) | internal core | Compliant |
| `src/core/sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./normal.js`, `./sphere.js`, `./smoke-generator.js` (type-only) | internal core | Compliant |
| `src/controller/render-controller.ts` | `../core/*`, `../canvas/*`, `../diagnostics/*` | allowed (sole dual-dependency module) | Compliant: unchanged |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, `./core/*`, CSS | composition root | Compliant |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports |

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| S1-008-1 | NOTE | Report accuracy | The S1-008 report states "S1-008 remains gated behind G7", but the [review-gates table](umbra-review-gates.md) places S1-008 under **G6** (joint with S1-007); G7 gates S1-009 (`RenderRequest v0`). The gate reference in the report should be reconciled to the canonical gates table. | S1-008 report "Authorization note"/"Handoff" vs `umbra-review-gates.md` G6/G7 rows |
| S1-008-2 | NOTE | Degenerate-input robustness | `normalToRgbaColor`'s doc says non-unit inputs "are tolerated because the channel clamp prevents out-of-range bytes", but a `NaN` component passes through `clamp01` unchanged (`Math.round(NaN) = NaN`). Finite out-of-range inputs clamp correctly; `NaN` does not. Same family as G6-1; non-material because the pipeline only feeds finite unit vectors from `computeSphereNormal`. | `src/core/normal.ts:55-57`; `src/core/normal.ts:24-26` (doc) |
| S1-008-3 | NOTE | API surface change | `DEFAULT_SPHERE_HIT_COLOR` and the `hitColor` option were removed from `sphere-renderer.ts`. Intentional and documented (the hit color is no longer a constant), and there are no external consumers (only `main.ts` and tests use the renderer). Worth recording as a deliberate within-core contract change for S1-009. | `src/core/sphere-renderer.ts:39-41` vs S1-007 version |
| S1-008-4 | — (pass) | Carry-forward (tracked) | G6-1 (zero-direction guard) and G6-3 (`PixelBufferGenerator` type placement) remain explicitly open and were correctly **not** addressed in this slice, as the review constraint required. | S1-008 report "Carry-forward observations"; `src/core/sphere.ts` unchanged; `src/core/smoke-generator.ts:16` |
| S1-008-5 | — (pass) | Math correctness | Normal formula and color mapping re-derived and confirmed: front hit `(0,0,1)`; cardinal bytes exact (`127.5 → 128` via `Math.round` half-up); diagonal `1/√3` → `201.112… → 201` (not on a `.5` boundary). | `src/core/normal.ts`, `src/core/normal.test.ts:13-181` |
| S1-008-6 | — (pass) | Boundary / scope | ADR-002 holds; no lighting/materials/shadows/`RenderRequest` drift; miss path preserves the background gradient. | `src/core/normal.ts` imports; `src/core/sphere-renderer.ts`; `src/main.ts` |

## Evidence summary (reviewer-reproduced, 2026-08-29)

- `npm run typecheck` → silent, exit 0 (both tsconfigs).
- `npm run test:run` → `Test Files 14 passed (14) / Tests 199 passed (199)`.
- `npx vitest run src/core/normal.test.ts` → `21 passed`.
- `npm run verify` → PASS (audit-signatures 56/56, audit 0 vulns, typecheck, 199 tests, build `✓ 18 modules transformed`), recorded at `docs/engineering/agents/reports/hooks/umbra-verify-20260829T191325Z.md` (commit `98af674`).
- Import inspection confirms the boundary matrix; `grep` confirms no `RenderRequest`/Lambert/Phong/shadow/light/material/reflect symbol in `src/core/` (matches are UI copy strings in `src/ui/`).
- No S1-008 screenshot exists in `reviews/evidence/` (consistent with the report's "no screenshot in this automated environment" note); visual correctness rests on the deterministic exact-channel assertions.

## Required fixes before S1-009

None that block. No BLOCKER or MAJOR findings.

Recommended follow-ups (non-blocking): reconcile the gate reference in the S1-008 report (S1-008-1); optionally harden `normalToRgbaColor` against `NaN` (S1-008-2). G6-1 and G6-3 remain tracked carry-forwards, not new work.

## Authorization recommendation

**S1-008 is approved.** The normal-based shading is correct, deterministic, and boundary-compliant. This review does **not** authorize S1-009 — per the review task, S1-009 (`RenderRequest v0`) remains gated (G7 in the gates table) and requires its own authorization.

## References

- [S1-008 implementation report](../reports/UMBRA-S1-008-normal-based-shading.md)
- [S1-007 report](../reports/UMBRA-S1-007-sphere-intersection.md), [G6 review](UMBRA-S1-007-g6-sphere-intersection-review.md)
- [Verification hook run (PASS)](../reports/hooks/umbra-verify-20260829T191325Z.md)
- [Review gates](umbra-review-gates.md) (G6/G7 rows)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Review task](../tasks/review/UMBRA-REVIEW-005—S1-008Normal-BasedShadingReview.md)
- Reviewed sources: `src/core/normal.ts`, `src/core/normal.test.ts`, `src/core/sphere-renderer.ts`, `src/core/sphere-renderer.test.ts`, `src/controller/render-controller.test.ts`, `src/main.ts`
