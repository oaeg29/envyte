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

// Solid background color for every frame.
const BG_COLOR = "rgb(188, 231, 242)";

// Central runtime state so flowers are generated once and reused every frame.
const state = {
  // List of generated flowers and their petals.
  flowers: [],
  // Index of the flower currently under the mouse (-1 means none).
  hoverFlowerIndex: -1,
  // Mouse x coordinate in viewport/canvas space.
  mouseX: -10000,
  // Mouse y coordinate in viewport/canvas space.
  mouseY: -10000,
  // Timestamp when animation started, used for smooth motion.
  startTime: 0,
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
  const row = randInt(SPRITE_ROWS);

  // Return all values needed to redraw this same petal later.
  return {
    col,
    row,
    // Base angle creates the flower shape around the center.
    baseAngle: degToRad(-40 + 75 * Math.sin(i / (petalCount / 4))),
    // Max extra rotation while hovered.
    hoverAmplitude: degToRad(randRange(2, 6)),
    // Hover animation speed.
    hoverSpeed: randRange(2.2, 4.2),
    // Random phase so petals do not move in sync.
    phase: randRange(0, Math.PI * 2),
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

  // Return a flower object with geometry and interaction radius.
  return {
    x,
    y,
    petalCount,
    petals,
    hoverRadius: DRAW_SIZE * 0.8,
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
}

// Find which flower (if any) is currently under the mouse.
function updateHoveredFlower() {
  // Default to "none hovered".
  state.hoverFlowerIndex = -1;

  // Check from last to first so later-drawn flowers get hover priority.
  for (let i = state.flowers.length - 1; i >= 0; i -= 1) {
    const flower = state.flowers[i];
    // Horizontal distance from mouse to flower center.
    const dx = state.mouseX - flower.x;
    // Vertical distance from mouse to flower center.
    const dy = state.mouseY - flower.y;
    // Circle hit-test: inside radius means hovered.
    if (dx * dx + dy * dy <= flower.hoverRadius * flower.hoverRadius) {
      state.hoverFlowerIndex = i;
      return;
    }
  }
}

// Draw one full flower; if hovered, petals sway slightly.
function drawFlower(flower, isHovered, t) {
  // Draw every petal for this flower.
  for (const petal of flower.petals) {
    // Get the source rectangle in the sprite sheet for this petal.
    const { sx, sy, sw, sh } = sourceSpriteRect(petal.col, petal.row);
    // Start with the base (static) angle.
    let angle = petal.baseAngle;

    // If hovered, add a small animated offset angle.
    if (isHovered) {
      angle += Math.sin(t * petal.hoverSpeed + petal.phase) * petal.hoverAmplitude;
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
  // Record first frame time so animation uses relative time.
  if (!state.startTime) {
    state.startTime = nowMs;
  }

  // Convert elapsed time from milliseconds to seconds.
  const t = (nowMs - state.startTime) / 1000;
  // Clear by repainting background color.
  drawBackground();

  // Draw every flower; only the hovered one gets animated sway.
  for (let i = 0; i < state.flowers.length; i += 1) {
    drawFlower(state.flowers[i], i === state.hoverFlowerIndex, t);
  }

  // Ask browser for the next frame to keep animation running.
  requestAnimationFrame(render);
}

// Update mouse coordinates and hovered flower when mouse moves.
function handleMouseMove(event) {
  state.mouseX = event.clientX;
  state.mouseY = event.clientY;
  updateHoveredFlower();
}

// Reset hover when mouse leaves the window.
function handleMouseOut() {
  state.mouseX = -10000;
  state.mouseY = -10000;
  state.hoverFlowerIndex = -1;
}

// One-time startup after sprite image finishes loading.
function initScene() {
  // Fit canvas to viewport.
  resizeCanvas();
  // Generate flowers and petals.
  populateFlowers();
  // Compute initial hover state.
  updateHoveredFlower();
  // Start render loop.
  requestAnimationFrame(render);
}

// On resize, resize canvas and regenerate flowers for new bounds.
window.addEventListener("resize", () => {
  resizeCanvas();
  populateFlowers();
  updateHoveredFlower();
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
