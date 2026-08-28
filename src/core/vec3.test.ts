import { describe, expect, it } from 'vitest';
import {
  addVec3,
  approxEqualsVec3,
  createVec3,
  crossVec3,
  divideVec3,
  dotVec3,
  lengthSquaredVec3,
  lengthVec3,
  negateVec3,
  normalizeVec3,
  scaleVec3,
  subtractVec3,
  VEC3_EPSILON,
  VEC3_ZERO,
} from './vec3.js';

describe('createVec3', () => {
  it('stores the x, y, z components', () => {
    expect(createVec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('supports negative and zero components', () => {
    expect(createVec3(-1, 0, 3.5)).toEqual({ x: -1, y: 0, z: 3.5 });
  });
});

describe('addVec3', () => {
  it('adds component-wise', () => {
    expect(addVec3(createVec3(1, 2, 3), createVec3(4, 5, 6))).toEqual(
      createVec3(5, 7, 9),
    );
  });

  it('does not mutate its inputs', () => {
    const a = createVec3(1, 2, 3);
    const b = createVec3(4, 5, 6);
    addVec3(a, b);
    expect(a).toEqual(createVec3(1, 2, 3));
    expect(b).toEqual(createVec3(4, 5, 6));
  });
});

describe('subtractVec3', () => {
  it('subtracts component-wise (a - b)', () => {
    expect(subtractVec3(createVec3(5, 7, 9), createVec3(4, 5, 6))).toEqual(
      createVec3(1, 2, 3),
    );
  });
});

describe('negateVec3', () => {
  it('negates every component', () => {
    expect(negateVec3(createVec3(1, -2, 3))).toEqual(createVec3(-1, 2, -3));
  });

  it('negates zero to zero', () => {
    expect(approxEqualsVec3(negateVec3(VEC3_ZERO), VEC3_ZERO)).toBe(true);
  });
});

describe('scaleVec3', () => {
  it('scales every component by a scalar', () => {
    expect(scaleVec3(createVec3(1, 2, 3), 2)).toEqual(createVec3(2, 4, 6));
  });

  it('supports fractional and negative scalars', () => {
    expect(scaleVec3(createVec3(2, 4, 6), 0.5)).toEqual(createVec3(1, 2, 3));
    expect(scaleVec3(createVec3(1, 2, 3), -1)).toEqual(createVec3(-1, -2, -3));
  });
});

describe('divideVec3', () => {
  it('divides every component by a scalar', () => {
    expect(divideVec3(createVec3(2, 4, 6), 2)).toEqual(createVec3(1, 2, 3));
  });

  it('throws a RangeError on a zero divisor', () => {
    expect(() => divideVec3(createVec3(1, 2, 3), 0)).toThrow(RangeError);
  });
});

describe('dotVec3', () => {
  it('computes the dot product', () => {
    expect(dotVec3(createVec3(1, 2, 3), createVec3(4, 5, 6))).toBe(32);
  });

  it('is zero for orthogonal vectors', () => {
    expect(dotVec3(createVec3(1, 0, 0), createVec3(0, 1, 0))).toBe(0);
  });

  it('equals lengthSquared for a vector dotted with itself', () => {
    const v = createVec3(2, 3, 6);
    expect(dotVec3(v, v)).toBe(lengthSquaredVec3(v));
  });
});

describe('crossVec3', () => {
  it('produces the right-handed basis cross product', () => {
    const x = createVec3(1, 0, 0);
    const y = createVec3(0, 1, 0);
    expect(crossVec3(x, y)).toEqual(createVec3(0, 0, 1));
    expect(crossVec3(y, x)).toEqual(createVec3(0, 0, -1));
  });

  it('is anti-commutative for a general pair', () => {
    const a = createVec3(1, 2, 3);
    const b = createVec3(4, 5, 6);
    expect(crossVec3(a, b)).toEqual(negateVec3(crossVec3(b, a)));
  });

  it('is zero for parallel vectors', () => {
    const a = createVec3(1, 2, 3);
    expect(crossVec3(a, scaleVec3(a, 2))).toEqual(VEC3_ZERO);
  });
});

describe('lengthSquaredVec3 and lengthVec3', () => {
  it('computes squared length and length of a 3-4-5 vector', () => {
    const v = createVec3(3, 4, 0);
    expect(lengthSquaredVec3(v)).toBe(25);
    expect(lengthVec3(v)).toBe(5);
  });

  it('returns zero for the zero vector', () => {
    expect(lengthSquaredVec3(VEC3_ZERO)).toBe(0);
    expect(lengthVec3(VEC3_ZERO)).toBe(0);
  });
});

describe('normalizeVec3', () => {
  it('returns a unit vector in the same direction', () => {
    const v = createVec3(3, 4, 0);
    const n = normalizeVec3(v);
    expect(approxEqualsVec3(n, createVec3(0.6, 0.8, 0))).toBe(true);
    expect(lengthVec3(n)).toBeCloseTo(1, 6);
  });

  it('normalizes an arbitrary non-axis-aligned vector', () => {
    const v = createVec3(1, 2, 2); // length 3
    const n = normalizeVec3(v);
    expect(approxEqualsVec3(n, createVec3(1 / 3, 2 / 3, 2 / 3))).toBe(true);
  });

  it('applies the zero policy: normalize(zero) returns zero, not NaN', () => {
    const n = normalizeVec3(VEC3_ZERO);
    expect(n).toEqual(VEC3_ZERO);
    expect(Number.isNaN(n.x)).toBe(false);
    expect(Number.isNaN(n.y)).toBe(false);
    expect(Number.isNaN(n.z)).toBe(false);
  });
});

describe('approxEqualsVec3', () => {
  it('returns true within the default tolerance', () => {
    const a = createVec3(0.1 + 0.2, 0, 0);
    const b = createVec3(0.3, 0, 0);
    expect(approxEqualsVec3(a, b)).toBe(true);
  });

  it('returns false when a component exceeds the tolerance', () => {
    const a = createVec3(0, 0, 0);
    const b = createVec3(VEC3_EPSILON * 2, 0, 0);
    expect(approxEqualsVec3(a, b)).toBe(false);
  });

  it('accepts an explicit tolerance', () => {
    const a = createVec3(0, 0, 0);
    const b = createVec3(0.01, 0, 0);
    expect(approxEqualsVec3(a, b, 0.1)).toBe(true);
    expect(approxEqualsVec3(a, b)).toBe(false);
  });
});

describe('VEC3_ZERO', () => {
  it('is the additive identity', () => {
    expect(addVec3(createVec3(1, 2, 3), VEC3_ZERO)).toEqual(createVec3(1, 2, 3));
  });
});
