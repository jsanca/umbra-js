/**
 * Core pixel buffer type used between the pure rendering core, the render
 * controller, and the Canvas output adapter. See ADR-002 — this module must
 * not import DOM, Canvas, Vite, or UI types.
 */

export const PIXEL_CHANNELS = 4 as const;

export interface PixelBuffer {
  readonly width: number;
  readonly height: number;
  readonly channels: typeof PIXEL_CHANNELS;
  readonly data: Uint8ClampedArray;
}

export interface RgbaColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export function createPixelBuffer(width: number, height: number): PixelBuffer {
  assertPositiveInteger('width', width);
  assertPositiveInteger('height', height);
  const data = new Uint8ClampedArray(width * height * PIXEL_CHANNELS);
  return {
    width,
    height,
    channels: PIXEL_CHANNELS,
    data,
  };
}

export function fillPixelBuffer(buffer: PixelBuffer, color: RgbaColor): PixelBuffer {
  const { width, height, channels, data } = buffer;
  for (let i = 0; i < width * height; i += 1) {
    const base = i * channels;
    data[base] = color.r;
    data[base + 1] = color.g;
    data[base + 2] = color.b;
    data[base + 3] = color.a;
  }
  return buffer;
}

export function expectedBufferLength(width: number, height: number): number {
  return width * height * PIXEL_CHANNELS;
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(
      `UMBRA: pixel buffer ${name} must be a positive integer, received ${value}`,
    );
  }
}
