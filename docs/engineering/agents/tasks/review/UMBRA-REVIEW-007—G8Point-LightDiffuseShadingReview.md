

````md id="elz317"
# UMBRA-REVIEW-007 — G8 Point-Light Diffuse Shading Review

## Objective

Review S1-010 — Point-light diffuse shading before authorizing S1-011.

This is a lighting, API-evolution, verification, and boundary review. The goal is to determine whether S1-010 correctly adds minimal point-light diffuse shading without introducing shadows, materials, multiple primitives, UI controls, or renderer over-expansion.

## Responsible roles

- Engineering Reviewer
- QA Engineer

## Required skills

- osk-verification-engineering
- osk-boundary-review
- osk-architecture-review
- light osk-adversarial-analysis

## Inputs

- `docs/engineering/agents/reports/UMBRA-S1-010-point-light-diffuse-shading.md`
- `docs/engineering/agents/reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md`
- `docs/engineering/agents/reports/UMBRA-S1-009-render-request-v0.md`
- `docs/engineering/agents/reviews/UMBRA-S1-008-normal-based-shading-review.md`
- `docs/engineering/agents/reviews/UMBRA-S1-007-g6-sphere-intersection-review.md`
- `docs/engineering/agents/reports/hooks/<latest-s1-010-verify-report>.md`
- `docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png`
- `docs/adr/ADR-002-sprint-1-rendering-boundaries.md`
- `docs/engineering/agents/reviews/umbra-review-gates.md`
- `src/core/light.ts`
- `src/core/light.test.ts`
- `src/core/sphere-renderer.ts`
- `src/core/sphere-renderer.test.ts`
- `src/core/render-request.ts`
- `src/core/render-request.test.ts`
- `src/core/normal.ts`
- `src/core/sphere.ts`
- `src/core/camera.ts`
- `src/core/background-gradient.ts`
- `src/controller/render-controller.test.ts`
- `src/main.ts`

## Scope

Review only S1-010.

Do not implement code.  
Do not modify source.  
Do not authorize S1-011.  
Do not mark G8 or G9 as passed unless the review verdict explicitly supports G8.  
Do not introduce shadows, specular highlights, materials, multiple primitives, UI controls, WebGL, Canvas changes, or new dependencies.

## Context

S1-010 is expected to add minimal point-light diffuse shading to the existing ray tracer.

Before S1-010:

```text
miss -> backgroundColorForDirection(ray.direction)
hit  -> normalToRgbaColor(computeSphereNormal(hit))
````

After S1-010, expected behavior is approximately:

```text
miss -> backgroundColorForDirection(ray.direction)
hit  -> diffuse sphere color using point light
```

The expected diffuse term is:

```text
normal = computeSphereNormal(hit)
lightDirection = normalize(light.position - hit.point)
diffuse = max(0, dot(normal, lightDirection)) * intensity
```

The result should visually read as a shaded sphere: lit region near the light direction, dark region where the surface faces away from the light, with the background gradient preserved on misses.

## Review questions

### A. Lighting math

1. Is point-light diffuse shading implemented correctly?

   Expected core formula:

   ```text
   normal = normalize(hit.point - sphere.center)
   lightDirection = normalize(light.position - hit.point)
   diffuse = max(0, dot(normal, lightDirection)) * intensity
   ```

2. Is the diffuse term clamped or otherwise bounded to avoid invalid color output?

3. Is the behavior correct when:

   ```text
   dot(normal, lightDirection) > 0
   dot(normal, lightDirection) = 0
   dot(normal, lightDirection) < 0
   light is at the hit point
   intensity is missing/defaulted
   intensity is zero/negative/non-finite
   ```

4. Does the implementation avoid adding specular highlights, shadows, reflection, ambient occlusion, or materials beyond the S1-010 scope?

5. Does the visual result match expected diffuse behavior: one side/region lit, opposite side dark, no cast shadows?

### B. RenderRequest evolution

6. Was `scene.light` added as a minimal additive contract field?

   Expected shape, unless the implementation chose a documented alternative:

   ```ts
   light?: {
     position: Vec3Like;
     intensity?: number;
   }
   ```

7. Is `scene.light` optional so existing S1-009 requests remain valid?

8. Is the default light behavior documented and tested?

9. Is `light.position` validated as a finite `Vec3Like`?

10. Is `light.intensity` validated as positive finite if provided?

11. Does S1-010 preserve the existing `output`, `camera`, `scene.sphere`, and `scene.background` contract?

12. Does the unknown-field policy from G7 remain unchanged and explicitly tracked?

13. Does `validateRenderRequest` clearly handle light validation, or is semantic validation still split between request validation and core conversion?

### C. Render behavior

14. Does `createSphereRenderGenerator` or equivalent preserve:

```text
hit -> diffuse shaded color
miss -> background gradient
one ray per pixel
pixel-center convention
deterministic output
fresh buffer per call
```

15. Do render/request integration tests prove that:

```text
lit pixels differ from unlit pixels
miss pixels still equal the background gradient
old requests without explicit light still render deterministically
custom light affects hit shading
custom background affects misses only
```

16. Does the S1-010 output remain deterministic and byte-stable for the fixed scene?

### D. Boundary and scope

17. Does `src/core/` remain free of DOM, Canvas, Vite, and UI imports?

18. Does `render-request.ts` remain a Canvas-free contract module?

19. Is `src/main.ts` still only a composition root?

20. Did the implementation avoid:

```text
shadows
materials
specular
multiple primitives
BVH
anti-aliasing
UI controls
new dependencies
WebGL/WebGPU
```

21. Did it avoid turning `RenderRequest v0` into a generic scene DSL?

### E. Visual evidence

22. Confirm screenshot exists:

```text
docs/engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png
```

23. Visually assess whether the screenshot shows:

```text
- a sphere over the violet background gradient
- diffuse light falloff over the sphere
- dark side where surface faces away from the point light
- no cast shadow
- no accidental full black canvas or flat color regression
```

24. If the reviewer cannot decode pixels from the screenshot, state that honestly and rely on deterministic pixel assertions as primary evidence.

### F. Carry-forward observations

25. Confirm whether these remain open and non-blocking unless S1-010 explicitly addressed them:

```text
G6-1: zero-direction ray guard in intersectSphere
G6-3: PixelBufferGenerator type placement
S1-008-2: normalToRgbaColor NaN hardening
G7-1: unknown-field policy decision
G7-2: validateRenderRequest semantic degeneracy clarification
G7-5: knowledge docs stale
```

26. Decide whether any carry-forward issue should block S1-011.

## Required evidence

The reviewer must re-run or verify:

```bash
npm run typecheck
npm run test:run
npx vitest run src/core/light.test.ts
npx vitest run src/core/render-request.test.ts
npm run verify
```

If test file names differ, use the actual S1-010 test files and record the difference.

The reviewer must inspect source directly, not only the report:

```text
src/core/light.ts
src/core/light.test.ts
src/core/sphere-renderer.ts
src/core/sphere-renderer.test.ts
src/core/render-request.ts
src/core/render-request.test.ts
src/main.ts
```

The reviewer must inspect imports in `src/core/` and confirm no DOM/Canvas/Vite/UI leakage.

The reviewer must independently reason through these adversarial cases:

```text
light in front of surface
light behind surface
dot(normal, lightDirection) = 0
light at hit point
negative intensity
zero intensity
NaN / Infinity intensity
invalid light position
request without light
request with custom light
miss keeps background gradient
hit does not use normal color directly anymore
```

## Output

Write:

```text
docs/engineering/agents/reviews/UMBRA-S1-010-g8-point-light-diffuse-shading-review.md
```

The review must include:

```text
- Verdict:
  PASS
  PASS WITH OBSERVATIONS
  CHANGES REQUIRED
  BLOCKED

- Decision summary
- Lighting math assessment
- RenderRequest light-contract assessment
- Validation-policy assessment
- Determinism/render behavior assessment
- Boundary matrix
- Visual evidence assessment
- Findings table with severity:
  BLOCKER
  MAJOR
  MINOR
  NOTE
  PASS
- Required fixes before S1-011, if any
- Non-blocking observations/debt
- Authorization recommendation for S1-011
```

## Expected review stance

Be strict about lighting scope and contract evolution.

Passing tests are not enough.

Look for:

```text
- diffuse formula mistakes
- wrong light direction vector
- unclamped color overflow
- black hemisphere that is correct vs black hemisphere from bug
- accidental shadow/specular/material implementation
- request contract over-expansion
- missing validation for light
- existing requests broken by mandatory light
- DOM/Canvas leakage into core
- stale reports or stale AGENTS.md state
```

## Suggested conclusion format

Use this final section:

```md
## Authorization recommendation

G8 <passes / does not pass>.

S1-010 point-light diffuse shading is <approved / not approved>.

This review <does / does not> recommend Product Authority authorization of S1-011.

S1-011 remains not authorized until Product Authority explicitly approves it.
```

````

Mensaje corto para Deep:

```text id="b59l1c"
Run UMBRA-REVIEW-007 — G8 Point-Light Diffuse Shading Review.

Use osk-verification-engineering, osk-boundary-review, osk-architecture-review, and light osk-adversarial-analysis.

Review S1-010 only. Do not implement code. Do not authorize S1-011. Write the G8 review artifact and include the S1-010 screenshot evidence.
````

Y sí: esa imagen se ve como lo esperado para este slice. Hay iluminación difusa sobre la esfera, pero no “sombras” físicas proyectadas. Es más correcto decir:

```text id="ymxkvo"
sphere with diffuse lighting
```

que:

```text id="kzlsli"
sphere with shadows
```
