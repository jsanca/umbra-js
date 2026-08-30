import { describe, expect, it } from 'vitest';
import {
  createPointLight,
  diffuseShadingColor,
  lightDirectionFromHit,
} from './light.js';
import {
  createVec3,
  lengthVec3,
  normalizeVec3,
  subtractVec3,
  VEC3_ZERO,
} from './vec3.js';

describe('createPointLight — input validation', () => {
  it('records position and intensity verbatim', () => {
    const light = createPointLight(createVec3(1, 2, 3), 0.5);
    expect(light.position).toEqual(createVec3(1, 2, 3));
    expect(light.intensity).toBe(0.5);
  });

  it('defaults intensity to 1 when omitted', () => {
    const light = createPointLight(createVec3(0, 0, 0));
    expect(light.intensity).toBe(1);
  });

  it('rejects a non-positive intensity', () => {
    expect(() => createPointLight(VEC3_ZERO, 0)).toThrow(
      /intensity must be a positive finite number/,
    );
    expect(() => createPointLight(VEC3_ZERO, -1)).toThrow(
      /intensity must be a positive finite number/,
    );
  });

  it('rejects a non-finite intensity', () => {
    expect(() => createPointLight(VEC3_ZERO, Number.NaN)).toThrow(
      /intensity must be a positive finite number/,
    );
    expect(() => createPointLight(VEC3_ZERO, Number.POSITIVE_INFINITY)).toThrow(
      /intensity must be a positive finite number/,
    );
  });
});

describe('lightDirectionFromHit', () => {
  it('equals normalize(light.position − hitPoint) (the documented formula)', () => {
    const light = createPointLight(createVec3(2, 3, 4));
    const hitPoint = createVec3(0, 0, -3);
    const expected = normalizeVec3(subtractVec3(light.position, hitPoint));
    expect(lightDirectionFromHit(light, hitPoint)).toEqual(expected);
  });

  it('returns a unit-length direction (within VEC3_EPSILON)', () => {
    const light = createPointLight(createVec3(2, 3, 4));
    const direction = lightDirectionFromHit(light, createVec3(0, 0, -3));
    expect(lengthVec3(direction)).toBeCloseTo(1, 6);
  });

  it('returns (0,0,1) when the light is directly in front of the hit point', () => {
    const light = createPointLight(createVec3(0, 0, -1));
    const direction = lightDirectionFromHit(light, createVec3(0, 0, -2));
    expect(direction).toEqual(createVec3(0, 0, 1));
  });

  it('returns the S1-004 zero vector when the light is coincident with the hit point', () => {
    const point = createVec3(1, 2, 3);
    const light = createPointLight(point);
    expect(lightDirectionFromHit(light, point)).toEqual(VEC3_ZERO);
  });

  it('is deterministic for repeated calls with the same inputs', () => {
    const light = createPointLight(createVec3(2, 3, 4));
    const hit = createVec3(0, 0, -3);
    expect(lightDirectionFromHit(light, hit)).toEqual(lightDirectionFromHit(light, hit));
  });
});

describe('diffuseShadingColor — exact cardinal cases', () => {
  it('returns the base color when the normal is aligned with the light direction (dot = 1, intensity = 1)', () => {
    const base = { r: 128, g: 128, b: 255, a: 0xff };
    const normal = createVec3(0, 0, 1);
    const light = createPointLight(createVec3(0, 0, -1)); // lightDir = (0,0,1) from hit (0,0,-2)
    const result = diffuseShadingColor(base, normal, light, createVec3(0, 0, -2));
    expect(result).toEqual({ r: 128, g: 128, b: 255, a: 0xff });
  });

  it('returns black when the normal is perpendicular to the light direction (dot = 0)', () => {
    const base = { r: 255, g: 128, b: 128, a: 0xff };
    const normal = createVec3(1, 0, 0); // right-facing
    const light = createPointLight(createVec3(0, 1, 0)); // lightDir = (0,1,0) from hit (1,0,0)
    const result = diffuseShadingColor(base, normal, light, createVec3(1, 0, 0));
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0xff });
  });

  it('clamps a negative dot product to 0 (back-facing surfaces are unlit)', () => {
    const base = { r: 128, g: 128, b: 255, a: 0xff };
    const normal = createVec3(0, 0, 1); // front-facing
    const light = createPointLight(createVec3(0, 0, -3)); // lightDir = (0,0,-1) from hit (0,0,-2)
    const result = diffuseShadingColor(base, normal, light, createVec3(0, 0, -2));
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0xff });
  });

  it('preserves the alpha channel from the base color', () => {
    const base = { r: 200, g: 100, b: 50, a: 0x42 };
    const normal = createVec3(0, 0, 1);
    const light = createPointLight(createVec3(0, 0, -1));
    const result = diffuseShadingColor(base, normal, light, createVec3(0, 0, -2));
    expect(result.a).toBe(0x42);
  });

  it('scales the base color by intensity when the normal faces the light', () => {
    const base = { r: 200, g: 100, b: 50, a: 0xff };
    const normal = createVec3(0, 0, 1);
    const light = createPointLight(createVec3(0, 0, -1), 2);
    const result = diffuseShadingColor(base, normal, light, createVec3(0, 0, -2));
    // 200*2 = 400 → clamp 255; 100*2 = 200; 50*2 = 100.
    expect(result).toEqual({ r: 255, g: 200, b: 100, a: 0xff });
  });

  it('returns black when the light is coincident with the hit point (degenerate lightDir = VEC3_ZERO)', () => {
    const base = { r: 200, g: 100, b: 50, a: 0xff };
    const normal = createVec3(0, 0, 1);
    const point = createVec3(0, 0, -3);
    const light = createPointLight(point);
    const result = diffuseShadingColor(base, normal, light, point);
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0xff });
  });
});

describe('diffuseShadingColor — non-cardinal consistency', () => {
  it('matches the documented Lambertian formula for a diagonal normal and an axis-aligned light', () => {
    // Diagonal normal (1/√3, 1/√3, 1/√3) hit at (s, s, s) (sphere origin r=1).
    // Light at (s, s, s+1) → lightDir = (0,0,1). dot = 1/√3.
    const s = 1 / Math.sqrt(3);
    const base = { r: 201, g: 201, b: 201, a: 0xff };
    const normal = createVec3(s, s, s);
    const hit = createVec3(s, s, s);
    const light = createPointLight(createVec3(s, s, s + 1));
    const result = diffuseShadingColor(base, normal, light, hit);
    // Re-derive expected from the documented formula (avoid FP brittleness).
    const t = (1 / Math.sqrt(3)) * light.intensity;
    const expected = {
      r: Math.min(255, Math.max(0, Math.round(201 * t))),
      g: Math.min(255, Math.max(0, Math.round(201 * t))),
      b: Math.min(255, Math.max(0, Math.round(201 * t))),
      a: 0xff,
    };
    expect(result).toEqual(expected);
    // The diffuse factor is < 1 here, so the result is strictly darker than the base.
    expect(result.r).toBeLessThan(201);
  });
});