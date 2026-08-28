import { mountShell } from './ui/shell.js';
import { createRenderController } from './controller/render-controller.js';
import './ui/shell.css';

const root = document.getElementById('app');

if (!root) {
  throw new Error('UMBRA: missing #app mount point in index.html');
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 400;

const handle = mountShell(root, {
  canvasWidth: CANVAS_WIDTH,
  canvasHeight: CANVAS_HEIGHT,
  onRender: () => {
    controller.render();
  },
});

const controller = createRenderController({
  target: {
    canvas: handle.canvas,
    statusElement: handle.statusElement,
    dimsElement: handle.dimsElement,
    timeElement: handle.timeElement ?? undefined,
  },
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
});
