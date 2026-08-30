/**
 * Declarative `RenderRequest v0` — the DOM/Canvas-free input contract for
 * Sprint 1 rendering. Per ADR-002, this module must not import DOM, Canvas,
 * Vite, or UI types.
 *
 * ## Shape
 *
 * A `RenderRequestV0` has three top-level fields:
 *
 * - `output`: pixel dimensions (`width`, `height`, both positive integers).
 * - `camera`: pinhole camera config (`position`, `lookAt`, optional `up`,
 *   `fieldOfView` in radians — vertical). The aspect ratio is derived from
 *   `output.width / output.height`.
 * - `scene`: the fixed scene — a single `sphere` (`center`, `radius`) and an
 *   optional `background` gradient (`top`, `bottom`).
 *
 * `Vec3Like` is `{ x, y, z }`. `ColorLike` is `{ r, g, b }`; alpha is
 * always fully opaque in v0 and the conversion fills `a = 0xff`.
 *
 * ## Validation
 *
 * `validateRenderRequest(request)` is the single source of truth for
 * request-shape errors. It throws `RangeError` with a message that names the
 * failing field (e.g. `UMBRA: render request output.width must be a positive
 * integer, received NaN`). `createRequestRenderGenerator(request)` validates
 * the request internally and returns a `PixelBufferGenerator` whose buffer
 * dimensions are fixed by `request.output` — the controller must invoke the
 * generator with matching `(width, height)`; otherwise the generator throws.
 *
 * ## Evolution boundary
 *
 * v0 is deliberately minimal. Material, mesh, export, additional primitives
 * (planes, boxes, triangles), and additional light types are out of scope;
 * later slices add them only via an approved additive contract decision (see
 * the S1-009 slice plan stop condition). v0 does not validate or reject
 * unknown top-level fields — forward compatibility is the caller's
 * responsibility until an additive contract decision is approved.
 */

import { type Camera, createCamera } from './camera.js';
import {
  DEFAULT_BACKGROUND_GRADIENT,
  type BackgroundGradient,
} from './background-gradient.js';
import type { RgbaColor } from './pixel-buffer.js';
import { createSphereRenderGenerator } from './sphere-renderer.js';
import { createPointLight } from './light.js';
import { createSphere, type Sphere } from './sphere.js';
import type { PixelBufferGenerator } from './smoke-generator.js';
import type { Vec3 } from './vec3.js';

export interface Vec3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface ColorLike {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface BackgroundGradientLike {
  readonly top: ColorLike;
  readonly bottom: ColorLike;
}

export interface OutputConfig {
  readonly width: number;
  readonly height: number;
}

export interface CameraConfig {
  readonly position: Vec3Like;
  readonly lookAt: Vec3Like;
  readonly up?: Vec3Like;
  /** Vertical field of view in radians; must be in the open interval `(0, π)`. */
  readonly fieldOfView: number;
}

export interface SphereConfig {
  readonly center: Vec3Like;
  readonly radius: number;
}

export interface PointLightConfig {
  readonly position: Vec3Like;
  /** Positive finite multiplier; defaults to `1` when omitted. */
  readonly intensity?: number;
}

export interface SceneConfig {
  readonly background?: BackgroundGradientLike;
  readonly sphere: SphereConfig;
  /**
   * Optional point light for Lambertian diffuse shading. When present, hit
   * pixels use `diffuseShadingColor` (S1-010); when absent, hit pixels use
   * the S1-008 normal visualization. The byte-equality guarantee with
   * S1-008/009 for requests without a light is preserved.
   */
  readonly light?: PointLightConfig;
}

export interface RenderRequestV0 {
  readonly output: OutputConfig;
  readonly camera: CameraConfig;
  readonly scene: SceneConfig;
}

export function validateRenderRequest(request: unknown): void {
  if (request === null || typeof request !== 'object') {
    throw new RangeError(
      `UMBRA: render request must be an object, received ${describe(request)}`,
    );
  }
  const r = request as Record<string, unknown>;
  validateOutput(r.output);
  validateCamera(r.camera);
  validateScene(r.scene);
}

export function createRequestRenderGenerator(request: RenderRequestV0): PixelBufferGenerator {
  validateRenderRequest(request);

  const background: BackgroundGradient = request.scene.background
    ? toBackgroundGradient(request.scene.background)
    : DEFAULT_BACKGROUND_GRADIENT;

  const camera: Camera = createCamera({
    position: toVec3(request.camera.position),
    lookAt: toVec3(request.camera.lookAt),
    up: request.camera.up ? toVec3(request.camera.up) : undefined,
    fov: request.camera.fieldOfView,
    aspect: request.output.width / request.output.height,
  });

  const sphere: Sphere = createSphere(
    toVec3(request.scene.sphere.center),
    request.scene.sphere.radius,
  );

  const light = request.scene.light
    ? createPointLight(
        toVec3(request.scene.light.position),
        request.scene.light.intensity ?? 1,
      )
    : undefined;

  const inner = createSphereRenderGenerator(camera, sphere, { background, light });

  return (width: number, height: number) => {
    if (width !== request.output.width || height !== request.output.height) {
      throw new RangeError(
        `UMBRA: render request output is ${request.output.width}x${request.output.height}, controller requested ${width}x${height}`,
      );
    }
    return inner(request.output.width, request.output.height);
  };
}

function validateOutput(output: unknown): asserts output is OutputConfig {
  if (output === null || typeof output !== 'object') {
    throw new RangeError(`UMBRA: render request output must be an object`);
  }
  const o = output as Record<string, unknown>;
  assertPositiveInteger('render request output.width', o.width);
  assertPositiveInteger('render request output.height', o.height);
}

function validateCamera(camera: unknown): asserts camera is CameraConfig {
  if (camera === null || typeof camera !== 'object') {
    throw new RangeError(`UMBRA: render request camera must be an object`);
  }
  const c = camera as Record<string, unknown>;
  assertVec3('render request camera.position', c.position);
  assertVec3('render request camera.lookAt', c.lookAt);
  if (c.up !== undefined) {
    assertVec3('render request camera.up', c.up);
  }
  assertFieldOfView('render request camera.fieldOfView', c.fieldOfView);
}

function validateScene(scene: unknown): asserts scene is SceneConfig {
  if (scene === null || typeof scene !== 'object') {
    throw new RangeError(`UMBRA: render request scene must be an object`);
  }
  const s = scene as Record<string, unknown>;
  validateSphere('render request scene.sphere', s.sphere);
  if (s.background !== undefined) {
    validateBackgroundGradient('render request scene.background', s.background);
  }
  if (s.light !== undefined) {
    validatePointLight('render request scene.light', s.light);
  }
}

function validateSphere(path: string, sphere: unknown): asserts sphere is SphereConfig {
  if (sphere === null || typeof sphere !== 'object') {
    throw new RangeError(`UMBRA: ${path} must be an object`);
  }
  const sp = sphere as Record<string, unknown>;
  assertVec3(`${path}.center`, sp.center);
  assertPositiveFiniteNumber(`${path}.radius`, sp.radius);
}

function validatePointLight(
  path: string,
  light: unknown,
): asserts light is PointLightConfig {
  if (light === null || typeof light !== 'object') {
    throw new RangeError(`UMBRA: ${path} must be an object`);
  }
  const l = light as Record<string, unknown>;
  assertVec3(`${path}.position`, l.position);
  if (l.intensity !== undefined) {
    assertPositiveFiniteNumber(`${path}.intensity`, l.intensity);
  }
}

function validateBackgroundGradient(
  path: string,
  gradient: unknown,
): asserts gradient is BackgroundGradientLike {
  if (gradient === null || typeof gradient !== 'object') {
    throw new RangeError(`UMBRA: ${path} must be an object`);
  }
  const g = gradient as Record<string, unknown>;
  validateColor(`${path}.top`, g.top);
  validateColor(`${path}.bottom`, g.bottom);
}

function validateColor(path: string, color: unknown): asserts color is ColorLike {
  if (color === null || typeof color !== 'object') {
    throw new RangeError(`UMBRA: ${path} must be an object`);
  }
  const c = color as Record<string, unknown>;
  assertColorByte(`${path}.r`, c.r);
  assertColorByte(`${path}.g`, c.g);
  assertColorByte(`${path}.b`, c.b);
}

function assertObject(path: string, value: unknown): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    throw new RangeError(`UMBRA: ${path} must be an object, received ${describe(value)}`);
  }
}

function assertVec3(path: string, value: unknown): asserts value is Vec3Like {
  assertObject(path, value);
  const v = value as Record<string, unknown>;
  assertFiniteNumber(`${path}.x`, v.x);
  assertFiniteNumber(`${path}.y`, v.y);
  assertFiniteNumber(`${path}.z`, v.z);
}

function assertPositiveInteger(path: string, value: unknown): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new RangeError(
      `UMBRA: ${path} must be a positive integer, received ${describe(value)}`,
    );
  }
}

function assertFiniteNumber(path: string, value: unknown): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RangeError(
      `UMBRA: ${path} must be a finite number, received ${describe(value)}`,
    );
  }
}

function assertFieldOfView(path: string, value: unknown): void {
  assertFiniteNumber(path, value);
  if ((value as number) <= 0 || (value as number) >= Math.PI) {
    throw new RangeError(
      `UMBRA: ${path} must be in the open interval (0, π), received ${value}`,
    );
  }
}

function assertPositiveFiniteNumber(path: string, value: unknown): void {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
    throw new RangeError(
      `UMBRA: ${path} must be a positive finite number, received ${describe(value)}`,
    );
  }
}

function assertColorByte(path: string, value: unknown): void {
  assertFiniteNumber(path, value);
  if ((value as number) < 0 || (value as number) > 255) {
    throw new RangeError(
      `UMBRA: ${path} must be in [0, 255], received ${value}`,
    );
  }
}

function toVec3(v: Vec3Like): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

function toBackgroundGradient(g: BackgroundGradientLike): BackgroundGradient {
  return {
    top: toRgbaColor(g.top),
    bottom: toRgbaColor(g.bottom),
  };
}

function toRgbaColor(c: ColorLike): RgbaColor {
  return { r: c.r, g: c.g, b: c.b, a: 0xff };
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  return typeof value;
}