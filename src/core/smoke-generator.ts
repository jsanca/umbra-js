/**
 * Trivial fixed-color pixel generator for the S1-003 smoke path. The generator
 * fills the requested buffer with a single solid color so that the end-to-end
 * render path (controller → Canvas adapter) can be verified before any
 * ray-tracing math exists. See ADR-002 — this module must not import DOM,
 * Canvas, Vite, or UI types.
 */

import {
  createPixelBuffer,
  fillPixelBuffer,
  type PixelBuffer,
  type RgbaColor,
} from './pixel-buffer.js';

export type PixelBufferGenerator = (width: number, height: number) => PixelBuffer;

/**
 * Solid fill color for the S1-003 smoke render. Uses a deep violet aligned with
 * the Stitch `--umbra-primary` / `--umbra-on-primary` palette so the rendered
 * viewport is visibly distinct from the empty page background but still
 * tasteful inside the dark surface.
 */
export const SMOKE_FILL_COLOR: RgbaColor = Object.freeze({
  r: 0x2a,
  g: 0x1b,
  b: 0x3d,
  a: 0xff,
});

export function createSolidColorGenerator(color: RgbaColor = SMOKE_FILL_COLOR): PixelBufferGenerator {
  return (width: number, height: number) => {
    const buffer = createPixelBuffer(width, height);
    fillPixelBuffer(buffer, color);
    return buffer;
  };
}
