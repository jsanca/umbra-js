/**
 * Sphere normal computation and normal-based color mapping for S1-008 shading.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - `computeSphereNormal(hit)` returns the unit outward normal at the hit
 *   point: `normalize(hit.point − hit.sphere.center)`. Because
 *   `intersectSphere` only returns hits whose point lies on the sphere
 *   surface (`|point − center| = r`), the raw difference has length `r`;
 *   normalizing yields a unit vector pointing away from the sphere center.
 * - `normalToRgbaColor(normal)` maps the normal's three components to RGB by
 *   the canonical visualization `t = clamp01(0.5 * (n + 1))` per channel,
 *   scaled to `[0, 255]` and rounded. Alpha is always `0xff`. The mapping is
 *   deterministic.
 * - **Cardinal colors** (exact, asserted by tests):
 *     - `(+x) → (255, 128, 128, 255)`
 *     - `(−x) → (  0, 128, 128, 255)`
 *     - `(+y) → (128, 255, 128, 255)`
 *     - `(−y) → (128,   0, 128, 255)`
 *     - `(+z) → (128, 128, 255, 255)`
 *     - `(−z) → (128, 128,   0, 255)`
 * - The input to `normalToRgbaColor` is expected to be the unit vector
 *   returned by `computeSphereNormal`; non-unit inputs are tolerated because
 *   the channel clamp prevents out-of-range bytes.
 *
 * ## Numeric tolerance
 *
 * - Vector equality uses `VEC3_EPSILON = 1e-6` (S1-004 default).
 * - Color channels are exact 8-bit integers; the cardinal cases are exact by
 *   arithmetic, and the non-cardinal test normal `(1/√3, 1/√3, 1/√3)` maps to
 *   the exact integer `(201, 201, 201, 255)` (the scaled value
 *   `201.112...` rounds to `201`, which is not on a `.5` rounding boundary
 *   and therefore stable under IEEE-754 double precision).
 */

import { normalizeVec3, subtractVec3, type Vec3 } from './vec3.js';
import type { SphereHit } from './sphere.js';
import type { RgbaColor } from './pixel-buffer.js';

export function computeSphereNormal(hit: SphereHit): Vec3 {
  return normalizeVec3(subtractVec3(hit.point, hit.sphere.center));
}

export function normalToRgbaColor(normal: Vec3): RgbaColor {
  return {
    r: channelFor(normal.x),
    g: channelFor(normal.y),
    b: channelFor(normal.z),
    a: 0xff,
  };
}

function channelFor(component: number): number {
  const t = Math.min(1, Math.max(0, 0.5 * (component + 1)));
  return Math.round(t * 255);
}