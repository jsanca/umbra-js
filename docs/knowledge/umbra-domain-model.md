# Umbra Domain Model

Status: Sprint 1 model — implemented (S1-001 through S1-010); evidence in [ENGINEERING_LOG](../engineering/ENGINEERING_LOG.md) and per-slice reports.
Authority: [Sprint 1 product brief](../product/SPRINT-1-PRODUCT-BRIEF.md), [ADR-002](../adr/ADR-002-sprint-1-rendering-boundaries.md); implementation source under `src/core/`.

| Concept | Meaning in Sprint 1 | Ownership / boundary |
| --- | --- | --- |
| `Vec3` | Three-component value used for positions, directions, and vector arithmetic. The `VEC3_ZERO` and `VEC3_EPSILON` constants define the zero and tolerance policies. | Pure rendering core (`src/core/vec3.ts`) |
| `Ray` | Origin plus direction; parameter `t ≥ 0` identifies a point along it. The S1-004 store-verbatim direction policy means a `Ray` from `createRay` does not normalize the direction; callers that require a unit direction must normalize themselves (e.g. `generateRay` does so). | Pure rendering core (`src/core/ray.ts`) |
| `Camera` | Declarative `position`, `lookAt`, `up`, vertical `fieldOfView`, and derived basis (`forward`, `right`, `trueUp`, `halfWidth`, `halfHeight`). `generateRay(camera, u, v)` produces a unit-direction ray for viewport sample `(u, v)` under the screen convention `v = 0` top, `v = 1` bottom. | Pure rendering core (`src/core/camera.ts`) |
| `Sphere` | Center `Vec3` and positive radius `r`. Validated by `createSphere`. | Pure rendering core (`src/core/sphere.ts`) |
| `SphereHit` | `{ sphere, t, point }` for the nearest valid (non-negative) intersection, or `null` for a miss. The `t` is the chosen ray parameter; `point` is `ray.origin + t · ray.direction`. | Pure rendering core (`src/core/sphere.ts`) |
| `intersectSphere` | Solves the full quadratic `|origin + t·direction − center|² = r²` (`a = dot(direction, direction)`, `b = 2 dot(direction, oc)`, `c = dot(oc, oc) − r²`) and applies the nearest-valid-root policy: `t0 ≥ 0 → t0`; else `t1 ≥ 0 → t1` (origin inside); else `null` (behind camera). `−0` is normalized to `+0`. | Pure rendering core (`src/core/sphere.ts`) |
| Sphere normal | `computeSphereNormal(hit) = normalize(hit.point − hit.sphere.center)`. Because `intersectSphere` only returns hits on the surface (`|point − center| = r`), the result is unit and points outward. | Pure rendering core (`src/core/normal.ts`) |
| `PointLight` | `position: Vec3` and positive `intensity` (default `1`). `createPointLight` validates `intensity` (positive finite). Position finiteness is enforced by the request validator. | Pure rendering core (`src/core/light.ts`) |
| Light direction | `lightDirectionFromHit(light, hitPoint) = normalize(light.position − hitPoint)`. The S1-004 zero policy applies when `light.position === hitPoint` (caller bug). | Pure rendering core (`src/core/light.ts`) |
| Lambertian diffuse shading | `diffuseShadingColor(baseColor, normal, light, hitPoint)`: `t = max(0, dot(normal, lightDir)) * intensity`, then `channel = clampByte(round(baseColor.channel * t))`, alpha preserved. No distance attenuation, no specular, no shadow term, no material parameter. | Pure rendering core (`src/core/light.ts`) |
| Background gradient | `backgroundColorForDirection(direction, gradient)` reads only `direction.y` and lerps `bottom → top` per channel: `t = clamp01(0.5 * (direction.y + 1))`. Default `DEFAULT_BACKGROUND_GRADIENT = top 0x664db3, bottom 0x0c071f`. | Pure rendering core (`src/core/background-gradient.ts`) |
| `PixelBuffer` | Deterministic, owned color result produced by the core before Canvas presentation. `Uint8ClampedArray` of width × height × 4 bytes (RGBA). | Pure rendering core (`src/core/pixel-buffer.ts`) |
| Canvas output | Browser presentation of a completed `PixelBuffer` via `putImageData`. `createCanvasOutputAdapter` owns the only browser-API interaction in the adapter layer. | Canvas output adapter (`src/canvas/canvas-output.ts`) |
| `RenderRequest v0` | The DOM/Canvas-free declarative input contract: `output`, `camera`, `scene: { sphere, background?, light? }`. See the [API contract](umbra-api-contract.md). | Pure rendering core (`src/core/render-request.ts`) |
| Render diagnostics | Status, dimensions, elapsed render time, and result metadata recorded by `createRenderDiagnostics`. | Diagnostics adapter (`src/diagnostics/render-diagnostics.ts`) |
| Render controller | The single dual-dependency module: acquires a 2D context, calls the supplied `PixelBufferGenerator`, delegates the buffer write to the Canvas adapter, records timing/status, and projects the snapshot onto the UI. | Controller (`src/controller/render-controller.ts`) |
| UI shell | `mountShell` builds the static laboratory (header, viewport, status/dims/time, lesson, pipeline). | UI (`src/ui/shell.ts`) |

## Invariants (Sprint 1)

- A direction used for normal or lighting calculations follows the S1-004 normalization policy: `normalizeVec3(VEC3_ZERO) === VEC3_ZERO` (the documented zero policy, not `NaN`). `generateRay` produces a unit direction; `createRay` stores the caller's vector verbatim. `createCamera` and `intersectSphere` assume a non-zero direction; degenerate directions silently fall through to `null`/a zero-direction vector (CF-001 / G6-1).
- A ray/sphere miss yields `null`; a hit selected for visible rendering is the nearest valid non-negative distance (`t0 ≥ 0` wins over `t1 ≥ 0`; both negative → `null`).
- The same `RenderRequest v0` and output dimensions yield the same pixel buffer (deterministic; cross-instance equality asserted in tests).
- Core concepts (`src/core/**`) do not depend on DOM, Canvas, Vite, or UI types (ADR-002; verified by import inspection in every report's boundary matrix).
- `validateRenderRequest` is the single source of truth for shape and range errors in `RenderRequest v0`; it throws `RangeError` messages that name the failing field. Camera semantic degeneracy (`position == lookAt`, `forward ∥ up`) is delegated to `createCamera` (CF-005 / G7-2).
- `RenderRequest v0` is permissive about unknown fields at any level (ADR-003 / CF-004 / G7-1): unknown top-level and nested fields are accepted and ignored; required fields are validated strictly.

## References

- [API contract](umbra-api-contract.md)
- [Architecture overview](umbra-architecture-overview.md)
- [ADR-002 — Sprint 1 rendering boundaries](../adr/ADR-002-sprint-1-rendering-boundaries.md)
- [ADR-003 — RenderRequest v0 validation policy](../adr/ADR-003-render-request-v0-validation-policy.md)
- [Carry-forward backlog](../engineering/agents/tasks/backlog/UMBRA-CARRY-FORWARD.md)
- Per-slice reports: [S1-004](../engineering/agents/reports/UMBRA-S1-004-vec3-and-ray-primitives.md), [S1-005](../engineering/agents/reports/UMBRA-S1-005-camera-ray-generation.md), [S1-006](../engineering/agents/reports/UMBRA-S1-006-background-gradient-render.md), [S1-007](../engineering/agents/reports/UMBRA-S1-007-sphere-intersection.md), [S1-008](../engineering/agents/reports/UMBRA-S1-008-normal-based-shading.md), [S1-009](../engineering/agents/reports/UMBRA-S1-009-render-request-v0.md), [S1-010](../engineering/agents/reports/UMBRA-S1-010-point-light-diffuse-shading.md).