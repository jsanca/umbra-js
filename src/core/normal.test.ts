import { describe, expect, it } from 'vitest';
import { computeSphereNormal, normalToRgbaColor } from './normal.js';
import { createSphere, intersectSphere } from './sphere.js';
import { createRay } from './ray.js';
import {
  createVec3,
  lengthVec3,
  normalizeVec3,
  subtractVec3,
  VEC3_ZERO,
} from './vec3.js';

describe('computeSphereNormal — cardinal directions', () => {
  it('returns (+z) for a front-of-sphere hit (camera looking down −z)', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(normal).toEqual(createVec3(0, 0, 1));
  });

  it('returns (−z) for a hit on the opposite side of the same sphere', () => {
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(createVec3(0, 0, -2), createVec3(0, 0, 1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(normal).toEqual(createVec3(0, 0, -1));
  });

  it('returns (+x) for a hit on the +x surface of a sphere at the origin', () => {
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(createVec3(2, 0, 0), createVec3(-1, 0, 0));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(normal).toEqual(createVec3(1, 0, 0));
  });

  it('returns (+y) for a hit on the +y surface of a sphere at the origin', () => {
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(createVec3(0, 2, 0), createVec3(0, -1, 0));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(normal).toEqual(createVec3(0, 1, 0));
  });
});

describe('computeSphereNormal — non-cardinal and invariants', () => {
  it('returns (1/√3, 1/√3, 1/√3) for a ray from the center to the diagonal surface', () => {
    // Ray from sphere center (origin) along the body diagonal exits at t=1
    // (origin-inside case) with point = (1/√3, 1/√3, 1/√3). The outward
    // normal equals that unit vector.
    const s = 1 / Math.sqrt(3);
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(VEC3_ZERO, createVec3(s, s, s));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(normal.x).toBeCloseTo(s, 10);
    expect(normal.y).toBeCloseTo(s, 10);
    expect(normal.z).toBeCloseTo(s, 10);
  });

  it('returns a unit-length vector (within VEC3_EPSILON)', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const normal = computeSphereNormal(hit!);
    expect(lengthVec3(normal)).toBeCloseTo(1, 6);
  });

  it('equals normalize(hit.point − hit.sphere.center) — the documented formula', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    const expected = normalizeVec3(subtractVec3(hit!.point, hit!.sphere.center));
    const normal = computeSphereNormal(hit!);
    expect(normal).toEqual(expected);
  });

  it('is deterministic for repeated calls with the same hit', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray)!;
    expect(computeSphereNormal(hit)).toEqual(computeSphereNormal(hit));
  });
});

describe('normalToRgbaColor — cardinal colors (exact)', () => {
  it('maps (+x) → (255, 128, 128, 255)', () => {
    expect(normalToRgbaColor(createVec3(1, 0, 0))).toEqual({ r: 255, g: 128, b: 128, a: 0xff });
  });

  it('maps (+y) → (128, 255, 128, 255)', () => {
    expect(normalToRgbaColor(createVec3(0, 1, 0))).toEqual({ r: 128, g: 255, b: 128, a: 0xff });
  });

  it('maps (+z) → (128, 128, 255, 255)', () => {
    expect(normalToRgbaColor(createVec3(0, 0, 1))).toEqual({ r: 128, g: 128, b: 255, a: 0xff });
  });

  it('maps (−x) → (0, 128, 128, 255)', () => {
    expect(normalToRgbaColor(createVec3(-1, 0, 0))).toEqual({ r: 0, g: 128, b: 128, a: 0xff });
  });

  it('maps (−y) → (128, 0, 128, 255)', () => {
    expect(normalToRgbaColor(createVec3(0, -1, 0))).toEqual({ r: 128, g: 0, b: 128, a: 0xff });
  });

  it('maps (−z) → (128, 128, 0, 255)', () => {
    expect(normalToRgbaColor(createVec3(0, 0, -1))).toEqual({ r: 128, g: 128, b: 0, a: 0xff });
  });
});

describe('normalToRgbaColor — non-cardinal and clamping', () => {
  it('maps the diagonal (1/√3, 1/√3, 1/√3) to (201, 201, 201, 255)', () => {
    const s = 1 / Math.sqrt(3);
    expect(normalToRgbaColor(createVec3(s, s, s))).toEqual({ r: 201, g: 201, b: 201, a: 0xff });
  });

  it('clamps out-of-range components to the saturation extremes', () => {
    expect(normalToRgbaColor(createVec3(2, 0, 0))).toEqual({ r: 255, g: 128, b: 128, a: 0xff });
    expect(normalToRgbaColor(createVec3(-2, 0, 0))).toEqual({ r: 0, g: 128, b: 128, a: 0xff });
  });

  it('keeps the alpha channel fully opaque for every input', () => {
    for (let c = -2; c <= 2; c += 0.25) {
      expect(normalToRgbaColor(createVec3(c, 0, 0)).a).toBe(0xff);
    }
  });

  it('keeps every channel within the 8-bit range across a wide component sweep', () => {
    for (let c = -2; c <= 2; c += 0.1) {
      const color = normalToRgbaColor(createVec3(c, c, c));
      for (const channel of [color.r, color.g, color.b]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });

  it('is deterministic for repeated calls with the same normal', () => {
    const normal = createVec3(0.6, -0.3, 0.9);
    expect(normalToRgbaColor(normal)).toEqual(normalToRgbaColor(normal));
  });
});

describe('Sphere + normal integration', () => {
  it('the documented front-of-sphere hit maps to the documented (+z) color', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(normalToRgbaColor(computeSphereNormal(hit!))).toEqual({
      r: 128,
      g: 128,
      b: 255,
      a: 0xff,
    });
  });

  it('the cardinality of the computed normal is preserved by the mapping', () => {
    // The unit-vector-to-RGB mapping preserves the "axis-aligned" property:
    // a unit normal aligned with one axis produces a byte with value 255 or 0
    // in the corresponding channel (saturation) and 128 in the others.
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray)!;
    const color = normalToRgbaColor(computeSphereNormal(hit));
    expect(color.b).toBe(255);
    expect(color.r).toBe(128);
    expect(color.g).toBe(128);
    // The exact unit length should hold within VEC3_EPSILON tolerance.
    expect(lengthVec3(computeSphereNormal(hit))).toBeCloseTo(1, 6);
  });
});