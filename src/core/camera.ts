/**
 * Camera and camera-ray generation for the pure rendering core.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - **Vertical field of view.** `fov` is the *vertical* field of view, in radians.
 *   The horizontal extent is derived from `aspect` as `aspect * tan(fov / 2)`.
 * - **Viewport convention.** `(u, v)` uses screen coordinates with `u, v ∈ [0, 1]`:
 *   `u = 0` is the left edge, `u = 1` is the right edge, `v = 0` is the top edge,
 *   `v = 1` is the bottom edge. The center is `(0.5, 0.5)`.
 * - **Pinhole model.** The viewport is a unit-distance plane in front of the
 *   camera (camera-local `z = -1`). A pinhole camera at the eye position
 *   generates one ray per `(u, v)` pixel.
 * - **World basis.** With `f = normalize(lookAt - position)`, the right vector is
 *   `r = normalize(cross(f, up))` and the re-orthogonalized up vector is
 *   `t = normalize(cross(r, f))`. `up` defaults to `VEC3_UP = (0, 1, 0)`.
 * - **Camera ray direction.** For a pixel at `(u, v)`:
 *
 *       ndcX = 2u - 1
 *       ndcY = 1 - 2v                   (screen convention: v=0 is top)
 *       dir  = normalize(ndcX * halfWidth  * r
 *                      + ndcY * halfHeight * t
 *                      + f)               (camera-local z=-1 → world +f)
 *
 * - **Center ray.** At `(0.5, 0.5)` the direction reduces to `f`. This is the
 *   documented contract test value (TC-S1-014).
 * - **Degenerate inputs.** `createCamera` throws a `RangeError` when
 *   `position === lookAt` (forward undefined) or when `f` is parallel to `up`
 *   (right undefined). The error message names the failure so callers can
 *   surface a precise reason. These checks honor the S1-004 zero policy:
 *   `normalizeVec3(VEC3_ZERO) === VEC3_ZERO`, so the test is `approxEqualsVec3`
 *   against the zero vector with the documented `VEC3_EPSILON` tolerance.
 * - **Direction policy.** `generateRay` normalizes the resulting direction, so
 *   the returned `Ray` always carries a unit direction (unlike the raw
 *   `createRay` from S1-004, which preserves the caller's vector verbatim).
 *   The S1-004 un-normalized-direction policy is honored by `pointAtRay`, which
 *   is a pure linear function over the ray's stored direction.
 *
 * ## Numeric tolerance
 *
 * The same `VEC3_EPSILON = 1e-6` default used by `approxEqualsVec3` is the
 * documented tolerance for ray-direction comparisons. The deterministic
 * center/corner ray tests in `src/core/camera.test.ts` assert directions to
 * this tolerance.
 */

import { createRay, pointAtRay, type Ray } from './ray.js';
import {
  addVec3,
  approxEqualsVec3,
  createVec3,
  crossVec3,
  normalizeVec3,
  scaleVec3,
  subtractVec3,
  VEC3_EPSILON,
  VEC3_ZERO,
  type Vec3,
} from './vec3.js';

/** The default world-up vector `(0, 1, 0)`. Frozen so it can be safely shared. */
export const VEC3_UP: Vec3 = Object.freeze({ x: 0, y: 1, z: 0 });

/** The default viewport center `(0.5, 0.5)`. */
export const VIEWPORT_CENTER = Object.freeze({ u: 0.5, v: 0.5 });

/** Documented viewport sample coordinates for downstream slices (S1-006). */
export const VIEWPORT_SAMPLES = Object.freeze({
  topLeft: { u: 0, v: 0 },
  topRight: { u: 1, v: 0 },
  bottomLeft: { u: 0, v: 1 },
  bottomRight: { u: 1, v: 1 },
  center: { u: 0.5, v: 0.5 },
  upperThird: { u: 0.5, v: 1 / 3 },
  lowerThird: { u: 0.5, v: 2 / 3 },
});

export interface CameraConfig {
  readonly position: Vec3;
  readonly lookAt: Vec3;
  readonly up?: Vec3;
  readonly fov: number;
  readonly aspect: number;
}

export interface Camera {
  readonly position: Vec3;
  readonly lookAt: Vec3;
  readonly up: Vec3;
  readonly fov: number;
  readonly aspect: number;
  /** `normalize(lookAt - position)`. Unit-length. */
  readonly forward: Vec3;
  /** `normalize(cross(forward, up))`. Unit-length, perpendicular to `forward` and `up`. */
  readonly right: Vec3;
  /** `normalize(cross(right, forward))`. Unit-length, perpendicular to `forward` and `right`. */
  readonly trueUp: Vec3;
  /** `aspect * tan(fov / 2)`. Half-width of the viewport at camera-local `z = -1`. */
  readonly halfWidth: number;
  /** `tan(fov / 2)`. Half-height of the viewport at camera-local `z = -1`. */
  readonly halfHeight: number;
}

export function createCamera(config: CameraConfig): Camera {
  const { position, lookAt } = config;
  const up = config.up ?? VEC3_UP;
  const { fov, aspect } = config;

  if (!Number.isFinite(fov) || fov <= 0 || fov >= Math.PI) {
    throw new RangeError(
      `UMBRA: camera fov must be in (0, π) radians, received ${fov}`,
    );
  }
  if (!Number.isFinite(aspect) || aspect <= 0) {
    throw new RangeError(
      `UMBRA: camera aspect must be a positive finite number, received ${aspect}`,
    );
  }

  const forward = normalizeVec3(subtractVec3(lookAt, position));
  if (approxEqualsVec3(forward, VEC3_ZERO, VEC3_EPSILON)) {
    throw new RangeError(
      'UMBRA: camera position equals lookAt; forward direction is undefined',
    );
  }

  const right = normalizeVec3(crossVec3(forward, up));
  if (approxEqualsVec3(right, VEC3_ZERO, VEC3_EPSILON)) {
    throw new RangeError(
      'UMBRA: camera forward is parallel to up; right direction is undefined',
    );
  }

  const trueUp = normalizeVec3(crossVec3(right, forward));
  if (approxEqualsVec3(trueUp, VEC3_ZERO, VEC3_EPSILON)) {
    throw new RangeError(
      'UMBRA: camera basis collapsed; trueUp direction is undefined',
    );
  }

  const halfHeight = Math.tan(fov / 2);
  const halfWidth = aspect * halfHeight;

  return {
    position,
    lookAt,
    up,
    fov,
    aspect,
    forward,
    right,
    trueUp,
    halfWidth,
    halfHeight,
  };
}

/**
 * Generate the ray for the viewport sample `(u, v)` under screen convention
 * (`u = 0` left, `u = 1` right; `v = 0` top, `v = 1` bottom).
 *
 * `u` and `v` are clamped to `[0, 1]`; values outside that range are accepted
 * but produce off-screen rays (documented; the math is identical to in-screen
 * sampling, only the inputs change).
 */
export function generateRay(camera: Camera, u: number, v: number): Ray {
  assertSample('u', u);
  assertSample('v', v);

  const ndcX = 2 * u - 1;
  const ndcY = 1 - 2 * v;

  const horizontal = scaleVec3(camera.right, ndcX * camera.halfWidth);
  const vertical = scaleVec3(camera.trueUp, ndcY * camera.halfHeight);
  const direction = normalizeVec3(addVec3(addVec3(horizontal, vertical), camera.forward));

  return createRay(camera.position, direction);
}

function assertSample(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `UMBRA: camera sample ${name} must be a finite number, received ${value}`,
    );
  }
}

/**
 * Convenience helper for tests and downstream slices: project a viewport sample
 * `(u, v)` onto the world-space point at distance `t` along its generated ray.
 * Equivalent to `pointAtRay(generateRay(camera, u, v), t)` but computes both
 * in one step using the camera's precomputed basis.
 */
export function pointAtCameraSample(
  camera: Camera,
  u: number,
  v: number,
  t: number,
): Vec3 {
  return pointAtRay(generateRay(camera, u, v), t);
}

/** Convenience: returns `true` when `u` and `v` are both in `[0, 1]`. */
export function isInViewport(u: number, v: number): boolean {
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

/** Re-export so downstream slices can construct sample `Vec3`s without re-importing vec3. */
export { createVec3 };