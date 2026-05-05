// -----------------------------------------------------------------------------
// Stem Strip-Warp Demo (Canvas 2D)
// -----------------------------------------------------------------------------
// This script builds a random branch-like path, smooths it, and then draws a
// vertical raster image (stem texture) along that path using strip slicing.
//
// High-level flow:
// 1) Generate random control points with noise.
// 2) Convert those points into a smooth polyline (B-spline sampled to points).
// 3) Wrap the smooth points in a path abstraction with arc-length sampling.
// 4) Render thin image strips aligned to local path tangent/normal.
// 5) Draw optional debug overlays and expose runtime controls via DevTools.
// -----------------------------------------------------------------------------

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// Scene/canvas globals.
const BACKGROUND_COLOR = 'rgb(30, 40, 42)';
const dpr = window.devicePixelRatio || 1;

let viewportWidth = 0;
let viewportHeight = 0;

// Noise instance from noisejs CDN. If unavailable, we fall back to a math noise.
const noiseGenerator = typeof Noise === 'function' ? new Noise(Math.random()) : null;

// -----------------------------------------------------------------------------
// Random branch generation settings
// -----------------------------------------------------------------------------
const step_size = 1;
const noise_scale = 0.7;
const fixed_time_step = 1 / 60;
const checkpoint_count = 400;
const checkpoint_spacing_steps = 100;
const checkpoint_hit_radius = 10;

// Mutable runtime state.
let timeCursor = Date.now() / 1000;
let matchedCheckpointIndices = new Set();
let activeControlPoints = [];
let activePath = null;

// -----------------------------------------------------------------------------
// Small math helpers
// -----------------------------------------------------------------------------

// Clamp a value into [min, max].
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Positive modulo so negative offsets still wrap correctly.
function positiveModulo(value, mod) {
  if (mod === 0) {
    return 0;
  }
  return ((value % mod) + mod) % mod;
}

// Return a normalized vector. For near-zero vectors, return a safe default.
function normalize(vec) {
  const length = Math.hypot(vec.x, vec.y);
  if (length < 1e-8) {
    return { x: 1, y: 0 };
  }
  return {
    x: vec.x / length,
    y: vec.y / length,
  };
}

// Basic deterministic fallback when noisejs is not present.
function fallbackNoise2(x, y) {
  return Math.sin(x * 12.9898 + y * 78.233);
}

// -----------------------------------------------------------------------------
// Random branch path generation
// -----------------------------------------------------------------------------

// Generate one movement delta from noise at a given simulation time.
// `direction` flips the branch's horizontal tendency.
function getNoiseDelta(time, direction = -1) {
  const x1 = time / step_size;
  const y1 = time / step_size;
  const x2 = x1 + 4895943;
  const y2 = y1 + 4838485943;

  // Two independent noise samples so X and Y motion are decorrelated.
  const n1 = noiseGenerator ? noiseGenerator.perlin2(x1, y1) : fallbackNoise2(x1, y1);
  const n2 = noiseGenerator ? noiseGenerator.perlin2(x2, y2) : fallbackNoise2(x2, y2);

  return {
    dx: Math.abs(n1) * noise_scale * direction,
    dy: Math.abs(n2) * noise_scale * -1,
  };
}

// Create a branch-like polyline as a list of control points.
// The result is intentionally jagged first; smoothing happens later.
function generate_branch(x, y, dir = -1) {
  let simX = x;
  let simY = y;
  const generated = [{ x: simX, y: simY }];

  for (let i = 0; i < checkpoint_count; i += 1) {
    for (let j = 0; j < checkpoint_spacing_steps; j += 1) {
      timeCursor += fixed_time_step;
      const delta = getNoiseDelta(timeCursor, dir);
      simX += delta.dx;
      simY += delta.dy;
    }
    generated.push({ x: simX, y: simY });
  }

  return generated;
}

// Track whether a moving position has entered any checkpoint radius.
// Kept from earlier logic and still used inside the animation loop.
function check_match(points, current_pos) {
  for (let i = 0; i < points.length; i += 1) {
    if (matchedCheckpointIndices.has(i)) {
      continue;
    }

    const dx = points[i].x - current_pos.x;
    const dy = points[i].y - current_pos.y;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared <= checkpoint_hit_radius * checkpoint_hit_radius) {
      matchedCheckpointIndices.add(i);
      return true;
    }
  }
  return false;
}

// -----------------------------------------------------------------------------
// Debug drawing helpers
// -----------------------------------------------------------------------------

// Draw one checkpoint marker.
function drawCircleFromPos(x, y, radius = 2, fill = 'rgba(124, 248, 186, 0.5)') {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'black';
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

// Draw every checkpoint in a list.
function drawCheckpoints(points) {
  for (let i = 0; i < points.length; i += 1) {
    drawCircleFromPos(points[i].x, points[i].y, 2);
  }
}

// -----------------------------------------------------------------------------
// Curve smoothing helpers
// -----------------------------------------------------------------------------

// Uniformly sample one cubic Bezier segment into polyline points.
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

// Convert control points to a smooth polyline by:
// 1) treating them as an open-uniform cubic B-spline,
// 2) converting each span to a cubic Bezier,
// 3) sampling each Bezier to dense points.
function buildBSplinePolyline(controlPoints, subdivisionsPerSpan = 10) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
    return [];
  }

  // End-point clamping for stable start/end behavior.
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

    // B-spline to Bezier conversion weights.
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

    // Skip first point after first span so spans do not duplicate joints.
    for (let j = 0; j < sampled.length; j += 1) {
      if (result.length > 0 && j === 0) {
        continue;
      }
      result.push(sampled[j]);
    }
  }

  return result;
}

// Draw the smooth B-spline curve itself (debug visualization).
function drawCurve(points, stroke = 'rgba(236, 66, 66, 0.9)', lineWidth = 2.2) {
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

// -----------------------------------------------------------------------------
// Texture loading
// -----------------------------------------------------------------------------

// Load a raster image asynchronously.
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image: ' + url));
    image.src = url;
  });
}

// Build a procedural fallback texture in case the stem image fails to load.
function createFallbackStemTexture() {
  const texture = document.createElement('canvas');
  texture.width = 160;
  texture.height = 600;
  const textureCtx = texture.getContext('2d');

  const stemGradient = textureCtx.createLinearGradient(0, 0, 0, texture.height);
  stemGradient.addColorStop(0, '#8dd17d');
  stemGradient.addColorStop(0.4, '#5da460');
  stemGradient.addColorStop(1, '#3f7f4a');

  textureCtx.fillStyle = stemGradient;
  textureCtx.fillRect(0, 0, texture.width, texture.height);

  textureCtx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 48; i += 1) {
    const x = (i / 47) * texture.width;
    textureCtx.fillStyle = i % 2 === 0 ? 'rgba(16, 45, 20, 0.09)' : 'rgba(8, 25, 14, 0.07)';
    textureCtx.fillRect(x, 0, 2, texture.height);
  }
  textureCtx.globalCompositeOperation = 'source-over';

  textureCtx.fillStyle = 'rgba(220, 255, 220, 0.22)';
  textureCtx.fillRect(texture.width * 0.44, 0, texture.width * 0.08, texture.height);

  return texture;
}

// -----------------------------------------------------------------------------
// Generic path abstraction
// -----------------------------------------------------------------------------

// PolylinePath precomputes segment lengths so any consumer can sample by arc
// length (distance), not by naive point index. This keeps strip spacing even.
class PolylinePath {
  constructor(points) {
    if (!Array.isArray(points) || points.length < 2) {
      throw new Error('PolylinePath requires at least 2 points');
    }

    this.points = points.map((point) => ({ x: point.x, y: point.y }));
    this.segments = [];
    this.cumulativeLengths = [0];
    this.totalLength = 0;

    // Build per-segment metadata once for fast repeated sampling.
    for (let i = 0; i < this.points.length - 1; i += 1) {
      const start = this.points[i];
      const end = this.points[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);

      // Skip degenerate segments.
      if (length < 1e-8) {
        continue;
      }

      this.segments.push({
        start,
        end,
        dx,
        dy,
        length,
        tangent: {
          x: dx / length,
          y: dy / length,
        },
      });

      this.totalLength += length;
      this.cumulativeLengths.push(this.totalLength);
    }

    if (this.segments.length === 0) {
      throw new Error('PolylinePath points are degenerate (zero-length path)');
    }
  }

  // Total path length in pixels.
  getTotalLength() {
    return this.totalLength;
  }

  // Position at a distance from path start.
  getPointAtLength(distance) {
    const sample = this.#sampleAtDistance(distance);
    return { x: sample.point.x, y: sample.point.y };
  }

  // Unit tangent at a distance from path start.
  getTangentAtLength(distance) {
    const sample = this.#sampleAtDistance(distance);
    return { x: sample.tangent.x, y: sample.tangent.y };
  }

  // Unit normal derived from tangent (rotated 90 degrees).
  getNormalAtLength(distance) {
    const tangent = this.getTangentAtLength(distance);
    return {
      x: -tangent.y,
      y: tangent.x,
    };
  }

  // Utility used by debug rendering to quickly inspect path shape.
  getSampledPoints(step = 8) {
    const points = [];
    const spacing = Math.max(1, step);
    for (let distance = 0; distance <= this.totalLength; distance += spacing) {
      points.push(this.getPointAtLength(distance));
    }
    points.push(this.getPointAtLength(this.totalLength));
    return points;
  }

  // Binary-search the segment that contains distance `d`, then interpolate.
  #sampleAtDistance(distance) {
    const d = clamp(distance, 0, this.totalLength);

    let low = 0;
    let high = this.segments.length - 1;
    let segmentIndex = 0;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const segStart = this.cumulativeLengths[mid];
      const segEnd = this.cumulativeLengths[mid + 1];

      if (d < segStart) {
        high = mid - 1;
      } else if (d > segEnd) {
        low = mid + 1;
      } else {
        segmentIndex = mid;
        break;
      }
    }

    const segment = this.segments[segmentIndex];
    const startLength = this.cumulativeLengths[segmentIndex];
    const localT = segment.length < 1e-8 ? 0 : (d - startLength) / segment.length;

    return {
      point: {
        x: segment.start.x + segment.dx * localT,
        y: segment.start.y + segment.dy * localT,
      },
      tangent: {
        x: segment.tangent.x,
        y: segment.tangent.y,
      },
    };
  }
}

// -----------------------------------------------------------------------------
// Strip-slicing brush renderer
// -----------------------------------------------------------------------------

// Draws a vertical source image as many thin strips mapped along a path.
class StripBrushRenderer {
  constructor(context, image, options = {}) {
    this.ctx = context;
    this.image = image;
    this.options = {
      stripWidth: 2,
      scale: 0.5,
      sclale: undefined,
      pathOffset: 0,
      repeatGap: 0,
      repeatOverlap: 0,
      startOffset: 0,
      cropPartialRepeat: true,
      debug: false,
      showStripBoundaries: false,
      debugSampleSpacing: 110,
      ...options,
    };
  }

  // Merge new options into current defaults.
  setOptions(nextOptions = {}) {
    this.options = { ...this.options, ...nextOptions };
  }

  // Resolve scale with typo compatibility (`sclale`) for convenience.
  #getEffectiveScale(options) {
    if (Number.isFinite(options.scale) && options.scale > 0) {
      return options.scale;
    }

    if (Number.isFinite(options.sclale) && options.sclale > 0) {
      return options.sclale;
    }

    return 0.5;
  }

  // Main draw method.
  render(path, overrideOptions = {}) {
    const options = { ...this.options, ...overrideOptions };
    this.#validatePath(path);

    const pathLength = path.getTotalLength();
    if (pathLength <= 0) {
      return;
    }

    // Derived dimensions in path space.
    const brushScale = this.#getEffectiveScale(options);
    const stripLength = Math.max(0.5, options.stripWidth);
    const widthOnPath = this.image.width * brushScale;
    const tileDrawLength = this.image.height * brushScale;
    const tileStep = Math.max(stripLength * 0.5, tileDrawLength + options.repeatGap - options.repeatOverlap);

    // Start offset is applied as a wrapped phase so it remains stable.
    const phase = positiveModulo(options.startOffset, tileStep);
    let tileStart = -phase;

    const debugStripCenters = [];

    // Mapping convention for a vertical source image:
    // - Source Y maps to distance ALONG the path.
    // - Source X maps to width ACROSS the path (normal direction).
    for (; tileStart < pathLength; tileStart += tileStep) {
      let localStart = 0;
      let localEnd = tileDrawLength;

      // Optional clipping for first/last partial tile.
      if (options.cropPartialRepeat) {
        localStart = Math.max(localStart, -tileStart);
        localEnd = Math.min(localEnd, pathLength - tileStart);
      }

      if (localEnd <= localStart) {
        continue;
      }

      // Iterate strips inside this one tile.
      for (let localAlongPath = localStart; localAlongPath < localEnd; localAlongPath += stripLength) {
        const currentStripLength = Math.min(stripLength, localEnd - localAlongPath);
        const distanceOnPath = tileStart + localAlongPath + currentStripLength * 0.5;

        if (distanceOnPath < 0 || distanceOnPath > pathLength) {
          continue;
        }

        // Map destination strip range back to source image Y slice.
        const sourceY = localAlongPath / brushScale;
        if (sourceY >= this.image.height) {
          break;
        }

        const sourceHeight = Math.min(currentStripLength / brushScale, this.image.height - sourceY);
        if (sourceHeight <= 0) {
          continue;
        }

        // Sample orientation from path.
        const point = path.getPointAtLength(distanceOnPath);
        const tangent = normalize(path.getTangentAtLength(distanceOnPath));
        const normal = {
          x: -tangent.y,
          y: tangent.x,
        };

        // Optional normal offset pushes brush inward/outward.
        const origin = {
          x: point.x + normal.x * options.pathOffset,
          y: point.y + normal.y * options.pathOffset,
        };

        this.ctx.save();

        // Local frame:
        // - x axis = normal
        // - y axis = tangent
        // This is what bends the texture to path curvature.
        this.ctx.transform(normal.x, normal.y, tangent.x, tangent.y, origin.x, origin.y);

        this.ctx.drawImage(
          this.image,
          0,
          sourceY,
          this.image.width,
          sourceHeight,
          -widthOnPath * 0.5,
          -currentStripLength * 0.5,
          widthOnPath,
          currentStripLength,
        );

        if (options.debug && options.showStripBoundaries) {
          this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.65)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(-widthOnPath * 0.5, -currentStripLength * 0.5, widthOnPath, currentStripLength);
        }

        this.ctx.restore();

        if (options.debug) {
          debugStripCenters.push({ point, tangent, normal });
        }
      }
    }

    if (options.debug) {
      this.#drawDebug(path, options, debugStripCenters);
    }
  }

  // Validate path interface shape.
  #validatePath(path) {
    const requiredMethods = ['getTotalLength', 'getPointAtLength', 'getTangentAtLength'];
    for (let i = 0; i < requiredMethods.length; i += 1) {
      const method = requiredMethods[i];
      if (typeof path[method] !== 'function') {
        throw new Error('Path object is missing required method: ' + method);
      }
    }
  }

  // Draw path/axes/strip-center debug overlays.
  #drawDebug(path, options, stripCenters) {
    let sampled = [];
    if (path.getSampledPoints) {
      sampled = path.getSampledPoints(8);
    } else {
      const totalLength = path.getTotalLength();
      for (let distance = 0; distance <= totalLength; distance += 8) {
        sampled.push(path.getPointAtLength(distance));
      }
      sampled.push(path.getPointAtLength(totalLength));
    }

    // Debug path polyline.
    if (sampled.length > 1) {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(114, 191, 255, 0.9)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(sampled[0].x, sampled[0].y);
      for (let i = 1; i < sampled.length; i += 1) {
        this.ctx.lineTo(sampled[i].x, sampled[i].y);
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    const sampleSpacing = Math.max(16, options.debugSampleSpacing);
    const totalLength = path.getTotalLength();

    // Debug tangent/normal at sparse sample points.
    this.ctx.save();
    for (let distance = 0; distance <= totalLength; distance += sampleSpacing) {
      const point = path.getPointAtLength(distance);
      const tangent = normalize(path.getTangentAtLength(distance));
      const normal = {
        x: -tangent.y,
        y: tangent.x,
      };

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(255, 91, 91, 0.85)';
      this.ctx.lineWidth = 1.2;
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.ctx.lineTo(point.x + tangent.x * 28, point.y + tangent.y * 28);
      this.ctx.stroke();

      this.ctx.strokeStyle = 'rgba(85, 242, 147, 0.85)';
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.ctx.lineTo(point.x + normal.x * 20, point.y + normal.y * 20);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Debug strip center cloud (downsampled).
    if (stripCenters.length > 0) {
      const step = Math.max(1, Math.floor(stripCenters.length / 350));
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 202, 39, 0.32)';
      for (let i = 0; i < stripCenters.length; i += step) {
        const center = stripCenters[i];
        this.ctx.beginPath();
        this.ctx.arc(center.point.x, center.point.y, 1.3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }
}

// -----------------------------------------------------------------------------
// Runtime rendering configuration
// -----------------------------------------------------------------------------

const brushOptions = {
  // Width of each strip in destination pixels (smaller = smoother, heavier).
  stripWidth: 2.5,
  // Global brush scale from source image into path space.
  scale: 0.47,
  // Typo-compatible alias kept intentionally.
  sclale: undefined,
  // Offset brush center along normal (+/-).
  pathOffset: 0,
  // Gap or overlap between repeated image tiles.
  repeatGap: -35,
  repeatOverlap: 0,
  // Slide tiling phase along the path.
  startOffset: 0,
  // Crop partial tile fragments at path boundaries.
  cropPartialRepeat: true,
  // Debug visuals.
  debug: true,
  showStripBoundaries: false,
  debugSampleSpacing: 120,
  showControlPoints: true,
  showControlCurve: true,
};

let stemTexture = null;
let brushRenderer = null;
let animationHandle = 0;

// -----------------------------------------------------------------------------
// Canvas + scene lifecycle
// -----------------------------------------------------------------------------

// Resize backing buffer and apply DPR-aware transform.
function resizeCanvas() {
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  canvas.style.width = viewportWidth + 'px';
  canvas.style.height = viewportHeight + 'px';
  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// Paint solid background each frame.
function drawBackground() {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);
}

// Rebuild random control points and derived smooth sampling path.
function rebuildPathFromRandomBranch() {
  const startX = viewportWidth * 0.5;
  const startY = viewportHeight * 0.9;

  matchedCheckpointIndices = new Set();
  activeControlPoints = generate_branch(startX, startY, -1);

  const smoothed = buildBSplinePolyline(activeControlPoints, 10);
  activePath = new PolylinePath(smoothed.length >= 2 ? smoothed : activeControlPoints);
}

// Render full frame: background, brush, and optional debug overlays.
function renderScene() {
  if (!brushRenderer || !activePath) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawBackground();

  // Use live options object so runtime edits are visible immediately.
  brushRenderer.render(activePath, brushOptions);

  if (brushOptions.debug && brushOptions.showControlPoints) {
    drawCheckpoints(activeControlPoints);
  }

  if (brushOptions.debug && brushOptions.showControlCurve) {
    drawCurve(activeControlPoints, 'rgba(74, 222, 128, 0.6)', 1.6);
  }
}

// Main animation loop.
function animate() {
  // Compatibility hook from earlier logic.
  if (activeControlPoints.length > 0) {
    const currentPos = activeControlPoints[0];
    check_match(activeControlPoints, currentPos);
  }

  renderScene();
  animationHandle = requestAnimationFrame(animate);
}

// Startup sequence.
async function bootstrap() {
  resizeCanvas();

  try {
    stemTexture = await loadImage('./stem_2.png');
  } catch (error) {
    console.warn(error.message + ' | Falling back to generated stem texture.');
    stemTexture = createFallbackStemTexture();
  }

  brushRenderer = new StripBrushRenderer(ctx, stemTexture, brushOptions);
  rebuildPathFromRandomBranch();

  if (animationHandle) {
    cancelAnimationFrame(animationHandle);
  }
  animate();
}

// Recompute path on viewport resize.
window.addEventListener('resize', () => {
  resizeCanvas();
  // Do not regenerate here: browser zoom triggers resize, and regeneration
  // should only happen on explicit actions (initial load or pressing "R").
  if (!activePath || activeControlPoints.length < 2) {
    rebuildPathFromRandomBranch();
  }
  renderScene();
});

// Press R to regenerate a different random path.
window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    rebuildPathFromRandomBranch();
    renderScene();
  }
});

// -----------------------------------------------------------------------------
// DevTools control surface
// -----------------------------------------------------------------------------

// Exposed helpers:
// - window.stemWarpDemo.regenerate()
// - window.stemWarpDemo.setBrushOptions({ stripWidth: 6, scale: 0.25 })
window.stemWarpDemo = {
  PolylinePath,
  generate_branch,
  buildBSplinePolyline,
  brushOptions,

  // Regenerate the random path and redraw.
  regenerate() {
    rebuildPathFromRandomBranch();
    renderScene();
  },

  // Merge runtime brush option updates and redraw.
  setBrushOptions(nextOptions) {
    Object.assign(brushOptions, nextOptions);
    renderScene();
  },

  // Replace current control points manually.
  setControlPoints(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return;
    }

    activeControlPoints = points.map((point) => ({ x: point.x, y: point.y }));
    const smoothed = buildBSplinePolyline(activeControlPoints, 10);
    activePath = new PolylinePath(smoothed.length >= 2 ? smoothed : activeControlPoints);
    renderScene();
  },

  // Force redraw without changing state.
  rerender() {
    renderScene();
  },
};

bootstrap();
