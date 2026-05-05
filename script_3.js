// Grab the canvas element from the HTML.
const canvas = document.getElementById("myCanvas");
// Ask the canvas for a 2D drawing context so we can paint pixels.
const ctx = canvas.getContext("2d");

// Path to the sprite sheet image that contains flower petal graphics.
const SPRITE_PATH = "/test_sprite4.png";
// Width of one sprite cell in the source sheet.
const SPRITE_W = 44;
// Height of one sprite cell in the source sheet.
const SPRITE_H = 45.819;
// Scale used to map your sprite-sheet grid units to actual image pixels.
const SPRITE_SCALE = 8.3333333;

// Final size (on canvas) of each petal draw call.
const DRAW_SIZE = 80;
// Number of flowers to generate on screen.
const FLOWER_COUNT = 40;
// Number of sprite columns available in the sheet.
const SPRITE_COLS = 20;
// Number of sprite rows available in the sheet.
const SPRITE_ROWS = 6;

// Radius around the mouse where flowers can react.
const INTERACTION_RADIUS = DRAW_SIZE * 2.1;
// How quickly influence rises when mouse enters range (per second).
const INFLUENCE_RISE_SPEED = 5.5;
// How quickly influence falls when mouse leaves range (per second).
const INFLUENCE_FALL_SPEED = 0.5;
// Threshold used to stop tiny floating-point leftovers.
const INFLUENCE_EPSILON = 0.0008;

// Solid background color for every frame.
const BG_COLOR = "rgb(188, 231, 242)";

// Central runtime state so flowers are generated once and reused every frame.
const state = {
  // List of generated flowers and their petals.
  flowers: [],
  // List of flower indices currently reacting (or fading back) this frame.
  activeFlowerIndices: [],
  // Mouse x coordinate in viewport/canvas space.
  mouseX: -10000,
  // Mouse y coordinate in viewport/canvas space.
  mouseY: -10000,
  // Timestamp when animation started, used for smooth motion.
  startTime: 0,
  // Timestamp of previous frame (for delta-time calculations).
  lastFrameTime: 0,
};

// Create the image object that will load the sprite sheet.
const spriteImage = new Image();

// Convert degrees to radians because canvas rotation uses radians.
function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

// Return a random integer in [0, maxExclusive).
function randInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

// Return a random floating value in [min, max).
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// Move current value toward target value by at most maxStep.
function moveToward(current, target, maxStep) {
  if (current < target) {
    return Math.min(current + maxStep, target);
  }
  return Math.max(current - maxStep, target);
}

// Match canvas internal resolution to current window size.
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Paint the background before drawing flowers.
function drawBackground() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Convert sprite grid coordinates (col,row) into drawImage source rectangle values.
function sourceSpriteRect(col, row) {
  return {
    sx: col * SPRITE_W * SPRITE_SCALE,
    sy: row * SPRITE_H * SPRITE_SCALE,
    sw: SPRITE_W * SPRITE_SCALE,
    sh: SPRITE_H * SPRITE_SCALE,
  };
}

// Build one petal definition with fixed visual choices and hover animation settings.
function makePetal(i, petalCount) {
  // Pick a random sprite tile for visual variation.
  const col = randInt(SPRITE_COLS);
  // Pick a random sprite row for visual variation.
  const row = 1;

  // Return all values needed to redraw this same petal later.
  return {
    col,
    row,
    // Base angle creates the flower shape around the center.
    baseAngle: degToRad(-40 + 75 * Math.sin(i / (petalCount / 4))),
    // Max extra rotation while reacting.
    hoverAmplitude: degToRad(randRange(2, 6)),
    // Motion speed for this petal.
    hoverSpeed: randRange(2.2, 4.2),
  };
}

// Build one flower at canvas position (x, y).
function makeFlower(x, y) {
  // Use 5-6 petals to match your previous style.
  const petalCount = randInt(2) + 5;
  // Prepare an array to hold this flower's petals.
  const petals = [];

  // Create each petal and store it.
  for (let i = 0; i < petalCount; i += 1) {
    petals.push(makePetal(i, petalCount));
  }

  // Return a flower object with geometry and runtime animation values.
  return {
    x,
    y,
    petals,
    interactionRadius: INTERACTION_RADIUS,
    // 0 means fully still, 1 means fully animated.
    hoverInfluence: 0,
    // Desired influence for this frame based on mouse distance.
    targetInfluence: 0,
    // Time used for sin-wave petal motion.
    motionTime: 0,
    // Tracks enter/leave transitions.
    wasInsideRange: false,
  };
}

// Generate all flowers once (or again on resize).
function populateFlowers() {
  // Reset list so we can repopulate cleanly.
  state.flowers = [];

  // Keep flowers inside the viewport with a margin.
  const margin = DRAW_SIZE * 0.65;
  // Smallest allowed x.
  const minX = margin;
  // Smallest allowed y.
  const minY = margin;
  // Largest allowed x.
  const maxX = Math.max(minX + 1, canvas.width - margin);
  // Largest allowed y.
  const maxY = Math.max(minY + 1, canvas.height - margin);

  // Create all flowers at random positions.
  for (let i = 0; i < FLOWER_COUNT; i += 1) {
    const x = randRange(minX, maxX);
    const y = randRange(minY, maxY);
    state.flowers.push(makeFlower(x, y));
  }

  // Clear active list after regeneration.
  state.activeFlowerIndices = [];
}

/**
 * Update per-flower interaction state every frame.
 *
 * Why this function exists:
 * - It separates "input processing" (mouse distance checks) from drawing.
 * - It computes a smooth animation control value (`hoverInfluence`) for each flower.
 * - It allows many flowers to react at the same time instead of a single hovered index.
 * - It preserves continuity: flowers ease in and ease out instead of snapping.
 *
 * Data flow in this function:
 * 1) Measure mouse distance to each flower center.
 * 2) Convert distance to a desired strength (`targetInfluence`) in [0, 1].
 * 3) Ease current strength (`hoverInfluence`) toward target using delta time.
 * 4) Advance per-flower motion clock while that flower is active or fading.
 * 5) Build `activeFlowerIndices` so the runtime has a list of currently reacting flowers.
 *
 * @param {number} dt - Delta time in seconds since previous frame.
 * Purpose of `dt`: keep motion/easing frame-rate independent so 60 FPS and 144 FPS
 * behave similarly in speed and feel.
 */
function updateFlowerInfluences(dt) {
  // Reset the list each frame; it will be rebuilt from current measurements.
  state.activeFlowerIndices = [];

  for (let i = 0; i < state.flowers.length; i += 1) {
    // `i`: numeric index into the flower array; used to track and store active flowers.
    const flower = state.flowers[i];
    // `flower`: object containing static geometry (x/y/petals) + runtime animation fields.

    // Mouse-to-flower vector components:
    // - `dx`: horizontal offset from flower center to cursor.
    // - `dy`: vertical offset from flower center to cursor.
    // These are needed to compute radial distance for circular interaction.
    const dx = state.mouseX - flower.x;
    const dy = state.mouseY - flower.y;

    // Euclidean distance from mouse to this flower center.
    // This is the key spatial input that drives interaction strength.
    const distance = Math.sqrt(dx * dx + dy * dy);

    // True when cursor is inside this flower's interaction circle.
    // Needed for edge detection (enter/leave) and target influence selection.
    const isInsideRange = distance <= flower.interactionRadius;

    // Convert distance into desired animation strength:
    // - At center (`distance = 0`) target = 1 (full motion).
    // - At interaction edge (`distance = radius`) target = 0.
    // - Outside radius target = 0.
    //
    // Why `targetInfluence` exists:
    // We separate desired strength from current strength so we can ease smoothly
    // instead of snapping directly.
    if (isInsideRange) {
      flower.targetInfluence = 1 - distance / flower.interactionRadius;
    } else {
      flower.targetInfluence = 0;
    }

    // Entry edge detection:
    // - `isInsideRange` is current frame.
    // - `flower.wasInsideRange` is previous frame.
    //
    // If we just entered and this flower was basically at rest, reset `motionTime`
    // so `sin(motionTime * speed)` starts near sin(0) = 0. That avoids a visible
    // jump and makes petals begin from base angle.
    if (
      isInsideRange &&
      !flower.wasInsideRange &&
      flower.hoverInfluence <= INFLUENCE_EPSILON
    ) {
      flower.motionTime = 0;
    }

    // Use different speeds for entering vs leaving:
    // - Rise speed: faster response when cursor approaches.
    // - Fall speed: slower decay when cursor leaves for softer return.
    //
    // `influenceSpeed` is chosen per flower per frame because target may differ.
    const influenceSpeed =
      flower.targetInfluence > flower.hoverInfluence
        ? INFLUENCE_RISE_SPEED
        : INFLUENCE_FALL_SPEED;

    // Smoothly move the current strength toward desired strength by a bounded step.
    // Step size = speed * dt, so animation timing is independent of frame rate.
    //
    // Why `hoverInfluence` exists:
    // It is the stable, eased value used by drawing to scale motion amplitude.
    // This single value gives both smooth start and smooth stop behavior.
    flower.hoverInfluence = moveToward(
      flower.hoverInfluence,
      flower.targetInfluence,
      influenceSpeed * dt
    );

    // Cleanup tiny floating-point leftovers:
    // Without this, values like 0.0000003 can keep a flower "almost active"
    // and cause barely visible micro-motion forever.
    if (
      flower.targetInfluence === 0 &&
      flower.hoverInfluence <= INFLUENCE_EPSILON
    ) {
      flower.hoverInfluence = 0;
    }

    // Advance per-flower oscillation time while flower is active or fading.
    // Why keep advancing during fade-out:
    // It preserves natural motion continuity as petals settle back to base angle,
    // instead of freezing wave phase abruptly.
    if (flower.hoverInfluence > 0 || flower.targetInfluence > 0) {
      flower.motionTime += dt;

      // Record this index in active list for runtime inspection/debugging and
      // for any later optimizations that might draw/update only active flowers.
      state.activeFlowerIndices.push(i);
    }

    // Persist current in/out state so next frame can detect enter/leave edges.
    flower.wasInsideRange = isInsideRange;
  }
}

/**
 * Draw one flower from stored state.
 *
 * Important idea:
 * - Geometry is stable (`baseAngle`, sprite selection, position).
 * - Motion is an additive offset computed at draw time from runtime state.
 *
 * @param {object} flower - A generated flower object with petals and runtime fields.
 */
function drawFlower(flower) {
  // Draw every petal for this flower.
  for (const petal of flower.petals) {
    // Source rectangle in sprite sheet for this specific petal variation.
    // These values never change for this petal after generation.
    const { sx, sy, sw, sh } = sourceSpriteRect(petal.col, petal.row);

    // Base orientation of this petal in the flower layout.
    // Think of this as the "rest pose" angle.
    let angle = petal.baseAngle;

    // Runtime animated offset:
    // - `wave` in [-1, 1] from sine curve gives periodic back-and-forth rotation.
    // - `petal.hoverAmplitude` controls maximum angular excursion per petal.
    // - `flower.hoverInfluence` scales that excursion based on mouse proximity and
    //   easing state (0 = no motion, 1 = full motion).
    //
    // Final rotation = rest pose + dynamic offset.
    if (flower.hoverInfluence > 0) {
      const wave = Math.sin(flower.motionTime * petal.hoverSpeed);
      angle += wave * petal.hoverAmplitude * flower.hoverInfluence;
    }

    // Save context so transform changes affect only this petal.
    ctx.save();
    // Move origin to flower center.
    ctx.translate(flower.x, flower.y);
    // Rotate canvas around the flower center.
    ctx.rotate(angle);
    // Draw petal relative to the rotated local coordinate system.
    ctx.drawImage(
      spriteImage,
      sx,
      sy,
      sw,
      sh,
      -DRAW_SIZE / 2,
      -DRAW_SIZE + ((2.2 / SPRITE_H) * DRAW_SIZE),
      DRAW_SIZE,
      DRAW_SIZE
    );
    // Restore context so next petal starts from clean state.
    ctx.restore();
  }

  // Draw a simple yellow center circle for the flower.
  ctx.beginPath();
  ctx.arc(flower.x, flower.y, DRAW_SIZE * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();
}

// Render loop called every animation frame.
function render(nowMs) {
  // Record first frame timestamps.
  if (!state.startTime) {
    state.startTime = nowMs;
  }
  if (!state.lastFrameTime) {
    state.lastFrameTime = nowMs;
  }

  // Delta time in seconds for frame-rate independent easing.
  const dt = Math.min(0.05, (nowMs - state.lastFrameTime) / 1000);
  state.lastFrameTime = nowMs;

  // Update interaction influences before drawing.
  updateFlowerInfluences(dt);

  // Clear by repainting background color.
  drawBackground();

  // Draw every flower each frame.
  for (let i = 0; i < state.flowers.length; i += 1) {
    drawFlower(state.flowers[i]);
  }

  // Ask browser for the next frame to keep animation running.
  requestAnimationFrame(render);
}

// Update mouse coordinates.
function handleMouseMove(event) {
  state.mouseX = event.clientX;
  state.mouseY = event.clientY;
}

// Reset mouse far away when pointer leaves the window.
function handleMouseOut() {
  state.mouseX = -10000;
  state.mouseY = -10000;
}

// One-time startup after sprite image finishes loading.
function initScene() {
  // Fit canvas to viewport.
  resizeCanvas();
  // Generate flowers and petals.
  populateFlowers();
  // Start render loop.
  requestAnimationFrame(render);
}

// On resize, resize canvas and regenerate flowers for new bounds.
window.addEventListener("resize", () => {
  resizeCanvas();
  populateFlowers();
});

// Listen for mouse movement globally.
window.addEventListener("mousemove", handleMouseMove);
// Listen for mouse leaving the page/window area.
window.addEventListener("mouseout", handleMouseOut);

// Start scene only after image asset is loaded.
spriteImage.onload = initScene;
// Log a clear error if the sprite image cannot be loaded.
spriteImage.onerror = () => {
  console.error("Failed to load sprite image:", spriteImage.src);
};
// Begin loading the sprite image.
spriteImage.src = SPRITE_PATH;
