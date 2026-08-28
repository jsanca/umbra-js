import { describe, expect, it } from 'vitest';
import {
  createPixelBuffer,
  expectedBufferLength,
  fillPixelBuffer,
  PIXEL_CHANNELS,
} from './pixel-buffer.js';

describe('PIXEL_CHANNELS', () => {
  it('is 4 (RGBA)', () => {
    expect(PIXEL_CHANNELS).toBe(4);
  });
});

describe('createPixelBuffer', () => {
  it('creates a buffer with the requested dimensions and RGBA stride', () => {
    const buffer = createPixelBuffer(3, 2);
    expect(buffer.width).toBe(3);
    expect(buffer.height).toBe(2);
    expect(buffer.channels).toBe(4);
    expect(buffer.data).toBeInstanceOf(Uint8ClampedArray);
    expect(buffer.data.length).toBe(expectedBufferLength(3, 2));
    expect(buffer.data.length).toBe(24);
  });

  it('initializes the buffer to all zeros (transparent black)', () => {
    const buffer = createPixelBuffer(2, 2);
    for (const byte of buffer.data) {
      expect(byte).toBe(0);
    }
  });

  it('rejects non-integer dimensions', () => {
    expect(() => createPixelBuffer(1.5, 2)).toThrow(RangeError);
    expect(() => createPixelBuffer(2, NaN)).toThrow(RangeError);
  });

  it('rejects non-positive dimensions', () => {
    expect(() => createPixelBuffer(0, 2)).toThrow(/width must be a positive integer/);
    expect(() => createPixelBuffer(2, 0)).toThrow(/height must be a positive integer/);
    expect(() => createPixelBuffer(-1, 2)).toThrow(RangeError);
  });
});

describe('fillPixelBuffer', () => {
  it('writes the same RGBA color to every pixel', () => {
    const buffer = createPixelBuffer(2, 2);
    fillPixelBuffer(buffer, { r: 10, g: 20, b: 30, a: 40 });

    const expected = new Uint8ClampedArray([
      10, 20, 30, 40,
      10, 20, 30, 40,
      10, 20, 30, 40,
      10, 20, 30, 40,
    ]);
    expect(buffer.data).toEqual(expected);
  });

  it('overwrites previous buffer contents', () => {
    const buffer = createPixelBuffer(1, 1);
    fillPixelBuffer(buffer, { r: 1, g: 2, b: 3, a: 4 });
    fillPixelBuffer(buffer, { r: 9, g: 9, b: 9, a: 9 });
    expect(Array.from(buffer.data)).toEqual([9, 9, 9, 9]);
  });
});

describe('expectedBufferLength', () => {
  it('matches width * height * 4', () => {
    expect(expectedBufferLength(640, 400)).toBe(640 * 400 * 4);
    expect(expectedBufferLength(1, 1)).toBe(4);
  });
});
