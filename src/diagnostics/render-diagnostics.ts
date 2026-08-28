/**
 * Diagnostics adapter — the lightweight seam that records elapsed render time,
 * status, output dimensions, and completion metadata. Per ADR-002 this is a
 * passive value object, not a plugin system. It depends only on language types
 * and an injectable clock; the UI shell reads the rendered values, but no UI
 * type imports back into this module.
 */

export type RenderStatus = 'idle' | 'rendering' | 'complete' | 'error';

export interface RenderDiagnosticsSnapshot {
  readonly status: RenderStatus;
  readonly width: number;
  readonly height: number;
  readonly startedAt: number;
  readonly completedAt: number;
  readonly renderTimeMs: number;
  readonly errorMessage?: string;
}

export interface RenderDiagnosticsSink {
  readonly snapshot: RenderDiagnosticsSnapshot;
  onRenderStart(width: number, height: number, startedAt: number): void;
  onRenderComplete(width: number, height: number, startedAt: number, completedAt: number): void;
  onRenderError(width: number, height: number, startedAt: number, error: unknown): void;
}

export interface RenderDiagnosticsOptions {
  readonly clock?: () => number;
}

export function createRenderDiagnostics(
  options: RenderDiagnosticsOptions = {},
): RenderDiagnosticsSink {
  const clock = options.clock ?? defaultClock;
  let snapshot: RenderDiagnosticsSnapshot = idleSnapshot();

  return {
    get snapshot() {
      return snapshot;
    },
    onRenderStart(width, height, startedAt) {
      assertPositiveInteger('width', width);
      assertPositiveInteger('height', height);
      assertFiniteNumber('startedAt', startedAt);
      snapshot = {
        status: 'rendering',
        width,
        height,
        startedAt,
        completedAt: startedAt,
        renderTimeMs: 0,
      };
    },
    onRenderComplete(width, height, startedAt, completedAt) {
      assertPositiveInteger('width', width);
      assertPositiveInteger('height', height);
      assertFiniteNumber('startedAt', startedAt);
      assertFiniteNumber('completedAt', completedAt);
      snapshot = {
        status: 'complete',
        width,
        height,
        startedAt,
        completedAt,
        renderTimeMs: completedAt - startedAt,
      };
    },
    onRenderError(width, height, startedAt, error) {
      assertPositiveInteger('width', width);
      assertPositiveInteger('height', height);
      assertFiniteNumber('startedAt', startedAt);
      const completedAt = clock();
      snapshot = {
        status: 'error',
        width,
        height,
        startedAt,
        completedAt,
        renderTimeMs: completedAt - startedAt,
        errorMessage: errorMessageFor(error),
      };
    },
  };
}

export function formatDimensions(snapshot: RenderDiagnosticsSnapshot): string {
  return `${snapshot.width} \u00d7 ${snapshot.height}`;
}

export function formatRenderTime(snapshot: RenderDiagnosticsSnapshot): string {
  if (snapshot.status === 'idle') {
    return '\u2014';
  }
  return `${snapshot.renderTimeMs.toFixed(2)} ms`;
}

export function formatStatus(snapshot: RenderDiagnosticsSnapshot): string {
  switch (snapshot.status) {
    case 'idle':
      return 'Ready';
    case 'rendering':
      return 'Rendering\u2026';
    case 'complete':
      return `Rendered ${formatDimensions(snapshot)} in ${formatRenderTime(snapshot)}`;
    case 'error':
      return `Render failed: ${snapshot.errorMessage ?? 'unknown error'}`;
  }
}

function idleSnapshot(): RenderDiagnosticsSnapshot {
  return {
    status: 'idle',
    width: 0,
    height: 0,
    startedAt: 0,
    completedAt: 0,
    renderTimeMs: 0,
  };
}

function defaultClock(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function errorMessageFor(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function assertPositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(
      `UMBRA: diagnostics ${name} must be a positive integer, received ${value}`,
    );
  }
}

function assertFiniteNumber(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      `UMBRA: diagnostics ${name} must be a finite number, received ${value}`,
    );
  }
}
