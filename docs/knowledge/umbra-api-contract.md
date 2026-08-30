# Umbra RenderRequest API Contract v0

Status: Implemented (S1-009 through S1-010; verified by G7 and G8)
Authority: [Sprint 1 product brief](../product/SPRINT-1-PRODUCT-BRIEF.md), [ADR-002](../adr/ADR-002-sprint-1-rendering-boundaries.md), [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md); implementation evidence in [S1-009 report](../engineering/agents/reports/UMBRA-S1-009-render-request-v0.md) and [S1-010 report](../engineering/agents/reports/UMBRA-S1-010-point-light-diffuse-shading.md).

## Purpose

Define a declarative render input that can evolve without exposing Canvas or UI concerns to the rendering core. The v0 contract is the source of truth for `RenderRequestV0` as implemented in `src/core/render-request.ts`; the implementation is authoritative and this page tracks it.

## Shape

`RenderRequest v0` contains three top-level fields. Each field is a documented plain-data object; no DOM/Canvas/Vite/UI types appear in the contract.

| Field | Contents | v0 rule |
| --- | --- | --- |
| `output` | `width`, `height` | Positive integer pixel dimensions. `camera.aspect` is derived as `output.width / output.height` (not a contract field). |
| `camera` | `position`, `lookAt`, `up?`, `fieldOfView` | Pinhole config. `fieldOfView` is vertical, in radians, must be in the open interval `(0, π)`. `up` is optional and defaults to `(0, 1, 0)`. Degenerate inputs (`position == lookAt`, `forward ∥ up`) are delegated to `createCamera` during conversion — see [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md) and the validator scope note below. |
| `scene` | `sphere`, `background?`, `light?` | A single sphere is the only geometric primitive; `background` is an optional gradient (defaults to `DEFAULT_BACKGROUND_GRADIENT`); `light` is an optional point light (defaults to absent; requests without a light are byte-equal to the S1-008 normal-visualization path). |

### Sub-types

- `Vec3Like` — `{ x, y, z }` (all three finite numbers).
- `ColorLike` — `{ r, g, b }`. Channels are finite numbers in `[0, 255]` (integer-or-float, the core rounds internally). Alpha is always fully opaque in v0 and the conversion fills `a = 0xff`.
- `BackgroundGradientLike` — `{ top: ColorLike, bottom: ColorLike }`.
- `SphereConfig` — `{ center: Vec3Like, radius: number }`. Radius must be a positive finite number.
- `PointLightConfig` — `{ position: Vec3Like, intensity?: number }`. Position must be finite; intensity is optional and defaults to `1` when omitted; intensity, if provided, must be a positive finite number.

## Validator scope and behavior

`validateRenderRequest(request: unknown)` is the single source of truth for *shape and range* errors. It throws `RangeError` with a message naming the failing field for any violation (for example: `UMBRA: render request scene.light.intensity must be a positive finite number, received NaN`).

- `output.width`, `output.height` — positive integers (rejects `0`, negative, non-integer, `NaN`, `Infinity`).
- `camera.position`, `camera.lookAt`, `camera.up` — finite coordinates.
- `camera.fieldOfView` — finite, in the open interval `(0, π)`.
- `scene.sphere.center` — finite coordinates.
- `scene.sphere.radius` — positive finite.
- `scene.background.top`, `scene.background.bottom` — finite channels in `[0, 255]`.
- `scene.light.position` — finite coordinates.
- `scene.light.intensity` — positive finite (when provided; defaults to `1`).

Two degenerate camera conditions (`position == lookAt`; `forward ∥ up`) are **not** surfaced by `validateRenderRequest`; they are validated by `createCamera` during the request-to-core conversion and throw at that point. This split is recorded as carry-forward CF-005 (G7-2).

The validator is **permissive about unknown fields**: top-level and nested fields that are not part of the documented shape are accepted and ignored. This is a deliberate forward-compatibility decision recorded in [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md); it is tracked as carry-forward CF-004 (G7-1) for a hardening pass that may introduce an explicit strict mode or `version` signal.

The validation is the same function called by `createRequestRenderGenerator` before any core conversion, so callers do not need to validate separately.

## Conversion and render entry point

`createRequestRenderGenerator(request: RenderRequestV0)` validates, converts the request into core values via existing factories (`createCamera`, `createSphere`, `createPointLight`), composes them with `createSphereRenderGenerator`, and returns a `PixelBufferGenerator` whose buffer dimensions are fixed by `request.output`. The controller must invoke the generator with matching `(width, height)`; otherwise the generator throws a `RangeError` identifying the dimension mismatch.

On a hit:
- Without `scene.light` → `normalToRgbaColor(computeSphereNormal(hit))` (byte-equal to S1-008/009).
- With `scene.light` → `diffuseShadingColor(baseColor, normal, light, hit.point)` (Lambertian: `t = max(0, dot(normal, lightDirection)) * intensity`, per-channel round + clamp).

On a miss → `backgroundColorForDirection(ray.direction, background)` (the S1-006 background gradient, default `DEFAULT_BACKGROUND_GRADIENT`).

## Evolution boundary

The v0 contract is deliberately declarative and minimal. Later features — additional primitives (planes, boxes, triangles), materials, shadows, reflections, refractions, textures, soft light, sampling, export, additional output targets, additional light types — require an approved additive contract decision; they must not be implied by unused fields in Sprint 1. A hardening pass may add a strict mode or explicit `version` field without breaking v0 callers, per [ADR-003](../adr/ADR-003-render-request-v0-validation-policy.md).

## Verification targets

- Equivalent valid requests render deterministically (byte-equal buffers for structurally equivalent inputs).
- Invalid dimensions, out-of-range camera fields, out-of-range sphere radius, malformed background colors, malformed `scene.light`, and unknown *required* fields follow documented outcomes (`RangeError` messages naming the field).
- The contract is independent of DOM and Canvas types (verified by import inspection and the runtime export-surface test in `render-request.test.ts`).

## Worked example — the Sprint 1 fixed scene

The composition root `src/main.ts` constructs the following `RenderRequest v0` and passes it through `createRequestRenderGenerator` to the render controller:

```ts
const request: RenderRequestV0 = {
  output: { width: 640, height: 400 },
  camera: {
    position: { x: 0, y: 0, z: 0 },
    lookAt:   { x: 0, y: 0, z: -1 },
    fieldOfView: Math.PI / 3,
  },
  scene: {
    sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
    light:  { position: { x: 0, y: 5, z: -2 }, intensity: 1 },
  },
};
```

- `camera.aspect` is derived as `640 / 400 = 1.6`.
- `scene.background` is omitted, so the default `DEFAULT_BACKGROUND_GRADIENT` is used (`top = 0x664db3`, `bottom = 0x0c071f`; horizon `(0,0,−1)` → `(0x39, 0x2a, 0x69)`).
- `scene.light.intensity` defaults to `1`.
- A render call yields a `640 × 400` buffer where hit pixels use the Lambertian diffuse shading (lit region facing `(0, 5, −2)`, back hemisphere black) and miss pixels use the violet→near-black gradient.

### Equivalence example — a request without a light

The S1-009 fixed-scene request (no `scene.light`) is byte-equal to the direct S1-008 sphere renderer for the same camera, sphere, and default background:

```ts
const noLightRequest: RenderRequestV0 = {
  output: { width: 640, height: 400 },
  camera: { position: { x: 0,0,0 }, lookAt: { x: 0,0,−1 }, fieldOfView: Math.PI / 3 },
  scene:  { sphere: { center: { x: 0,0,−3 }, radius: 1 } },
};
```

This byte-equality is asserted by `render-request.test.ts` ("produces a byte-equal buffer to the direct sphere renderer for the fixed scene") and is the load-bearing guarantee behind the S1-009/S1-010 additive evolution: existing callers without `scene.light` keep their visual output when new fields are introduced.

## References

- [ADR-002 — Sprint 1 rendering boundaries](../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [ADR-003 — RenderRequest v0 validation policy](../adr/ADR-003-render-request-v0-validation-policy.md)
- [Sprint 1 architecture overview](umbra-architecture-overview.md)
- [Domain model](umbra-domain-model.md)
- [S1-009 implementation report](../engineering/agents/reports/UMBRA-S1-009-render-request-v0.md)
- [S1-010 implementation report](../engineering/agents/reports/UMBRA-S1-010-point-light-diffuse-shading.md)
- [G7 review](../engineering/agents/reviews/UMBRA-S1-009-g7-render-request-api-boundary-review.md)
- [G8 review](../engineering/agents/reviews/UMBRA-S1-010-g8-point-light-diffuse-shading-review.md)
- [Carry-forward backlog](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md) (CF-004, CF-005)