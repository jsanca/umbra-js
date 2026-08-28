import { describe, expect, it } from 'vitest';
import {
  assertContextMatchesBuffer,
  createCanvasOutputAdapter,
  type ImageDataLike,
} from './canvas-output.js';
import {
  createPixelBuffer,
  fillPixelBuffer,
  PIXEL_CHANNELS,
} from '../core/pixel-buffer.js';

interface RecordingContext extends CanvasRenderingContext2D {
  __putImageDataCalls: Array<{ image: ImageDataLike; x: number; y: number }>;
}

function makeContext(width: number, height: number): RecordingContext {
  const calls: Array<{ image: ImageDataLike; x: number; y: number }> = [];
  const ctx = {
    canvas: { width, height } as unknown as HTMLCanvasElement,
    __putImageDataCalls: calls,
    putImageData(image: ImageDataLike, x: number, y: number) {
      calls.push({ image, x, y });
    },
  } as unknown as RecordingContext;
  return ctx;
}

function fakeImageDataFactory() {
  const calls: Array<{ data: Uint8ClampedArray; width: number; height: number }> = [];
  return {
    calls,
    factory: (data: Uint8ClampedArray, width: number, height: number): ImageDataLike => {
      const copy = new Uint8ClampedArray(data);
      calls.push({ data: copy, width, height });
      return { data: copy, width, height } as ImageDataLike;
    },
  };
}

describe('createCanvasOutputAdapter', () => {
  it('writes the buffer to the context via putImageData at (0, 0)', () => {
    const { factory, calls } = fakeImageDataFactory();
    const adapter = createCanvasOutputAdapter({ createImageData: factory });
    const ctx = makeContext(2, 2);
    const buffer = createPixelBuffer(2, 2);
    fillPixelBuffer(buffer, { r: 7, g: 8, b: 9, a: 10 });

    adapter.writeToContext(ctx, buffer);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      data: new Uint8ClampedArray([7, 8, 9, 10, 7, 8, 9, 10, 7, 8, 9, 10, 7, 8, 9, 10]),
      width: 2,
      height: 2,
    });
    expect(ctx.__putImageDataCalls).toHaveLength(1);
    const [call] = ctx.__putImageDataCalls;
    expect(call.x).toBe(0);
    expect(call.y).toBe(0);
    expect(call.image.width).toBe(2);
    expect(call.image.height).toBe(2);
    expect(call.image.data).toEqual(buffer.data);
  });

  it('rejects a buffer whose channel count is not 4', () => {
    const { factory } = fakeImageDataFactory();
    const adapter = createCanvasOutputAdapter({ createImageData: factory });
    const ctx = makeContext(1, 1);
    const fakeBuffer = {
      width: 1,
      height: 1,
      channels: 3,
      data: new Uint8ClampedArray(3),
    } as unknown as ReturnType<typeof createPixelBuffer>;
    expect(() => adapter.writeToContext(ctx, fakeBuffer)).toThrow(
      /expects 4-channel pixel buffer/,
    );
  });

  it('rejects a buffer whose dimensions do not match the canvas', () => {
    const { factory } = fakeImageDataFactory();
    const adapter = createCanvasOutputAdapter({ createImageData: factory });
    const ctx = makeContext(2, 2);
    const buffer = createPixelBuffer(1, 1);
    expect(() => adapter.writeToContext(ctx, buffer)).toThrow(
      /Canvas adapter dimension mismatch/,
    );
  });

  it('writes a non-empty RGBA buffer', () => {
    const { factory } = fakeImageDataFactory();
    const adapter = createCanvasOutputAdapter({ createImageData: factory });
    const ctx = makeContext(8, 4);
    const buffer = createPixelBuffer(8, 4);
    fillPixelBuffer(buffer, { r: 0x2a, g: 0x1b, b: 0x3d, a: 0xff });

    adapter.writeToContext(ctx, buffer);

    const image = ctx.__putImageDataCalls[0].image;
    expect(image.data.length).toBe(8 * 4 * PIXEL_CHANNELS);
    expect(Array.from(image.data.slice(0, 4))).toEqual([0x2a, 0x1b, 0x3d, 0xff]);
  });
});

describe('assertContextMatchesBuffer', () => {
  it('passes when canvas and buffer agree on dimensions', () => {
    const ctx = makeContext(4, 4);
    expect(() =>
      assertContextMatchesBuffer(ctx, createPixelBuffer(4, 4)),
    ).not.toThrow();
  });

  it('fails when dimensions disagree', () => {
    const ctx = makeContext(4, 4);
    expect(() => assertContextMatchesBuffer(ctx, createPixelBuffer(2, 2))).toThrow(
      /dimension mismatch/,
    );
  });
});
