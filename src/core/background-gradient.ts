/**
 * Deterministic background gradient for the S1-006 first visual render.
 *
 * Maps the vertical component of a camera ray's unit direction to an opaque
 * RGBA color by linear interpolation between a `bottom` and a `top` color.
 * This is the classic sky gradient: a ray pointing straight up resolves to the
 * top color, a ray pointing straight down resolves to the bottom color, and a
 * ray pointing at the horizon resolves to the midpoint. Only the vertical
 * component of the direction is read, so the gradient is symmetric about the
 * camera's trueUp axis.
 *
 * Per ADR-002, this module must not import DOM, Canvas, Vite, or UI types.
 *
 * ## Semantics
 *
 * - `backgroundColorForDirection(direction, gradient)` computes the blend
 *   factor `t = 0.5 * (direction.y + 1)` (clamped to `[0, 1]`) and returns
 *   `lerp(bottom, top, t)` channel-by-channel. `direction` is expected to be
 *   the unit direction produced by `generateRay`; non-unit inputs are tolerated
 *   (only `direction.y` is read) but may clamp at the top/bottom colors.
 * - `createBackgroundGradientGenerator(camera, gradient)` returns a
 *   `PixelBufferGenerator` that samples one camera ray per pixel. Pixel `(x, y)`
 *   maps to the viewport sample `u = (x + 0.5) / width`, `v = (y + 0.5) / height`
 *   (pixel-center convention), and the color for that ray is written into the
 *   `PixelBuffer` at the same coordinates.
 * - Channels are blended in floating point, rounded with `Math.round`, and
 *   clamped to `[0, 255]`, so the result is a deterministic integer color.
 */

import {
  createPixelBuffer,
  PIXEL_CHANNELS,
  type PixelBuffer,
  type RgbaColor,
} from './pixel-buffer.js';
import { generateRay, type Camera } from './camera.js';
import type { Vec3 } from './vec3.js';
import type { PixelBufferGenerator } from './smoke-generator.js';

export interface BackgroundGradient {
  readonly top: RgbaColor;
  readonly bottom: RgbaColor;
}

/**
 * Default Sprint 1 sky gradient. Top is a bright violet (`0x664db3`), bottom is
 * a near-black violet (`0x0c071f`). The horizon (`direction.y === 0`) resolves
 * to the midpoint `(0x39, 0x2a, 0x69)`.
 */
export const DEFAULT_BACKGROUND_GRADIENT: BackgroundGradient = Object.freeze({
  top: Object.freeze({ r: 0x66, g: 0x4d, b: 0xb3, a: 0xff }),
  bottom: Object.freeze({ r: 0x0c, g: 0x07, b: 0x1f, a: 0xff }),
});

export function backgroundColorForDirection(
  direction: Vec3,
  gradient: BackgroundGradient = DEFAULT_BACKGROUND_GRADIENT,
): RgbaColor {
  const t = clamp01(0.5 * (direction.y + 1));
  return {
    r: blendChannel(gradient.bottom.r, gradient.top.r, t),
    g: blendChannel(gradient.bottom.g, gradient.top.g, t),
    b: blendChannel(gradient.bottom.b, gradient.top.b, t),
    a: blendChannel(gradient.bottom.a, gradient.top.a, t),
  };
}

export function createBackgroundGradientGenerator(
  camera: Camera,
  gradient: BackgroundGradient = DEFAULT_BACKGROUND_GRADIENT,
): PixelBufferGenerator {
  return (width, height) => {
    const buffer = createPixelBuffer(width, height);
    for (let y = 0; y < height; y += 1) {
      const v = (y + 0.5) / height;
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const ray = generateRay(camera, u, v);
        writePixel(buffer, x, y, backgroundColorForDirection(ray.direction, gradient));
      }
    }
    return buffer;
  };
}

function blendChannel(from: number, to: number, t: number): number {
  return clampChannel(Math.round(from + (to - from) * t));
}

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function writePixel(buffer: PixelBuffer, x: number, y: number, color: RgbaColor): void {
  const base = (y * buffer.width + x) * PIXEL_CHANNELS;
  buffer.data[base] = color.r;
  buffer.data[base + 1] = color.g;
  buffer.data[base + 2] = color.b;
  buffer.data[base + 3] = color.a;
}
