# Umbra Sprint 1 Render Pipeline

Status: Implemented Sprint 1 flow. This page describes the fixed, directly lit sphere scene already in the application; it does not define Sprint 2 rendering features.

Authority: [`src/main.ts`](../../src/main.ts), [`src/core/render-request.ts`](../../src/core/render-request.ts), [RenderRequest API contract](umbra-api-contract.md), and the S1-003 through S1-010 reports and reviews.

## Flow

```text
RenderRequest v0
  → validate and convert to core values
  → request PixelBufferGenerator
  → one camera ray per output pixel
  → ray/sphere intersection
  → hit: normal visualization or Lambertian diffuse light
  → miss: vertical background gradient
  → PixelBuffer (RGBA)
  → render controller + diagnostics
  → Canvas output adapter (ImageData / putImageData)
```

`src/main.ts` supplies the fixed `RenderRequest v0`: a 640 × 400 output, a camera at the origin looking along negative Z, a sphere centered at `(0, 0, -3)` with radius `1`, and a point light at `(0, 5, -2)` with intensity `1`. The default violet-to-near-black background applies because the request omits a custom background. Exact fields and validation are owned by the [API contract](umbra-api-contract.md).

## Per-pixel behavior

`createRequestRenderGenerator` first validates the request and converts its declarative values into core types. The resulting generator requires the same dimensions declared by `request.output`; a mismatch throws rather than silently changing the scene.

For each pixel, the sphere renderer samples the camera at the pixel center and obtains a unit ray direction. A miss is colored with `backgroundColorForDirection`, which uses the direction's Y component. A hit computes an outward unit sphere normal. Requests without `scene.light` preserve the earlier normal-to-RGBA visualization. The implemented fixed scene includes a light, so hit pixels use Lambertian diffuse shading; back-facing pixels can be black. The completed RGBA bytes are held in an owned `PixelBuffer` before presentation.

The controller obtains the 2D context, invokes the generator, delegates presentation to `createCanvasOutputAdapter`, and publishes status, dimensions, and elapsed time through diagnostics. The UI shell is presentation only; it does not participate in the rendering math.

## Evidence and limits

Core output is covered by deterministic tests and the visual appearance is supplemented by the retained [S1-006](../engineering/agents/reviews/evidence/UMBRA-S1-006-background-gradient-render.png), [S1-007](../engineering/agents/reviews/evidence/UMBRA-S1-007-sphere-render.png), and [S1-010](../engineering/agents/reviews/evidence/UMBRA-S1-010-point-light-diffuse-shading.png) screenshots. These screenshots are manual visual evidence, not automated browser pixel assertions. See the [verification strategy](../engineering/umbra-verification-strategy.md) for the evidence boundary.

Shadows, materials, distance attenuation, additional primitives, textures, sampling, scene graphs, and output targets beyond Canvas are not implemented in Sprint 1. They must remain future work unless separately authorized.

## References

- [Architecture overview](umbra-architecture-overview.md)
- [Domain model](umbra-domain-model.md)
- [Math primer](umbra-math-primer-sprint-1.md)
- [RenderRequest API contract](umbra-api-contract.md)
