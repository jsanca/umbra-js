# UMBRA-S1-010 — G8 Point-Light Diffuse Shading Review

Status: Approved (with observations)
Date: 2026-08-30
Verdict: PASS WITH OBSERVATIONS
Decision owners: Engineering Reviewer (`osk-architecture-review`, `osk-boundary-review`), QA Engineer (`osk-verification-engineering`), with light `osk-adversarial-analysis`
Review task: `UMBRA-REVIEW-007` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-007—G8Point-LightDiffuseShadingReview.md`)
Scope: S1-010 (point-light diffuse shading) only. Shadows, specular, materials, multiple primitives, UI controls, WebGL, Canvas changes, and new dependencies are out of scope except to confirm they were not introduced.

## Decision summary

S1-010 satisfies the G8 gate ("direct-light outcome meets scope and deterministic evidence"). Point-light Lambertian diffuse shading is implemented correctly (`t = max(0, dot(normal, lightDir)) * intensity`, per-channel round + clamp); the `scene.light` contract field is a minimal, optional, additive change that preserves byte-equality for requests without a light; validation is complete at the request layer; the renderer preserves the one-ray-per-pixel, pixel-center, deterministic, fresh-buffer contract; and ADR-002 holds. No shadows, specular, materials, multiple primitives, or other scope drift was introduced.

No BLOCKER or MAJOR findings. One visual-evidence gap (the S1-010 screenshot is absent from the repo — G8-1) and a few non-blocking NOTEs remain.

## Lighting math assessment (questions 1–5)

- **Formula (Q1):** Correct. `lightDirectionFromHit` = `normalize(light.position − hitPoint)`; `diffuseShadingColor` = `t = max(0, dot(normal, lightDir)) * intensity`, `channel = clampByte(round(baseColor.channel * t))`. Re-derived independently and matches `src/core/light.ts`.
- **Bounded output (Q2):** Yes — `max(0, ·)` clamps negative dots; `clampByte` clamps per-channel overflow (`intensity = 2`, `base = (200,100,50)` → `(255,200,100)`).
- **Degenerate/edge behavior (Q3):** `dot > 0` scales; `dot = 0` → black; `dot < 0` → black (back-facing unlit); light at hit point → `VEC3_ZERO` direction → black (documented, G8-2); intensity defaulted to `1`; zero/negative/non-finite intensity rejected by `createPointLight`.
- **No specular/shadows/ambient/reflection (Q4):** Confirmed — only the Lambertian `max(0, dot)` term exists.
- **Visual expectation (Q5):** The math produces a lit region facing the light and a black back hemisphere; no occlusion/shadow test is performed (correct — shadows are out of scope).

## RenderRequest light-contract assessment (questions 6–13)

- **Additive `scene.light` (Q6):** Yes — `light?: { position: Vec3Like; intensity?: number }`, exactly the G7-recommended shape.
- **Optional (Q7):** Yes — omitting it yields the S1-008 normal-visualization path (byte-equal), so existing S1-009 requests remain valid.
- **Default documented/tested (Q8):** Yes — no-light byte-equality with S1-008 is asserted; `intensity` defaults to `1`.
- **`light.position` validated finite (Q9):** Yes — `validatePointLight` → `assertVec3`.
- **`light.intensity` validated positive finite (Q10):** Yes — `assertPositiveFiniteNumber` (renamed from `assertPositiveRadius`).
- **Existing contract preserved (Q11):** Yes — `output`/`camera`/`scene.sphere`/`scene.background` unchanged.
- **Unknown-field policy (Q12):** Unchanged and tracked (G7-1 carry-forward); the module header still documents the permissive policy.
- **Validation split (Q13):** Light validation is fully in `validateRenderRequest` (unlike camera degeneracy); no semantic split for light.

## Validation-policy assessment

`validatePointLight` requires an object with a finite `position` (`assertVec3`) and an optional positive-finite `intensity`. Error messages name the field (`UMBRA: render request scene.light.intensity must be a positive finite number`). The conversion calls `createPointLight(position, intensity ?? 1)`, which re-validates intensity (harmless defense-in-depth). One asymmetry: `createPointLight` itself validates `intensity` but not `position` finiteness (position finiteness is enforced only by the request validator) — G8-4.

## Determinism and render behavior assessment (questions 14–16)

- **Renderer contract (Q14):** Hit → diffuse; miss → background gradient; one ray per pixel; pixel-center convention; deterministic; fresh buffer per call — all preserved (`src/core/sphere-renderer.ts`).
- **Integration coverage (Q15):** Tests prove lit ≠ unlit (strict-darkening assertion), miss = gradient, no-light byte-equality, custom light affects hits, custom background affects misses only.
- **Determinism/byte-stability (Q16):** Yes — the fixed-scene lit render is deterministic; the no-light path is byte-equal to S1-008/009.

## Boundary matrix

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/light.ts` | `./vec3.js`, `./pixel-buffer.js` (type-only) | internal core | Compliant |
| `src/core/sphere-renderer.ts` | `./pixel-buffer.js`, `./background-gradient.js`, `./camera.js`, `./light.js`, `./normal.js`, `./sphere.js`, `./smoke-generator.js` (type-only) | internal core | Compliant |
| `src/core/render-request.ts` | `./camera.js`, `./background-gradient.js`, `./pixel-buffer.js` (type), `./sphere-renderer.js`, `./light.js`, `./sphere.js`, `./smoke-generator.js` (type-only), `./vec3.js` (type) | internal core | Compliant |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, `./core/*`, CSS | composition root | Compliant (request now includes `scene.light`) |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports |

Questions 17–21 answered: Q17 no DOM/Canvas/Vite/UI; Q18 `render-request.ts` Canvas-free; Q19 `main.ts` is a composition root; Q20 no shadows/specular/materials/multi-primitive/BVH/AA/UI/deps/WebGL; Q21 no generic scene DSL (single sphere, single optional light).

## Visual evidence assessment (questions 22–24)

The S1-010 screenshot `docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png` is **absent** from the repository — `reviews/evidence/` contains only the S1-006 and S1-007 renders (and two OSK pause captures). This is a visual-evidence gap, not a code defect; the report itself documents "no screenshot in this automated environment."

Visual correctness is established instead by deterministic, exact per-pixel assertions: lit hits equal `diffuseShadingColor(baseColor, normal, light, hit.point)` channel-for-channel; back-facing hits equal black; misses equal `backgroundColorForDirection(ray.direction)`; and the no-light path is byte-equal to the S1-008 normal visualization. These are the primary evidence per the project's evidence policy ("manual visual confirmation supplements, never replaces"). A human may still capture the running app via `npm run dev` for the G8 visual record.

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| G8-1 | NOTE | Visual evidence | The S1-010 screenshot is missing from `reviews/evidence/` (the review task's required evidence references it). Deterministic pixel assertions carry the proof; the screenshot is the human-visible supplement. | `reviews/evidence/` directory listing; S1-010 report "Limitations" |
| G8-2 | NOTE | Degenerate input | `light.position === hitPoint` collapses the light direction to `VEC3_ZERO` (S1-004 zero policy), yielding a silent black result. Documented as a caller bug; not validated (a proximity check would be needed). Same family as G6-1/S1-008-2. | `src/core/light.ts:61-62`, `light.test.ts:66-69,121-128` |
| G8-3 | NOTE | Lighting simplification | No distance attenuation (`1/r²`); `intensity` is a flat multiplier. This matches the documented formula exactly (the review task's expected term omits falloff), so it is by design, but worth recording for S1-011 handoff. | `src/core/light.ts:71-73` |
| G8-4 | NOTE | Factory validation asymmetry | `createPointLight` validates `intensity` (positive finite) but not `position` finiteness; position finiteness is enforced only by the request validator, unlike `createSphere` which validates its center. Non-defect, but a mild inconsistency in factory validation depth. | `src/core/light.ts:49-59` vs `src/core/sphere.ts:63-79` |
| G8-5 | — (pass) | Lighting math | Lambertian formula re-derived and confirmed: `t = max(0, dot) * intensity`, round + clamp per channel, alpha preserved, cardinal cases exact. | `src/core/light.ts:65-83`, `light.test.ts:79-152` |
| G8-6 | — (pass) | Contract evolution | `scene.light` is a minimal, optional, additive field matching the G7 recommendation; no-light path is byte-equal to S1-008. | `src/core/render-request.ts:87-103,143-150` |
| G8-7 | — (pass) | Validation | `validatePointLight` enforces finite position + optional positive-finite intensity with field-naming errors. | `src/core/render-request.ts:207-219` |
| G8-8 | — (pass) | Determinism | Lit render deterministic; per-pixel contract asserted; fresh buffer; byte-stable fixed scene. | `render-request.test.ts`, `sphere-renderer.test.ts` |
| G8-9 | — (pass) | Boundary / scope | Core DOM/Canvas/Vite/UI-free; no shadows/specular/materials/multi-primitive/BVH/AA drift. | `src/core/light.ts` imports; `src/main.ts` |
| G8-10 | — (pass) | Carry-forward | G6-1, G6-3, S1-008-2, G7-1, G7-2, G7-5 remain open and non-blocking; tracked in the report and the carry-forward backlog. | S1-010 report "Carry-forward observations"; `tasks/backlog/UMBRA-CARRY-FORWARD.md` |

## Required fixes before S1-011

None that block. No BLOCKER or MAJOR findings.

## Non-blocking observations / debt

- G8-1: capture the S1-010 screenshot for the G8/G9 visual record.
- G8-2, G8-4: degenerate-input and factory-validation hardening, consistent with the existing G6-1/S1-008-2 family.
- G8-3: record the no-distance-attenuation simplification in the S1-011 checkpoint.
- Carry-forward (unchanged, tracked in `UMBRA-CARRY-FORWARD.md`): CF-001 (G6-1), CF-002 (G6-3), CF-003 (S1-008-2), CF-004 (G7-1), CF-005 (G7-2), CF-006 (G7-5).

## Authorization recommendation

G8 passes.

S1-010 point-light diffuse shading is approved.

This review does recommend Product Authority authorization of S1-011.

S1-011 remains not authorized until Product Authority explicitly approves it.

## References

- [S1-010 implementation report](../reports/UMBRA-S1-010-point-light-diffuse-shading.md)
- [G7 RenderRequest review](UMBRA-S1-009-g7-render-request-api-boundary-review.md), [S1-009 report](../reports/UMBRA-S1-009-render-request-v0.md)
- [S1-008 review](UMBRA-S1-008-normal-based-shading-review.md), [G6 review](UMBRA-S1-007-g6-sphere-intersection-review.md)
- [Verification hook run (PASS)](../reports/hooks/umbra-verify-20260830T174558Z.md)
- [Review gates](umbra-review-gates.md) (G8 row)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Carry-forward backlog](../tasks/backlog/UMBRA-CARRY-FORWARD.md)
- [Review task](../tasks/review/UMBRA-REVIEW-007—G8Point-LightDiffuseShadingReview.md)
- Reviewed sources: `src/core/light.ts`, `src/core/light.test.ts`, `src/core/sphere-renderer.ts`, `src/core/render-request.ts`, `src/core/render-request.test.ts`, `src/main.ts`
