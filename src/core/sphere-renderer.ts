/**
 * Sphere render composition for S1-010: combines sphere-hit detection with
 * optional point-light Lambertian diffuse shading (when `options.light` is
 * provided), normal-based shading otherwise, and the S1-006 background
 * gradient for misses.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - For each pixel, generates one camera ray via `generateRay`, tests it with
 *   `intersectSphere`, and writes one of:
 *   - On a **hit with no light**: `normalToRgbaColor(computeSphereNormal(hit))`.
 *     This is the S1-008 normal visualization; it preserves byte-equality
 *     with the pre-S1-010 render path so requests without `scene.light`
 *     remain unchanged (the G7 carry-forward guarantee).
 *   - On a **hit with a light**: `diffuseShadingColor(baseColor, normal, light, hit.point)`,
 *     where `baseColor` is the S1-008 normal color. The Lambertian factor is
 *     `max(0, dot(normal, lightDirection)) * light.intensity`, clamped to
 *     `[0, 255]` per channel.
 *   - On a **miss**: `backgroundColorForDirection(ray.direction, background)`.
 * - The pixel-center convention and `(u, v)` screen convention are inherited
 *   from S1-005 (camera), S1-006 (background), and S1-007 (sphere
 *   intersection). The nearest-valid-root policy is unchanged.
 * - `options.background` overrides the S1-006 default gradient; `options.light`
 *   adds the S1-010 additive Lambertian term. Both are independent.
 */

import {
  createPixelBuffer,
  PIXEL_CHANNELS,
  type PixelBuffer,
  type RgbaColor,
} from './pixel-buffer.js';
import {
  backgroundColorForDirection,
  DEFAULT_BACKGROUND_GRADIENT,
  type BackgroundGradient,
} from './background-gradient.js';
import { generateRay, type Camera } from './camera.js';
import { diffuseShadingColor, type PointLight } from './light.js';
import { computeSphereNormal, normalToRgbaColor } from './normal.js';
import { intersectSphere, type Sphere, type SphereHit } from './sphere.js';
import type { PixelBufferGenerator } from './smoke-generator.js';

export interface SphereRenderOptions {
  readonly background?: BackgroundGradient;
  readonly light?: PointLight;
}

export function createSphereRenderGenerator(
  camera: Camera,
  sphere: Sphere,
  options: SphereRenderOptions = {},
): PixelBufferGenerator {
  const background = options.background ?? DEFAULT_BACKGROUND_GRADIENT;
  const light = options.light;
  return (width, height) => {
    const buffer = createPixelBuffer(width, height);
    for (let y = 0; y < height; y += 1) {
      const v = (y + 0.5) / height;
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        const color = hit ? litHitColor(hit, light) : backgroundColorForDirection(ray.direction, background);
        writePixel(buffer, x, y, color);
      }
    }
    return buffer;
  };
}

function litHitColor(hit: SphereHit, light: PointLight | undefined): RgbaColor {
  const normal = computeSphereNormal(hit);
  const baseColor = normalToRgbaColor(normal);
  return light ? diffuseShadingColor(baseColor, normal, light, hit.point) : baseColor;
}

function writePixel(buffer: PixelBuffer, x: number, y: number, color: RgbaColor): void {
  const base = (y * buffer.width + x) * PIXEL_CHANNELS;
  buffer.data[base] = color.r;
  buffer.data[base + 1] = color.g;
  buffer.data[base + 2] = color.b;
  buffer.data[base + 3] = color.a;
}