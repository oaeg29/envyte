/*
  script_10.js
  -----------------------------------------------------------------------------
  Multi-branch architecture
  -----------------------------------------------------------------------------
  Key change from the previous setup:
  - We no longer keep a single active path in global state.
  - Each branch is its own object with its own seed, points, and path data.
  - A BranchGarden object owns many Branch instances and renders all of them.

  This makes setSeeds()/plantSeeds() naturally support many branches without
  branches overwriting each other.
*/

// =========================
// 1) Canvas
// =========================
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// =========================
// 2) Config
// =========================
const CONFIG = {
  backgroundColor: 'rgb(30, 40, 42)',

  noise: {
    stepSize: 2,
    scale: 2.2,
    timeStep: 1 / 300,
    checkpointCount: 20,
    checkpointSpacingSteps: 10,
  },

  path: {
    smoothingSubdivisionsPerSpan: 10,
  },

  pathGeneration: {
    mode: 'manualTemplate', // random | manualTemplate
    templateScale: 0.4,
    templateNoiseAmount: 40,
    templateNoiseStep: 1 / 7.5,
    templateNoiseAmount2: 25,
    templateNoiseStep2: 1 / 0.5,
    alignTemplateToGrowth: false,
    templatePickMode: 'fixed', // random | fixed
    templatePickDeterministic: true,
    fixedTemplateIndex: 0,
    // Additional base templates (arrays of {x,y}) besides generate_manual_points().
    manualTemplates: [],
  },

  brush: {
    stripWidth: 0.2,
    scale: 0.05,
    sclale: undefined, // typo compatibility
    pathOffset: 0,
    repeatGap: 0,
    repeatOverlap: 0.2,
    startOffset: 0,
    cropPartialRepeat: true,
  },

  seeds: {
    countPerSide: 3,
    sidePad: 0,
    sideMargin: 2,
  },

  // offshoot: {
  //   enabled: true,
  //   deterministic: true,
  //   maxDepth: 1,
  //   countRange: [0, 5],
  //   spawnTMin: 0.01,
  //   spawnTMax: 0.96,
  //   biasExponent: 1.6,
  //   angleDegRange: [0,1],
  //   sideMode: 'alternate', // random | left | right | alternate
  //   depthScale: 0.7,
  //   minSpawnSpacingT: 0,
  //   maxSpawnAttemptsPerChild: 80,
  //   maxTotalBranches: 500,
  // },

    offshoot: {
    enabled: false,
    deterministic: true,
    maxDepth: 1,
    countRange: [0, 5],
    spawnTMin: 0.01,
    spawnTMax: 0.96,
    biasExponent: 1.6,
    angleDegRange: [0,1],
    sideMode: 'alternate', // random | left | right | alternate
    depthScale: 0.7,
    minSpawnSpacingT: 0,
    maxSpawnAttemptsPerChild: 80,
    maxTotalBranches: 500,
  },

  debug: {
    // enabled: true,
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

  noiseInstance: null,
  stemImage: null,

  branchGarden: null,
  lastSeedPacket: null,
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

function getModifierStepMultiplier(event) {
  if (!event || typeof event !== 'object') {
    return 1;
  }
  const hasShift = event.shiftKey === true;
  const hasCmdOrCtrl = event.metaKey === true || event.ctrlKey === true;
  if (hasShift && hasCmdOrCtrl) {
    return 100;
  }
  if (hasShift) {
    return 10;
  }
  return 1;
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

function rotateVector(vec, angleRadians) {
  const c = Math.cos(angleRadians);
  const s = Math.sin(angleRadians);
  return {
    x: vec.x * c - vec.y * s,
    y: vec.x * s + vec.y * c,
  };
}

function hashSeed(value) {
  const text = String(value);
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function random() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleFloatRange(range, rng = Math.random) {
  const min = range[0];
  const max = range[1];
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return 0;
  }
  if (max <= min) {
    return min;
  }
  return min + (max - min) * rng();
}

function sampleIntRange(range, rng = Math.random) {
  const min = Math.ceil(range[0]);
  const max = Math.floor(range[1]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return 0;
  }
  if (max <= min) {
    return min;
  }
  return Math.floor(rng() * (max - min + 1)) + min;
}

function normalizeRangeInput(value, fallbackMin, fallbackMax) {
  if (Array.isArray(value) && value.length >= 2) {
    const a = Number(value[0]);
    const b = Number(value[1]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return [Math.min(a, b), Math.max(a, b)];
    }
  }
  if (Number.isFinite(value)) {
    return [value, value];
  }
  return [fallbackMin, fallbackMax];
}

function resolveRangeValue(rangeCandidate, fixedCandidate, fallbackValue, fallbackMin, fallbackMax) {
  if (rangeCandidate !== undefined) {
    return normalizeRangeInput(rangeCandidate, fallbackMin, fallbackMax);
  }
  if (Number.isFinite(fixedCandidate)) {
    return [fixedCandidate, fixedCandidate];
  }
  return normalizeRangeInput(fallbackValue, fallbackMin, fallbackMax);
}

function normalizeOffshootInput(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }
  return { ...value };
}

function normalizeAddBranchOptions(value) {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const hasStructuredOptions = (
    value.offshoot !== undefined ||
    value.manualTemplateIndex !== undefined ||
    value.stableKey !== undefined
  );

  if (hasStructuredOptions) {
    return {
      ...value,
      offshoot: normalizeOffshootInput(value.offshoot),
    };
  }
  return {
    offshoot: normalizeOffshootInput(value),
  };
}

function getSideSign(mode, index, rng) {
  if (mode === 'left') {
    return -1;
  }
  if (mode === 'right') {
    return 1;
  }
  if (mode === 'alternate') {
    return index % 2 === 0 ? 1 : -1;
  }
  return rng() < 0.5 ? -1 : 1;
}

function sanitizeSideMode(value) {
  if (value === 'left' || value === 'right' || value === 'alternate' || value === 'random') {
    return value;
  }
  return 'random';
}

function getDirectionalBasis(growthDir, direction) {
  if (!growthDir || !Number.isFinite(growthDir.x) || !Number.isFinite(growthDir.y)) {
    return null;
  }
  const forward = normalize(growthDir);
  const normal = { x: -forward.y, y: forward.x };
  const side = direction >= 0 ? 1 : -1;
  return {
    forward,
    lateral: {
      x: normal.x * side,
      y: normal.y * side,
    },
  };
}

function getPathGenerationMode() {
  return CONFIG.pathGeneration && CONFIG.pathGeneration.mode === 'manualTemplate'
    ? 'manualTemplate'
    : 'random';
}

function sanitizeManualTemplatePoints(template) {
  if (!Array.isArray(template)) {
    return null;
  }

  const points = [];
  for (let i = 0; i < template.length; i += 1) {
    const point = template[i];
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }
    points.push({ x: point.x, y: point.y });
  }

  return points.length >= 2 ? points : null;
}

function getSanitizedManualTemplates() {
  const out = [];

  // Primary template source requested by user.
  const generated = sanitizeManualTemplatePoints(generate_manual_points());
  if (generated) {
    out.push(generated);
  }

  // Additional user-provided templates for future expansion.
  const config = CONFIG.pathGeneration || {};
  const inputTemplates = Array.isArray(config.manualTemplates) ? config.manualTemplates : [];
  for (let i = 0; i < inputTemplates.length; i += 1) {
    const template = sanitizeManualTemplatePoints(inputTemplates[i]);
    if (template) {
      out.push(template);
    }
  }

  return out;
}

function resolveManualTemplateIndex(templateCount, stableKey = '', preferredIndex = null) {
  if (!Number.isFinite(templateCount) || templateCount < 1) {
    return -1;
  }

  if (Number.isFinite(preferredIndex)) {
    return clamp(Math.floor(preferredIndex), 0, templateCount - 1);
  }

  const config = CONFIG.pathGeneration || {};
  if (config.templatePickMode === 'fixed') {
    const fixed = Number.isFinite(config.fixedTemplateIndex) ? config.fixedTemplateIndex : 0;
    return clamp(Math.floor(fixed), 0, templateCount - 1);
  }

  if (config.templatePickDeterministic) {
    const rng = mulberry32(hashSeed(`${stableKey}|manual-template`));
    return clamp(Math.floor(rng() * templateCount), 0, templateCount - 1);
  }

  return clamp(Math.floor(Math.random() * templateCount), 0, templateCount - 1);
}

function getTemplateNoiseOffset(
  time,
  direction = -1,
  noiseConfig = CONFIG.noise,
  noisePhase = { x1: 0, y1: 0, x2: 0, y2: 0 },
  noiseScaleMultiplier = 1,
  directionalBasis = null,
  noiseAmount = 0,
  layerSeed = 0,
) {
  const layerOffsetA = layerSeed * 27183.331;
  const layerOffsetB = layerSeed * 93841.719;
  const x1 = time / noiseConfig.stepSize + noisePhase.x1 + layerOffsetA;
  const y1 = time / noiseConfig.stepSize + noisePhase.y1 + layerOffsetB;
  const x2 = x1 + 94827 + noisePhase.x2 + layerOffsetB * 0.37;
  const y2 = y1 + 53977 + noisePhase.y2 + layerOffsetA * 0.53;

  const n1 = sampleNoise2(x1, y1);
  const n2 = sampleNoise2(x2, y2);

  const lateralMagnitude = n1 * noiseAmount * noiseScaleMultiplier;
  const forwardMagnitude = n2 * noiseAmount * noiseScaleMultiplier;

  if (directionalBasis) {
    return {
      dx: directionalBasis.lateral.x * lateralMagnitude + directionalBasis.forward.x * forwardMagnitude,
      dy: directionalBasis.lateral.y * lateralMagnitude + directionalBasis.forward.y * forwardMagnitude,
    };
  }

  return {
    dx: lateralMagnitude * direction,
    dy: forwardMagnitude * -1,
  };
}

// =========================
// 5) Branch Generation
// =========================
function getNoiseDelta(
  time,
  direction = -1,
  noiseConfig = CONFIG.noise,
  noisePhase = { x1: 0, y1: 0, x2: 0, y2: 0 },
  noiseScaleMultiplier = 1,
  directionalBasis = null,
) {
  const x1 = time / noiseConfig.stepSize + noisePhase.x1;
  const y1 = time / noiseConfig.stepSize + noisePhase.y1;
  const x2 = x1 + 4895943 + noisePhase.x2;
  const y2 = y1 + 4838485943 + noisePhase.y2;

  const n1 = sampleNoise2(x1, y1);
  const n2 = sampleNoise2(x2, y2);

  const lateralMagnitude = Math.abs(n1) * noiseConfig.scale * noiseScaleMultiplier;
  const forwardMagnitude = Math.abs(n2) * noiseConfig.scale * noiseScaleMultiplier;

  if (directionalBasis) {
    return {
      dx: directionalBasis.lateral.x * lateralMagnitude + directionalBasis.forward.x * forwardMagnitude,
      dy: directionalBasis.lateral.y * lateralMagnitude + directionalBasis.forward.y * forwardMagnitude,
    };
  }

  return {
    dx: lateralMagnitude * direction,
    dy: forwardMagnitude * -1,
  };
}

/*
  Generates one random-noise branch control-point list.
  Returns both points and the updated time cursor so each branch can keep its
  own independent generation timeline.
*/

function generate_manual_points() {
  const generated = [];
  const x0 = 200;
  const y0 = 500;
  const d = 25;

  generated.push({ x: x0 + 8 * d, y: y0 + 2 * d });
  generated.push({ x: x0 + 6 * d, y: y0 + 4 * d });
  generated.push({ x: x0 + 5 * d, y: y0 + 4 * d });
  generated.push({ x: x0 + 4 * d, y: y0 + 4 * d });
  generated.push({ x: x0 + 3 * d, y: y0 + 5 * d });
  generated.push({ x: x0 + 1 * d, y: y0 + 4 * d });
  generated.push({ x: x0 - 3 * d, y: y0 - 4 * d });
  generated.push({ x: x0 - 4 * d, y: y0 - 5 * d });
  generated.push({ x: x0 - 6 * d, y: y0 - 5 * d });
  generated.push({ x: x0 - 6.5 * d, y: y0 - 6 * d });

  return generated;
}

function generateBranchControlPoints(
  startX,
  startY,
  direction,
  initialTime,
  noiseConfig = CONFIG.noise,
  branchProfile = {},
) {
  let simX = startX;
  let simY = startY;
  let timeCursor = initialTime;
  const points = [{ x: simX, y: simY }];

  const noisePhase = branchProfile.noisePhase || { x1: 0, y1: 0, x2: 0, y2: 0 };
  const noiseScaleMultiplier = Number.isFinite(branchProfile.noiseScaleMultiplier)
    ? branchProfile.noiseScaleMultiplier
    : 1;
  const directionalBasis = getDirectionalBasis(branchProfile.growthDir, direction);

  for (let i = 0; i < noiseConfig.checkpointCount; i += 1) {
    for (let j = 0; j < noiseConfig.checkpointSpacingSteps; j += 1) {
      timeCursor += noiseConfig.timeStep;
      const delta = getNoiseDelta(
        timeCursor,
        direction,
        noiseConfig,
        noisePhase,
        noiseScaleMultiplier,
        directionalBasis,
      );
      simX += delta.dx;
      simY += delta.dy;
    }
    points.push({ x: simX, y: simY });
  }

  return {
    points,
    endTime: timeCursor,
  };
}

function generateTemplateControlPoints(
  startX,
  startY,
  direction,
  initialTime,
  noiseConfig = CONFIG.noise,
  branchProfile = {},
  stableKey = '',
  preferredTemplateIndex = null,
) {
  const templates = getSanitizedManualTemplates();
  if (templates.length === 0) {
    return generateBranchControlPoints(
      startX,
      startY,
      direction,
      initialTime,
      noiseConfig,
      branchProfile,
    );
  }

  const templateIndex = resolveManualTemplateIndex(templates.length, stableKey, preferredTemplateIndex);
  const template = templates[templateIndex >= 0 ? templateIndex : 0];
  const templateConfig = CONFIG.pathGeneration || {};

  const noisePhase = branchProfile.noisePhase || { x1: 0, y1: 0, x2: 0, y2: 0 };
  const noiseScaleMultiplier = Number.isFinite(branchProfile.noiseScaleMultiplier)
    ? branchProfile.noiseScaleMultiplier
    : 1;
  const directionalBasis = getDirectionalBasis(branchProfile.growthDir, direction);

  const baseNoiseStep = Number.isFinite(noiseConfig.timeStep) && noiseConfig.timeStep > 0
    ? noiseConfig.timeStep
    : 1 / 300;
  const noiseAmount1 = Math.max(0, Number(templateConfig.templateNoiseAmount) || 0);
  const noiseStep1 = Number.isFinite(templateConfig.templateNoiseStep) && templateConfig.templateNoiseStep > 0
    ? templateConfig.templateNoiseStep
    : baseNoiseStep;
  const noiseAmount2 = Math.max(0, Number(templateConfig.templateNoiseAmount2) || 0);
  const noiseStep2 = Number.isFinite(templateConfig.templateNoiseStep2) && templateConfig.templateNoiseStep2 > 0
    ? templateConfig.templateNoiseStep2
    : baseNoiseStep;
  const templateNoiseLayers = [];
  if (noiseAmount1 > 0) {
    templateNoiseLayers.push({ amount: noiseAmount1, step: noiseStep1, layerSeed: 0 });
  }
  if (noiseAmount2 > 0) {
    templateNoiseLayers.push({ amount: noiseAmount2, step: noiseStep2, layerSeed: 1 });
  }
  const shouldAlign = templateConfig.alignTemplateToGrowth !== false;
  const globalTemplateScale = Number.isFinite(templateConfig.templateScale)
    ? Math.max(0, templateConfig.templateScale)
    : 1;
  const branchTemplateScale = Number.isFinite(branchProfile.templateScaleMultiplier)
    ? Math.max(0, branchProfile.templateScaleMultiplier)
    : 1;
  const templateScale = globalTemplateScale * branchTemplateScale;
  // Treat negative direction as canonical template orientation, and mirror for positive direction.
  const mirrorX = direction >= 0 ? -1 : 1;

  const first = template[0];
  const last = template[template.length - 1];
  const templateHeading = normalize({
    x: (last.x - first.x) * mirrorX,
    y: last.y - first.y,
  });
  const targetHeading = normalize(
    branchProfile.growthDir && Number.isFinite(branchProfile.growthDir.x) && Number.isFinite(branchProfile.growthDir.y)
      ? branchProfile.growthDir
      : { x: direction, y: -1 },
  );

  let rotation = 0;
  if (shouldAlign) {
    const cross = templateHeading.x * targetHeading.y - templateHeading.y * targetHeading.x;
    const dot = templateHeading.x * targetHeading.x + templateHeading.y * targetHeading.y;
    rotation = Math.atan2(cross, dot);
  }

  const layerTimeCursors = new Array(templateNoiseLayers.length).fill(initialTime);
  const points = [];
  for (let i = 0; i < template.length; i += 1) {
    const local = {
      x: (template[i].x - first.x) * mirrorX * templateScale,
      y: (template[i].y - first.y) * templateScale,
    };

    const aligned = shouldAlign ? rotateVector(local, rotation) : local;
    let point = {
      x: startX + aligned.x,
      y: startY + aligned.y,
    };

    // Keep the first point pinned to the seed; noise only perturbs subsequent checkpoints.
    if (templateNoiseLayers.length > 0 && i > 0) {
      let totalDx = 0;
      let totalDy = 0;
      for (let layerIndex = 0; layerIndex < templateNoiseLayers.length; layerIndex += 1) {
        const layer = templateNoiseLayers[layerIndex];
        layerTimeCursors[layerIndex] += layer.step;
        const noiseOffset = getTemplateNoiseOffset(
          layerTimeCursors[layerIndex] + i * 0.1618,
          direction,
          noiseConfig,
          noisePhase,
          noiseScaleMultiplier,
          directionalBasis,
          layer.amount,
          layer.layerSeed,
        );
        totalDx += noiseOffset.dx;
        totalDy += noiseOffset.dy;
      }
      point = {
        x: point.x + totalDx,
        y: point.y + totalDy,
      };
    }

    points.push(point);
  }

  let endTime = initialTime;
  for (let i = 0; i < layerTimeCursors.length; i += 1) {
    if (layerTimeCursors[i] > endTime) {
      endTime = layerTimeCursors[i];
    }
  }

  return {
    points,
    endTime,
    templateIndex,
  };
}

// =========================
// 6) Curve Smoothing
// =========================
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
// 8) Branch and BranchGarden Classes
// =========================
class Branch {
  constructor(seedX, seedY, direction = -1, options = {}) {
    this.id = null;
    this.parentId = Number.isFinite(options.parentId) ? options.parentId : null;
    this.depth = Number.isFinite(options.depth) ? options.depth : 0;
    this.seed = { x: seedX, y: seedY };
    this.direction = direction >= 0 ? 1 : -1;
    this.growthDir = normalize(
      options.growthDir && Number.isFinite(options.growthDir.x) && Number.isFinite(options.growthDir.y)
        ? options.growthDir
        : { x: this.direction, y: -1 },
    );
    this.useDirectionalBasis = options.useDirectionalBasis === true;
    this.baseScale = Number.isFinite(options.baseScale) ? options.baseScale : 1;
    this.stableKey = typeof options.stableKey === 'string'
      ? options.stableKey
      : `branch:${seedX.toFixed(2)}:${seedY.toFixed(2)}:${this.direction}:${this.depth}`;
    this.manualTemplateIndex = Number.isFinite(options.manualTemplateIndex)
      ? Math.max(0, Math.floor(options.manualTemplateIndex))
      : null;
    this.offshootInput = normalizeOffshootInput(options.offshoot);
    this.offshootResolved = null;

    const hasProfileSeed = options.profileSeed !== undefined && options.profileSeed !== null;
    const profileRng = hasProfileSeed ? mulberry32(hashSeed(options.profileSeed)) : null;

    // Per-branch random profile so branches are not translated copies.
    this.noisePhase = {
      x1: (profileRng ? profileRng() : Math.random()) * 5000,
      y1: (profileRng ? profileRng() : Math.random()) * 5000,
      x2: (profileRng ? profileRng() : Math.random()) * 5000,
      y2: (profileRng ? profileRng() : Math.random()) * 5000,
    };
    this.noiseScaleMultiplier = Math.max(0.05, this.baseScale);

    // Also offset starting time per branch to decorrelate trajectories.
    this.timeCursor = hasProfileSeed
      ? (profileRng ? profileRng() : 0) * 10000
      : Date.now() / 1000 + Math.random() * 1000;
    this.timeOrigin = this.timeCursor;

    this.controlPoints = [];
    this.smoothPoints = [];
    this.pathData = null;
  }

  regenerate(options = {}) {
    const { resetTimeCursor = false } = options;
    if (resetTimeCursor && Number.isFinite(this.timeOrigin)) {
      this.timeCursor = this.timeOrigin;
    }

    const branchProfile = {
      noisePhase: this.noisePhase,
      noiseScaleMultiplier: this.noiseScaleMultiplier,
      templateScaleMultiplier: this.baseScale,
      growthDir: this.useDirectionalBasis ? this.growthDir : null,
    };

    let generated;
    if (getPathGenerationMode() === 'manualTemplate') {
      generated = generateTemplateControlPoints(
        this.seed.x,
        this.seed.y,
        this.direction,
        this.timeCursor,
        CONFIG.noise,
        branchProfile,
        this.stableKey,
        this.manualTemplateIndex,
      );
      if (Number.isFinite(generated.templateIndex) && generated.templateIndex >= 0) {
        this.manualTemplateIndex = generated.templateIndex;
      }
    } else {
      generated = generateBranchControlPoints(
        this.seed.x,
        this.seed.y,
        this.direction,
        this.timeCursor,
        CONFIG.noise,
        branchProfile,
      );
    }

    this.timeCursor = generated.endTime;
    this.controlPoints = generated.points;

    this.smoothPoints = buildBSplinePolyline(
      this.controlPoints,
      CONFIG.path.smoothingSubdivisionsPerSpan,
    );

    const pointsForPath = this.smoothPoints.length >= 2 ? this.smoothPoints : this.controlPoints;
    this.pathData = createPathData(pointsForPath);

    return this;
  }
}

class BranchGarden {
  constructor() {
    this.branches = [];
    this.rootBranches = [];
    this.nextBranchId = 1;
    this.rootStableCounter = 1;
  }

  clear() {
    this.branches.length = 0;
    this.rootBranches.length = 0;
    this.nextBranchId = 1;
    this.rootStableCounter = 1;
  }

  createRootBranch(seedX, seedY, direction = -1, options = {}) {
    const stableKey = typeof options.stableKey === 'string' && options.stableKey.length > 0
      ? options.stableKey
      : `root-${this.rootStableCounter++}`;

    const rootGrowthDir = normalize({ x: direction, y: -1 });
    const root = new Branch(seedX, seedY, direction, {
      parentId: null,
      depth: 0,
      growthDir: rootGrowthDir,
      useDirectionalBasis: false,
      baseScale: 1,
      stableKey,
      manualTemplateIndex: Number.isFinite(options.manualTemplateIndex)
        ? options.manualTemplateIndex
        : null,
      offshoot: normalizeOffshootInput(options.offshoot),
    });
    root.regenerate();
    return root;
  }

  resolveOffshootForBranch(branch) {
    const globalConfig = CONFIG.offshoot || {};
    const local = normalizeOffshootInput(branch.offshootInput);

    const enabled = typeof local.enabled === 'boolean'
      ? local.enabled
      : Boolean(globalConfig.enabled);
    const deterministic = typeof local.deterministic === 'boolean'
      ? local.deterministic
      : Boolean(globalConfig.deterministic);

    const rng = deterministic
      ? mulberry32(hashSeed(`${branch.stableKey}|resolve`))
      : Math.random;

    const maxDepthRange = resolveRangeValue(
      local.maxDepthRange,
      local.maxDepth,
      globalConfig.maxDepth,
      0,
      0,
    );
    const countRangeRaw = resolveRangeValue(
      local.countRange,
      undefined,
      globalConfig.countRange,
      0,
      0,
    );
    const biasExponentRange = resolveRangeValue(
      local.biasExponentRange,
      local.biasExponent,
      globalConfig.biasExponent,
      1,
      1,
    );
    const angleDegRangeRaw = resolveRangeValue(
      local.angleDegRange,
      undefined,
      globalConfig.angleDegRange,
      0,
      0,
    );

    const maxDepth = clamp(Math.round(sampleFloatRange(maxDepthRange, rng)), 0, 20);
    const countRange = [
      Math.max(0, Math.floor(countRangeRaw[0])),
      Math.max(0, Math.floor(countRangeRaw[1])),
    ];
    countRange.sort((a, b) => a - b);

    const biasExponent = Math.max(0.01, sampleFloatRange(biasExponentRange, rng));
    const angleDegRange = [
      clamp(Math.min(angleDegRangeRaw[0], angleDegRangeRaw[1]), 0, 89),
      clamp(Math.max(angleDegRangeRaw[0], angleDegRangeRaw[1]), 0, 89),
    ];

    const globalSpawnTMin = Number.isFinite(globalConfig.spawnTMin) ? globalConfig.spawnTMin : 0;
    const globalSpawnTMax = Number.isFinite(globalConfig.spawnTMax) ? globalConfig.spawnTMax : 1;
    const spawnTMinRaw = Number.isFinite(local.spawnTMin) ? local.spawnTMin : globalSpawnTMin;
    const spawnTMaxRaw = Number.isFinite(local.spawnTMax) ? local.spawnTMax : globalSpawnTMax;
    const spawnTMin = clamp(Math.min(spawnTMinRaw, spawnTMaxRaw), 0, 1);
    const spawnTMax = clamp(Math.max(spawnTMinRaw, spawnTMaxRaw), 0, 1);

    const sideMode = sanitizeSideMode(
      typeof local.sideMode === 'string' ? local.sideMode : globalConfig.sideMode,
    );
    const globalDepthScale = Number.isFinite(globalConfig.depthScale) ? globalConfig.depthScale : 1;
    const depthScale = Math.max(
      0.05,
      Number.isFinite(local.depthScale) ? local.depthScale : globalDepthScale,
    );
    const minSpawnSpacingT = clamp(
      Number.isFinite(local.minSpawnSpacingT)
        ? local.minSpawnSpacingT
        : (Number.isFinite(globalConfig.minSpawnSpacingT) ? globalConfig.minSpawnSpacingT : 0),
      0,
      1,
    );
    const maxSpawnAttemptsPerChild = Math.max(
      1,
      Math.floor(
        Number.isFinite(local.maxSpawnAttemptsPerChild)
          ? local.maxSpawnAttemptsPerChild
          : (Number.isFinite(globalConfig.maxSpawnAttemptsPerChild) ? globalConfig.maxSpawnAttemptsPerChild : 8),
      ),
    );

    return {
      enabled,
      deterministic,
      maxDepth,
      countRange,
      childCount: sampleIntRange(countRange, rng),
      spawnTMin,
      spawnTMax,
      biasExponent,
      angleDegRange,
      sideMode,
      depthScale,
      minSpawnSpacingT,
      maxSpawnAttemptsPerChild,
    };
  }

  sampleSpawnTs(parent, resolved, targetCount, rng) {
    const out = [];
    const span = resolved.spawnTMax - resolved.spawnTMin;
    for (let i = 0; i < targetCount; i += 1) {
      let accepted = null;
      for (let attempt = 0; attempt < resolved.maxSpawnAttemptsPerChild; attempt += 1) {
        const u = clamp(rng(), 0, 1);
        const biased = 1 - Math.pow(1 - u, resolved.biasExponent);
        const t = span > 1e-8 ? resolved.spawnTMin + span * biased : resolved.spawnTMin;

        let isFarEnough = true;
        for (let k = 0; k < out.length; k += 1) {
          if (Math.abs(out[k] - t) < resolved.minSpawnSpacingT) {
            isFarEnough = false;
            break;
          }
        }

        if (isFarEnough) {
          accepted = t;
          break;
        }
      }
      if (accepted !== null) {
        out.push(accepted);
      }
    }

    out.sort((a, b) => a - b);
    return out;
  }

  createOffshootBranches(parent, remainingCapacity) {
    if (!parent.pathData || remainingCapacity <= 0) {
      return [];
    }

    const resolved = parent.offshootResolved || this.resolveOffshootForBranch(parent);
    if (!resolved.enabled || parent.depth >= resolved.maxDepth || resolved.childCount <= 0) {
      return [];
    }

    const targetCount = Math.min(resolved.childCount, remainingCapacity);
    const rng = resolved.deterministic
      ? mulberry32(hashSeed(`${parent.stableKey}|spawn`))
      : Math.random;
    const spawnTs = this.sampleSpawnTs(parent, resolved, targetCount, rng);

    const children = [];
    for (let i = 0; i < spawnTs.length; i += 1) {
      const t = spawnTs[i];
      const distance = t * parent.pathData.totalLength;
      const anchor = getPathPointAtLength(parent.pathData, distance);
      const tangent = normalize(getPathTangentAtLength(parent.pathData, distance));
      const sideSign = getSideSign(resolved.sideMode, i, rng);
      const angleDeg = sampleFloatRange(resolved.angleDegRange, rng);
      const angleRad = (angleDeg * Math.PI / 180) * sideSign;
      const growthDir = normalize(rotateVector(tangent, angleRad));

      const childStableKey = `${parent.stableKey}|child:${i}`;
      const child = new Branch(anchor.x, anchor.y, sideSign, {
        parentId: parent.id,
        depth: parent.depth + 1,
        growthDir,
        useDirectionalBasis: true,
        baseScale: Math.max(0.05, parent.baseScale * resolved.depthScale),
        stableKey: childStableKey,
        offshoot: parent.offshootInput,
        profileSeed: `${childStableKey}|profile`,
      }).regenerate();

      child.offshootResolved = this.resolveOffshootForBranch(child);
      children.push(child);
    }

    return children;
  }

  rebuildBranches(options = {}) {
    const { regenerateRoots = false, resetRootTimeCursor = false } = options;
    this.branches.length = 0;
    this.nextBranchId = 1;

    const maxTotal = Math.max(
      1,
      Math.floor(
        Number.isFinite(CONFIG.offshoot.maxTotalBranches)
          ? CONFIG.offshoot.maxTotalBranches
          : 500,
      ),
    );

    const queue = [];
    for (let i = 0; i < this.rootBranches.length && this.branches.length < maxTotal; i += 1) {
      const root = this.rootBranches[i];
      if (regenerateRoots) {
        root.regenerate({ resetTimeCursor: resetRootTimeCursor });
      }
      root.id = this.nextBranchId++;
      root.parentId = null;
      root.depth = 0;
      root.offshootResolved = this.resolveOffshootForBranch(root);
      this.branches.push(root);
      queue.push(root);
    }

    while (queue.length > 0 && this.branches.length < maxTotal) {
      const parent = queue.shift();
      const remainingCapacity = maxTotal - this.branches.length;
      if (remainingCapacity <= 0) {
        break;
      }

      const children = this.createOffshootBranches(parent, remainingCapacity);
      for (let i = 0; i < children.length && this.branches.length < maxTotal; i += 1) {
        const child = children[i];
        child.id = this.nextBranchId++;
        child.parentId = parent.id;
        this.branches.push(child);
        queue.push(child);
      }
    }

    return this.branches;
  }

  addBranch(seedX, seedY, direction = -1, options = {}) {
    if (!Number.isFinite(seedX) || !Number.isFinite(seedY)) {
      return null;
    }

    const normalized = normalizeAddBranchOptions(options);
    const root = this.createRootBranch(seedX, seedY, direction, normalized);
    this.rootBranches.push(root);
    this.rebuildBranches();
    return root;
  }

  addBranches(branchDefs) {
    if (!Array.isArray(branchDefs)) {
      return [];
    }

    const added = [];
    for (let i = 0; i < branchDefs.length; i += 1) {
      const def = branchDefs[i];
      if (!def || !Number.isFinite(def.x) || !Number.isFinite(def.y)) {
        continue;
      }

      const direction = Number.isFinite(def.direction) ? def.direction : -1;
      const root = this.createRootBranch(def.x, def.y, direction, {
        offshoot: normalizeOffshootInput(def.offshoot),
        stableKey: typeof def.stableKey === 'string' ? def.stableKey : undefined,
        manualTemplateIndex: Number.isFinite(def.manualTemplateIndex) ? def.manualTemplateIndex : null,
      });
      this.rootBranches.push(root);
      added.push(root);
    }

    if (added.length > 0) {
      this.rebuildBranches();
    }

    return added;
  }

  plantSeeds(seedPacket, options = {}) {
    const { clearFirst = true } = options;
    if (clearFirst) {
      this.clear();
    }

    const packet = seedPacket || setSeeds();
    const seedsLeft = Array.isArray(packet.seedsLeft) ? packet.seedsLeft : [];
    const seedsRight = Array.isArray(packet.seedsRight) ? packet.seedsRight : [];

    const branchDefs = [];
    for (let i = 0; i < seedsLeft.length; i += 1) {
      const def = seedsLeft[i];
      if (!def || !Number.isFinite(def.x) || !Number.isFinite(def.y)) {
        continue;
      }
      branchDefs.push({
        x: def.x,
        y: def.y,
        direction: Number.isFinite(def.direction) ? def.direction : 1,
        offshoot: normalizeOffshootInput(def.offshoot),
        stableKey: typeof def.stableKey === 'string' ? def.stableKey : undefined,
        manualTemplateIndex: Number.isFinite(def.manualTemplateIndex) ? def.manualTemplateIndex : null,
      });
    }

    for (let i = 0; i < seedsRight.length; i += 1) {
      const def = seedsRight[i];
      if (!def || !Number.isFinite(def.x) || !Number.isFinite(def.y)) {
        continue;
      }
      branchDefs.push({
        x: def.x,
        y: def.y,
        direction: Number.isFinite(def.direction) ? def.direction : -1,
        offshoot: normalizeOffshootInput(def.offshoot),
        stableKey: typeof def.stableKey === 'string' ? def.stableKey : undefined,
        manualTemplateIndex: Number.isFinite(def.manualTemplateIndex) ? def.manualTemplateIndex : null,
      });
    }

    return this.addBranches(branchDefs);
  }

  regenerateAll() {
    this.rebuildBranches({ regenerateRoots: true });
  }
}

// =========================
// 9) Seed Helpers
// =========================
function setSeeds() {
  const seedsLeft = [];
  const seedsRight = [];

  for (let i = 0; i < CONFIG.seeds.countPerSide; i += 1) {
    // Left side branches grow rightward (direction +1).
    seedsLeft.push({
      x: 0 - CONFIG.seeds.sidePad - Math.random() * CONFIG.seeds.sideMargin,
      y: Math.random() * STATE.viewportHeight + 100,
      direction: 1,
    });

    // Right side branches grow leftward (direction -1).
    seedsRight.push({
      x: STATE.viewportWidth + CONFIG.seeds.sidePad + Math.random() * CONFIG.seeds.sideMargin,
      y: Math.random() * STATE.viewportHeight + 100,
      direction: -1,
    });
  }

  return { seedsLeft, seedsRight };
}

function plantSeeds(seedPacket, options = {}) {
  if (!STATE.branchGarden) {
    return [];
  }
  return STATE.branchGarden.plantSeeds(seedPacket, options);
}

// =========================
// 10) Texture Loading
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
    return await loadImage('./stem_2.5.png');
  } catch (error) {
    console.warn(error.message + ' | Falling back to generated stem texture.');
    return createFallbackStemTexture();
  }
}

// =========================
// 11) Draw Helpers
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

function drawBrushAlongPath(pathData, image, brushConfig, debugConfig) {
  const stripCenters = [];
  if (!pathData || !image) {
    return stripCenters;
  }

  const brushScale = getBrushScale(brushConfig);
  const stripLength = Math.max(0.1, brushConfig.stripWidth);
  const stripStep = Math.max(0.1, stripLength - brushConfig.repeatOverlap);
  const widthOnPath = image.width * brushScale;
  const tileDrawLength = image.height * brushScale;
  const tileStep = Math.max(stripLength * 0.5, tileDrawLength + brushConfig.repeatGap);

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

    for (let localAlongPath = localStart; localAlongPath < localEnd; localAlongPath += stripStep) {
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
// 12) Scene Render
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

function renderBranch(branch) {
  if (!branch.pathData) {
    return;
  }

  const stripCenters = drawBrushAlongPath(
    branch.pathData,
    STATE.stemImage,
    CONFIG.brush,
    CONFIG.debug,
  );

  if (CONFIG.debug.enabled && CONFIG.debug.showPathOutline) {
    drawPathOutline(branch.pathData);
  }

  if (CONFIG.debug.enabled && (CONFIG.debug.showTangents || CONFIG.debug.showNormals)) {
    drawPathVectors(branch.pathData);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showStripCenters) {
    drawStripCenters(stripCenters);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlPoints) {
    drawControlPoints(branch.controlPoints);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlCurve) {
    drawControlCurve(branch.controlPoints);
  }
}

function renderScene() {
  if (!STATE.branchGarden || !STATE.stemImage) {
    return;
  }

  ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  drawBackground();

  for (let i = 0; i < STATE.branchGarden.branches.length; i += 1) {
    renderBranch(STATE.branchGarden.branches[i]);
  }
}

// =========================
// 13) Events
// =========================
function onResize() {
  // Keep existing branches; do not regenerate on zoom/resize.
  resizeCanvasToViewport();
  renderScene();
}

function onKeydown(event) {
  const key = event.key.toLowerCase();

  if (key === 'r') {
    // New random seed layout.
    STATE.lastSeedPacket = setSeeds();
    plantSeeds(STATE.lastSeedPacket, { clearFirst: true });
    renderScene();
  }

  if (key === 'g' && STATE.branchGarden) {
    // Regenerate current branches from their existing seeds.
    STATE.branchGarden.regenerateAll();
    renderScene();
  }

  if (key === 'm' && STATE.branchGarden) {
    const nextMode = getPathGenerationMode() === 'random'
      ? 'manualTemplate'
      : 'random';
    applyPathGenerationOptions({ mode: nextMode });
  }
}

function setupEventHandlers() {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
}

// =========================
// 14) Public API
// =========================
function applyOffshootOptions(nextOptions) {
  if (!nextOptions || typeof nextOptions !== 'object') {
    return;
  }
  Object.assign(CONFIG.offshoot, nextOptions);
  if (STATE.branchGarden) {
    STATE.branchGarden.rebuildBranches();
  }
  renderScene();
}

function applyPathGenerationOptions(nextOptions) {
  if (!nextOptions || typeof nextOptions !== 'object') {
    return;
  }
  Object.assign(CONFIG.pathGeneration, nextOptions);
  if (STATE.branchGarden) {
    STATE.branchGarden.rebuildBranches({ regenerateRoots: true, resetRootTimeCursor: true });
  }
  renderScene();
}

function formatOffshootValue(value, digits = 3) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => formatOffshootValue(entry, digits)).join(', ')}]`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    if (Math.abs(value - Math.round(value)) < 1e-8) {
      return String(Math.round(value));
    }
    return value.toFixed(digits).replace(/\.?0+$/, '');
  }
  return String(value);
}

function injectOffshootControlStyles() {
  if (document.getElementById('offshoot-controls-style')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'offshoot-controls-style';
  style.textContent = `
    #offshoot-controls {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 40;
      width: min(430px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      overflow: auto;
      background: rgba(8, 14, 16, 0.88);
      border: 1px solid rgba(150, 208, 172, 0.35);
      border-radius: 10px;
      padding: 10px;
      color: #d9f8e8;
      font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
      backdrop-filter: blur(2px);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
    }

    #offshoot-controls h2 {
      margin: 0 0 8px;
      font-size: 12px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #9dd8ba;
    }

    #offshoot-controls .offshoot-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr auto;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }

    #offshoot-controls .offshoot-range-row {
      grid-template-columns: 1.2fr 1fr auto auto;
    }

    #offshoot-controls .offshoot-key {
      color: #bff2d6;
      word-break: break-word;
    }

    #offshoot-controls .offshoot-value {
      color: #f5fff9;
      text-align: right;
      padding-right: 2px;
    }

    #offshoot-controls .offshoot-actions {
      display: flex;
      gap: 4px;
    }

    #offshoot-controls button {
      border: 1px solid rgba(157, 216, 186, 0.35);
      background: rgba(26, 44, 39, 0.85);
      color: #eafff3;
      border-radius: 5px;
      padding: 2px 6px;
      font: inherit;
      cursor: pointer;
    }

    #offshoot-controls button:hover {
      background: rgba(49, 79, 70, 0.95);
    }

    #offshoot-controls .offshoot-mini {
      min-width: 36px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function createOffshootControls() {
  if (!document.body || document.getElementById('offshoot-controls')) {
    return;
  }

  injectOffshootControlStyles();

  const descriptors = [
    { key: 'enabled', type: 'toggle' },
    { key: 'deterministic', type: 'toggle' },
    { key: 'maxDepth', type: 'number', step: 1, min: 0, max: 20, integer: true },
    { key: 'countRange', type: 'range', step: 1, min: 0, max: 50, integer: true },
    { key: 'spawnTMin', type: 'number', step: 0.02, min: 0, max: 1 },
    { key: 'spawnTMax', type: 'number', step: 0.02, min: 0, max: 1 },
    { key: 'biasExponent', type: 'number', step: 0.2, min: 0.01, max: 8 },
    { key: 'angleDegRange', type: 'range', step: 1, min: 0, max: 89, integer: true },
    { key: 'sideMode', type: 'enum', values: ['random', 'left', 'right', 'alternate'] },
    { key: 'depthScale', type: 'number', step: 0.05, min: 0.05, max: 2 },
    { key: 'minSpawnSpacingT', type: 'number', step: 0.01, min: 0, max: 1 },
    { key: 'maxSpawnAttemptsPerChild', type: 'number', step: 1, min: 1, max: 100, integer: true },
    { key: 'maxTotalBranches', type: 'number', step: 10, min: 1, max: 5000, integer: true },
  ];

  const panel = document.createElement('section');
  panel.id = 'offshoot-controls';

  const title = document.createElement('h2');
  title.textContent = 'Offshoot Controls';
  panel.appendChild(title);

  const valueNodes = {};

  function getDescriptor(key) {
    for (let i = 0; i < descriptors.length; i += 1) {
      if (descriptors[i].key === key) {
        return descriptors[i];
      }
    }
    return null;
  }

  function readNumberValue(key, fallback = 0) {
    const value = Number(CONFIG.offshoot[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function normalizeNumber(descriptor, value) {
    let next = clamp(value, descriptor.min, descriptor.max);
    if (descriptor.integer) {
      next = Math.round(next);
    }
    return next;
  }

  function getRangeValue(descriptor) {
    const fallback = [descriptor.min, descriptor.max];
    const raw = Array.isArray(CONFIG.offshoot[descriptor.key]) ? CONFIG.offshoot[descriptor.key] : fallback;
    const a = normalizeNumber(descriptor, Number(raw[0]));
    const b = normalizeNumber(descriptor, Number(raw[1]));
    return a <= b ? [a, b] : [b, a];
  }

  function refreshValues() {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      if (!valueNodes[descriptor.key]) {
        continue;
      }
      valueNodes[descriptor.key].textContent = formatOffshootValue(CONFIG.offshoot[descriptor.key], 3);
    }
  }

  function setOffshootPatch(patch) {
    applyOffshootOptions(patch);
    refreshValues();
  }

  function adjustScalar(descriptor, directionSign, stepMultiplier = 1) {
    const current = readNumberValue(descriptor.key, descriptor.min);
    let next = current + descriptor.step * directionSign * stepMultiplier;
    next = normalizeNumber(descriptor, next);

    if (descriptor.key === 'spawnTMin') {
      const currentMax = readNumberValue('spawnTMax', 1);
      if (next > currentMax) {
        setOffshootPatch({ spawnTMin: next, spawnTMax: next });
        return;
      }
    }

    if (descriptor.key === 'spawnTMax') {
      const currentMin = readNumberValue('spawnTMin', 0);
      if (next < currentMin) {
        setOffshootPatch({ spawnTMin: next, spawnTMax: next });
        return;
      }
    }

    setOffshootPatch({ [descriptor.key]: next });
  }

  function adjustRange(descriptor, index, directionSign, stepMultiplier = 1) {
    const range = getRangeValue(descriptor);
    range[index] = normalizeNumber(
      descriptor,
      range[index] + descriptor.step * directionSign * stepMultiplier,
    );
    if (range[0] > range[1]) {
      if (index === 0) {
        range[1] = range[0];
      } else {
        range[0] = range[1];
      }
    }
    setOffshootPatch({ [descriptor.key]: range });
  }

  function cycleEnum(descriptor) {
    const values = descriptor.values || [];
    if (values.length === 0) {
      return;
    }
    const current = String(CONFIG.offshoot[descriptor.key]);
    const index = values.indexOf(current);
    const nextIndex = index >= 0 ? (index + 1) % values.length : 0;
    setOffshootPatch({ [descriptor.key]: values[nextIndex] });
  }

  for (let i = 0; i < descriptors.length; i += 1) {
    const descriptor = descriptors[i];
    const row = document.createElement('div');
    row.className = 'offshoot-row';
    if (descriptor.type === 'range') {
      row.classList.add('offshoot-range-row');
    }

    const keyEl = document.createElement('div');
    keyEl.className = 'offshoot-key';
    keyEl.textContent = descriptor.key;

    const valueEl = document.createElement('div');
    valueEl.className = 'offshoot-value';
    valueNodes[descriptor.key] = valueEl;

    const actions = document.createElement('div');
    actions.className = 'offshoot-actions';

    if (descriptor.type === 'toggle') {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = 'toggle';
      toggleBtn.addEventListener('click', () => {
        setOffshootPatch({ [descriptor.key]: !Boolean(CONFIG.offshoot[descriptor.key]) });
      });
      actions.appendChild(toggleBtn);
    } else if (descriptor.type === 'enum') {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'next';
      nextBtn.addEventListener('click', () => cycleEnum(descriptor));
      actions.appendChild(nextBtn);
    } else if (descriptor.type === 'range') {
      const minActions = document.createElement('div');
      minActions.className = 'offshoot-actions';
      const minMinus = document.createElement('button');
      minMinus.className = 'offshoot-mini';
      minMinus.textContent = 'min-';
      minMinus.addEventListener('click', (event) => {
        adjustRange(descriptor, 0, -1, getModifierStepMultiplier(event));
      });
      const minPlus = document.createElement('button');
      minPlus.className = 'offshoot-mini';
      minPlus.textContent = 'min+';
      minPlus.addEventListener('click', (event) => {
        adjustRange(descriptor, 0, 1, getModifierStepMultiplier(event));
      });
      minActions.append(minMinus, minPlus);

      const maxActions = document.createElement('div');
      maxActions.className = 'offshoot-actions';
      const maxMinus = document.createElement('button');
      maxMinus.className = 'offshoot-mini';
      maxMinus.textContent = 'max-';
      maxMinus.addEventListener('click', (event) => {
        adjustRange(descriptor, 1, -1, getModifierStepMultiplier(event));
      });
      const maxPlus = document.createElement('button');
      maxPlus.className = 'offshoot-mini';
      maxPlus.textContent = 'max+';
      maxPlus.addEventListener('click', (event) => {
        adjustRange(descriptor, 1, 1, getModifierStepMultiplier(event));
      });
      maxActions.append(maxMinus, maxPlus);

      row.append(keyEl, valueEl, minActions, maxActions);
      panel.appendChild(row);
      continue;
    } else {
      const minusBtn = document.createElement('button');
      minusBtn.className = 'offshoot-mini';
      minusBtn.textContent = '-';
      minusBtn.addEventListener('click', (event) => {
        adjustScalar(descriptor, -1, getModifierStepMultiplier(event));
      });
      const plusBtn = document.createElement('button');
      plusBtn.className = 'offshoot-mini';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', (event) => {
        adjustScalar(descriptor, 1, getModifierStepMultiplier(event));
      });
      actions.append(minusBtn, plusBtn);
    }

    row.append(keyEl, valueEl, actions);
    panel.appendChild(row);
  }

  const footerActions = document.createElement('div');
  footerActions.className = 'offshoot-actions';
  footerActions.style.justifyContent = 'flex-end';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'defaults';
  const offshootDefaults = JSON.parse(JSON.stringify(CONFIG.offshoot));
  resetBtn.addEventListener('click', () => {
    setOffshootPatch({ ...offshootDefaults });
  });

  footerActions.appendChild(resetBtn);
  panel.appendChild(footerActions);

  document.body.appendChild(panel);
  refreshValues();
}

function injectPathGenerationControlStyles() {
  if (document.getElementById('path-generation-controls-style')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'path-generation-controls-style';
  style.textContent = `
    #path-generation-controls {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 40;
      width: min(430px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      overflow: auto;
      background: rgba(8, 14, 16, 0.88);
      border: 1px solid rgba(147, 200, 255, 0.35);
      border-radius: 10px;
      padding: 10px;
      color: #e5f4ff;
      font: 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace;
      backdrop-filter: blur(2px);
      box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
    }

    #path-generation-controls h2 {
      margin: 0 0 8px;
      font-size: 12px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #99c6eb;
    }

    #path-generation-controls .pathgen-row {
      display: grid;
      grid-template-columns: 1.2fr 1fr auto;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }

    #path-generation-controls .pathgen-key {
      color: #bddfff;
      word-break: break-word;
    }

    #path-generation-controls .pathgen-value {
      color: #f5fbff;
      text-align: right;
      padding-right: 2px;
    }

    #path-generation-controls .pathgen-input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(153, 198, 235, 0.35);
      background: rgba(18, 27, 38, 0.9);
      color: #f5fbff;
      border-radius: 5px;
      padding: 3px 6px;
      font: inherit;
    }

    #path-generation-controls .pathgen-input:focus {
      outline: none;
      border-color: rgba(180, 220, 255, 0.9);
      box-shadow: 0 0 0 1px rgba(180, 220, 255, 0.35);
    }

    #path-generation-controls .pathgen-input.pathgen-input-invalid {
      border-color: rgba(255, 120, 120, 0.9);
      box-shadow: 0 0 0 1px rgba(255, 120, 120, 0.25);
    }

    #path-generation-controls .pathgen-actions {
      display: flex;
      gap: 4px;
    }

    #path-generation-controls button {
      border: 1px solid rgba(153, 198, 235, 0.35);
      background: rgba(26, 38, 52, 0.85);
      color: #f5fbff;
      border-radius: 5px;
      padding: 2px 6px;
      font: inherit;
      cursor: pointer;
    }

    #path-generation-controls button:hover {
      background: rgba(52, 74, 96, 0.95);
    }

    #path-generation-controls .pathgen-mini {
      min-width: 36px;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function createPathGenerationControls() {
  if (!document.body || document.getElementById('path-generation-controls')) {
    return;
  }

  injectPathGenerationControlStyles();

  const descriptors = [
    { key: 'mode', type: 'enum', values: ['random', 'manualTemplate'] },
    { key: 'templateScale', type: 'number', step: 0.05, min: 0, max: 10 },
    { key: 'templateNoiseAmount', type: 'number', step: 5, min: 0, max: 2000 },
    { key: 'templateNoiseStep', type: 'number', step: 0.0001, min: 0.000001, max: 2 },
    { key: 'templateNoiseAmount2', type: 'number', step: 5, min: 0, max: 2000 },
    { key: 'templateNoiseStep2', type: 'number', step: 0.0001, min: 0.000001, max: 2 },
    { key: 'alignTemplateToGrowth', type: 'toggle' },
    { key: 'templatePickMode', type: 'enum', values: ['random', 'fixed'] },
    { key: 'templatePickDeterministic', type: 'toggle' },
    { key: 'fixedTemplateIndex', type: 'number', step: 1, min: 0, max: 999, integer: true },
    { key: 'manualTemplatesCount', type: 'readonly' },
  ];

  const panel = document.createElement('section');
  panel.id = 'path-generation-controls';

  const title = document.createElement('h2');
  title.textContent = 'Path Generation';
  panel.appendChild(title);

  const valueNodes = {};
  const inputNodes = {};

  function getTemplateCount() {
    return getSanitizedManualTemplates().length;
  }

  function getDescriptorMax(descriptor) {
    if (descriptor.key === 'fixedTemplateIndex') {
      return Math.max(0, getTemplateCount() - 1);
    }
    return descriptor.max;
  }

  function normalizeNumber(descriptor, value) {
    const descriptorMax = getDescriptorMax(descriptor);
    const maxValue = Number.isFinite(descriptorMax) ? descriptorMax : descriptor.max;
    let next = clamp(value, descriptor.min, maxValue);
    if (descriptor.integer) {
      next = Math.round(next);
    }
    return next;
  }

  function readNumberValue(key, fallback = 0) {
    const value = Number(CONFIG.pathGeneration[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function readDescriptorValue(descriptor) {
    if (descriptor.type === 'readonly' && descriptor.key === 'manualTemplatesCount') {
      return getTemplateCount();
    }
    return CONFIG.pathGeneration[descriptor.key];
  }

  function formatDescriptorValue(descriptor, value) {
    if (descriptor.type === 'number') {
      return formatOffshootValue(value, 6);
    }
    if (descriptor.type === 'toggle') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }

  function parseToggleValue(raw) {
    const text = raw.trim().toLowerCase();
    if (text === 'true' || text === '1' || text === 'yes' || text === 'on') {
      return true;
    }
    if (text === 'false' || text === '0' || text === 'no' || text === 'off') {
      return false;
    }
    return null;
  }

  function parseDescriptorInput(descriptor, raw) {
    const text = raw.trim();
    if (descriptor.type === 'number') {
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        return { ok: false, value: null };
      }
      return { ok: true, value: normalizeNumber(descriptor, parsed) };
    }
    if (descriptor.type === 'toggle') {
      const parsed = parseToggleValue(text);
      if (parsed === null) {
        return { ok: false, value: null };
      }
      return { ok: true, value: parsed };
    }
    if (descriptor.type === 'enum') {
      const values = descriptor.values || [];
      if (values.includes(text)) {
        return { ok: true, value: text };
      }
      const lower = text.toLowerCase();
      for (let i = 0; i < values.length; i += 1) {
        if (String(values[i]).toLowerCase() === lower) {
          return { ok: true, value: values[i] };
        }
      }
      return { ok: false, value: null };
    }
    return { ok: false, value: null };
  }

  function areSameValue(a, b) {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) < 1e-10;
    }
    return a === b;
  }

  function commitInputValue(descriptor, inputEl) {
    const parsed = parseDescriptorInput(descriptor, inputEl.value);
    if (!parsed.ok) {
      inputEl.classList.add('pathgen-input-invalid');
      return;
    }

    inputEl.classList.remove('pathgen-input-invalid');
    const currentValue = readDescriptorValue(descriptor);
    if (areSameValue(currentValue, parsed.value)) {
      refreshValues();
      return;
    }

    setPathGenerationPatch({ [descriptor.key]: parsed.value });
  }

  function refreshValues() {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      const value = readDescriptorValue(descriptor);

      const valueNode = valueNodes[descriptor.key];
      if (valueNode) {
        valueNode.textContent = formatDescriptorValue(descriptor, value);
      }

      const inputNode = inputNodes[descriptor.key];
      if (inputNode && document.activeElement !== inputNode) {
        inputNode.value = formatDescriptorValue(descriptor, value);
        inputNode.classList.remove('pathgen-input-invalid');
      }
    }
  }

  function setPathGenerationPatch(patch) {
    applyPathGenerationOptions(patch);
    refreshValues();
  }

  function adjustScalar(descriptor, directionSign, stepMultiplier = 1) {
    const fallback = Number.isFinite(descriptor.min) ? descriptor.min : 0;
    const current = readNumberValue(descriptor.key, fallback);
    let next = current + descriptor.step * directionSign * stepMultiplier;
    next = normalizeNumber(descriptor, next);
    setPathGenerationPatch({ [descriptor.key]: next });
  }

  function cycleEnum(descriptor) {
    const values = descriptor.values || [];
    if (values.length === 0) {
      return;
    }
    const current = String(CONFIG.pathGeneration[descriptor.key]);
    const index = values.indexOf(current);
    const nextIndex = index >= 0 ? (index + 1) % values.length : 0;
    setPathGenerationPatch({ [descriptor.key]: values[nextIndex] });
  }

  for (let i = 0; i < descriptors.length; i += 1) {
    const descriptor = descriptors[i];
    const row = document.createElement('div');
    row.className = 'pathgen-row';

    const keyEl = document.createElement('div');
    keyEl.className = 'pathgen-key';
    keyEl.textContent = descriptor.key;

    let valueCell;
    if (descriptor.type === 'readonly') {
      const valueEl = document.createElement('div');
      valueEl.className = 'pathgen-value';
      valueNodes[descriptor.key] = valueEl;
      valueCell = valueEl;
    } else {
      const inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.className = 'pathgen-input';
      inputNodes[descriptor.key] = inputEl;
      inputEl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          commitInputValue(descriptor, inputEl);
          inputEl.blur();
        } else if (event.key === 'Escape') {
          refreshValues();
          inputEl.blur();
        }
      });
      inputEl.addEventListener('blur', () => {
        commitInputValue(descriptor, inputEl);
      });
      valueCell = inputEl;
    }

    const actions = document.createElement('div');
    actions.className = 'pathgen-actions';

    if (descriptor.type === 'toggle') {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = 'toggle';
      toggleBtn.addEventListener('click', () => {
        setPathGenerationPatch({ [descriptor.key]: !Boolean(CONFIG.pathGeneration[descriptor.key]) });
      });
      actions.appendChild(toggleBtn);
    } else if (descriptor.type === 'enum') {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'next';
      nextBtn.addEventListener('click', () => cycleEnum(descriptor));
      actions.appendChild(nextBtn);
    } else if (descriptor.type === 'number') {
      const minusBtn = document.createElement('button');
      minusBtn.className = 'pathgen-mini';
      minusBtn.textContent = '-';
      minusBtn.addEventListener('click', (event) => {
        adjustScalar(descriptor, -1, getModifierStepMultiplier(event));
      });
      const plusBtn = document.createElement('button');
      plusBtn.className = 'pathgen-mini';
      plusBtn.textContent = '+';
      plusBtn.addEventListener('click', (event) => {
        adjustScalar(descriptor, 1, getModifierStepMultiplier(event));
      });
      actions.append(minusBtn, plusBtn);
    } else {
      const readonlyTag = document.createElement('div');
      readonlyTag.textContent = 'read-only';
      actions.appendChild(readonlyTag);
    }

    row.append(keyEl, valueCell, actions);
    panel.appendChild(row);
  }

  const footerActions = document.createElement('div');
  footerActions.className = 'pathgen-actions';
  footerActions.style.justifyContent = 'flex-end';

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'defaults';
  const pathGenerationDefaults = JSON.parse(JSON.stringify(CONFIG.pathGeneration));
  resetBtn.addEventListener('click', () => {
    setPathGenerationPatch({ ...pathGenerationDefaults });
  });

  footerActions.appendChild(resetBtn);
  panel.appendChild(footerActions);

  document.body.appendChild(panel);
  refreshValues();
}

function exposeDevToolsApi() {
  window.stemWarpDemo10 = {
    config: CONFIG,

    setSeeds,

    plantSeeds(seedPacket, options = {}) {
      const branches = plantSeeds(seedPacket, options);
      renderScene();
      return branches;
    },

    addBranch(seedX, seedY, direction = -1, offshootOrOptions = {}) {
      if (!STATE.branchGarden) {
        return null;
      }
      const branch = STATE.branchGarden.addBranch(
        seedX,
        seedY,
        direction,
        normalizeAddBranchOptions(offshootOrOptions),
      );
      renderScene();
      return branch;
    },

    clearBranches() {
      if (!STATE.branchGarden) {
        return;
      }
      STATE.branchGarden.clear();
      renderScene();
    },

    regenerateBranches() {
      if (!STATE.branchGarden) {
        return;
      }
      STATE.branchGarden.regenerateAll();
      renderScene();
    },

    getBranches() {
      return STATE.branchGarden ? STATE.branchGarden.branches : [];
    },

    setBrushOptions(nextOptions) {
      Object.assign(CONFIG.brush, nextOptions);
      renderScene();
    },

    setDebugOptions(nextOptions) {
      Object.assign(CONFIG.debug, nextOptions);
      renderScene();
    },

    setOffshootOptions(nextOptions) {
      applyOffshootOptions(nextOptions);
    },

    setPathGenerationOptions(nextOptions) {
      applyPathGenerationOptions(nextOptions);
    },

    rerender() {
      renderScene();
    },
  };
}

// =========================
// 15) Bootstrap
// =========================
async function bootstrap() {
  resizeCanvasToViewport();

  STATE.stemImage = await loadStemTexture();
  STATE.branchGarden = new BranchGarden();

  // Optional center branch.
  // STATE.branchGarden.addBranch(STATE.viewportWidth * 0.5, STATE.viewportHeight * 0.9, -1);

  // Plant many side branches from seeds.
  STATE.lastSeedPacket = setSeeds();
  plantSeeds(STATE.lastSeedPacket, { clearFirst: false });

  renderScene();
  setupEventHandlers();
  exposeDevToolsApi();
  createPathGenerationControls();
  // createOffshootControls();
}

// =========================
// 16) Run Area
// =========================
window.addEventListener('load', () => {
  bootstrap().catch((error) => {
    console.error('Failed to bootstrap script_10.js', error);
  });
});
