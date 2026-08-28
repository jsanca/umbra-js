/**
 * Ray — a half-line defined by an origin and a direction, parameterized as
 * `origin + t * direction` for `t >= 0`.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - `createRay` stores the given origin and direction as-is; it does **not**
 *   normalize the direction. Callers that require a unit direction must apply
 *   `normalizeVec3` themselves (e.g. camera-ray generation in S1-005).
 * - `pointAtRay(ray, t)` returns the point at distance `t` along the ray.
 *   `t === 0` is the origin; negative `t` yields points "behind" the origin,
 *   which is well-defined arithmetic but a hit-testing slice (S1-007) will
 *   restrict to non-negative roots.
 */

import { addVec3, scaleVec3, type Vec3 } from './vec3.js';

export interface Ray {
  readonly origin: Vec3;
  readonly direction: Vec3;
}

export function createRay(origin: Vec3, direction: Vec3): Ray {
  return { origin, direction };
}

export function pointAtRay(ray: Ray, t: number): Vec3 {
  return addVec3(ray.origin, scaleVec3(ray.direction, t));
}
