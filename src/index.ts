import { evaluate } from "mathjs";

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const context = canvas.getContext('2d');
const errorElement = document.querySelector('[data-error]') as HTMLParagraphElement;
const template = document.querySelector('[data-template]') as HTMLDivElement;
const expressionsElement = document.querySelector('[data-expressions]') as HTMLDivElement;
const appendBtnElement = document.querySelector('[data-append]') as HTMLButtonElement;
const drawBtnElement = document.querySelector('[data-draw]') as HTMLButtonElement;

const { min, max } = Math;

const state = new Proxy({
  scale: 1,
  error: '',
  ...restoreState()
}, {
  get(target: any, key) {
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    saveState();

    switch (key) {
      case 'scale': {
        drawAll();
        break;
      }

      case 'error': {
        if (value)
          errorElement.removeAttribute('hidden');
        else
          errorElement.hidden = true;
        errorElement.innerText = value;
        break;
      }
    }

    return true;
  }
});

const size = {
  width: 0,
  height: 0,
  x: 0,
  y: 0
};

function minMax(value: number, minValue: number, maxValue: number) {
  return min(maxValue, max(value, minValue));
}

function clear() {
  const { x, y, width, height } = size;
  context?.clearRect(-x, -y, width, height);
}

function restoreState(): object {
  try {
    const data = JSON.parse(localStorage.getItem('local-state') ?? '');
    if (typeof data == 'object' && !Array.isArray(data))
      return data;

  } catch (e) { }
  return {};
}

function saveState() {
  localStorage.setItem('local-state', JSON.stringify({ ...state }));
}

function resize() {
  const { offsetWidth: width, offsetHeight: height } = canvas;
  size.width = canvas.width = width;
  size.height = canvas.height = height;
  size.x = width * 0.5;
  size.y = height * 0.5;
  context?.translate(size.x, size.y);
  drawAll();
}

function drawAxis() {
  if (!context) return;
  const { x, y } = size;

  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = '#222';

  context.moveTo(-x, 0);
  context.lineTo(x, 0);

  context.moveTo(0, -y);
  context.lineTo(0, y);

  context.stroke();
  context.closePath();

}

function drawGrid(xSize = 10, ySize = xSize) {
  if (!context) return;

  const { x, y } = size;
  const { scale } = state;

  context.lineWidth = 1;


  xSize *= scale;
  ySize *= scale;
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = '#eee';
  for (let gX = 0; gX < x; gX += xSize) {
    for (let gY = 0; gY < y; gY += ySize) {
      const dX = gX + xSize;
      const dY = gY + ySize;

      context.moveTo(gX, gY);
      context.lineTo(gX, dY);

      context.moveTo(gX, gY);
      context.lineTo(gX, -dY);

      context.moveTo(-gX, gY);
      context.lineTo(-gX, dY);

      context.moveTo(-gX, gY);
      context.lineTo(-gX, -dY);

      context.moveTo(gX, gY);
      context.lineTo(dX, gY);

      context.moveTo(gX, gY);
      context.lineTo(-dX, gY);

      context.moveTo(gX, -gY);
      context.lineTo(dX, -gY);

      context.moveTo(gX, -gY);
      context.lineTo(-dX, -gY);
    }
  }
  context.stroke();
  context.closePath();
}

function onDrawClick(e?: any) {
  if (e instanceof KeyboardEvent) {
    if (e.key == 'Enter')
      onDrawClick();
  } else {
    state.error = '';
    drawAll();
  }
}

function drawGraph(expression?: string, color = 'red', width = 3) {
  const { scale } = state;
  if (!context || !expression) return;

  const { x } = size;
  const verticalSize = (x / (50 * scale));
  const points = 100 * verticalSize;

  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = width;

  for (let i = 0; i <= points; i++) {
    try {
      let percent = (i / points * 2 - 1) * x * verticalSize;
      let result = evaluate(expression, { x: percent * .01 }) * 100;

      context[i ? 'lineTo' : 'moveTo'](percent * scale, -result * scale);
    } catch (e) {
      state.error = `${e}`;
      break;
    }
  }

  context.stroke();

  context.closePath();
}

function wheel(e: WheelEvent) {
  let { scale } = state;

  scale += e.deltaY * .02;
  state.scale = minMax(scale, .2, 40);
}

function drawAll() {
  clear();
  drawGrid(50);
  drawAxis();

  state.error = '';

  expressionsElement.querySelectorAll('.expression')
    .forEach(elem => {
      const expression = elem.querySelector<HTMLInputElement>('[name="expression"]')?.value || '';
      const color = elem.querySelector<HTMLInputElement>('[name="color"]')?.value || 'red';
      if (!expression) return;
      try {
        drawGraph(expression, color);
      } catch (e) {
        state.error += `${e}`;
      }
    });
}

function appendRow() {
  if (!template) return;
  const clone = template.cloneNode(true) as HTMLDivElement;
  clone.querySelector('[data-delete]')?.addEventListener('click', _ => {
    clone.remove();
    drawAll();
  });
  clone.removeAttribute('hidden');
  expressionsElement.appendChild(clone);
  drawAll();
}

resize();
addEventListener('resize', resize);
canvas.addEventListener('wheel', wheel);
errorElement.innerText = state.error;
appendBtnElement.addEventListener('click', appendRow);
drawBtnElement.addEventListener('click', onDrawClick); 