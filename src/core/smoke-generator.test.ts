import { describe, expect, it } from 'vitest';
import { createSolidColorGenerator, SMOKE_FILL_COLOR } from './smoke-generator.js';
import { createPixelBuffer, PIXEL_CHANNELS } from './pixel-buffer.js';

describe('SMOKE_FILL_COLOR', () => {
  it('is a fully-opaque deep violet (0x2a1b3dff)', () => {
    expect(SMOKE_FILL_COLOR).toEqual({ r: 0x2a, g: 0x1b, b: 0x3d, a: 0xff });
  });
});

describe('createSolidColorGenerator', () => {
  it('returns a generator that fills the requested dimensions with the smoke color', () => {
    const generator = createSolidColorGenerator();
    const buffer = generator(4, 3);

    expect(buffer.width).toBe(4);
    expect(buffer.height).toBe(3);
    expect(buffer.channels).toBe(PIXEL_CHANNELS);
    expect(buffer.data.length).toBe(4 * 3 * PIXEL_CHANNELS);

    for (let i = 0; i < buffer.data.length; i += PIXEL_CHANNELS) {
      expect(buffer.data[i]).toBe(SMOKE_FILL_COLOR.r);
      expect(buffer.data[i + 1]).toBe(SMOKE_FILL_COLOR.g);
      expect(buffer.data[i + 2]).toBe(SMOKE_FILL_COLOR.b);
      expect(buffer.data[i + 3]).toBe(SMOKE_FILL_COLOR.a);
    }
  });

  it('produces a non-empty (all-non-zero) RGBA buffer', () => {
    const buffer = createSolidColorGenerator()(2, 2);
    let nonZero = 0;
    for (const byte of buffer.data) {
      if (byte !== 0) nonZero += 1;
    }
    expect(nonZero).toBe(buffer.data.length);
  });

  it('accepts an override color', () => {
    const generator = createSolidColorGenerator({ r: 1, g: 2, b: 3, a: 4 });
    const buffer = generator(1, 1);
    expect(Array.from(buffer.data)).toEqual([1, 2, 3, 4]);
  });

  it('returns a fresh buffer each call (no shared state)', () => {
    const generator = createSolidColorGenerator();
    const a = generator(1, 1);
    const b = generator(1, 1);
    expect(a.data).not.toBe(b.data);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('creates a buffer even when the input is the plain factory output', () => {
    const generator = createSolidColorGenerator();
    const manual = createPixelBuffer(2, 2);
    manual.data.fill(0x2a);
    const generated = generator(2, 2);
    expect(generated.width).toBe(manual.width);
    expect(generated.height).toBe(manual.height);
    expect(generated.data.length).toBe(manual.data.length);
  });
});
