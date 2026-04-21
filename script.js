// #canvas and contexts
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const graphCanvas = document.getElementById("graphCanvas");
const graphCtx = graphCanvas.getContext("2d");

// #patterns data
const PATTERNS = {
  "Still Lifes": [
    { name: "Block", size: "2×2", rle: "x=2,y=2\noo$oo!" },
    { name: "Beehive", size: "4×3", rle: "x=4,y=3\nb2ob$o2bo$b2ob!" },
    { name: "Loaf", size: "4×4", rle: "x=4,y=4\nb2ob$o2bo$bobo$2bo!" },
    { name: "Boat", size: "3×3", rle: "x=3,y=3\n2ob$obo$bo!" },
    { name: "Tub", size: "3×3", rle: "x=3,y=3\nbob$o bo$bob!" },
    { name: "Pond", size: "4×4", rle: "x=4,y=4\nb2ob$o2bo$o2bo$b2ob!" },
  ],
  Oscillators: [
    { name: "Blinker (p2)", size: "3×1", rle: "x=3,y=1\n3o!" },
    { name: "Toad (p2)", size: "4×2", rle: "x=4,y=2\nb3o$3ob!" },
    { name: "Beacon (p2)", size: "4×4", rle: "x=4,y=4\n2o2b$2o2b$2b2o$2b2o!" },
    {
      name: "Pulsar (p3)",
      size: "13×13",
      rle: "x=13,y=13\n2b3o3b3o2b$4b2obob2o4b$o4bobo bo4bo$o4bobo bo4bo$o4b3ob3o4bo$2b2obobo bob2o$7b bo$2b2obobo bob2o$o4b3ob3o4bo$o4bobo bo4bo$o4bobo bo4bo$4b2obob2o4b$2b3o3b3o!",
    },
    {
      name: "Pentadecathlon (p15)",
      size: "10×3",
      rle: "x=10,y=3\no2bo4bo2bo$b2o4b2ob$o2bo4bo2bo!",
    },
    { name: "Clock (p2)", size: "4×4", rle: "x=4,y=4\nb2ob$3ob$bo3b$b2ob!" },
    {
      name: "Figure Eight (p8)",
      size: "6×6",
      rle: "x=6,y=6\n3o3b$3o3b$3o3b$3b3o$3b3o$3b3o!",
    },
    {
      name: "Kokogei (p8)",
      size: "9×9",
      rle: "x=9,y=9\nb2o5b$o2bo4b$b2o5b$3b2o3b$8b$3b2o3b$5b2ob$4bo2bo$5b2ob!",
    },
  ],
  Spaceships: [
    { name: "Glider", size: "3×3", rle: "x=3,y=3\nbob$2ob$3o!" },
    { name: "LWSS", size: "5×4", rle: "x=5,y=4\nbo3b$4ob$o3ob$b4ob!" },
    { name: "MWSS", size: "6×5", rle: "x=6,y=5\nb2o3b$o4b$o3ob$b5ob$2b4ob!" },
    { name: "HWSS", size: "7×5", rle: "x=7,y=5\nb3o4b$o5b$o4ob$b6ob$2b5ob!" },
  ],
  Guns: [
    {
      name: "Gosper Glider Gun",
      size: "36×9",
      rle: "x=36,y=9\n24bob11b$22bobobob11b$12b2ob6b2o12b2ob$11bo3bo4b2o12b2ob$2o8bo5bo3b2o14b$2o8bo3bobo4b2o12b$10bo5bo7bobob$11bo3bo10bob$12b2ob!",
    },
    {
      name: "Simkin Glider Gun",
      size: "33×29",
      rle: "x=33,y=29\n2o5b2o$2o5b2o8b$16b2o5b$16b2o6b$22b$2o$2o13b$16b$16b$15b$14b2o$14b2o4b$14b2o4b$21b$20b2o$20b2o$16b$16b$16b$11bo4b$10bobo3b$10bobo3b$9b2ob2o2b$9bob3o2b$13b2ob$13b2ob$9bob3o2b$9b2ob2o!",
    },
  ],
  Methuselahs: [
    { name: "R-Pentomino", size: "3×3", rle: "x=3,y=3\nb2ob$2ob$bo!" },
    { name: "Diehard", size: "8×3", rle: "x=8,y=3\n6bob$2o6b$bo3b3ob!" },
    { name: "Acorn", size: "7×3", rle: "x=7,y=3\nbo5b$3bob2b$2o2b3ob!" },
    { name: "Pi Heptomino", size: "3×3", rle: "x=3,y=3\n3o$obo$3ob!" },
    { name: "B-Heptomino", size: "3×4", rle: "x=3,y=4\n2ob$3ob$ob$ob!" },
  ],
  Interesting: [
    { name: "Infinite Growth 1", size: "6×3", rle: "x=6,y=3\n2b2o$bo2bo$b2o!" },
    {
      name: "Switch Engine",
      size: "6×6",
      rle: "x=6,y=6\nbobo2b$o5b$bo3ob$2b3ob$3b2o!",
    },
    { name: "Eater 1", size: "4×4", rle: "x=4,y=4\n2o2b$obob$2bob$2b2ob!" },
    {
      name: "Lightweight Emulator",
      size: "9×8",
      rle: "x=9,y=8\n2b2o4b$bo2bo3b$b4ob2b$o3bo2bo$2b2o4b$8b$8b$8b!",
    },
  ],
};

// #state
let cells = new Set(); // sparse: "r,c" strings
let running = false;
let animFrame = null;
let lastFrameTime = 0;
let fps = 10;
let frameInterval = 1000 / fps;
let generation = 0;
let population = 0;
let drawMode = "draw"; // 'draw' | 'erase' | 'pan'
let showGrid = true;
let wrapEdges = false;
let showTrail = false;
let showHighlight = true;
let showGraph = false;
let popHistory = [];
const MAX_HISTORY = 300;

// born/dying cells for highlight
let bornCells = new Set();
let dyingCells = new Set();

// zoom and pan
let cellSize = 10; // pixels per cell
let originX = 0; // canvas pixel offset
let originY = 0;
const MIN_CELL = 2;
const MAX_CELL = 80;

// interaction
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOriginStart = { x: 0, y: 0 };
let isDrawing = false;
let drawValue = 1; // 1=alive, 0=dead
let lastDrawnCell = null;

// fps tracking
let fpsFrames = 0;
let fpsAccum = 0;
let displayFps = 0;

// #RLE parser and encoder
function parseRLE(rle) {
  // strips comments and header
  const lines = rle.split("\n").filter((l) => !l.startsWith("#"));
  let body = lines.join("");

  // extracts header if present (x=..., y=...)
  let offsetX = 0,
    offsetY = 0;
  const headerMatch = body.match(/x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)/i);
  if (headerMatch) {
    body = body.slice(body.indexOf("\n", body.indexOf(headerMatch[0])) + 1);
    // removes header line from body
    const hIdx = body.indexOf("!");
    // parses only the cell data
  }
  // removes header line
  body = body.replace(/^[^$!bo]*([xXyY][^$!bo]*)/, "");
  // finds just the cell data portion
  const dataStart = body.search(/[bo$!]/);
  if (dataStart > 0) body = body.slice(dataStart);

  const result = new Set();
  let row = 0,
    col = 0,
    count = "";

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch >= "0" && ch <= "9") {
      count += ch;
    } else if (ch === "b") {
      col += count ? parseInt(count) : 1;
      count = "";
    } else if (ch === "o") {
      const n = count ? parseInt(count) : 1;
      for (let j = 0; j < n; j++) result.add(`${row},${col + j}`);
      col += n;
      count = "";
    } else if (ch === "$") {
      const n = count ? parseInt(count) : 1;
      row += n;
      col = 0;
      count = "";
    } else if (ch === "!") {
      break;
    }
  }
  return result;
}

function encodeRLE(cells) {
  if (cells.size === 0) return "x=0,y=0\n!";
  const coords = [...cells].map((k) => {
    const [r, c] = k.split(",").map(Number);
    return { r, c };
  });
  const minR = Math.min(...coords.map((c) => c.r));
  const minC = Math.min(...coords.map((c) => c.c));
  const maxR = Math.max(...coords.map((c) => c.r));
  const maxC = Math.max(...coords.map((c) => c.c));
  const w = maxC - minC + 1,
    h = maxR - minR + 1;

  // Builds grid
  const grid = Array.from({ length: h }, () => Array(w).fill(false));
  coords.forEach(({ r, c }) => (grid[r - minR][c - minC] = true));

  let rle = `x=${w}, y=${h}\n`;
  let body = "";
  for (let r = 0; r < h; r++) {
    let rowStr = "";
    let run = 1;
    for (let c = 1; c <= w; c++) {
      if (c < w && grid[r][c] === grid[r][c - 1]) {
        run++;
      } else {
        const ch = grid[r][c - 1] ? "o" : "b";
        rowStr += (run > 1 ? run : "") + ch;
        run = 1;
      }
    }
    // Trims trailing b's
    rowStr = rowStr.replace(/b+$/, "");
    body += rowStr + (r < h - 1 ? "$" : "");
  }
  return rle + body + "!";
}

// #utility functions
function key(row, col) {
  return `${row},${col}`;
}

function unkey(cellKey) {
  const [row, col] = cellKey.split(",");
  return [parseInt(row), parseInt(col)];
}

function screenToCell(screenX, screenY) {
  return {
    r: Math.floor((screenY - originY) / cellSize),
    c: Math.floor((screenX - originX) / cellSize),
  };
}

function cellToScreen(row, col) {
  return { x: col * cellSize + originX, y: row * cellSize + originY };
}

function resizeCanvas() {
  const sidebarW = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--sidebar-w"),
  );
  const topbarH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"),
  );
  const bottombarH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--bottombar-h",
    ),
  );
  canvas.width = window.innerWidth - 2 * sidebarW;
  canvas.height = window.innerHeight - topbarH - bottombarH;
}

// #view control
function centerView() {
  originX = canvas.width / 2;
  originY = canvas.height / 2;
}

function fitToContent() {
  if (cells.size === 0) {
    centerView();
    render();
    return;
  }
  const coords = [...cells].map((cellKey) => {
    const [row, col] = cellKey.split(",").map(Number);
    return { row, col };
  });
  const minRow = Math.min(...coords.map((c) => c.row));
  const maxRow = Math.max(...coords.map((c) => c.row));
  const minCol = Math.min(...coords.map((c) => c.col));
  const maxCol = Math.max(...coords.map((c) => c.col));
  const h = maxRow - minRow + 1;
  const w = maxCol - minCol + 1;
  const pad = 4;
  const scaleX = canvas.width / ((w + pad) * 1);
  const scaleY = canvas.height / ((h + pad) * 1);
  cellSize = Math.max(
    MIN_CELL,
    Math.min(MAX_CELL, Math.floor(Math.min(scaleX, scaleY))),
  );
  originX = (canvas.width - w * cellSize) / 2 - minCol * cellSize;
  originY = (canvas.height - h * cellSize) / 2 - minRow * cellSize;
  updateZoomSlider();
  render();
}

// #rendering
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--dead")
      .trim() || "#0d0d0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Visible cell range
  const minCol = Math.floor(-originX / cellSize) - 1;
  const minRow = Math.floor(-originY / cellSize) - 1;
  const maxCol = Math.ceil((canvas.width - originX) / cellSize) + 1;
  const maxRow = Math.ceil((canvas.height - originY) / cellSize) + 1;

  // Draw grid lines
  if (showGrid && cellSize >= 4) {
    ctx.strokeStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--grid-line")
        .trim() || "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let col = minCol; col <= maxCol; col++) {
      const x = col * cellSize + originX;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let row = minRow; row <= maxRow; row++) {
      const y = row * cellSize + originY;
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }

  const aliveColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--alive")
      .trim() || "#5b8aff";
  const bornColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--born")
      .trim() || "#a0ffb0";
  const dyingColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--dying")
      .trim() || "#ff6060";
  const pad = cellSize > 3 ? 1 : 0;
  const cellDrawSize = cellSize - pad * 2;

  // Draw dying cells (trail)
  if (showTrail && showHighlight) {
    ctx.fillStyle = dyingColor + "44";
    dyingCells.forEach((cellKey) => {
      const [row, col] = unkey(cellKey);
      if (row < minRow || row > maxRow || col < minCol || col > maxCol) return;
      const x = col * cellSize + originX + pad;
      const y = row * cellSize + originY + pad;
      ctx.fillRect(x, y, cellDrawSize, cellDrawSize);
    });
  }

  // Draw alive cells
  ctx.fillStyle = aliveColor;
  cells.forEach((cellKey) => {
    const [row, col] = unkey(cellKey);
    if (row < minRow || row > maxRow || col < minCol || col > maxCol) return;
    const x = col * cellSize + originX + pad;
    const y = row * cellSize + originY + pad;
    ctx.fillRect(x, y, cellDrawSize, cellDrawSize);
  });

  // Draw born cells highlight
  if (showHighlight) {
    ctx.fillStyle = bornColor;
    bornCells.forEach((cellKey) => {
      if (!cells.has(cellKey)) return;
      const [row, col] = unkey(cellKey);
      if (row < minRow || row > maxRow || col < minCol || col > maxCol) return;
      const x = col * cellSize + originX + pad;
      const y = row * cellSize + originY + pad;
      ctx.fillRect(x, y, cellDrawSize, cellDrawSize);
    });
  }
}

function drawGraph() {
  const w = graphCanvas.width;
  const h = graphCanvas.height;
  graphCtx.clearRect(0, 0, w, h);
  graphCtx.fillStyle = "rgba(13,13,15,0.85)";
  graphCtx.fillRect(0, 0, w, h);

  if (popHistory.length < 2) return;
  const maxPop = Math.max(...popHistory, 1);
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();

  graphCtx.strokeStyle = accent;
  graphCtx.lineWidth = 1.5;
  graphCtx.beginPath();
  popHistory.forEach((p, i) => {
    const x = (i / (MAX_HISTORY - 1)) * w;
    const y = h - (p / maxPop) * (h - 4) - 2;
    i === 0 ? graphCtx.moveTo(x, y) : graphCtx.lineTo(x, y);
  });
  graphCtx.stroke();

  // Fill
  graphCtx.fillStyle = accent + "22";
  graphCtx.lineTo(w, h);
  graphCtx.lineTo(0, h);
  graphCtx.closePath();
  graphCtx.fill();
}

// #game logic
function step() {
  const neighborCount = new Map();

  cells.forEach((cellKey) => {
    const [row, col] = unkey(cellKey);
    for (let dRow = -1; dRow <= 1; dRow++) {
      for (let dCol = -1; dCol <= 1; dCol++) {
        if (dRow === 0 && dCol === 0) continue;
        const neighborRow = row + dRow;
        const neighborCol = col + dCol;
        if (wrapEdges) {
          // Toroidal — use a large finite wrap window
          // Not truly infinite but works for typical patterns
        }
        const neighborKey = key(neighborRow, neighborCol);
        neighborCount.set(
          neighborKey,
          (neighborCount.get(neighborKey) || 0) + 1,
        );
      }
    }
  });

  const next = new Set();
  bornCells = new Set();
  dyingCells = new Set();

  neighborCount.forEach((count, cellKey) => {
    const alive = cells.has(cellKey);
    if (alive && (count === 2 || count === 3)) {
      next.add(cellKey);
    } else if (!alive && count === 3) {
      next.add(cellKey);
      bornCells.add(cellKey);
    } else if (alive) {
      dyingCells.add(cellKey);
    }
  });

  // Cells with 0 neighbors that are alive die
  cells.forEach((cellKey) => {
    if (!neighborCount.has(cellKey)) dyingCells.add(cellKey);
  });

  cells = next;
  generation++;
  population = cells.size;
  updateStats();
  trackPopHistory();
}

function updateStats() {
  document.getElementById("generationCount").textContent =
    generation.toLocaleString();
  document.getElementById("populationCount").textContent =
    population.toLocaleString();
}

function trackPopHistory() {
  popHistory.push(population);
  if (popHistory.length > MAX_HISTORY) popHistory.shift();
  if (showGraph) drawGraph();
}

// Main game loop for generations
function gameLoop(timestamp) {
  if (!running) return;
  animFrame = requestAnimationFrame(gameLoop);

  const delta = timestamp - lastFrameTime;

  // FPS tracking
  fpsAccum += delta;
  fpsFrames++;
  if (fpsAccum >= 500) {
    displayFps = Math.round(fpsFrames / (fpsAccum / 1000));
    document.getElementById("fpsDisplay").textContent = displayFps;
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
  fpsFrames = 0;
  fpsAccum = 0;
  animFrame = requestAnimationFrame(gameLoop);
  document.getElementById("playBtn").classList.add("active");
  document.getElementById("pauseBtn").classList.remove("active");
}

function pause() {
  running = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  document.getElementById("playBtn").classList.remove("active");
  document.getElementById("pauseBtn").classList.add("active");
}

function togglePlay() {
  if (running) pause();
  else play();
}

// #event handlers — canvas
// Mouse Event listeners
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 1 || (e.button === 0 && drawMode === "pan")) {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOriginStart = { x: originX, y: originY };
    canvas.classList.add("panning");
    e.preventDefault();
    return;
  }
  if (e.button === 0) {
    isDrawing = true;
    const { r: row, c: col } = screenToCell(e.offsetX, e.offsetY);
    const cellKey = key(row, col);
    if (drawMode === "draw") {
      drawValue = cells.has(cellKey) ? 0 : 1;
      if (drawValue === 1) cells.add(cellKey);
      else cells.delete(cellKey);
    } else if (drawMode === "erase") {
      drawValue = 0;
      cells.delete(cellKey);
    }
    lastDrawnCell = { row, col };
    population = cells.size;
    updateStats();
    render();
  }
});

canvas.addEventListener("mousemove", (e) => {
  const { r: row, c: col } = screenToCell(e.offsetX, e.offsetY);
  document.getElementById("coordDisplay").textContent = `x: ${col}, y: ${row}`;

  if (isPanning) {
    originX = panOriginStart.x + (e.clientX - panStart.x);
    originY = panOriginStart.y + (e.clientY - panStart.y);
    render();
    return;
  }
  if (isDrawing) {
    if (
      !lastDrawnCell ||
      row !== lastDrawnCell.row ||
      col !== lastDrawnCell.col
    ) {
      const cellKey = key(row, col);
      if (drawMode === "draw") {
        if (drawValue === 1) cells.add(cellKey);
        else cells.delete(cellKey);
      } else if (drawMode === "erase") {
        cells.delete(cellKey);
      }
      lastDrawnCell = { row, col };
      population = cells.size;
      updateStats();
      render();
    }
  }
});

canvas.addEventListener("mouseup", (e) => {
  isPanning = false;
  isDrawing = false;
  canvas.classList.remove("panning");
  lastDrawnCell = null;
});

canvas.addEventListener("mouseleave", () => {
  isPanning = false;
  isDrawing = false;
  canvas.classList.remove("panning");
  lastDrawnCell = null;
});

// Zooms with scroll wheel
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    const { r: row, c: col } = screenToCell(mouseX, mouseY);

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.9;
    const newSize = Math.max(
      MIN_CELL,
      Math.min(MAX_CELL, cellSize * zoomFactor),
    );

    // Zoom toward mouse position
    originX = mouseX - col * newSize;
    originY = mouseY - row * newSize;
    cellSize = newSize;

    updateZoomSlider();
    document.getElementById("zoomDisplay").textContent =
      `zoom: ${Math.round(cellSize)}px`;
    render();
  },
  { passive: false },
);

// Touch support for mobile and trackpad
let lastTouchDist = null;
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  },
  { passive: true },
);

canvas.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastTouchDist) {
        const ratio = dist / lastTouchDist;
        cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, cellSize * ratio));
        updateZoomSlider();
        render();
      }
      lastTouchDist = dist;
    }
  },
  { passive: true },
);

// #pattern loading
let pendingPattern = null;
let patternPreviewCell = null;

function loadPattern(patternCells) {
  // Centers the pattern on screen
  if (patternCells.size === 0) return;
  const coords = [...patternCells].map((cellKey) => unkey(cellKey));
  const minRow = Math.min(...coords.map(([row]) => row));
  const maxRow = Math.max(...coords.map(([row]) => row));
  const minCol = Math.min(...coords.map(([, col]) => col));
  const maxCol = Math.max(...coords.map(([, col]) => col));
  const centerRow = Math.floor((minRow + maxRow) / 2);
  const centerCol = Math.floor((minCol + maxCol) / 2);

  // Gets screen center cell
  const { r: screenCenterRow, c: screenCenterCol } = screenToCell(
    canvas.width / 2,
    canvas.height / 2,
  );
  const dRow = screenCenterRow - centerRow;
  const dCol = screenCenterCol - centerCol;

  patternCells.forEach((cellKey) => {
    const [row, col] = unkey(cellKey);
    cells.add(key(row + dRow, col + dCol));
  });

  population = cells.size;
  updateStats();
  render();
  fitToContent();
  showToast(`Pattern loaded (${patternCells.size} cells)`);
}

function loadRLEPattern(rle) {
  try {
    const parsed = parseRLE(rle);
    if (parsed.size === 0) {
      showToast("No cells found in pattern");
      return;
    }
    loadPattern(parsed);
  } catch (e) {
    showToast("Error parsing RLE pattern");
  }
}

// Generating random cells on grid
function randomize() {
  const density =
    parseInt(document.getElementById("densitySlider").value) / 100;
  cells = new Set();
  const { r: minRow, c: minCol } = screenToCell(0, 0);
  const { r: maxRow, c: maxCol } = screenToCell(canvas.width, canvas.height);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (Math.random() < density) cells.add(key(row, col));
    }
  }
  generation = 0;
  population = cells.size;
  popHistory = [];
  updateStats();
  render();
  showToast(`Randomized — ${cells.size.toLocaleString()} cells`);
}

// Clear button handler
function clearGrid() {
  pause();
  cells = new Set();
  bornCells = new Set();
  dyingCells = new Set();
  generation = 0;
  population = 0;
  popHistory = [];
  updateStats();
  render();
}

// Updates the zoom slider
function updateZoomSlider() {
  const slider = document.getElementById("zoomSlider");
  slider.value = Math.round(cellSize);
  document.getElementById("zoomValue").textContent = Math.round(cellSize);
}

// #event handlers — buttons
document.getElementById("playBtn").onclick = play;
document.getElementById("pauseBtn").onclick = pause;
document.getElementById("stepBtn").onclick = () => {
  if (!running) {
    step();
    render();
  }
};
document.getElementById("resetBtn").onclick = clearGrid;
document.getElementById("randomBtn").onclick = randomize;
document.getElementById("fitBtn").onclick = fitToContent;

document.getElementById("fpsSlider").oninput = function () {
  fps = parseInt(this.value);
  frameInterval = 1000 / fps;
  document.getElementById("fpsValue").textContent = fps;
};

document.getElementById("zoomSlider").oninput = function () {
  const newSize = parseInt(this.value);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const { r: row, c: col } = screenToCell(centerX, centerY);
  originX = centerX - col * newSize;
  originY = centerY - row * newSize;
  cellSize = newSize;
  document.getElementById("zoomValue").textContent = newSize;
  document.getElementById("zoomDisplay").textContent = `zoom: ${newSize}px`;
  render();
};

document.getElementById("densitySlider").oninput = function () {
  document.getElementById("densityValue").textContent = this.value;
};

// Draw mode buttons
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.onclick = function () {
    drawMode = this.dataset.mode;
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    canvas.className = "";
    if (drawMode === "pan") canvas.classList.add("pan-mode");
    else if (drawMode === "erase") canvas.classList.add("erase-mode");
  };
});

// Themes
document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.onclick = function () {
    document
      .querySelectorAll(".theme-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    document.body.dataset.theme = this.dataset.theme;
    render();
  };
});

// Help modal
document.getElementById("helpBtn").onclick = () =>
  document.getElementById("helpModal").classList.add("open");
document.getElementById("closeHelp").onclick = () =>
  document.getElementById("helpModal").classList.remove("open");
document.getElementById("helpModal").onclick = (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
};

// Settings modal
document.getElementById("settingsBtn").onclick = () =>
  document.getElementById("settingsModal").classList.add("open");
document.getElementById("closeSettings").onclick = () =>
  document.getElementById("settingsModal").classList.remove("open");
document.getElementById("settingsModal").onclick = (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
};

// Settings toggles
document.getElementById("showGridToggle").onchange = function () {
  showGrid = this.checked;
  render();
};
document.getElementById("wrapToggle").onchange = function () {
  wrapEdges = this.checked;
  showToast(wrapEdges ? "Toroidal edges enabled" : "Toroidal edges disabled");
};
document.getElementById("trailToggle").onchange = function () {
  showTrail = this.checked;
  render();
};
document.getElementById("highlightToggle").onchange = function () {
  showHighlight = this.checked;
  render();
};
document.getElementById("graphToggle").onchange = function () {
  showGraph = this.checked;
  graphCanvas.classList.toggle("hidden", !showGraph);
  if (showGraph) drawGraph();
};

// RLE Import/Export
document.getElementById("importRLEBtn").onclick = () => {
  document.getElementById("rleArea").value = "";
  document.getElementById("rleArea").focus();
};
document.getElementById("exportRLEBtn").onclick = () => {
  const rle = encodeRLE(cells);
  document.getElementById("rleArea").value = rle;
  navigator.clipboard
    ?.writeText(rle)
    .then(() => showToast("RLE copied to clipboard"));
};
document.getElementById("loadRLEBtn").onclick = () => {
  const rle = document.getElementById("rleArea").value.trim();
  if (rle) loadRLEPattern(rle);
};

// #UI builders
function buildPatternUI() {
  const container = document.getElementById("patternCategories");
  container.innerHTML = "";

  Object.entries(PATTERNS).forEach(([category, patterns]) => {
    const div = document.createElement("div");
    div.className = "pattern-category";

    const header = document.createElement("div");
    header.className = "pattern-category-header";
    header.innerHTML = `<span>${category}</span><span class="arrow">▶</span>`;
    header.onclick = () => {
      header.classList.toggle("open");
      list.classList.toggle("open");
    };

    const list = document.createElement("div");
    list.className = "pattern-list";

    patterns.forEach((pattern) => {
      const item = document.createElement("div");
      item.className = "pattern-item";
      item.innerHTML = `<span>${pattern.name}</span><span class="pattern-size">${pattern.size}</span>`;
      item.onclick = () => {
        document
          .querySelectorAll(".pattern-item")
          .forEach((i) => i.classList.remove("selected"));
        item.classList.add("selected");
        loadRLEPattern(pattern.rle);
      };
      list.appendChild(item);
    });

    div.appendChild(header);
    div.appendChild(list);
    container.appendChild(div);
  });

  // Open first category by default
  const firstHeader = container.querySelector(".pattern-category-header");
  const firstList = container.querySelector(".pattern-list");
  if (firstHeader && firstList) {
    firstHeader.classList.add("open");
    firstList.classList.add("open");
  }
}

// Pattern search
document.getElementById("patternSearch").oninput = function () {
  const query = this.value.toLowerCase().trim();
  document.querySelectorAll(".pattern-category").forEach((cat) => {
    const header = cat.querySelector(".pattern-category-header");
    const list = cat.querySelector(".pattern-list");
    const items = cat.querySelectorAll(".pattern-item");
    let anyVisible = false;
    items.forEach((item) => {
      const name = item.querySelector("span").textContent.toLowerCase();
      const match = !query || name.includes(query);
      item.style.display = match ? "" : "none";
      if (match) anyVisible = true;
    });
    cat.style.display = anyVisible ? "" : "none";
    if (query && anyVisible) {
      header.classList.add("open");
      list.classList.add("open");
    }
  });
};

// #event handlers — keyboard
document.addEventListener("keydown", (e) => {
  // disabe when typing in textbox
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      togglePlay();
      break;
    case "s":
    case "S":
      if (!running) {
        step();
        render();
      }
      break;
    case "r":
    case "R":
      clearGrid();
      break;
    case "f":
    case "F":
      fitToContent();
      break;
    case "d":
    case "D":
      setMode("draw");
      break;
    case "e":
    case "E":
      setMode("erase");
      break;
    case "p":
    case "P":
      setMode("pan");
      break;
    case "g":
    case "G":
      showGrid = !showGrid;
      document.getElementById("showGridToggle").checked = showGrid;
      render();
      break;
    case "+":
    case "=":
      zoom(1.15);
      break;
    case "-":
    case "_":
      zoom(0.87);
      break;
    case "Escape":
      document
        .querySelectorAll(".modal-overlay")
        .forEach((m) => m.classList.remove("open"));
      break;
  }
});

function setMode(mode) {
  drawMode = mode;
  document
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
  canvas.className = "";
  if (mode === "pan") canvas.classList.add("pan-mode");
  else if (mode === "erase") canvas.classList.add("erase-mode");
}

function zoom(factor) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const { r: row, c: col } = screenToCell(centerX, centerY);
  const newSize = Math.max(MIN_CELL, Math.min(MAX_CELL, cellSize * factor));
  originX = centerX - col * newSize;
  originY = centerY - row * newSize;
  cellSize = newSize;
  updateZoomSlider();
  document.getElementById("zoomDisplay").textContent =
    `zoom: ${Math.round(cellSize)}px`;
  render();
}

// #notification
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// #initialization
resizeCanvas();
centerView();
buildPatternUI();
updateStats();
render();
document.getElementById("pauseBtn").classList.add("active");

// Load a glider as a welcome pattern
setTimeout(() => {
  const gliderRle = "x=3,y=3\nbob$2ob$3o!";
  try {
    const parsed = parseRLE(gliderRle);
    const { r: centerRow, c: centerCol } = screenToCell(
      canvas.width / 2,
      canvas.height / 2,
    );
    parsed.forEach((cellKey) => {
      const [row, col] = unkey(cellKey);
      cells.add(key(row + centerRow - 1, col + centerCol - 1));
    });
    population = cells.size;
    updateStats();
    render();
  } catch (e) {}
  showToast("Welcome! Click to draw cells · Space to play");
}, 100);

// Window resize
window.addEventListener("resize", () => {
  resizeCanvas();
  render();
});
