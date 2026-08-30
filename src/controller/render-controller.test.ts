import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRenderController } from './render-controller.js';
import {
  createPixelBuffer,
  fillPixelBuffer,
  PIXEL_CHANNELS,
  type PixelBuffer,
} from '../core/pixel-buffer.js';
import type { ImageDataLike } from '../canvas/canvas-output.js';
import { backgroundColorForDirection, createBackgroundGradientGenerator } from '../core/background-gradient.js';
import { computeSphereNormal, normalToRgbaColor } from '../core/normal.js';
import { createSphereRenderGenerator } from '../core/sphere-renderer.js';
import { createSphere, intersectSphere } from '../core/sphere.js';
import { createCamera, generateRay } from '../core/camera.js';
import { createVec3, VEC3_ZERO } from '../core/vec3.js';

interface FakeTarget {
  canvas: HTMLCanvasElement;
  statusElement: HTMLElement;
  dimsElement: HTMLElement;
  timeElement?: HTMLElement;
}

interface FakeContext {
  canvas: HTMLCanvasElement;
  putImageDataCalls: Array<{ image: ImageDataLike; x: number; y: number }>;
  putImageData(image: ImageDataLike, x: number, y: number): void;
}

interface Harness {
  target: FakeTarget;
  context: FakeContext;
  status: HTMLParagraphElement;
  dims: HTMLParagraphElement;
  time: HTMLParagraphElement;
}

function makeHarness(width = 8, height = 4): Harness {
  const ctx: FakeContext = {
    canvas: { width, height } as unknown as HTMLCanvasElement,
    putImageDataCalls: [],
    putImageData(image, x, y) {
      this.putImageDataCalls.push({ image, x, y });
    },
  };

  const fakeCanvas = {
    width,
    height,
    getContext(kind: string): FakeContext | null {
      if (kind === '2d') return ctx;
      return null;
    },
  } as unknown as HTMLCanvasElement;

  const status = document.createElement('p');
  const dims = document.createElement('p');
  const time = document.createElement('p');

  return {
    target: {
      canvas: fakeCanvas,
      statusElement: status,
      dimsElement: dims,
      timeElement: time,
    },
    context: ctx,
    status,
    dims,
    time,
  };
}

function scriptedClock(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[Math.min(i, values.length - 1)];
    i += 1;
    return value;
  };
}

function passthroughGenerator(): (width: number, height: number) => PixelBuffer {
  return (width, height) => {
    const buffer = createPixelBuffer(width, height);
    fillPixelBuffer(buffer, { r: 0xaa, g: 0xbb, b: 0xcc, a: 0xff });
    return buffer;
  };
}

describe('createRenderController — initial state', () => {
  it('writes an idle status, dimensions, and em-dash render time on construction', () => {
    const h = makeHarness();
    createRenderController({
      target: h.target,
      width: 8,
      height: 4,
    });

    expect(h.status.textContent).toBe('Ready');
    expect(h.dims.textContent).toBe('8 \u00d7 4');
    expect(h.time.textContent).toBe('\u2014');
  });

  it('rejects a canvas whose dimensions do not match the requested width/height', () => {
    const h = makeHarness(16, 16);
    expect(() =>
      createRenderController({ target: h.target, width: 8, height: 4 }),
    ).toThrow(/controller target canvas/);
  });
});

describe('createRenderController — render()', () => {
  it('returns complete diagnostics with measured render time', () => {
    const h = makeHarness();
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([100, 142.5]),
      generator: passthroughGenerator(),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('complete');
    expect(result.diagnostics.width).toBe(8);
    expect(result.diagnostics.height).toBe(4);
    expect(result.diagnostics.renderTimeMs).toBeCloseTo(42.5, 5);
    expect(result.buffer).not.toBeNull();
    expect(result.buffer?.width).toBe(8);
    expect(result.buffer?.height).toBe(4);
  });

  it('writes the buffer to the canvas via the Canvas adapter', () => {
    const h = makeHarness();
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: passthroughGenerator(),
    });

    controller.render();

    expect(h.context.putImageDataCalls).toHaveLength(1);
    const call = h.context.putImageDataCalls[0];
    expect(call.x).toBe(0);
    expect(call.y).toBe(0);
    expect(call.image.width).toBe(8);
    expect(call.image.height).toBe(4);
    expect(call.image.data.length).toBe(8 * 4 * PIXEL_CHANNELS);
    expect(Array.from(call.image.data.slice(0, 4))).toEqual([
      0xaa, 0xbb, 0xcc, 0xff,
    ]);
  });

  it('updates the status region to the rendered completion text', () => {
    const h = makeHarness();
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 12.345]),
      generator: passthroughGenerator(),
    });

    controller.render();

    expect(h.status.textContent).toBe('Rendered 8 \u00d7 4 in 12.35 ms');
    expect(h.dims.textContent).toBe('8 \u00d7 4');
    expect(h.time.textContent).toBe('12.35 ms');
  });

  it('omits the render time element when the target has none', () => {
    const h = makeHarness();
    const partial: FakeTarget = {
      canvas: h.target.canvas,
      statusElement: h.status,
      dimsElement: h.dims,
    };
    const controller = createRenderController({
      target: partial,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 5]),
      generator: passthroughGenerator(),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('complete');
    expect(h.status.textContent).toMatch(/Rendered 8 \u00d7 4/);
    expect(h.dims.textContent).toBe('8 \u00d7 4');
  });

  it('records error diagnostics and surfaces the error message in the status region', () => {
    const h = makeHarness();
    const failingGenerator = (): PixelBuffer => {
      throw new Error('generator exploded');
    };

    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 5]),
      generator: failingGenerator,
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('error');
    expect(result.diagnostics.errorMessage).toBe('generator exploded');
    expect(result.buffer).toBeNull();
    expect(h.status.textContent).toBe('Render failed: generator exploded');
    expect(h.context.putImageDataCalls).toHaveLength(0);
  });

  it('records error diagnostics when the canvas cannot supply a 2D context', () => {
    const noopCanvas = {
      width: 8,
      height: 4,
      getContext(): null {
        return null;
      },
    } as unknown as HTMLCanvasElement;

    const status = document.createElement('p');
    const dims = document.createElement('p');
    const controller = createRenderController({
      target: {
        canvas: noopCanvas,
        statusElement: status,
        dimsElement: dims,
      },
      width: 8,
      height: 4,
      clock: scriptedClock([0, 5]),
      generator: passthroughGenerator(),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('error');
    expect(result.diagnostics.errorMessage).toMatch(/Canvas 2D context/);
    expect(result.buffer).toBeNull();
    expect(status.textContent).toMatch(/Render failed: .*Canvas 2D context/);
  });

  it('delegates Canvas writes to the injected adapter', () => {
    const h = makeHarness();
    const calls: Array<{ ctx: unknown; buffer: PixelBuffer }> = [];
    const customAdapter = {
      writeToContext(ctx: unknown, buffer: PixelBuffer) {
        calls.push({ ctx, buffer });
      },
    };

    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: passthroughGenerator(),
      adapter: customAdapter,
    });

    controller.render();

    expect(calls).toHaveLength(1);
    expect(calls[0].ctx).toBe(h.context);
    expect(calls[0].buffer.width).toBe(8);
    expect(calls[0].buffer.height).toBe(4);
    expect(h.context.putImageDataCalls).toHaveLength(0);
  });

  it('exposes the underlying diagnostics sink', () => {
    const h = makeHarness();
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
    });
    expect(controller.diagnostics).toBeDefined();
    expect(controller.diagnostics.snapshot.status).toBe('idle');
  });
});

describe('createRenderController — background-gradient integration', () => {
  function gradientCamera() {
    return createCamera({
      position: VEC3_ZERO,
      lookAt: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: 8 / 4,
    });
  }

  it('renders a deterministic background-gradient buffer through the Canvas adapter', () => {
    const h = makeHarness(8, 4);
    const camera = gradientCamera();
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: createBackgroundGradientGenerator(camera),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('complete');
    expect(h.context.putImageDataCalls).toHaveLength(1);
    const image = h.context.putImageDataCalls[0].image;
    expect(image.width).toBe(8);
    expect(image.height).toBe(4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const expected = backgroundColorForDirection(generateRay(camera, u, v).direction);
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        expect(image.data[base]).toBe(expected.r);
        expect(image.data[base + 1]).toBe(expected.g);
        expect(image.data[base + 2]).toBe(expected.b);
        expect(image.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('produces a visibly lighter top row than bottom row (vertical gradient)', () => {
    const h = makeHarness(8, 4);
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: createBackgroundGradientGenerator(gradientCamera()),
    });

    controller.render();

    const image = h.context.putImageDataCalls[0].image;
    const topGreen = image.data[1 * 8 * PIXEL_CHANNELS + 1];
    const bottomGreen = image.data[(3 * 8 + 1) * PIXEL_CHANNELS + 1];
    expect(topGreen).toBeGreaterThan(bottomGreen);
  });
});

describe('createRenderController — sphere render integration', () => {
  function gradientCamera() {
    return createCamera({
      position: VEC3_ZERO,
      lookAt: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: 8 / 4,
    });
  }

  it('writes a sphere-hit buffer through the Canvas adapter with hits and misses', () => {
    const h = makeHarness(8, 4);
    const camera = gradientCamera();
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: createSphereRenderGenerator(camera, sphere),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('complete');
    expect(h.context.putImageDataCalls).toHaveLength(1);
    const image = h.context.putImageDataCalls[0].image;
    expect(image.width).toBe(8);
    expect(image.height).toBe(4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        const expected = hit
          ? normalToRgbaColor(computeSphereNormal(hit))
          : backgroundColorForDirection(ray.direction);
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        expect(image.data[base]).toBe(expected.r);
        expect(image.data[base + 1]).toBe(expected.g);
        expect(image.data[base + 2]).toBe(expected.b);
        expect(image.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('preserves the background gradient when the sphere is entirely behind the camera', () => {
    const h = makeHarness(8, 4);
    const camera = gradientCamera();
    const sphere = createSphere(createVec3(0, 0, 5), 1);
    const controller = createRenderController({
      target: h.target,
      width: 8,
      height: 4,
      clock: scriptedClock([0, 1]),
      generator: createSphereRenderGenerator(camera, sphere),
    });

    controller.render();
    const image = h.context.putImageDataCalls[0].image;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const expected = backgroundColorForDirection(generateRay(camera, u, v).direction);
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        expect(image.data[base]).toBe(expected.r);
        expect(image.data[base + 1]).toBe(expected.g);
        expect(image.data[base + 2]).toBe(expected.b);
        expect(image.data[base + 3]).toBe(expected.a);
      }
    }
  });
});

describe('createRenderController — happy-dom Canvas integration', () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext | undefined;

  beforeEach(() => {
    originalGetContext = HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    if (originalGetContext) {
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    }
  });

  it('reports a graceful error when happy-dom returns null from getContext("2d")', () => {
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 4;
    const status = document.createElement('p');
    const dims = document.createElement('p');

    const controller = createRenderController({
      target: { canvas, statusElement: status, dimsElement: dims },
      width: 8,
      height: 4,
      clock: scriptedClock([0, 3]),
    });

    const result = controller.render();

    expect(result.diagnostics.status).toBe('error');
    expect(result.diagnostics.errorMessage).toMatch(/Canvas 2D context/);
    expect(status.textContent).toMatch(/Render failed: /);
  });
});
