# UMBRA-S1-009 — G7 RenderRequest v0 API Architecture + Boundary Review

Status: Approved (with observations)
Date: 2026-08-30
Verdict: PASS WITH OBSERVATIONS
Decision owners: Engineering Reviewer (`osk-architecture-review`, `osk-boundary-review`), QA Engineer (`osk-verification-engineering`), with light `osk-adversarial-analysis`
Review task: `UMBRA-REVIEW-006` (`docs/engineering/agents/tasks/review/UMBRA-REVIEW-006—G7RenderRequestV0APIArchitecture +BoundaryReview.md`)
Scope: S1-009 (declarative `RenderRequest v0`) only. Point lighting, materials, shadows, multiple primitives, UI controls, WebGL, Canvas changes, and new dependencies are out of scope except to confirm they were not introduced.

## Decision summary

S1-009 satisfies the G7 gate ("declarative request is minimal and Canvas-free"). `RenderRequestV0` is a coherent, minimal, DOM/Canvas-free declarative input contract with three top-level fields (`output`, `camera`, `scene`), a single-source-of-truth validator that names the failing field, correct aspect derivation, an explicit dimension contract, and a clean evolution path toward S1-010 (add `scene.light`). The request path produces byte-equal output to the direct S1-008 renderer, and the module's runtime export surface is exactly the two documented functions.

No BLOCKER or MAJOR findings. The one material open question is the permissive unknown-field policy (G7-1), which I assess as acceptable for v0 but requiring an explicit forward-compatibility decision; it does not block S1-010.

## API contract assessment (questions 1–8)

- **Minimal and coherent (Q1):** Yes. `output` + `camera` + `scene` is the right v0 shape.
- **Top-level fields (Q2):** Appropriate. `output` is presentation-independent dims; `camera` is the pinhole config; `scene` is the fixed scene.
- **Aspect derived from `output.width / output.height` (Q3):** Correct. This prevents caller drift between dims and aspect and keeps the contract minimal. It is a deliberate, documented choice (`camera.ts:121` passes `aspect: width/height`).
- **Single sphere (Q4):** Yes — `scene.sphere` is a singular `SphereConfig`, not an array. This is a strong guard against premature multi-primitive generalization (Q30).
- **Optional background (Q5):** Correct — `scene.background?` defaults to `DEFAULT_BACKGROUND_GRADIENT`.
- **Opaque-only `ColorLike { r, g, b }`, alpha `0xff` (Q6):** Yes — `toRgbaColor` fills `a = 0xff`. Consistent with the v0 opaque-only posture.
- **No accidental plugin-scene (Q7):** Confirmed — no registry, no dispatch, no extension point.
- **No compatibility promise beyond v0 (Q8):** Confirmed — the module header and report explicitly frame later features as requiring additive contract decisions.

## Validation-policy assessment (questions 9–15)

- **`validateRenderRequest(request: unknown)` single source of truth (Q9):** Yes for *shape/range* errors; every sub-validator funnels through field-naming `RangeError`s.
- **Errors name the failing field (Q10):** Yes — e.g. `UMBRA: render request camera.fieldOfView must be in the open interval (0, π), received 3.14...`.
- **Invalid dimensions (Q11):** Correct. `assertPositiveInteger` rejects non-positive, non-integer, `NaN`, and `Infinity`.
- **Invalid camera (Q12):** Finite-position/lookAt/up, `fieldOfView <= 0`, `>= π`, `NaN`/`Infinity` all rejected by `validateRenderRequest`. `position == lookAt` and `forward ∥ up` are rejected by `createCamera` during conversion, not by `validateRenderRequest` itself — see G7-2.
- **Invalid scene (Q13):** Correct — non-positive/non-finite radius, non-finite center, malformed background, out-of-`[0,255]`/non-finite color channels are all rejected with field-naming messages.
- **Internal validation (Q14):** Yes — `createRequestRenderGenerator` calls `validateRenderRequest` first, so callers do not need to remember.
- **Controller-dim mismatch (Q15):** Correct — `request.output` is the source of truth; the returned generator throws `RangeError` on mismatch.

## Unknown-fields policy assessment (question 16)

The v0 validator is **permissive**: it does not reject unknown top-level or nested fields. This is documented in the module header ("v0 does not validate or reject unknown top-level fields") and the report ("no runtime evolution guard").

**Assessment:** Acceptable for Sprint 1 v0, but it must be recorded as an explicit forward-compatibility decision rather than left implicit. The risk is silent acceptance of a typo on an *optional* field (e.g. `camera.up` → `upward`, `scene.background` → `bakcground`), which silently falls back to a default and renders "successfully". This risk is materially mitigated today by (a) the `RenderRequestV0` TypeScript type catching typos at compile time for typed callers, (b) all *required* fields being validated (a missing required field still throws), and (c) the single composition root (`main.ts`).

**Decision:** Non-blocking (MINOR). Recommend a follow-up hardening pass that either rejects unknown fields or adds an explicit `version`/strictness signal; see "Recommendation for S1-010 contract evolution."

## Determinism and equivalence assessment (questions 17–20)

- **Byte-equal to the direct S1-008 renderer (Q17):** Yes — asserted by `render-request.test.ts` "produces a byte-equal buffer…".
- **Structurally equivalent requests → byte-equal (Q18):** Yes — the conversion is deterministic and the underlying renderer is deterministic.
- **Per-pixel contract (Q19):** Yes — hit → `normalToRgbaColor(computeSphereNormal(hit))`, miss → `backgroundColorForDirection(ray.direction)`; asserted per-pixel.
- **Custom background override without affecting hit shading (Q20):** Yes — `background` is passed to `createSphereRenderGenerator`; hit shading is independent of background.

## Boundary matrix

| Source | Target | Direction | Status |
| --- | --- | --- | --- |
| `src/core/render-request.ts` | `./camera.js`, `./background-gradient.js`, `./pixel-buffer.js` (type), `./sphere-renderer.js`, `./sphere.js`, `./smoke-generator.js` (type-only), `./vec3.js` (type) | internal core | Compliant |
| `src/controller/render-controller.ts` | `../core/*`, `../canvas/*`, `../diagnostics/*` | allowed (sole dual-dependency module) | Compliant: unchanged, generator-agnostic |
| `src/main.ts` | `./ui/shell.js`, `./controller/*`, `./core/*`, CSS | composition root | Compliant: constructs `RenderRequestV0` only |
| `src/core/*` (all modules) | DOM / Canvas / Vite / UI | — | Compliant: no such imports (grep confirmed) |

Questions 21–26 answered: Q21 no DOM/Canvas/Vite/UI; Q22 no `HTMLCanvasElement`/`CanvasRenderingContext2D`/`ImageData`/`ImageDataLike`; Q23 `main.ts` is only a composition root; Q24 responsibility is acceptable (see G7-3); Q25 runtime exports exactly `{ validateRenderRequest, createRequestRenderGenerator }` (asserted by test); Q26 ADR-002 separation preserved.

## Findings

| # | Severity | Category | Finding | Evidence |
| --- | --- | --- | --- | --- |
| G7-1 | MINOR | Contract policy | Unknown top-level/nested fields are not rejected. A typo on an optional field (`camera.up` → `upward`, `scene.background` → misspelling) is silently ignored and renders with an unintended default. Acceptable for v0, but the permissive policy should be an explicit recorded decision, with a hardening follow-up (reject unknown fields, or add an explicit `version`/strictness signal). | `src/core/render-request.ts:30-37` (doc), `:97-107` (no unknown-field check) |
| G7-2 | NOTE | Validation completeness | `validateRenderRequest` does not catch `position == lookAt` or `forward ∥ up`; those are delegated to `createCamera` during conversion. End-to-end behavior is correct (the generator throws), but the "single source of truth for request-shape errors" claim is slightly overstated — a caller who only runs `validateRenderRequest` will not see those two camera errors. No request-level tests cover them (only `camera.test.ts`). | `src/core/render-request.ts:109-122` vs `src/core/camera.ts:122-141`; `render-request.test.ts` (no position==lookAt/∥up cases) |
| G7-3 | NOTE | Cohesion | `render-request.ts` owns four responsibilities (validation, request-to-core conversion, generator creation, dimension enforcement). Cohesive for a v0 "scene input adapter" and acceptable for Sprint 1; a later slice may split validation from conversion if the contract grows. | `src/core/render-request.ts` (whole module) |
| G7-4 | NOTE | Under-specified contract | `ColorLike` channels are validated as finite `number` in `[0, 255]` but are not required to be integers; a float channel (e.g. `127.5`) passes and flows into the gradient blend (which rounds internally). Functionally safe, but the contract should state whether channels are integer or float. | `src/core/render-request.ts:256-263`; `toRgbaColor` at `:276-278` |
| G7-5 | NOTE | Documentation staleness | The conceptual docs are stale versus the implemented contract: `umbra-api-contract.md` still says "Conceptual contract — not production code" and describes `scene` as `{ background, objects, lights }` (plural), while the implementation is `scene.sphere` (singular, no lights); `umbra-architecture-overview.md` still says "Proposed architecture — not implemented". Knowledge-curator promotion is now warranted. | `docs/knowledge/umbra-api-contract.md:3,18`; `docs/knowledge/umbra-architecture-overview.md:3` |
| G7-6 | — (pass) | API shape | Minimal, coherent, Canvas-free contract; aspect derived; single sphere; opaque-only color; explicit evolution boundary. | `src/core/render-request.ts:51-95` |
| G7-7 | — (pass) | Validation | Thorough field-naming validation for dims/camera/scene; generator validates internally; controller-dim mismatch throws. | `src/core/render-request.ts:141-263`, `render-request.test.ts` |
| G7-8 | — (pass) | Determinism / equivalence | Byte-equal to the direct renderer; per-pixel contract holds; custom background honored. | `render-request.test.ts:271-349` |
| G7-9 | — (pass) | Boundary | DOM/Canvas/Vite/UI-free; runtime export surface exactly 2 functions; `main.ts` is composition root only. | `src/core/render-request.ts` imports; `render-request.test.ts:381-389` |
| G7-10 | — (pass) | Evolution / carry-forward | `scene.light` is a clean additive path; single-sphere shape prevents premature generalization; G6-1, G6-3, S1-008-2, and the S1-009 unknown-field policy remain open and non-blocking. | `src/core/render-request.ts`; prior review records |

## Required fixes before S1-010

None that block. No BLOCKER or MAJOR findings.

## Non-blocking observations / debt

- G7-1 (unknown-field permissiveness) — record as an explicit decision; consider rejection or a `version` field in a hardening pass.
- G7-2 — either surface `position == lookAt` / `forward ∥ up` in `validateRenderRequest` (and add request-level tests) or document that `validateRenderRequest` covers shape/range while semantic degeneracy is validated by `createCamera`.
- G7-3, G7-4 — cohesion and color-channel integer-vs-float specification; minor, address when the contract next changes.
- G7-5 — knowledge-curator promotion of `umbra-api-contract.md` and `umbra-architecture-overview.md` (now that G7 is favorable).
- Carry-forward (unchanged): G6-1 zero-direction guard, G6-3 `PixelBufferGenerator` type placement, S1-008-2 `normalToRgbaColor` NaN hardening.

## Recommendation for S1-010 contract evolution (questions 27–31)

- **Add `scene.light`** (Q28): the natural, minimal field. Recommended shape (Q29, recommend only, do not implement):

  ```ts
  scene: {
    sphere: SphereConfig;
    background?: BackgroundGradientLike;
    light?: { position: Vec3Like; intensity?: number };  // additive, optional
  }
  ```

  Keep it optional so the existing v0 request (and S1-008 visual output) remains valid and unchanged (Q31). Validate `light.position` with `assertVec3` and `intensity` as a finite positive number (default `1`), mirroring the existing sub-validators.
- **Q27:** Yes — S1-010 can add point-light diffuse shading through this one additive decision; no restructuring required.
- **Q30:** No — the singular `scene.sphere` and the explicit evolution boundary make premature materials/multi-primitive/DSL additions hard, not easy.
- **Q31:** Yes — normal-based shading is untouched until S1-010 deliberately replaces the hit term; the byte-equality test pins this.

## Authorization recommendation

G7 passes.

S1-009 RenderRequest v0 is approved as the renderer's declarative input contract.

This review does recommend Product Authority authorization of S1-010, subject to the two non-blocking follow-ups (G7-1 decision, G7-2 documentation) being tracked.

S1-010 remains not authorized until Product Authority explicitly approves it.

## Limitations

- The conceptual docs (`umbra-api-contract.md`, `umbra-architecture-overview.md`) are stale relative to the implementation; noted as G7-5, deferred to the knowledge curator.
- No S1-009 screenshot exists in `reviews/evidence/`; visual equivalence is established by the byte-equality assertion, not a human-visible capture.

## References

- [S1-009 implementation report](../reports/UMBRA-S1-009-render-request-v0.md)
- [S1-008 report](../reports/UMBRA-S1-008-normal-based-shading.md), [S1-008 review](UMBRA-S1-008-normal-based-shading-review.md)
- [G6 sphere-intersection review](UMBRA-S1-007-g6-sphere-intersection-review.md), [G5 review](UMBRA-S1-006-g5-background-gradient-review.md), [G4 review](UMBRA-S1-005-g4-camera-review.md)
- [Verification hook run (PASS)](../reports/hooks/umbra-verify-20260830T170726Z.md)
- [Review gates](umbra-review-gates.md) (G7 row)
- [ADR-002 — Sprint 1 rendering boundaries](../../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [Conceptual API contract](../../knowledge/umbra-api-contract.md), [Architecture overview](../../knowledge/umbra-architecture-overview.md)
- [Review task](../tasks/review/UMBRA-REVIEW-006—G7RenderRequestV0APIArchitecture +BoundaryReview.md)
- Reviewed sources: `src/core/render-request.ts`, `src/core/render-request.test.ts`, `src/main.ts`, `src/core/sphere-renderer.ts`, `src/core/camera.ts`, `src/core/sphere.ts`, `src/core/background-gradient.ts`, `src/core/normal.ts`
