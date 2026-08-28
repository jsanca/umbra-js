/**
 * Vec3 — the pure three-component vector vocabulary for the rendering core.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types. All
 * operations are pure functions that return a new `Vec3` and never mutate their
 * inputs; `Vec3` values are immutable by convention (`readonly` fields).
 *
 * ## Semantics and numeric tolerance
 *
 * - All comparisons use `approxEqualsVec3`, which defaults to the tolerance
 *   `VEC3_EPSILON = 1e-6`. Use it for any test or future slice that compares
 *   floating-point vector results (e.g. `normalizeVec3`, `crossVec3`).
 * - `normalizeVec3` of the zero vector returns `VEC3_ZERO` (the documented zero
 *   policy), rather than throwing or producing `NaN`. Non-zero vectors return a
 *   unit-length vector in the same direction.
 * - `divideVec3` throws a `RangeError` when the divisor is `0`, so a silent
 *   `Infinity`/`NaN` value cannot propagate through the math.
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** The additive identity vector. Frozen so it can be safely shared. */
export const VEC3_ZERO: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });

/** Default tolerance for approximate vector equality comparisons. */
export const VEC3_EPSILON = 1e-6;

export function createVec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subtractVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function negateVec3(v: Vec3): Vec3 {
  return { x: -v.x, y: -v.y, z: -v.z };
}

export function scaleVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function divideVec3(v: Vec3, s: number): Vec3 {
  if (s === 0) {
    throw new RangeError('UMBRA: cannot divide a vector by zero');
  }
  return { x: v.x / s, y: v.y / s, z: v.z / s };
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function crossVec3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function lengthSquaredVec3(v: Vec3): number {
  return dotVec3(v, v);
}

export function lengthVec3(v: Vec3): number {
  return Math.sqrt(lengthSquaredVec3(v));
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = lengthVec3(v);
  if (len === 0) {
    return VEC3_ZERO;
  }
  return divideVec3(v, len);
}

export function approxEqualsVec3(
  a: Vec3,
  b: Vec3,
  epsilon: number = VEC3_EPSILON,
): boolean {
  return (
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.z - b.z) <= epsilon
  );
}
