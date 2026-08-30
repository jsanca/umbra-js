# Umbra Carry-Forward Backlog

Non-blocking observations and follow-ups carried across Sprint 1 slices. None blocks the G9 Sprint 1 checkpoint; each is addressed in a hardening pass or post-Sprint-1 work.

## Retrospective triage (2026-08-30)

The original table remains the historical Sprint 1 record. [UMBRA-OSK-RETRO-001](../../reviews/UMBRA-OSK-RETRO-001-sprint-1-experiment.md) classifies follow-up urgency without changing a historical gate verdict.

| Horizon | Items | Required disposition |
| --- | --- | --- |
| Must fix before Sprint 2 authorization | CF-001, CF-005 | Resolve policy/behavior or obtain an explicit Product/technical decision before expanding the request/core surface. |
| Should fix during Sprint 2 hardening | CF-002, CF-003, CF-008, CF-010 | Plan explicit bounded hardening work; do not opportunistically bundle it into unrelated features. |
| Can remain documented | CF-004, CF-009 | Preserve the ADR-003 v0 policy and the no-attenuation simplification unless a new contract decision changes them. |
| Resolved / process control | CF-006, CF-007 | Keep evidence links current; promote knowledge and capture visual evidence before the consuming gate. |

| ID | Source | Severity | Item | Blocks G9? |
|---|---|---:|---|---|
| CF-001 | G6-1 | MINOR | Guard zero-length ray direction in `intersectSphere` or document `null` policy (S1-004 zero policy silently returns `null` for `a === 0`) | No |
| CF-002 | G6-3 | NOTE | Move `PixelBufferGenerator` from `smoke-generator.ts` to a neutral core module (now imported by three modules) | No |
| CF-003 | S1-008-2 | NOTE | Harden `normalToRgbaColor` against `NaN` components or document the finite-precondition invariant | No |
| CF-004 | G7-1 / ADR-003 | MINOR | Record `RenderRequest v0` unknown-field policy as an explicit decision (resolved by [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md)); hardening pass may add strict mode or explicit `version` signal | No (ADR recorded) |
| CF-005 | G7-2 | NOTE | Clarify `validateRenderRequest` scope: shape/range vs semantic camera degeneracy (`position == lookAt`, `forward ∥ up` delegated to `createCamera`) | No |
| CF-006 | G7-5 | NOTE | Promote/update knowledge docs after G7 (resolved at S1-011: `umbra-api-contract.md`, `umbra-architecture-overview.md`, `umbra-domain-model.md` updated to implemented state) | No (resolved) |
| CF-007 | G8-1 | NOTE | Capture the S1-010 screenshot for the G8/G9 visual record (the screenshot `docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png` now exists, so this is resolved at S1-011; the historical G8 review noted its absence at review time) | No (resolved) |
| CF-008 | G8-2 | NOTE | Document or guard `light.position === hitPoint` (degenerate lightDir collapses to `VEC3_ZERO`, silent black result) | No |
| CF-009 | G8-3 | NOTE | Record the no-distance-attenuation simplification: `intensity` is a flat multiplier, no `1/r²` falloff (matches the documented formula; by design for S1-010) | No |
| CF-010 | G8-4 | NOTE | Factory validation asymmetry: `createPointLight` validates `intensity` but not `position` finiteness (the request validator enforces position finiteness; unlike `createSphere` which validates its center) | No |
