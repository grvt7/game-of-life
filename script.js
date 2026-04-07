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
