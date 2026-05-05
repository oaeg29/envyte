/*
  script_9_new.js
  ----------------------------------------------------------------------------
  Goal of this version:
  - Keep the same visual idea (random branch + strip-warped stem texture)
  - Make control flow easier to follow
  - Keep all function definitions first
  - Keep one clear "run area" at the bottom
  - Make debug drawing calls explicit and easy to disable
*/

// =========================
// 1) Canvas Setup
// =========================
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// =========================
// 2) Configuration
// =========================
const CONFIG = {
  backgroundColor: 'rgb(30, 40, 42)',

  // Random branch generation settings.
  noise: {
    stepSize: 4,
    scale: 0.8,
    timeStep: 1 / 60,
    checkpointCount: 20,
    checkpointSpacingSteps: 100,
  },

  // Where the branch starts and how smooth we make it.
  path: {
    startXRatio: 0.5,
    startYRatio: 0.9,
    smoothingSubdivisionsPerSpan: 10,
  },

  // Brush/strip behavior.
  brush: {
    stripWidth: 0.2,
    scale: 0.27,
    // Typo compatibility with previous script.
    sclale: undefined,
    pathOffset: 0,
    repeatGap: -35,
    repeatOverlap: 0,
    startOffset: 0,
    cropPartialRepeat: true,
  },

  // Debug toggles:
  // Turn things on/off here and rerender.
  debug: {
    enabled: false,
    showStripBounds: false,
    showStripCenters: true,
    showPathOutline: true,
    showTangents: false,
    showNormals: false,
    showControlPoints: true,
    showControlCurve: true,
    pathSampleStep: 8,
    vectorSampleSpacing: 120,
  },
};

// =========================
// 3) Runtime State
// =========================
const STATE = {
  dpr: window.devicePixelRatio || 1,
  viewportWidth: 0,
  viewportHeight: 0,

  // Used by noise-driven branch generation.
  timeCursor: Date.now() / 1000,
  noiseInstance: null,

  // Current generated data.
  controlPoints: [],
  smoothPoints: [],
  pathData: null,

  // Source image.
  stemImage: null,
};

// =========================
// 4) Small Utilities
// =========================

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function positiveModulo(value, mod) {
  if (mod === 0) {
    return 0;
  }
  return ((value % mod) + mod) % mod;
}

function normalize(vec) {
  const len = Math.hypot(vec.x, vec.y);
  if (len < 1e-8) {
    return { x: 1, y: 0 };
  }
  return { x: vec.x / len, y: vec.y / len };
}

function fallbackNoise2(x, y) {
  return Math.sin(x * 12.9898 + y * 78.233);
}

function getNoiseInstance() {
  // noisejs may or may not be available depending on script order.
  if (typeof Noise !== 'function') {
    return null;
  }
  if (!STATE.noiseInstance) {
    STATE.noiseInstance = new Noise(Math.random());
  }
  return STATE.noiseInstance;
}

function sampleNoise2(x, y) {
  const instance = getNoiseInstance();
  if (instance) {
    return instance.perlin2(x, y);
  }
  return fallbackNoise2(x, y);
}

// =========================
// 5) Branch Generation
// =========================

function getNoiseDelta(time, direction = -1) {
  const x1 = time / CONFIG.noise.stepSize;
  const y1 = time / CONFIG.noise.stepSize;
  const x2 = x1 + 4895943;
  const y2 = y1 + 4838485943;

  const n1 = sampleNoise2(x1, y1);
  const n2 = sampleNoise2(x2, y2);

  return {
    dx: Math.abs(n1) * CONFIG.noise.scale * direction,
    dy: Math.abs(n2) * CONFIG.noise.scale * -1,
  };
}

function generateBranchControlPoints(startX, startY, direction = -1) {
  let simX = startX;
  let simY = startY;
  const points = [{ x: simX, y: simY }];

  for (let i = 0; i < CONFIG.noise.checkpointCount; i += 1) {
    for (let j = 0; j < CONFIG.noise.checkpointSpacingSteps; j += 1) {
      STATE.timeCursor += CONFIG.noise.timeStep;
      const delta = getNoiseDelta(STATE.timeCursor, direction);
      simX += delta.dx;
      simY += delta.dy;
    }
    points.push({ x: simX, y: simY });
  }

  return points;
}

// =========================
// 6) B-Spline Smoothing
// =========================

/*
  sampleCubicBezier:
  Given a cubic Bezier segment (p0, p1, p2, p3), this function generates many
  points along it so we can treat the curve as a polyline later.
*/
function sampleCubicBezier(p0, p1, p2, p3, subdivisions) {
  const samples = [];
  const count = Math.max(2, subdivisions);

  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const mt = 1 - t;

    samples.push({
      x:
        mt * mt * mt * p0.x +
        3 * mt * mt * t * p1.x +
        3 * mt * t * t * p2.x +
        t * t * t * p3.x,
      y:
        mt * mt * mt * p0.y +
        3 * mt * mt * t * p1.y +
        3 * mt * t * t * p2.y +
        t * t * t * p3.y,
    });
  }

  return samples;
}

/*
  buildBSplinePolyline:
  - Treat control points as an open-uniform cubic B-spline.
  - Convert each spline span to a cubic Bezier.
  - Sample each Bezier with sampleCubicBezier().
  - Return one dense polyline for arc-length sampling and strip warping.
*/
function buildBSplinePolyline(controlPoints, subdivisionsPerSpan = 10) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
    return [];
  }

  const extended = [
    controlPoints[0],
    controlPoints[0],
    ...controlPoints,
    controlPoints[controlPoints.length - 1],
    controlPoints[controlPoints.length - 1],
  ];

  const result = [];

  for (let i = 0; i <= extended.length - 4; i += 1) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    const p2 = extended[i + 2];
    const p3 = extended[i + 3];

    const start = {
      x: (p0.x + 4 * p1.x + p2.x) / 6,
      y: (p0.y + 4 * p1.y + p2.y) / 6,
    };
    const cp1 = {
      x: (4 * p1.x + 2 * p2.x) / 6,
      y: (4 * p1.y + 2 * p2.y) / 6,
    };
    const cp2 = {
      x: (2 * p1.x + 4 * p2.x) / 6,
      y: (2 * p1.y + 4 * p2.y) / 6,
    };
    const end = {
      x: (p1.x + 4 * p2.x + p3.x) / 6,
      y: (p1.y + 4 * p2.y + p3.y) / 6,
    };

    const sampled = sampleCubicBezier(start, cp1, cp2, end, subdivisionsPerSpan);

    for (let j = 0; j < sampled.length; j += 1) {
      if (result.length > 0 && j === 0) {
        continue;
      }
      result.push(sampled[j]);
    }
  }

  return result;
}

// =========================
// 7) Arc-Length Path Data
// =========================

/*
  createPathData:
  Turns a polyline into cached segment data:
  - per-segment length
  - per-segment tangent
  - cumulative lengths
  This lets us quickly query point/tangent by distance along path.
*/
function createPathData(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return null;
  }

  const segments = [];
  const cumulative = [0];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);

    if (length < 1e-8) {
      continue;
    }

    segments.push({
      start,
      dx,
      dy,
      length,
      tangent: { x: dx / length, y: dy / length },
    });

    totalLength += length;
    cumulative.push(totalLength);
  }

  if (segments.length === 0) {
    return null;
  }

  return {
    points,
    segments,
    cumulative,
    totalLength,
  };
}

function findSegmentIndexForDistance(pathData, distance) {
  const d = clamp(distance, 0, pathData.totalLength);
  let low = 0;
  let high = pathData.segments.length - 1;
  let index = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const segStart = pathData.cumulative[mid];
    const segEnd = pathData.cumulative[mid + 1];

    if (d < segStart) {
      high = mid - 1;
    } else if (d > segEnd) {
      low = mid + 1;
    } else {
      index = mid;
      break;
    }
  }

  return index;
}

function getPathPointAtLength(pathData, distance) {
  const d = clamp(distance, 0, pathData.totalLength);
  const index = findSegmentIndexForDistance(pathData, d);
  const segment = pathData.segments[index];
  const segmentStart = pathData.cumulative[index];
  const t = segment.length < 1e-8 ? 0 : (d - segmentStart) / segment.length;

  return {
    x: segment.start.x + segment.dx * t,
    y: segment.start.y + segment.dy * t,
  };
}

function getPathTangentAtLength(pathData, distance) {
  const d = clamp(distance, 0, pathData.totalLength);
  const index = findSegmentIndexForDistance(pathData, d);
  const tangent = pathData.segments[index].tangent;
  return { x: tangent.x, y: tangent.y };
}

function samplePathPoints(pathData, spacing = 8) {
  const out = [];
  const step = Math.max(1, spacing);
  for (let d = 0; d <= pathData.totalLength; d += step) {
    out.push(getPathPointAtLength(pathData, d));
  }
  out.push(getPathPointAtLength(pathData, pathData.totalLength));
  return out;
}

// =========================
// 8) Texture Loading
// =========================

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image: ' + url));
    image.src = url;
  });
}

function createFallbackStemTexture() {
  const texture = document.createElement('canvas');
  texture.width = 160;
  texture.height = 600;
  const tctx = texture.getContext('2d');

  const gradient = tctx.createLinearGradient(0, 0, 0, texture.height);
  gradient.addColorStop(0, '#8dd17d');
  gradient.addColorStop(0.4, '#5da460');
  gradient.addColorStop(1, '#3f7f4a');
  tctx.fillStyle = gradient;
  tctx.fillRect(0, 0, texture.width, texture.height);

  tctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 48; i += 1) {
    const x = (i / 47) * texture.width;
    tctx.fillStyle = i % 2 === 0 ? 'rgba(16, 45, 20, 0.09)' : 'rgba(8, 25, 14, 0.07)';
    tctx.fillRect(x, 0, 2, texture.height);
  }
  tctx.globalCompositeOperation = 'source-over';

  tctx.fillStyle = 'rgba(220, 255, 220, 0.22)';
  tctx.fillRect(texture.width * 0.44, 0, texture.width * 0.08, texture.height);

  return texture;
}

async function loadStemTexture() {
  try {
    return await loadImage('./stem_2.png');
  } catch (error) {
    console.warn(error.message + ' | Falling back to generated stem texture.');
    return createFallbackStemTexture();
  }
}

// =========================
// 9) Drawing Helpers
// =========================

function drawBackground() {
  ctx.fillStyle = CONFIG.backgroundColor;
  ctx.fillRect(0, 0, STATE.viewportWidth, STATE.viewportHeight);
}

function drawCircle(x, y, radius, fillColor) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
}

function drawControlPoints(points) {
  for (let i = 0; i < points.length; i += 1) {
    drawCircle(points[i].x, points[i].y, 2, 'rgba(124, 248, 186, 0.5)');
  }
}

function drawControlCurve(points, stroke = 'rgba(74, 222, 128, 0.6)', lineWidth = 1.6) {
  if (!Array.isArray(points) || points.length < 2) {
    return;
  }

  const extended = [points[0], points[0], ...points, points[points.length - 1], points[points.length - 1]];

  ctx.beginPath();
  for (let i = 0; i <= extended.length - 4; i += 1) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    const p2 = extended[i + 2];
    const p3 = extended[i + 3];

    const startX = (p0.x + 4 * p1.x + p2.x) / 6;
    const startY = (p0.y + 4 * p1.y + p2.y) / 6;
    const cp1X = (4 * p1.x + 2 * p2.x) / 6;
    const cp1Y = (4 * p1.y + 2 * p2.y) / 6;
    const cp2X = (2 * p1.x + 4 * p2.x) / 6;
    const cp2Y = (2 * p1.y + 4 * p2.y) / 6;
    const endX = (p1.x + 4 * p2.x + p3.x) / 6;
    const endY = (p1.y + 4 * p2.y + p3.y) / 6;

    if (i === 0) {
      ctx.moveTo(startX, startY);
    }
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
  }

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawPathOutline(pathData) {
  const points = samplePathPoints(pathData, CONFIG.debug.pathSampleStep);
  if (points.length < 2) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = 'rgba(114, 191, 255, 0.9)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawPathVectors(pathData) {
  const spacing = Math.max(16, CONFIG.debug.vectorSampleSpacing);
  for (let d = 0; d <= pathData.totalLength; d += spacing) {
    const point = getPathPointAtLength(pathData, d);
    const tangent = normalize(getPathTangentAtLength(pathData, d));
    const normal = { x: -tangent.y, y: tangent.x };

    drawCircle(point.x, point.y, 2, 'rgba(255, 255, 255, 0.95)');

    if (CONFIG.debug.showTangents) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + tangent.x * 28, point.y + tangent.y * 28);
      ctx.strokeStyle = 'rgba(255, 91, 91, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (CONFIG.debug.showNormals) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x + normal.x * 20, point.y + normal.y * 20);
      ctx.strokeStyle = 'rgba(85, 242, 147, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}

function drawStripCenters(stripCenters) {
  if (!stripCenters || stripCenters.length === 0) {
    return;
  }

  const step = Math.max(1, Math.floor(stripCenters.length / 350));
  for (let i = 0; i < stripCenters.length; i += step) {
    const p = stripCenters[i];
    drawCircle(p.x, p.y, 1.3, 'rgba(255, 202, 39, 0.32)');
  }
}

function getBrushScale(brushConfig) {
  if (Number.isFinite(brushConfig.scale) && brushConfig.scale > 0) {
    return brushConfig.scale;
  }
  if (Number.isFinite(brushConfig.sclale) && brushConfig.sclale > 0) {
    return brushConfig.sclale;
  }
  return 0.5;
}

/*
  drawBrushAlongPath:
  Draw the vertical source image as many thin strips.
  Mapping:
  - Source image Y -> distance along path
  - Source image X -> width across path normal
*/
function drawBrushAlongPath(pathData, image, brushConfig, debugConfig) {
  const stripCenters = [];
  if (!pathData || !image) {
    return stripCenters;
  }

  const brushScale = getBrushScale(brushConfig);
  const stripLength = Math.max(0.1, brushConfig.stripWidth);
  const widthOnPath = image.width * brushScale;
  const tileDrawLength = image.height * brushScale;
  const tileStep = Math.max(stripLength * 0.5, tileDrawLength + brushConfig.repeatGap - brushConfig.repeatOverlap);

  const phase = positiveModulo(brushConfig.startOffset, tileStep);
  let tileStart = -phase;

  for (; tileStart < pathData.totalLength; tileStart += tileStep) {
    let localStart = 0;
    let localEnd = tileDrawLength;

    if (brushConfig.cropPartialRepeat) {
      localStart = Math.max(localStart, -tileStart);
      localEnd = Math.min(localEnd, pathData.totalLength - tileStart);
    }

    if (localEnd <= localStart) {
      continue;
    }

    for (let localAlongPath = localStart; localAlongPath < localEnd; localAlongPath += stripLength) {
      const currentStripLength = Math.min(stripLength, localEnd - localAlongPath);
      const distanceOnPath = tileStart + localAlongPath + currentStripLength * 0.5;

      if (distanceOnPath < 0 || distanceOnPath > pathData.totalLength) {
        continue;
      }

      const sourceY = localAlongPath / brushScale;
      if (sourceY >= image.height) {
        break;
      }

      const sourceHeight = Math.min(currentStripLength / brushScale, image.height - sourceY);
      if (sourceHeight <= 0) {
        continue;
      }

      const point = getPathPointAtLength(pathData, distanceOnPath);
      const tangent = normalize(getPathTangentAtLength(pathData, distanceOnPath));
      const normal = { x: -tangent.y, y: tangent.x };

      const origin = {
        x: point.x + normal.x * brushConfig.pathOffset,
        y: point.y + normal.y * brushConfig.pathOffset,
      };

      ctx.save();
      ctx.transform(normal.x, normal.y, tangent.x, tangent.y, origin.x, origin.y);

      ctx.drawImage(
        image,
        0,
        sourceY,
        image.width,
        sourceHeight,
        -widthOnPath * 0.5,
        -currentStripLength * 0.5,
        widthOnPath,
        currentStripLength,
      );

      if (debugConfig.enabled && debugConfig.showStripBounds) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-widthOnPath * 0.5, -currentStripLength * 0.5, widthOnPath, currentStripLength);
      }

      ctx.restore();

      if (debugConfig.enabled && debugConfig.showStripCenters) {
        stripCenters.push(point);
      }
    }
  }

  return stripCenters;
}

// =========================
// 10) Scene Functions
// =========================

function resizeCanvasToViewport() {
  STATE.viewportWidth = window.innerWidth;
  STATE.viewportHeight = window.innerHeight;

  canvas.style.width = STATE.viewportWidth + 'px';
  canvas.style.height = STATE.viewportHeight + 'px';
  canvas.width = Math.floor(STATE.viewportWidth * STATE.dpr);
  canvas.height = Math.floor(STATE.viewportHeight * STATE.dpr);

  ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
}

function setSeeds() {
   let seedsLeft = [];
   let seedsRight = [];
   let Xmargin = 40;

   let numOfSeeds = 20;
   for (i = 0; i < numOfSeeds; i++) {
      seedsLeft.push({
        x: - 5 - Math.random() * Xmargin,
        y: Math.random() * canvas.height,
      });
      seedsRight.push({
        x: canvas.width + 5 + Math.random() * Xmargin,
        y: Math.random() * canvas.height,
      });
   }
   return { seedsLeft, seedsRight };
   
}

function plantSeeds(myseeds){
    const { seedsLeft, seedsRight } = myseeds || setSeeds();
    seedsLeft.forEach(seed => {
        regeneratePath(seed.x, seed.y);
        renderScene();
    });
    seedsRight.forEach(seed => {
        regeneratePath(seed.x, seed.y);
        renderScene();
    });

}

function regeneratePath(x,y) {
  // const startX = STATE.viewportWidth * CONFIG.path.startXRatio;
  // const startY = STATE.viewportHeight * CONFIG.path.startYRatio;

  const startX = x;
  const startY = y;

  STATE.controlPoints = generateBranchControlPoints(startX, startY, -1);
  STATE.smoothPoints = buildBSplinePolyline(
    STATE.controlPoints,
    CONFIG.path.smoothingSubdivisionsPerSpan,
  );

  const pointsForPath = STATE.smoothPoints.length >= 2 ? STATE.smoothPoints : STATE.controlPoints;
  STATE.pathData = createPathData(pointsForPath);
}

/*
  renderScene:
  This is the single place where drawing order is controlled.
  If you want to disable debug lines, this is where they're called.
*/
function renderScene() {
  if (!STATE.pathData || !STATE.stemImage) {
    return;
  }

  ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  drawBackground();

  const stripCenters = drawBrushAlongPath(
    STATE.pathData,
    STATE.stemImage,
    CONFIG.brush,
    CONFIG.debug,
  );

  // ---- DEBUG DRAWS (easy to find and disable) ----
  if (CONFIG.debug.enabled && CONFIG.debug.showPathOutline) {
    drawPathOutline(STATE.pathData);
  }

  if (CONFIG.debug.enabled && (CONFIG.debug.showTangents || CONFIG.debug.showNormals)) {
    drawPathVectors(STATE.pathData);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showStripCenters) {
    drawStripCenters(stripCenters);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlPoints) {
    drawControlPoints(STATE.controlPoints);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlCurve) {
    drawControlCurve(STATE.controlPoints);
  }
}

// =========================
// 11) Event Handlers
// =========================

function onResize() {
  // Important: do NOT regenerate path here.
  // Browser zoom can fire resize events, and we want to keep the same path.
  resizeCanvasToViewport();
  renderScene();
}

function onKeydown(event) {
  if (event.key.toLowerCase() === 'r') {
    regeneratePath();
    renderScene();
  }
}

function setupEventHandlers() {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
}

// =========================
// 12) DevTools Helpers
// =========================

function exposeDevToolsApi() {
  window.stemWarpDemoNew = {
    config: CONFIG,

    regenerate() {
      regeneratePath();
      renderScene();
    },

    setBrushOptions(nextOptions) {
      Object.assign(CONFIG.brush, nextOptions);
      renderScene();
    },

    setDebugOptions(nextOptions) {
      Object.assign(CONFIG.debug, nextOptions);
      renderScene();
    },

    setControlPoints(points) {
      if (!Array.isArray(points) || points.length < 2) {
        return;
      }
      STATE.controlPoints = points.map((p) => ({ x: p.x, y: p.y }));
      STATE.smoothPoints = buildBSplinePolyline(
        STATE.controlPoints,
        CONFIG.path.smoothingSubdivisionsPerSpan,
      );
      const pointsForPath = STATE.smoothPoints.length >= 2 ? STATE.smoothPoints : STATE.controlPoints;
      STATE.pathData = createPathData(pointsForPath);
      renderScene();
    },

    rerender() {
      renderScene();
    },
  };
}

// =========================
// 13) Bootstrap
// =========================

async function bootstrap() {
  resizeCanvasToViewport();
  STATE.stemImage = await loadStemTexture();
  regeneratePath(400,500);
  plantSeeds(setSeeds());
  renderScene();
  setupEventHandlers();
  exposeDevToolsApi();
}

// =========================
// 14) RUN AREA
// =========================
// Single entry point for the whole script.
window.addEventListener('load', () => {
  bootstrap().catch((error) => {
    console.error('Failed to bootstrap script_9_new.js', error);
  });
});
