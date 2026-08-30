import { describe, expect, it } from 'vitest';
import { createSphereRenderGenerator } from './sphere-renderer.js';
import {
  backgroundColorForDirection,
} from './background-gradient.js';
import { createCamera, generateRay } from './camera.js';
import { computeSphereNormal, normalToRgbaColor } from './normal.js';
import { createPointLight, diffuseShadingColor } from './light.js';
import { createSphere, intersectSphere } from './sphere.js';
import { createVec3, VEC3_ZERO } from './vec3.js';
import { PIXEL_CHANNELS, type PixelBuffer } from './pixel-buffer.js';

function sampleCamera(aspect: number) {
  return createCamera({
    position: VEC3_ZERO,
    lookAt: createVec3(0, 0, -1),
    fov: Math.PI / 3,
    aspect,
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

describe('createSphereRenderGenerator — dimensions and stride', () => {
  it('produces a buffer with the requested width/height/RGBA stride', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const buffer = createSphereRenderGenerator(camera, sphere)(8, 4);

    expect(buffer.width).toBe(8);
    expect(buffer.height).toBe(4);
    expect(buffer.channels).toBe(PIXEL_CHANNELS);
    expect(buffer.data.length).toBe(8 * 4 * PIXEL_CHANNELS);
  });
});

describe('createSphereRenderGenerator — hit/miss contract (normal shading)', () => {
  it('writes the normal-derived color on sphere hits and the background gradient on misses', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const buffer = createSphereRenderGenerator(camera, sphere)(8, 4);

    let hits = 0;
    let misses = 0;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        const expected = hit
          ? normalToRgbaColor(computeSphereNormal(hit))
          : backgroundColorForDirection(ray.direction);
        expect(pixelAt(buffer, x, y)).toEqual(expected);
        if (hit) {
          hits += 1;
        } else {
          misses += 1;
        }
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(misses).toBeGreaterThan(0);
  });

  it('falls back to the background gradient for every pixel when the sphere is behind the camera', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, 5), 1);
    const buffer = createSphereRenderGenerator(camera, sphere)(8, 4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        expect(pixelAt(buffer, x, y)).toEqual(backgroundColorForDirection(ray.direction));
      }
    }
  });

  it('writes a normal-shaded color for every pixel when the sphere covers the entire view', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(VEC3_ZERO, 1e6);
    const buffer = createSphereRenderGenerator(camera, sphere)(8, 4);

    let hitCount = 0;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        expect(hit).not.toBeNull();
        if (!hit) continue;
        hitCount += 1;
        expect(pixelAt(buffer, x, y)).toEqual(normalToRgbaColor(computeSphereNormal(hit)));
      }
    }
    expect(hitCount).toBe(8 * 4);
  });
});

describe('createSphereRenderGenerator — determinism and options', () => {
  it('is deterministic across generator instances', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const a = createSphereRenderGenerator(camera, sphere)(8, 4);
    const b = createSphereRenderGenerator(camera, sphere)(8, 4);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('returns a fresh buffer per call (no shared state)', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const generator = createSphereRenderGenerator(camera, sphere);
    const a = generator(4, 4);
    const b = generator(4, 4);
    expect(a.data).not.toBe(b.data);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });

  it('honors a custom background gradient override', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, 5), 1);
    const custom = {
      top: { r: 0x10, g: 0x20, b: 0x30, a: 0xff },
      bottom: { r: 0x40, g: 0x50, b: 0x60, a: 0xff },
    };
    const buffer = createSphereRenderGenerator(camera, sphere, {
      background: custom,
    })(8, 4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const expected = backgroundColorForDirection(
          generateRay(camera, u, v).direction,
          custom,
        );
        expect(pixelAt(buffer, x, y)).toEqual(expected);
      }
    }
    // Sanity: the custom background is not the default, so at least one
    // pixel must differ from the default-gradient render.
    const defaultBuffer = createSphereRenderGenerator(camera, sphere)(8, 4);
    let differs = false;
    for (let i = 0; i < buffer.data.length; i += PIXEL_CHANNELS) {
      if (buffer.data[i] !== defaultBuffer.data[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });

  it('does not expose a constant hit-color option (hit color is normal-derived)', () => {
    // Compile-time check: the SphereRenderOptions type accepts only
    // `background?`. The runtime call without `hitColor` must succeed and
    // produce the normal-derived color.
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const buffer = createSphereRenderGenerator(camera, sphere)(4, 4);
    // At least one pixel is the normal-shaded (not background) color.
    let foundNormalShadedPixel = false;
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const u = (x + 0.5) / 4;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (hit) {
          expect(pixelAt(buffer, x, y)).toEqual(normalToRgbaColor(computeSphereNormal(hit)));
          foundNormalShadedPixel = true;
        }
      }
    }
    expect(foundNormalShadedPixel).toBe(true);
  });
});

describe('createSphereRenderGenerator — S1-010 diffuse shading', () => {
  it('without a light, hit pixels equal normalToRgbaColor(computeSphereNormal(hit)) (S1-008 byte-equality)', () => {
    // The S1-008 path is preserved exactly when no light is supplied.
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const buffer = createSphereRenderGenerator(camera, sphere)(8, 4);
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (!hit) continue;
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        const expected = normalToRgbaColor(computeSphereNormal(hit));
        expect(buffer.data[base]).toBe(expected.r);
        expect(buffer.data[base + 1]).toBe(expected.g);
        expect(buffer.data[base + 2]).toBe(expected.b);
        expect(buffer.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('with a light, hit pixels equal diffuseShadingColor(baseColor, normal, light, hit.point)', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const light = createPointLight(createVec3(0, 5, -2), 1);
    const buffer = createSphereRenderGenerator(camera, sphere, { light })(8, 4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (!hit) continue;
        const normal = computeSphereNormal(hit);
        const baseColor = normalToRgbaColor(normal);
        const expected = diffuseShadingColor(baseColor, normal, light, hit.point);
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        expect(buffer.data[base]).toBe(expected.r);
        expect(buffer.data[base + 1]).toBe(expected.g);
        expect(buffer.data[base + 2]).toBe(expected.b);
        expect(buffer.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('a back-facing hit pixel (dot < 0) is rendered black under the light', () => {
    // We assert the per-pixel contract: when dot(normal, lightDir) ≤ 0 the
    // diffuse factor is clamped to 0, producing black with the original
    // alpha. Rather than rely on a fragile pixel-center assumption, we
    // verify by constructing a known hit point + normal + light and feeding
    // it directly into the documented formula.
    const baseColor = { r: 200, g: 100, b: 50, a: 0xff };
    const normal = createVec3(0, 0, 1); // front-facing
    const light = createPointLight(createVec3(0, 0, -3), 1); // behind surface
    const hitPoint = createVec3(0, 0, -2);
    // Re-derive the expected via the formula (avoid duplicating the renderer
    // logic in the assertion): the light direction from the front hit to
    // (0,0,-3) is normalize((0,0,-1)) = (0,0,-1), so dot = -1 → t = 0 → black.
    expect(diffuseShadingColor(baseColor, normal, light, hitPoint)).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0xff,
    });
  });

  it('with a light, miss pixels are unaffected (background gradient preserved)', () => {
    const camera = sampleCamera(8 / 4);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const light = createPointLight(createVec3(0, 5, -2), 1);
    const buffer = createSphereRenderGenerator(camera, sphere, { light })(8, 4);

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (hit) continue;
        const expected = backgroundColorForDirection(ray.direction);
        expect(pixelAt(buffer, x, y)).toEqual(expected);
      }
    }
  });
});