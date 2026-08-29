import { describe, expect, it } from 'vitest';
import {
  createCamera,
  generateRay,
  isInViewport,
  pointAtCameraSample,
  VIEWPORT_CENTER,
  VIEWPORT_SAMPLES,
  VEC3_UP,
} from './camera.js';
import {
  approxEqualsVec3,
  createVec3,
  lengthVec3,
  scaleVec3,
  VEC3_EPSILON,
  VEC3_ZERO,
} from './vec3.js';
import { pointAtRay } from './ray.js';

/**
 * A canonical camera used by most camera tests. Positioned at the origin and
 * aimed down the −z axis, with a 60° vertical field of view and the
 * Sprint 1 default aspect ratio (640 / 400 = 1.6). The expected center/corner
 * ray directions are derived from this configuration in the comments below.
 */
function sampleCamera() {
  return createCamera({
    position: VEC3_ZERO,
    lookAt: createVec3(0, 0, -1),
    fov: Math.PI / 3,
    aspect: 16 / 10,
  });
}

describe('VEC3_UP and VIEWPORT_CENTER', () => {
  it('VEC3_UP is the frozen (0, 1, 0)', () => {
    expect(VEC3_UP).toEqual({ x: 0, y: 1, z: 0 });
  });

  it('VIEWPORT_CENTER is (0.5, 0.5)', () => {
    expect(VIEWPORT_CENTER).toEqual({ u: 0.5, v: 0.5 });
  });
});

describe('createCamera — input validation', () => {
  it('rejects a zero or negative fov', () => {
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 0, -1),
        fov: 0,
        aspect: 1,
      }),
    ).toThrow(/fov must be in \(0, π\)/);
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 0, -1),
        fov: -Math.PI / 4,
        aspect: 1,
      }),
    ).toThrow(/fov must be in \(0, π\)/);
  });

  it('rejects an fov at or beyond π', () => {
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 0, -1),
        fov: Math.PI,
        aspect: 1,
      }),
    ).toThrow(/fov must be in \(0, π\)/);
  });

  it('rejects a non-finite or non-positive aspect', () => {
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 0, -1),
        fov: Math.PI / 3,
        aspect: 0,
      }),
    ).toThrow(/aspect must be a positive finite number/);
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 0, -1),
        fov: Math.PI / 3,
        aspect: Number.NaN,
      }),
    ).toThrow(/aspect must be a positive finite number/);
  });

  it('rejects position equal to lookAt (zero forward)', () => {
    expect(() =>
      createCamera({
        position: createVec3(1, 2, 3),
        lookAt: createVec3(1, 2, 3),
        fov: Math.PI / 3,
        aspect: 1,
      }),
    ).toThrow(/position equals lookAt/);
  });

  it('rejects forward parallel to up (zero right)', () => {
    expect(() =>
      createCamera({
        position: VEC3_ZERO,
        lookAt: createVec3(0, 1, 0), // forward = +y, parallel to up
        up: createVec3(0, 1, 0),
        fov: Math.PI / 3,
        aspect: 1,
      }),
    ).toThrow(/forward is parallel to up/);
  });
});

describe('createCamera — computed basis', () => {
  it('matches the expected basis for the sample camera (origin, look down −z, +y up)', () => {
    const camera = sampleCamera();
    expect(approxEqualsVec3(camera.forward, createVec3(0, 0, -1))).toBe(true);
    expect(approxEqualsVec3(camera.right, createVec3(1, 0, 0))).toBe(true);
    expect(approxEqualsVec3(camera.trueUp, createVec3(0, 1, 0))).toBe(true);
  });

  it('produces orthonormal basis vectors (dot products ≈ 0, lengths ≈ 1)', () => {
    const camera = sampleCamera();
    const { forward, right, trueUp } = camera;
    const dotFR = forward.x * right.x + forward.y * right.y + forward.z * right.z;
    const dotFT = forward.x * trueUp.x + forward.y * trueUp.y + forward.z * trueUp.z;
    const dotRT = right.x * trueUp.x + right.y * trueUp.y + right.z * trueUp.z;
    expect(Math.abs(dotFR)).toBeLessThan(VEC3_EPSILON);
    expect(Math.abs(dotFT)).toBeLessThan(VEC3_EPSILON);
    expect(Math.abs(dotRT)).toBeLessThan(VEC3_EPSILON);
    expect(lengthVec3(forward)).toBeCloseTo(1, 6);
    expect(lengthVec3(right)).toBeCloseTo(1, 6);
    expect(lengthVec3(trueUp)).toBeCloseTo(1, 6);
  });

  it('uses (0, 1, 0) as the default world up', () => {
    const camera = sampleCamera();
    expect(camera.up).toEqual(VEC3_UP);
  });

  it('honors an explicit up override', () => {
    const camera = createCamera({
      position: VEC3_ZERO,
      lookAt: createVec3(0, 0, -1),
      up: createVec3(0, 1, 0),
      fov: Math.PI / 3,
      aspect: 1,
    });
    expect(camera.up).toEqual(createVec3(0, 1, 0));
  });

  it('records the computed half-width and half-height (tan(fov/2) × aspect)', () => {
    const camera = sampleCamera();
    expect(camera.halfHeight).toBeCloseTo(Math.tan(Math.PI / 6), 10);
    expect(camera.halfWidth).toBeCloseTo((16 / 10) * Math.tan(Math.PI / 6), 10);
  });

  it('produces a non-trivial basis when the camera is translated', () => {
    const camera = createCamera({
      position: createVec3(0, 0, 5),
      lookAt: VEC3_ZERO,
      fov: Math.PI / 3,
      aspect: 16 / 10,
    });
    expect(approxEqualsVec3(camera.forward, createVec3(0, 0, -1))).toBe(true);
    expect(approxEqualsVec3(camera.right, createVec3(1, 0, 0))).toBe(true);
    expect(approxEqualsVec3(camera.trueUp, createVec3(0, 1, 0))).toBe(true);
  });

  it('records the input config verbatim on the returned Camera', () => {
    const camera = createCamera({
      position: createVec3(1, 2, 3),
      lookAt: createVec3(4, 5, 6),
      fov: Math.PI / 4,
      aspect: 4 / 3,
    });
    expect(camera.position).toEqual(createVec3(1, 2, 3));
    expect(camera.lookAt).toEqual(createVec3(4, 5, 6));
    expect(camera.fov).toBe(Math.PI / 4);
    expect(camera.aspect).toBe(4 / 3);
  });
});

describe('generateRay — center ray contract (TC-S1-014)', () => {
  it('returns the camera forward at (0.5, 0.5) for the sample camera', () => {
    const camera = sampleCamera();
    const ray = generateRay(camera, VIEWPORT_SAMPLES.center.u, VIEWPORT_SAMPLES.center.v);
    expect(approxEqualsVec3(ray.direction, createVec3(0, 0, -1))).toBe(true);
  });

  it('origin matches the camera position at (0.5, 0.5)', () => {
    const camera = sampleCamera();
    const ray = generateRay(camera, 0.5, 0.5);
    expect(ray.origin).toBe(camera.position);
  });

  it('returns a unit-length direction at the center', () => {
    const camera = sampleCamera();
    const ray = generateRay(camera, 0.5, 0.5);
    expect(lengthVec3(ray.direction)).toBeCloseTo(1, 6);
  });
});

describe('generateRay — corner rays (TC-S1-014)', () => {
  const camera = sampleCamera();
  const halfHeight = Math.tan(Math.PI / 6);
  const halfWidth = (16 / 10) * halfHeight;
  const tlMag = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight + 1);

  it('top-left corner direction is (−halfW, +halfH, −1) normalized', () => {
    const ray = generateRay(camera, VIEWPORT_SAMPLES.topLeft.u, VIEWPORT_SAMPLES.topLeft.v);
    const expected = createVec3(-halfWidth / tlMag, halfHeight / tlMag, -1 / tlMag);
    expect(approxEqualsVec3(ray.direction, expected)).toBe(true);
  });

  it('top-right corner direction is (+halfW, +halfH, −1) normalized', () => {
    const ray = generateRay(camera, VIEWPORT_SAMPLES.topRight.u, VIEWPORT_SAMPLES.topRight.v);
    const expected = createVec3(halfWidth / tlMag, halfHeight / tlMag, -1 / tlMag);
    expect(approxEqualsVec3(ray.direction, expected)).toBe(true);
  });

  it('bottom-left corner direction is (−halfW, −halfH, −1) normalized', () => {
    const ray = generateRay(camera, VIEWPORT_SAMPLES.bottomLeft.u, VIEWPORT_SAMPLES.bottomLeft.v);
    const expected = createVec3(-halfWidth / tlMag, -halfHeight / tlMag, -1 / tlMag);
    expect(approxEqualsVec3(ray.direction, expected)).toBe(true);
  });

  it('bottom-right corner direction is (+halfW, −halfH, −1) normalized', () => {
    const ray = generateRay(camera, VIEWPORT_SAMPLES.bottomRight.u, VIEWPORT_SAMPLES.bottomRight.v);
    const expected = createVec3(halfWidth / tlMag, -halfHeight / tlMag, -1 / tlMag);
    expect(approxEqualsVec3(ray.direction, expected)).toBe(true);
  });

  it('all four corner directions are unit-length', () => {
    for (const sample of [
      VIEWPORT_SAMPLES.topLeft,
      VIEWPORT_SAMPLES.topRight,
      VIEWPORT_SAMPLES.bottomLeft,
      VIEWPORT_SAMPLES.bottomRight,
    ]) {
      const ray = generateRay(camera, sample.u, sample.v);
      expect(lengthVec3(ray.direction)).toBeCloseTo(1, 6);
    }
  });

  it('top-left ray, normalized numerically', () => {
    const ray = generateRay(camera, 0, 0);
    expect(approxEqualsVec3(ray.direction, createVec3(-0.6246950476, 0.3904344047, -0.6762522260))).toBe(true);
  });
});

describe('generateRay — symmetry and screen convention', () => {
  const camera = sampleCamera();

  it('horizontal mirror symmetry: generateRay(u, v).x = −generateRay(1−u, v).x', () => {
    const a = generateRay(camera, 0.25, 0.5);
    const b = generateRay(camera, 0.75, 0.5);
    expect(approxEqualsVec3(
      createVec3(a.direction.x, a.direction.y, a.direction.z),
      createVec3(-b.direction.x, b.direction.y, b.direction.z),
    )).toBe(true);
  });

  it('vertical mirror symmetry: generateRay(u, v).y = −generateRay(u, 1−v).y', () => {
    const a = generateRay(camera, 0.5, 0.25);
    const b = generateRay(camera, 0.5, 0.75);
    expect(approxEqualsVec3(
      createVec3(a.direction.x, a.direction.y, a.direction.z),
      createVec3(b.direction.x, -b.direction.y, b.direction.z),
    )).toBe(true);
  });

  it('top-row rays carry a positive trueUp component', () => {
    const ray = generateRay(camera, 0.5, 0);
    expect(ray.direction.y).toBeGreaterThan(0);
  });

  it('bottom-row rays carry a negative trueUp component', () => {
    const ray = generateRay(camera, 0.5, 1);
    expect(ray.direction.y).toBeLessThan(0);
  });

  it('left-column rays carry a negative right component', () => {
    const ray = generateRay(camera, 0, 0.5);
    expect(ray.direction.x).toBeLessThan(0);
  });

  it('right-column rays carry a positive right component', () => {
    const ray = generateRay(camera, 1, 0.5);
    expect(ray.direction.x).toBeGreaterThan(0);
  });
});

describe('generateRay — input validation', () => {
  const camera = sampleCamera();

  it('rejects non-finite u', () => {
    expect(() => generateRay(camera, Number.NaN, 0.5)).toThrow(/u must be a finite number/);
    expect(() => generateRay(camera, Number.POSITIVE_INFINITY, 0.5)).toThrow(/u must be a finite number/);
  });

  it('rejects non-finite v', () => {
    expect(() => generateRay(camera, 0.5, Number.NaN)).toThrow(/v must be a finite number/);
  });

  it('accepts samples outside [0, 1] (off-screen rays, not an error)', () => {
    const inside = generateRay(camera, 0.5, 0.5);
    const outsideTop = generateRay(camera, 0.5, -0.5);
    expect(lengthVec3(outsideTop.direction)).toBeCloseTo(1, 6);
    expect(outsideTop.direction.y).toBeGreaterThan(inside.direction.y);
  });
});

describe('pointAtCameraSample', () => {
  const camera = sampleCamera();

  it('agrees with pointAtRay(generateRay(...), t) at t = 0 (returns the camera position)', () => {
    expect(approxEqualsVec3(pointAtCameraSample(camera, 0.5, 0.5, 0), camera.position)).toBe(true);
  });

  it('agrees with pointAtRay(generateRay(...), t) at t = 1 (one unit along the direction)', () => {
    const center = generateRay(camera, 0.5, 0.5);
    const point = pointAtCameraSample(camera, 0.5, 0.5, 1);
    expect(approxEqualsVec3(point, pointAtRay(center, 1))).toBe(true);
    expect(approxEqualsVec3(point, scaleVec3(center.direction, 1))).toBe(true);
  });

  it('produces a point at the same height as the top-left ray scaled to t = 5', () => {
    const topLeft = generateRay(camera, 0, 0);
    const point = pointAtCameraSample(camera, 0, 0, 5);
    expect(approxEqualsVec3(point, pointAtRay(topLeft, 5))).toBe(true);
  });
});

describe('isInViewport', () => {
  it('returns true for samples inside [0, 1] × [0, 1]', () => {
    expect(isInViewport(0, 0)).toBe(true);
    expect(isInViewport(0.5, 0.5)).toBe(true);
    expect(isInViewport(1, 1)).toBe(true);
  });

  it('returns false for samples outside the viewport', () => {
    expect(isInViewport(-0.1, 0.5)).toBe(false);
    expect(isInViewport(1.1, 0.5)).toBe(false);
    expect(isInViewport(0.5, -0.1)).toBe(false);
    expect(isInViewport(0.5, 1.1)).toBe(false);
  });
});

describe('Camera + Ray integration with S1-004 primitives', () => {
  it('the ray origin and direction are the same value references returned to the caller', () => {
    const camera = sampleCamera();
    const ray = generateRay(camera, 0.5, 0.5);
    expect(ray.origin).toBe(camera.position);
  });

  it('produces deterministic rays for the same camera and sample', () => {
    const camera = sampleCamera();
    const a = generateRay(camera, 0.5, 0.5);
    const b = generateRay(camera, 0.5, 0.5);
    expect(approxEqualsVec3(a.direction, b.direction)).toBe(true);
  });

  it('does not introduce NaN for cameras whose forward is well-defined', () => {
    const camera = sampleCamera();
    for (let i = 0; i <= 4; i += 1) {
      const u = i / 4;
      for (let j = 0; j <= 4; j += 1) {
        const v = j / 4;
        const ray = generateRay(camera, u, v);
        expect(Number.isNaN(ray.direction.x)).toBe(false);
        expect(Number.isNaN(ray.direction.y)).toBe(false);
        expect(Number.isNaN(ray.direction.z)).toBe(false);
        expect(lengthVec3(ray.direction)).toBeCloseTo(1, 6);
      }
    }
  });
});

describe('Deterministic case — translated camera at (0, 0, 5)', () => {
  it('produces the same direction at (0.5, 0.5) but a translated origin', () => {
    const camera = createCamera({
      position: createVec3(0, 0, 5),
      lookAt: VEC3_ZERO,
      fov: Math.PI / 3,
      aspect: 16 / 10,
    });
    const ray = generateRay(camera, 0.5, 0.5);
    expect(approxEqualsVec3(ray.origin, createVec3(0, 0, 5))).toBe(true);
    expect(approxEqualsVec3(ray.direction, createVec3(0, 0, -1))).toBe(true);
  });

  it('pointAtCameraSample with t = 5 at (0.5, 0.5) lands at the origin', () => {
    const camera = createCamera({
      position: createVec3(0, 0, 5),
      lookAt: VEC3_ZERO,
      fov: Math.PI / 3,
      aspect: 16 / 10,
    });
    const point = pointAtCameraSample(camera, 0.5, 0.5, 5);
    expect(approxEqualsVec3(point, VEC3_ZERO)).toBe(true);
  });
});

describe('Deterministic case — camera with custom up', () => {
  it('a camera at (0, 5, 0) looking at the origin with up (0, 0, −1) has a well-defined basis', () => {
    const camera = createCamera({
      position: createVec3(0, 5, 0),
      lookAt: VEC3_ZERO,
      up: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: 16 / 10,
    });
    // forward = normalize((0,0,0) - (0,5,0)) = (0, -1, 0)
    // right  = normalize(cross((0,-1,0), (0,0,-1))) = normalize((1, 0, 0)) = (1, 0, 0)
    // trueUp = normalize(cross((1,0,0), (0,-1,0)))   = normalize((0, 0, -1)) = (0, 0, -1)
    expect(approxEqualsVec3(camera.forward, createVec3(0, -1, 0))).toBe(true);
    expect(approxEqualsVec3(camera.right, createVec3(1, 0, 0))).toBe(true);
    expect(approxEqualsVec3(camera.trueUp, createVec3(0, 0, -1))).toBe(true);

    const ray = generateRay(camera, 0.5, 0.5);
    expect(approxEqualsVec3(ray.direction, createVec3(0, -1, 0))).toBe(true);
  });
});