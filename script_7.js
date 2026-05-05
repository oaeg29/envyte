const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
// import noise from 'noisejs';
const noise = new Noise(Math.random());

function drawBackground() {
  ctx.fillStyle = 'rgb(30, 40, 42)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
const dpr = window.devicePixelRatio || 1;
function resizeCanvas() {
  canvas.width = window.innerWidth*dpr;
  canvas.height = window.innerHeight*dpr;
  drawBackground();
  
}

let points = [];
var pos_x = 400;
var pos_y = 700;
const step_size = 1;
const scale = 0.7;
const fixed_time_step = 1 / 60;
const checkpoint_count = 30;
const checkpoint_spacing_steps = 100;
const checkpoint_hit_radius = 10;
let timeCursor = Date.now() / 1000;
let matchedCheckpointIndices = new Set();
ctx.scale(dpr, dpr);
resizeCanvas();

const path2 = new Path2D();
// console.log(dpr, dpr);
// ctx.lineWidth = 5;

function getNoiseDelta(time, direction) {
    const x1 = time / step_size;
    const y1 = time / step_size;
    const x2 = x1 + 4895943;
    const y2 = y1 + 4838485943;
    let dir = direction || -1;
    

    return {
        dx: Math.abs(noise.perlin2(x1, y1)) * scale * dir,
        dy: Math.abs(noise.perlin2(x2, y2)) * scale * -1,
    };
}

function drawCircle_fromPos(x, y){
const path3 = new Path2D();
path3.arc(x, y, 2, 0, 2 * Math.PI);
ctx.strokeStyle = 'black';
ctx.stroke(path3);
ctx.fillStyle = 'rgba(124, 248, 186, 0.5)';
ctx.fill(path3);
}

// function generate_points(){
//     let time2 = timeCursor;
//     let sim_x = pos_x;
//     let sim_y = pos_y;
//     const generated = [];

//     for (let i = 0; i < checkpoint_count; i++) {
//         for (let j = 0; j < checkpoint_spacing_steps; j++) {
//             time2 += fixed_time_step;
//             const delta = getNoiseDelta(time2, 1);
//             sim_x += delta.dx;
//             sim_y += delta.dy;
//         }
//         generated.push({x: sim_x, y: sim_y});
//     }

//     return generated;
// }

function generate_branch(x, y, dir){
    let time2 = timeCursor;
    let sim_x = x;
    let sim_y = y;
    if (dir === undefined) {
        dir = -1;
    }
    dir = dir;
    const generated = [];
    generated.push({x: sim_x, y: sim_y});

    for (let i = 0; i < checkpoint_count; i++) {
        for (let j = 0; j < checkpoint_spacing_steps; j++) {
            time2 += fixed_time_step;
            const delta = getNoiseDelta(time2, dir);
            sim_x += delta.dx;
            sim_y += delta.dy;
        }
        generated.push({x: sim_x, y: sim_y});
    }

    return generated;
}

function check_match(points, current_pos){
    for (let i = 0; i < points.length; i++) {
        if (matchedCheckpointIndices.has(i)) {
            continue;
        }

        const dx = points[i].x - current_pos.x;
        const dy = points[i].y - current_pos.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared <= checkpoint_hit_radius * checkpoint_hit_radius) {
            matchedCheckpointIndices.add(i);
            console.log("Match found at index: " + i);
            return true;
        }
    }
    return false;
}


function draw_Checkpoints(points){
    // points = generate_points();
    // console.log(points);
    for (let i = 0; i < points.length; i++) {
        drawCircle_fromPos(points[i].x, points[i].y);
        
}
}

/*
This is exactly what I changed in drawCurve, in plain language:

Before:
- The curve was built with "midpoint" control handles.
- That approach can still feel uneven because each segment's handles are local guesses.
- It often creates bends that look slightly sharp or inconsistent when point spacing changes.

Now:
- I switched to an open-uniform cubic B-spline approach.
- In this model, your `points` array is treated as CONTROL POINTS (guide points), not "must pass through" points.
- That matches your request: smooth curve, not required to hit each point directly.

Important idea:
- Canvas can draw cubic Bezier curves, but not B-splines directly.
- So we mathematically convert each B-spline span into one Bezier segment.
- Result: we still call `ctx.bezierCurveTo(...)`, but the handles come from spline math, not ad-hoc midpoint guesses.

Why this is smoother:
- Every segment looks at 4 nearby control points (p0, p1, p2, p3), not just 2.
- Neighbor influence is blended with stable weights (you will see /6 formulas below).
- This gives continuous direction and curvature between segments (very smooth joining).
*/
function drawCurve(points) {
    // Safety check:
    // With fewer than 2 points, there is no meaningful curve to draw.
    if (points.length < 2) {
        return;
    }

    /*
    End-point handling ("clamping"):
    - A cubic B-spline segment needs 4 points at a time.
    - At the very start and end, we do not naturally have enough neighbors.
    - To fix that, we duplicate the first point twice at the front,
      and duplicate the last point twice at the end.
    - This keeps the start/end behavior stable and avoids weird edge bending.
    */
    const extended = [points[0], points[0], ...points, points[points.length - 1], points[points.length - 1]];

    // Start a new drawing path before adding Bezier segments to it.
    ctx.beginPath();

    // Walk through the extended array in groups of 4 points:
    // (p0, p1, p2, p3) defines one spline span.
    for (let i = 0; i <= extended.length - 4; i++) {
        const p0 = extended[i];
        const p1 = extended[i + 1];
        const p2 = extended[i + 2];
        const p3 = extended[i + 3];

        /*
        B-spline -> Bezier conversion:
        - For each span, we compute:
          1) segment start point
          2) Bezier control point 1
          3) Bezier control point 2
          4) segment end point
        - The 1-4-1 and 4-2 / 2-4 style weights are standard cubic B-spline blending weights.
        - Dividing by 6 normalizes those weight§§ed sums.
        */
       
        const startX = (p0.x + 4 * p1.x + p2.x) / 6;
        const startY = (p0.y + 4 * p1.y + p2.y) / 6;
        const cp1X = (4 * p1.x + 2 * p2.x) / 6;
        const cp1Y = (4 * p1.y + 2 * p2.y) / 6;
        const cp2X = (2 * p1.x + 4 * p2.x) / 6;
        const cp2Y = (2 * p1.y + 4 * p2.y) / 6;
        const endX = (p1.x + 4 * p2.x + p3.x) / 6;
        const endY = (p1.y + 4 * p2.y + p3.y) / 6;

        // For the first segment only, move the pen to the first computed start.
        // After that, each new Bezier continues from the previous segment's end.
        if (i === 0) {
            ctx.moveTo(startX, startY);
        }

        // Draw one cubic Bezier segment for this spline span.
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    }

    // Visual styling for the final curve stroke.
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function generate_manual_points(){
    const generated = [];
    let x0 = 200;
    let y0 = 500;
    let d = 25;
    generated.push({x: x0+8*d, y: y0+2*d});
    generated.push({x: x0+6*d, y: y0+4*d});
    generated.push({x: x0+5*d, y: y0+4*d});
    generated.push({x: x0+4*d, y: y0+4*d});
    generated.push({x: x0+3*d, y: y0+5*d});
    generated.push({x: x0+1*d, y: y0+4*d});
    generated.push({x: x0-3*d, y: y0-4*d});
    generated.push({x: x0-4*d, y: y0-5*d});
    generated.push({x: x0-6*d, y: y0-5*d});
    generated.push({x: x0-6.5*d, y: y0-6*d});

    return generated;

    // for (let i = 0; i < 19; i++){

        



    // }
}

// generate_points();
points = generate_branch(pos_x, pos_y, -1);
draw_Checkpoints(points);
drawCurve(points);
// console.log(points);
animate();


function animate() {
    // update_position();
    
    // drawBackground();

    // resizeCanvas();
    // drawCircle();
    const current_pos = {x: pos_x, y: pos_y};
    // console.log(current_pos);
    check_match(points, current_pos);
    // drawPoints();
    // console.log(timeStart);
    requestAnimationFrame(animate);
}


// drawBackground();
//

// drawCircle();

const img = new Image();

img.onload = function() {



};

// bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);


img.onerror = function() {
  console.error('failed to load', img.src);
};

img.src = '/stem_2.png'

// const myPlant = new Plant(100, 200);
// myPlant.populate();
