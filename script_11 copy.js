/*
  script_11.js
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
const video = document.createElement('video');

// =========================
// 2) Config
// =========================
let valScaling = 0.01;
const defaultCountPerSide = 6;
const FILTER_CACHE_HUE_STEP_DEG = 2;
const FILTER_CACHE_BRIGHTNESS_STEP = 0.02;


video.src = '/main_vid.webm';
video.controls = false; // Displays play/pause and volume controls
video.width = window.innerWidth;     // Set width in pixels
// video.height = window.innerHeight;   // Set height in pixels

// document.body.appendChild(video);  // Adds it to the page


// // Define your color values
// let h = 205; // Blue hue
// let s = 33;  // 50% saturation
// let l = 59;  // 60% lightness
// let color1 = `hsl(${h}, ${s}%, ${l}%)`;

// h = 208;
// s = 34;
// l = 49; 
// let color2 = `hsl(${h}, ${s}%, ${l}%)`;

// h = 202;
// s = 30;
// l = 42; 
// let color3 = `hsl(${h}, ${s}%, ${l}%)`;


// Define your color values
// let h = 10; // Blue hue
// let s = 10;  // 50% saturation
// let l = 80;  // 60% lightness
// let color1 = `hsl(${h}, ${s}%, ${l}%)`;

// h = 40;
// s = 10;
// l = 80; 
// let color2 = `hsl(${h}, ${s}%, ${l}%)`;

// h = 40;
// s = 10;
// l = 70; 
// let color3 = `hsl(${h}, ${s}%, ${l}%)`;
// let basehue = 40;

// let h = basehue; // Blue hue
// let s = 10;  // 50% saturation
// let l = 90;  // 60% lightness
// let color1 = `hsl(${h}, ${s}%, ${l}%)`;

// h = basehue;
// s = 10;
// l = 80; 
// let color2 = `hsl(${h}, ${s}%, ${l}%)`;

// h = basehue;
// s = 10;
// l = 70; 
// let color3 = `hsl(${h}, ${s}%, ${l}%)`;

// let base_hue = 200;
// let base_sat = 20;
// let base_lit = 60;

// let base_hue = 210;
// let base_sat = 10;
// let base_lit = 60;

// let h = base_hue + 5; // Blue hue
// let s = base_sat + 5;  // 50% saturation
// let l = base_lit + 10;  // 60% lightness
// let color1 = `hsl(${h}, ${s}%, ${l}%)`;

// h = base_hue + 8;
// s = base_sat + 15;
// l = base_lit - 1; 
// let color2 = `hsl(${h}, ${s}%, ${l}%)`;

// h = base_hue + 8;
// s = base_sat + 20;
// l = base_lit - 8; 
// let color3 = `hsl(${h}, ${s}%, ${l}%)`;

let base_hue = 200;
let base_sat = 10;
let base_lit = 90;

let h = base_hue + 5; // Blue hue
let s = base_sat + 5;  // 50% saturation
let l = base_lit + 10;  // 60% lightness

let color1 = `hsl(${h}, ${s}%, ${l}%)`;

h = base_hue + 8;
s = base_sat + 5;
l = base_lit - 1; 
let color2 = `hsl(${h}, ${s}%, ${l}%)`;

h = base_hue + 8;
s = base_sat + 10;
l = base_lit - 8; 
let color3 = `hsl(${h}, ${s}%, ${l}%)`;


// Define your color values
// let h = 220; // Blue hue
// let s = 100;  // 50% saturation
// let l = 50;  // 60% lightness
// let color1 = `hsl(${h}, ${s}%, ${l}%)`;



let gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight );
gradient.addColorStop(0, color1);
gradient.addColorStop(0.5, color2);
gradient.addColorStop(1, color3);


// Apply as a string to the backgroundColor property

const CONFIG = {
  backgroundColor: gradient,

  noise: {
    // stepSize: 2,
    // scale: 2.2,
    // timeStep: 1 / 300,
    // checkpointCount: 20,
    // checkpointSpacingSteps: 2,

    stepSize: 0.1,
    scale: 20,
    timeStep: 1 / 300,
    checkpointCount: 20,
    checkpointSpacingSteps: 2,
  },

  path: {
    smoothingSubdivisionsPerSpan: 10,
  },
 
  pathGeneration: {
    
    mode: 'manualTemplate', // random | manualTemplate
    useAbsoluteNoiseX: false, // if true, X/lateral noise uses abs()
    useAbsoluteNoiseY: false, // if true, Y/forward noise uses abs()
    absoluteNoiseXRatio: 0.4, // when useAbsoluteNoiseX=false, blend signed->absolute by this ratio (0..1)
    absoluteNoiseYRatio: 0.9, // when useAbsoluteNoiseY=false, blend signed->absolute by this ratio (0..1)
    // templateScale: 0.5,
    templateScaleRangeMin: 0.3,
    templateScaleRangeMax: 0.7,
    templateNoiseAmount: 40 * valScaling,
    templateNoiseStep: 1 / 7.5,
    templateNoiseAmount2: 25 * valScaling,
    templateNoiseStep2: 1 / 0.5,
    templateNoiseAmount3: 40 * valScaling,
    templateNoiseStep3: 1 / 3,
    templateNoiseHighpassWindow3: 23,
    templateNoiseDirectionalBias: 0.8,
    templateInheritCheckpointSpacingSteps: true,
    alignTemplateToGrowth: true,
    templatePickMode: 'random', // random | fixed
    templatePickDeterministic: true,
    fixedTemplateIndex: 2,
    // Additional base templates (arrays of {x,y}) besides generate_manual_points().
    manualTemplates: [],
  },

  brush: {
    stripWidth: 0.3,
    scale: 0.28,
    sclale: undefined, // typo compatibility
    thicknessTaperEnabled: true,
    thicknessMinScale: 0.48,
    thicknessTaperExponent: 0.2,
    thicknessMinWidth: 0, // absolute minimum rendered width in px (applied when taper is enabled)
    globalHueDeg: 5,
    globalBrightness: 0.89,
    randomizeBranchFilter: true,
    randomHueMinDeg: 15,
    randomHueMaxDeg: 0,
    randomBrightnessMin: 1.05,
    randomBrightnessMax: 0.9,
    randomFilterVariantCount: 15,
    randomFilterAssignmentMode: 'inheritParent', // perBranch | inheritParent
    pathOffset: 0,
    repeatGap: 0,
    repeatOverlap: 0.13, //usually 0.2
    startOffset: 0,
    cropPartialRepeat: true,
  },

  seeds: {
    countPerSide: defaultCountPerSide,
    sidePad: 2,
    sideMargin: 2,
    startY: window.innerHeight * 0.2, // explicit first-seed Y; null randomizes first seed per side
    randomizeSpacing: true, // if true, per-seed spacing is sampled in [minSpacing, maxSpacing]
    minSpacing: window.innerHeight/ defaultCountPerSide, // minimum vertical distance between seeds on the same side
    // minSpacing: 300,
    maxSpacing: null, // when null + randomizeSpacing=true, an automatic max is derived from minSpacing
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
    enabled: true,
    deterministic: true,
    maxDepth: 1,
    countRange: [0, 10],
    spawnTMin: 0.01,
    spawnTMax: 0.96,
    biasExponent: 1.6,
    angleDegRange: [-90,-91],
    sideMode: 'alternate', // random | left | right | alternate
    depthScale: 0.6,
    minSpawnSpacingT: 0.02,
    maxSpawnAttemptsPerChild: 800,
    maxTotalBranches: 200,
    pathGenerationMode: 'inherit', // inherit | random | manualTemplate
    templateIndexPool: [2], // e.g. [1, 4, 7] => randomly pick one for each offshoot
  },

  animation: {
    enabled: false,
    speedMode: 'rate', // duration | rate
    totalDurationSec: 3,
    pixelsPerSecond: 160,
    autoStart: true,
    useOffscreenLayerCache: true,
  },

  motion: {
    swayMode: 'influence', // always | influence
    maxSwayFps: 24, // <=0 disables cap for interaction-only render loop
    leafViewportCullingEnabled: true,
    flowerViewportCullingEnabled: true,
    swayFastPathEnabled: true,
    swayPerfLogEnabled: false,
  },

  flowers: {
    enabled: true,
    assignmentMode: 'mixed', // single | mixed
    singleType: 'lily',
    mixRatios: {

      lily: 1,
      blue: 1,
    },
    endpointDirectionTailLengthPx: 26,
    endpointDirectionSampleCount: 5,
    drawSize: 80,
    swayInteractionRadiusFactor: 3.1,
    swayRiseSpeed: 5.5,
    swayFallSpeed: 0.5,
    swayEpsilon: 0.0008,
    mouseSpeedSwayAffect: 0.7,
    influenceDynamicCapEnabled: true,
    influenceDynamicCap: 28,
    influenceNoPointerFallBoost: 1.2,
    influenceJumpCountsTowardCap: true,
    alwaysAnimatedCacheEnabled: true,
    alwaysAnimatedCacheFps: 8,
    blueSwayRotateAroundPetalOrigin: false,
    blueJumpRotateAroundPetalOrigin: true,
    swayJumpRotateAroundPetalOrigin: true,
    jumpEnabled: true,
    jumpInteractionRadiusFactor: 1.4,
    jumpStrengthDeg: 15,
    jumpAttackSpeedDegPerSec: 60,
    jumpReturnSpeedDegPerSec: 55,
    jumpDistanceExponent: 1,
    jumpJitterDeg: 30,
    jumpEpsilonDeg: 0.5,
    backfacing: false,
    petalToggleAnimationDurationSec: 0.4,
    petalToggleAnimationEasePower: 1,
    petalToggleOpenBounceAmount: 0.6,
    petalToggleOpenBounceOscillations: 1,
    petalToggleSpriteSwapProgress: 0.97,
    petalToggleEdgePairFlipEnabled: false,
    petalToggleEdgePairFlipBackProgress: 0.67,
    petalToggleEdgePairUseInnerSpritesEnabled: true,
    petalTogglePairSpeedDisparityEnabled: true,
    petalTogglePairSpeedStep: 0.1,
    petalTogglePairSpeedCurve: 0,
    performance: {
      activeLayerCacheEnabled: true,
      logEnabled: false,
      logIntervalMs: 1000,
    },
    types: {
      lily: {
        method: 'sweep3', // legacy | sweep | sweep2 | sweep3
        spritePath: './lily_sprite.png',
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 8,
        spriteRows: 6,
        spriteRow: 1,
        petalCountRange: [8, 8],
        alignToBranchDirection: true,
        alignmentDamping: 0.3,
        petalBaseCenterDeg: 50,
        petalSpreadDeg: 70,
        displacementSpace: 'flower', // flower | screen
        stamenRowMode: 'fixedRow', // petalRow | fixedRow
        stamenFixedRow: 1, // 1-based row
        stamenCount: 2, // total stamens per flower
        stamenAdditionalMode: 'rowList', // randomRows | rowList
        stamenRowList: [2,3,4,5,6,7,8], // 1-based rows used when stamenAdditionalMode='rowList'
        closedUseMiddlePetalSprite: true, // if true, closed lilies use middle petal sprite for every petal
        pairRotationDegByRowPair: {
          1: { 1: 20, 2: 13, 3: 30},
          2: { 1: 15, 2: 10, 3: 48 },
          3: { 1: 15, 2: 20, 3: 60 },
          4: { 1: 10, 2: 10, 3: 45 },
          5: { 1: 10, 2: 15, 3: 30 },
          6: { 1: 20, 2: 10, 3: 70 },
          7: { 1: 0, 2: 0, 3: 0 },
          8: { 1: 0, 2: 0, 3: 0 },
        },
        pairDisplacementYByRowPair: {
          1: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 5 } },
          2: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 10, left: 12 } },
          3: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 2, left: 5 } },
          4: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 4, left: 0 } },
          5: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          6: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 13, left: 10 } },
          7: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          8: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
        },
        pairDisplacementXByRowPair: {
          1: { 1: { right: 0, left: -5 }, 2: { right: 0, left: 0 }, 3: { right: -5, left: -5 } },
          2: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 3 } },
          3: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 6, left: 9 } },
          4: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          5: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          6: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 5, left: 7 } },
          7: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
          8: { 1: { right: 0, left: 0 }, 2: { right: 0, left: 0 }, 3: { right: 0, left: 0 } },
        },
        hoverAmplitudeDegRange: [2, 12],
        hoverSpeedRange: [2.2, 4.2],
      },
      blue: {
        spritePath: './blue_sprite_2_upscaled.png',
        spritePathPool: [
          './blue_sprite_2.png','./blue_sprite_1.png','./blue_sprite_3.png', './blue_sprite.png',
          // './blue_sprite_4.2.png', './blue_sprite_5.png'
        ], // one full sprite sheet is picked per blue flower
        spriteCellWidth: 44,
        spriteCellHeight: 44,
        spriteScale: 8.3333333,
        spriteCols: 10,
        spriteRows: 10,
        baseSize: 60, // circle radius in px for point cloud generation
        density: 130, // fixed number of points per flower
        centerBiasExponent: 1, // larger = stronger center clustering
        pointDrawSize: 40,
        drawOrder: 'random', // outerFirst | random
        hoverAmplitudeDegRange: [2, 6],
        hoverSpeedRange: [2.2, 4.2],
      },
    },
  },

  leaves: {
    enabled: true,
    deterministic: true,
    spritePath: './leaves_new.png',
    spriteCellWidth: 44,
    spriteCellHeight: 45.819,
    spriteScale: 8.3333333,
    spriteCols: 10,
    spriteRows: 8,
    spriteRowRange: [0, 2], // 1-based inclusive [min, max]
    drawSize: 100,
    drawSizeRange: [30,120], // [min, max]; overrides fixed drawSize when provided
    drawSizeBaseMultiplier: 0.1, // 1 at branch base, linearly blends to this value at branch tip
    drawSizeBaseMultiplierEaseIn: 0.1, // 0 = linear; closer to 1 delays size change until near the tip
    swayEnabled: true,
    swayInteractionRadiusFactor: 2.1,
    swayRiseSpeed: 5.5,
    swayFallSpeed: 0.5,
    swayEpsilon: 0.0008,
    mouseSpeedSwayAffect: 0.7,
    swayAmplitudeDegRange: [0.8, 12.6],
    swaySpeedRange: [1.9, 2.8],
    countRange: [2, 10],
    spawnTMin: 0.01,
    spawnTMax: 0.5,
    spawnBiasMode: 'towardBase', // uniform | towardBase | towardTip
    spawnBiasExponent: 4, // >1 strengthens bias
    minSpawnSpacingT: 0.001,
    maxSpawnAttemptsPerLeaf: 1,
    sideMode: 'alternate', // random | left | right | alternate
    rotationAwayFromNormalDegRange: [0,80],
  },

  performance: {
    enabled: true,
    logIntervalMs: 1000,
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
  pointerX: Number.NEGATIVE_INFINITY,
  pointerY: Number.NEGATIVE_INFINITY,
  pointerSpeedPxPerSec: 0,
  pointerLastSampleX: Number.NEGATIVE_INFINITY,
  pointerLastSampleY: Number.NEGATIVE_INFINITY,
  pointerLastSampleMs: 0,

  noiseInstance: null,
  stemImage: null,
  stemImageFlippedX: null,
  leafImage: null,
  flowerSystem: null,
  flowerInteractionRafId: null,
  flowerPerfLastLogMs: 0,

  branchGarden: null,
  branchEndpoints: [],
  lastSeedPacket: null,
  hasBootstrapped: false,

  manualTemplateRegistryLoaded: false,
  manualTemplateRegistryTemplates: [],
  manualTemplateRegistryWarnings: [],

  animation: {
    rafId: null,
    running: false,
    startTimeMs: 0,
    elapsedSec: 0,
    globalRatePxPerSec: 0,
    criticalPathDistance: 0,
  },
  lastInteractionRenderMs: 0,
  nextInteractionFrameDueMs: 0,

  performance: {
    intervalStartMs: 0,
    lastLogMs: 0,
    intervalFrames: 0,
    intervalFrameMs: 0,
    intervalSamples: 0,
    intervalActiveBranches: 0,
    intervalCacheBuilds: 0,
    intervalCacheBuildMs: 0,
    intervalCacheReuses: 0,
    intervalLeafDrawMs: 0,
    intervalStemDrawMs: 0,
    intervalFlowerDrawMs: 0,
    intervalFlowerUpdateMs: 0,
    intervalLeavesDrawn: 0,
    intervalLeavesCulled: 0,
    intervalFlowersDrawn: 0,
    intervalFlowersCulled: 0,
    intervalCacheMissReasons: {
      invalid: 0,
      pathData: 0,
      image: 0,
      brush: 0,
    },
    lastSummary: null,
  },

  filteredStemTextureCache: new WeakMap(),

  completedLayer: {
    canvas: null,
    ctx: null,
    committedBranchIds: new Set(),
    leavesConfigKey: '',
  },
  leafOverlayCache: {
    valid: false,
    layoutKey: '',
    branchCount: 0,
    branchPathRefs: [],
    leaves: [],
  },
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

function normalizeTemplateNoiseHighpassWindow(value, fallback = 7) {
  const fallbackNumeric = Number.isFinite(fallback) ? fallback : 7;
  const numericValue = Number.isFinite(value) ? value : fallbackNumeric;
  let windowSize = Math.round(numericValue);
  windowSize = clamp(windowSize, 3, 51);
  if (windowSize % 2 === 0) {
    windowSize = windowSize + 1 <= 51 ? windowSize + 1 : windowSize - 1;
  }
  return windowSize;
}

function normalizeTemplateNoiseDirectionalBias(value, fallback = 0) {
  const fallbackNumeric = Number.isFinite(fallback) ? fallback : 0;
  const numericValue = Number.isFinite(value) ? value : fallbackNumeric;
  return clamp(numericValue, 0, 1);
}

function resolvePathNoiseAxisAbsFlags(pathGenerationConfig = CONFIG.pathGeneration || {}) {
  const useAbsoluteNoiseX = pathGenerationConfig.useAbsoluteNoiseX !== false;
  const useAbsoluteNoiseY = pathGenerationConfig.useAbsoluteNoiseY !== false;
  const absoluteNoiseXRatio = clamp(
    Number.isFinite(Number(pathGenerationConfig.absoluteNoiseXRatio))
      ? Number(pathGenerationConfig.absoluteNoiseXRatio)
      : 0,
    0,
    1,
  );
  const absoluteNoiseYRatio = clamp(
    Number.isFinite(Number(pathGenerationConfig.absoluteNoiseYRatio))
      ? Number(pathGenerationConfig.absoluteNoiseYRatio)
      : 0,
    0,
    1,
  );
  return {
    useAbsoluteNoiseX,
    useAbsoluteNoiseY,
    absoluteNoiseXRatio,
    absoluteNoiseYRatio,
    xAbsBlend: useAbsoluteNoiseX ? 1 : absoluteNoiseXRatio,
    yAbsBlend: useAbsoluteNoiseY ? 1 : absoluteNoiseYRatio,
  };
}

function blendSignedNoiseWithAbsolute(sample, absoluteBlend = 0) {
  const signed = Number.isFinite(sample) ? sample : 0;
  const blend = clamp(Number.isFinite(absoluteBlend) ? absoluteBlend : 0, 0, 1);
  if (blend <= 0) {
    return signed;
  }
  if (blend >= 1) {
    return Math.abs(signed);
  }
  return signed * (1 - blend) + Math.abs(signed) * blend;
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

function createBranchDefDedupeKey(def) {
  if (!def || !Number.isFinite(def.x) || !Number.isFinite(def.y)) {
    return '';
  }
  const direction = Number.isFinite(def.direction) && def.direction >= 0 ? 1 : -1;
  const x = def.x.toFixed(4);
  const y = def.y.toFixed(4);
  return `${x}|${y}|${direction}`;
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

function sanitizeLeafSpawnBiasMode(value) {
  if (value === 'uniform' || value === 'towardBase' || value === 'towardTip') {
    return value;
  }
  return 'uniform';
}

function sanitizeSwayMode(value) {
  if (value === 'always' || value === 'influence') {
    return value;
  }
  return 'always';
}

function resolveGlobalSwayMode() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  return sanitizeSwayMode(motionConfig.swayMode);
}

function resolveGlobalMaxSwayFps() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  const fps = Number(motionConfig.maxSwayFps);
  if (!Number.isFinite(fps) || fps <= 0) {
    return 0;
  }
  return Math.max(1, fps);
}

function isLeafViewportCullingEnabled() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  return motionConfig.leafViewportCullingEnabled !== false;
}

function isFlowerViewportCullingEnabled() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  return motionConfig.flowerViewportCullingEnabled !== false;
}

function isSwayFastPathEnabled() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  return motionConfig.swayFastPathEnabled !== false;
}

function isSwayPerfLogEnabled() {
  const motionConfig = isPlainObjectLiteral(CONFIG.motion) ? CONFIG.motion : {};
  return motionConfig.swayPerfLogEnabled === true;
}

function getFlowersRuntimeConfig() {
  const flowersConfig = isPlainObjectLiteral(CONFIG.flowers) ? CONFIG.flowers : {};
  return {
    ...flowersConfig,
    swayMode: resolveGlobalSwayMode(),
    viewportCullingEnabled: isFlowerViewportCullingEnabled(),
  };
}

function sanitizeOffshootPathGenerationMode(value) {
  if (value === 'random' || value === 'manualTemplate' || value === 'inherit') {
    return value;
  }
  return 'inherit';
}

function normalizeTemplateIndexPool(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const out = [];
  const seen = new Set();
  for (let i = 0; i < value.length; i += 1) {
    const numeric = Number(value[i]);
    if (!Number.isFinite(numeric) || numeric < 0) {
      continue;
    }
    const index = Math.floor(numeric);
    if (seen.has(index)) {
      continue;
    }
    seen.add(index);
    out.push(index);
  }
  return out;
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

function countSvgPathAnchorPoints(pathData) {
  if (typeof pathData !== 'string' || pathData.trim().length === 0) {
    return 0;
  }
  const tokens = pathData.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
  if (!tokens || tokens.length === 0) {
    return 0;
  }

  function isCommandToken(token) {
    return typeof token === 'string' && token.length === 1 && /[a-zA-Z]/.test(token);
  }

  let command = '';
  let index = 0;
  let count = 0;

  function consumeSegments(valuesPerSegment) {
    let consumedAny = false;
    while (index < tokens.length && !isCommandToken(tokens[index])) {
      if (index + valuesPerSegment > tokens.length) {
        break;
      }
      let isValidSegment = true;
      for (let i = 0; i < valuesPerSegment; i += 1) {
        if (!Number.isFinite(Number(tokens[index + i]))) {
          isValidSegment = false;
          break;
        }
      }
      if (!isValidSegment) {
        break;
      }
      index += valuesPerSegment;
      count += 1;
      consumedAny = true;
    }
    return consumedAny;
  }

  while (index < tokens.length) {
    if (isCommandToken(tokens[index])) {
      command = tokens[index];
      index += 1;
      if (command === 'Z' || command === 'z') {
        continue;
      }
    } else if (!command) {
      break;
    }

    if (command === 'M' || command === 'm') {
      // MoveTo counts its first endpoint; additional pairs are implicit LineTo endpoints.
      consumeSegments(2);
      continue;
    }
    if (command === 'L' || command === 'l' || command === 'T' || command === 't') {
      consumeSegments(2);
      continue;
    }
    if (command === 'H' || command === 'h' || command === 'V' || command === 'v') {
      consumeSegments(1);
      continue;
    }
    if (command === 'Q' || command === 'q' || command === 'S' || command === 's') {
      consumeSegments(4);
      continue;
    }
    if (command === 'C' || command === 'c') {
      consumeSegments(6);
      continue;
    }
    if (command === 'A' || command === 'a') {
      consumeSegments(7);
      continue;
    }

    // Unknown command; stop parsing conservatively.
    break;
  }

  return Math.max(0, count);
}

function hasSvgCloseCommand(pathData) {
  if (typeof pathData !== 'string' || pathData.trim().length === 0) {
    return false;
  }
  const commandTokens = pathData.match(/[a-zA-Z]/g);
  if (!commandTokens) {
    return false;
  }
  for (let i = 0; i < commandTokens.length; i += 1) {
    const command = commandTokens[i];
    if (command === 'Z' || command === 'z') {
      return true;
    }
  }
  return false;
}

function computeTemplateClosedThreshold(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return 0;
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  const diagonal = Math.hypot(maxX - minX, maxY - minY);
  return Math.max(1e-3, diagonal * 0.02);
}

function trimPolylineByArcFraction(points, fraction = 0.5) {
  if (!Array.isArray(points) || points.length < 2) {
    return points;
  }
  const tFraction = clamp(Number(fraction), 0, 1);
  if (tFraction <= 0) {
    return [points[0], points[0]];
  }
  if (tFraction >= 1) {
    return points;
  }

  const segmentLengths = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const segmentLength = Math.hypot(dx, dy);
    segmentLengths.push(segmentLength);
    totalLength += segmentLength;
  }
  if (totalLength < 1e-8) {
    return points;
  }

  const targetLength = totalLength * tFraction;
  const out = [{ x: points[0].x, y: points[0].y }];
  let traversed = 0;

  for (let i = 0; i < segmentLengths.length; i += 1) {
    const segmentLength = segmentLengths[i];
    if (segmentLength < 1e-8) {
      continue;
    }
    const nextTraversed = traversed + segmentLength;
    const p0 = points[i];
    const p1 = points[i + 1];

    if (nextTraversed < targetLength - 1e-8) {
      out.push({ x: p1.x, y: p1.y });
      traversed = nextTraversed;
      continue;
    }

    const localDistance = clamp(targetLength - traversed, 0, segmentLength);
    const localT = segmentLength < 1e-8 ? 0 : localDistance / segmentLength;
    const cutPoint = {
      x: p0.x + (p1.x - p0.x) * localT,
      y: p0.y + (p1.y - p0.y) * localT,
    };

    const previous = out[out.length - 1];
    if (Math.hypot(previous.x - cutPoint.x, previous.y - cutPoint.y) > 1e-8) {
      out.push(cutPoint);
    }

    if (out.length < 2) {
      out.push({ x: p1.x, y: p1.y });
    }
    return out;
  }

  return out.length >= 2 ? out : points;
}

function maybeOpenClosedSvgTemplate(points) {
  if (!Array.isArray(points) || points.length < 3) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const closeThreshold = computeTemplateClosedThreshold(points);
  const isClosed = Math.hypot(last.x - first.x, last.y - first.y) <= closeThreshold;
  if (!isClosed) {
    return points;
  }

  // Remove duplicated closing endpoint if present.
  let openPoints = points;
  if (points.length > 3) {
    openPoints = points.slice(0, -1);
  }

  // Closed contour paths can look doubled when used as branch centerlines.
  // Keep only the first half by traveled arc-length.
  const trimmed = trimPolylineByArcFraction(openPoints, 0.5);
  return Array.isArray(trimmed) && trimmed.length >= 2 ? trimmed : openPoints;
}

function getTemplateHeadingVector(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return { x: 1, y: 0 };
  }

  const first = points[0];
  const last = points[points.length - 1];
  let dx = last.x - first.x;
  let dy = last.y - first.y;
  if (Math.hypot(dx, dy) > 1e-6) {
    return { x: dx, y: dy };
  }

  let bestIndex = 1;
  let bestDistanceSq = -1;
  for (let i = 1; i < points.length; i += 1) {
    const cx = points[i].x - first.x;
    const cy = points[i].y - first.y;
    const distSq = cx * cx + cy * cy;
    if (distSq > bestDistanceSq) {
      bestDistanceSq = distSq;
      bestIndex = i;
    }
  }
  dx = points[bestIndex].x - first.x;
  dy = points[bestIndex].y - first.y;
  if (Math.hypot(dx, dy) > 1e-6) {
    return { x: dx, y: dy };
  }

  for (let i = 1; i < points.length; i += 1) {
    dx = points[i].x - points[i - 1].x;
    dy = points[i].y - points[i - 1].y;
    if (Math.hypot(dx, dy) > 1e-6) {
      return { x: dx, y: dy };
    }
  }

  return { x: 1, y: 0 };
}

function normalizeTemplateRotationDeg(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return Number.isFinite(fallback) ? fallback : 0;
  }
  return numeric;
}

function createManualTemplateEntry(points, meta = {}) {
  const sanitizedPoints = sanitizeManualTemplatePoints(points);
  if (!sanitizedPoints) {
    return null;
  }

  const id = typeof meta.id === 'string' && meta.id.trim().length > 0
    ? meta.id.trim()
    : `template-${Number.isFinite(meta.index) ? meta.index : 0}`;
  const label = typeof meta.label === 'string' && meta.label.trim().length > 0
    ? meta.label.trim()
    : id;
  const sourceType = typeof meta.sourceType === 'string' && meta.sourceType.trim().length > 0
    ? meta.sourceType.trim()
    : 'points';
  const rotationDeg = normalizeTemplateRotationDeg(meta.rotationDeg, 0);
  const autoOpenClosedPath = meta.autoOpenClosedPath !== false;
  const processedPoints = (
    autoOpenClosedPath &&
    (sourceType === 'svgFile' || sourceType === 'svgPathD')
  )
    ? maybeOpenClosedSvgTemplate(sanitizedPoints)
    : sanitizedPoints;
  const rawTargetPointCount = Number(meta.targetPointCount);
  const targetPointCount = Number.isFinite(rawTargetPointCount) && rawTargetPointCount >= 2
    ? Math.round(rawTargetPointCount)
    : null;
  const targetPointCountIsExplicit = meta.targetPointCountIsExplicit === true;
  const trimRatio = (
    Array.isArray(sanitizedPoints) &&
    sanitizedPoints.length >= 2 &&
    Array.isArray(processedPoints) &&
    processedPoints.length >= 2
  )
    ? processedPoints.length / sanitizedPoints.length
    : 1;
  const effectiveTargetPointCount = (
    targetPointCount &&
    !targetPointCountIsExplicit &&
    trimRatio < 0.95
  )
    ? Math.max(2, Math.round(targetPointCount * trimRatio))
    : targetPointCount;
  const finalPoints = effectiveTargetPointCount
    ? resampleTemplateToPointCount(processedPoints, effectiveTargetPointCount)
    : processedPoints;

  return {
    id,
    label,
    sourceType,
    rotationDeg,
    points: finalPoints,
  };
}

function normalizeManualTemplateConfigEntry(candidate, index = 0) {
  if (Array.isArray(candidate)) {
    return createManualTemplateEntry(candidate, {
      id: `config-template-${index}`,
      label: `Config Template ${index}`,
      sourceType: 'points',
      index,
    });
  }

  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  if (candidate.enabled === false) {
    return null;
  }

  return createManualTemplateEntry(candidate.points, {
    id: candidate.id || `config-template-${index}`,
    label: candidate.label || `Config Template ${index}`,
    sourceType: candidate.sourceType || 'points',
    rotationDeg: candidate.rotationDeg,
    targetPointCount: candidate.targetPointCount,
    targetPointCountIsExplicit: candidate.targetPointCount !== undefined,
    autoOpenClosedPath: candidate.autoOpenClosedPath,
    index,
  });
}

function distancePointToSegment(point, segmentStart, segmentEnd) {
  const vx = segmentEnd.x - segmentStart.x;
  const vy = segmentEnd.y - segmentStart.y;
  const wx = point.x - segmentStart.x;
  const wy = point.y - segmentStart.y;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }
  const c2 = vx * vx + vy * vy;
  if (c2 <= 1e-8) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }
  if (c2 <= c1) {
    return Math.hypot(point.x - segmentEnd.x, point.y - segmentEnd.y);
  }
  const b = c1 / c2;
  const proj = {
    x: segmentStart.x + b * vx,
    y: segmentStart.y + b * vy,
  };
  return Math.hypot(point.x - proj.x, point.y - proj.y);
}

function sampleSvgPathElementAdaptive(pathElement, options = {}) {
  const tolerance = Number.isFinite(options.tolerance) ? Math.max(0.05, options.tolerance) : 1.2;
  const maxDepth = Number.isFinite(options.maxDepth) ? clamp(Math.floor(options.maxDepth), 1, 20) : 12;
  const maxPoints = Number.isFinite(options.maxPoints) ? clamp(Math.floor(options.maxPoints), 8, 10000) : 2000;
  const minSegmentLength = Number.isFinite(options.minSegmentLength)
    ? Math.max(0.01, options.minSegmentLength)
    : 0.3;

  let totalLength = 0;
  try {
    totalLength = pathElement.getTotalLength();
  } catch (error) {
    return null;
  }
  if (!Number.isFinite(totalLength) || totalLength < 1e-6) {
    return null;
  }

  function pointAtLength(length) {
    const point = pathElement.getPointAtLength(clamp(length, 0, totalLength));
    return { x: point.x, y: point.y };
  }

  const startPoint = pointAtLength(0);
  const endPoint = pointAtLength(totalLength);
  const out = [startPoint];
  let aborted = false;

  function recurse(l0, p0, l1, p1, depth) {
    if (aborted) {
      return;
    }
    if (out.length >= maxPoints) {
      out.push(p1);
      aborted = true;
      return;
    }

    const span = l1 - l0;
    const midLength = l0 + span * 0.5;
    const midPoint = pointAtLength(midLength);
    const flatness = distancePointToSegment(midPoint, p0, p1);
    const shouldSplit = (
      depth < maxDepth &&
      span > minSegmentLength &&
      flatness > tolerance
    );

    if (shouldSplit) {
      recurse(l0, p0, midLength, midPoint, depth + 1);
      recurse(midLength, midPoint, l1, p1, depth + 1);
      return;
    }

    out.push(p1);
  }

  recurse(0, startPoint, totalLength, endPoint, 0);

  const cleaned = [];
  for (let i = 0; i < out.length; i += 1) {
    const point = out[i];
    if (cleaned.length === 0) {
      cleaned.push(point);
      continue;
    }
    const previous = cleaned[cleaned.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) > 1e-6) {
      cleaned.push(point);
    }
  }

  return cleaned.length >= 2 ? cleaned : null;
}

function convertSvgPathDToTemplatePoints(pathData, options = {}) {
  if (typeof pathData !== 'string' || pathData.trim().length === 0) {
    return null;
  }
  if (typeof document === 'undefined' || !document.createElementNS || !document.body) {
    return null;
  }

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', pathData);
  if (typeof options.transform === 'string' && options.transform.trim().length > 0) {
    path.setAttribute('transform', options.transform);
  }
  svg.appendChild(path);
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.opacity = '0';
  svg.style.pointerEvents = 'none';

  document.body.appendChild(svg);
  let sampled = null;
  try {
    sampled = sampleSvgPathElementAdaptive(path, options);
  } catch (error) {
    sampled = null;
  }
  svg.remove();

  return sanitizeManualTemplatePoints(sampled);
}

function extractFirstPathDataFromSvgText(svgText) {
  if (typeof svgText !== 'string' || svgText.trim().length === 0) {
    return null;
  }
  if (typeof DOMParser !== 'function') {
    return null;
  }
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(svgText, 'image/svg+xml');
  if (documentNode.querySelector('parsererror')) {
    return null;
  }

  const firstPath = documentNode.querySelector('path[d]');
  if (!firstPath) {
    return null;
  }

  const d = firstPath.getAttribute('d');
  if (typeof d !== 'string' || d.trim().length === 0) {
    return null;
  }

  return {
    d,
    transform: firstPath.getAttribute('transform') || '',
    anchorPointCount: countSvgPathAnchorPoints(d),
  };
}

async function resolveManualTemplateSource(source, index = 0) {
  const sourceType = typeof source.sourceType === 'string' ? source.sourceType : '';
  if (sourceType === 'points') {
    return {
      points: sanitizeManualTemplatePoints(source.points),
      inferredPointCount: null,
    };
  }

  if (sourceType === 'svgPathD') {
    const d = typeof source.d === 'string' ? source.d : '';
    return {
      points: convertSvgPathDToTemplatePoints(d),
      inferredPointCount: countSvgPathAnchorPoints(d),
      isClosed: hasSvgCloseCommand(d),
    };
  }

  if (sourceType === 'svgFile') {
    if (typeof fetch !== 'function') {
      throw new Error('fetch is unavailable for svgFile sources.');
    }
    const src = typeof source.src === 'string' ? source.src : '';
    if (src.trim().length === 0) {
      throw new Error('svgFile source is missing src.');
    }
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`failed to fetch "${src}" (${response.status}).`);
    }
    const svgText = await response.text();
    const pathData = extractFirstPathDataFromSvgText(svgText);
    if (!pathData) {
      throw new Error(`no valid <path d> found in "${src}".`);
    }
    return {
      points: convertSvgPathDToTemplatePoints(pathData.d, {
        transform: pathData.transform,
      }),
      inferredPointCount: pathData.anchorPointCount,
      isClosed: hasSvgCloseCommand(pathData.d),
    };
  }

  throw new Error(`unsupported sourceType "${sourceType || 'unknown'}" at index ${index}.`);
}

async function loadManualTemplateSources(options = {}) {
  const { force = false } = options;
  if (STATE.manualTemplateRegistryLoaded && !force) {
    return STATE.manualTemplateRegistryTemplates;
  }

  const sourceList = Array.isArray(window.STEM_MANUAL_TEMPLATE_SOURCES)
    ? window.STEM_MANUAL_TEMPLATE_SOURCES
    : [];
  const resolvedTemplates = [];
  const warnings = [];

  for (let i = 0; i < sourceList.length; i += 1) {
    const source = sourceList[i];
    if (!source || typeof source !== 'object') {
      continue;
    }
    if (source.enabled === false) {
      continue;
    }

    const sourceLabel = typeof source.id === 'string' && source.id.length > 0
      ? source.id
      : `template-source-${i}`;

    try {
      const resolved = await resolveManualTemplateSource(source, i);
      const templatePoints = resolved && typeof resolved === 'object'
        ? resolved.points
        : null;
      const inferredPointCount = resolved && typeof resolved === 'object'
        ? resolved.inferredPointCount
        : null;
      const hasExplicitTargetPointCount = Number.isFinite(Number(source.targetPointCount));
      const targetPointCount = hasExplicitTargetPointCount
        ? Number(source.targetPointCount)
        : inferredPointCount;
      const templateEntry = createManualTemplateEntry(templatePoints, {
        id: source.id || sourceLabel,
        label: source.label || sourceLabel,
        sourceType: source.sourceType || 'points',
        rotationDeg: source.rotationDeg,
        autoOpenClosedPath: source.autoOpenClosedPath,
        targetPointCount,
        targetPointCountIsExplicit: hasExplicitTargetPointCount,
        index: i,
      });
      if (templateEntry) {
        resolvedTemplates.push(templateEntry);
      } else {
        const message = `${sourceLabel}: source resolved to no template points.`;
        warnings.push(message);
        console.warn('[ManualTemplate]', message);
      }
    } catch (error) {
      const message = `${sourceLabel}: ${error.message}`;
      warnings.push(message);
      console.warn('[ManualTemplate]', message);
    }
  }

  STATE.manualTemplateRegistryTemplates = resolvedTemplates;
  STATE.manualTemplateRegistryWarnings = warnings;
  STATE.manualTemplateRegistryLoaded = true;
  return resolvedTemplates;
}

function getResolvedManualTemplateEntries() {
  const out = [];

  // Keep generate_manual_points() as fixed template index 0.
  const generated = createManualTemplateEntry(generate_manual_points(), {
    id: 'generate-manual-points',
    label: 'generate_manual_points()',
    sourceType: 'generated',
    rotationDeg: 0,
    index: 0,
  });
  if (generated) {
    out.push(generated);
  }

  const registryTemplates = Array.isArray(STATE.manualTemplateRegistryTemplates)
    ? STATE.manualTemplateRegistryTemplates
    : [];
  for (let i = 0; i < registryTemplates.length; i += 1) {
    const template = registryTemplates[i];
    if (Array.isArray(template)) {
      const legacy = createManualTemplateEntry(template, {
        id: `registry-template-${i}`,
        label: `Registry Template ${i}`,
        sourceType: 'points',
        index: i,
      });
      if (legacy) {
        out.push(legacy);
      }
      continue;
    }
    if (!template || typeof template !== 'object') {
      continue;
    }
    const entry = createManualTemplateEntry(template.points, {
      id: template.id || `registry-template-${i}`,
      label: template.label || `Registry Template ${i}`,
      sourceType: template.sourceType || 'points',
      rotationDeg: template.rotationDeg,
      index: i,
    });
    if (entry) {
      out.push(entry);
    }
  }

  const config = CONFIG.pathGeneration || {};
  const inputTemplates = Array.isArray(config.manualTemplates) ? config.manualTemplates : [];
  for (let i = 0; i < inputTemplates.length; i += 1) {
    const template = normalizeManualTemplateConfigEntry(inputTemplates[i], i);
    if (template) {
      out.push(template);
    }
  }

  return out;
}

function getSanitizedManualTemplates() {
  const entries = getResolvedManualTemplateEntries();
  const out = [];
  for (let i = 0; i < entries.length; i += 1) {
    out.push(entries[i].points);
  }
  return out;
}

function getManualTemplateDescriptors() {
  const entries = getResolvedManualTemplateEntries();
  const out = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    out.push({
      index: i,
      id: entry.id,
      label: entry.label,
      sourceType: entry.sourceType,
      rotationDeg: entry.rotationDeg,
      pointCount: entry.points.length,
    });
  }
  return out;
}

function resampleTemplateToPointCount(template, targetCount) {
  if (!Array.isArray(template) || template.length < 2) {
    return template;
  }

  const resolvedTarget = Math.max(2, Math.floor(Number(targetCount) || 0));
  if (resolvedTarget === template.length) {
    return template;
  }

  const segments = [];
  const cumulative = [0];
  let totalLength = 0;

  for (let i = 0; i < template.length - 1; i += 1) {
    const start = template[i];
    const end = template[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 1e-8) {
      continue;
    }
    segments.push({ start, dx, dy, length });
    totalLength += length;
    cumulative.push(totalLength);
  }

  if (segments.length === 0 || totalLength < 1e-8) {
    const fallback = template[0];
    const out = [];
    for (let i = 0; i < resolvedTarget; i += 1) {
      out.push({ x: fallback.x, y: fallback.y });
    }
    return out;
  }

  const out = [];
  let segmentIndex = 0;
  for (let i = 0; i < resolvedTarget; i += 1) {
    const t = resolvedTarget <= 1 ? 0 : i / (resolvedTarget - 1);
    const distance = t * totalLength;

    while (
      segmentIndex < segments.length - 1 &&
      distance > cumulative[segmentIndex + 1]
    ) {
      segmentIndex += 1;
    }

    const segment = segments[segmentIndex];
    const segmentStartDistance = cumulative[segmentIndex];
    const localDistance = Math.max(0, distance - segmentStartDistance);
    const localT = segment.length < 1e-8 ? 0 : clamp(localDistance / segment.length, 0, 1);

    out.push({
      x: segment.start.x + segment.dx * localT,
      y: segment.start.y + segment.dy * localT,
    });
  }

  return out;
}

function ensureTemplateMinControlPoints(template, minCount) {
  if (!Array.isArray(template) || template.length < 2) {
    return template;
  }

  const targetCount = Math.max(2, Math.floor(Number(minCount) || 0));
  if (template.length >= targetCount) {
    return template;
  }
  return resampleTemplateToPointCount(template, targetCount);
}

function resolveTemplateScaleRange(templateConfig = CONFIG.pathGeneration || {}) {
  const fallbackScale = Number.isFinite(templateConfig.templateScale)
    ? Math.max(0, templateConfig.templateScale)
    : 1;

  let minScale = Number.isFinite(templateConfig.templateScaleRangeMin)
    ? Math.max(0, templateConfig.templateScaleRangeMin)
    : fallbackScale;
  let maxScale = Number.isFinite(templateConfig.templateScaleRangeMax)
    ? Math.max(0, templateConfig.templateScaleRangeMax)
    : fallbackScale;

  if (minScale > maxScale) {
    const tmp = minScale;
    minScale = maxScale;
    maxScale = tmp;
  }

  return { minScale, maxScale };
}

function resolvePerBranchTemplateScale(stableKey = '', templateConfig = CONFIG.pathGeneration || {}) {
  const { minScale, maxScale } = resolveTemplateScaleRange(templateConfig);
  if (Math.abs(maxScale - minScale) < 1e-8) {
    return minScale;
  }
  const rng = mulberry32(hashSeed(`${stableKey}|template-scale`));
  return minScale + (maxScale - minScale) * rng();
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
  directionalBias = 0,
  axisAbsFlags = null,
) {
  const layerOffsetA = layerSeed * 27183.331;
  const layerOffsetB = layerSeed * 93841.719;
  const x1 = time / noiseConfig.stepSize + noisePhase.x1 + layerOffsetA;
  const y1 = time / noiseConfig.stepSize + noisePhase.y1 + layerOffsetB;
  const x2 = x1 + 94827 + noisePhase.x2 + layerOffsetB * 0.37;
  const y2 = y1 + 53977 + noisePhase.y2 + layerOffsetA * 0.53;

  const n1 = sampleNoise2(x1, y1);
  const n2 = sampleNoise2(x2, y2);

  const bias = normalizeTemplateNoiseDirectionalBias(directionalBias, 0);
  const resolvedAxisAbsFlags = axisAbsFlags || resolvePathNoiseAxisAbsFlags();
  const lateralAbsOrSigned = blendSignedNoiseWithAbsolute(n1, resolvedAxisAbsFlags.xAbsBlend);
  const forwardAbsOrSigned = blendSignedNoiseWithAbsolute(n2, resolvedAxisAbsFlags.yAbsBlend);
  const lateralSample = n1 * (1 - bias) + lateralAbsOrSigned * bias;
  const forwardSample = n2 * (1 - bias) + forwardAbsOrSigned * bias;
  const lateralMagnitude = lateralSample * noiseAmount * noiseScaleMultiplier;
  const forwardMagnitude = forwardSample * noiseAmount * noiseScaleMultiplier;

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
  axisAbsFlags = null,
) {
  const x1 = time / noiseConfig.stepSize + noisePhase.x1;
  const y1 = time / noiseConfig.stepSize + noisePhase.y1;
  const x2 = x1 + 4895943 + noisePhase.x2;
  const y2 = y1 + 4838485943 + noisePhase.y2;

  const n1 = sampleNoise2(x1, y1);
  const n2 = sampleNoise2(x2, y2);

  const resolvedAxisAbsFlags = axisAbsFlags || resolvePathNoiseAxisAbsFlags();
  const lateralMagnitude = blendSignedNoiseWithAbsolute(
    n1,
    resolvedAxisAbsFlags.xAbsBlend,
  ) * noiseConfig.scale * noiseScaleMultiplier;
  const forwardMagnitude = blendSignedNoiseWithAbsolute(
    n2,
    resolvedAxisAbsFlags.yAbsBlend,
  ) * noiseConfig.scale * noiseScaleMultiplier;

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
  const axisAbsFlags = resolvePathNoiseAxisAbsFlags(CONFIG.pathGeneration || {});

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
        axisAbsFlags,
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
  const templateEntries = getResolvedManualTemplateEntries();
  if (templateEntries.length === 0) {
    return generateBranchControlPoints(
      startX,
      startY,
      direction,
      initialTime,
      noiseConfig,
      branchProfile,
    );
  }

  const templateIndex = resolveManualTemplateIndex(
    templateEntries.length,
    stableKey,
    preferredTemplateIndex,
  );
  const templateEntry = templateEntries[templateIndex >= 0 ? templateIndex : 0];
  const templateBase = templateEntry.points;
  const templateRotationRad = normalizeTemplateRotationDeg(templateEntry.rotationDeg, 0) * Math.PI / 180;
  const templateConfig = CONFIG.pathGeneration || {};
  const axisAbsFlags = resolvePathNoiseAxisAbsFlags(templateConfig);
  const inheritCheckpointSpacing = templateConfig.templateInheritCheckpointSpacingSteps !== false;
  const requiredTemplatePoints = Math.max(
    2,
    Math.floor(
      Number.isFinite(noiseConfig.checkpointSpacingSteps)
        ? noiseConfig.checkpointSpacingSteps
        : templateBase.length,
    ),
  );
  const template = inheritCheckpointSpacing
    ? ensureTemplateMinControlPoints(templateBase, requiredTemplatePoints)
    : templateBase;

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
  const noiseAmount3 = Math.max(0, Number(templateConfig.templateNoiseAmount3) || 0);
  const noiseStep3 = Number.isFinite(templateConfig.templateNoiseStep3) && templateConfig.templateNoiseStep3 > 0
    ? templateConfig.templateNoiseStep3
    : baseNoiseStep;
  const noiseHighpassWindow3 = normalizeTemplateNoiseHighpassWindow(
    Number(templateConfig.templateNoiseHighpassWindow3),
    7,
  );
  const directionalBias = normalizeTemplateNoiseDirectionalBias(
    Number(templateConfig.templateNoiseDirectionalBias),
    0,
  );
  const templateNoiseLayers = [];
  if (noiseAmount1 > 0) {
    templateNoiseLayers.push({ amount: noiseAmount1, step: noiseStep1, layerSeed: 0 });
  }
  if (noiseAmount2 > 0) {
    templateNoiseLayers.push({ amount: noiseAmount2, step: noiseStep2, layerSeed: 1 });
  }
  const shouldAlign = templateConfig.alignTemplateToGrowth !== false;
  const globalTemplateScale = resolvePerBranchTemplateScale(stableKey, templateConfig);
  const branchTemplateScale = Number.isFinite(branchProfile.templateScaleMultiplier)
    ? Math.max(0, branchProfile.templateScaleMultiplier)
    : 1;
  const templateScale = globalTemplateScale * branchTemplateScale;
  // Positive direction branches (left side seeds) mirror horizontally.
  const mirrorX = direction >= 0 ? -1 : 1;

  const first = template[0];
  const headingSource = getTemplateHeadingVector(template);
  // Align uses the source heading before per-template rotation so rotationDeg
  // remains an explicit per-template orientation control.
  const unmirroredHeading = {
    x: headingSource.x * templateScale,
    y: headingSource.y * templateScale,
  };
  const templateHeading = normalize({
    x: unmirroredHeading.x * mirrorX,
    y: unmirroredHeading.y,
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
  const layer3RawOffsets = [];
  let layer3TimeCursor = initialTime;
  const points = [];
  for (let i = 0; i < template.length; i += 1) {
    const localUnrotated = {
      x: (template[i].x - first.x) * templateScale,
      y: (template[i].y - first.y) * templateScale,
    };
    // Per-template rotation is applied before side mirroring.
    const localRotated = rotateVector(localUnrotated, templateRotationRad);
    const local = {
      x: localRotated.x * mirrorX,
      y: localRotated.y,
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
          directionalBias,
          axisAbsFlags,
        );
        totalDx += noiseOffset.dx;
        totalDy += noiseOffset.dy;
      }
      point = {
        x: point.x + totalDx,
        y: point.y + totalDy,
      };
    }

    if (noiseAmount3 > 0 && i > 0) {
      layer3TimeCursor += noiseStep3;
      layer3RawOffsets[i] = getTemplateNoiseOffset(
        layer3TimeCursor + i * 0.1618,
        direction,
        noiseConfig,
        noisePhase,
        noiseScaleMultiplier,
        directionalBasis,
        noiseAmount3,
        2,
        directionalBias,
        axisAbsFlags,
      );
    } else {
      layer3RawOffsets[i] = { dx: 0, dy: 0 };
    }

    points.push(point);
  }

  if (noiseAmount3 > 0 && points.length > 1) {
    const radius = Math.floor(noiseHighpassWindow3 / 2);
    const last = points.length - 1;
    for (let i = 1; i <= last; i += 1) {
      const start = Math.max(1, i - radius);
      const end = Math.min(last, i + radius);
      let sumDx = 0;
      let sumDy = 0;
      let count = 0;
      for (let j = start; j <= end; j += 1) {
        sumDx += layer3RawOffsets[j].dx;
        sumDy += layer3RawOffsets[j].dy;
        count += 1;
      }
      const baselineDx = count > 0 ? sumDx / count : 0;
      const baselineDy = count > 0 ? sumDy / count : 0;
      const detailDx = layer3RawOffsets[i].dx - baselineDx;
      const detailDy = layer3RawOffsets[i].dy - baselineDy;
      points[i] = {
        x: points[i].x + detailDx,
        y: points[i].y + detailDy,
      };
    }
  }

  let endTime = initialTime;
  for (let i = 0; i < layerTimeCursors.length; i += 1) {
    if (layerTimeCursors[i] > endTime) {
      endTime = layerTimeCursors[i];
    }
  }
  if (noiseAmount3 > 0 && layer3TimeCursor > endTime) {
    endTime = layer3TimeCursor;
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
    this.rootDirection = Number.isFinite(options.rootDirection)
      ? (options.rootDirection >= 0 ? 1 : -1)
      : this.direction;
    this.growthDir = normalize(
      options.growthDir && Number.isFinite(options.growthDir.x) && Number.isFinite(options.growthDir.y)
        ? options.growthDir
        : { x: this.direction, y: -1 },
    );
    this.useDirectionalBasis = options.useDirectionalBasis === true;
    this.baseScale = Number.isFinite(options.baseScale) ? options.baseScale : 1;
    this.thicknessBaseScale = Number.isFinite(options.thicknessBaseScale)
      ? Math.max(0.01, options.thicknessBaseScale)
      : Math.max(0.01, this.baseScale);
    this.stableKey = typeof options.stableKey === 'string'
      ? options.stableKey
      : `branch:${seedX.toFixed(2)}:${seedY.toFixed(2)}:${this.direction}:${this.depth}`;
    this.manualTemplateIndex = Number.isFinite(options.manualTemplateIndex)
      ? Math.max(0, Math.floor(options.manualTemplateIndex))
      : null;
    this.pathGenerationModeOverride = (
      options.pathGenerationMode === 'random' || options.pathGenerationMode === 'manualTemplate'
    )
      ? options.pathGenerationMode
      : null;
    this.filterVariantIndex = Number.isFinite(options.filterVariantIndex)
      ? Math.max(-1, Math.floor(options.filterVariantIndex))
      : -1;
    this.filterHueDeg = Number.isFinite(options.filterHueDeg) ? options.filterHueDeg : 0;
    this.filterBrightness = Number.isFinite(options.filterBrightness)
      ? Math.max(0, options.filterBrightness)
      : 1;
    this.filteredStemImage = null;
    this.filteredStemImageFlipped = null;
    this.offshootInput = normalizeOffshootInput(options.offshoot);
    this.offshootResolved = null;
    this.spawnDistanceOnParent = Number.isFinite(options.spawnDistanceOnParent)
      ? Math.max(0, options.spawnDistanceOnParent)
      : 0;
    this.startDistanceMetric = 0;
    this.pathLength = 0;

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
    this.renderCache = {
      valid: false,
      samples: [],
      distances: [],
      centerX: [],
      centerY: [],
      cacheKey: '',
      pathDataRef: null,
      defaultImageRef: null,
      flippedImageRef: null,
    };
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

    const generationMode = this.pathGenerationModeOverride || getPathGenerationMode();

    let generated;
    if (generationMode === 'manualTemplate') {
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
    this.pathLength = this.pathData ? this.pathData.totalLength : 0;
    invalidateBranchStripCache(this);

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
    onBranchStructureChanged();
  }

  createRootBranch(seedX, seedY, direction = -1, options = {}) {
    const stableKey = typeof options.stableKey === 'string' && options.stableKey.length > 0
      ? options.stableKey
      : `root-${this.rootStableCounter++}`;

    const rootGrowthDir = normalize({ x: direction, y: -1 });
    const root = new Branch(seedX, seedY, direction, {
      parentId: null,
      depth: 0,
      rootDirection: direction,
      growthDir: rootGrowthDir,
      useDirectionalBasis: false,
      baseScale: 1,
      thicknessBaseScale: Number.isFinite(options.thicknessBaseScale)
        ? Math.max(0.01, options.thicknessBaseScale)
        : 1,
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
    const pathGenerationMode = sanitizeOffshootPathGenerationMode(
      typeof local.pathGenerationMode === 'string'
        ? local.pathGenerationMode
        : globalConfig.pathGenerationMode,
    );
    const templateIndexPoolSource = local.templateIndexPool !== undefined
      ? local.templateIndexPool
      : globalConfig.templateIndexPool;
    const templateIndexPool = normalizeTemplateIndexPool(templateIndexPoolSource);
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
      pathGenerationMode,
      templateIndexPool,
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
    const templateCount = getSanitizedManualTemplates().length;
    const selectableTemplatePool = [];
    for (let i = 0; i < resolved.templateIndexPool.length; i += 1) {
      const index = resolved.templateIndexPool[i];
      if (index >= 0 && index < templateCount) {
        selectableTemplatePool.push(index);
      }
    }

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
      const childTemplateIndex = selectableTemplatePool.length > 0
        ? selectableTemplatePool[
            clamp(Math.floor(rng() * selectableTemplatePool.length), 0, selectableTemplatePool.length - 1)
          ]
        : null;
      const childPathGenerationMode = resolved.pathGenerationMode === 'inherit'
        ? null
        : resolved.pathGenerationMode;
      const parentThicknessBaseScale = getBranchThicknessBaseScale(parent);
      const inheritedThicknessBaseScale = Math.max(
        0.01,
        parentThicknessBaseScale
          * getThicknessTaperFactorAtDistance(distance, parent.pathData.totalLength, CONFIG.brush),
      );
      const child = new Branch(anchor.x, anchor.y, sideSign, {
        parentId: parent.id,
        depth: parent.depth + 1,
        rootDirection: parent.rootDirection,
        spawnDistanceOnParent: distance,
        growthDir,
        useDirectionalBasis: true,
        baseScale: Math.max(0.05, parent.baseScale * resolved.depthScale),
        thicknessBaseScale: inheritedThicknessBaseScale,
        stableKey: childStableKey,
        manualTemplateIndex: childTemplateIndex,
        pathGenerationMode: childPathGenerationMode,
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

    onBranchStructureChanged();
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
    const dedupe = new Set();
    for (let i = 0; i < this.rootBranches.length; i += 1) {
      const existing = this.rootBranches[i];
      dedupe.add(createBranchDefDedupeKey({
        x: existing.seed.x,
        y: existing.seed.y,
        direction: existing.direction,
      }));
    }

    for (let i = 0; i < branchDefs.length; i += 1) {
      const def = branchDefs[i];
      if (!def || !Number.isFinite(def.x) || !Number.isFinite(def.y)) {
        continue;
      }

      const direction = Number.isFinite(def.direction) ? def.direction : -1;
      const dedupeKey = createBranchDefDedupeKey({
        x: def.x,
        y: def.y,
        direction,
      });
      if (dedupe.has(dedupeKey)) {
        continue;
      }

      const root = this.createRootBranch(def.x, def.y, direction, {
        offshoot: normalizeOffshootInput(def.offshoot),
        stableKey: typeof def.stableKey === 'string' ? def.stableKey : undefined,
        manualTemplateIndex: Number.isFinite(def.manualTemplateIndex) ? def.manualTemplateIndex : null,
      });
      this.rootBranches.push(root);
      dedupe.add(dedupeKey);
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
function normalizeSeedSpacingConfig(seedsConfig = CONFIG.seeds || {}) {
  const rawMinSpacing = Number(seedsConfig.minSpacing);
  const rawMaxSpacing = Number(seedsConfig.maxSpacing);
  const minSpacing = Number.isFinite(rawMinSpacing) ? Math.max(0, rawMinSpacing) : 0;
  const randomizeSpacing = seedsConfig.randomizeSpacing === true;
  let maxSpacing;
  if (Number.isFinite(rawMaxSpacing)) {
    maxSpacing = Math.max(0, rawMaxSpacing);
  } else if (randomizeSpacing) {
    // Keep randomness available even when maxSpacing is omitted.
    maxSpacing = minSpacing > 1e-6 ? (minSpacing * 1.6) : 120;
  } else {
    maxSpacing = minSpacing;
  }
  if (maxSpacing < minSpacing) {
    maxSpacing = minSpacing;
  }
  return {
    minSpacing,
    maxSpacing,
    randomizeSpacing,
  };
}

function sampleSeedYValues(
  count,
  minY,
  maxY,
  minSpacing = 0,
  maxSpacing = 0,
  startY = null,
  randomizeSpacing = false,
) {
  const targetCount = Math.max(0, Math.floor(Number(count) || 0));
  if (targetCount <= 0) {
    return [];
  }

  const span = Math.max(0, maxY - minY);
  const initialY = Number.isFinite(Number(startY))
    ? Number(startY)
    : (minY + Math.random() * span);
  const out = [initialY];
  for (let i = 1; i < targetCount; i += 1) {
    let gap = Math.max(0, minSpacing);
    if (randomizeSpacing && Number.isFinite(maxSpacing) && maxSpacing > minSpacing + 1e-8) {
      gap = sampleFloatRange([minSpacing, maxSpacing]);
    }
    out.push(out[i - 1] + gap);
  }

  return out;
}

function setSeeds() {
  const seedsConfig = CONFIG.seeds || {};
  const countPerSide = Math.max(0, Math.floor(Number(seedsConfig.countPerSide) || 0));
  const sidePad = Number.isFinite(Number(seedsConfig.sidePad)) ? Number(seedsConfig.sidePad) : 0;
  const sideMargin = Number.isFinite(Number(seedsConfig.sideMargin)) ? Number(seedsConfig.sideMargin) : 0;
  const seedsLeft = [];
  const seedsRight = [];
  const yMin = 100;
  const yMax = STATE.viewportHeight + 100;
  const startY = Number.isFinite(Number(seedsConfig.startY)) ? Number(seedsConfig.startY) : null;
  const { minSpacing, maxSpacing, randomizeSpacing } = normalizeSeedSpacingConfig(seedsConfig);
  const leftYValues = sampleSeedYValues(
    countPerSide,
    yMin,
    yMax,
    minSpacing,
    maxSpacing,
    startY,
    randomizeSpacing,
  );
  const rightYValues = sampleSeedYValues(
    countPerSide,
    yMin,
    yMax,
    minSpacing,
    maxSpacing,
    startY,
    randomizeSpacing,
  );

  for (let i = 0; i < countPerSide; i += 1) {
    // Left side branches grow rightward (direction +1).
    seedsLeft.push({
      x: 0 - sidePad - Math.random() * sideMargin,
      y: leftYValues[i],
      direction: 1,
    });

    // Right side branches grow leftward (direction -1).
    seedsRight.push({
      x: STATE.viewportWidth + sidePad + Math.random() * sideMargin,
      y: rightYValues[i],
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
// 10) Asset Loading
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

function createHorizontallyFlippedTexture(image) {
  if (!image || !Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width <= 0 || image.height <= 0) {
    return image;
  }

  const texture = document.createElement('canvas');
  texture.width = image.width;
  texture.height = image.height;
  const tctx = texture.getContext('2d');
  tctx.setTransform(-1, 0, 0, 1, texture.width, 0);
  tctx.drawImage(image, 0, 0);
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

async function loadLeafTexture(leavesConfig = CONFIG.leaves || {}) {
  const safeConfig = isPlainObjectLiteral(leavesConfig) ? leavesConfig : {};
  const spritePath = (typeof safeConfig.spritePath === 'string' && safeConfig.spritePath.length > 0)
    ? safeConfig.spritePath
    : './leaves_new.png';
  try {
    return await loadImage(spritePath);
  } catch (error) {
    console.warn(error.message + ' | Leaves are disabled until the leaf sprite loads.');
    return null;
  }
}

// =========================
// 11) Branch Endpoints + Flower System Bridge
// =========================
function getBranchEndpointPoint(branch) {
  if (!branch || !branch.pathData || !Number.isFinite(branch.pathData.totalLength)) {
    return null;
  }
  const totalLength = Math.max(0, branch.pathData.totalLength);
  if (totalLength <= 1e-8) {
    return null;
  }
  return getPathPointAtLength(branch.pathData, totalLength);
}

function getBranchEndpointTangentDeg(branch) {
  if (!branch || !branch.pathData || !Number.isFinite(branch.pathData.totalLength)) {
    return null;
  }
  const totalLength = Math.max(0, branch.pathData.totalLength);
  if (totalLength <= 1e-8) {
    return null;
  }

  const flowersConfig = CONFIG.flowers || {};
  const tailLengthInput = Number(flowersConfig.endpointDirectionTailLengthPx);
  const sampleCountInput = Number(flowersConfig.endpointDirectionSampleCount);
  const tailLength = Number.isFinite(tailLengthInput)
    ? Math.max(0, tailLengthInput)
    : 26;
  const sampleCount = Number.isFinite(sampleCountInput)
    ? Math.max(1, Math.floor(sampleCountInput))
    : 5;

  const resolveSingleTangentDeg = () => {
    const tangent = getPathTangentAtLength(branch.pathData, totalLength);
    if (!tangent || !Number.isFinite(tangent.x) || !Number.isFinite(tangent.y)) {
      return null;
    }
    return Math.atan2(tangent.y, tangent.x) * 180 / Math.PI;
  };

  if (tailLength <= 1e-6 || sampleCount <= 1) {
    return resolveSingleTangentDeg();
  }

  const startDistance = Math.max(0, totalLength - tailLength);
  const span = totalLength - startDistance;
  if (span <= 1e-6) {
    return resolveSingleTangentDeg();
  }

  let sumX = 0;
  let sumY = 0;
  let validCount = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    const t = sampleCount <= 1 ? 1 : (i / (sampleCount - 1));
    const distance = startDistance + span * t;
    const tangent = getPathTangentAtLength(branch.pathData, distance);
    if (!tangent || !Number.isFinite(tangent.x) || !Number.isFinite(tangent.y)) {
      continue;
    }
    const len = Math.hypot(tangent.x, tangent.y);
    if (len <= 1e-8) {
      continue;
    }
    sumX += tangent.x / len;
    sumY += tangent.y / len;
    validCount += 1;
  }

  if (validCount <= 0 || Math.hypot(sumX, sumY) <= 1e-8) {
    return resolveSingleTangentDeg();
  }

  return Math.atan2(sumY, sumX) * 180 / Math.PI;
}

function collectBranchEndpoints() {
  if (!STATE.branchGarden || !Array.isArray(STATE.branchGarden.branches)) {
    return [];
  }

  const endpoints = [];
  for (let i = 0; i < STATE.branchGarden.branches.length; i += 1) {
    const branch = STATE.branchGarden.branches[i];
    const endpoint = getBranchEndpointPoint(branch);
    const tangentDeg = getBranchEndpointTangentDeg(branch);
    if (!endpoint) {
      continue;
    }
    endpoints.push({
      branchId: Number.isFinite(branch.id) ? branch.id : null,
      parentId: Number.isFinite(branch.parentId) ? branch.parentId : null,
      depth: Number.isFinite(branch.depth) ? branch.depth : 0,
      stableKey: typeof branch.stableKey === 'string' ? branch.stableKey : `branch-index:${i}`,
      x: endpoint.x,
      y: endpoint.y,
      tangentDeg: Number.isFinite(tangentDeg) ? tangentDeg : null,
    });
  }
  return endpoints;
}

function getFlowerSystem() {
  if (STATE.flowerSystem && typeof STATE.flowerSystem.render === 'function') {
    return STATE.flowerSystem;
  }
  return null;
}

const LEGACY_LILY_FLOWER_KEYS = [
  'method',
  'spritePath',
  'spriteCellWidth',
  'spriteCellHeight',
  'spriteScale',
  'spriteCols',
  'spriteRows',
  'spriteRow',
  'petalCountRange',
  'alignToBranchDirection',
  'alignmentDamping',
  'petalBaseCenterDeg',
  'petalSpreadDeg',
  'displacementSpace',
  'stamenRowMode',
  'stamenFixedRow',
  'stamenCount',
  'stamenAdditionalMode',
  'stamenRowList',
  'closedUseMiddlePetalSprite',
  'pairRotationDegByRowPair',
  'pairDisplacementYByRowPair',
  'pairDisplacementXByRowPair',
  'hoverAmplitudeDegRange',
  'hoverSpeedRange',
];

function isPlainObjectLiteral(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function ensureFlowerConfigShapeInPlace(flowersConfig) {
  if (!isPlainObjectLiteral(flowersConfig)) {
    return;
  }

  if (!isPlainObjectLiteral(flowersConfig.types)) {
    flowersConfig.types = {};
  }
  if (!isPlainObjectLiteral(flowersConfig.types.lily)) {
    flowersConfig.types.lily = {};
  }

  const lilyTypeConfig = flowersConfig.types.lily;
  for (let i = 0; i < LEGACY_LILY_FLOWER_KEYS.length; i += 1) {
    const key = LEGACY_LILY_FLOWER_KEYS[i];
    if (flowersConfig[key] !== undefined && lilyTypeConfig[key] === undefined) {
      lilyTypeConfig[key] = flowersConfig[key];
    }
  }

  if (flowersConfig.assignmentMode !== 'mixed') {
    flowersConfig.assignmentMode = 'single';
  }
  if (typeof flowersConfig.singleType !== 'string' || flowersConfig.singleType.length === 0) {
    flowersConfig.singleType = 'lily';
  }
  if (!isPlainObjectLiteral(flowersConfig.mixRatios)) {
    flowersConfig.mixRatios = { lily: 1 };
  }
  if (!isPlainObjectLiteral(flowersConfig.performance)) {
    flowersConfig.performance = {};
  }
  if (flowersConfig.performance.activeLayerCacheEnabled === undefined) {
    flowersConfig.performance.activeLayerCacheEnabled = true;
  } else {
    flowersConfig.performance.activeLayerCacheEnabled = flowersConfig.performance.activeLayerCacheEnabled !== false;
  }
  flowersConfig.performance.logEnabled = flowersConfig.performance.logEnabled === true;
  {
    const logIntervalMs = Number(flowersConfig.performance.logIntervalMs);
    flowersConfig.performance.logIntervalMs = Number.isFinite(logIntervalMs)
      ? Math.max(100, logIntervalMs)
      : 1000;
  }
}

function normalizeFlowerOptionPatch(nextOptions) {
  if (!isPlainObjectLiteral(nextOptions)) {
    return {};
  }

  const patch = {};
  const legacyLilyPatch = {};

  const keys = Object.keys(nextOptions);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = nextOptions[key];

    if (LEGACY_LILY_FLOWER_KEYS.includes(key)) {
      legacyLilyPatch[key] = value;
      continue;
    }

    if (key === 'types' && isPlainObjectLiteral(value)) {
      const typesPatch = {};
      const typeKeys = Object.keys(value);
      for (let t = 0; t < typeKeys.length; t += 1) {
        const typeKey = typeKeys[t];
        const typeValue = value[typeKey];
        typesPatch[typeKey] = isPlainObjectLiteral(typeValue) ? { ...typeValue } : typeValue;
      }
      patch.types = typesPatch;
      continue;
    }

    if (key === 'mixRatios' && isPlainObjectLiteral(value)) {
      patch.mixRatios = { ...value };
      continue;
    }

    if (key === 'performance' && isPlainObjectLiteral(value)) {
      patch.performance = { ...value };
      continue;
    }

    patch[key] = value;
  }

  if (Object.keys(legacyLilyPatch).length > 0) {
    if (!isPlainObjectLiteral(patch.types)) {
      patch.types = {};
    }
    const lilyPatch = isPlainObjectLiteral(patch.types.lily)
      ? { ...patch.types.lily }
      : {};
    Object.assign(lilyPatch, legacyLilyPatch);
    patch.types.lily = lilyPatch;
  }

  return patch;
}

function mergeFlowerOptionsInPlace(target, patch) {
  if (!isPlainObjectLiteral(target) || !isPlainObjectLiteral(patch)) {
    return;
  }

  if (isPlainObjectLiteral(patch.types)) {
    if (!isPlainObjectLiteral(target.types)) {
      target.types = {};
    }
    const typeKeys = Object.keys(patch.types);
    for (let i = 0; i < typeKeys.length; i += 1) {
      const typeKey = typeKeys[i];
      const patchTypeValue = patch.types[typeKey];
      if (isPlainObjectLiteral(patchTypeValue)) {
        if (!isPlainObjectLiteral(target.types[typeKey])) {
          target.types[typeKey] = {};
        }
        Object.assign(target.types[typeKey], patchTypeValue);
      } else {
        target.types[typeKey] = patchTypeValue;
      }
    }
  }

  if (isPlainObjectLiteral(patch.mixRatios)) {
    target.mixRatios = { ...patch.mixRatios };
  }
  if (isPlainObjectLiteral(patch.performance)) {
    if (!isPlainObjectLiteral(target.performance)) {
      target.performance = {};
    }
    Object.assign(target.performance, patch.performance);
  }

  const keys = Object.keys(patch);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (
      key === 'types'
      || key === 'mixRatios'
      || key === 'performance'
      || LEGACY_LILY_FLOWER_KEYS.includes(key)
    ) {
      continue;
    }
    target[key] = patch[key];
  }
}

async function loadFlowerSpriteIntoSystem() {
  const flowerSystem = getFlowerSystem();
  if (!flowerSystem) {
    return;
  }

  ensureFlowerConfigShapeInPlace(CONFIG.flowers);

  try {
    if (typeof flowerSystem.loadAssets === 'function') {
      await flowerSystem.loadAssets(getFlowersRuntimeConfig());
      return;
    }

    const lilyConfig = CONFIG.flowers && CONFIG.flowers.types && CONFIG.flowers.types.lily
      ? CONFIG.flowers.types.lily
      : null;
    const spritePath = (
      lilyConfig && typeof lilyConfig.spritePath === 'string' && lilyConfig.spritePath.length > 0
    )
      ? lilyConfig.spritePath
      : './lily_sprite.png';
    await flowerSystem.loadSprite(spritePath);
  } catch (error) {
    console.warn(error.message + ' | Flowers disabled because sprite failed to load.');
  }
}

function rebuildEndpointFlowers() {
  const flowerSystem = getFlowerSystem();
  if (!flowerSystem) {
    return;
  }
  ensureFlowerConfigShapeInPlace(CONFIG.flowers);
  flowerSystem.setEndpoints(STATE.branchEndpoints, getFlowersRuntimeConfig());
}

function refreshBranchEndpointsAndFlowerSystem() {
  STATE.branchEndpoints = collectBranchEndpoints();
  rebuildEndpointFlowers();
}

function shouldRenderEndpointFlowers() {
  if (!CONFIG.flowers || CONFIG.flowers.enabled !== true) {
    return false;
  }
  const flowerSystem = getFlowerSystem();
  if (!flowerSystem || !flowerSystem.hasRenderableFlowers()) {
    return false;
  }
  if (!CONFIG.animation.enabled) {
    return true;
  }
  const totalTimeSec = getAnimationTotalTimeSec();
  if (totalTimeSec <= 0) {
    return true;
  }
  return STATE.animation.elapsedSec >= totalTimeSec - 1e-6;
}

function maybeLogFlowerPerformance(nowMs) {
  ensureFlowerConfigShapeInPlace(CONFIG.flowers);
  const perfConfig = CONFIG.flowers && CONFIG.flowers.performance
    ? CONFIG.flowers.performance
    : null;
  if (!perfConfig || perfConfig.logEnabled !== true) {
    return;
  }

  const flowerSystem = getFlowerSystem();
  if (!flowerSystem || typeof flowerSystem.getPerformanceSnapshot !== 'function') {
    return;
  }

  const intervalMs = Number.isFinite(perfConfig.logIntervalMs)
    ? Math.max(100, perfConfig.logIntervalMs)
    : 1000;
  const now = Number.isFinite(nowMs) ? nowMs : performance.now();
  if (
    Number.isFinite(STATE.flowerPerfLastLogMs)
    && STATE.flowerPerfLastLogMs > 0
    && (now - STATE.flowerPerfLastLogMs) < intervalMs
  ) {
    return;
  }

  const snapshot = flowerSystem.getPerformanceSnapshot();
  if (!snapshot) {
    return;
  }
  STATE.flowerPerfLastLogMs = now;
  console.log(
    '[FlowersPerf]',
    `active=${snapshot.activeFlowerCount}/${snapshot.flowerCount}`,
    `avgUpdateMs=${snapshot.avgUpdateMs.toFixed(3)}`,
    `avgDrawMs=${snapshot.avgDrawMs.toFixed(3)}`,
    `simHz=${Number(snapshot.simStepsPerSecond || 0).toFixed(2)}`,
    `simStepMs=${Number(snapshot.simStepMsAvg || 0).toFixed(3)}`,
    `interpFrames=${Math.floor(Number(snapshot.interpolatedFrames) || 0)}`,
    `staticRebuilds=${snapshot.staticLayerRebuildCount}`,
    `avgStaticRebuildMs=${snapshot.avgStaticLayerRebuildMs.toFixed(3)}`,
  );
}

function drawEndpointFlowers(nowMs) {
  const flowerSystem = getFlowerSystem();
  if (!flowerSystem) {
    return null;
  }
  ensureFlowerConfigShapeInPlace(CONFIG.flowers);
  const result = flowerSystem.render(ctx, getFlowersRuntimeConfig(), nowMs);
  maybeLogFlowerPerformance(nowMs);
  return result && typeof result === 'object' ? result : null;
}

function cancelFlowerInteractionFrame() {
  if (STATE.flowerInteractionRafId !== null) {
    cancelAnimationFrame(STATE.flowerInteractionRafId);
    STATE.flowerInteractionRafId = null;
  }
  STATE.nextInteractionFrameDueMs = 0;
}

function shouldKeepFlowerInteractionLoopAlive() {
  if (STATE.animation.running) {
    return false;
  }

  const leavesConfig = resolveLeavesConfig(CONFIG.leaves || {});
  if (isLeafSwayActive(leavesConfig)) {
    return true;
  }

  if (!shouldRenderEndpointFlowers()) {
    return false;
  }
  const flowerSystem = getFlowerSystem();
  return Boolean(flowerSystem && flowerSystem.needsContinuousFrames());
}

function scheduleFlowerInteractionFrame(force = false) {
  if (STATE.animation.running || STATE.flowerInteractionRafId !== null) {
    return;
  }
  if (!force && !shouldKeepFlowerInteractionLoopAlive()) {
    return;
  }
  STATE.flowerInteractionRafId = requestAnimationFrame(stepFlowerInteractionFrame);
}

function syncFlowerInteractionLoop() {
  if (shouldKeepFlowerInteractionLoopAlive()) {
    scheduleFlowerInteractionFrame(false);
    return;
  }
  cancelFlowerInteractionFrame();
}

function stepFlowerInteractionFrame(timestampMs) {
  STATE.flowerInteractionRafId = null;
  if (STATE.animation.running) {
    return;
  }
  const nowMs = Number.isFinite(timestampMs) ? timestampMs : performance.now();
  const maxSwayFps = resolveGlobalMaxSwayFps();
  if (maxSwayFps > 0 && isSwayFastPathEnabled()) {
    const minFrameMs = 1000 / maxSwayFps;
    const dueMs = Number.isFinite(STATE.nextInteractionFrameDueMs) ? STATE.nextInteractionFrameDueMs : 0;
    if (dueMs > 0 && nowMs < dueMs - 0.5) {
      scheduleFlowerInteractionFrame(false);
      return;
    }
    const nextDue = (dueMs > 0)
      ? (dueMs + minFrameMs)
      : (nowMs + minFrameMs);
    STATE.nextInteractionFrameDueMs = Math.max(nowMs, nextDue);
  } else {
    STATE.nextInteractionFrameDueMs = 0;
  }
  STATE.lastInteractionRenderMs = nowMs;
  renderScene({ skipAutoStart: true, timestampMs: nowMs });
}

// =========================
// 12) Draw Helpers
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

function getBrushGlobalHueDeg(brushConfig) {
  const hueDeg = Number(brushConfig.globalHueDeg);
  return Number.isFinite(hueDeg) ? hueDeg : 0;
}

function getBrushGlobalBrightness(brushConfig) {
  const brightness = Number(brushConfig.globalBrightness);
  if (!Number.isFinite(brightness)) {
    return 1;
  }
  return Math.max(0, brightness);
}

function isBranchFilterRandomizationEnabled(brushConfig) {
  return Boolean(brushConfig.randomizeBranchFilter);
}

function getBrushRandomHueRangeDeg(brushConfig) {
  const minCandidate = Number(brushConfig.randomHueMinDeg);
  const maxCandidate = Number(brushConfig.randomHueMaxDeg);
  const minDeg = Number.isFinite(minCandidate) ? minCandidate : 0;
  const maxDeg = Number.isFinite(maxCandidate) ? maxCandidate : 0;
  return minDeg <= maxDeg ? [minDeg, maxDeg] : [maxDeg, minDeg];
}

function getBrushRandomBrightnessRange(brushConfig) {
  const minCandidate = Number(brushConfig.randomBrightnessMin);
  const maxCandidate = Number(brushConfig.randomBrightnessMax);
  const minBrightness = Number.isFinite(minCandidate) ? Math.max(0, minCandidate) : 1;
  const maxBrightness = Number.isFinite(maxCandidate) ? Math.max(0, maxCandidate) : 1;
  return minBrightness <= maxBrightness
    ? [minBrightness, maxBrightness]
    : [maxBrightness, minBrightness];
}

function getBrushRandomFilterVariantCount(brushConfig) {
  const count = Number(brushConfig.randomFilterVariantCount);
  if (!Number.isFinite(count)) {
    return 24;
  }
  return clamp(Math.round(count), 1, 512);
}

function getBrushRandomFilterAssignmentMode(brushConfig) {
  return brushConfig.randomFilterAssignmentMode === 'inheritParent'
    ? 'inheritParent'
    : 'perBranch';
}

function getBranchStableToken(branch, fallbackIndex = 0) {
  if (branch && typeof branch.stableKey === 'string' && branch.stableKey.length > 0) {
    return branch.stableKey;
  }
  if (branch && Number.isFinite(branch.id)) {
    return `id:${branch.id}`;
  }
  return `idx:${fallbackIndex}`;
}

function buildRandomBranchFilterVariants(brushConfig) {
  const [hueMinDeg, hueMaxDeg] = getBrushRandomHueRangeDeg(brushConfig);
  const [brightnessMin, brightnessMax] = getBrushRandomBrightnessRange(brushConfig);
  const variantCount = getBrushRandomFilterVariantCount(brushConfig);
  const seedKey = [
    hueMinDeg.toFixed(4),
    hueMaxDeg.toFixed(4),
    brightnessMin.toFixed(4),
    brightnessMax.toFixed(4),
    variantCount,
  ].join('|');
  const rng = mulberry32(hashSeed(`branch-filter-variants|${seedKey}`));
  const variants = [];
  for (let i = 0; i < variantCount; i += 1) {
    variants.push({
      hueDeg: sampleRangeValue(hueMinDeg, hueMaxDeg, rng),
      brightness: sampleRangeValue(brightnessMin, brightnessMax, rng),
    });
  }
  return variants;
}

function sampleRangeValue(rangeMin, rangeMax, rng) {
  if (!Number.isFinite(rangeMin) || !Number.isFinite(rangeMax)) {
    return 0;
  }
  if (Math.abs(rangeMax - rangeMin) <= 1e-8) {
    return rangeMin;
  }
  return rangeMin + (rangeMax - rangeMin) * rng();
}

function getBranchFilterValues(branch, brushConfig) {
  const globalHueDeg = getBrushGlobalHueDeg(brushConfig);
  const globalBrightness = getBrushGlobalBrightness(brushConfig);
  const branchHueDeg = branch && Number.isFinite(branch.filterHueDeg) ? branch.filterHueDeg : 0;
  const branchBrightness = branch && Number.isFinite(branch.filterBrightness)
    ? Math.max(0, branch.filterBrightness)
    : 1;
  return {
    hueDeg: globalHueDeg + branchHueDeg,
    brightness: Math.max(0, globalBrightness * branchBrightness),
  };
}

function resetFilteredStemTextureCache() {
  STATE.filteredStemTextureCache = new WeakMap();
  if (!STATE.branchGarden || !Array.isArray(STATE.branchGarden.branches)) {
    return;
  }
  for (let i = 0; i < STATE.branchGarden.branches.length; i += 1) {
    const branch = STATE.branchGarden.branches[i];
    if (!branch) {
      continue;
    }
    branch.filteredStemImage = null;
    branch.filteredStemImageFlipped = null;
  }
}

function quantizeFilterValue(value, step) {
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value / safeStep) * safeStep;
}

function ensureFilteredTextureBucket(sourceImage) {
  if (!sourceImage) {
    return null;
  }
  let bucket = STATE.filteredStemTextureCache.get(sourceImage);
  if (!bucket) {
    bucket = new Map();
    STATE.filteredStemTextureCache.set(sourceImage, bucket);
  }
  return bucket;
}

function getPrecomputedFilteredTexture(sourceImage, hueDeg, brightness) {
  if (!sourceImage) {
    return sourceImage;
  }

  const normalizedBrightness = Number.isFinite(brightness) ? Math.max(0, brightness) : 1;
  const normalizedHue = Number.isFinite(hueDeg) ? hueDeg : 0;
  const qHue = quantizeFilterValue(normalizedHue, FILTER_CACHE_HUE_STEP_DEG);
  const qBrightness = quantizeFilterValue(normalizedBrightness, FILTER_CACHE_BRIGHTNESS_STEP);

  if (Math.abs(qHue) <= 1e-6 && Math.abs(qBrightness - 1) <= 1e-6) {
    return sourceImage;
  }

  const bucket = ensureFilteredTextureBucket(sourceImage);
  if (!bucket) {
    return sourceImage;
  }
  const key = `${qHue}|${qBrightness}`;
  const cached = bucket.get(key);
  if (cached) {
    return cached;
  }

  const texture = document.createElement('canvas');
  texture.width = sourceImage.width;
  texture.height = sourceImage.height;
  const tctx = texture.getContext('2d');
  if (!tctx || typeof tctx.filter !== 'string') {
    return sourceImage;
  }

  tctx.filter = `hue-rotate(${qHue}deg) brightness(${qBrightness})`;
  tctx.drawImage(sourceImage, 0, 0);
  tctx.filter = 'none';
  bucket.set(key, texture);
  return texture;
}

function assignBranchStemTextures(branch, brushConfig = CONFIG.brush) {
  if (!branch || !STATE.stemImage) {
    return { defaultImage: null, flippedImage: null };
  }

  const values = getBranchFilterValues(branch, brushConfig);
  const defaultImage = getPrecomputedFilteredTexture(STATE.stemImage, values.hueDeg, values.brightness);
  const baseFlippedImage = STATE.stemImageFlippedX || STATE.stemImage;
  const flippedImage = getPrecomputedFilteredTexture(baseFlippedImage, values.hueDeg, values.brightness);

  branch.filteredStemImage = defaultImage;
  branch.filteredStemImageFlipped = flippedImage;
  return { defaultImage, flippedImage };
}

function getBranchStemTextures(branch, brushConfig = CONFIG.brush) {
  if (!branch || !STATE.stemImage) {
    return { defaultImage: null, flippedImage: null };
  }
  if (branch.filteredStemImage && branch.filteredStemImageFlipped) {
    return {
      defaultImage: branch.filteredStemImage,
      flippedImage: branch.filteredStemImageFlipped,
    };
  }
  return assignBranchStemTextures(branch, brushConfig);
}

function isBrushThicknessTaperEnabled(brushConfig) {
  if (!brushConfig || typeof brushConfig !== 'object') {
    return true;
  }
  if (brushConfig.thicknessTaperEnabled === undefined) {
    return true;
  }
  return Boolean(brushConfig.thicknessTaperEnabled);
}

function getBrushThicknessMinScale(brushConfig) {
  if (!brushConfig || typeof brushConfig !== 'object') {
    return 0.1;
  }
  const minScale = Number(brushConfig.thicknessMinScale);
  if (!Number.isFinite(minScale)) {
    return 0.1;
  }
  return clamp(minScale, 0.01, 1);
}

function getBrushThicknessTaperExponent(brushConfig) {
  if (!brushConfig || typeof brushConfig !== 'object') {
    return 1;
  }
  const exponent = Number(brushConfig.thicknessTaperExponent);
  if (!Number.isFinite(exponent)) {
    return 1;
  }
  return Math.max(0.01, exponent);
}

function getBrushThicknessMinWidth(brushConfig) {
  if (!brushConfig || typeof brushConfig !== 'object') {
    return 0;
  }
  const minWidth = Number(brushConfig.thicknessMinWidth);
  if (!Number.isFinite(minWidth)) {
    return 0;
  }
  return Math.max(0, minWidth);
}

function getBranchThicknessBaseScale(branch) {
  if (!branch || !Number.isFinite(branch.thicknessBaseScale)) {
    return 1;
  }
  return Math.max(0.01, branch.thicknessBaseScale);
}

function getThicknessTaperFactorAtDistance(distanceOnPath, referenceLength, brushConfig) {
  if (!isBrushThicknessTaperEnabled(brushConfig)) {
    return 1;
  }
  const minScale = getBrushThicknessMinScale(brushConfig);
  const safeReferenceLength = Number.isFinite(referenceLength)
    ? Math.max(1e-6, referenceLength)
    : 1;
  const normalizedDistance = clamp(
    Number.isFinite(distanceOnPath) ? distanceOnPath / safeReferenceLength : 1,
    0,
    1,
  );
  const exponent = getBrushThicknessTaperExponent(brushConfig);
  const weightedDistance = exponent === 1
    ? normalizedDistance
    : Math.pow(normalizedDistance, exponent);
  return 1 + (minScale - 1) * weightedDistance;
}

function getBrushCacheKey(brushConfig) {
  const brushScale = getBrushScale(brushConfig);
  const stripWidth = Number.isFinite(Number(brushConfig.stripWidth))
    ? Math.max(0.1, Number(brushConfig.stripWidth))
    : 0.1;
  const repeatOverlap = Number.isFinite(Number(brushConfig.repeatOverlap))
    ? Number(brushConfig.repeatOverlap)
    : 0;
  const repeatGap = Number.isFinite(Number(brushConfig.repeatGap))
    ? Number(brushConfig.repeatGap)
    : 0;
  const startOffset = Number.isFinite(Number(brushConfig.startOffset))
    ? Number(brushConfig.startOffset)
    : 0;
  const pathOffset = Number.isFinite(Number(brushConfig.pathOffset))
    ? Number(brushConfig.pathOffset)
    : 0;
  const cropPartialRepeat = brushConfig.cropPartialRepeat ? 1 : 0;
  return [
    brushScale,
    stripWidth,
    repeatOverlap,
    repeatGap,
    startOffset,
    pathOffset,
    cropPartialRepeat,
  ].join('|');
}

function getBranchRenderCache(branch) {
  if (!branch) {
    return null;
  }
  if (!branch.renderCache || typeof branch.renderCache !== 'object') {
    branch.renderCache = {
      valid: false,
      samples: [],
      distances: [],
      centerX: [],
      centerY: [],
      cacheKey: '',
      pathDataRef: null,
      defaultImageRef: null,
      flippedImageRef: null,
    };
  }
  return branch.renderCache;
}

function invalidateBranchStripCache(branch) {
  const cache = getBranchRenderCache(branch);
  if (!cache) {
    return;
  }
  cache.valid = false;
  cache.pathDataRef = null;
  cache.defaultImageRef = null;
  cache.flippedImageRef = null;
}

function invalidateAllBranchStripCaches() {
  if (!STATE.branchGarden || !Array.isArray(STATE.branchGarden.branches)) {
    return;
  }
  for (let i = 0; i < STATE.branchGarden.branches.length; i += 1) {
    invalidateBranchStripCache(STATE.branchGarden.branches[i]);
  }
}

function ensureCompletedBranchLayer() {
  const layer = STATE.completedLayer;
  if (!layer.canvas) {
    layer.canvas = document.createElement('canvas');
    layer.ctx = layer.canvas.getContext('2d');
  }

  const desiredWidth = canvas.width;
  const desiredHeight = canvas.height;
  if (layer.canvas.width !== desiredWidth || layer.canvas.height !== desiredHeight) {
    layer.canvas.width = desiredWidth;
    layer.canvas.height = desiredHeight;
    layer.committedBranchIds.clear();
  }

  if (layer.ctx) {
    layer.ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  }
  return layer;
}

function invalidateCompletedBranchLayer() {
  const layer = STATE.completedLayer;
  layer.committedBranchIds.clear();
  layer.leavesConfigKey = '';
  if (!layer.canvas || !layer.ctx) {
    return;
  }
  layer.ctx.setTransform(1, 0, 0, 1, 0, 0);
  layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
  layer.ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  invalidateLeafOverlayCache();
}

function invalidateLeafOverlayCache() {
  const cache = STATE.leafOverlayCache;
  cache.valid = false;
  cache.layoutKey = '';
  cache.branchCount = 0;
  cache.branchPathRefs.length = 0;
  cache.leaves.length = 0;
}

function ensureLeafOverlayCache(leavesConfig) {
  const cache = STATE.leafOverlayCache;
  const branches = STATE.branchGarden && Array.isArray(STATE.branchGarden.branches)
    ? STATE.branchGarden.branches
    : [];
  let mustRebuild = cache.valid !== true || cache.layoutKey !== leavesConfig.layoutKey;
  if (!mustRebuild) {
    if (cache.branchCount !== branches.length || cache.branchPathRefs.length !== branches.length) {
      mustRebuild = true;
    } else {
      for (let i = 0; i < branches.length; i += 1) {
        const branch = branches[i];
        const pathRef = branch ? branch.pathData : null;
        if (cache.branchPathRefs[i] !== pathRef) {
          mustRebuild = true;
          break;
        }
      }
    }
  }
  if (!mustRebuild) {
    return cache;
  }

  cache.leaves.length = 0;
  cache.branchPathRefs.length = 0;
  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    cache.branchPathRefs.push(branch ? branch.pathData : null);
    if (!branch || !branch.pathData) {
      continue;
    }
    const leaves = ensureBranchLeaves(branch, leavesConfig, i);
    if (!Array.isArray(leaves) || leaves.length === 0) {
      continue;
    }
    for (let j = 0; j < leaves.length; j += 1) {
      cache.leaves.push(leaves[j]);
    }
  }
  cache.layoutKey = leavesConfig.layoutKey;
  cache.branchCount = branches.length;
  cache.valid = true;
  return cache;
}

function getBranchRenderId(branch) {
  if (branch && Number.isFinite(branch.id)) {
    return `id:${branch.id}`;
  }
  return `stable:${branch && branch.stableKey ? branch.stableKey : 'unknown'}`;
}

function resolveLeavesConfig(leavesConfigCandidate = CONFIG.leaves || {}) {
  const safeConfig = isPlainObjectLiteral(leavesConfigCandidate) ? leavesConfigCandidate : {};
  const enabled = safeConfig.enabled !== false;
  const deterministic = safeConfig.deterministic !== false;
  const spritePath = (typeof safeConfig.spritePath === 'string' && safeConfig.spritePath.length > 0)
    ? safeConfig.spritePath
    : './leaves_new.png';
  const spriteCellWidth = Number.isFinite(Number(safeConfig.spriteCellWidth))
    ? Math.max(1, Number(safeConfig.spriteCellWidth))
    : 44;
  const spriteCellHeight = Number.isFinite(Number(safeConfig.spriteCellHeight))
    ? Math.max(1, Number(safeConfig.spriteCellHeight))
    : 45.819;
  const spriteScale = Number.isFinite(Number(safeConfig.spriteScale))
    ? Math.max(0.01, Number(safeConfig.spriteScale))
    : 8.3333333;
  const spriteCols = Number.isFinite(Number(safeConfig.spriteCols))
    ? Math.max(1, Math.floor(Number(safeConfig.spriteCols)))
    : 10;
  const spriteRows = Number.isFinite(Number(safeConfig.spriteRows))
    ? Math.max(1, Math.floor(Number(safeConfig.spriteRows)))
    : 8;
  const spriteRowRangeInput = Array.isArray(safeConfig.spriteRowRange) ? safeConfig.spriteRowRange : null;
  let spriteRowMinOneBased = NaN;
  let spriteRowMaxOneBased = NaN;
  if (spriteRowRangeInput && spriteRowRangeInput.length >= 2) {
    const rowA = Number(spriteRowRangeInput[0]);
    const rowB = Number(spriteRowRangeInput[1]);
    if (Number.isFinite(rowA) && Number.isFinite(rowB)) {
      spriteRowMinOneBased = clamp(Math.floor(Math.min(rowA, rowB)), 1, spriteRows);
      spriteRowMaxOneBased = clamp(Math.floor(Math.max(rowA, rowB)), 1, spriteRows);
    }
  }
  if (!Number.isFinite(spriteRowMinOneBased) || !Number.isFinite(spriteRowMaxOneBased)) {
    const spriteRowOneBasedInput = Number(safeConfig.spriteRow);
    const spriteRowOneBased = Number.isFinite(spriteRowOneBasedInput)
      ? clamp(Math.floor(spriteRowOneBasedInput), 1, spriteRows)
      : clamp(5, 1, spriteRows);
    spriteRowMinOneBased = spriteRowOneBased;
    spriteRowMaxOneBased = spriteRowOneBased;
  }
  const spriteRowMinIndex = spriteRowMinOneBased - 1;
  const spriteRowMaxIndex = spriteRowMaxOneBased - 1;
  const drawSizeRangeRaw = resolveRangeValue(
    safeConfig.drawSizeRange,
    safeConfig.drawSize,
    70,
    70,
    70,
  );
  const drawSizeRange = [
    Math.max(1, drawSizeRangeRaw[0]),
    Math.max(1, drawSizeRangeRaw[1]),
  ];
  drawSizeRange.sort((a, b) => a - b);
  const drawSize = drawSizeRange[0];
  const drawSizeBaseMultiplierInput = Number(safeConfig.drawSizeBaseMultiplier);
  const drawSizeBaseMultiplier = Number.isFinite(drawSizeBaseMultiplierInput)
    ? Math.max(0.01, drawSizeBaseMultiplierInput)
    : 1;
  const drawSizeBaseMultiplierEaseInInput = Number(safeConfig.drawSizeBaseMultiplierEaseIn);
  const drawSizeBaseMultiplierEaseIn = Number.isFinite(drawSizeBaseMultiplierEaseInInput)
    ? clamp(drawSizeBaseMultiplierEaseInInput, 0, 1)
    : 0;
  const swayEnabled = safeConfig.swayEnabled !== false;
  const swayMode = resolveGlobalSwayMode();
  const swayInteractionRadiusFactor = Number.isFinite(Number(safeConfig.swayInteractionRadiusFactor))
    ? Math.max(0, Number(safeConfig.swayInteractionRadiusFactor))
    : 2.1;
  const swayRiseSpeed = Number.isFinite(Number(safeConfig.swayRiseSpeed))
    ? Math.max(0, Number(safeConfig.swayRiseSpeed))
    : 5.5;
  const swayFallSpeed = Number.isFinite(Number(safeConfig.swayFallSpeed))
    ? Math.max(0, Number(safeConfig.swayFallSpeed))
    : 0.5;
  const swayEpsilon = Number.isFinite(Number(safeConfig.swayEpsilon))
    ? Math.max(0, Number(safeConfig.swayEpsilon))
    : 0.0008;
  const mouseSpeedSwayAffect = Number.isFinite(Number(safeConfig.mouseSpeedSwayAffect))
    ? Math.max(0, Number(safeConfig.mouseSpeedSwayAffect))
    : 0.7;
  const swayAmplitudeDegRange = normalizeRangeInput(safeConfig.swayAmplitudeDegRange, 0.8, 2.6);
  const swaySpeedRange = normalizeRangeInput(safeConfig.swaySpeedRange, 0.7, 1.6);
  const countRangeRaw = normalizeRangeInput(safeConfig.countRange, 8, 16);
  const countRange = [
    Math.max(0, Math.floor(countRangeRaw[0])),
    Math.max(0, Math.floor(countRangeRaw[1])),
  ];
  countRange.sort((a, b) => a - b);
  const spawnTMinInput = Number(safeConfig.spawnTMin);
  const spawnTMaxInput = Number(safeConfig.spawnTMax);
  const spawnTMinRaw = Number.isFinite(spawnTMinInput) ? spawnTMinInput : 0.08;
  const spawnTMaxRaw = Number.isFinite(spawnTMaxInput) ? spawnTMaxInput : 0.94;
  const spawnTMin = clamp(Math.min(spawnTMinRaw, spawnTMaxRaw), 0, 1);
  const spawnTMax = clamp(Math.max(spawnTMinRaw, spawnTMaxRaw), 0, 1);
  const spawnBiasMode = sanitizeLeafSpawnBiasMode(safeConfig.spawnBiasMode);
  const spawnBiasExponentInput = Number(safeConfig.spawnBiasExponent);
  const spawnBiasExponent = Number.isFinite(spawnBiasExponentInput)
    ? Math.max(0.01, spawnBiasExponentInput)
    : 1.6;
  const minSpawnSpacingTInput = Number(safeConfig.minSpawnSpacingT);
  const minSpawnSpacingT = Number.isFinite(minSpawnSpacingTInput)
    ? clamp(minSpawnSpacingTInput, 0, 1)
    : 0.03;
  const maxSpawnAttemptsPerLeafInput = Number(safeConfig.maxSpawnAttemptsPerLeaf);
  const maxSpawnAttemptsPerLeaf = Number.isFinite(maxSpawnAttemptsPerLeafInput)
    ? Math.max(1, Math.floor(maxSpawnAttemptsPerLeafInput))
    : 40;
  const sideMode = sanitizeSideMode(safeConfig.sideMode);
  const rotationAwayFromNormalDegRange = normalizeRangeInput(
    safeConfig.rotationAwayFromNormalDegRange,
    -22,
    22,
  );
  const layoutKey = [
    enabled ? 1 : 0,
    deterministic ? 1 : 0,
    countRange[0],
    countRange[1],
    spawnTMin,
    spawnTMax,
    spawnBiasMode,
    spawnBiasExponent,
    minSpawnSpacingT,
    maxSpawnAttemptsPerLeaf,
    sideMode,
  ].join('|');
  const appearanceKey = [
    spritePath,
    spriteCellWidth,
    spriteCellHeight,
    spriteScale,
    spriteCols,
    spriteRows,
    spriteRowMinIndex,
    spriteRowMaxIndex,
    drawSizeRange[0],
    drawSizeRange[1],
    drawSizeBaseMultiplier,
    drawSizeBaseMultiplierEaseIn,
    swayEnabled ? 1 : 0,
    swayMode,
    swayInteractionRadiusFactor,
    swayRiseSpeed,
    swayFallSpeed,
    swayEpsilon,
    mouseSpeedSwayAffect,
    swayAmplitudeDegRange[0],
    swayAmplitudeDegRange[1],
    swaySpeedRange[0],
    swaySpeedRange[1],
    rotationAwayFromNormalDegRange[0],
    rotationAwayFromNormalDegRange[1],
  ].join('|');
  const cacheKey = `${layoutKey}||${appearanceKey}`;

  return {
    enabled,
    deterministic,
    spritePath,
    spriteCellWidth,
    spriteCellHeight,
    spriteScale,
    spriteCols,
    spriteRows,
    spriteRowMinIndex,
    spriteRowMaxIndex,
    drawSize,
    drawSizeRange,
    drawSizeBaseMultiplier,
    drawSizeBaseMultiplierEaseIn,
    swayEnabled,
    swayMode,
    swayInteractionRadiusFactor,
    swayRiseSpeed,
    swayFallSpeed,
    swayEpsilon,
    mouseSpeedSwayAffect,
    swayAmplitudeDegRange,
    swaySpeedRange,
    countRange,
    spawnTMin,
    spawnTMax,
    spawnBiasMode,
    spawnBiasExponent,
    minSpawnSpacingT,
    maxSpawnAttemptsPerLeaf,
    sideMode,
    rotationAwayFromNormalDegRange,
    layoutKey,
    appearanceKey,
    cacheKey,
  };
}

function getLeafSpriteSourceRect(leavesConfig, col, row = leavesConfig.spriteRowMinIndex) {
  const safeCol = clamp(
    Math.floor(Number.isFinite(col) ? col : 0),
    0,
    Math.max(0, leavesConfig.spriteCols - 1),
  );
  const safeRow = clamp(
    Math.floor(Number.isFinite(row) ? row : leavesConfig.spriteRowMinIndex),
    0,
    Math.max(0, leavesConfig.spriteRows - 1),
  );
  return {
    sx: safeCol * leavesConfig.spriteCellWidth * leavesConfig.spriteScale,
    sy: safeRow * leavesConfig.spriteCellHeight * leavesConfig.spriteScale,
    sw: leavesConfig.spriteCellWidth * leavesConfig.spriteScale,
    sh: leavesConfig.spriteCellHeight * leavesConfig.spriteScale,
  };
}

function getBranchLeafCache(branch) {
  if (!branch) {
    return null;
  }
  if (!branch.leafCache || typeof branch.leafCache !== 'object') {
    branch.leafCache = {
      pathDataRef: null,
      layoutKey: '',
      appearanceKey: '',
      leaves: [],
      bounds: null,
    };
  }
  return branch.leafCache;
}

function resolveBranchStemHalfWidth(branch, distanceOnPath, referenceLength, brushConfig = CONFIG.brush) {
  if (!branch || !STATE.stemImage) {
    return 0;
  }
  const branchTextures = getBranchStemTextures(branch, brushConfig);
  const sourceImage = branchTextures && branchTextures.defaultImage
    ? branchTextures.defaultImage
    : STATE.stemImage;
  if (!sourceImage || !Number.isFinite(sourceImage.width) || sourceImage.width <= 0) {
    return 0;
  }

  const brushScale = getBrushScale(brushConfig);
  const branchThicknessBaseScale = getBranchThicknessBaseScale(branch);
  const taperFactor = getThicknessTaperFactorAtDistance(distanceOnPath, referenceLength, brushConfig);
  let widthOnPath = sourceImage.width * brushScale * branchThicknessBaseScale * taperFactor;
  if (isBrushThicknessTaperEnabled(brushConfig)) {
    const minWidth = getBrushThicknessMinWidth(brushConfig);
    if (minWidth > 0) {
      widthOnPath = Math.max(widthOnPath, minWidth);
    }
  }
  return Math.max(0, widthOnPath * 0.5);
}

function sampleLeafSpawnT(leavesConfig, rng) {
  const span = leavesConfig.spawnTMax - leavesConfig.spawnTMin;
  if (span <= 1e-8) {
    return leavesConfig.spawnTMin;
  }

  const u = clamp(rng(), 0, 1);
  let biased = u;
  if (leavesConfig.spawnBiasMode === 'towardBase') {
    biased = Math.pow(u, leavesConfig.spawnBiasExponent);
  } else if (leavesConfig.spawnBiasMode === 'towardTip') {
    biased = 1 - Math.pow(1 - u, leavesConfig.spawnBiasExponent);
  }
  return leavesConfig.spawnTMin + span * biased;
}

function isLeafSwayActive(leavesConfig = resolveLeavesConfig(CONFIG.leaves || {})) {
  if (!leavesConfig || leavesConfig.enabled !== true || leavesConfig.swayEnabled !== true) {
    return false;
  }
  if (leavesConfig.swayMode !== 'always') {
    if (Number.isFinite(STATE.pointerX) && Number.isFinite(STATE.pointerY)) {
      return true;
    }
    const cachedLeaves = STATE.leafOverlayCache && Array.isArray(STATE.leafOverlayCache.leaves)
      ? STATE.leafOverlayCache.leaves
      : null;
    if (cachedLeaves && cachedLeaves.length > 0) {
      for (let i = 0; i < cachedLeaves.length; i += 1) {
        const leaf = cachedLeaves[i];
        if ((Number(leaf.hoverInfluence) || 0) > leavesConfig.swayEpsilon) {
          return true;
        }
      }
    }
    return false;
  }
  const maxAmplitudeDeg = Math.max(
    Math.abs(Number(leavesConfig.swayAmplitudeDegRange[0]) || 0),
    Math.abs(Number(leavesConfig.swayAmplitudeDegRange[1]) || 0),
  );
  const maxSpeed = Math.max(
    Math.abs(Number(leavesConfig.swaySpeedRange[0]) || 0),
    Math.abs(Number(leavesConfig.swaySpeedRange[1]) || 0),
  );
  return maxAmplitudeDeg > 1e-6 && maxSpeed > 1e-6;
}

function resolveLeafSwayInfluence(leaf, leavesConfig, nowMs) {
  if (!leaf || !leavesConfig) {
    return 0;
  }
  if (!Number.isFinite(leaf.hoverInfluence)) {
    leaf.hoverInfluence = leavesConfig.swayMode === 'always' ? 1 : 0;
  }
  if (!Number.isFinite(leaf.targetInfluence)) {
    leaf.targetInfluence = leavesConfig.swayMode === 'always' ? 1 : 0;
  }
  if (!Number.isFinite(leaf.motionTime)) {
    leaf.motionTime = 0;
  }
  if (!Number.isFinite(leaf.lastSwayUpdateMs) || leaf.lastSwayUpdateMs <= 0) {
    leaf.lastSwayUpdateMs = Number.isFinite(nowMs) ? nowMs : performance.now();
  }

  const updateNowMs = Number.isFinite(nowMs) ? nowMs : performance.now();
  const dtSec = clamp((updateNowMs - leaf.lastSwayUpdateMs) / 1000, 0, 0.05);
  leaf.lastSwayUpdateMs = updateNowMs;

  const mouseSpeedDecayPxPerSec = 2600;
  STATE.pointerSpeedPxPerSec = Math.max(0, STATE.pointerSpeedPxPerSec - (mouseSpeedDecayPxPerSec * dtSec));
  const mouseSpeedNorm = clamp((STATE.pointerSpeedPxPerSec || 0) / 1600, 0, 1);
  const mouseSwayScale = clamp(
    1 + (mouseSpeedNorm * Math.max(0, Number(leavesConfig.mouseSpeedSwayAffect) || 0)),
    1,
    8,
  );

  if (leavesConfig.swayMode === 'always') {
    leaf.targetInfluence = 1;
  } else if (!Number.isFinite(STATE.pointerX) || !Number.isFinite(STATE.pointerY)) {
    leaf.targetInfluence = 0;
  } else {
    const leafDrawSize = Number.isFinite(leaf.drawSize) ? Math.max(1, leaf.drawSize) : 1;
    const interactionRadius = leafDrawSize * Math.max(0, leavesConfig.swayInteractionRadiusFactor);
    if (interactionRadius <= 1e-6) {
      leaf.targetInfluence = 0;
    } else {
      const dx = STATE.pointerX - leaf.x;
      const dy = STATE.pointerY - leaf.y;
      const distance = Math.hypot(dx, dy);
      leaf.targetInfluence = distance >= interactionRadius ? 0 : (1 - distance / interactionRadius) * mouseSwayScale;
    }
  }

  const influenceSpeed = leaf.targetInfluence > leaf.hoverInfluence
    ? leavesConfig.swayRiseSpeed
    : leavesConfig.swayFallSpeed;
  const maxStep = Math.max(0, influenceSpeed * mouseSwayScale * dtSec);
  if (leaf.hoverInfluence < leaf.targetInfluence) {
    leaf.hoverInfluence = Math.min(leaf.hoverInfluence + maxStep, leaf.targetInfluence);
  } else {
    leaf.hoverInfluence = Math.max(leaf.hoverInfluence - maxStep, leaf.targetInfluence);
  }
  if (leaf.targetInfluence === 0 && leaf.hoverInfluence <= leavesConfig.swayEpsilon) {
    leaf.hoverInfluence = 0;
  }
  if (leaf.hoverInfluence > 0 || leaf.targetInfluence > 0) {
    leaf.motionTime += dtSec * mouseSwayScale;
  }
  return leaf.hoverInfluence;
}

function isLeafSpawnTAllowed(candidateT, placedTs, minSpawnSpacingT) {
  if (!Number.isFinite(candidateT)) {
    return false;
  }
  if (!Array.isArray(placedTs) || placedTs.length === 0 || minSpawnSpacingT <= 1e-8) {
    return true;
  }
  for (let i = 0; i < placedTs.length; i += 1) {
    if (Math.abs(placedTs[i] - candidateT) < minSpawnSpacingT) {
      return false;
    }
  }
  return true;
}

function findLeafSpawnFallbackT(leavesConfig, placedTs) {
  const minT = leavesConfig.spawnTMin;
  const maxT = leavesConfig.spawnTMax;
  const span = maxT - minT;
  if (span <= 1e-8) {
    return isLeafSpawnTAllowed(minT, placedTs, leavesConfig.minSpawnSpacingT) ? minT : null;
  }

  const spacing = Math.max(0, leavesConfig.minSpawnSpacingT);
  const step = Math.max(1e-4, spacing * 0.5, span / 512);
  const towardTip = leavesConfig.spawnBiasMode === 'towardTip';
  let t = towardTip ? maxT : minT;
  while (towardTip ? (t >= minT - 1e-8) : (t <= maxT + 1e-8)) {
    const candidate = clamp(t, minT, maxT);
    if (isLeafSpawnTAllowed(candidate, placedTs, spacing)) {
      return candidate;
    }
    t += towardTip ? -step : step;
  }

  return null;
}

function estimateLeafSpawnCapacity(leavesConfig) {
  const span = Math.max(0, leavesConfig.spawnTMax - leavesConfig.spawnTMin);
  const spacing = Math.max(0, leavesConfig.minSpawnSpacingT);
  if (span <= 1e-8) {
    return 1;
  }
  if (spacing <= 1e-8) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(1, Math.floor(span / spacing) + 1);
}

function ensureBranchLeaves(branch, leavesConfig, branchIndex = 0) {
  if (!branch || !branch.pathData || !leavesConfig || !leavesConfig.enabled) {
    return [];
  }
  const cache = getBranchLeafCache(branch);
  if (!cache) {
    return [];
  }
  if (
    cache.pathDataRef === branch.pathData
    && cache.layoutKey === leavesConfig.layoutKey
    && cache.appearanceKey === leavesConfig.appearanceKey
  ) {
    return cache.leaves;
  }

  cache.leaves.length = 0;
  const totalLength = Number.isFinite(branch.pathData.totalLength)
    ? Math.max(0, branch.pathData.totalLength)
    : 0;
  if (totalLength <= 1e-8 || leavesConfig.countRange[1] <= 0) {
    cache.pathDataRef = branch.pathData;
    cache.layoutKey = leavesConfig.layoutKey;
    cache.appearanceKey = leavesConfig.appearanceKey;
    return cache.leaves;
  }

  const stableToken = getBranchStableToken(branch, branchIndex);
  const rng = leavesConfig.deterministic
    ? mulberry32(hashSeed(`${stableToken}|leaves|${leavesConfig.layoutKey}`))
    : Math.random;
  const requestedLeafCount = sampleIntRange(leavesConfig.countRange, rng);
  const estimatedCapacity = estimateLeafSpawnCapacity(leavesConfig);
  const leafCount = Number.isFinite(estimatedCapacity)
    ? Math.max(0, Math.min(requestedLeafCount, estimatedCapacity))
    : Math.max(0, requestedLeafCount);
  const placedTs = [];

  for (let i = 0; i < leafCount; i += 1) {
    let acceptedT = null;
    for (let attempt = 0; attempt < leavesConfig.maxSpawnAttemptsPerLeaf; attempt += 1) {
      const t = sampleLeafSpawnT(leavesConfig, rng);
      if (isLeafSpawnTAllowed(t, placedTs, leavesConfig.minSpawnSpacingT)) {
        acceptedT = t;
        break;
      }
    }

    if (acceptedT === null) {
      acceptedT = findLeafSpawnFallbackT(leavesConfig, placedTs);
    }
    if (acceptedT === null) {
      continue;
    }

    placedTs.push(acceptedT);
    const distanceOnPath = acceptedT * totalLength;
    const point = getPathPointAtLength(branch.pathData, distanceOnPath);
    const tangent = normalize(getPathTangentAtLength(branch.pathData, distanceOnPath));
    const sideSign = getSideSign(leavesConfig.sideMode, i, rng);
    const outwardNormal = {
      x: -tangent.y * sideSign,
      y: tangent.x * sideSign,
    };
    const halfStemWidth = resolveBranchStemHalfWidth(branch, distanceOnPath, totalLength, CONFIG.brush);
    const baseDrawSize = sampleFloatRange(leavesConfig.drawSizeRange, rng);
    const normalizedBranchT = totalLength > 1e-8 ? clamp(distanceOnPath / totalLength, 0, 1) : 0;
    const tipEaseExponent = 1 + leavesConfig.drawSizeBaseMultiplierEaseIn * 49;
    const easedTipBlend = Math.pow(normalizedBranchT, tipEaseExponent);
    const sizeMultiplier = 1 + (leavesConfig.drawSizeBaseMultiplier - 1) * easedTipBlend;
    const drawSize = Math.max(1, baseDrawSize * sizeMultiplier);
    const attachOffset = -halfStemWidth * 0.2 + Math.max(0.5, baseDrawSize * 0.03);
    const anchorX = point.x + outwardNormal.x * attachOffset;
    const anchorY = point.y + outwardNormal.y * attachOffset;
    const rotationOffsetDeg = sampleFloatRange(leavesConfig.rotationAwayFromNormalDegRange, rng);
    const sideCompensatedOffsetDeg = rotationOffsetDeg * -sideSign;
    // Leaf sprites are authored with "up" along -Y; rotate normal-aligned +X angle by +90deg.
    const rotationRad = (
      Math.atan2(outwardNormal.y, outwardNormal.x)
      + (Math.PI * 0.5)
      + (sideCompensatedOffsetDeg * Math.PI / 180)
    );
    const col = clamp(Math.floor(rng() * leavesConfig.spriteCols), 0, leavesConfig.spriteCols - 1);
    const spriteRowCount = Math.max(1, (leavesConfig.spriteRowMaxIndex - leavesConfig.spriteRowMinIndex) + 1);
    const row = clamp(
      leavesConfig.spriteRowMinIndex + Math.floor(rng() * spriteRowCount),
      leavesConfig.spriteRowMinIndex,
      leavesConfig.spriteRowMaxIndex,
    );
    const swayRng = mulberry32(hashSeed(`${stableToken}|leaf-sway|${i}|${acceptedT.toFixed(6)}`));
    const swayAmplitudeDeg = sampleFloatRange(leavesConfig.swayAmplitudeDegRange, swayRng);
    const swaySpeed = sampleFloatRange(leavesConfig.swaySpeedRange, swayRng);
    const swayPhase = swayRng() * Math.PI * 2;

    cache.leaves.push({
      x: anchorX,
      y: anchorY,
      col,
      row,
      distanceOnPath,
      rotationRad,
      drawSize,
      swayAmplitudeRad: swayAmplitudeDeg * Math.PI / 180,
      swaySpeed,
      swayPhase,
      hoverInfluence: leavesConfig.swayMode === 'always' ? 1 : 0,
      targetInfluence: leavesConfig.swayMode === 'always' ? 1 : 0,
      motionTime: 0,
      lastSwayUpdateMs: 0,
    });
  }

  cache.leaves.sort((a, b) => a.distanceOnPath - b.distanceOnPath);
  if (cache.leaves.length > 0) {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < cache.leaves.length; i += 1) {
      const leaf = cache.leaves[i];
      const half = (Number.isFinite(leaf.drawSize) ? leaf.drawSize : leavesConfig.drawSize) * 0.9;
      minX = Math.min(minX, leaf.x - half);
      minY = Math.min(minY, leaf.y - half);
      maxX = Math.max(maxX, leaf.x + half);
      maxY = Math.max(maxY, leaf.y + half);
    }
    cache.bounds = { minX, minY, maxX, maxY };
  } else {
    cache.bounds = null;
  }
  cache.pathDataRef = branch.pathData;
  cache.layoutKey = leavesConfig.layoutKey;
  cache.appearanceKey = leavesConfig.appearanceKey;
  return cache.leaves;
}

function drawBranchLeaves(branch, leavesConfig, renderOptions = {}) {
  if (!branch || !branch.pathData || !leavesConfig || !leavesConfig.enabled || !STATE.leafImage) {
    return { drawn: 0, culled: 0 };
  }

  const targetCtx = renderOptions.targetCtx || ctx;
  if (!targetCtx) {
    return { drawn: 0, culled: 0 };
  }

  const branchIndex = Number.isFinite(renderOptions.branchIndex) ? renderOptions.branchIndex : 0;
  const nowMs = Number.isFinite(renderOptions.nowMs)
    ? renderOptions.nowMs
    : performance.now();
  const visibleLength = Number.isFinite(renderOptions.visibleLength)
    ? clamp(renderOptions.visibleLength, 0, branch.pathData.totalLength)
    : branch.pathData.totalLength;
  if (visibleLength <= 1e-8) {
    return { drawn: 0, culled: 0 };
  }

  const leafCache = getBranchLeafCache(branch);
  const leaves = ensureBranchLeaves(branch, leavesConfig, branchIndex);
  if (!Array.isArray(leaves) || leaves.length === 0) {
    return { drawn: 0, culled: 0 };
  }
  const cullingEnabled = isLeafViewportCullingEnabled();
  const coarseBounds = leafCache && leafCache.bounds ? leafCache.bounds : null;
  if (cullingEnabled && coarseBounds) {
    if (
      coarseBounds.maxX < 0
      || coarseBounds.maxY < 0
      || coarseBounds.minX > STATE.viewportWidth
      || coarseBounds.minY > STATE.viewportHeight
    ) {
      return { drawn: 0, culled: leaves.length };
    }
  }
  let drawn = 0;
  let culled = 0;

  for (let i = 0; i < leaves.length; i += 1) {
    const leaf = leaves[i];
    if (leaf.distanceOnPath > visibleLength + 1e-6) {
      break;
    }

    const drawSize = Number.isFinite(leaf.drawSize)
      ? Math.max(1, leaf.drawSize)
      : leavesConfig.drawSize;
    const drawX = -drawSize * 0.5;
    const drawY = -drawSize + ((2.2 / leavesConfig.spriteCellHeight) * drawSize);
    if (cullingEnabled) {
      const halfAabb = drawSize * 0.9;
      if (
        (leaf.x + halfAabb) < 0
        || (leaf.y + halfAabb) < 0
        || (leaf.x - halfAabb) > STATE.viewportWidth
        || (leaf.y - halfAabb) > STATE.viewportHeight
      ) {
        culled += 1;
        continue;
      }
    }
    const sourceRect = getLeafSpriteSourceRect(leavesConfig, leaf.col, leaf.row);
    const swayInfluence = resolveLeafSwayInfluence(leaf, leavesConfig, nowMs);
    const swayOffsetRad = leavesConfig.swayEnabled
      ? (
        (Number.isFinite(leaf.swayAmplitudeRad) ? leaf.swayAmplitudeRad : 0)
        * Math.sin(((Number.isFinite(leaf.motionTime) ? leaf.motionTime : 0) * (Number.isFinite(leaf.swaySpeed) ? leaf.swaySpeed : 0)) + (leaf.swayPhase || 0))
        * swayInfluence
      )
      : 0;
    targetCtx.save();
    targetCtx.translate(leaf.x, leaf.y);
    targetCtx.rotate(leaf.rotationRad + swayOffsetRad);
    targetCtx.drawImage(
      STATE.leafImage,
      sourceRect.sx,
      sourceRect.sy,
      sourceRect.sw,
      sourceRect.sh,
      drawX,
      drawY,
      drawSize,
      drawSize,
    );
    targetCtx.restore();
    drawn += 1;
  }
  return { drawn, culled };
}

function drawLeafOverlayFast(leavesConfig, nowMs, targetCtx = ctx) {
  if (!leavesConfig || !leavesConfig.enabled || !STATE.leafImage || !targetCtx) {
    return { drawn: 0, culled: 0 };
  }
  const overlayCache = ensureLeafOverlayCache(leavesConfig);
  const leaves = overlayCache && Array.isArray(overlayCache.leaves) ? overlayCache.leaves : [];
  if (leaves.length === 0) {
    return { drawn: 0, culled: 0 };
  }

  const cullingEnabled = isLeafViewportCullingEnabled();
  let drawn = 0;
  let culled = 0;
  for (let i = 0; i < leaves.length; i += 1) {
    const leaf = leaves[i];
    const drawSize = Number.isFinite(leaf.drawSize) ? Math.max(1, leaf.drawSize) : leavesConfig.drawSize;
    const drawX = -drawSize * 0.5;
    const drawY = -drawSize + ((2.2 / leavesConfig.spriteCellHeight) * drawSize);
    if (cullingEnabled) {
      const halfAabb = drawSize * 0.9;
      if (
        (leaf.x + halfAabb) < 0
        || (leaf.y + halfAabb) < 0
        || (leaf.x - halfAabb) > STATE.viewportWidth
        || (leaf.y - halfAabb) > STATE.viewportHeight
      ) {
        culled += 1;
        continue;
      }
    }

    const sourceRect = getLeafSpriteSourceRect(leavesConfig, leaf.col, leaf.row);
    const swayInfluence = resolveLeafSwayInfluence(leaf, leavesConfig, nowMs);
    const swayOffsetRad = leavesConfig.swayEnabled
      ? (
        (Number.isFinite(leaf.swayAmplitudeRad) ? leaf.swayAmplitudeRad : 0)
        * Math.sin(((Number.isFinite(leaf.motionTime) ? leaf.motionTime : 0) * (Number.isFinite(leaf.swaySpeed) ? leaf.swaySpeed : 0)) + (leaf.swayPhase || 0))
        * swayInfluence
      )
      : 0;
    targetCtx.save();
    targetCtx.translate(leaf.x, leaf.y);
    targetCtx.rotate(leaf.rotationRad + swayOffsetRad);
    targetCtx.drawImage(
      STATE.leafImage,
      sourceRect.sx,
      sourceRect.sy,
      sourceRect.sw,
      sourceRect.sh,
      drawX,
      drawY,
      drawSize,
      drawSize,
    );
    targetCtx.restore();
    drawn += 1;
  }
  return { drawn, culled };
}

function isPerformanceMonitoringEnabled() {
  return Boolean(CONFIG.performance && CONFIG.performance.enabled);
}

function getPerformanceLogIntervalMs() {
  const config = CONFIG.performance || {};
  const interval = Number(config.logIntervalMs);
  if (!Number.isFinite(interval)) {
    return 1000;
  }
  return Math.max(250, interval);
}

function resetPerformanceCounters() {
  const perf = STATE.performance;
  const now = performance.now();
  perf.intervalStartMs = now;
  perf.lastLogMs = now;
  perf.intervalFrames = 0;
  perf.intervalFrameMs = 0;
  perf.intervalSamples = 0;
  perf.intervalActiveBranches = 0;
  perf.intervalCacheBuilds = 0;
  perf.intervalCacheBuildMs = 0;
  perf.intervalCacheReuses = 0;
  perf.intervalLeafDrawMs = 0;
  perf.intervalStemDrawMs = 0;
  perf.intervalFlowerDrawMs = 0;
  perf.intervalFlowerUpdateMs = 0;
  perf.intervalLeavesDrawn = 0;
  perf.intervalLeavesCulled = 0;
  perf.intervalFlowersDrawn = 0;
  perf.intervalFlowersCulled = 0;
  perf.intervalCacheMissReasons.invalid = 0;
  perf.intervalCacheMissReasons.pathData = 0;
  perf.intervalCacheMissReasons.image = 0;
  perf.intervalCacheMissReasons.brush = 0;
  perf.lastSummary = null;
}

function registerPerformanceCacheBuild(reason, buildMs) {
  if (!isPerformanceMonitoringEnabled()) {
    return;
  }
  const perf = STATE.performance;
  perf.intervalCacheBuilds += 1;
  perf.intervalCacheBuildMs += Number.isFinite(buildMs) ? Math.max(0, buildMs) : 0;
  if (reason === 'pathData' || reason === 'image' || reason === 'brush') {
    perf.intervalCacheMissReasons[reason] += 1;
  } else {
    perf.intervalCacheMissReasons.invalid += 1;
  }
}

function registerPerformanceCacheReuse() {
  if (!isPerformanceMonitoringEnabled()) {
    return;
  }
  STATE.performance.intervalCacheReuses += 1;
}

function registerSwayPerformanceSample(sample = {}) {
  if (!isPerformanceMonitoringEnabled()) {
    return;
  }
  const perf = STATE.performance;
  perf.intervalLeafDrawMs += Number.isFinite(sample.leafDrawMs) ? Math.max(0, sample.leafDrawMs) : 0;
  perf.intervalStemDrawMs += Number.isFinite(sample.stemDrawMs) ? Math.max(0, sample.stemDrawMs) : 0;
  perf.intervalFlowerDrawMs += Number.isFinite(sample.flowerDrawMs) ? Math.max(0, sample.flowerDrawMs) : 0;
  perf.intervalFlowerUpdateMs += Number.isFinite(sample.flowerUpdateMs) ? Math.max(0, sample.flowerUpdateMs) : 0;
  perf.intervalLeavesDrawn += Number.isFinite(sample.leavesDrawn) ? Math.max(0, sample.leavesDrawn) : 0;
  perf.intervalLeavesCulled += Number.isFinite(sample.leavesCulled) ? Math.max(0, sample.leavesCulled) : 0;
  perf.intervalFlowersDrawn += Number.isFinite(sample.flowersDrawn) ? Math.max(0, sample.flowersDrawn) : 0;
  perf.intervalFlowersCulled += Number.isFinite(sample.flowersCulled) ? Math.max(0, sample.flowersCulled) : 0;
}

function flushPerformanceFrame(frameStartMs, activeBranches) {
  if (!isPerformanceMonitoringEnabled()) {
    return;
  }

  const now = performance.now();
  const perf = STATE.performance;
  const frameMs = Math.max(0, now - frameStartMs);
  perf.intervalFrames += 1;
  perf.intervalFrameMs += frameMs;
  perf.intervalActiveBranches += Math.max(0, activeBranches);

  const logIntervalMs = getPerformanceLogIntervalMs();
  if (now - perf.lastLogMs < logIntervalMs) {
    return;
  }

  const frames = Math.max(1, perf.intervalFrames);
  const avgFrameMs = perf.intervalFrameMs / frames;
  const fps = avgFrameMs > 0 ? 1000 / avgFrameMs : 0;
  const avgSamplesPerFrame = perf.intervalSamples / frames;
  const avgActiveBranches = perf.intervalActiveBranches / frames;
  const avgCacheBuildMs = perf.intervalCacheBuilds > 0
    ? perf.intervalCacheBuildMs / perf.intervalCacheBuilds
    : 0;
  const avgLeafDrawMs = perf.intervalLeafDrawMs / frames;
  const avgStemDrawMs = perf.intervalStemDrawMs / frames;
  const avgFlowerDrawMs = perf.intervalFlowerDrawMs / frames;
  const avgFlowerUpdateMs = perf.intervalFlowerUpdateMs / frames;

  const summary = {
    fps,
    avgFrameMs,
    avgSamplesPerFrame,
    avgActiveBranches,
    cacheBuilds: perf.intervalCacheBuilds,
    cacheReuses: perf.intervalCacheReuses,
    avgCacheBuildMs,
    avgLeafDrawMs,
    avgStemDrawMs,
    avgFlowerDrawMs,
    avgFlowerUpdateMs,
    leavesDrawn: perf.intervalLeavesDrawn,
    leavesCulled: perf.intervalLeavesCulled,
    flowersDrawn: perf.intervalFlowersDrawn,
    flowersCulled: perf.intervalFlowersCulled,
    cacheMissReasons: {
      invalid: perf.intervalCacheMissReasons.invalid,
      pathData: perf.intervalCacheMissReasons.pathData,
      image: perf.intervalCacheMissReasons.image,
      brush: perf.intervalCacheMissReasons.brush,
    },
  };
  perf.lastSummary = summary;

  console.log(
    '[BranchPerf]',
    `fps=${summary.fps.toFixed(1)}`,
    `frameMs=${summary.avgFrameMs.toFixed(2)}`,
    `samples/frame=${summary.avgSamplesPerFrame.toFixed(0)}`,
    `activeBranches=${summary.avgActiveBranches.toFixed(1)}`,
    `cacheBuilds=${summary.cacheBuilds}`,
    `cacheReuses=${summary.cacheReuses}`,
    `cacheBuildMs=${summary.avgCacheBuildMs.toFixed(2)}`,
    `stemMs=${summary.avgStemDrawMs.toFixed(2)}`,
    `leafMs=${summary.avgLeafDrawMs.toFixed(2)}`,
    `flowerUpdMs=${summary.avgFlowerUpdateMs.toFixed(2)}`,
    `flowerDrawMs=${summary.avgFlowerDrawMs.toFixed(2)}`,
    `leaves(d/c)=${summary.leavesDrawn}/${summary.leavesCulled}`,
    `flowers(d/c)=${summary.flowersDrawn}/${summary.flowersCulled}`,
    `misses=${JSON.stringify(summary.cacheMissReasons)}`,
  );

  perf.intervalStartMs = now;
  perf.lastLogMs = now;
  perf.intervalFrames = 0;
  perf.intervalFrameMs = 0;
  perf.intervalSamples = 0;
  perf.intervalActiveBranches = 0;
  perf.intervalCacheBuilds = 0;
  perf.intervalCacheBuildMs = 0;
  perf.intervalCacheReuses = 0;
  perf.intervalLeafDrawMs = 0;
  perf.intervalStemDrawMs = 0;
  perf.intervalFlowerDrawMs = 0;
  perf.intervalFlowerUpdateMs = 0;
  perf.intervalLeavesDrawn = 0;
  perf.intervalLeavesCulled = 0;
  perf.intervalFlowersDrawn = 0;
  perf.intervalFlowersCulled = 0;
  perf.intervalCacheMissReasons.invalid = 0;
  perf.intervalCacheMissReasons.pathData = 0;
  perf.intervalCacheMissReasons.image = 0;
  perf.intervalCacheMissReasons.brush = 0;
}

function buildBranchStripCache(branch, brushConfig, defaultImage, flippedImage) {
  const cache = getBranchRenderCache(branch);
  const pathData = branch ? branch.pathData : null;
  const activeFlippedImage = flippedImage || defaultImage;

  cache.samples.length = 0;
  cache.distances.length = 0;
  cache.centerX.length = 0;
  cache.centerY.length = 0;

  if (!pathData || !defaultImage) {
    cache.valid = true;
    cache.pathDataRef = pathData;
    cache.defaultImageRef = defaultImage;
    cache.flippedImageRef = activeFlippedImage;
    cache.cacheKey = getBrushCacheKey(brushConfig);
    return cache;
  }

  const hasDirectionalMix = activeFlippedImage !== defaultImage;
  let defaultSliceAccumulator = 0;

  const brushScale = getBrushScale(brushConfig);
  const stripLength = Math.max(0.1, brushConfig.stripWidth);
  const stripStep = Math.max(0.1, stripLength - brushConfig.repeatOverlap);
  const widthOnPath = defaultImage.width * brushScale;
  const tileDrawLength = defaultImage.height * brushScale;
  const tileStep = Math.max(stripLength * 0.5, tileDrawLength + brushConfig.repeatGap);
  const totalLength = pathData.totalLength;

  const phase = positiveModulo(brushConfig.startOffset, tileStep);
  let tileStart = -phase;

  for (; tileStart < totalLength; tileStart += tileStep) {
    let localStart = 0;
    let localEnd = tileDrawLength;

    if (brushConfig.cropPartialRepeat) {
      localStart = Math.max(localStart, -tileStart);
      localEnd = Math.min(localEnd, totalLength - tileStart);
    }

    if (localEnd <= localStart) {
      continue;
    }

    for (let localAlongPath = localStart; localAlongPath < localEnd; localAlongPath += stripStep) {
      const currentStripLength = Math.min(stripLength, localEnd - localAlongPath);
      const distanceOnPath = tileStart + localAlongPath + currentStripLength * 0.5;

      if (distanceOnPath < 0 || distanceOnPath > totalLength) {
        continue;
      }

      const point = getPathPointAtLength(pathData, distanceOnPath);
      const tangent = getPathTangentAtLength(pathData, distanceOnPath);
      const tangentX = tangent.x;
      const tangentY = tangent.y;
      const normalX = -tangentY;
      const normalY = tangentX;

      let imageVariant = 0;
      let sourceImage = defaultImage;
      if (hasDirectionalMix) {
        const horizontalAlignment = clamp(tangentX, -1, 1);
        const defaultRatio = 0.5 + 0.5 * horizontalAlignment;
        if (defaultRatio <= 0) {
          sourceImage = activeFlippedImage;
          imageVariant = 1;
          defaultSliceAccumulator = 0;
        } else if (defaultRatio >= 1) {
          sourceImage = defaultImage;
          imageVariant = 0;
          defaultSliceAccumulator = 0;
        } else {
          defaultSliceAccumulator += defaultRatio;
          if (defaultSliceAccumulator >= 1) {
            sourceImage = defaultImage;
            imageVariant = 0;
            defaultSliceAccumulator -= 1;
          } else {
            sourceImage = activeFlippedImage;
            imageVariant = 1;
          }
        }
      }

      const sourceY = localAlongPath / brushScale;
      if (sourceY >= sourceImage.height) {
        break;
      }

      const sourceHeight = Math.min(currentStripLength / brushScale, sourceImage.height - sourceY);
      if (sourceHeight <= 0) {
        continue;
      }

      const originX = point.x + normalX * brushConfig.pathOffset;
      const originY = point.y + normalY * brushConfig.pathOffset;

      cache.samples.push({
        distanceOnPath,
        originX,
        originY,
        tangentX,
        tangentY,
        normalX,
        normalY,
        sourceY,
        sourceHeight,
        currentStripLength,
        widthOnPath,
        imageVariant,
      });
      cache.distances.push(distanceOnPath);
      cache.centerX.push(point.x);
      cache.centerY.push(point.y);
    }
  }

  cache.valid = true;
  cache.pathDataRef = pathData;
  cache.defaultImageRef = defaultImage;
  cache.flippedImageRef = activeFlippedImage;
  cache.cacheKey = getBrushCacheKey(brushConfig);
  return cache;
}

function ensureBranchStripCache(branch, brushConfig, defaultImage, flippedImage) {
  const cache = getBranchRenderCache(branch);
  const activeFlippedImage = flippedImage || defaultImage;
  const expectedBrushKey = getBrushCacheKey(brushConfig);
  let rebuildReason = '';
  if (!cache.valid) {
    rebuildReason = 'invalid';
  } else if (cache.pathDataRef !== branch.pathData) {
    rebuildReason = 'pathData';
  } else if (cache.defaultImageRef !== defaultImage || cache.flippedImageRef !== activeFlippedImage) {
    rebuildReason = 'image';
  } else if (cache.cacheKey !== expectedBrushKey) {
    rebuildReason = 'brush';
  }
  const shouldRebuild = rebuildReason.length > 0;

  if (shouldRebuild) {
    const t0 = isPerformanceMonitoringEnabled() ? performance.now() : 0;
    buildBranchStripCache(branch, brushConfig, defaultImage, activeFlippedImage);
    const elapsed = isPerformanceMonitoringEnabled() ? (performance.now() - t0) : 0;
    registerPerformanceCacheBuild(rebuildReason, elapsed);
  } else {
    registerPerformanceCacheReuse();
  }
  return cache;
}

function findLastDistanceIndex(distances, value) {
  if (!Array.isArray(distances) || distances.length === 0) {
    return -1;
  }
  let low = 0;
  let high = distances.length - 1;
  let answer = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (distances[mid] <= value) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return answer;
}

function drawStripCentersFromCache(centerX, centerY, endIndexInclusive) {
  if (!Array.isArray(centerX) || !Array.isArray(centerY) || endIndexInclusive < 0) {
    return;
  }
  const count = Math.min(endIndexInclusive + 1, centerX.length, centerY.length);
  if (count <= 0) {
    return;
  }
  const step = Math.max(1, Math.floor(count / 350));
  for (let i = 0; i < count; i += step) {
    drawCircle(centerX[i], centerY[i], 1.3, 'rgba(255, 202, 39, 0.32)');
  }
}

function drawBrushAlongPath(branch, brushConfig, debugConfig, defaultImage, flippedImage, visibleLength = null, targetCtx = ctx) {
  if (!branch || !branch.pathData || !defaultImage) {
    return;
  }

  const cache = ensureBranchStripCache(branch, brushConfig, defaultImage, flippedImage);
  const samples = cache.samples;
  if (!Array.isArray(samples) || samples.length === 0) {
    return;
  }

  const cutoffDistance = Number.isFinite(visibleLength)
    ? clamp(visibleLength, 0, branch.pathData.totalLength)
    : branch.pathData.totalLength;
  if (cutoffDistance <= 0) {
    return;
  }

  const endIndexInclusive = findLastDistanceIndex(cache.distances, cutoffDistance);
  if (endIndexInclusive < 0) {
    return;
  }
  if (isPerformanceMonitoringEnabled()) {
    STATE.performance.intervalSamples += endIndexInclusive + 1;
  }

  const defaultRef = cache.defaultImageRef || defaultImage;
  const flippedRef = cache.flippedImageRef || flippedImage || defaultImage;
  const branchThicknessBaseScale = getBranchThicknessBaseScale(branch);
  const taperEnabled = isBrushThicknessTaperEnabled(brushConfig);
  const taperMinScale = taperEnabled ? getBrushThicknessMinScale(brushConfig) : 1;
  const taperExponent = taperEnabled ? getBrushThicknessTaperExponent(brushConfig) : 1;
  const taperMinWidth = taperEnabled ? getBrushThicknessMinWidth(brushConfig) : 0;
  const inverseCutoffDistance = cutoffDistance > 1e-6 ? (1 / cutoffDistance) : 1e6;
  for (let i = 0; i <= endIndexInclusive; i += 1) {
    const sample = samples[i];
    const sourceImage = sample.imageVariant === 1 ? flippedRef : defaultRef;
    let normalizedDistance = clamp(sample.distanceOnPath * inverseCutoffDistance, 0, 1);
    if (taperEnabled && taperExponent !== 1) {
      normalizedDistance = Math.pow(normalizedDistance, taperExponent);
    }
    const taperedScale = taperEnabled
      ? (1 + (taperMinScale - 1) * normalizedDistance)
      : 1;
    let widthOnPath = sample.widthOnPath * branchThicknessBaseScale * taperedScale;
    if (taperMinWidth > 0) {
      widthOnPath = Math.max(widthOnPath, taperMinWidth);
    }
    if (widthOnPath <= 1e-6) {
      continue;
    }

    targetCtx.save();
    targetCtx.transform(
      sample.normalX,
      sample.normalY,
      sample.tangentX,
      sample.tangentY,
      sample.originX,
      sample.originY,
    );

    targetCtx.drawImage(
      sourceImage,
      0,
      sample.sourceY,
      sourceImage.width,
      sample.sourceHeight,
      -widthOnPath * 0.5,
      -sample.currentStripLength * 0.5,
      widthOnPath,
      sample.currentStripLength,
    );

    if (debugConfig.enabled && debugConfig.showStripBounds) {
      targetCtx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
      targetCtx.lineWidth = 1;
      targetCtx.strokeRect(
        -widthOnPath * 0.5,
        -sample.currentStripLength * 0.5,
        widthOnPath,
        sample.currentStripLength,
      );
    }

    targetCtx.restore();
  }

  if (debugConfig.enabled && debugConfig.showStripCenters) {
    drawStripCentersFromCache(cache.centerX, cache.centerY, endIndexInclusive);
  }
}

const DISABLED_DEBUG_CONFIG = {
  enabled: false,
  showStripBounds: false,
  showStripCenters: false,
};

// =========================
// 13) Animation Lifecycle and Timing
// =========================
function sanitizeAnimationSpeedMode(mode, fallback = 'duration') {
  if (mode === 'duration' || mode === 'rate') {
    return mode;
  }
  if (fallback === 'duration' || fallback === 'rate') {
    return fallback;
  }
  return 'duration';
}

function refreshBranchThicknessBaseScales() {
  if (!STATE.branchGarden || !Array.isArray(STATE.branchGarden.branches)) {
    return;
  }

  const branches = STATE.branchGarden.branches;
  const branchById = new Map();
  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    if (branch && Number.isFinite(branch.id)) {
      branchById.set(branch.id, branch);
    }
  }

  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    if (!branch) {
      continue;
    }
    if (!Number.isFinite(branch.parentId)) {
      branch.thicknessBaseScale = getBranchThicknessBaseScale(branch);
      continue;
    }

    const parent = branchById.get(branch.parentId);
    if (!parent || !parent.pathData) {
      branch.thicknessBaseScale = getBranchThicknessBaseScale(branch);
      continue;
    }

    const parentBaseScale = getBranchThicknessBaseScale(parent);
    const parentLength = Number.isFinite(parent.pathData.totalLength)
      ? Math.max(0, parent.pathData.totalLength)
      : 0;
    const spawnDistance = Number.isFinite(branch.spawnDistanceOnParent)
      ? clamp(branch.spawnDistanceOnParent, 0, parentLength)
      : 0;
    branch.thicknessBaseScale = Math.max(
      0.01,
      parentBaseScale * getThicknessTaperFactorAtDistance(spawnDistance, parentLength, CONFIG.brush),
    );
  }
}

function prewarmBranchFilterTextures(brushConfig = CONFIG.brush) {
  if (!STATE.stemImage) {
    return;
  }

  const globalHueDeg = getBrushGlobalHueDeg(brushConfig);
  const globalBrightness = getBrushGlobalBrightness(brushConfig);
  const baseFlippedImage = STATE.stemImageFlippedX || STATE.stemImage;

  if (!isBranchFilterRandomizationEnabled(brushConfig)) {
    getPrecomputedFilteredTexture(STATE.stemImage, globalHueDeg, globalBrightness);
    getPrecomputedFilteredTexture(baseFlippedImage, globalHueDeg, globalBrightness);
    return;
  }

  const variants = buildRandomBranchFilterVariants(brushConfig);
  for (let i = 0; i < variants.length; i += 1) {
    const variant = variants[i];
    const hueDeg = globalHueDeg + variant.hueDeg;
    const brightness = Math.max(0, globalBrightness * variant.brightness);
    getPrecomputedFilteredTexture(STATE.stemImage, hueDeg, brightness);
    getPrecomputedFilteredTexture(baseFlippedImage, hueDeg, brightness);
  }
}

function refreshBranchFilterVariations() {
  if (!STATE.branchGarden || !Array.isArray(STATE.branchGarden.branches)) {
    prewarmBranchFilterTextures(CONFIG.brush);
    return;
  }

  const brushConfig = CONFIG.brush || {};
  const branches = STATE.branchGarden.branches;
  if (!isBranchFilterRandomizationEnabled(brushConfig)) {
    for (let i = 0; i < branches.length; i += 1) {
      const branch = branches[i];
      if (!branch) {
        continue;
      }
      branch.filterVariantIndex = -1;
      branch.filterHueDeg = 0;
      branch.filterBrightness = 1;
      assignBranchStemTextures(branch, brushConfig);
    }
    prewarmBranchFilterTextures(brushConfig);
    return;
  }

  const variants = buildRandomBranchFilterVariants(brushConfig);
  const variantCount = variants.length;
  const assignmentMode = getBrushRandomFilterAssignmentMode(brushConfig);
  const branchById = new Map();
  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    if (branch && Number.isFinite(branch.id)) {
      branchById.set(branch.id, branch);
    }
  }

  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    if (!branch) {
      continue;
    }

    let variantIndex = 0;
    if (assignmentMode === 'inheritParent' && Number.isFinite(branch.parentId)) {
      const parent = branchById.get(branch.parentId);
      if (parent && Number.isFinite(parent.filterVariantIndex) && parent.filterVariantIndex >= 0) {
        variantIndex = parent.filterVariantIndex % variantCount;
      } else {
        const fallbackToken = getBranchStableToken(branch, i);
        variantIndex = positiveModulo(hashSeed(`${fallbackToken}|branch-filter-variant`), variantCount);
      }
    } else {
      const stableToken = getBranchStableToken(branch, i);
      variantIndex = positiveModulo(hashSeed(`${stableToken}|branch-filter-variant`), variantCount);
    }

    const variant = variants[variantIndex];
    branch.filterVariantIndex = variantIndex;
    branch.filterHueDeg = variant ? variant.hueDeg : 0;
    branch.filterBrightness = variant ? variant.brightness : 1;
    assignBranchStemTextures(branch, brushConfig);
  }

  prewarmBranchFilterTextures(brushConfig);
}

function resolveAnimationRatePxPerSec() {
  const animationConfig = CONFIG.animation || {};
  const animationState = STATE.animation || {};
  const speedMode = sanitizeAnimationSpeedMode(animationConfig.speedMode, 'duration');

  if (speedMode === 'rate') {
    const pxPerSec = Number(animationConfig.pixelsPerSecond);
    return Number.isFinite(pxPerSec) ? Math.max(0, pxPerSec) : 0;
  }

  const durationSec = Number(animationConfig.totalDurationSec);
  const safeDuration = Number.isFinite(durationSec) ? Math.max(0.001, durationSec) : 0.001;
  const criticalDistance = Number.isFinite(animationState.criticalPathDistance)
    ? Math.max(0, animationState.criticalPathDistance)
    : 0;
  if (criticalDistance <= 0) {
    return 0;
  }
  return criticalDistance / safeDuration;
}

function refreshBranchAnimationMetrics() {
  const animationState = STATE.animation;
  const branches = STATE.branchGarden && Array.isArray(STATE.branchGarden.branches)
    ? STATE.branchGarden.branches
    : [];

  if (branches.length === 0) {
    animationState.criticalPathDistance = 0;
    animationState.globalRatePxPerSec = 0;
    return;
  }

  const byId = new Map();
  for (let i = 0; i < branches.length; i += 1) {
    const branch = branches[i];
    branch.pathLength = branch.pathData && Number.isFinite(branch.pathData.totalLength)
      ? Math.max(0, branch.pathData.totalLength)
      : 0;
    branch.startDistanceMetric = 0;
    byId.set(branch.id, branch);
  }

  const ordered = branches.slice().sort((a, b) => {
    const depthA = Number.isFinite(a.depth) ? a.depth : 0;
    const depthB = Number.isFinite(b.depth) ? b.depth : 0;
    if (depthA !== depthB) {
      return depthA - depthB;
    }
    const idA = Number.isFinite(a.id) ? a.id : 0;
    const idB = Number.isFinite(b.id) ? b.id : 0;
    return idA - idB;
  });

  let criticalPathDistance = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    const branch = ordered[i];
    let startDistanceMetric = 0;
    if (Number.isFinite(branch.parentId)) {
      const parent = byId.get(branch.parentId);
      if (parent) {
        const parentStart = Number.isFinite(parent.startDistanceMetric) ? parent.startDistanceMetric : 0;
        const parentLength = Number.isFinite(parent.pathLength) ? parent.pathLength : 0;
        const spawnDistance = Number.isFinite(branch.spawnDistanceOnParent)
          ? clamp(branch.spawnDistanceOnParent, 0, parentLength)
          : 0;
        startDistanceMetric = parentStart + spawnDistance;
      }
    }
    branch.startDistanceMetric = startDistanceMetric;
    criticalPathDistance = Math.max(criticalPathDistance, startDistanceMetric + branch.pathLength);
  }

  animationState.criticalPathDistance = criticalPathDistance;
  animationState.globalRatePxPerSec = resolveAnimationRatePxPerSec();
}

function getAnimationTotalTimeSec() {
  const animationState = STATE.animation;
  const criticalPathDistance = Number.isFinite(animationState.criticalPathDistance)
    ? Math.max(0, animationState.criticalPathDistance)
    : 0;
  const ratePxPerSec = Number.isFinite(animationState.globalRatePxPerSec)
    ? Math.max(0, animationState.globalRatePxPerSec)
    : 0;
  if (criticalPathDistance <= 0 || ratePxPerSec <= 0) {
    return 0;
  }
  return criticalPathDistance / ratePxPerSec;
}

function getBranchVisibleLengthAtElapsed(branch, elapsedSec) {
  if (!branch) {
    return 0;
  }

  const animationState = STATE.animation;
  const ratePxPerSec = Number.isFinite(animationState.globalRatePxPerSec)
    ? Math.max(0, animationState.globalRatePxPerSec)
    : 0;
  const branchLength = Number.isFinite(branch.pathLength)
    ? Math.max(0, branch.pathLength)
    : (branch.pathData && Number.isFinite(branch.pathData.totalLength)
      ? Math.max(0, branch.pathData.totalLength)
      : 0);
  const startDistanceMetric = Number.isFinite(branch.startDistanceMetric)
    ? Math.max(0, branch.startDistanceMetric)
    : 0;
  const elapsed = Number.isFinite(elapsedSec) ? Math.max(0, elapsedSec) : 0;

  const visible = elapsed * ratePxPerSec - startDistanceMetric;
  return clamp(visible, 0, branchLength);
}

function scheduleBranchAnimationFrame() {
  const animationState = STATE.animation;
  if (!animationState.running || animationState.rafId !== null) {
    return;
  }
  animationState.rafId = requestAnimationFrame(stepBranchAnimationFrame);
}

function stopBranchAnimation(options = {}) {
  const { keepElapsed = false } = options;
  const animationState = STATE.animation;
  if (animationState.rafId !== null) {
    cancelAnimationFrame(animationState.rafId);
    animationState.rafId = null;
  }
  animationState.running = false;
  animationState.startTimeMs = 0;
  if (!keepElapsed) {
    animationState.elapsedSec = 0;
  }
}

function startBranchAnimation(options = {}) {
  const { restart = true } = options;
  if (!STATE.branchGarden) {
    return;
  }

  const animationState = STATE.animation;
  if (restart) {
    animationState.elapsedSec = 0;
    invalidateCompletedBranchLayer();
  }

  refreshBranchAnimationMetrics();
  const totalTimeSec = getAnimationTotalTimeSec();
  if (totalTimeSec <= 0) {
    animationState.running = false;
    animationState.startTimeMs = 0;
    renderScene({ skipAutoStart: true });
    return;
  }

  if (animationState.rafId !== null) {
    cancelAnimationFrame(animationState.rafId);
    animationState.rafId = null;
  }
  cancelFlowerInteractionFrame();
  animationState.running = true;
  animationState.startTimeMs = performance.now() - animationState.elapsedSec * 1000;
  renderScene({ skipAutoStart: true });
  scheduleBranchAnimationFrame();
}

function pauseBranchAnimation() {
  const animationState = STATE.animation;
  if (!animationState.running) {
    return;
  }
  if (animationState.rafId !== null) {
    cancelAnimationFrame(animationState.rafId);
    animationState.rafId = null;
  }
  animationState.running = false;
  animationState.startTimeMs = 0;
  renderScene({ skipAutoStart: true });
}

function resumeBranchAnimation() {
  const animationState = STATE.animation;
  if (animationState.running) {
    return;
  }
  refreshBranchAnimationMetrics();
  const totalTimeSec = getAnimationTotalTimeSec();
  if (totalTimeSec <= 0) {
    renderScene({ skipAutoStart: true });
    return;
  }
  cancelFlowerInteractionFrame();
  animationState.running = true;
  animationState.startTimeMs = performance.now() - animationState.elapsedSec * 1000;
  renderScene({ skipAutoStart: true });
  scheduleBranchAnimationFrame();
}

function restartBranchAnimation() {
  STATE.animation.elapsedSec = 0;
  startBranchAnimation({ restart: true });
}

function stepBranchAnimationFrame(timestampMs) {
  const animationState = STATE.animation;
  animationState.rafId = null;

  if (!animationState.running) {
    return;
  }

  if (!Number.isFinite(animationState.startTimeMs) || animationState.startTimeMs <= 0) {
    animationState.startTimeMs = timestampMs;
  }
  animationState.elapsedSec = Math.max(0, (timestampMs - animationState.startTimeMs) / 1000);

  const totalTimeSec = getAnimationTotalTimeSec();
  if (animationState.elapsedSec >= totalTimeSec) {
    animationState.elapsedSec = totalTimeSec;
    animationState.running = false;
    animationState.startTimeMs = 0;
    renderScene({ skipAutoStart: true, timestampMs });
    return;
  }

  renderScene({ skipAutoStart: true, timestampMs });
  scheduleBranchAnimationFrame();
}

function onBranchStructureChanged() {
  refreshBranchEndpointsAndFlowerSystem();
  refreshBranchThicknessBaseScales();
  refreshBranchFilterVariations();
  invalidateAllBranchStripCaches();
  invalidateCompletedBranchLayer();
  refreshBranchAnimationMetrics();
  if (!CONFIG.animation.enabled) {
    stopBranchAnimation({ keepElapsed: false });
    return;
  }

  if (CONFIG.animation.autoStart) {
    restartBranchAnimation();
    return;
  }

  const animationState = STATE.animation;
  if (animationState.running) {
    animationState.startTimeMs = performance.now() - animationState.elapsedSec * 1000;
    renderScene({ skipAutoStart: true });
    scheduleBranchAnimationFrame();
    return;
  }

  animationState.elapsedSec = 0;
  renderScene({ skipAutoStart: true });
}

// =========================
// 14) Scene Render
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

function renderBranch(branch, renderOptions = {}) {
  if (!branch.pathData) {
    return;
  }

  const visibleLength = Number.isFinite(renderOptions.visibleLength)
    ? Math.max(0, renderOptions.visibleLength)
    : null;
  if (visibleLength !== null && visibleLength <= 0) {
    return;
  }

  const targetCtx = renderOptions.targetCtx || ctx;
  const leavesConfig = renderOptions.leavesConfig || resolveLeavesConfig(CONFIG.leaves || {});
  const branchIndex = Number.isFinite(renderOptions.branchIndex) ? renderOptions.branchIndex : 0;
  const nowMs = Number.isFinite(renderOptions.nowMs) ? renderOptions.nowMs : performance.now();
  const perfStats = renderOptions.perfStats || null;
  const branchTextures = renderOptions.branchTextures || getBranchStemTextures(branch, CONFIG.brush);
  if (!branchTextures || !branchTextures.defaultImage) {
    return;
  }

  const stemStartMs = (perfStats && isPerformanceMonitoringEnabled()) ? performance.now() : 0;
  drawBrushAlongPath(
    branch,
    CONFIG.brush,
    CONFIG.debug,
    branchTextures.defaultImage,
    branchTextures.flippedImage,
    visibleLength,
    targetCtx,
  );
  if (perfStats && stemStartMs > 0) {
    perfStats.stemDrawMs += Math.max(0, performance.now() - stemStartMs);
  }
  const leafStartMs = (perfStats && isPerformanceMonitoringEnabled()) ? performance.now() : 0;
  const leafStats = drawBranchLeaves(branch, leavesConfig, {
    visibleLength,
    targetCtx,
    branchIndex,
    nowMs,
  });
  if (perfStats) {
    if (leafStartMs > 0) {
      perfStats.leafDrawMs += Math.max(0, performance.now() - leafStartMs);
    }
    perfStats.leavesDrawn += Number.isFinite(leafStats && leafStats.drawn) ? leafStats.drawn : 0;
    perfStats.leavesCulled += Number.isFinite(leafStats && leafStats.culled) ? leafStats.culled : 0;
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showPathOutline) {
    drawPathOutline(branch.pathData);
  }

  if (CONFIG.debug.enabled && (CONFIG.debug.showTangents || CONFIG.debug.showNormals)) {
    drawPathVectors(branch.pathData);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlPoints) {
    drawControlPoints(branch.controlPoints);
  }

  if (CONFIG.debug.enabled && CONFIG.debug.showControlCurve) {
    drawControlCurve(branch.controlPoints);
  }
}

function renderScene(options = {}) {
  if (!STATE.branchGarden || !STATE.stemImage) {
    cancelFlowerInteractionFrame();
    return;
  }

  const perfEnabled = isPerformanceMonitoringEnabled();
  const frameStartMs = perfEnabled ? performance.now() : 0;
  const skipAutoStart = options.skipAutoStart === true;
  if (CONFIG.animation.enabled && !skipAutoStart) {
    if (!STATE.animation.running && STATE.animation.elapsedSec <= 1e-8 && CONFIG.animation.autoStart) {
      startBranchAnimation({ restart: true });
      return;
    }
  }

  if (!CONFIG.animation.enabled && (STATE.animation.running || STATE.animation.rafId !== null || STATE.animation.elapsedSec > 0)) {
    stopBranchAnimation({ keepElapsed: false });
  }

  const useAnimation = CONFIG.animation.enabled;
  const elapsedSec = STATE.animation.elapsedSec;
  const canUseCompletedLayer = (
    CONFIG.animation.useOffscreenLayerCache !== false
    && CONFIG.debug.enabled !== true
  );
  const useCompletedLayer = canUseCompletedLayer;
  const leavesConfig = resolveLeavesConfig(CONFIG.leaves || {});
  const renderTimestampMs = Number.isFinite(options.timestampMs)
    ? options.timestampMs
    : performance.now();
  const perfStats = {
    stemDrawMs: 0,
    leafDrawMs: 0,
    flowerUpdateMs: 0,
    flowerDrawMs: 0,
    leavesDrawn: 0,
    leavesCulled: 0,
    flowersDrawn: 0,
    flowersCulled: 0,
  };
  const animationTotalTimeSec = useAnimation ? getAnimationTotalTimeSec() : 0;
  const branchesFullyGrown = !useAnimation
    || animationTotalTimeSec <= 0
    || elapsedSec >= animationTotalTimeSec - 1e-6;

  ctx.setTransform(STATE.dpr, 0, 0, STATE.dpr, 0, 0);
  drawBackground();

  let completedLayer = null;
  if (useCompletedLayer) {
    completedLayer = ensureCompletedBranchLayer();
    if (completedLayer.leavesConfigKey !== leavesConfig.cacheKey) {
      invalidateCompletedBranchLayer();
      completedLayer = ensureCompletedBranchLayer();
    }
    completedLayer.leavesConfigKey = leavesConfig.cacheKey;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(completedLayer.canvas, 0, 0);
    ctx.restore();
  } else if (STATE.completedLayer.committedBranchIds.size > 0 || STATE.completedLayer.leavesConfigKey !== '') {
    invalidateCompletedBranchLayer();
  }

  const branches = STATE.branchGarden.branches;
  const shouldRenderLeaves = Boolean(leavesConfig.enabled && STATE.leafImage);
  const canUseLeafOverlayFastPath = Boolean(
    isSwayFastPathEnabled()
    && shouldRenderLeaves
    && useCompletedLayer
    && completedLayer
    && branchesFullyGrown
    && completedLayer.committedBranchIds.size >= branches.length
  );
  const canSkipBranchLoop = useCompletedLayer
    && completedLayer
    && branchesFullyGrown
    && completedLayer.committedBranchIds.size >= branches.length
    && !shouldRenderLeaves
    && !canUseLeafOverlayFastPath;

  let activeBranches = 0;
  if (canSkipBranchLoop) {
    activeBranches = branches.length;
  } else if (canUseLeafOverlayFastPath) {
    activeBranches = branches.length;
    const leafStartMs = perfEnabled ? performance.now() : 0;
    const leafStats = drawLeafOverlayFast(leavesConfig, renderTimestampMs, ctx);
    if (perfEnabled) {
      perfStats.leafDrawMs += Math.max(0, performance.now() - leafStartMs);
    }
    perfStats.leavesDrawn += Number.isFinite(leafStats && leafStats.drawn) ? leafStats.drawn : 0;
    perfStats.leavesCulled += Number.isFinite(leafStats && leafStats.culled) ? leafStats.culled : 0;
  } else {
    for (let i = 0; i < branches.length; i += 1) {
      const branch = branches[i];
      const visibleLength = useAnimation
        ? getBranchVisibleLengthAtElapsed(branch, elapsedSec)
        : null;

      if (useCompletedLayer && branch.pathData) {
        const branchLength = Number.isFinite(branch.pathData.totalLength) ? branch.pathData.totalLength : 0;
        const isFullyVisible = visibleLength === null || visibleLength >= branchLength - 1e-6;
        if (isFullyVisible) {
          const branchRenderId = getBranchRenderId(branch);
          if (completedLayer.committedBranchIds.has(branchRenderId)) {
            activeBranches += 1;
            if (shouldRenderLeaves) {
              const leafStartMs = perfEnabled ? performance.now() : 0;
              const leafStats = drawBranchLeaves(branch, leavesConfig, {
                visibleLength,
                targetCtx: ctx,
                branchIndex: i,
                nowMs: renderTimestampMs,
              });
              if (perfEnabled) {
                perfStats.leafDrawMs += Math.max(0, performance.now() - leafStartMs);
              }
              perfStats.leavesDrawn += Number.isFinite(leafStats && leafStats.drawn) ? leafStats.drawn : 0;
              perfStats.leavesCulled += Number.isFinite(leafStats && leafStats.culled) ? leafStats.culled : 0;
            }
            continue;
          }

          const branchTextures = getBranchStemTextures(branch, CONFIG.brush);
          if (!branchTextures.defaultImage) {
            continue;
          }
          activeBranches += 1;
          const stemStartMs = perfEnabled ? performance.now() : 0;
          drawBrushAlongPath(
            branch,
            CONFIG.brush,
            DISABLED_DEBUG_CONFIG,
            branchTextures.defaultImage,
            branchTextures.flippedImage,
            null,
            completedLayer.ctx,
          );
          if (perfEnabled) {
            perfStats.stemDrawMs += Math.max(0, performance.now() - stemStartMs);
          }
          completedLayer.committedBranchIds.add(branchRenderId);
          // Draw once on this frame since layer blit already happened earlier.
          renderBranch(branch, {
            visibleLength,
            branchTextures,
            leavesConfig,
            branchIndex: i,
            nowMs: renderTimestampMs,
            perfStats,
          });
          continue;
        }
      }

      const branchTextures = getBranchStemTextures(branch, CONFIG.brush);
      if (!branchTextures.defaultImage) {
        continue;
      }
      if (visibleLength === null || visibleLength > 0) {
        activeBranches += 1;
      }
      renderBranch(branch, {
        visibleLength,
        branchTextures,
        leavesConfig,
        branchIndex: i,
        nowMs: renderTimestampMs,
        perfStats,
      });
    }
  }

  if (shouldRenderEndpointFlowers()) {
    const flowerTiming = drawEndpointFlowers(renderTimestampMs);
    if (flowerTiming) {
      perfStats.flowerUpdateMs += Number.isFinite(flowerTiming.updateMs) ? flowerTiming.updateMs : 0;
      perfStats.flowerDrawMs += Number.isFinite(flowerTiming.drawMs) ? flowerTiming.drawMs : 0;
      perfStats.flowersDrawn += Number.isFinite(flowerTiming.drawnCount) ? flowerTiming.drawnCount : 0;
      perfStats.flowersCulled += Number.isFinite(flowerTiming.culledCount) ? flowerTiming.culledCount : 0;
    }
  }

  if (perfEnabled) {
    registerSwayPerformanceSample(perfStats);
    if (isSwayPerfLogEnabled()) {
      console.log('[SwayPerfFrame]', JSON.stringify(perfStats));
    }
    flushPerformanceFrame(frameStartMs, activeBranches);
  }

  syncFlowerInteractionLoop();
}

// =========================
// 15) Events
// =========================
function onResize() {
  // Keep existing branches; do not regenerate on zoom/resize.
  resizeCanvasToViewport();
  invalidateCompletedBranchLayer();
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

  if (key === 'p') {
    // Pause/resume animation.
    
      video.paused ? video.play() : video.pause();
    
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

  if (key === 'q') {
    const flowerSystem = getFlowerSystem();
    if (!flowerSystem || typeof flowerSystem.animateTogglePetalOpenState !== 'function') {
      return;
    }
    flowerSystem.animateTogglePetalOpenState(getFlowersRuntimeConfig(), performance.now());
    renderScene({ skipAutoStart: true });
  }

  if (key === 'c') {
    const flowerSystem = getFlowerSystem();
    if (!flowerSystem || typeof flowerSystem.togglePetalOpenState !== 'function') {
      return;
    }
    flowerSystem.togglePetalOpenState();
    renderScene({ skipAutoStart: true });
  }
}

function getCanvasPointerPosition(event) {
  if (!event || !canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  const scaleX = STATE.viewportWidth > 0 ? (STATE.viewportWidth / rect.width) : 1;
  const scaleY = STATE.viewportHeight > 0 ? (STATE.viewportHeight / rect.height) : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function onMouseMove(event) {
  const pointer = getCanvasPointerPosition(event);
  if (!pointer) {
    return;
  }
  const nowMs = performance.now();
  if (
    Number.isFinite(STATE.pointerLastSampleX)
    && Number.isFinite(STATE.pointerLastSampleY)
    && Number.isFinite(STATE.pointerLastSampleMs)
    && STATE.pointerLastSampleMs > 0
  ) {
    const dtSec = Math.max(1e-4, (nowMs - STATE.pointerLastSampleMs) / 1000);
    const dx = pointer.x - STATE.pointerLastSampleX;
    const dy = pointer.y - STATE.pointerLastSampleY;
    STATE.pointerSpeedPxPerSec = Math.hypot(dx, dy) / dtSec;
  }
  STATE.pointerLastSampleX = pointer.x;
  STATE.pointerLastSampleY = pointer.y;
  STATE.pointerLastSampleMs = nowMs;
  STATE.pointerX = pointer.x;
  STATE.pointerY = pointer.y;
  const flowerSystem = getFlowerSystem();
  if (flowerSystem && CONFIG.flowers && CONFIG.flowers.enabled === true) {
    flowerSystem.setMousePosition(pointer.x, pointer.y);
  }
  if (!STATE.animation.running) {
    scheduleFlowerInteractionFrame(true);
  }
}

function onMouseOut() {
  STATE.pointerX = Number.NEGATIVE_INFINITY;
  STATE.pointerY = Number.NEGATIVE_INFINITY;
  STATE.pointerSpeedPxPerSec = 0;
  STATE.pointerLastSampleX = Number.NEGATIVE_INFINITY;
  STATE.pointerLastSampleY = Number.NEGATIVE_INFINITY;
  STATE.pointerLastSampleMs = 0;
  const flowerSystem = getFlowerSystem();
  if (flowerSystem && CONFIG.flowers && CONFIG.flowers.enabled === true) {
    flowerSystem.clearMousePosition();
  }
  if (!STATE.animation.running) {
    scheduleFlowerInteractionFrame(true);
  }
}

function onMouseClick(event) {
  if (!CONFIG.flowers || CONFIG.flowers.enabled !== true) {
    return;
  }
  const flowerSystem = getFlowerSystem();
  if (!flowerSystem || typeof flowerSystem.applyJumpAt !== 'function') {
    return;
  }
  const pointer = getCanvasPointerPosition(event);
  if (!pointer) {
    return;
  }
  const affectedCount = flowerSystem.applyJumpAt(
    pointer.x,
    pointer.y,
    getFlowersRuntimeConfig(),
  );
  if (affectedCount > 0 && !STATE.animation.running) {
    scheduleFlowerInteractionFrame(true);
  }
}

function setupEventHandlers() {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseout', onMouseOut);
  window.addEventListener('click', onMouseClick);
}

// =========================
// 16) Public API
// =========================
function applyAnimationOptions(nextOptions) {
  if (!nextOptions || typeof nextOptions !== 'object') {
    return;
  }

  const previous = {
    enabled: Boolean(CONFIG.animation.enabled),
    autoStart: Boolean(CONFIG.animation.autoStart),
    useOffscreenLayerCache: CONFIG.animation.useOffscreenLayerCache !== false,
  };

  const sanitized = {};
  if (nextOptions.enabled !== undefined) {
    sanitized.enabled = Boolean(nextOptions.enabled);
  }
  if (nextOptions.autoStart !== undefined) {
    sanitized.autoStart = Boolean(nextOptions.autoStart);
  }
  if (nextOptions.useOffscreenLayerCache !== undefined) {
    sanitized.useOffscreenLayerCache = Boolean(nextOptions.useOffscreenLayerCache);
  }
  if (nextOptions.speedMode !== undefined) {
    sanitized.speedMode = sanitizeAnimationSpeedMode(nextOptions.speedMode, CONFIG.animation.speedMode);
  }
  if (nextOptions.totalDurationSec !== undefined) {
    const durationSec = Number(nextOptions.totalDurationSec);
    if (Number.isFinite(durationSec)) {
      sanitized.totalDurationSec = Math.max(0.001, durationSec);
    }
  }
  if (nextOptions.pixelsPerSecond !== undefined) {
    const pxPerSec = Number(nextOptions.pixelsPerSecond);
    if (Number.isFinite(pxPerSec)) {
      sanitized.pixelsPerSecond = Math.max(0, pxPerSec);
    }
  }

  Object.assign(CONFIG.animation, sanitized);

  const offscreenCacheChanged = (
    previous.useOffscreenLayerCache
    !== (CONFIG.animation.useOffscreenLayerCache !== false)
  );
  if (offscreenCacheChanged) {
    invalidateCompletedBranchLayer();
  }

  if (!CONFIG.animation.enabled) {
    stopBranchAnimation({ keepElapsed: false });
    renderScene({ skipAutoStart: true });
    return;
  }

  refreshBranchAnimationMetrics();

  const enabledJustTurnedOn = previous.enabled === false && CONFIG.animation.enabled === true;
  const autoStartJustEnabled = previous.autoStart === false && CONFIG.animation.autoStart === true;
  if ((enabledJustTurnedOn || autoStartJustEnabled) && CONFIG.animation.autoStart) {
    restartBranchAnimation();
    return;
  }

  if (STATE.animation.running) {
    STATE.animation.startTimeMs = performance.now() - STATE.animation.elapsedSec * 1000;
    scheduleBranchAnimationFrame();
  }

  renderScene({ skipAutoStart: true });
}

async function applyFlowerOptions(nextOptions) {
  if (!isPlainObjectLiteral(nextOptions)) {
    return;
  }

  ensureFlowerConfigShapeInPlace(CONFIG.flowers);
  const patch = normalizeFlowerOptionPatch(nextOptions);
  mergeFlowerOptionsInPlace(CONFIG.flowers, patch);
  ensureFlowerConfigShapeInPlace(CONFIG.flowers);
  STATE.flowerPerfLastLogMs = 0;

  await loadFlowerSpriteIntoSystem();

  rebuildEndpointFlowers();
  renderScene({ skipAutoStart: true });
}

function applyPerformanceOptions(nextOptions) {
  if (!nextOptions || typeof nextOptions !== 'object') {
    return;
  }

  const sanitized = {};
  if (nextOptions.enabled !== undefined) {
    sanitized.enabled = Boolean(nextOptions.enabled);
  }
  if (nextOptions.logIntervalMs !== undefined) {
    const intervalMs = Number(nextOptions.logIntervalMs);
    if (Number.isFinite(intervalMs)) {
      sanitized.logIntervalMs = Math.max(250, intervalMs);
    }
  }

  Object.assign(CONFIG.performance, sanitized);

  if (CONFIG.performance.enabled) {
    resetPerformanceCounters();
  }
}

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
  const sanitized = { ...nextOptions };
  if (sanitized.templateNoiseHighpassWindow3 !== undefined) {
    sanitized.templateNoiseHighpassWindow3 = normalizeTemplateNoiseHighpassWindow(
      Number(sanitized.templateNoiseHighpassWindow3),
      CONFIG.pathGeneration.templateNoiseHighpassWindow3,
    );
  }
  if (sanitized.templateNoiseDirectionalBias !== undefined) {
    sanitized.templateNoiseDirectionalBias = normalizeTemplateNoiseDirectionalBias(
      Number(sanitized.templateNoiseDirectionalBias),
      CONFIG.pathGeneration.templateNoiseDirectionalBias,
    );
  }
  if (
    sanitized.templateScaleRangeMin !== undefined ||
    sanitized.templateScaleRangeMax !== undefined
  ) {
    const current = resolveTemplateScaleRange(CONFIG.pathGeneration);
    const candidateMin = Number(sanitized.templateScaleRangeMin);
    const candidateMax = Number(sanitized.templateScaleRangeMax);
    sanitized.templateScaleRangeMin = Number.isFinite(candidateMin)
      ? Math.max(0, candidateMin)
      : current.minScale;
    sanitized.templateScaleRangeMax = Number.isFinite(candidateMax)
      ? Math.max(0, candidateMax)
      : current.maxScale;
    if (sanitized.templateScaleRangeMin > sanitized.templateScaleRangeMax) {
      const tmp = sanitized.templateScaleRangeMin;
      sanitized.templateScaleRangeMin = sanitized.templateScaleRangeMax;
      sanitized.templateScaleRangeMax = tmp;
    }
  }
  if (sanitized.templateInheritCheckpointSpacingSteps !== undefined) {
    sanitized.templateInheritCheckpointSpacingSteps = Boolean(sanitized.templateInheritCheckpointSpacingSteps);
  }
  if (sanitized.useAbsoluteNoiseX !== undefined) {
    sanitized.useAbsoluteNoiseX = Boolean(sanitized.useAbsoluteNoiseX);
  }
  if (sanitized.useAbsoluteNoiseY !== undefined) {
    sanitized.useAbsoluteNoiseY = Boolean(sanitized.useAbsoluteNoiseY);
  }
  if (sanitized.absoluteNoiseXRatio !== undefined) {
    const numeric = Number(sanitized.absoluteNoiseXRatio);
    sanitized.absoluteNoiseXRatio = clamp(
      Number.isFinite(numeric) ? numeric : CONFIG.pathGeneration.absoluteNoiseXRatio,
      0,
      1,
    );
  }
  if (sanitized.absoluteNoiseYRatio !== undefined) {
    const numeric = Number(sanitized.absoluteNoiseYRatio);
    sanitized.absoluteNoiseYRatio = clamp(
      Number.isFinite(numeric) ? numeric : CONFIG.pathGeneration.absoluteNoiseYRatio,
      0,
      1,
    );
  }
  Object.assign(CONFIG.pathGeneration, sanitized);
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
    { key: 'useAbsoluteNoiseX', type: 'toggle' },
    { key: 'useAbsoluteNoiseY', type: 'toggle' },
    { key: 'absoluteNoiseXRatio', type: 'number', step: 0.05, min: 0, max: 1 },
    { key: 'absoluteNoiseYRatio', type: 'number', step: 0.05, min: 0, max: 1 },
    { key: 'templateScale', type: 'number', step: 0.05, min: 0, max: 10 },
    { key: 'templateScaleRangeMin', type: 'number', step: 0.05, min: 0, max: 10 },
    { key: 'templateScaleRangeMax', type: 'number', step: 0.05, min: 0, max: 10 },
    { key: 'templateNoiseAmount', type: 'number', step: 5, min: 0, max: 2000 },
    { key: 'templateNoiseStep', type: 'number', step: 0.0001, min: 0.000001, max: 2 },
    { key: 'templateNoiseAmount2', type: 'number', step: 5, min: 0, max: 2000 },
    { key: 'templateNoiseStep2', type: 'number', step: 0.0001, min: 0.000001, max: 2 },
    { key: 'templateNoiseAmount3', type: 'number', step: 5, min: 0, max: 2000 },
    { key: 'templateNoiseStep3', type: 'number', step: 0.0001, min: 0.000001, max: 2 },
    { key: 'templateNoiseHighpassWindow3', type: 'number', step: 2, min: 3, max: 51, integer: true },
    { key: 'templateNoiseDirectionalBias', type: 'number', step: 0.05, min: 0, max: 1 },
    { key: 'templateInheritCheckpointSpacingSteps', type: 'toggle' },
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
    if (descriptor.key === 'templateNoiseHighpassWindow3') {
      next = normalizeTemplateNoiseHighpassWindow(next, descriptor.min);
    }
    if (descriptor.key === 'templateNoiseDirectionalBias') {
      next = normalizeTemplateNoiseDirectionalBias(next, descriptor.min);
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
  const api = {
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

    getBranchEndpoints() {
      return Array.isArray(STATE.branchEndpoints)
        ? STATE.branchEndpoints.map((endpoint) => ({ ...endpoint }))
        : [];
    },

    setBrushOptions(nextOptions) {
      Object.assign(CONFIG.brush, nextOptions);
      resetFilteredStemTextureCache();
      refreshBranchThicknessBaseScales();
      refreshBranchFilterVariations();
      invalidateAllBranchStripCaches();
      invalidateCompletedBranchLayer();
      renderScene();
    },

    setDebugOptions(nextOptions) {
      Object.assign(CONFIG.debug, nextOptions);
      invalidateCompletedBranchLayer();
      renderScene();
    },

    setOffshootOptions(nextOptions) {
      applyOffshootOptions(nextOptions);
    },

    setPathGenerationOptions(nextOptions) {
      applyPathGenerationOptions(nextOptions);
    },

    setAnimationOptions(nextOptions) {
      applyAnimationOptions(nextOptions);
    },

    async setFlowerOptions(nextOptions) {
      await applyFlowerOptions(nextOptions);
    },

    getFlowerPerformanceSnapshot() {
      const flowerSystem = getFlowerSystem();
      if (!flowerSystem || typeof flowerSystem.getPerformanceSnapshot !== 'function') {
        return null;
      }
      return flowerSystem.getPerformanceSnapshot();
    },

    setPerformanceOptions(nextOptions) {
      applyPerformanceOptions(nextOptions);
    },

    getPerformanceSnapshot() {
      const perf = STATE.performance;
      if (!perf.lastSummary) {
        return null;
      }
      return {
        ...perf.lastSummary,
        cacheMissReasons: {
          ...perf.lastSummary.cacheMissReasons,
        },
      };
    },

    resetPerformanceStats() {
      resetPerformanceCounters();
      return true;
    },

    startAnimation() {
      if (!CONFIG.animation.enabled) {
        CONFIG.animation.enabled = true;
      }
      startBranchAnimation({ restart: true });
    },

    pauseAnimation() {
      pauseBranchAnimation();
    },

    resumeAnimation() {
      resumeBranchAnimation();
    },

    restartAnimation() {
      restartBranchAnimation();
    },

    listManualTemplates() {
      return getManualTemplateDescriptors();
    },

    async reloadManualTemplates() {
      await loadManualTemplateSources({ force: true });
      if (STATE.branchGarden) {
        STATE.branchGarden.rebuildBranches({ regenerateRoots: true, resetRootTimeCursor: true });
      }
      renderScene();
      return getManualTemplateDescriptors();
    },

    rerender() {
      renderScene();
    },
  };
  window.stemWarpDemo10 = api;
  window.stemWarpDemo11 = api;
}

// =========================
// 17) Bootstrap
// =========================
async function bootstrap() {
  if (STATE.hasBootstrapped) {
    return;
  }
  STATE.hasBootstrapped = true;

  resizeCanvasToViewport();

  if (
    window.StemWarpFlowerSystem11
    && typeof window.StemWarpFlowerSystem11.createFlowerSystem === 'function'
  ) {
    STATE.flowerSystem = window.StemWarpFlowerSystem11.createFlowerSystem();
  } else {
    console.warn('Flower system module missing (script_11_flowers.js). Flowers are disabled.');
  }

  STATE.stemImage = await loadStemTexture();
  STATE.stemImageFlippedX = createHorizontallyFlippedTexture(STATE.stemImage);
  STATE.leafImage = await loadLeafTexture(CONFIG.leaves || {});
  await loadFlowerSpriteIntoSystem();
  resetFilteredStemTextureCache();
  await loadManualTemplateSources();
  STATE.branchGarden = new BranchGarden();

  // Optional center branch.
  // STATE.branchGarden.addBranch(STATE.viewportWidth * 0.5, STATE.viewportHeight * 0.9, -1);

  // Plant many side branches from seeds.
  STATE.lastSeedPacket = setSeeds();
  plantSeeds(STATE.lastSeedPacket, { clearFirst: true });

  if (CONFIG.performance.enabled) {
    resetPerformanceCounters();
  }
  renderScene();
  setupEventHandlers();
  exposeDevToolsApi();
  // createPathGenerationControls();
  // createOffshootControls();
}

// =========================
// 18) Run Area
// =========================
window.addEventListener('load', () => {
  bootstrap().catch((error) => {
    console.error('Failed to bootstrap script_11.js', error);
  });
});
