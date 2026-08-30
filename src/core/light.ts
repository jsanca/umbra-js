/**
 * Point-light data and Lambertian diffuse shading for the S1-010 first-light
 * render.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - `PointLight` is a pure value: a position in world space and a positive
 *   `intensity` multiplier (default `1`). `createPointLight` validates that the
 *   intensity is a positive finite number; the position is expected to be
 *   finite (the request validator enforces finiteness for the request path).
 * - `lightDirectionFromHit(light, hitPoint)` returns the unit direction
 *   pointing from the hit point to the light:
 *   `normalizeVec3(subtractVec3(light.position, hitPoint))`. The S1-004 zero
 *   policy applies when `light.position === hitPoint` (direction collapses to
 *   `VEC3_ZERO`); this is a degenerate caller bug, not a shading concern.
 * - `diffuseShadingColor(baseColor, normal, light, hitPoint)` computes the
 *   Lambertian factor `t = max(0, dot(normal, lightDirection)) * intensity`
 *   and returns the base material color scaled by `t`, with each channel
 *   rounded and clamped to `[0, 255]`. Alpha is preserved from `baseColor`.
 *   The base material color for Sprint 1 is the S1-008 normal visualization
 *   (`normalToRgbaColor(computeSphereNormal(hit))`), so the lit hit color is
 *   the normal color modulated by the diffuse factor.
 *
 * ## Numeric tolerance
 *
 * - The Lambertian factor `t` is a floating-point product. Channel
 *   computation uses `Math.round` + `clamp01`-to-`[0,255]`; the result is a
 *   deterministic integer byte.
 * - The test suite covers cardinal directions (`dot ∈ {0, 1, -1}`) and
 *   intensity overflow; non-cardinal directions are covered by consistency
 *   assertions (re-derive the expected from the documented formula).
 */

import {
  dotVec3,
  normalizeVec3,
  subtractVec3,
  type Vec3,
} from './vec3.js';
import type { RgbaColor } from './pixel-buffer.js';

export interface PointLight {
  readonly position: Vec3;
  readonly intensity: number;
}

export function createPointLight(
  position: Vec3,
  intensity: number = 1,
): PointLight {
  if (!Number.isFinite(intensity) || intensity <= 0) {
    throw new RangeError(
      `UMBRA: point light intensity must be a positive finite number, received ${intensity}`,
    );
  }
  return { position, intensity };
}

export function lightDirectionFromHit(light: PointLight, hitPoint: Vec3): Vec3 {
  return normalizeVec3(subtractVec3(light.position, hitPoint));
}

export function diffuseShadingColor(
  baseColor: RgbaColor,
  normal: Vec3,
  light: PointLight,
  hitPoint: Vec3,
): RgbaColor {
  const lightDir = lightDirectionFromHit(light, hitPoint);
  const t = Math.max(0, dotVec3(normal, lightDir)) * light.intensity;
  return {
    r: clampByte(Math.round(baseColor.r * t)),
    g: clampByte(Math.round(baseColor.g * t)),
    b: clampByte(Math.round(baseColor.b * t)),
    a: baseColor.a,
  };
}

function clampByte(value: number): number {
  return Math.min(255, Math.max(0, value));
}