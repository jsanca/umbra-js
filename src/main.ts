import { mountShell } from './ui/shell.js';
import { createRenderController } from './controller/render-controller.js';
import { createRequestRenderGenerator } from './core/render-request.js';
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
  generator: createRequestRenderGenerator({
    output: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    camera: {
      position: { x: 0, y: 0, z: 0 },
      lookAt: { x: 0, y: 0, z: -1 },
      fieldOfView: Math.PI / 3,
    },
    scene: {
      sphere: { center: { x: 0, y: 0, z: -3 }, radius: 1 },
      light: { position: { x: 0, y: 5, z: -2 }, intensity: 1 },
    },
  }),
});
