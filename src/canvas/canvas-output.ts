/**
 * Canvas 2D output adapter. Per ADR-002, this is the only module permitted to
 * touch `CanvasRenderingContext2D`. It accepts an already-computed pixel buffer
 * from the controller and pushes it onto a 2D context via `putImageData`. It
 * performs no math and no I/O; all behavior is deterministic over its inputs.
 */

import { PIXEL_CHANNELS, type PixelBuffer } from '../core/pixel-buffer.js';

export interface CanvasOutputAdapter {
  writeToContext(ctx: CanvasRenderingContext2D, buffer: PixelBuffer): void;
}

export interface ImageDataLike {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace?: PredefinedColorSpace;
}

export type ImageDataFactory = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => ImageDataLike;

export function createCanvasOutputAdapter(options: {
  readonly createImageData?: ImageDataFactory;
} = {}): CanvasOutputAdapter {
  const createImageData: ImageDataFactory =
    options.createImageData ?? defaultCreateImageData;

  return {
    writeToContext(ctx, buffer) {
      assertDimensions(ctx, buffer);
      const imageData = createImageData(buffer.data, buffer.width, buffer.height);
      ctx.putImageData(imageData as ImageData, 0, 0);
    },
  };
}

export function assertContextMatchesBuffer(
  ctx: CanvasRenderingContext2D,
  buffer: PixelBuffer,
): void {
  assertDimensions(ctx, buffer);
}

function assertDimensions(ctx: CanvasRenderingContext2D, buffer: PixelBuffer): void {
  if (buffer.channels !== PIXEL_CHANNELS) {
    throw new Error(
      `UMBRA: Canvas adapter expects ${PIXEL_CHANNELS}-channel pixel buffer, received ${buffer.channels}`,
    );
  }
  if (ctx.canvas.width !== buffer.width || ctx.canvas.height !== buffer.height) {
    throw new Error(
      `UMBRA: Canvas adapter dimension mismatch (canvas ${ctx.canvas.width}x${ctx.canvas.height}, buffer ${buffer.width}x${buffer.height})`,
    );
  }
}

function defaultCreateImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ImageDataLike {
  const owned = new Uint8ClampedArray(data);
  return new ImageData(owned, width, height);
}
