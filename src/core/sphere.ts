/**
 * Sphere primitive and ray–sphere intersection for the S1-007 hit/miss
 * selection.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Intersection math
 *
 * A ray `P(t) = origin + t·direction` (with `t ≥ 0`) intersects the sphere of
 * center `C` and radius `r` when `|P(t) − C|² = r²`. Substituting and letting
 * `oc = origin − C` yields the quadratic
 *
 *     (direction·direction) t² + 2 (direction·oc) t + (oc·oc − r²) = 0
 *
 * whose coefficients are `a = dot(direction, direction)`,
 * `b = 2 dot(direction, oc)`, and `c = dot(oc, oc) − r²`. The discriminant
 * `D = b² − 4 a c` classifies the outcome:
 *
 * - `D <  0`  → no real roots → **miss**.
 * - `D =  0`  → one repeated root (grazing) → **tangent hit** at
 *   `t = −dot(direction, oc) / a`.
 * - `D >  0`  → two distinct roots `t0 ≤ t1`.
 *
 * ## Nearest valid root policy
 *
 * With roots ordered `t0 ≤ t1`:
 *
 * - If `t0 ≥ 0` the nearer entry root is the hit.
 * - Else if `t1 ≥ 0` the ray origin is inside the sphere; the exit root `t1`
 *   is the hit (the entry root lies behind the origin and is discarded).
 * - Else both roots lie behind the origin → **miss** (the sphere is entirely
 *   behind the camera in the ray's direction).
 *
 * The returned `SphereHit.t` is the chosen parameter and `.point` is
 * `ray.origin + t · ray.direction` (via `pointAtRay`). The full quadratic is
 * used (no assumption that the direction is unit-length), so the function is
 * correct for any non-zero direction; the Sprint 1 caller (`generateRay`)
 * always supplies a unit direction.
 *
 * ## Numeric tolerance
 *
 * The discriminant is compared against zero exactly; no discriminant epsilon
 * is introduced. Hit-point world-space comparisons in tests use the S1-004
 * default `VEC3_EPSILON = 1e-6`.
 */

import { dotVec3, subtractVec3, type Vec3 } from './vec3.js';
import { pointAtRay, type Ray } from './ray.js';

export interface Sphere {
  readonly center: Vec3;
  readonly radius: number;
}

export interface SphereHit {
  readonly sphere: Sphere;
  /** The nearest non-negative ray parameter at the intersection point. */
  readonly t: number;
  /** World-space point `ray.origin + t · ray.direction`. */
  readonly point: Vec3;
}

export function createSphere(center: Vec3, radius: number): Sphere {
  if (
    !Number.isFinite(center.x) ||
    !Number.isFinite(center.y) ||
    !Number.isFinite(center.z)
  ) {
    throw new RangeError(
      `UMBRA: sphere center must have finite coordinates, received (${center.x}, ${center.y}, ${center.z})`,
    );
  }
  if (!Number.isFinite(radius) || radius <= 0) {
    throw new RangeError(
      `UMBRA: sphere radius must be a positive finite number, received ${radius}`,
    );
  }
  return { center, radius };
}

export function intersectSphere(sphere: Sphere, ray: Ray): SphereHit | null {
  const oc = subtractVec3(ray.origin, sphere.center);
  const a = dotVec3(ray.direction, ray.direction);
  const b = 2 * dotVec3(ray.direction, oc);
  const c = dotVec3(oc, oc) - sphere.radius * sphere.radius;
  const D = b * b - 4 * a * c;
  if (D < 0) {
    return null;
  }
  const sqrtD = Math.sqrt(D);
  const t0 = (-b - sqrtD) / (2 * a);
  const t1 = (-b + sqrtD) / (2 * a);
  let t: number;
  if (t0 >= 0) {
    t = t0;
  } else if (t1 >= 0) {
    t = t1;
  } else {
    return null;
  }
  // Normalize -0 to +0 so callers and tests can compare against the
  // documented exact-zero tangent value without sign ambiguity.
  if (t === 0) {
    t = 0;
  }
  return { sphere, t, point: pointAtRay(ray, t) };
}