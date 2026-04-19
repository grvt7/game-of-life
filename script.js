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
let drawMode = "draw"; // 'draw' | 'erase' | 'pan'
let showGrid = true;
let wrapEdges = false;
let showTrail = false;
let showHighlight = true;

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

// Born/ Dying Cells
let bornCells = new Set();
let dyingCells = new Set();

// Pattern Library
const PATTERNS = {
  "Still Lifes": [
    { name: "Block", size: "2×2", rle: "x=2,y=2\noo$oo!" },
    { name: "Beehive", size: "4×3", rle: "x=4,y=3\nb2ob$o2bo$b2ob!" },
    { name: "Loaf", size: "4×4", rle: "x=4,y=4\nb2ob$o2bo$bobo$2bo!" },
    { name: "Boat", size: "3×3", rle: "x=3,y=3\n2ob$obo$bo!" },
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
  ],
  Methuselahs: [
    { name: "R-Pentomino", size: "3×3", rle: "x=3,y=3\nb2ob$2ob$bo!" },
    { name: "Diehard", size: "8×3", rle: "x=8,y=3\n6bob$2o6b$bo3b3ob!" },
    { name: "Acorn", size: "7×3", rle: "x=7,y=3\nbo5b$3bob2b$2o2b3ob!" },
  ],
};

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

function fitToContent() {
  if (cells.size === 0) {
    centerView();
    render();
    return;
  }
  const coords = [...cells].map((k) => unkey(k));
  const minR = Math.min(...coords.map(([r]) => r));
  const maxR = Math.max(...coords.map(([r]) => r));
  const minC = Math.min(...coords.map(([, c]) => c));
  const maxC = Math.max(...coords.map(([, c]) => c));
  const h = maxR - minR + 1,
    w = maxC - minC + 1;
  cellSize = Math.max(
    MIN_CELL,
    Math.min(
      MAX_CELL,
      Math.floor(Math.min(canvas.width / (w + 4), canvas.height / (h + 4))),
    ),
  );
  originX = (canvas.width - w * cellSize) / 2 - minC * cellSize;
  originY = (canvas.height - h * cellSize) / 2 - minR * cellSize;
  document.getElementById("zoomDisplay").textContent =
    `zoom: ${Math.round(cellSize)}px`;
  render();
}

// Render
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  const cs = getComputedStyle(document.documentElement);
  ctx.fillStyle = cs.getPropertyValue("--dead").trim();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Visible range
  const minC = Math.floor(-originX / cellSize) - 1;
  const minR = Math.floor(-originY / cellSize) - 1;
  const maxC = Math.ceil((canvas.width - originX) / cellSize) + 1;
  const maxR = Math.ceil((canvas.height - originY) / cellSize) + 1;

  // Grid lines
  if (showGrid && cellSize >= 4) {
    ctx.strokeStyle = cs.getPropertyValue("--grid-line").trim();
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

  const pad = cellSize > 3 ? 1 : 0;

  // Dying cell trail
  if (showTrail) {
    ctx.fillStyle = cs.getPropertyValue("--dying").trim() + "44";
    dyingCells.forEach((k) => {
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

  // Alive cells
  ctx.fillStyle = cs.getPropertyValue("--alive").trim();
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

  // Born cell highlight
  if (showHighlight) {
    ctx.fillStyle = cs.getPropertyValue("--born").trim();
    bornCells.forEach((k) => {
      if (!cells.has(k)) return;
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
  bornCells = new Set();
  dyingCells = new Set();
  neighborCount.forEach((count, k) => {
    const alive = cells.has(k);
    if (alive && (count === 2 || count === 3)) {
      next.add(k);
    } else if (!alive && count === 3) {
      next.add(k);
      bornCells.add(k);
    } else if (alive) {
      dyingCells.add(k);
    }
  });
  cells.forEach((k) => {
    if (!neighborCount.has(k)) dyingCells.add(k);
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

function randomize() {
  const density =
    parseInt(document.getElementById("densitySlider").value) / 100;
  const { r: minR, c: minC } = screenToCell(0, 0);
  const { r: maxR, c: maxC } = screenToCell(canvas.width, canvas.height);
  cells = new Set();
  for (let r = minR; r <= maxR; r++)
    for (let c = minC; c <= maxC; c++)
      if (Math.random() < density) cells.add(key(r, c));
  generation = 0;
  population = cells.size;
  document.getElementById("generationCount").textContent = "0";
  document.getElementById("populationCount").textContent =
    population.toLocaleString();
  render();
}

document.getElementById("fitBtn").onclick = fitToContent;
document.getElementById("randomBtn").onclick = randomize;
document.getElementById("densitySlider").oninput = function () {
  document.getElementById("densityValue").textContent = this.value;
};

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
  if (e.button === 1 || drawMode === "pan") {
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOriginStart = { x: originX, y: originY };
    canvas.classList.add("panning");
    e.preventDefault();
    return;
  }
  if (e.button !== 0) return;
  isDrawing = true;
  const { r, c } = screenToCell(e.offsetX, e.offsetY);
  if (drawMode === "erase") {
    drawValue = 0;
  } else {
    drawValue = cells.has(key(r, c)) ? 0 : 1;
  }
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
canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  isPanning = false;
  canvas.classList.remove("panning");
  lastDrawnCell = null;
});
canvas.addEventListener("mouseleave", () => {
  isDrawing = false;
  isPanning = false;
  canvas.classList.remove("panning");
  lastDrawnCell = null;
});

function setMode(mode) {
  drawMode = mode;
  document
    .querySelectorAll(".mode-btn")
    .forEach((b) => b.classList.remove("active"));
  document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
  canvas.className = "";
  if (mode === "pan") canvas.classList.add("pan-mode");
  if (mode === "erase") canvas.classList.add("erase-mode");
}

// RLE Parser
function parseRLE(rle) {
  const lines = rle.split("\n").filter((l) => !l.startsWith("#"));
  let body = lines.join("");
  const dataStart = body.search(/[bo$!]/);
  if (dataStart > 0) body = body.slice(dataStart);

  const result = new Set();
  let row = 0,
    col = 0,
    count = "";

  for (const ch of body) {
    if (ch >= "0" && ch <= "9") {
      count += ch;
      continue;
    }
    const n = count ? parseInt(count) : 1;
    count = "";
    if (ch === "b") {
      col += n;
    } else if (ch === "o") {
      for (let j = 0; j < n; j++) result.add(key(row, col + j));
      col += n;
    } else if (ch === "$") {
      row += n;
      col = 0;
    } else if (ch === "!") {
      break;
    }
  }
  return result;
}

// Load pattern centered on screen
function loadPattern(patternCells) {
  if (patternCells.size === 0) return;
  const coords = [...patternCells].map((k) => unkey(k));
  const minR = Math.min(...coords.map(([r]) => r));
  const maxR = Math.max(...coords.map(([r]) => r));
  const minC = Math.min(...coords.map(([, c]) => c));
  const maxC = Math.max(...coords.map(([, c]) => c));
  const centerR = Math.floor((minR + maxR) / 2);
  const centerC = Math.floor((minC + maxC) / 2);
  const { r: screenR, c: screenC } = screenToCell(
    canvas.width / 2,
    canvas.height / 2,
  );
  const dr = screenR - centerR,
    dc = screenC - centerC;
  patternCells.forEach((k) => {
    const [r, c] = unkey(k);
    cells.add(key(r + dr, c + dc));
  });
  population = cells.size;
  document.getElementById("populationCount").textContent =
    population.toLocaleString();
  render();
}

function loadRLEPattern(rle) {
  try {
    const parsed = parseRLE(rle);
    loadPattern(parsed);
  } catch (e) {
    alert("Error parsing RLE pattern");
  }
}

document.getElementById("loadRLEBtn").onclick = () => {
  const rle = document.getElementById("rleArea").value.trim();
  if (rle) loadRLEPattern(rle);
};

// Build pattern UI
function buildPatternUI() {
  const container = document.getElementById("patternCategories");
  Object.entries(PATTERNS).forEach(([category, patterns]) => {
    const div = document.createElement("div");
    div.className = "pattern-category";
    const header = document.createElement("div");
    header.className = "pattern-category-header";
    header.innerHTML = `<span>${category}</span><span class="arrow">▶</span>`;
    const list = document.createElement("div");
    list.className = "pattern-list";
    header.onclick = () => {
      header.classList.toggle("open");
      list.classList.toggle("open");
    };
    patterns.forEach((p) => {
      const item = document.createElement("div");
      item.className = "pattern-item";
      item.innerHTML = `<span>${p.name}</span><span class="pattern-size">${p.size}</span>`;
      item.onclick = () => {
        document
          .querySelectorAll(".pattern-item")
          .forEach((i) => i.classList.remove("selected"));
        item.classList.add("selected");
        loadRLEPattern(p.rle);
      };
      list.appendChild(item);
    });
    div.append(header, list);
    container.appendChild(div);
  });
  // Open first category
  container.querySelector(".pattern-category-header").classList.add("open");
  container.querySelector(".pattern-list").classList.add("open");
}

document.getElementById("patternSearch").oninput = function () {
  const q = this.value.toLowerCase().trim();
  document.querySelectorAll(".pattern-category").forEach((cat) => {
    const list = cat.querySelector(".pattern-list");
    const header = cat.querySelector(".pattern-category-header");
    let any = false;
    cat.querySelectorAll(".pattern-item").forEach((item) => {
      const match =
        !q || item.querySelector("span").textContent.toLowerCase().includes(q);
      item.style.display = match ? "" : "none";
      if (match) any = true;
    });
    cat.style.display = any ? "" : "none";
    if (q && any) {
      header.classList.add("open");
      list.classList.add("open");
    }
  });
};

// Init
buildPatternUI();
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
document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.onclick = () => setMode(btn.dataset.mode);
});
document.querySelectorAll(".theme-btn").forEach((btn) => {
  btn.onclick = () => {
    document
      .querySelectorAll(".theme-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.body.dataset.theme = btn.dataset.theme;
    render();
  };
});
document.getElementById("settingsBtn").onclick = () =>
  document.getElementById("settingsModal").classList.add("open");
document.getElementById("closeSettings").onclick = () =>
  document.getElementById("settingsModal").classList.remove("open");
document.getElementById("settingsModal").onclick = (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
};

document.getElementById("showGridToggle").onchange = function () {
  showGrid = this.checked;
  render();
};
document.getElementById("wrapToggle").onchange = function () {
  wrapEdges = this.checked;
};
document.getElementById("trailToggle").onchange = function () {
  showTrail = this.checked;
  render();
};
document.getElementById("highlightToggle").onchange = function () {
  showHighlight = this.checked;
  render();
};

document.getElementById("helpBtn").onclick = () =>
  document.getElementById("helpModal").classList.add("open");
document.getElementById("closeHelp").onclick = () =>
  document.getElementById("helpModal").classList.remove("open");
document.getElementById("helpModal").onclick = (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
};

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  switch (e.key) {
    case " ":
      e.preventDefault();
      running ? pause() : play();
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
      zoomAt(canvas.width / 2, canvas.height / 2, 1.15);
      break;
    case "-":
    case "_":
      zoomAt(canvas.width / 2, canvas.height / 2, 0.87);
      break;
    case "Escape":
      document
        .querySelectorAll(".modal-overlay")
        .forEach((m) => m.classList.remove("open"));
      break;
  }
});

pause(); // default state
