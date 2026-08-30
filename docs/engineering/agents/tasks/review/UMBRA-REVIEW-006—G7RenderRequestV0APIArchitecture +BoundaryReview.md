````md
# UMBRA-REVIEW-006 — G7 RenderRequest v0 API Architecture + Boundary Review

## Objective

Review S1-009 — Declarative RenderRequest v0 before authorizing S1-010.

This is an API architecture and boundary review. The goal is to determine whether `RenderRequestV0` is minimal, coherent, deterministic, boundary-safe, and ready to evolve toward S1-010 point-light diffuse shading without becoming an accidental framework or leaking Canvas/UI concerns.

## Responsible roles

- Engineering Reviewer
- QA Engineer

## Required skills

- osk-architecture-review
- osk-boundary-review
- osk-verification-engineering
- light osk-adversarial-analysis

## Inputs

- `docs/engineering/agents/reports/UMBRA-S1-009-render-request-v0.md`
- `docs/engineering/agents/reports/UMBRA-S1-008-normal-based-shading.md`
- `docs/engineering/agents/reviews/UMBRA-S1-008-normal-based-shading-review.md`
- `docs/engineering/agents/reviews/UMBRA-S1-007-g6-sphere-intersection-review.md`
- `docs/engineering/agents/reviews/UMBRA-S1-005-g4-camera-review.md`
- `docs/engineering/agents/reviews/UMBRA-S1-006-g5-background-gradient-review.md`
- `docs/engineering/agents/reports/hooks/umbra-verify-20260830T170726Z.md`
- `docs/adr/ADR-002-sprint-1-rendering-boundaries.md`
- `docs/engineering/agents/reviews/umbra-review-gates.md`
- `docs/engineering/agents/tasks/umbra-sprint-1-slices.md`
- `docs/knowledge/umbra-api-contract.md`
- `docs/knowledge/umbra-architecture-overview.md`
- `src/core/render-request.ts`
- `src/core/render-request.test.ts`
- `src/core/sphere-renderer.ts`
- `src/core/camera.ts`
- `src/core/sphere.ts`
- `src/core/background-gradient.ts`
- `src/core/normal.ts`
- `src/core/pixel-buffer.ts`
- `src/main.ts`

## Scope

Review only S1-009.

Do not implement code.  
Do not modify source.  
Do not authorize S1-010.  
Do not mark G7 or G8 as passed unless the review verdict explicitly supports G7.  
Do not introduce point lighting, materials, shadows, multiple primitives, UI controls, WebGL, Canvas changes, or new dependencies.

## Context

S1-009 introduced `RenderRequestV0` as the first declarative input contract for the renderer.

The request path now describes the fixed scene through data:

```ts
RenderRequestV0 {
  output: {
    width: number;
    height: number;
  };

  camera: {
    position: Vec3Like;
    lookAt: Vec3Like;
    up?: Vec3Like;
    fieldOfView: number;
  };

  scene: {
    sphere: SphereConfig;
    background?: BackgroundGradientLike;
  };
}
````

`createRequestRenderGenerator(request)` validates the request, converts it into existing core values, and returns a `PixelBufferGenerator`.

S1-010 is expected to add point-light diffuse shading later, most likely by adding a minimal `scene.light` or equivalent field. This review must judge whether S1-009 leaves a clean evolution path.

## Review questions

### A. API contract shape

1. Is `RenderRequestV0` minimal and coherent for Sprint 1?

2. Are the top-level fields appropriate?

   ```text
   output
   camera
   scene
   ```

3. Is it correct that `aspect` is derived from `output.width / output.height` instead of being supplied by the caller?

4. Is `scene.sphere` intentionally limited to a single sphere?

5. Is `scene.background` correctly optional?

6. Is `ColorLike` intentionally opaque-only `{ r, g, b }`, with alpha filled as `0xff`?

7. Does the contract avoid accidental generic plugin-scene behavior?

8. Does the contract avoid promising compatibility beyond v0?

### B. Validation policy

9. Is `validateRenderRequest(request: unknown)` a good single source of truth for request-shape errors?

10. Do validation errors name the failing field clearly enough for callers?

11. Are invalid dimensions handled correctly?

```text
non-positive
non-integer
NaN
Infinity
```

12. Are invalid camera values handled correctly?

```text
non-finite position/lookAt/up
fieldOfView <= 0
fieldOfView >= π
NaN / Infinity
position == lookAt
forward parallel to up
```

13. Are invalid scene values handled correctly?

```text
non-positive sphere radius
non-finite sphere radius
non-finite sphere center
malformed background
color channels outside [0,255]
NaN / Infinity color channels
```

14. Does `createRequestRenderGenerator(request)` correctly validate internally, so callers do not need to remember to call `validateRenderRequest` first?

15. Is the controller-dimension mismatch policy correct?

```text
request.output is the source of truth
generator(width, height) must throw if dimensions differ
```

16. Should unknown top-level or nested fields be accepted or rejected in v0?

Review the current policy carefully. The S1-009 report says unknown fields are not rejected. Decide whether this is acceptable for Sprint 1 or should become a required fix.

### C. Determinism and equivalence

17. Does the request path produce byte-equal output to the direct S1-008 renderer for the fixed scene?

18. Do structurally equivalent requests produce deterministic byte-equal buffers?

19. Does the per-pixel contract still hold?

```text
hit  -> normalToRgbaColor(computeSphereNormal(hit))
miss -> backgroundColorForDirection(ray.direction)
```

20. Does custom background override work without affecting hit shading?

### D. Boundary and layering

21. Does `src/core/render-request.ts` remain free of DOM, Canvas, Vite, and UI imports?

22. Does the contract avoid Canvas types such as:

```text
HTMLCanvasElement
CanvasRenderingContext2D
ImageData
ImageDataLike
```

23. Is `src/main.ts` still only a composition root?

24. Does `render-request.ts` have the right responsibility, or is it taking on too much?

Review whether it should own:

* validation
* request-to-core conversion
* generator creation
* dimension enforcement

25. Is the runtime export surface appropriate?

Expected runtime exports:

```text
validateRenderRequest
createRequestRenderGenerator
```

26. Does the contract preserve the ADR-002 separation?

```text
pure core
render orchestration
Canvas adapter
UI shell
composition root
```

### E. Evolution toward S1-010

27. Can S1-010 add point-light diffuse shading through a small additive contract decision?

28. Should S1-010 add:

```text
scene.light
```

or a different field?

29. What minimal light shape should G7 recommend for S1-010?

For example:

```ts
light?: {
  position: Vec3Like;
  intensity?: number;
}
```

Only recommend; do not implement.

30. Does the current request contract make it too easy to accidentally add materials, multiple primitives, or a full scene DSL too early?

31. Does the request contract preserve current S1-008 visual output until S1-010 explicitly changes shading?

### F. Carry-forward observations

32. Confirm whether these remain open and non-blocking:

```text
G6-1: zero-direction ray guard in intersectSphere
G6-3: PixelBufferGenerator type placement
S1-008-2: normalToRgbaColor NaN hardening
S1-009: unknown-field policy decision
```

33. Decide whether any carry-forward should block S1-010.

## Required evidence

The reviewer must re-run or verify:

```bash
npm run typecheck
npm run test:run
npx vitest run src/core/render-request.test.ts
npm run verify
```

The reviewer must inspect source directly, not only the report:

```text
src/core/render-request.ts
src/core/render-request.test.ts
src/main.ts
src/core/sphere-renderer.ts
src/core/camera.ts
src/core/sphere.ts
src/core/background-gradient.ts
src/core/normal.ts
```

The reviewer must inspect imports in `src/core/` and confirm no DOM/Canvas/Vite/UI leakage.

The reviewer must independently reason through these adversarial API cases:

```text
missing output
missing camera
missing scene
invalid output width/height
invalid camera position/lookAt/up
invalid fieldOfView
position == lookAt
forward parallel to up
invalid sphere radius
invalid sphere center
invalid background colors
controller dims != request.output dims
unknown fields present
custom background override
byte-equality with direct renderer
```

## Output

Write:

```text
docs/engineering/agents/reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md
```

The review must include:

```text
- Verdict:
  PASS
  PASS WITH OBSERVATIONS
  CHANGES REQUIRED
  BLOCKED

- Decision summary
- API contract assessment
- Validation-policy assessment
- Unknown-fields policy assessment
- Determinism/equivalence assessment
- Boundary matrix
- Findings table with severity:
  BLOCKER
  MAJOR
  MINOR
  NOTE
  PASS
- Required fixes before S1-010, if any
- Non-blocking observations/debt
- Recommendation for S1-010 contract evolution
- Authorization recommendation for S1-010
```

## Expected review stance

Be strict about contract boundaries.

Passing tests are not enough.

Look for:

```text
- hidden Canvas/UI leakage
- contract over-expansion
- under-specified validation
- permissive unknown-field risk
- aspect/dimension inconsistency
- unclear evolution path for light
- duplicated validation paths
- accidental runtime export surface growth
- drift toward scene plugins or generic engines
- stale conceptual docs vs implemented contract
```

## Suggested conclusion format

Use this final section:

```md
## Authorization recommendation

G7 <passes / does not pass>.

S1-009 RenderRequest v0 is <approved / not approved> as the renderer's declarative input contract.

This review <does / does not> recommend Product Authority authorization of S1-010.

S1-010 remains not authorized until Product Authority explicitly approves it.
```

````

Mensaje corto para Deep:

```text
Run UMBRA-REVIEW-006 — G7 RenderRequest v0 API Architecture + Boundary Review.

Use osk-architecture-review, osk-boundary-review, osk-verification-engineering, and light osk-adversarial-analysis.

Review S1-009 only. Do not implement code. Do not authorize S1-010. Write the G7 review artifact.
````
