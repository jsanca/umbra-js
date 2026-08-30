import { describe, expect, it } from 'vitest';
import { createSphere, intersectSphere } from './sphere.js';
import { createRay, pointAtRay } from './ray.js';
import { createVec3, VEC3_ZERO } from './vec3.js';

describe('createSphere — input validation', () => {
  it('rejects a non-positive radius', () => {
    expect(() => createSphere(VEC3_ZERO, 0)).toThrow(/positive finite/);
    expect(() => createSphere(VEC3_ZERO, -1)).toThrow(/positive finite/);
  });

  it('rejects a non-finite radius', () => {
    expect(() => createSphere(VEC3_ZERO, Number.NaN)).toThrow(/positive finite/);
    expect(() => createSphere(VEC3_ZERO, Number.POSITIVE_INFINITY)).toThrow(/positive finite/);
  });

  it('rejects a non-finite center coordinate', () => {
    expect(() => createSphere({ x: Number.NaN, y: 0, z: 0 }, 1)).toThrow(/finite/);
    expect(() => createSphere({ x: 0, y: Number.POSITIVE_INFINITY, z: 0 }, 1)).toThrow(/finite/);
    expect(() => createSphere({ x: 0, y: 0, z: Number.NaN }, 1)).toThrow(/finite/);
  });

  it('records the center and radius verbatim', () => {
    const sphere = createSphere(createVec3(1, 2, 3), 4);
    expect(sphere.center).toEqual(createVec3(1, 2, 3));
    expect(sphere.radius).toBe(4);
  });
});

describe('intersectSphere — miss (no real roots)', () => {
  it('returns null when the ray passes beside the sphere (D < 0)', () => {
    const sphere = createSphere(createVec3(5, 0, 0), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    expect(intersectSphere(sphere, ray)).toBeNull();
  });

  it('returns null when the sphere is entirely behind the ray origin', () => {
    // sphere at +z, ray looks down −z → both roots negative → miss
    const sphere = createSphere(createVec3(0, 0, 5), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    expect(intersectSphere(sphere, ray)).toBeNull();
  });
});

describe('intersectSphere — tangent (D = 0)', () => {
  it('returns a hit at the grazing parameter for a tangent ray', () => {
    // sphere at origin r=1; ray starts on the surface at (1,0,0) and goes
    // tangentially along +y → D = 0 exactly, single root t = 0.
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(createVec3(1, 0, 0), createVec3(0, 1, 0));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(0);
    expect(hit!.point).toEqual(createVec3(1, 0, 0));
    expect(hit!.sphere).toBe(sphere);
  });
});

describe('intersectSphere — hit (single valid root, t0)', () => {
  it('returns the entry hit for a ray that crosses the sphere from outside', () => {
    // sphere at (0,0,-3) r=1; ray looks down −z from origin.
    // oc=(0,0,3), b=-6, c=8, D=4 → t0=2 (front surface at (0,0,-2)).
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(2);
    expect(hit!.point).toEqual(createVec3(0, 0, -2));
    expect(hit!.sphere).toBe(sphere);
  });
});

describe('intersectSphere — nearest valid root (two roots, t0 < t1)', () => {
  it('returns the nearer entry root t0, not the exit root t1', () => {
    // sphere at (0,0,-5) r=1; ray looks down −z from origin.
    // b=-10, c=24, D=4 → t0=4 (front at (0,0,-4)), t1=6 (back at (0,0,-6)).
    const sphere = createSphere(createVec3(0, 0, -5), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(4);
    expect(hit!.point).toEqual(createVec3(0, 0, -4));
    expect(hit!.t).not.toBe(6);
  });
});

describe('intersectSphere — inside sphere (origin inside)', () => {
  it('returns the exit root t1 (t0 lies behind the origin)', () => {
    // sphere at origin r=1, ray origin at center, direction (0,0,-1).
    // t0 = -1 (entry behind), t1 = +1 (exit at (0,0,-1)).
    const sphere = createSphere(VEC3_ZERO, 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(1);
    expect(hit!.point).toEqual(createVec3(0, 0, -1));
  });
});

describe('intersectSphere — general (non-unit) direction', () => {
  it('uses the full a = dot(direction, direction) for non-unit directions', () => {
    // direction (0,0,-2) (length 2); sphere at (0,0,-3) r=1 from origin.
    // a=4, b=-12, c=8, D=16 → t0 = 1 (point (0,0,-2)), t1 = 2.
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -2));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.t).toBe(1);
    expect(hit!.point).toEqual(createVec3(0, 0, -2));
  });
});

describe('intersectSphere — determinism and Ray integration', () => {
  it('is deterministic for repeated calls with the same sphere and ray', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    expect(intersectSphere(sphere, ray)).toEqual(intersectSphere(sphere, ray));
  });

  it('hit point equals pointAtRay(ray, hit.t) (S1-004 Ray integration)', () => {
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const ray = createRay(VEC3_ZERO, createVec3(0, 0, -1));
    const hit = intersectSphere(sphere, ray);
    expect(hit).not.toBeNull();
    expect(hit!.point).toEqual(pointAtRay(ray, hit!.t));
  });
});