import { describe, expect, it } from 'vitest';
import {
  backgroundColorForDirection,
  createBackgroundGradientGenerator,
  DEFAULT_BACKGROUND_GRADIENT,
} from './background-gradient.js';
import { createCamera, generateRay } from './camera.js';
import { createVec3, VEC3_ZERO } from './vec3.js';
import { PIXEL_CHANNELS, type PixelBuffer } from './pixel-buffer.js';

const TOP = { r: 0x66, g: 0x4d, b: 0xb3, a: 0xff };
const BOTTOM = { r: 0x0c, g: 0x07, b: 0x1f, a: 0xff };
const HORIZON = { r: 0x39, g: 0x2a, b: 0x69, a: 0xff };

function sampleCamera() {
  return createCamera({
    position: VEC3_ZERO,
    lookAt: createVec3(0, 0, -1),
    fov: Math.PI / 3,
    aspect: 16 / 10,
  });
}

function pixelAt(buffer: PixelBuffer, x: number, y: number) {
  const base = (y * buffer.width + x) * PIXEL_CHANNELS;
  return {
    r: buffer.data[base],
    g: buffer.data[base + 1],
    b: buffer.data[base + 2],
    a: buffer.data[base + 3],
  };
}

describe('DEFAULT_BACKGROUND_GRADIENT', () => {
  it('documents the top and bottom colors', () => {
    expect(DEFAULT_BACKGROUND_GRADIENT.top).toEqual(TOP);
    expect(DEFAULT_BACKGROUND_GRADIENT.bottom).toEqual(BOTTOM);
  });

  it('keeps every channel inside the 8-bit range with a fully opaque alpha', () => {
    for (const color of [DEFAULT_BACKGROUND_GRADIENT.top, DEFAULT_BACKGROUND_GRADIENT.bottom]) {
      for (const channel of [color.r, color.g, color.b, color.a]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
      expect(color.a).toBe(0xff);
    }
  });
});

describe('backgroundColorForDirection', () => {
  it('resolves a straight-up direction (y = +1) to the top color', () => {
    expect(backgroundColorForDirection(createVec3(0, 1, 0))).toEqual(TOP);
  });

  it('resolves a straight-down direction (y = -1) to the bottom color', () => {
    expect(backgroundColorForDirection(createVec3(0, -1, 0))).toEqual(BOTTOM);
  });

  it('resolves a horizon direction (y = 0) to the midpoint blend', () => {
    expect(backgroundColorForDirection(createVec3(0, 0, -1))).toEqual(HORIZON);
  });

  it('reads only the vertical component of the direction', () => {
    const a = backgroundColorForDirection(createVec3(0.2, 0.4, 0.8));
    const b = backgroundColorForDirection(createVec3(-0.9, 0.4, 0.1));
    expect(a).toEqual(b);
  });

  it('is monotonically lighter for directions that point higher', () => {
    const up = backgroundColorForDirection(createVec3(0, 0.6, 0));
    const down = backgroundColorForDirection(createVec3(0, -0.6, 0));
    expect(up.r).toBeGreaterThan(down.r);
    expect(up.g).toBeGreaterThan(down.g);
    expect(up.b).toBeGreaterThan(down.b);
    expect(up.a).toBe(down.a);
  });

  it('clamps out-of-range vertical components to the top/bottom colors', () => {
    expect(backgroundColorForDirection(createVec3(0, 5, 0))).toEqual(TOP);
    expect(backgroundColorForDirection(createVec3(0, -5, 0))).toEqual(BOTTOM);
  });

  it('is deterministic for a repeated input', () => {
    const direction = createVec3(0.1, -0.3, 0.95);
    expect(backgroundColorForDirection(direction)).toEqual(backgroundColorForDirection(direction));
  });

  it('keeps every channel within [0, 255] across a sweep of vertical components', () => {
    for (let y = -2; y <= 2; y += 0.1) {
      const color = backgroundColorForDirection(createVec3(0, y, 0));
      for (const channel of [color.r, color.g, color.b, color.a]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('createBackgroundGradientGenerator', () => {
  it('returns a generator that fills the requested dimensions and RGBA stride', () => {
    const generator = createBackgroundGradientGenerator(sampleCamera());
    const buffer = generator(8, 6);

    expect(buffer.width).toBe(8);
    expect(buffer.height).toBe(6);
    expect(buffer.channels).toBe(PIXEL_CHANNELS);
    expect(buffer.data.length).toBe(8 * 6 * PIXEL_CHANNELS);
  });

  it('writes one ray per pixel, matching the documented gradient contract exactly', () => {
    const camera = sampleCamera();
    const generator = createBackgroundGradientGenerator(camera);
    const buffer = generator(8, 6);

    for (let y = 0; y < 6; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 6;
        const expected = backgroundColorForDirection(generateRay(camera, u, v).direction);
        expect(pixelAt(buffer, x, y)).toEqual(expected);
      }
    }
  });

  it('produces a lighter top row than bottom row (vertical gradient)', () => {
    const generator = createBackgroundGradientGenerator(sampleCamera());
    const buffer = generator(8, 6);
    const top = pixelAt(buffer, 4, 0);
    const bottom = pixelAt(buffer, 4, 5);
    expect(top.g).toBeGreaterThan(bottom.g);
    expect(top.b).toBeGreaterThan(bottom.b);
  });

  it('writes a fully opaque alpha for every pixel', () => {
    const generator = createBackgroundGradientGenerator(sampleCamera());
    const buffer = generator(8, 6);
    for (let i = 3; i < buffer.data.length; i += PIXEL_CHANNELS) {
      expect(buffer.data[i]).toBe(0xff);
    }
  });

  it('is deterministic across generator instances', () => {
    const camera = sampleCamera();
    const a = createBackgroundGradientGenerator(camera)(8, 6);
    const b = createBackgroundGradientGenerator(camera)(8, 6);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('returns a fresh buffer per call (no shared state)', () => {
    const generator = createBackgroundGradientGenerator(sampleCamera());
    const a = generator(4, 4);
    const b = generator(4, 4);
    expect(a.data).not.toBe(b.data);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });
});
