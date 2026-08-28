export interface ShellRenderHandler {
  (): void;
}

export interface ShellOptions {
  canvasWidth: number;
  canvasHeight: number;
  onRender?: ShellRenderHandler;
}

export interface ShellRoot extends HTMLElement {}

export interface ShellHandle {
  readonly canvas: HTMLCanvasElement;
  readonly renderButton: HTMLButtonElement;
  readonly statusElement: HTMLElement;
  readonly dimsElement: HTMLElement;
  readonly timeElement: HTMLElement | null;
}

const DEFAULT_OPTIONS: Required<Omit<ShellOptions, 'onRender'>> & {
  onRender?: ShellRenderHandler;
} = {
  canvasWidth: 640,
  canvasHeight: 400,
};

const PIPELINE_STEPS = [
  { id: 'ray-generation', label: 'Ray generation' },
  { id: 'intersection', label: 'Intersection' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'canvas-output', label: 'Canvas output' },
] as const;

const ACTIVE_STEP_ID = 'intersection';

export function mountShell(
  root: HTMLElement,
  options: Partial<ShellOptions> = {},
): ShellHandle {
  const opts: Required<Omit<ShellOptions, 'onRender'>> & {
    onRender?: ShellRenderHandler;
  } = { ...DEFAULT_OPTIONS, ...options };

  root.replaceChildren();
  root.classList.add('app');
  const refs = buildRefs();
  root.append(buildHeader(), buildMain(opts, refs));
  if (opts.onRender) {
    refs.renderButton.disabled = false;
    refs.renderButton.addEventListener('click', opts.onRender);
  }
  return refs;
}

interface ShellRefs {
  canvas: HTMLCanvasElement;
  renderButton: HTMLButtonElement;
  statusElement: HTMLElement;
  dimsElement: HTMLElement;
  timeElement: HTMLElement | null;
}

function buildRefs(): ShellRefs {
  return {
    canvas: null as unknown as HTMLCanvasElement,
    renderButton: null as unknown as HTMLButtonElement,
    statusElement: null as unknown as HTMLElement,
    dimsElement: null as unknown as HTMLElement,
    timeElement: null,
  };
}

function buildHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'app-header';
  header.setAttribute('data-testid', 'umbra-header');

  const title = document.createElement('h1');
  title.textContent = 'Umbra';

  const tagline = document.createElement('p');
  tagline.className = 'tagline';
  tagline.textContent = 'A small laboratory for learning how light becomes pixels.';

  header.append(title, tagline);
  return header;
}

function buildMain(
  opts: Required<Omit<ShellOptions, 'onRender'>> & { onRender?: ShellRenderHandler },
  refs: ShellRefs,
): HTMLElement {
  const main = document.createElement('main');
  main.className = 'app-main';

  main.append(buildScenePanel(), buildViewportPanel(opts, refs), buildLessonPanel());
  return main;
}

function buildScenePanel(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'panel scene-panel';
  section.setAttribute('aria-labelledby', 'scene-title');
  section.setAttribute('data-testid', 'umbra-scene');

  const heading = document.createElement('h2');
  heading.id = 'scene-title';
  heading.textContent = 'Scene';

  const list = document.createElement('dl');
  list.className = 'scene-list';

  list.append(
    metaRow('Camera', 'Fixed perspective'),
    metaRow('Geometry', '1 sphere'),
    metaRow('Light', '1 point'),
    metaRow('Samples', '1'),
  );

  section.append(heading, list);
  return section;
}

function metaRow(label: string, value: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  frag.append(dt, dd);
  return frag;
}

function buildViewportPanel(
  opts: Required<Omit<ShellOptions, 'onRender'>> & { onRender?: ShellRenderHandler },
  refs: ShellRefs,
): HTMLElement {
  const section = document.createElement('section');
  section.className = 'panel viewport-panel';
  section.setAttribute('aria-labelledby', 'viewport-title');

  const heading = document.createElement('h2');
  heading.id = 'viewport-title';
  heading.textContent = 'Viewport';

  const canvas = document.createElement('canvas');
  canvas.className = 'viewport-canvas';
  canvas.id = 'umbra-viewport';
  canvas.setAttribute('data-testid', 'umbra-viewport');
  canvas.setAttribute('aria-label', 'Render viewport');
  canvas.setAttribute('role', 'img');
  canvas.width = opts.canvasWidth;
  canvas.height = opts.canvasHeight;
  refs.canvas = canvas;

  const dims = document.createElement('p');
  dims.className = 'viewport-dims';
  dims.id = 'umbra-viewport-dims';
  dims.setAttribute('data-testid', 'umbra-viewport-dims');
  dims.textContent = `${opts.canvasWidth} \u00d7 ${opts.canvasHeight}`;
  refs.dimsElement = dims;

  const controls = document.createElement('div');
  controls.className = 'viewport-controls';

  const renderBtn = document.createElement('button');
  renderBtn.id = 'umbra-render';
  renderBtn.className = 'render-button';
  renderBtn.type = 'button';
  renderBtn.setAttribute('data-testid', 'umbra-render');
  renderBtn.setAttribute('aria-label', 'Render the fixed scene');
  renderBtn.disabled = true;
  renderBtn.textContent = 'Render';
  refs.renderButton = renderBtn;

  const status = document.createElement('p');
  status.className = 'viewport-status';
  status.id = 'umbra-status';
  status.setAttribute('data-testid', 'umbra-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = 'Ready';
  refs.statusElement = status;

  const time = document.createElement('p');
  time.className = 'viewport-time';
  time.id = 'umbra-render-time';
  time.setAttribute('data-testid', 'umbra-render-time');
  time.setAttribute('role', 'timer');
  time.textContent = '\u2014';
  refs.timeElement = time;

  controls.append(renderBtn, status, time);
  section.append(heading, canvas, dims, controls);
  return section;
}

function buildLessonPanel(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'panel lesson-panel';
  section.setAttribute('aria-labelledby', 'lesson-title');

  const heading = document.createElement('h2');
  heading.id = 'lesson-title';
  heading.textContent = 'Current concept';

  const concept = document.createElement('h3');
  concept.id = 'umbra-current-concept';
  concept.setAttribute('data-testid', 'umbra-current-concept');
  concept.textContent = 'Ray\u2013Sphere Intersection';

  const body = document.createElement('p');
  body.id = 'umbra-lesson-body';
  body.setAttribute('data-testid', 'umbra-lesson-body');
  body.textContent =
    'Intersection distance comes from solving the ray/sphere quadratic: ' +
    'a ray hits a sphere when (origin + t \u00b7 direction \u2212 center)\u00b2 = r\u00b2 ' +
    'produces a non-negative real root, and we pick the nearest such root.';

  section.append(heading, concept, body, buildPipeline());
  return section;
}

function buildPipeline(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'pipeline-wrap';

  const heading = document.createElement('h2');
  heading.id = 'pipeline-title';
  heading.textContent = 'Pipeline';

  const list = document.createElement('ol');
  list.className = 'pipeline-list';
  list.id = 'umbra-pipeline';
  list.setAttribute('data-testid', 'umbra-pipeline');
  list.setAttribute('aria-labelledby', 'pipeline-title');

  PIPELINE_STEPS.forEach((step, index) => {
    const li = document.createElement('li');
    li.setAttribute('data-testid', `pipeline-${step.id}`);
    if (step.id === ACTIVE_STEP_ID) {
      li.setAttribute('aria-current', 'step');
    }
    const num = document.createElement('span');
    num.className = 'pipeline-step-num';
    num.textContent = String(index + 1).padStart(2, '0');
    const label = document.createElement('span');
    label.className = 'pipeline-step-label';
    label.textContent = step.label;
    li.append(num, label);
    list.append(li);
  });

  wrap.append(heading, list);
  return wrap;
}
