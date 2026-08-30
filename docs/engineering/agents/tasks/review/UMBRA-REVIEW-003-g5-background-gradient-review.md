# UMBRA-REVIEW-003 — G5 Background Gradient / First Visual Review

## Objective

Review S1-006 Background-Gradient Render as the first meaningful visual render.

## Responsible roles

- QA Engineer
- Engineering Reviewer

## Required skills

- osk-verification-engineering
- osk-boundary-review

## Inputs

- `docs/engineering/agents/reports/UMBRA-S1-006-background-gradient-render.md`
- `docs/engineering/agents/reports/UMBRA-S1-005-camera-ray-generation.md`
- `docs/engineering/agents/reports/hooks/umbra-verify-20260829T171211Z.md`
- `docs/engineering/agents/reviews/evidence/UMBRA-S1-006-background-gradient-render.png`
- `docs/adr/ADR-002-sprint-1-rendering-boundaries.md`
- `src/core/background-gradient.ts`
- `src/core/background-gradient.test.ts`
- `src/main.ts`
- `src/controller/render-controller.ts`

## Scope

Review only S1-006.

Do not implement sphere intersection.
Do not implement normals.
Do not implement lighting.
Do not authorize S1-007 unless Product Authority explicitly decides after this review.

## Review questions

1. Does the gradient correctly map ray direction to color?
2. Are top, bottom, and horizon colors documented and tested?
3. Does the pixel-center convention match S1-005 camera semantics?
4. Does the generator produce deterministic `PixelBuffer` output?
5. Does the controller remain generator-agnostic?
6. Does `main.ts` wire the sample camera and gradient generator cleanly?
7. Does the screenshot evidence match the expected vertical violet gradient?
8. Did the slice avoid sphere/intersection/lighting/materials/anti-aliasing?
9. Does `src/core/` remain clean of DOM/Canvas/Vite/UI?
10. Is importing `PixelBufferGenerator` type from `smoke-generator.ts` acceptable, or should that type move to a neutral module later?

## Required evidence

- Confirm:
  - `npm run verify` PASS
  - `npm run test:run` PASS
  - screenshot exists
- Inspect source boundaries.
- Compare screenshot to expected first visual.
- Confirm report records human authorization and does not claim G4/G5 passed.

## Output

Write:

`docs/engineering/agents/reviews/UMBRA-S1-006-g5-background-gradient-review.md`

The review must include:

- Verdict:
  - PASS
  - PASS WITH OBSERVATIONS
  - CHANGES REQUIRED
  - BLOCKED
- Findings table with severity.
- Visual evidence assessment.
- Boundary matrix.
- Required fixes before S1-007, if any.
- Authorization recommendation for S1-007.