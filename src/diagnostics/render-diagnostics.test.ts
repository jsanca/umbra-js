import { describe, expect, it } from 'vitest';
import {
  createRenderDiagnostics,
  formatDimensions,
  formatRenderTime,
  formatStatus,
} from './render-diagnostics.js';

function scriptedClock(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[Math.min(i, values.length - 1)];
    i += 1;
    return value;
  };
}

describe('createRenderDiagnostics', () => {
  it('starts in the idle state with zero dimensions and zero time', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    expect(sink.snapshot.status).toBe('idle');
    expect(sink.snapshot.width).toBe(0);
    expect(sink.snapshot.height).toBe(0);
    expect(sink.snapshot.renderTimeMs).toBe(0);
    expect(sink.snapshot.startedAt).toBe(0);
    expect(sink.snapshot.completedAt).toBe(0);
    expect(sink.snapshot.errorMessage).toBeUndefined();
  });

  it('transitions idle → rendering → complete with the correct elapsed time', () => {
    const clock = scriptedClock([100, 142.5]);
    const sink = createRenderDiagnostics({ clock });

    sink.onRenderStart(640, 400, clock());
    expect(sink.snapshot.status).toBe('rendering');
    expect(sink.snapshot.width).toBe(640);
    expect(sink.snapshot.height).toBe(400);
    expect(sink.snapshot.startedAt).toBe(100);
    expect(sink.snapshot.completedAt).toBe(100);

    sink.onRenderComplete(640, 400, sink.snapshot.startedAt, clock());
    expect(sink.snapshot.status).toBe('complete');
    expect(sink.snapshot.renderTimeMs).toBeCloseTo(42.5, 5);
    expect(sink.snapshot.completedAt).toBe(142.5);
  });

  it('records an error message and stops at the error status', () => {
    const clock = scriptedClock([10, 25]);
    const sink = createRenderDiagnostics({ clock });

    sink.onRenderStart(64, 32, clock());
    sink.onRenderError(64, 32, sink.snapshot.startedAt, new Error('boom'));

    expect(sink.snapshot.status).toBe('error');
    expect(sink.snapshot.errorMessage).toBe('boom');
    expect(sink.snapshot.renderTimeMs).toBeCloseTo(15, 5);
  });

  it('stringifies non-Error error values', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    sink.onRenderStart(1, 1, 0);
    sink.onRenderError(1, 1, 0, 'plain-string');
    expect(sink.snapshot.errorMessage).toBe('plain-string');
  });

  it('rejects invalid dimensions on start', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    expect(() => sink.onRenderStart(0, 1, 0)).toThrow(/width must be a positive integer/);
    expect(() => sink.onRenderStart(1, -1, 0)).toThrow(RangeError);
    expect(() => sink.onRenderStart(1.5, 1, 0)).toThrow(RangeError);
  });

  it('rejects non-finite timestamps', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    sink.onRenderStart(1, 1, 0);
    expect(() => sink.onRenderComplete(1, 1, Number.NaN, 0)).toThrow(/finite number/);
  });
});

describe('formatDimensions', () => {
  it('formats dimensions with the multiplication sign', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    sink.onRenderStart(640, 400, 0);
    sink.onRenderComplete(640, 400, 0, 10);
    expect(formatDimensions(sink.snapshot)).toBe('640 \u00d7 400');
  });
});

describe('formatRenderTime', () => {
  it('returns an em dash when idle', () => {
    expect(formatRenderTime(createRenderDiagnostics({ clock: () => 0 }).snapshot)).toBe('\u2014');
  });

  it('renders render time in milliseconds with two decimals', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    sink.onRenderStart(1, 1, 0);
    sink.onRenderComplete(1, 1, 0, 12.345);
    expect(formatRenderTime(sink.snapshot)).toBe('12.35 ms');
  });
});

describe('formatStatus', () => {
  it('formats each status with the right text', () => {
    const sink = createRenderDiagnostics({ clock: () => 0 });
    expect(formatStatus(sink.snapshot)).toBe('Ready');

    sink.onRenderStart(640, 400, 100);
    expect(formatStatus(sink.snapshot)).toBe('Rendering\u2026');

    sink.onRenderComplete(640, 400, 100, 142.5);
    expect(formatStatus(sink.snapshot)).toBe('Rendered 640 \u00d7 400 in 42.50 ms');

    sink.onRenderStart(1, 1, 0);
    sink.onRenderError(1, 1, 0, new Error('nope'));
    expect(formatStatus(sink.snapshot)).toBe('Render failed: nope');
  });
});
