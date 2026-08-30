import { describe, expect, it } from 'vitest';
import * as RenderRequestModule from './render-request.js';
import {
  type RenderRequestV0,
  createRequestRenderGenerator,
  validateRenderRequest,
} from './render-request.js';
import { createCamera, createVec3 } from './camera.js';
import { createSphereRenderGenerator } from './sphere-renderer.js';
import { createSphere } from './sphere.js';
import {
  backgroundColorForDirection,
} from './background-gradient.js';
import {
  computeSphereNormal,
  normalToRgbaColor,
} from './normal.js';
import { intersectSphere } from './sphere.js';
import { generateRay } from './camera.js';
import { PIXEL_CHANNELS } from './pixel-buffer.js';
import { createPointLight } from './light.js';
import { diffuseShadingColor } from './light.js';

function fixedSceneRequest(width = 640, height = 400): RenderRequestV0 {
  return {
    output: { width, height },
    camera: {
      position: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: -1 },
      fieldOfView: Math.PI / 3,
    },
    scene: {
      sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
    },
  };
}

function directSphereRenderGenerator(width = 640, height = 400) {
  const camera = createCamera({
    position: createVec3(0, 0, 0),
    lookAt: createVec3(0, 0, -1),
    fov: Math.PI / 3,
    aspect: width / height,
  });
  const sphere = createSphere(createVec3(0, 0, -3), 1);
  return createSphereRenderGenerator(camera, sphere)(width, height);
}

describe('validateRenderRequest — valid requests', () => {
  it('accepts the documented fixed-scene request with only required fields', () => {
    expect(() => validateRenderRequest(fixedSceneRequest())).not.toThrow();
  });

  it('accepts a request with an optional camera.up', () => {
    const request: RenderRequestV0 = {
      output: { width: 320, height: 200 },
      camera: {
        position: { x: 0, y: 0, z: 0 },
        lookAt: { x: 0, y: 0, z: -1 },
        up: { x: 0, y: 0, z: -1 },
        fieldOfView: Math.PI / 4,
      },
      scene: { sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 } },
    };
    expect(() => validateRenderRequest(request)).not.toThrow();
  });

  it('accepts a request with an explicit background gradient', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        background: {
          top: { r: 0x66, g: 0x4d, b: 0xb3 },
          bottom: { r: 0x0c, g: 0x07, b: 0x1f },
        },
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
      },
    };
    expect(() => validateRenderRequest(request)).not.toThrow();
  });
});

describe('validateRenderRequest — top-level shape', () => {
  it('rejects a non-object payload (null)', () => {
    expect(() => validateRenderRequest(null)).toThrow(/render request must be an object/);
  });

  it('rejects a primitive payload', () => {
    expect(() => validateRenderRequest(42)).toThrow(/render request must be an object/);
    expect(() => validateRenderRequest('hello')).toThrow(/render request must be an object/);
  });

  it('rejects a payload missing output', () => {
    const payload = {
      camera: fixedSceneRequest().camera,
      scene: fixedSceneRequest().scene,
    };
    expect(() => validateRenderRequest(payload)).toThrow(/render request output/);
  });

  it('rejects a payload missing camera', () => {
    const payload = {
      output: fixedSceneRequest().output,
      scene: fixedSceneRequest().scene,
    };
    expect(() => validateRenderRequest(payload)).toThrow(/render request camera/);
  });

  it('rejects a payload missing scene', () => {
    const payload = {
      output: fixedSceneRequest().output,
      camera: fixedSceneRequest().camera,
    };
    expect(() => validateRenderRequest(payload)).toThrow(/render request scene/);
  });
});

describe('validateRenderRequest — output dimensions', () => {
  it('rejects a non-positive width', () => {
    const request = { ...fixedSceneRequest(), output: { width: 0, height: 400 } };
    expect(() => validateRenderRequest(request)).toThrow(/output\.width must be a positive integer/);
  });

  it('rejects a non-integer width', () => {
    const request = { ...fixedSceneRequest(), output: { width: 640.5, height: 400 } };
    expect(() => validateRenderRequest(request)).toThrow(/output\.width must be a positive integer/);
  });

  it('rejects a NaN height', () => {
    const request = { ...fixedSceneRequest(), output: { width: 640, height: Number.NaN } };
    expect(() => validateRenderRequest(request)).toThrow(/output\.height must be a positive integer/);
  });

  it('rejects Infinity in dimensions', () => {
    const request = { ...fixedSceneRequest(), output: { width: Number.POSITIVE_INFINITY, height: 400 } };
    expect(() => validateRenderRequest(request)).toThrow(/output\.width must be a positive integer/);
  });
});

describe('validateRenderRequest — camera', () => {
  it('rejects a non-finite position coordinate', () => {
    const request = {
      ...fixedSceneRequest(),
      camera: { ...fixedSceneRequest().camera, position: { x: Number.NaN, y: 0, z: 0 } },
    };
    expect(() => validateRenderRequest(request)).toThrow(/camera\.position\.x must be a finite number/);
  });

  it('rejects a fieldOfView at or beyond π', () => {
    const request = {
      ...fixedSceneRequest(),
      camera: { ...fixedSceneRequest().camera, fieldOfView: Math.PI },
    };
    expect(() => validateRenderRequest(request)).toThrow(/camera\.fieldOfView must be in the open interval/);
  });

  it('rejects a non-positive fieldOfView', () => {
    const request = {
      ...fixedSceneRequest(),
      camera: { ...fixedSceneRequest().camera, fieldOfView: 0 },
    };
    expect(() => validateRenderRequest(request)).toThrow(/camera\.fieldOfView must be in the open interval/);
  });

  it('rejects a NaN fieldOfView', () => {
    const request = {
      ...fixedSceneRequest(),
      camera: { ...fixedSceneRequest().camera, fieldOfView: Number.NaN },
    };
    expect(() => validateRenderRequest(request)).toThrow(/camera\.fieldOfView must be a finite number/);
  });

  it('rejects a malformed camera.up (non-finite coordinate)', () => {
    const request = {
      ...fixedSceneRequest(),
      camera: {
        ...fixedSceneRequest().camera,
        up: { x: 0, y: Number.POSITIVE_INFINITY, z: 0 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/camera\.up\.y must be a finite number/);
  });
});

describe('validateRenderRequest — scene sphere', () => {
  it('rejects a non-positive radius', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: { sphere: { center: { x: 0, y: 0, z: -3 }, radius: 0 } },
    };
    expect(() => validateRenderRequest(request)).toThrow(/sphere\.radius must be a positive finite number/);
  });

  it('rejects a non-finite radius', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: { sphere: { center: { x: 0, y: 0, z: -3 }, radius: Number.NaN } },
    };
    expect(() => validateRenderRequest(request)).toThrow(/sphere\.radius must be a positive finite number/);
  });

  it('rejects a non-finite sphere center coordinate', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: { sphere: { center: { x: 0, y: Number.NaN, z: -3 }, radius: 1 } },
    };
    expect(() => validateRenderRequest(request)).toThrow(/sphere\.center\.y must be a finite number/);
  });
});

describe('validateRenderRequest — background colors', () => {
  it('rejects a color channel outside [0, 255]', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: {
        background: {
          top: { r: 256, g: 0, b: 0 },
          bottom: { r: 0, g: 0, b: 0 },
        },
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/background\.top\.r must be in \[0, 255\]/);
  });

  it('rejects a non-finite color channel', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: {
        background: {
          top: { r: Number.NaN, g: 0, b: 0 },
          bottom: { r: 0, g: 0, b: 0 },
        },
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/background\.top\.r must be a finite number/);
  });

  it('rejects a missing background.top or background.bottom', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: {
        background: {
          top: { r: 1, g: 2, b: 3 },
        } as unknown as { top: { r: number; g: number; b: number }; bottom: { r: number; g: number; b: number } },
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/background\.bottom must be an object/);
  });
});

describe('createRequestRenderGenerator — dimension contract', () => {
  it('produces a buffer of the requested output dimensions', () => {
    const generator = createRequestRenderGenerator(fixedSceneRequest(640, 400));
    const buffer = generator(640, 400);
    expect(buffer.width).toBe(640);
    expect(buffer.height).toBe(400);
  });

  it('throws when the controller requests dimensions that do not match the request output', () => {
    const generator = createRequestRenderGenerator(fixedSceneRequest(640, 400));
    expect(() => generator(320, 200)).toThrow(/output is 640x400, controller requested 320x200/);
  });

  it('throws when the controller requests a width that matches but a height that does not', () => {
    const generator = createRequestRenderGenerator(fixedSceneRequest(640, 400));
    expect(() => generator(640, 200)).toThrow(/output is 640x400/);
  });
});

describe('createRequestRenderGenerator — equivalence with the direct render path', () => {
  it('produces a byte-equal buffer to the direct sphere renderer for the fixed scene', () => {
    // The 640x400 buffer is the Sprint 1 fixed-scene dimensions; byte-equality
    // holds at any size (asserted below at 8x4 for the per-pixel contract). The
    // full-size comparison is bounded by a longer per-test timeout to keep it
    // deterministic across machine-load variance.
    const requestBuffer = createRequestRenderGenerator(fixedSceneRequest(640, 400))(640, 400);
    const directBuffer = directSphereRenderGenerator(640, 400);
    expect(Array.from(requestBuffer.data)).toEqual(Array.from(directBuffer.data));
  }, 20000);

  it('preserves the per-pixel contract: hits render normal shading, misses render the gradient', () => {
    const width = 8;
    const height = 4;
    const generator = createRequestRenderGenerator(fixedSceneRequest(width, height));
    const buffer = generator(width, height);

    // Recreate the camera directly for the consistency sweep.
    const camera = createCamera({
      position: createVec3(0, 0, 0),
      lookAt: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: width / height,
    });
    const sphere = createSphere(createVec3(0, 0, -3), 1);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        const expected = hit
          ? normalToRgbaColor(computeSphereNormal(hit))
          : backgroundColorForDirection(ray.direction);
        const base = (y * width + x) * PIXEL_CHANNELS;
        expect(buffer.data[base]).toBe(expected.r);
        expect(buffer.data[base + 1]).toBe(expected.g);
        expect(buffer.data[base + 2]).toBe(expected.b);
        expect(buffer.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('honors a custom background gradient override in the request', () => {
    const customLike = {
      top: { r: 10, g: 20, b: 30 },
      bottom: { r: 40, g: 50, b: 60 },
    };
    const customBackground = {
      top: { r: 10, g: 20, b: 30, a: 0xff },
      bottom: { r: 40, g: 50, b: 60, a: 0xff },
    };
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(8, 4),
      scene: {
        background: customLike,
        sphere: { center: { x: 0, y: 0, z: 5 }, radius: 1 },
      },
    };
    const generator = createRequestRenderGenerator(request);
    const buffer = generator(8, 4);

    const camera = createCamera({
      position: createVec3(0, 0, 0),
      lookAt: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: 8 / 4,
    });
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const u = (x + 0.5) / 8;
        const v = (y + 0.5) / 4;
        const ray = generateRay(camera, u, v);
        const expected = backgroundColorForDirection(ray.direction, customBackground);
        const base = (y * 8 + x) * PIXEL_CHANNELS;
        expect(buffer.data[base]).toBe(expected.r);
        expect(buffer.data[base + 1]).toBe(expected.g);
        expect(buffer.data[base + 2]).toBe(expected.b);
        expect(buffer.data[base + 3]).toBe(expected.a);
      }
    }
  });
});

describe('createRequestRenderGenerator — rejects invalid requests at runtime', () => {
  it('rejects a request whose output dimensions are non-positive (bypassing the type)', () => {
    const invalid = {
      ...fixedSceneRequest(),
      output: { width: 0, height: 400 },
    } as unknown as RenderRequestV0;
    expect(() => createRequestRenderGenerator(invalid)).toThrow(/output\.width/);
  });

  it('rejects a request whose camera.position is NaN', () => {
    const invalid = {
      ...fixedSceneRequest(),
      camera: {
        ...fixedSceneRequest().camera,
        position: { x: Number.NaN, y: 0, z: 0 },
      },
    } as unknown as RenderRequestV0;
    expect(() => createRequestRenderGenerator(invalid)).toThrow(/camera\.position\.x/);
  });

  it('rejects a request whose sphere.radius is negative', () => {
    const invalid = {
      ...fixedSceneRequest(),
      scene: { sphere: { center: { x: 0, y: 0, z: -3 }, radius: -1 } },
    } as unknown as RenderRequestV0;
    expect(() => createRequestRenderGenerator(invalid)).toThrow(/sphere\.radius/);
  });
});

describe('validateRenderRequest — scene.light', () => {
  it('accepts a request with an optional scene.light (position only, intensity defaults to 1)', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 2, z: -1 } },
      },
    };
    expect(() => validateRenderRequest(request)).not.toThrow();
  });

  it('accepts a request with an explicit positive intensity', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 2, z: -1 }, intensity: 0.5 },
      },
    };
    expect(() => validateRenderRequest(request)).not.toThrow();
  });

  it('rejects a non-finite light position coordinate', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: NaN, y: 0, z: 0 } },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/light\.position\.x/);
  });

  it('rejects a non-positive intensity', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 2, z: -1 }, intensity: 0 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/light\.intensity/);
  });

  it('rejects a NaN intensity', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 2, z: -1 }, intensity: Number.NaN },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/light\.intensity/);
  });

  it('rejects a negative intensity', () => {
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 2, z: -1 }, intensity: -1 },
      },
    };
    expect(() => validateRenderRequest(request)).toThrow(/light\.intensity/);
  });

  it('rejects a missing light.position', () => {
    const request = {
      ...fixedSceneRequest(),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { intensity: 1 },
      },
    } as unknown as RenderRequestV0;
    expect(() => validateRenderRequest(request)).toThrow(/light\.position/);
  });
});

describe('createRequestRenderGenerator — lit rendering (S1-010)', () => {
  function cameraFor(width: number, height: number) {
    return createCamera({
      position: createVec3(0, 0, 0),
      lookAt: createVec3(0, 0, -1),
      fov: Math.PI / 3,
      aspect: width / height,
    });
  }

  it('request without light: hit pixels equal normalToRgbaColor(computeSphereNormal(hit)) (S1-008 byte-equality)', () => {
    const width = 8;
    const height = 4;
    const camera = cameraFor(width, height);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const noLightBuffer = createRequestRenderGenerator(
      fixedSceneRequest(width, height),
    )(width, height);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (hit) {
          const base = (y * width + x) * PIXEL_CHANNELS;
          const expected = normalToRgbaColor(computeSphereNormal(hit));
          expect(noLightBuffer.data[base]).toBe(expected.r);
          expect(noLightBuffer.data[base + 1]).toBe(expected.g);
          expect(noLightBuffer.data[base + 2]).toBe(expected.b);
          expect(noLightBuffer.data[base + 3]).toBe(expected.a);
        }
      }
    }
  });

  it('request with light: hit pixels equal diffuseShadingColor(baseColor, normal, light, hit.point)', () => {
    const width = 8;
    const height = 4;
    const camera = cameraFor(width, height);
    const sphere = createSphere(createVec3(0, 0, -3), 1);
    const lightPosition = { x: 0, y: 5, z: -2 };
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(width, height),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: lightPosition, intensity: 1 },
      },
    };
    const litBuffer = createRequestRenderGenerator(request)(width, height);
    const light = createPointLight(createVec3(lightPosition.x, lightPosition.y, lightPosition.z), 1);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(sphere, ray);
        if (!hit) continue;
        const normal = computeSphereNormal(hit);
        const baseColor = normalToRgbaColor(normal);
        const expected = diffuseShadingColor(baseColor, normal, light, hit.point);
        const base = (y * width + x) * PIXEL_CHANNELS;
        expect(litBuffer.data[base]).toBe(expected.r);
        expect(litBuffer.data[base + 1]).toBe(expected.g);
        expect(litBuffer.data[base + 2]).toBe(expected.b);
        expect(litBuffer.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('request with light: a lit hit pixel is darker (or equal) than the same pixel without a light', () => {
    const width = 8;
    const height = 4;
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(width, height),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 5, z: -2 }, intensity: 1 },
      },
    };
    const noLightBuffer = createRequestRenderGenerator(
      fixedSceneRequest(width, height),
    )(width, height);
    const litBuffer = createRequestRenderGenerator(request)(width, height);

    // At least one hit pixel must be strictly darker under the light (the
    // diffuse factor t < 1 for that pixel); at least one must be unchanged
    // (back-facing pixels where t = 0 produce black, vs. the normal color).
    let darkenedCount = 0;
    for (let i = 0; i < litBuffer.data.length; i += PIXEL_CHANNELS) {
      const litR = litBuffer.data[i];
      const noLightR = noLightBuffer.data[i];
      const litG = litBuffer.data[i + 1];
      const noLightG = noLightBuffer.data[i + 1];
      const litB = litBuffer.data[i + 2];
      const noLightB = noLightBuffer.data[i + 2];
      if (litR < noLightR || litG < noLightG || litB < noLightB) {
        darkenedCount += 1;
      }
    }
    expect(darkenedCount).toBeGreaterThan(0);
  });

  it('request with light: miss pixels are unaffected (background gradient preserved)', () => {
    const width = 8;
    const height = 4;
    const camera = cameraFor(width, height);
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(width, height),
      scene: {
        sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
        light: { position: { x: 0, y: 5, z: -2 }, intensity: 1 },
      },
    };
    const litBuffer = createRequestRenderGenerator(request)(width, height);

    // Every miss pixel must equal backgroundColorForDirection(ray.direction).
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        const ray = generateRay(camera, u, v);
        const hit = intersectSphere(createSphere(createVec3(0, 0, -3), 1), ray);
        if (hit) continue;
        const expected = backgroundColorForDirection(ray.direction);
        const base = (y * width + x) * PIXEL_CHANNELS;
        expect(litBuffer.data[base]).toBe(expected.r);
        expect(litBuffer.data[base + 1]).toBe(expected.g);
        expect(litBuffer.data[base + 2]).toBe(expected.b);
        expect(litBuffer.data[base + 3]).toBe(expected.a);
      }
    }
  });

  it('request with light when sphere is behind the camera: every pixel equals background', () => {
    const width = 8;
    const height = 4;
    const camera = cameraFor(width, height);
    const request: RenderRequestV0 = {
      ...fixedSceneRequest(width, height),
      scene: {
        sphere: { center: { x: 0, y: 0, z: 5 }, radius: 1 }, // behind camera
        light: { position: { x: 0, y: 5, z: 2 }, intensity: 1 },
      },
    };
    const buffer = createRequestRenderGenerator(request)(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const u = (x + 0.5) / width;
        const v = (y + 0.5) / height;
        const expected = backgroundColorForDirection(
          generateRay(camera, u, v).direction,
        );
        const base = (y * width + x) * PIXEL_CHANNELS;
        expect(buffer.data[base]).toBe(expected.r);
        expect(buffer.data[base + 1]).toBe(expected.g);
        expect(buffer.data[base + 2]).toBe(expected.b);
        expect(buffer.data[base + 3]).toBe(expected.a);
      }
    }
  });
});

describe('RenderRequest v0 — boundary compliance (ADR-002)', () => {
  it('exports only the documented runtime surface (validateRenderRequest, createRequestRenderGenerator)', () => {
    // The DOM/Canvas/Vite/UI boundary is verified by the import list in the
    // S1-009 report (the module imports only pure-core siblings). At runtime
    // we assert the module's public surface is exactly the two documented
    // functions; type-only exports are erased at runtime by TypeScript.
    const exportedNames = Object.keys(RenderRequestModule).sort();
    expect(exportedNames).toEqual(['createRequestRenderGenerator', 'validateRenderRequest']);
  });
});