/**
 * Render controller — orchestrates a single render pass for the S1-003 smoke
 * path. Per ADR-002, this is the only module permitted to depend on both the
 * pure rendering core and the Canvas output adapter.
 *
 * Responsibilities:
 *   1. resolve a 2D context from the supplied canvas;
 *   2. ask the pixel-buffer generator to fill the requested dimensions;
 *   3. delegate the buffer write to the Canvas output adapter;
 *   4. record timing/status through the diagnostics adapter;
 *   5. project the diagnostics snapshot onto the UI status/dims/time elements.
 */

import type { PixelBuffer } from '../core/pixel-buffer.js';
import {
  createSolidColorGenerator,
  SMOKE_FILL_COLOR,
  type PixelBufferGenerator,
} from '../core/smoke-generator.js';
import type { CanvasOutputAdapter } from '../canvas/canvas-output.js';
import { createCanvasOutputAdapter } from '../canvas/canvas-output.js';
import {
  createRenderDiagnostics,
  formatDimensions,
  formatRenderTime,
  formatStatus,
  type RenderDiagnosticsSink,
  type RenderDiagnosticsSnapshot,
} from '../diagnostics/render-diagnostics.js';

export interface RenderControllerTarget {
  readonly canvas: HTMLCanvasElement;
  readonly statusElement: HTMLElement;
  readonly dimsElement: HTMLElement;
  readonly timeElement?: HTMLElement;
}

export interface RenderControllerOptions {
  readonly target: RenderControllerTarget;
  readonly width: number;
  readonly height: number;
  readonly clock?: () => number;
  readonly generator?: PixelBufferGenerator;
  readonly adapter?: CanvasOutputAdapter;
  readonly diagnostics?: RenderDiagnosticsSink;
}

export interface RenderResult {
  readonly diagnostics: RenderDiagnosticsSnapshot;
  readonly buffer: PixelBuffer | null;
}

export interface RenderController {
  readonly diagnostics: RenderDiagnosticsSink;
  render(): RenderResult;
}

export function createRenderController(options: RenderControllerOptions): RenderController {
  const clock = options.clock ?? defaultClock;
  const generator = options.generator ?? createSolidColorGenerator(SMOKE_FILL_COLOR);
  const adapter = options.adapter ?? createCanvasOutputAdapter();
  const diagnostics =
    options.diagnostics ?? createRenderDiagnostics({ clock });
  const { canvas, statusElement, dimsElement, timeElement } = options.target;
  const { width, height } = options;

  assertCanvasSize(canvas, width, height);
  writeIdleStatus(statusElement, dimsElement, timeElement, width, height);

  return {
    diagnostics,
    render() {
      const startedAt = clock();
      diagnostics.onRenderStart(width, height, startedAt);
      writeRenderingStatus(statusElement, dimsElement, timeElement, width, height);
      try {
        const buffer = generator(width, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('UMBRA: failed to acquire Canvas 2D context');
        }
        adapter.writeToContext(ctx, buffer);
        const completedAt = clock();
        diagnostics.onRenderComplete(width, height, startedAt, completedAt);
        writeDiagnosticsStatus(
          statusElement,
          dimsElement,
          timeElement,
          diagnostics.snapshot,
        );
        return { diagnostics: diagnostics.snapshot, buffer };
      } catch (error) {
        diagnostics.onRenderError(width, height, startedAt, error);
        writeDiagnosticsStatus(
          statusElement,
          dimsElement,
          timeElement,
          diagnostics.snapshot,
        );
        return { diagnostics: diagnostics.snapshot, buffer: null };
      }
    },
  };
}

function writeIdleStatus(
  statusEl: HTMLElement,
  dimsEl: HTMLElement,
  timeEl: HTMLElement | undefined,
  width: number,
  height: number,
): void {
  statusEl.textContent = 'Ready';
  dimsEl.textContent = `${width} \u00d7 ${height}`;
  if (timeEl) {
    timeEl.textContent = '\u2014';
  }
}

function writeRenderingStatus(
  statusEl: HTMLElement,
  dimsEl: HTMLElement,
  timeEl: HTMLElement | undefined,
  width: number,
  height: number,
): void {
  statusEl.textContent = 'Rendering\u2026';
  dimsEl.textContent = `${width} \u00d7 ${height}`;
  if (timeEl) {
    timeEl.textContent = '\u2026';
  }
}

function writeDiagnosticsStatus(
  statusEl: HTMLElement,
  dimsEl: HTMLElement,
  timeEl: HTMLElement | undefined,
  snapshot: RenderDiagnosticsSnapshot,
): void {
  statusEl.textContent = formatStatus(snapshot);
  dimsEl.textContent = formatDimensions(snapshot);
  if (timeEl) {
    timeEl.textContent = formatRenderTime(snapshot);
  }
}

function assertCanvasSize(canvas: HTMLCanvasElement, width: number, height: number): void {
  if (canvas.width !== width || canvas.height !== height) {
    throw new Error(
      `UMBRA: controller target canvas is ${canvas.width}x${canvas.height}, expected ${width}x${height}`,
    );
  }
}

function defaultClock(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}
