<h1> BRUSH </h1>

The selected code snippet defines a `brush` configuration object within the `CONFIG` object in script_10.js. This configuration controls how a texture (like a stem image) is applied along generated paths (e.g., branches) in the drawing system. It's used primarily in the `drawBrushAlongPath` function to simulate a brushstroke effect by tiling and positioning the texture along the path.

Here's a breakdown of each property, including its purpose, typical values, and how it affects the rendering:

- **`stripWidth: 0.2`**  
  Defines the width (in pixels) of each individual "strip" or segment of the texture drawn along the path. Smaller values create finer, more detailed strokes; larger values make broader, chunkier ones. This acts as the step size for sampling the texture vertically.

- **`scale: 0.08`**  
  A scaling factor applied to the texture image's dimensions (width and height). It controls how large the texture appears when drawn. Values less than 1 shrink it (e.g., 0.08 makes it 8% of original size), while values greater than 1 enlarge it. This affects both the width on the path and the length of each tile.

- **`sclale: undefined`**  
  This is a typo for "scale" (likely meant to be `scale`), set to `undefined` for backward compatibility. The code checks for both `scale` and `sclale` in `getBrushScale`, preferring the correctly spelled one if it's a valid number. It's ignored if `scale` is defined.

- **`pathOffset: 0`**  
  An offset (in pixels) from the path's center line. Positive values shift the texture outward (perpendicular to the path direction), negative values shift it inward. A value of 0 centers it directly on the path. This can create effects like raised or inset strokes.

- **`repeatGap: -35`**  
  The gap (in pixels) between repeated tiles of the texture along the path. Negative values (like -35) cause overlapping tiles, creating a seamless or blended effect. Positive values add space between repeats, making the pattern more spaced out.

- **`repeatOverlap: 0`**  
  The amount of overlap (in pixels) between consecutive texture tiles. This works in conjunction with `repeatGap` to control how tiles blend. A value of 0 means no extra overlap beyond what's implied by `repeatGap`. Positive values increase blending for smoother transitions.

- **`startOffset: 0`**  
  An initial offset (in pixels) for the starting position of the texture pattern along the path. It shifts the entire repeating pattern. For example, 0 starts at the path's beginning; a positive value skips ahead, creating a staggered effect.

- **`cropPartialRepeat: true`**  
  A boolean flag controlling whether partial tiles (e.g., at the start or end of the path) are cropped to fit within the path's length. When `true`, it prevents drawing beyond the path's bounds, ensuring clean edges. When `false`, partial tiles might extend outside the path.

These settings work together to create a customizable "brush" effect for texturing paths. For example, adjusting `scale` and `stripWidth` can make strokes look like thin vines or thick trunks, while `repeatGap` and `repeatOverlap` control how seamless the tiling appears. If you modify these values, call `renderScene()` or use the exposed API (e.g., `window.stemWarpDemo10.setBrushOptions()`) to see changes. Let me know if you'd like examples or help tweaking them!

<h1> DEBUG </h1>

The selected code snippet defines a `debug` configuration object within the `CONFIG` object in script_10.js. This configuration controls various visual debugging overlays that help visualize the internal workings of the path generation, smoothing, and rendering system. These are primarily used in the `renderBranch` function and related drawing helpers (like `drawPathOutline`, `drawPathVectors`, etc.) to overlay debug information on the canvas. They're only rendered if `enabled` is `true`.

Here's a breakdown of each property, including its purpose, typical values, and how it affects the rendering:

- **`enabled: false`**  
  A master toggle for all debug visuals. When `false`, no debug overlays are drawn (performance-friendly for production). When `true`, the other debug options take effect, allowing you to inspect the scene's internals.

- **`showStripBounds: false`**  
  When enabled, draws yellow bounding rectangles around each "strip" (segment) of the texture applied along the path in `drawBrushAlongPath`. This helps visualize how the texture is tiled and positioned, useful for debugging brush alignment or cropping issues.

- **`showStripCenters: true`**  
  When enabled, draws small yellow dots at the center of each strip along the path. This highlights the sampling points where texture strips are placed, making it easier to see the density and distribution of the brush effect.

- **`showPathOutline: true`**  
  When enabled, draws a blue outline of the smoothed path (using `drawPathOutline`). It samples points along the path at intervals defined by `pathSampleStep` and connects them with a line, showing the final curved trajectory of each branch.

- **`showTangents: false`**  
  When enabled (part of `drawPathVectors`), draws red arrows indicating the tangent (direction) vectors at sampled points along the path. These show the local direction the path is heading, useful for verifying curve orientation and smoothness.

- **`showNormals: false`**  
  When enabled (part of `drawPathVectors`), draws green arrows indicating the normal (perpendicular) vectors at sampled points along the path. These are rotated 90 degrees from the tangents and help visualize the "side" of the path, which is key for offsetting textures or brushes.

- **`showControlPoints: true`**  
  When enabled, draws small green circles at the raw control points generated by noise (using `drawControlPoints`). These are the unsmoothed points that define the branch's shape before B-spline smoothing, showing the underlying noise-driven structure.

- **`showControlCurve: true`**  
  When enabled, draws a green curved line connecting the control points (using `drawControlCurve`). This visualizes the B-spline curve before it's converted to the final smoothed path, helping debug the smoothing process.

- **`pathSampleStep: 8`**  
  Defines the spacing (in pixels) between sampled points when drawing the path outline (in `drawPathOutline` and `samplePathPoints`). Smaller values create a smoother, more detailed outline; larger values make it coarser and faster to render.

- **`vectorSampleSpacing: 120`**  
  Defines the spacing (in pixels) between sampled points when drawing tangent/normal vectors (in `drawPathVectors`). Larger values reduce the number of arrows for clarity; smaller values show more detail but can clutter the view.

These debug options are great for development—set `enabled: true` and toggle individual flags to inspect different aspects of the rendering pipeline. For example, enabling `showControlPoints` and `showControlCurve` helps understand how noise generates branches, while `showTangents` and `showNormals` aid in brush positioning. You can modify them via the exposed API: `window.stemWarpDemo10.setDebugOptions({ enabled: true, showTangents: true })`. Let me know if you'd like help enabling or interpreting specific ones!

<h1> MODULO </h1>

Why use `positiveModulo` (not `Math.abs`) — short answer

- `positiveModulo(x, T)` returns the canonical representative of x modulo T in the interval [0, T).
- `Math.abs(x % T)` only makes the remainder positive; it does not give the correct wrapped position on the modular cycle.

What "warp back to the proper range" means

- Think of the repeating tiles as points around a circle with circumference `T = tileStep`. Any offset `x` corresponds to some point on that circle. We want the single canonical position in `[0, T)` that is congruent to `x` modulo `T` (i.e., the same point on the circle).
- `positiveModulo` computes that canonical representative. `Math.abs` does not — it just flips sign, which can move you to a different point on the circle.

Concrete JS example (the values used in your code)

- Let `x = -50`, `T = 30`.
  - `x % T` in JS → `-20`.
  - `positiveModulo(x, T)` → `((-50 % 30) + 30) % 30` → `(-20 + 30) % 30` → `10`.  
    Interpretation: -50 ≡ 10 (mod 30). Wrapping gives position 10 in [0,30).
  - `Math.abs(x % T)` → `Math.abs(-20)` → `20`.  
    Interpretation: 20 is a different point (not congruent to -50 mod 30).

Why that matters in your loop

- You compute `phase = positiveModulo(startOffset, tileStep)` then `tileStart = -phase`. That yields the correct first tile position so subsequent increments by `tileStep` line up the tiling exactly as intended.
- If you used `Math.abs`, `phase` would be the wrong representative (e.g., 20 instead of 10), so `tileStart` becomes `-20` instead of `-10` and every tile is shifted — visible misalignment or seam in the tiling.

Edge notes

- `positiveModulo` also guards `mod === 0` and returns `0` (safe). `Math.abs` gives no wrapping semantics and wouldn't handle modular behavior correctly.

If you want, I can show a tiny simulation of `tileStart` sequences for both methods so you can see the exact tile positions. Which one would you like to see?

<h1> NORMALIZE FUNCTION </h1>

The `normalize` function converts a 2D vector into a unit vector (length = 1) pointing in the same direction.

**How it works:**

1. **`Math.hypot(vec.x, vec.y)`** — Calculates the vector's length (magnitude) using the Pythagorean theorem: $\sqrt{x^2 + y^2}$

2. **`if (len < 1e-8)`** — Safety check: if the vector is nearly zero-length (vanishingly small), return a default direction `{x: 1, y: 0}` to avoid division by zero.

3. **`{x: vec.x / len, y: vec.y / len}`** — Divide both components by the length. This scales the vector to magnitude 1 while preserving its direction.

**Example:**

- Input: `{x: 3, y: 4}` (length = 5)
- `Math.hypot(3, 4)` = 5
- Output: `{x: 3/5, y: 4/5}` = `{x: 0.6, y: 0.8}` (length = 1) ✓

**In your code** (line 579 and 619), it's used to compute the tangent and normal vectors along paths:

```javascript
const tangent = normalize(getPathTangentAtLength(pathData, d));
const normal = { x: -tangent.y, y: tangent.x };
```

This ensures the tangent is a unit vector, so the perpendicular `normal` is also properly scaled for brush positioning and transformations.

.
.

<h1> getNoiseDelta() FUNCTION</h1>

The `getNoiseDelta` function is a core utility in this script for generating organic, procedural paths (like branching structures) by simulating small, smooth displacements over time. It leverages Perlin noise—a type of gradient noise known for its natural, continuous randomness—to create "random" but coherent movements that avoid jagged or unpredictable jumps. Instead of directly drawing points, it computes incremental changes (deltas) in position that accumulate into a path when used iteratively in functions like `generateBranchControlPoints`. This approach mimics natural growth patterns, such as vines or roots, where each step builds on the previous one for a fluid, lifelike curve.

I'll break this down step by step: the function's overall purpose, how it uses Perlin noise to achieve organic path generation, and a detailed explanation of each variable (including parameters and internal ones). I'll reference the code and related parts of the script for context.

### Overall Purpose

- **What it does**: This function calculates a small 2D displacement vector (`{ dx, dy }`) that represents how much a point should move in the x (horizontal) and y (vertical) directions for the next step in a path. It's not drawing anything directly—it's providing the "instructions" for movement. When called repeatedly (e.g., in a loop), these deltas accumulate to form a path of points that looks organic and branching, like a plant stem growing in a windy field.
- **How it achieves organic path generation with Perlin noise**: Perlin noise generates smooth, pseudo-random values that vary continuously across a 2D space (like a heightmap). By sampling noise at coordinates that advance over "time" (a progression variable), the function creates correlated randomness—small changes lead to gradual curves, not erratic jumps. The noise is scaled, offset, and directed to control the path's shape, ensuring branches grow left/right or up/down in a natural way. Without noise, paths would be straight lines; with noise, they wiggle organically. The function uses two independent noise samples (with large offsets) to generate x and y displacements separately, allowing for asymmetric growth (e.g., more horizontal than vertical movement).
- **Role in the broader script**: It's called inside `generateBranchControlPoints` (around line 150), where it's used in a nested loop to perturb a starting position (`simX`, `simY`) over many steps. Each call advances a `timeCursor`, and the resulting deltas are added to the position, building a list of control points. These points are later smoothed into a B-spline curve and rendered as textured paths. This enables multi-branch growth where each branch has its own "personality" via noise phases and multipliers.

### Detailed Explanation of Each Variable

The function has 5 parameters and several internal variables. I'll explain them in order of appearance, including their types, roles, and how they contribute to the noise-based path generation.

#### Parameters (Inputs)

1. **`time`** (number, required):
   - **What it is**: A numeric value representing the current "simulation time" or progression along the path. It starts small (e.g., 0) and increases with each step (e.g., by `noiseConfig.timeStep` in the calling loop).
   - **Role**: Acts as the primary driver for noise sampling. It advances the coordinates where noise is queried, ensuring that nearby time values produce similar (correlated) noise values. This creates smooth, continuous curves—think of it as the "x-axis" in a time-based animation. Without advancing `time`, the path wouldn't progress; with it, the noise evolves gradually, mimicking organic growth over time.
   - **Example**: If `time` is 0, noise is sampled at the starting point; at `time = 10`, it's sampled further along, producing a slightly different displacement.

2. **`direction`** (number, default: -1):
   - **What it is**: A multiplier (typically +1 or -1) that controls the overall horizontal direction of growth.
   - **Role**: Determines whether the path grows leftward (-1) or rightward (+1). It multiplies the x-displacement (`dx`), flipping the sign to make branches curve in the desired direction. This is crucial for multi-branch systems where left-side branches grow right and right-side branches grow left (as seen in `setSeeds`). Without it, all branches would grow in the same direction, losing asymmetry.

3. **`noiseConfig`** (object, default: `CONFIG.noise`):
   - **What it is**: A configuration object containing noise-related settings (e.g., `{ stepSize: 3, scale: 2, timeStep: 1/100, ... }` from the global `CONFIG`).
   - **Role**: Provides tunable parameters for noise behavior. Specifically:
     - `stepSize`: Scales how `time` affects noise coordinates (higher values make noise change slower, leading to smoother paths).
     - `scale`: Multiplies the final displacements, controlling overall "wiggliness" (higher = more pronounced curves).
     - Other properties (like `timeStep`) are used in the calling loop but not directly here.
   - **Why it's configurable**: Allows fine-tuning path complexity without changing the function's logic. For example, increasing `scale` makes branches more erratic.

4. **`noisePhase`** (object, default: `{ x1: 0, y1: 0, x2: 0, y2: 0 }`):
   - **What it is**: An object with four numeric offsets (`x1`, `y1`, `x2`, `y2`) that shift the noise sampling coordinates.
   - **Role**: Introduces variation between branches so they aren't identical copies. Each branch gets random phase values (set in the `Branch` class constructor), decorrelating their noise patterns. This prevents all branches from following the same path—essential for a "garden" of unique branches. Without phases, branches would mirror each other.

5. **`noiseScaleMultiplier`** (number, default: 1):
   - **What it is**: A scaling factor for the noise effect.
   - **Role**: Multiplies the final displacements, allowing per-branch intensity control. In the `Branch` class, it's randomized (e.g., 0.75–1.35) to make some branches wigglier than others. A value >1 amplifies noise for more chaotic paths; <1 dampens it for straighter ones.

#### Internal Variables (Computed Inside the Function)

1. **`x1` and `y1`** (numbers):
   - **Calculation**: `x1 = time / noiseConfig.stepSize + noisePhase.x1; y1 = time / noiseConfig.stepSize + noisePhase.y1;`
   - **Role**: These are the primary 2D coordinates for the first noise sample. `time` is divided by `stepSize` to control how quickly the noise "evolves" (larger `stepSize` = slower change). The phase offsets (`noisePhase.x1/y1`) shift the sampling space, ensuring branch uniqueness. These coordinates define where in the Perlin noise field the first displacement component is sampled.

2. **`x2` and `y2`** (numbers):
   - **Calculation**: `x2 = x1 + 4895943 + noisePhase.x2; y2 = y1 + 4838485943 + noisePhase.y2;`
   - **Role**: Secondary coordinates for the second noise sample, offset by large constants (4895943 and 4838485943) to ensure independence from the first sample. This prevents x and y displacements from being correlated (e.g., if both used the same noise, paths might only move diagonally). The phase offsets (`noisePhase.x2/y2`) add further decorrelation. These are sampled separately to generate distinct noise for horizontal vs. vertical movement.

3. **`n1` and `n2`** (numbers):
   - **Calculation**: `n1 = sampleNoise2(x1, y1); n2 = sampleNoise2(x2, y2);`
   - **Role**: The raw Perlin noise values sampled at the coordinates above. `sampleNoise2` (which calls `getNoiseInstance()` and falls back to `fallbackNoise2`) returns smooth, continuous values between roughly -1 and 1. These are the "random" inputs that drive the displacements—Perlin noise ensures they're coherent (nearby coordinates give similar values) for organic curves.

4. **`dx` and `dy`** (numbers, returned in the object):
   - **Calculation**: `dx = Math.abs(n1) * noiseConfig.scale * noiseScaleMultiplier * direction; dy = Math.abs(n2) * noiseConfig.scale * noiseScaleMultiplier * -1;`
   - **Role**: The final displacement components. `Math.abs` ensures positive values (noise can be negative, but displacements are always outward). They're scaled by `noiseConfig.scale` and `noiseScaleMultiplier` for intensity control, then directed: `dx` uses `direction` for left/right bias, while `dy` is negated (`* -1`) to bias upward growth (since branches often grow "up" the screen). These deltas are added to the current position in the calling loop, accumulating into a path.

### How It All Comes Together for Path Generation

- **Step-by-step process**: Start at a seed position. For each time step, call `getNoiseDelta` with increasing `time`, get `{ dx, dy }`, and add them to the position. Repeat to build points. Smooth the points with B-splines for fluidity.
- **Why Perlin noise?**: Unlike random noise (which is spiky), Perlin provides gradients that create natural-looking variations. The two-sample approach (x1/y1 and x2/y2) allows independent control of x/y movement.
- **Edge cases**: If noise fails (e.g., no library), it falls back to `Math.sin`, which is less smooth but still works. Guards like `Math.abs` prevent negative displacements from reversing growth.
- **Tuning for realism**: Adjust `scale` for curve intensity, `stepSize` for smoothness, or phases for variety. This function is why the branches look like living plants rather than straight lines.

If you have questions about how this integrates with other functions (e.g., `generateBranchControlPoints`) or want to tweak the noise parameters, let me know!

<h1>  sampleCubicBezier() FUNCTION </h1>
Optimizing tool selection...## What `sampleCubicBezier` does

This function takes a cubic Bezier curve defined by four control points and turns it into a list of evenly spaced sample points along that curve.

### Inputs

- `p0`, `p1`, `p2`, `p3`
  - These are the four control points of a cubic Bezier curve.
  - `p0` is the start point.
  - `p1` and `p2` are the two control handles.
  - `p3` is the end point.
- `subdivisions`
  - Controls how many segments the curve is split into.
  - The function uses `Math.max(2, subdivisions)`, so it always samples at least 3 points along the curve.

### Output

- Returns an array of points:
  - `{ x, y }` objects
  - One point for each sampled `t` value from `0` to `1`.

---

## The math inside

This is the standard cubic Bezier equation using Bernstein polynomials.

For each sample step:

- `t = i / count`
- `mt = 1 - t`

Then the point is computed as:

x = mt³ \* p0.x

- 3 _ mt² _ t \* p1.x
- 3 _ mt _ t² \* p2.x
- t³ \* p3.x

y = mt³ \* p0.y

- 3 _ mt² _ t \* p1.y
- 3 _ mt _ t² \* p2.y
- t³ \* p3.y

### What each term means

- `mt³ * p0`
  - weight of the start point
  - largest when `t` is near 0
- `3 * mt² * t * p1`
  - weight of the first handle
  - influences the early curve shape
- `3 * mt * t² * p2`
  - weight of the second handle
  - influences the later curve shape
- `t³ * p3`
  - weight of the end point
  - largest when `t` is near 1

The coefficients `1`, `3`, `3`, `1` are the cubic Bernstein basis values:

- they make sure the curve starts at `p0`
- ends at `p3`
- and is smoothly pulled by `p1` and `p2`

---

## Why `buildBSplinePolyline` calls it

`buildBSplinePolyline` does not draw curves directly. It builds a smooth polyline from the branch control points.

### How that works

1. It converts groups of 4 B-spline control points into a cubic Bezier segment:
   - `start`, `cp1`, `cp2`, `end`
   - These are computed from the B-spline control points using standard B-spline-to-Bezier formulas.
2. It then calls `sampleCubicBezier(...)`
   - to generate actual points along that Bezier segment
   - so the spline becomes a list of straight-line samples

### In other words

- `buildBSplinePolyline` computes the curve segment parameters
- `sampleCubicBezier` turns those parameters into real points

So `sampleCubicBezier` is the numeric sampler for the smooth curve, while `buildBSplinePolyline` is the higher-level spline converter.

---

## Why this matters

- `sampleCubicBezier` produces smooth intermediate points
- `buildBSplinePolyline` uses it so branches read as smooth curves instead of jagged straight segments
- this is why the rendered branch paths look organic and continuous

If you want, I can also explain the exact B-spline control-point math used in `buildBSplinePolyline`.

<h1> Pt.2 </h1>

I'll add a quick plan, then explain the two functions and the drawing pipeline.

Created 4 todos

**What `sampleCubicBezier` does**

- **Purpose:** Samples a cubic Bézier curve into discrete points so the curve can be treated as a polyline.
- **Math (parametric form):** for t in [0,1],
  $$
  B(t)=(1-t)^3 p_0 + 3(1-t)^2 t\, p_1 + 3(1-t)t^2\, p_2 + t^3 p_3
  $$
  The four scalar coefficients are the cubic Bernstein basis: $b_0(t)=(1-t)^3$, $b_1(t)=3(1-t)^2t$, $b_2(t)=3(1-t)t^2$, $b_3(t)=t^3$.
- **How the code implements it:** it sets `count = Math.max(2, subdivisions)`, then for i = 0..count computes `t = i/count` and evaluates the formula to push `{x,y}`. That produces `count+1` parameter-uniform samples (not arc-length uniform).
- **Important consequence:** spacing between returned points varies with curvature (tight curve → closer samples in space only if curvature causes parameter to change slowly); if you need equal-distance points, you must reparameterize by arc length.

**What `buildBSplinePolyline` does (and “computes segment parameters”)**

- **High level:** converts the input B-spline control points into a sequence of cubic Bézier segments, samples each segment (by calling `sampleCubicBezier`), concatenates the samples, and returns a smooth polyline.
- **“Computes curve segment parameters” meaning:** for each B-spline span (four successive control points p0..p3) it computes the equivalent Bézier control points (the parameters passed to the Bézier sampler):
  - start (Bézier p0):
    $$
    s = \frac{p_0 + 4p_1 + p_2}{6}
    $$
  - control point 1:
    $$
    c_1 = \frac{4p_1 + 2p_2}{6}
    $$
  - control point 2:
    $$
    c_2 = \frac{2p_1 + 4p_2}{6}
    $$
  - end (Bézier p3):
    $$
    e = \frac{p_1 + 4p_2 + p_3}{6}
    $$
    These linear combinations come from converting a uniform cubic B-spline basis into the cubic Bézier (Bernstein) basis (standard knot-insertion / basis-change result) so the Bézier segment exactly reproduces that spline span.
- **Why those formulas:** they are weighted averages of neighboring B-spline control points chosen so the resulting Bézier segment has the same polynomial coefficients on that parametric span; this preserves shape and C2 continuity across spans.

**How they work together**

- `buildBSplinePolyline`:
  - Extends endpoints (duplicates first and last) to handle boundary spans.
  - For each span computes `start, cp1, cp2, end` (the "segment parameters") using the formulas above.
  - Calls `sampleCubicBezier(start, cp1, cp2, end, subdivisionsPerSpan)` to turn that analytic Bézier into concrete points.
  - Appends sampled points to the output array, skipping the first sample of subsequent segments to avoid duplicate vertices at joins.

**Which function draws the sampled points**

- Pipeline in the code:
  - `generateBranchControlPoints` → produces raw control points.
  - `buildBSplinePolyline(...)` (calls `sampleCubicBezier`) → returns `smoothPoints`.
  - `Branch.regenerate` sets `pointsForPath = this.smoothPoints.length >= 2 ? this.smoothPoints : this.controlPoints` and then calls `createPathData(pointsForPath)` to make `pathData` (segments, cumulative lengths, totalLength).
  - The renderer uses `pathData`: `renderBranch` calls `drawBrushAlongPath(pathData, ...)` to stamp the stem texture along the path and `drawPathOutline(pathData)` (debug) to stroke it.
- So the sampled points are consumed first by `createPathData` (turning points → arc-length segments) and ultimately by `drawBrushAlongPath` / `drawPathOutline` for rendering.

**Notes / practical implications**

- `sampleCubicBezier` samples by parameter t, not by distance. `createPathData` computes segment lengths and provides arc-length info so subsequent code can place textures/tiles along true path distance.
- `subdivisionsPerSpan` controls visual smoothness—higher → smoother polyline but more points.
- If you want perfectly even spacing of final render points, either sample adaptively (split until chord length < ε) or resample by arc-length after `createPathData`.

Would you like a step-by-step derivation of the B-spline → Bézier formulas or a small snippet to resample the polyline by arc length?

<h1> Pt.3 </h1>

Updating the todo list to mark all explanation steps completed.

Completed: _Explain sampleCubicBezier_ (1/4)

Progress: todo list updated and all explanation steps completed. Below is a clear, step‑by‑step explanation with the math and why the overlapping windows are correct.

**Big picture (data flow)**

- `generateBranchControlPoints`: produces sparse control points by integrating perlin-noise deltas.
- `buildBSplinePolyline`: converts those control points into a sequence of cubic Bézier segments and samples each segment.
- `sampleCubicBezier`: evaluates a single cubic Bézier at parameter t ∈ [0,1] and returns many points.
- `createPathData`: turns the sampled polyline into arc-length segments (positions, tangents, lengths).
- `drawBrushAlongPath` / `drawPathOutline`: use `pathData` to render the branch.

**Why `buildBSplinePolyline` duplicates control points (`extended`)**

- The code does:
  - `const extended = [p0, p0, ...controlPoints, pN, pN]`
  - Because `...controlPoints` already contains the original `p0` and `pN`, the start and end points end up effectively repeated three times. This is a standard clamped boundary trick for a cubic B-spline (degree 3): repeating endpoints ensures the spline begins/ends at the endpoints and the local 4-point windows used below exist for the first and last spans.
- The algorithm then iterates a sliding 4-point window:
  - for i = 0 .. extended.length - 4:
    - take local control points p0 = ext[i], p1 = ext[i+1], p2 = ext[i+2], p3 = ext[i+3]
    - convert that 4-point B-spline span to an equivalent cubic Bézier segment
    - sample that Bézier and append samples to the result

**The conversion formulas (B-spline → Bézier)**
For each 4-point window (p0,p1,p2,p3) the code computes Bézier control points:

- Start (Bézier p0):
  $$
  s=\frac{p_0 + 4 p_1 + p_2}{6}
  $$
- First control handle:
  $$
  c_1=\frac{4 p_1 + 2 p_2}{6}
  $$
- Second control handle:
  $$
  c_2=\frac{2 p_1 + 4 p_2}{6}
  $$
- End (Bézier p3):
  $$
  e=\frac{p_1 + 4 p_2 + p_3}{6}
  $$

These weights come from the basis-change between a uniform cubic B-spline span and the cubic Bernstein (Bézier) basis. They guarantee the Bézier segment exactly equals the spline on that parametric span.

**Why overlapping windows are okay (and necessary)**

- Consecutive spans share control points: window i uses (p0,p1,p2,p3), window i+1 uses (p1,p2,p3,p4).
- Using the formulas above, the end of segment i equals the start of segment i+1:
  $$
  e_i=\frac{p_1+4p_2+p_3}{6}=s_{i+1}
  $$
  so segments meet exactly (no gap).
- Derivative continuity (C1) at the join also holds. Bézier derivative facts:
  - For a cubic Bézier [s,c1,c2,e], derivative at t=1 is 3(e−c2).
  - For the next segment, derivative at t=0 is 3(c1*{next} − s*{next}).
    Algebra using the formulas shows:
    $$
    e_i - c_{2,i} = \frac{-p_1 + p_3}{6} = c_{1,i+1} - s_{i+1},
    $$
    so the two derivatives match. (This is a direct consequence of starting from a cubic B-spline, which is C2 continuous on interior spans; the conversion preserves at least C1 and, for uniform cubic B-splines, yields the full expected continuity.)

In short: the sliding windows are how a B-spline is broken into local polynomial pieces. Overlap is required so the pieces glue together smoothly.

**What `sampleCubicBezier` does, practically**

- It evaluates the cubic Bézier polynomial
  $$
  B(t)=(1-t)^3 p_0 + 3(1-t)^2 t\, p_1 + 3(1-t) t^2\, p_2 + t^3 p_3
  $$
  at `t = 0, 1/count, 2/count, ..., 1` where `count = Math.max(2, subdivisions)`.
- That returns `count+1` points per Bézier segment (inclusive endpoints).
- Because endpoints are shared between adjacent segments, `buildBSplinePolyline` skips the first sample of a segment when appending (the code does `if (result.length > 0 && j === 0) continue;`) — that removes duplicates at joins.

**Why the endpoint duplication + skip strategy matters**

- `extended` duplication ensures the very first and very last spans are well-defined.
- Sliding windows produce Bézier segments that share endpoints exactly.
- Skipping the first sample prevents repeating the same point twice in the final polyline.

**Where the sampled points go to get drawn**

- `buildBSplinePolyline(controlPoints, subdivisions)` → returns an array `smoothPoints` (many closely spaced points).
- `Branch.regenerate` sets `this.smoothPoints`, then:
  - `createPathData(pointsForPath)` converts `smoothPoints` into `pathData` (segments, cumulative lengths, tangents).
- Rendering:
  - `renderBranch` calls `drawBrushAlongPath(pathData, ...)` which queries `getPathPointAtLength` and `getPathTangentAtLength` to position/rotate image strips along the true arc length.
  - `drawPathOutline(pathData)` (debug) draws the polyline.

**Concrete tiny example (how windows slide)**

- controlPoints: [P0, P1, P2, P3, P4]
- extended: [P0, P0, P0, P1, P2, P3, P4, P4, P4]
- windows and resulting Bézier spans:
  - window0: (P0,P0,P0,P1) → Bézier S0
  - window1: (P0,P0,P1,P2) → Bézier S1
  - window2: (P0,P1,P2,P3) → Bézier S2
  - window3: (P1,P2,P3,P4) → Bézier S3
  - window4: (P2,P3,P4,P4) → Bézier S4
- S0 end == S1 start, S1 end == S2 start, etc. After sampling each S\*, the code concatenates samples (skipping duplicate start points), producing a single smooth polyline.

If you'd like:

- I can show a worked numeric example (specific point coordinates) so you can see the computed Bézier control points and the sampled coordinates.
- Or I can add an optional function to resample the final `pathData` by arc length (even spacing), if you need evenly spaced points for effects. Which would you prefer?

<h1> CreatePathData() FUNCTION </h1>
**Create Path Data**

- **Purpose:** `createPathData(points)` turns a list of vertex positions into an arc‑length parametrized path so you can ask “where am I after X pixels along the curve?” and get the exact point and direction fast.

- **Input:** `points` — array of { x, y } vertices (the polyline you want to measure).

- **Output:** an object with:
  - **points:** original array,
  - **segments:** array of { start, dx, dy, length, tangent } for each non‑degenerate segment,
  - **cumulative:** running lengths [0, L1, L2, ...] where cumulative[i] is length up to the start of segment i,
  - **totalLength:** full path length.

- **How it works (step‑by‑step):**
  - For each consecutive pair (start → end):
    - compute vector dx = end.x−start.x, dy = end.y−start.y.
    - compute Euclidean length = sqrt(dx²+dy²).
    - skip the pair if length is essentially zero (avoids divide‑by‑zero).
    - store the segment: start point, dx, dy, length, and normalized tangent = (dx/length, dy/length).
    - add length to running total and append to `cumulative`.
  - Return the assembled object.

- **Concrete mini example:**
  - Points: P0=(0,0), P1=(3,4), P2=(6,4).
  - Segment0 (P0→P1): dx=3, dy=4, length=5, tangent=(0.6,0.8).
  - Segment1 (P1→P2): dx=3, dy=0, length=3, tangent=(1,0).
  - cumulative = [0, 5, 8], totalLength = 8.
  - Query: distance d = 6 → segment index = 1 (because 5 ≤ 6 ≤ 8), local t = (6 − 5)/3 = 1/3 → point = P1 + t\*(dx,dy) = (3 + 1, 4) = (4,4). Tangent = (1,0).

- **Why this is useful in the repo:** callers like `getPathPointAtLength`, `getPathTangentAtLength`, `drawBrushAlongPath` and `drawPathOutline` use `pathData` to place and orient textures or draw strokes by true distance along the smoothed curve, not by raw vertex index.

- **Robustness note:** zero‑length segments are skipped to avoid dividing by zero when computing tangents.
