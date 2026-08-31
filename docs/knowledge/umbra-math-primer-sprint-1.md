# Umbra Sprint 1 Math Primer

Status: Implemented concepts only. This is a guide to the mathematics exercised by Sprint 1 code and tests, not a specification for future rendering features.

Authority: [`src/core/`](../../src/core/), [domain model](umbra-domain-model.md), and the S1-004 through S1-010 implementation reports.

## Vectors and rays

A `Vec3` represents a position or direction. Dot products measure directional alignment; normalization produces a unit vector when its length is non-zero. Sprint 1 deliberately defines normalization of the zero vector as `VEC3_ZERO`, avoiding `NaN`; callers needing a geometric ray direction must still provide a non-zero direction.

A ray is `p(t) = origin + t × direction`. `createRay` keeps the provided direction unchanged, while `generateRay` produces unit directions from a camera. The visible ray interval uses `t ≥ 0`.

## Camera rays

`createCamera` derives a forward/right/up basis from `position`, `lookAt`, optional `up`, vertical field of view, and output aspect ratio. `generateRay(camera, u, v)` maps a viewport sample to a unit ray; `v = 0` is the top of the screen and `v = 1` is the bottom. A zero forward vector or an up vector parallel to forward is invalid when the camera is created.

## Sphere intersection and normal

For a sphere centered at `center` with radius `r`, the renderer solves:

```text
|origin + t × direction − center|² = r²
```

The resulting quadratic has coefficients `a = dot(direction, direction)`, `b = 2 × dot(direction, origin − center)`, and `c = dot(origin − center, origin − center) − r²`. Sprint 1 selects the nearest non-negative root: first `t0`, then `t1` for a ray that begins inside the sphere; if neither is non-negative, the result is a miss.

For a hit, the outward normal is `normalize(hit.point − sphere.center)`. The Sprint 1 renderer either maps that normal directly into RGB for the no-light path or supplies it to the lighting calculation.

## Background and direct light

The background uses `direction.y` to interpolate from bottom to top: `t = clamp01(0.5 × (direction.y + 1))`. The default colors are violet at the top and near-black at the bottom.

The optional point light uses a normalized vector from hit point toward light. Diffuse intensity is:

```text
t = max(0, dot(normal, lightDirection)) × intensity
```

Each base-color channel is multiplied by `t`, rounded, and clamped to a byte. There is no distance attenuation, specular term, material model, or shadow test in Sprint 1.

## Intentional edge-case limits

`intersectSphere` returns a miss for a zero-direction ray rather than reporting an explicit error, and `normalToRgbaColor` does not add a dedicated `NaN` hardening guard. These are documented carry-forward items, not hidden mathematical guarantees. Request validation checks shape and ranges; camera semantic degeneracy is detected later during `createCamera` conversion. See [CF-001, CF-003, and CF-005](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md).

## References

- [Domain model](umbra-domain-model.md)
- [Render pipeline](umbra-render-pipeline-sprint-1.md)
- [RenderRequest API contract](umbra-api-contract.md)
- [Carry-forward backlog](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md)
