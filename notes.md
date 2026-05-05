The `sampleCubicBezier()` and `buildBSplinePolyline()` functions are closely related components in the script's B-spline smoothing pipeline (Section 6). They serve different but complementary roles in converting a series of control points into a smooth, dense polyline. Below, I'll explain their differences, how each works internally, and how they collaborate.

### Key Differences

- **Scope and Purpose**:
  - `sampleCubicBezier()` focuses on a **single cubic Bézier curve segment**. It takes 4 control points (defining the curve's shape) and generates a list of evenly spaced points along that curve. It's a low-level utility for "sampling" (discretizing) a smooth mathematical curve into a polyline.
  - `buildBSplinePolyline()` handles a **sequence of control points** and builds a smooth overall path using B-spline interpolation. It treats the input as an "open-uniform cubic B-spline" (a type of spline curve that passes near the control points but is smoother). The output is a single, dense polyline that approximates the entire spline curve.

- **Input/Output**:
  - `sampleCubicBezier()`: Input is 4 points (`p0`, `p1`, `p2`, `p3`) and a `subdivisions` count. Output is an array of points sampled along the Bézier curve.
  - `buildBSplinePolyline()`: Input is an array of control points (at least 2) and an optional `subdivisionsPerSpan`. Output is a dense polyline array (or empty array if invalid input).

- **Mathematical Basis**:
  - `sampleCubicBezier()` directly evaluates the cubic Bézier formula (a parametric curve defined by 4 points).
  - `buildBSplinePolyline()` uses B-spline math to create multiple connected Bézier segments, then samples them.

- **Role in the Script**:
  - `sampleCubicBezier()` is a helper function called by `buildBSplinePolyline()`.
  - `buildBSplinePolyline()` is the main entry point for smoothing, called from `regeneratePath()` to turn raw `controlPoints` into `smoothPoints`.

### How `sampleCubicBezier()` Works

This function generates points along a single cubic Bézier curve by evaluating its parametric equation. A cubic Bézier is defined by 4 points:

- `p0`: Start point.
- `p1`: First control point (influences the curve's direction from the start).
- `p2`: Second control point (influences the curve's direction toward the end).
- `p3`: End point.

The curve is parameterized by `t` (from 0 to 1), and the position at any `t` is calculated using the formula:

```
x(t) = (1-t)^3 * p0.x + 3*(1-t)^2*t * p1.x + 3*(1-t)*t^2 * p2.x + t^3 * p3.x
y(t) = (1-t)^3 * p0.y + 3*(1-t)^2*t * p1.y + 3*(1-t)*t^2 * p2.y + t^3 * p3.y
```

Steps:

1. Takes `p0`, `p1`, `p2`, `p3`, and `subdivisions` (minimum 2, default handled by caller).
2. Loops `t` from 0 to 1 in `subdivisions + 1` steps (e.g., if `subdivisions = 10`, it samples at t=0, 0.1, 0.2, ..., 1.0).
3. For each `t`, computes the x/y coordinates using the formula above and pushes them to a `samples` array.
4. Returns the array of sampled points (a polyline approximating the curve).

This is efficient for rendering or further processing, as it turns a continuous curve into discrete points.

### How `buildBSplinePolyline()` Works

This function builds a smooth polyline from a series of control points using B-spline interpolation. B-splines are piecewise curves that are smoother and more flexible than simple polylines, as they blend control points without necessarily passing through them.

Steps:

1. **Validation**: Checks if `controlPoints` is an array with at least 2 elements. If not, returns an empty array.
2. **Extension for Open Spline**: Duplicates the first and last control points to create an "extended" array. This ensures the spline starts and ends near the original points (open-uniform B-spline behavior).
   - Example: If input is `[A, B, C]`, extended becomes `[A, A, B, C, C, C]`.
3. **Span Processing**: Loops over overlapping groups of 4 points from the extended array (each group defines a "span" of the spline).
   - For each span (e.g., points 0-3, 1-4, etc.), converts the B-spline segment to an equivalent cubic Bézier curve. This involves calculating Bézier control points (`start`, `cp1`, `cp2`, `end`) from the B-spline knots using standard formulas (e.g., `start = (p0 + 4*p1 + p2)/6`).
4. **Sampling via Helper**: Calls `sampleCubicBezier()` on the computed Bézier control points, with `subdivisionsPerSpan` (default 10). This generates points for that segment.
5. **Polyline Assembly**: Collects the sampled points into a `result` array. To avoid duplicates at segment junctions, it skips the first point of each sampled segment (except for the very first segment).
6. Returns the full `result` array—a dense polyline that smoothly connects the original control points.

The result is a high-resolution approximation of the B-spline curve, suitable for arc-length calculations and texture warping.

### How They Work Together

- **Collaboration**: `buildBSplinePolyline()` is the orchestrator. It handles the high-level B-spline logic (extending points, converting spans to Bézier) and delegates the actual point generation to `sampleCubicBezier()`. Without `sampleCubicBezier()`, `buildBSplinePolyline()` couldn't produce the dense polyline—it would only compute Bézier control points.
- **Data Flow in the Script**:
  1. `regeneratePath()` calls `generateBranchControlPoints()` to create noisy `controlPoints`.
  2. It then calls `buildBSplinePolyline(controlPoints, CONFIG.path.smoothingSubdivisionsPerSpan)` to smooth them into `smoothPoints`.
  3. Inside `buildBSplinePolyline()`, for each spline span, it computes Bézier control points and calls `sampleCubicBezier()` to get sampled points.
  4. The final `smoothPoints` (output of `buildBSplinePolyline()`) is used in `createPathData()` for arc-length parameterization.
- **Why This Design?**: Separating concerns makes the code modular. `sampleCubicBezier()` is reusable for any Bézier curve, while `buildBSplinePolyline()` focuses on spline assembly. This allows easy tweaking (e.g., changing `subdivisionsPerSpan` for more/less detail) without rewriting Bézier math.
- **Performance Note**: With default settings (20 control points, 10 subdivisions per span), this generates ~200+ smooth points, enabling precise path queries without excessive computation.

If you'd like examples of inputs/outputs or how to modify them for debugging, let me know!
