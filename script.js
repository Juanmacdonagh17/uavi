/* uavi pattern gen - jmd
   - colour squares (cells), black strokes
   - black patterns: lines, circles, squares, uaaaaaves
   - seeded RNG (optional)
   - a nice movie :) 
*/

const SVG_NS = "http://www.w3.org/2000/svg";

const els = {
  cols: document.getElementById("cols"), // number of cols
  rows: document.getElementById("rows"), // number of rows
  cellSize: document.getElementById("cellSize"), // size of individual cell
  strokeWidth: document.getElementById("strokeWidth"), // stroke of pattenrs
  seed: document.getElementById("seed"), // seed input (optional, extra functions bellow)
  playInterval: document.getElementById("playInterval"), // play changes ie movie
  patternSet: document.getElementById("patternSet"), // different pattern types
  playBtn: document.getElementById("playBtn"), // play/pause button movie 
  generateBtn: document.getElementById("generateBtn"), // this or space gens new ones
  downloadBtn: document.getElementById("downloadBtn"), // as svg
  fullscreenBtn: document.getElementById("fullscreenBtn"), // fullscreen toggle (not really working fully)
  stage: document.getElementById("stage")
};

function clampInt(v, min, max) {
  const n = Math.floor(Number(v));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function clampFloat(v, min, max) {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

//random RNG: xmur3 (hash) -> string to 32bit y mulberry32 (rng) -> 32bit to random number 

// this and mulberry32 from https://stackoverflow.com/a/47593316 by @bryc !! 
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seedStr) {
  if (!seedStr) return Math.random;
  const seedFn = xmur3(seedStr);
  return mulberry32(seedFn());
}

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function clearStage() {
  els.stage.innerHTML = "";
}
// * download svg * //
function downloadText(filename, text) {
  const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// pattern selection -> here I could also do mult. selection, ie, lines AND uaves
function pickPatternList(patternSet) {
  switch (patternSet) {
    case "lines":   return ["lines"];
    case "circles": return ["circles"];
    case "squares": return ["squares"];
    case "waves":   return ["waves"];
    default:        return ["lines", "circles", "squares", "waves"];
  }
}

function choice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng, min, maxInclusive) {
  return min + Math.floor(rng() * (maxInclusive - min + 1));
}

function buildSvgGrid({ cols, rows, cellSize, strokeWidth, seed, patternSet }) {
  const rng = makeRng(seed);

  const W = cols * cellSize;
  const H = rows * cellSize;

  const svg = el("svg", {
    xmlns: SVG_NS,
    width: W,
    height: H,
    viewBox: `0 0 ${W} ${H}`,
  });

  
  svg.appendChild(el("rect", { x: 0, y: 0, width: W, height: H, fill: "white" }));

  const patterns = pickPatternList(patternSet);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;

     
      const g = el("g", { transform: `translate(${x},${y})` });

      // I could aslo accept palletes as input 

      const palette = ["#F4D94E", "#C8557F", "#438A4F", "#845B2B", "#7BADDD"]; /* paquers nacionales pallete */
      const cellFill = choice(rng, palette);

      g.appendChild(el("rect", {
        x: 0, y: 0, width: cellSize, height: cellSize,
        fill: cellFill, // random option!!! 
      }));

      
      const clipId = `clip_${r}_${c}_${Math.floor(rng() * 1e9)}`;
      const defs = el("defs");
      const clipPath = el("clipPath", { id: clipId });
      clipPath.appendChild(el("rect", { x: 0, y: 0, width: cellSize, height: cellSize }));
      defs.appendChild(clipPath);
      g.appendChild(defs);

      const pg = el("g", { "clip-path": `url(#${clipId})` });

      const p = choice(rng, patterns);
      if (p === "lines")   drawLines(pg, rng, cellSize, strokeWidth);
      if (p === "circles") drawCircles(pg, rng, cellSize, strokeWidth);
      if (p === "squares") drawSquares(pg, rng, cellSize, strokeWidth);
      if (p === "waves")   drawWaves(pg, rng, cellSize, strokeWidth);

      g.appendChild(pg);

     
      g.appendChild(el("rect", {
        x: 0, y: 0, width: cellSize, height: cellSize,
        fill: "none",
        stroke: "black",
        "stroke-width": 0.6,
        opacity: 0.25
      }));

      svg.appendChild(g);
    }
  }

  return svg;
}



function baseStroke(strokeWidth) {
  return {
    stroke: "black", // HERE I could play with different colours too! but i like black as of now
    fill: "none",
    "stroke-width": strokeWidth,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
}

// mathhhhh (lines)

function drawLines(g, rng, s, sw) {
  const attrs = baseStroke(sw);
  const n = randInt(rng, 3, 10);
  const mode = choice(rng, ["vertical", "horizontal", "diag1", "diag2"]);

  for (let i = 0; i < n; i++) {
    let x1, y1, x2, y2;

    if (mode === "vertical") {
      const x = (i + 0.5) * (s / n);
      x1 = x; y1 = 0; x2 = x; y2 = s;
    } else if (mode === "horizontal") {
      const y = (i + 0.5) * (s / n);
      x1 = 0; y1 = y; x2 = s; y2 = y;
    } else if (mode === "diag1") {
      // top-left to bottom-right parallel set
      const offset = (i - n / 2) * (s / (n / 2));
      x1 = 0 + offset; y1 = 0;
      x2 = s + offset; y2 = s;
    } else {
      // top-right to bottom-left parallel set
      const offset = (i - n / 2) * (s / (n / 2));
      x1 = s - offset; y1 = 0;
      x2 = 0 - offset; y2 = s;
    }

    g.appendChild(el("line", { ...attrs, x1, y1, x2, y2, opacity: 0.9 }));
  }
}

// mathhhhh (circles)
function drawCircles(g, rng, s, sw) {
  const attrs = baseStroke(sw);
  const cx = s / 2;
  const cy = s / 2;
  const rings = randInt(rng, 2, 6);
  const maxR = (s * 0.46);
  const minR = (s * 0.12);
  for (let i = 0; i < rings; i++) {
    const t = i / Math.max(1, rings - 1);
    const r = minR + t * (maxR - minR);
    g.appendChild(el("circle", { ...attrs, cx, cy, r }));
  }
}

// mathhhhh (squares)
function drawSquares(g, rng, s, sw) {
  const attrs = baseStroke(sw);
  const rings = randInt(rng, 2, 6);
  const maxInset = s * 0.06;
  const minInset = s * 0.44;
  for (let i = 0; i < rings; i++) {
    const t = i / Math.max(1, rings - 1);
    const inset = maxInset + t * (minInset - maxInset);
    const size = s - 2 * inset;
    g.appendChild(el("rect", { ...attrs, x: inset, y: inset, width: size, height: size }));
  }
}

// mathhhhh (uaves)
function drawWaves(g, rng, s, sw) {
  const attrs = baseStroke(sw);

  const rows = randInt(rng, 2, 5);

  // nicer-looking ranges
  const amp = (0.04 + rng() * 0.08) * s;           // ~6–12% of cell size
  const freqOptions = [1, 2, 3, 4, 5, 6, 7];                   // fewer, smoother cycles
  const freq = choice(rng, freqOptions);

  const step = 2;                                  // smoother curve
  const useCos = rng() < 0.5;

  for (let j = 0; j < rows; j++) {
    const y0 = (j + 0.5) * (s / rows);

    // ONE phase per row 
    const phase = rng() * Math.PI * 2;

    const points = [];
    for (let x = 0; x <= s; x += step) {
      const angle = (2 * Math.PI * freq * x) / s + phase;
      const y = y0 + amp * (useCos ? Math.cos(angle) : Math.sin(angle));
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    g.appendChild(el("polyline", { ...attrs, points: points.join(" ") }));
  }
}



function generate() {
  const cols = clampInt(els.cols.value, 1, 200);
  const rows = clampInt(els.rows.value, 1, 200);
  const cellSize = clampInt(els.cellSize.value, 10, 400);
  const strokeWidth = clampFloat(els.strokeWidth.value, 0.5, 12);
  const seed = els.seed.value.trim();
  const patternSet = els.patternSet.value;

  const svg = buildSvgGrid({ cols, rows, cellSize, strokeWidth, seed, patternSet });
  clearStage();
  els.stage.appendChild(svg);
}

els.generateBtn.addEventListener("click", generate);

document.addEventListener("keydown", (e) => {
  // so it also generates with spacebar  
  const tag = e.target?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return; // not when typing

  if (e.code === "Space") { // if press, run the generate function
    e.preventDefault(); 
    generate();
  }
});

let playTimer = null;


function getPlayIntervalMs() {
  const seconds = Number(els.playInterval.value);
  if (Number.isNaN(seconds) || seconds <= 0) return 10000; // fallback to 10 s just in case
  return seconds * 1000;
}

function setPlaying(isPlaying) {
  if (isPlaying) {
    if (playTimer) return;

    generate(); // optional just generate immediately on play
    playTimer = setInterval(generate, getPlayIntervalMs());
    els.playBtn.textContent = "Pause";
  } else {
    if (playTimer) clearInterval(playTimer);
    playTimer = null;
    els.playBtn.textContent = "Play";
  }
}

els.playInterval.addEventListener("input", () => {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = setInterval(generate, getPlayIntervalMs());
  }
});

els.playBtn.addEventListener("click", () => {
  setPlaying(!playTimer);
});

els.fullscreenBtn.addEventListener("click", async () => {
  const target = document.querySelector(".canvas-wrap"); 
  if (!document.fullscreenElement) {
    await target.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
});

els.downloadBtn.addEventListener("click", () => {
  const svg = els.stage.querySelector("svg");
  if (!svg) return;

  
  const text = `<?xml version="1.0" encoding="UTF-8"?>\n` + svg.outerHTML;
  downloadText("grid-pattern.svg", text);
});


generate();
