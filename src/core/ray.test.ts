import { describe, expect, it } from 'vitest';
import { createRay, pointAtRay } from './ray.js';
import { createVec3, subtractVec3 } from './vec3.js';

describe('createRay', () => {
  it('stores the origin and direction', () => {
    const origin = createVec3(1, 2, 3);
    const direction = createVec3(0, 0, -1);
    expect(createRay(origin, direction)).toEqual({ origin, direction });
  });

  it('does not normalize the direction', () => {
    const direction = createVec3(0, 0, -2);
    const ray = createRay(createVec3(0, 0, 0), direction);
    expect(ray.direction).toEqual(direction);
  });
});

describe('pointAtRay', () => {
  const origin = createVec3(1, 1, 1);
  const direction = createVec3(0, 2, 0);
  const ray = createRay(origin, direction);

  it('returns the origin at t = 0', () => {
    expect(pointAtRay(ray, 0)).toEqual(origin);
  });

  it('returns origin + direction at t = 1', () => {
    expect(pointAtRay(ray, 1)).toEqual(createVec3(1, 3, 1));
  });

  it('scales the direction by t', () => {
    expect(pointAtRay(ray, 2)).toEqual(createVec3(1, 5, 1));
    expect(pointAtRay(ray, 0.5)).toEqual(createVec3(1, 2, 1));
  });

  it('evaluates points behind the origin for negative t', () => {
    expect(pointAtRay(ray, -1)).toEqual(createVec3(1, -1, 1));
  });

  it('matches manual origin + t * direction arithmetic', () => {
    const t = 3.5;
    const expected = {
      x: origin.x + t * direction.x,
      y: origin.y + t * direction.y,
      z: origin.z + t * direction.z,
    };
    expect(pointAtRay(ray, t)).toEqual(expected);
  });
});

describe('Ray arithmetic integration', () => {
  it('the vector between two ray points is t-scaled direction', () => {
    const ray = createRay(createVec3(0, 0, 0), createVec3(1, 2, 3));
    const p0 = pointAtRay(ray, 1);
    const p2 = pointAtRay(ray, 3);
    expect(subtractVec3(p2, p0)).toEqual(createVec3(2, 4, 6));
  });
});
