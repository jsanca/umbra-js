import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountShell } from './shell.js';

function freshRoot(): HTMLElement {
  const root = document.createElement('div');
  document.body.replaceChildren(root);
  return root;
}

function byTestId(id: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
}

describe('UMBRA-S1-002 — static laboratory shell (AC-PROD-001, 003, 004)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('mounts the header with Umbra identity and tagline', () => {
    const root = freshRoot();
    mountShell(root);

    const header = byTestId('umbra-header');
    expect(header).not.toBeNull();
    expect(header?.tagName).toBe('HEADER');
    expect(header?.querySelector('h1')?.textContent).toBe('Umbra');
    expect(header?.querySelector('.tagline')?.textContent).toBe(
      'A small laboratory for learning how light becomes pixels.',
    );
  });

  it('exposes the viewport placeholder as a canvas with explicit dimensions', () => {
    const root = freshRoot();
    mountShell(root, { canvasWidth: 480, canvasHeight: 300 });

    const canvas = byTestId('umbra-viewport');
    expect(canvas).not.toBeNull();
    expect(canvas?.tagName).toBe('CANVAS');
    expect(canvas?.getAttribute('aria-label')).toMatch(/viewport/i);
    expect(canvas?.getAttribute('role')).toBe('img');
    expect((canvas as HTMLCanvasElement | null)?.width).toBe(480);
    expect((canvas as HTMLCanvasElement | null)?.height).toBe(300);

    const dims = byTestId('umbra-viewport-dims');
    expect(dims?.textContent).toBe('480 \u00d7 300');
  });

  it('renders exactly one accessible Render control, currently disabled', () => {
    const root = freshRoot();
    mountShell(root);

    const renders = document.querySelectorAll('[data-testid="umbra-render"]');
    expect(renders).toHaveLength(1);

    const btn = renders[0] as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.type).toBe('button');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-label')).toMatch(/render/i);
    expect(btn.textContent?.trim()).toBe('Render');
  });

  it('shows a status region with role=status and aria-live=polite', () => {
    const root = freshRoot();
    mountShell(root);

    const status = byTestId('umbra-status');
    expect(status).not.toBeNull();
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it('shows a render-time region with role=timer', () => {
    const root = freshRoot();
    mountShell(root);

    const time = byTestId('umbra-render-time');
    expect(time).not.toBeNull();
    expect(time?.getAttribute('role')).toBe('timer');
    expect(time?.textContent).toBe('\u2014');
  });

  it('identifies the current concept as Ray–Sphere Intersection with a quadratic-based lesson body', () => {
    const root = freshRoot();
    mountShell(root);

    const concept = byTestId('umbra-current-concept');
    expect(concept?.textContent?.trim()).toBe('Ray\u2013Sphere Intersection');

    const body = byTestId('umbra-lesson-body');
    expect(body).not.toBeNull();
    expect(body?.textContent).toMatch(/ray\/sphere quadratic/i);
    expect(body?.textContent).toMatch(/nearest/i);
  });

  it('renders the pipeline in instructional order with Intersection active', () => {
    const root = freshRoot();
    mountShell(root);

    const list = byTestId('umbra-pipeline');
    expect(list?.tagName).toBe('OL');

    const items = Array.from(list?.querySelectorAll('li') ?? []);
    const labels = items.map((li) => li.querySelector('.pipeline-step-label')?.textContent?.trim());
    expect(labels).toEqual([
      'Ray generation',
      'Intersection',
      'Lighting',
      'Canvas output',
    ]);

    const active = items.find((li) => li.getAttribute('aria-current') === 'step');
    expect(active?.getAttribute('data-testid')).toBe('pipeline-intersection');
    expect(active?.querySelector('.pipeline-step-label')?.textContent).toBe('Intersection');

    const others = items.filter((li) => li !== active);
    for (const li of others) {
      expect(li.getAttribute('aria-current')).toBeNull();
    }
  });

  it('exposes scene metadata for camera, geometry, light, and samples', () => {
    const root = freshRoot();
    mountShell(root);

    const scene = byTestId('umbra-scene');
    expect(scene).not.toBeNull();

    const labels = Array.from(scene?.querySelectorAll('dt') ?? []).map((dt) =>
      dt.textContent?.trim().toLowerCase(),
    );
    const values = Array.from(scene?.querySelectorAll('dd') ?? []).map((dd) =>
      dd.textContent?.trim(),
    );

    expect(labels).toEqual(expect.arrayContaining(['camera', 'geometry', 'light', 'samples']));
    expect(values.length).toBe(labels.length);
  });
});

describe('UMBRA-S1-002 — TC-S1-003 (no static external render image)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('does not embed any external render image in the shell', () => {
    const root = freshRoot();
    mountShell(root);

    const imgs = Array.from(document.querySelectorAll('img'));
    expect(imgs).toHaveLength(0);

    const externals = Array.from(
      document.querySelectorAll('link[rel*="icon"], link[rel="stylesheet"]'),
    );
    for (const link of externals) {
      const href = link.getAttribute('href') ?? '';
      expect(href.startsWith('http')).toBe(false);
    }

    expect(document.querySelector('script[src^="http"]')).toBeNull();
  });
});

describe('UMBRA-S1-002 — TC-S1-004 (keyboard accessibility)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('keeps the Render button keyboard-reachable but inert until the renderer is wired', () => {
    const root = freshRoot();
    mountShell(root);

    const btn = document.querySelector<HTMLButtonElement>('[data-testid="umbra-render"]');
    expect(btn).not.toBeNull();
    expect(btn?.tagName).toBe('BUTTON');
    expect(btn?.type).toBe('button');
    expect(btn?.disabled).toBe(true);
    expect(btn?.getAttribute('aria-label')).toMatch(/render/i);

    const liveBtn = document.createElement('button');
    liveBtn.type = 'button';
    document.body.append(liveBtn);
    liveBtn.focus();
    expect(document.activeElement).toBe(liveBtn);
  });

  it('every region uses semantic landmarks with stable identifiers', () => {
    const root = freshRoot();
    mountShell(root);

    expect(byTestId('umbra-header')?.tagName).toBe('HEADER');
    expect(byTestId('umbra-scene')?.tagName).toBe('SECTION');
    expect(document.querySelector('main.app-main')).not.toBeNull();
    expect(byTestId('umbra-pipeline')?.tagName).toBe('OL');
  });
});

describe('UMBRA-S1-002 — re-mount idempotency', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('replaces children on a second mount without duplicating regions', () => {
    const root = freshRoot();
    mountShell(root);
    mountShell(root);

    expect(document.querySelectorAll('[data-testid="umbra-header"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-testid="umbra-viewport"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-testid="umbra-render"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-testid="umbra-pipeline"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-testid="umbra-current-concept"]')).toHaveLength(1);
  });
});

describe('UMBRA-S1-003 — render-controller wiring (TC-S1-011)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('enables the Render button and invokes onRender when clicked', () => {
    const root = freshRoot();
    const onRender = vi.fn();
    mountShell(root, { onRender });

    const btn = document.querySelector<HTMLButtonElement>('[data-testid="umbra-render"]');
    expect(btn?.disabled).toBe(false);

    btn?.click();
    expect(onRender).toHaveBeenCalledTimes(1);

    btn?.click();
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it('keeps the Render button disabled when no onRender handler is provided', () => {
    const root = freshRoot();
    mountShell(root);

    const btn = document.querySelector<HTMLButtonElement>('[data-testid="umbra-render"]');
    expect(btn?.disabled).toBe(true);
  });

  it('returns live element handles for the controller to wire', () => {
    const root = freshRoot();
    const onRender = vi.fn();
    const handle = mountShell(root, {
      canvasWidth: 96,
      canvasHeight: 64,
      onRender,
    });

    expect(handle.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(handle.canvas.width).toBe(96);
    expect(handle.canvas.height).toBe(64);
    expect(handle.renderButton).toBeInstanceOf(HTMLButtonElement);
    expect(handle.renderButton.disabled).toBe(false);
    expect(handle.statusElement).toBeInstanceOf(HTMLElement);
    expect(handle.dimsElement).toBeInstanceOf(HTMLElement);
    expect(handle.timeElement).toBeInstanceOf(HTMLElement);

    handle.renderButton.click();
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate event handlers when mountShell is re-called with onRender', () => {
    const root = freshRoot();
    const onRender = vi.fn();
    mountShell(root, { onRender });
    mountShell(root, { onRender });

    const btn = document.querySelector<HTMLButtonElement>('[data-testid="umbra-render"]');
    btn?.click();
    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('does not call onRender when no handler was ever provided', () => {
    const root = freshRoot();
    const onRender = vi.fn();
    mountShell(root, { onRender });

    const fresh = freshRoot();
    mountShell(fresh);

    const btn = document.querySelector<HTMLButtonElement>('[data-testid="umbra-render"]');
    expect(btn?.disabled).toBe(true);
    btn?.click();
    expect(onRender).not.toHaveBeenCalled();
  });
});
