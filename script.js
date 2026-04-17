const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Viewport
let cellSize = 10;
let originX = 0;
let originY = 0;
const MIN_CELL = 2,
  MAX_CELL = 80;

// Grid
let cells = new Set(); // keys are "row,col" strings
let generation = 0;
let population = 0;

// Interaction
let isDrawing = false;
let drawValue = 1;
let lastDrawnCell = null;

// Simulation
let running = false;
let animFrame = null;
let lastFrameTime = 0;
let fps = 10;
let frameInterval = 1000 / fps;
let fpsFrames = 0;
let fpsAccum = 0;

// Helpers
function key(r, c) {
  return `${r},${c}`;
}
function unkey(k) {
  const [r, c] = k.split(",");
  return [+r, +c];
}

function screenToCell(sx, sy) {
  return {
    r: Math.floor((sy - originY) / cellSize),
    c: Math.floor((sx - originX) / cellSize),
  };
}

// Canvas sizing
function resizeCanvas() {
  const sw = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w"),
  );
  const th = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"),
  );
  const bh = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--bottombar-h",
    ),
  );
  canvas.width = window.innerWidth - 2 * sw;
  canvas.height = window.innerHeight - th - bh;
}
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});

// Center the view
function centerView() {
  originX = canvas.width / 2;
  originY = canvas.height / 2;
}

// Zoom
function zoomAt(mx, my, factor) {
  const { r, c } = screenToCell(mx, my);
  const newSize = Math.max(MIN_CELL, Math.min(MAX_CELL, cellSize * factor));
  originX = mx - c * newSize;
  originY = my - r * newSize;
  cellSize = newSize;
  document.getElementById("zoomDisplay").textContent =
    `zoom: ${Math.round(cellSize)}px`;
  render();
}

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 0.9);
  },
  { passive: false },
);

// Pan
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOriginStart = { x: 0, y: 0 };

canvas.addEventListener(
  "mousedown",
  (e) => {
    if (e.button === 1) {
      // middle click
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
      panOriginStart = { x: originX, y: originY };
      e.preventDefault();
    }
  },
  true,
); // capture phase so it fires before the draw handler

canvas.addEventListener(
  "mousemove",
  (e) => {
    if (!isPanning) return;
    originX = panOriginStart.x + (e.clientX - panStart.x);
    originY = panOriginStart.y + (e.clientY - panStart.y);
    render();
  },
  true,
);

canvas.addEventListener(
  "mouseup",
  (e) => {
    if (e.button === 1) isPanning = false;
  },
  true,
);
canvas.addEventListener(
  "mouseleave",
  () => {
    isPanning = false;
  },
  true,
);

centerView();

// Render
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = "#0d0d0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Visible range
  const minC = Math.floor(-originX / cellSize) - 1;
  const minR = Math.floor(-originY / cellSize) - 1;
  const maxC = Math.ceil((canvas.width - originX) / cellSize) + 1;
  const maxR = Math.ceil((canvas.height - originY) / cellSize) + 1;

  // Grid lines
  if (cellSize >= 4) {
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let c = minC; c <= maxC; c++) {
      const x = c * cellSize + originX;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let r = minR; r <= maxR; r++) {
      const y = r * cellSize + originY;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  // Alive cells
  const pad = cellSize > 3 ? 1 : 0;
  ctx.fillStyle = "#5b8aff";
  cells.forEach((k) => {
    const [r, c] = unkey(k);
    if (r < minR || r > maxR || c < minC || c > maxC) return;
    ctx.fillRect(
      c * cellSize + originX + pad,
      r * cellSize + originY + pad,
      cellSize - pad * 2,
      cellSize - pad * 2,
    );
  });
}

// Mouse drawing
function toggleCell(r, c) {
  const k = key(r, c);
  if (drawValue === 1) cells.add(k);
  else cells.delete(k);
  population = cells.size;
  document.getElementById("populationCount").textContent = population;
}

function step() {
  const neighborCount = new Map();

  cells.forEach((k) => {
    const [r, c] = unkey(k);
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nk = key(r + dr, c + dc);
        neighborCount.set(nk, (neighborCount.get(nk) || 0) + 1);
      }
    }
  });

  const next = new Set();
  neighborCount.forEach((count, k) => {
    const alive = cells.has(k);
    if (alive && (count === 2 || count === 3)) next.add(k);
    if (!alive && count === 3) next.add(k);
  });

  cells = next;
  generation++;
  population = cells.size;
  document.getElementById("generationCount").textContent =
    generation.toLocaleString();
  document.getElementById("populationCount").textContent =
    population.toLocaleString();
}

function gameLoop(timestamp) {
  if (!running) return;
  animFrame = requestAnimationFrame(gameLoop);
  const delta = timestamp - lastFrameTime;
  fpsAccum += delta;
  fpsFrames++;
  if (fpsAccum >= 500) {
    document.getElementById("fpsDisplay").textContent = Math.round(
      fpsFrames / (fpsAccum / 1000),
    );
    fpsFrames = 0;
    fpsAccum = 0;
  }
  if (delta < frameInterval) return;
  lastFrameTime = timestamp - (delta % frameInterval);
  step();
  render();
}

function play() {
  if (running) return;
  running = true;
  lastFrameTime = 0;
  animFrame = requestAnimationFrame(gameLoop);
  document.getElementById("playBtn").classList.add("active");
  document.getElementById("pauseBtn").classList.remove("active");
}

function pause() {
  running = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  document.getElementById("pauseBtn").classList.add("active");
  document.getElementById("playBtn").classList.remove("active");
}

function clearGrid() {
  pause();
  cells = new Set();
  generation = 0;
  population = 0;
  document.getElementById("generationCount").textContent = "0";
  document.getElementById("populationCount").textContent = "0";
  render();
}

canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  isDrawing = true;
  const { r, c } = screenToCell(e.offsetX, e.offsetY);
  drawValue = cells.has(key(r, c)) ? 0 : 1;
  toggleCell(r, c);
  lastDrawnCell = { r, c };
  render();
});

canvas.addEventListener("mousemove", (e) => {
  const { r, c } = screenToCell(e.offsetX, e.offsetY);
  document.getElementById("coordDisplay").textContent = `x: ${c}, y: ${r}`;
  if (!isDrawing) return;
  if (!lastDrawnCell || r !== lastDrawnCell.r || c !== lastDrawnCell.c) {
    toggleCell(r, c);
    lastDrawnCell = { r, c };
    render();
  }
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  lastDrawnCell = null;
});
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  lastDrawnCell = null;
});

// Init
render();

// Buttons - Left Sidebar
document.getElementById("playBtn").onclick = play;
document.getElementById("pauseBtn").onclick = pause;
document.getElementById("stepBtn").onclick = () => {
  if (!running) {
    step();
    render();
  }
};
document.getElementById("resetBtn").onclick = clearGrid;
document.getElementById("fpsSlider").oninput = function () {
  fps = parseInt(this.value);
  frameInterval = 1000 / fps;
  document.getElementById("fpsValue").textContent = fps;
};

pause(); // default state
